/* ==========================================================================
   POST /api/chat — portfolio chatbot backend (Vercel serverless).
   Proxies the conversation to Groq. The Groq key lives ONLY in the Vercel
   environment variable GROQ_API_KEY — never commit it to this repo.
   ========================================================================== */
'use strict';

var GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
var MODEL = 'qwen/qwen3.8-27b';
var MAX_MESSAGES = 20;
var MAX_LEN = 2000;

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
  'Be concise, friendly, and professional. Reply in plain text only, no markdown formatting such as **bold**, ' +
  '*italics*, or bullet asterisks. If asked something unrelated, politely redirect to his portfolio. ' +
  'Never invent facts not in this context.';

function isMessage(m) {
  return m && (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' && m.content.trim().length > 0;
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

  try {
    var groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
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
    var reply = '';
    if (data && Array.isArray(data.choices) && data.choices[0] &&
        data.choices[0].message && typeof data.choices[0].message.content === 'string') {
      reply = data.choices[0].message.content.trim();
    }
    if (!reply) {
      return res.status(502).json({ ok: false, error: 'No response from chat service.' });
    }

    return res.status(200).json({ ok: true, reply: reply });
  } catch (err) {
    console.error('chat error:', err.message);
    return res.status(502).json({
      ok: false,
      error: 'Could not get a reply. Please try again later.'
    });
  }
};
