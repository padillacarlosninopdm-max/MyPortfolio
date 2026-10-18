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
      '  <button type="button" class="chat-close" aria-label="Close chat">&times;</button>' +
      '</div>' +
      '<div class="chat-messages" id="chatMessages"></div>' +
      '<form class="chat-form" id="chatForm">' +
      '  <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off" maxlength="2000" required>' +
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

    var history = [];
    var busy = false;

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

    function addBubble(role, text) {
      var bubble = doc.createElement('div');
      bubble.className = 'chat-bubble chat-' + role;
      bubble.innerHTML = linkify(escapeHtml(text))
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*/g, '')
        .replace(/\n/g, '<br>');
      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
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
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = state;
      input.disabled = state;
    }

    function open() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      if (messagesEl.childElementCount === 0) {
        addBubble('assistant', 'Hi! I can answer questions about Carlos, his skills, projects, and contact details. How can I help?');
      }
      setTimeout(function () { input.focus(); }, 50);
    }

    function close() {
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
