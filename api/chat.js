'use strict';

var GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
var MODEL = 'qwen/qwen3.8-27b';
var MAX_MESSAGES = 20;
var MAX_LEN = 2000;
var BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
var OWNER_EMAIL = 'padillacarlosnino.pdm@gmail.com';
var OWNER_NAME = 'Carlos Nino Q. Padilla';

/* Whitelisted project sites the chatbot may open for the visitor. */
var SITES = {
  rentahanan: { url: 'https://rentahanan.vercel.app/', label: 'Rentahanan' },
  solaris: { url: 'https://www.solarisiot.com/', label: 'Solaris' }
};

var SYSTEM_PROMPT =
  'You are a helpful assistant on the portfolio website of Carlos Nino Q. Padilla. ' +
  'Contact details: phone 09553764958; email padillacarlosnino.pdm@gmail.com; ' +
  'GitHub github.com/padillacarlosninopdm-max; LinkedIn linkedin.com/in/carlos-padilla-21b1243ba; ' +
  'portfolio myportfolio-psi-three-54.vercel.app; CV at resume.html. ' +
  'Education: Pambayang Dalubhasaan ng Marilao, BS Information Technology, 4th year, Marilao, Bulacan, ' +
  'expected graduation 2027. Aspiring Frontend Developer and Quality Assurance, open to OJT. ' +
  'Profile: hands-on frontend development and software QA, React and Flutter interfaces, testing and defect logging. ' +
  'Skills: Languages Dart, Python, PHP, C#. Web HTML, CSS, JavaScript. Frontend/Mobile React, Flutter. ' +
  'Backend/APIs Node.js, Express.js, REST APIs. Database MongoDB, MySQL, Supabase. Tools Git, GitHub, Render, Vercel. ' +
  'Projects: 1) SOLARIS - IoT web-based solar energy site pre-assessment and billing system with mobile app for Salfer Engineering; ' +
  'React web app and Flutter mobile app on Node.js/Express/MongoDB REST API; PayMongo; Vercel/Render. Team project: front end and QA. ' +
  '2) Rentahanan - web tenant admission and billing management system for local rental houses; React, SQLAlchemy, MySQL, REST API. ' +
  'Team project: mostly front end with minor backend, plus QA. ' +
  '3) Celevation - LAN-based event management system; C# WinForms, MySQL/MariaDB. Team project: mostly front end with minor backend, plus QA. ' +
  'Seminars: Learn AI and ChatGPT (DICT, 2026); Build Your Future with AI (PDM College of Computer Studies CSS, 2026); ' +
  'Git Happens (PDM CSS/CS Department, 2026). No certifications are listed yet. ' +
  'Project websites: Rentahanan at https://rentahanan.vercel.app/ and Solaris at https://www.solarisiot.com/. ' +
  'If the visitor asks to open, view, show, or be redirected to the Rentahanan or Solaris website, ' +
  'call the open_website tool with the matching site; it opens in a new tab on their browser. ' +
  'Confirm briefly, for example: Opening the Solaris website in a new tab. ' +
  'If the visitor explicitly asks to send a message to Carlos, use the send_message_to_carlos tool. ' +
  'Collect the visitor name, email, and message first; if any are missing, ask for them. Never send without explicit request. ' +
  'Be concise, friendly, and professional. Reply in plain text only, no markdown formatting such as **bold**, ' +
  '*italics*, or bullet asterisks. If asked something unrelated, politely redirect to his portfolio. ' +
  'Never invent facts not in this context.';

function isMessage(m) {
  return m && (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' && m.content.trim().length > 0;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailShell(innerHtml) {
  return (
    '<div style="background-color:#0b1120;padding:32px 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">' +
    '<div style="max-width:600px;margin:0 auto;background-color:#111a2e;border:1px solid #1f2b45;border-radius:14px;padding:28px;">' +
    innerHtml +
    '<p style="margin:24px 0 0;font-size:12px;color:#8494ab;">Carlos Nino Q. Padilla &middot; IT Student &middot; Bulacan, Philippines</p>' +
    '</div>' +
    '</div>'
  );
}

function ownerEmailHtml(name, email, message) {
  var safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  return emailShell(
    '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#60a5fa;">NEW OJT INQUIRY</p>' +
    '<h2 style="margin:0 0 16px;font-size:22px;color:#e9eff9;">You have a new message</h2>' +
    '<p style="margin:0 0 6px;font-size:14px;color:#a9b8cd;"><strong style="color:#e9eff9;">From:</strong> ' + escapeHtml(name) + '</p>' +
    '<p style="margin:0 0 16px;font-size:14px;color:#a9b8cd;"><strong style="color:#e9eff9;">Email:</strong> ' +
    '<a href="mailto:' + escapeHtml(email) + '" style="color:#60a5fa;">' + escapeHtml(email) + '</a></p>' +
    '<div style="background-color:#0a1020;border:1px solid #1f2b45;border-radius:8px;padding:16px;">' +
    '<p style="margin:0;font-size:14px;line-height:1.65;color:#e9eff9;">' + safeMessage + '</p>' +
    '</div>'
  );
}

function autoReplyHtml(name) {
  return emailShell(
    '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#60a5fa;">MESSAGE RECEIVED</p>' +
    '<h2 style="margin:0 0 16px;font-size:22px;color:#e9eff9;">Thanks for reaching out, ' + escapeHtml(name) + '!</h2>' +
    '<p style="margin:0;font-size:14px;line-height:1.65;color:#a9b8cd;">I received your message and will reply within a day or two.</p>' +
    '<p style="margin:16px 0 0;font-size:14px;color:#e9eff9;">Best regards,<br>Carlos Nino Q. Padilla</p>'
  );
}

async function sendEmail(apiKey, payload) {
  var res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    var detail = '';
    try { detail = await res.text(); } catch (err) { detail = ''; }
    throw new Error('Brevo error ' + res.status + ': ' + detail.slice(0, 300));
  }
}

async function sendToCarlos(args) {
  var brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return { ok: false, error: 'Email service is not configured.' };

  var name = String((args && args.name) || '').trim().slice(0, 100);
  var email = String((args && args.email) || '').trim().slice(0, 254);
  var message = String((args && args.message) || '').trim().slice(0, 5000);

  if (!name || !isEmail(email) || !message) {
    return { ok: false, error: 'Missing or invalid name, email, or message.' };
  }

  try {
    await sendEmail(brevoKey, {
      sender: { name: OWNER_NAME, email: OWNER_EMAIL },
      to: [{ email: OWNER_EMAIL, name: OWNER_NAME }],
      replyTo: { email: email, name: name },
      subject: 'New OJT Inquiry from ' + name,
      htmlContent: ownerEmailHtml(name, email, message),
      textContent: 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message
    });

    try {
      await sendEmail(brevoKey, {
        sender: { name: OWNER_NAME, email: OWNER_EMAIL },
        to: [{ email: email, name: name }],
        subject: 'Thanks for reaching out!',
        htmlContent: autoReplyHtml(name),
        textContent:
          'Hi ' + name + ',\n\n' +
          'Thanks for reaching out. I received your message and will reply ' +
          'within a day or two.\n\n' +
          'Best regards,\n' +
          OWNER_NAME
      });
    } catch (autoErr) {
      // main message was delivered; ignore auto-reply failure
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Could not send the email. Please try again later.' };
  }
}

var tools = [{
  type: 'function',
  function: {
    name: 'open_website',
    description: 'Open a project website in a new browser tab for the visitor. Use when the visitor asks to open, view, show, or be redirected to a project website.',
    parameters: {
      type: 'object',
      properties: {
        site: {
          type: 'string',
          enum: ['rentahanan', 'solaris'],
          description: 'Which project website to open'
        }
      },
      required: ['site']
    }
  }
}];

if (process.env.BREVO_API_KEY) {
  tools.push({
    type: 'function',
    function: {
      name: 'send_message_to_carlos',
      description: 'Send a message from the website visitor to Carlos Padilla by email. Use only when the visitor explicitly asks to send or contact Carlos and has provided name, email, and message.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Visitor name' },
          email: { type: 'string', description: 'Visitor email' },
          message: { type: 'string', description: 'Message to send' }
        },
        required: ['name', 'email', 'message']
      }
    }
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  var apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'Chat service is not configured.' });
  }

  var body = req.body || {};
  var incoming = Array.isArray(body.messages) ? body.messages : [];
  var messages = incoming
    .filter(isMessage)
    .map(function (m) {
      return { role: m.role, content: String(m.content).trim().slice(0, MAX_LEN) };
    })
    .slice(-MAX_MESSAGES);

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ ok: false, error: 'Please send a message.' });
  }

  var conversation = [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages);

  try {
    var reply = '';
    var actions = [];
    for (var i = 0; i < 5; i++) {
      var groqRes = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: MODEL,
          messages: conversation,
          tools: tools.length ? tools : undefined,
          tool_choice: tools.length ? 'auto' : undefined,
          max_tokens: 512,
          temperature: 0.6
        })
      });

      if (!groqRes.ok) {
        var detail = '';
        try { detail = await groqRes.text(); } catch (err) { detail = ''; }
        throw new Error('Groq error ' + groqRes.status + ': ' + detail.slice(0, 300));
      }

      var data = await groqRes.json();
      var choice = (data && Array.isArray(data.choices) && data.choices[0]) ? data.choices[0] : null;
      var msg = choice ? choice.message : null;

      if (msg && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
        conversation.push({
          role: 'assistant',
          content: (typeof msg.content === 'string') ? msg.content : null,
          tool_calls: msg.tool_calls
        });
        for (var t = 0; t < msg.tool_calls.length; t++) {
          var tc = msg.tool_calls[t];
          var args = {};
          try { args = JSON.parse((tc.function && tc.function.arguments) || '{}'); } catch (err) { args = {}; }
          var fnName = (tc.function && tc.function.name) || '';
          var result;
          if (fnName === 'open_website') {
            var site = SITES[String(args.site || '').toLowerCase()];
            if (site) {
              actions.push({ type: 'open_link', url: site.url, label: site.label });
              result = { ok: true, opened: site.url };
            } else {
              result = { ok: false, error: 'Unknown website.' };
            }
          } else {
            result = await sendToCarlos(args);
          }
          conversation.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result)
          });
        }
        continue;
      }

      if (msg && typeof msg.content === 'string') {
        reply = msg.content.trim();
      }
      break;
    }

    if (!reply) {
      return res.status(502).json({ ok: false, error: 'No response from chat service.' });
    }

    return res.status(200).json({ ok: true, reply: reply, actions: actions });
  } catch (err) {
    console.error('chat error:', err.message);
    return res.status(502).json({
      ok: false,
      error: 'Could not get a reply. Please try again later.'
    });
  }
};
