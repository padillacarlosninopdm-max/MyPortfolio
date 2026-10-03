/* ==========================================================================
   POST /api/contact — portfolio contact form backend (Vercel serverless).
   Forwards the message to the owner via Brevo, then sends an auto-reply
   to the sender. The Brevo key lives ONLY in the Vercel environment
   variable BREVO_API_KEY — never commit it to this repo.
   ========================================================================== */
'use strict';

var BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
var OWNER_EMAIL = 'padillacarlosnino.pdm@gmail.com';
var OWNER_NAME = 'Carlos Nino Q. Padilla';
var MAX_LEN = { name: 100, email: 254, message: 5000 };

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* Escape user input before placing it inside HTML email bodies. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Shared dark-navy email shell matching the portfolio theme. */
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
    try {
      detail = await res.text();
    } catch (err) {
      detail = '';
    }
    throw new Error('Brevo error ' + res.status + ': ' + detail.slice(0, 300));
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  var apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'Email service is not configured.' });
  }

  var body = req.body || {};

  /* Honeypot: bots fill this hidden field, humans never see it. */
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  var name = String(body.name || '').trim().slice(0, MAX_LEN.name);
  var email = String(body.email || '').trim().slice(0, MAX_LEN.email);
  var message = String(body.message || '').trim().slice(0, MAX_LEN.message);

  if (!name || !isEmail(email) || !message) {
    return res.status(400).json({
      ok: false,
      error: 'Please provide your name, a valid email, and a message.'
    });
  }

  try {
    /* 1. Notify the owner. Sender stays the verified Gmail address so Brevo
       accepts it; replyTo routes replies straight to the visitor. */
    await sendEmail(apiKey, {
      sender: { name: OWNER_NAME, email: OWNER_EMAIL },
      to: [{ email: OWNER_EMAIL, name: OWNER_NAME }],
      replyTo: { email: email, name: name },
      subject: 'New OJT Inquiry from ' + name,
      htmlContent: ownerEmailHtml(name, email, message),
      textContent: 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message
    });

    /* 2. Auto-reply to the sender. If this fails after the owner email went
       through, still report success — the main message was delivered. */
    try {
      await sendEmail(apiKey, {
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
      console.error('contact auto-reply failed:', autoErr.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact form error:', err.message);
    return res.status(502).json({
      ok: false,
      error: 'Could not send your message. Please try again later or email me directly.'
    });
  }
};
