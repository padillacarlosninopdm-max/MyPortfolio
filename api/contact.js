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
      sender: { name: 'Portfolio Contact Form', email: OWNER_EMAIL },
      to: [{ email: OWNER_EMAIL, name: OWNER_NAME }],
      replyTo: { email: email, name: name },
      subject: 'New OJT Inquiry from ' + name,
      textContent: 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message
    });

    /* 2. Auto-reply to the sender. If this fails after the owner email went
       through, still report success — the main message was delivered. */
    try {
      await sendEmail(apiKey, {
        sender: { name: OWNER_NAME, email: OWNER_EMAIL },
        to: [{ email: email, name: name }],
        subject: 'Thanks for reaching out!',
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
