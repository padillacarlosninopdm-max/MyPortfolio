/* ==========================================================================
   Carlos Niño Padilla — OJT Portfolio
   Progressive enhancement only: the page is fully readable without JS.
   The site is permanently dark; there is no theme switch to wire up.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;

  /* ---------- Mobile navigation ---------- */
  var burger = doc.getElementById('navBurger');
  var links = doc.getElementById('navLinks');

  function closeNav() {
    if (!links || !links.classList.contains('open')) return;
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }

  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 880) closeNav();
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = doc.getElementById('header');
  var toTop = doc.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 520);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window && reveals.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Highlight the current section in the nav ----------
     Scroll-based rather than IntersectionObserver: with very tall viewports
     (or a maximised window) several sections intersect at once, and a ratio
     comparison then picks an arbitrary winner. Picking the last section whose
     top has passed the nav line is deterministic at any window size. */
  var navAnchors = Array.prototype.slice.call(doc.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = navAnchors
    .map(function (a) { return doc.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length) {
    var activeId = null;
    var ticking = false;

    function syncActive() {
      ticking = false;
      var line = window.scrollY + (header ? header.offsetHeight : 68) + 24;
      var current = null;

      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= line) current = sections[i].id;
      }

      if (current === activeId) return;
      activeId = current;
      navAnchors.forEach(function (a) {
        a.classList.toggle('active', current !== null && a.getAttribute('href') === '#' + current);
      });
    }

    function requestSync() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncActive);
    }

    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    syncActive();
  }

  /* ---------- Footer year ---------- */
  var year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Contact form (sends via /api/contact on Vercel) ---------- */
  var form = doc.getElementById('contactForm');
  if (form) {
    var status = doc.getElementById('cfStatus');
    var submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(text, kind) {
      if (!status) return;
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = doc.getElementById('cfName').value.trim();
      var email = doc.getElementById('cfEmail').value.trim();
      var message = doc.getElementById('cfMessage').value.trim();
      var honeypot = doc.getElementById('cfWebsite');
      if (!name || !email || !message) {
        setStatus('Please fill in your name, email, and message.', 'error');
        return;
      }
      if (submitBtn) submitBtn.disabled = true;
      setStatus('Sending your message...', 'sending');

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          website: honeypot ? honeypot.value : ''
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { status: res.status, data: data || {} };
          });
        })
        .then(function (result) {
          if (result.status >= 200 && result.status < 300 && result.data.ok) {
            setStatus('Message sent! Thank you for reaching out. Please check your inbox for a confirmation email.', 'success');
            form.reset();
          } else {
            setStatus(
              result.data.error || 'Could not send your message. Please try again later.',
              'error'
            );
          }
          if (submitBtn) submitBtn.disabled = false;
        })
        .catch(function () {
          setStatus('Network error. Please check your connection and try again.', 'error');
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
