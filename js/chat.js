/* ==========================================================================
   Portfolio chatbot widget (talks to /api/chat -> Groq)
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function buildWidget() {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-toggle';
    btn.setAttribute('aria-label', 'Open chat');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    var panel = doc.createElement('div');
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Carlos portfolio assistant');
    panel.innerHTML =
      '<div class="chat-head">' +
      '  <div class="chat-head-title">Ask about Carlos</div>' +
      '  <div class="chat-head-actions">' +
      '    <button type="button" class="chat-voice" id="chatVoice" aria-label="Voice output on" aria-pressed="true" title="Voice output on">' +
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M11 5 6 9H2v6h4l5 4z"/>' +
      '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>' +
      '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' +
      '</svg>' +
      '    </button>' +
      '    <button type="button" class="chat-close" aria-label="Close chat">&times;</button>' +
      '  </div>' +
      '</div>' +
      '<div class="chat-messages" id="chatMessages"></div>' +
      '<form class="chat-form" id="chatForm">' +
      '  <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off" maxlength="2000" required>' +
      '  <button type="button" class="chat-mic" id="chatMic" aria-label="Start voice input" aria-pressed="false">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>' +
      '<path d="M19 10v2a7 7 0 0 1-14 0v-2"/>' +
      '<line x1="12" y1="19" x2="12" y2="23"/>' +
      '<line x1="8" y1="23" x2="16" y2="23"/>' +
      '</svg>' +
      '  </button>' +
      '  <button type="submit" aria-label="Send">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>' +
      '  </button>' +
      '</form>';

    doc.body.appendChild(btn);
    doc.body.appendChild(panel);

    var messagesEl = panel.querySelector('#chatMessages');
    var form = panel.querySelector('#chatForm');
    var input = panel.querySelector('#chatInput');
    var closeBtn = panel.querySelector('.chat-close');
    var micBtn = panel.querySelector('#chatMic');
    var voiceBtn = panel.querySelector('#chatVoice');

    var history = [];
    var busy = false;

    /* Voice input via Web Speech API. Hidden on browsers without support. */
    var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;
    var listening = false;
    var suppressAutoSend = false;
    var hadError = false;

    if (!SpeechRec) {
      micBtn.remove();
      micBtn = null;
    } else {
      recognition = new SpeechRec();
      recognition.lang = 'en-PH';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = function () {
        listening = true;
        micBtn.classList.add('listening');
        micBtn.setAttribute('aria-pressed', 'true');
        micBtn.setAttribute('aria-label', 'Stop voice input');
        input.classList.add('listening');
        input.placeholder = 'Listening... speak now';
      };

      recognition.onresult = function (e) {
        var parts = [];
        for (var i = 0; i < e.results.length; i++) {
          parts.push(e.results[i][0].transcript);
        }
        input.value = parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
      };

      recognition.onerror = function (e) {
        if (e.error !== 'aborted') hadError = true;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          addBubble('assistant', 'Microphone access was blocked. Please allow mic permission in your browser settings.');
        } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
          addBubble('assistant', 'Voice input failed. Please try again or type your message.');
        }
      };

      recognition.onend = function () {
        listening = false;
        micBtn.classList.remove('listening');
        micBtn.setAttribute('aria-pressed', 'false');
        micBtn.setAttribute('aria-label', 'Start voice input');
        input.classList.remove('listening');
        input.placeholder = 'Type a message...';

        var shouldSend = !suppressAutoSend && !hadError && !busy &&
          panel.classList.contains('open') && input.value.trim() !== '';
        suppressAutoSend = false;

        if (shouldSend) {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
          return;
        }

        if (panel.classList.contains('open')) input.focus();
      };

      micBtn.addEventListener('click', function () {
        if (busy) return;
        if (listening) {
          recognition.stop();
          return;
        }
        hadError = false;
        try {
          recognition.start();
        } catch (err) {
          /* Recognition already running. */
        }
      });
    }

    function stopListening() {
      if (recognition && listening) {
        suppressAutoSend = true;
        recognition.stop();
      }
    }

    /* Voice output (TTS) via Web Speech Synthesis. Male English voice by default. */
    var synth = window.speechSynthesis;
    var chosenVoice = null;
    var ttsEnabled = true;

    try {
      if (window.localStorage.getItem('chatVoiceOutput') === '0') ttsEnabled = false;
    } catch (err) { /* storage unavailable */ }

    function pickMaleVoice() {
      if (!synth) return null;
      var voices = synth.getVoices() || [];
      if (!voices.length) return null;

      var i;
      var en = [];
      for (i = 0; i < voices.length; i++) {
        if (/^en(-|_|$)/i.test(voices[i].lang)) en.push(voices[i]);
      }
      var pool = en.length ? en : voices;

      var hints = [
        'google uk english male', 'microsoft david', 'microsoft mark', 'microsoft guy',
        'david', 'mark', 'guy', 'daniel', 'alex', 'fred', 'rishi', 'oliver',
        'george', 'james', 'thomas'
      ];
      for (var h = 0; h < hints.length; h++) {
        for (i = 0; i < pool.length; i++) {
          var n = pool[i].name.toLowerCase();
          if (n.indexOf(hints[h]) !== -1 && n.indexOf('female') === -1) return pool[i];
        }
      }
      for (i = 0; i < pool.length; i++) {
        var m = pool[i].name.toLowerCase();
        if (m.indexOf('male') !== -1 && m.indexOf('female') === -1) return pool[i];
      }
      return null;
    }

    var voicePoll = null;

    function loadVoices() {
      var found = pickMaleVoice();
      if (found) {
        chosenVoice = found;
        if (voicePoll) {
          window.clearInterval(voicePoll);
          voicePoll = null;
        }
        return true;
      }
      return false;
    }

    function updateVoiceBtn() {
      if (!voiceBtn) return;
      voiceBtn.classList.toggle('off', !ttsEnabled);
      voiceBtn.setAttribute('aria-pressed', ttsEnabled ? 'true' : 'false');
      voiceBtn.setAttribute('aria-label', ttsEnabled ? 'Voice output on' : 'Voice output off');
      voiceBtn.title = ttsEnabled ? 'Voice output on' : 'Voice output off';
    }

    var voiceFallbackLogged = false;

    function speak(text) {
      if (!synth || !ttsEnabled || !text) return;
      var clean = String(text)
        .replace(/https?:\/\/\S+/gi, 'link')
        .replace(/\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!clean) return;
      try {
        synth.cancel();
        if (!chosenVoice) chosenVoice = pickMaleVoice();
        var utter = new SpeechSynthesisUtterance(clean);
        if (chosenVoice) {
          utter.voice = chosenVoice;
          utter.lang = chosenVoice.lang;
        } else {
          /* No male voice on this device: deepen the default voice instead. */
          utter.lang = 'en-US';
          utter.pitch = 0.75;
          if (!voiceFallbackLogged) {
            voiceFallbackLogged = true;
            var names = (synth.getVoices() || []).map(function (v) {
              return v.name + ' (' + v.lang + ')';
            });
            console.log('chat voice: no male voice found, using default with pitch 0.75. Voices:', names);
          }
        }
        synth.speak(utter);
      } catch (err) { /* speech unavailable */ }
    }

    if (!synth) {
      voiceBtn.remove();
      voiceBtn = null;
    } else {
      if (!loadVoices()) {
        voicePoll = window.setInterval(loadVoices, 100);
        window.setTimeout(function () {
          if (voicePoll) {
            window.clearInterval(voicePoll);
            voicePoll = null;
          }
        }, 5000);
      }
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', loadVoices);
      } else {
        synth.onvoiceschanged = loadVoices;
      }
      updateVoiceBtn();
      voiceBtn.addEventListener('click', function () {
        ttsEnabled = !ttsEnabled;
        try {
          window.localStorage.setItem('chatVoiceOutput', ttsEnabled ? '1' : '0');
        } catch (err) { /* ignore */ }
        updateVoiceBtn();
        if (!ttsEnabled) synth.cancel();
      });
    }

    /* Known bare domains the assistant may mention without the https:// prefix. */
    var BARE_LINK = '\\b(?:www\\.)?(?:github\\.com|linkedin\\.com|solarisiot\\.com|rentahanan\\.vercel\\.app|myportfolio-psi-three-54\\.vercel\\.app)\\/[^\\s<"\']+';

    function linkify(escaped) {
      var re = new RegExp('(https?:\\/\\/[^\\s<"\']+)|(' + BARE_LINK + ')', 'g');
      return escaped.replace(re, function (match, full, bare) {
        var url = full || ('https://' + bare);
        var trail = '';
        var m = url.match(/[.,;:!?]+$/);
        if (m) {
          trail = m[0];
          url = url.slice(0, -trail.length);
        }
        return '<a class="chat-link" href="' + url + '" target="_blank" rel="noopener">' + url + '</a>' + trail;
      });
    }

    function renderRich(text) {
      return linkify(escapeHtml(text))
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*/g, '')
        .replace(/\n/g, '<br>');
    }

    function addBubble(role, text) {
      var bubble = doc.createElement('div');
      bubble.className = 'chat-bubble chat-' + role;
      bubble.innerHTML = renderRich(text);
      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return bubble;
    }

    var typingTimer = null;
    var typingEl = null;
    var typingText = '';

    function stopTyping() {
      if (typingTimer) {
        window.clearInterval(typingTimer);
        typingTimer = null;
      }
      if (typingEl) {
        typingEl.innerHTML = renderRich(typingText);
        typingEl = null;
        typingText = '';
      }
    }

    function typeBubble(role, text) {
      stopTyping();
      var bubble = doc.createElement('div');
      bubble.className = 'chat-bubble chat-' + role;
      messagesEl.appendChild(bubble);

      typingEl = bubble;
      typingText = text;

      var i = 0;
      var step = Math.max(1, Math.ceil(text.length / 120));
      typingTimer = window.setInterval(function () {
        i += step;
        bubble.textContent = text.slice(0, i);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (i >= text.length) {
          stopTyping();
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }, 24);

      return bubble;
    }

    function openLinks(actions) {
      if (!Array.isArray(actions)) return;
      actions.forEach(function (action) {
        if (!action || action.type !== 'open_link') return;
        var url = String(action.url || '');
        if (!/^https?:\/\//i.test(url)) return;

        var win = null;
        try { win = window.open(url, '_blank'); } catch (err) { win = null; }
        if (win) {
          try { win.opener = null; } catch (err) { /* ignore */ }
          return;
        }

        /* Popup blocked: show a tappable fallback link instead. */
        var bubble = doc.createElement('div');
        bubble.className = 'chat-bubble chat-assistant';
        bubble.innerHTML =
          'Tap to open ' +
          '<a class="chat-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' +
          escapeHtml(action.label || 'the website') + '</a>';
        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }

    function setBusy(state) {
      busy = state;
      if (state) stopListening();
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = state;
      input.disabled = state;
    }

    function open() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      if (messagesEl.childElementCount === 0) {
        var greeting = 'Hi! I can answer questions about Carlos, his skills, projects, and contact details. How can I help?';
        typeBubble('assistant', greeting);
        speak(greeting);
      }
      setTimeout(function () { input.focus(); }, 50);
    }

    function close() {
      stopListening();
      stopTyping();
      if (synth) synth.cancel();
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      if (panel.classList.contains('open')) close(); else open();
    });
    closeBtn.addEventListener('click', close);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      addBubble('user', text);
      history.push({ role: 'user', content: text });

      setBusy(true);
      var typing = doc.createElement('div');
      typing.className = 'chat-bubble chat-assistant chat-typing';
      typing.innerHTML =
        '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { status: res.status, data: data || {} };
          });
        })
        .then(function (result) {
          typing.remove();
          if (result.status >= 200 && result.status < 300 && result.data.ok && result.data.reply) {
            addBubble('assistant', result.data.reply);
            speak(result.data.reply);
            openLinks(result.data.actions);
            history.push({ role: 'assistant', content: result.data.reply });
          } else {
            addBubble('assistant', result.data.error || 'Sorry, something went wrong. Please try again.');
          }
          setBusy(false);
        })
        .catch(function () {
          typing.remove();
          addBubble('assistant', 'Network error. Please check your connection and try again.');
          setBusy(false);
        });
    });

    // Close on Escape
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
