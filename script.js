(function () {
  'use strict';

  var PROFILE_URL = 'https://www.tiktok.com/@singlemarried_';
  var ARROW_SVG = '<svg class="icon icon--arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

  /* ---------- Current year ---------- */
  var year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setNav(open) {
    if (!toggle || !nav) { return; }
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setNav(false); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) { return; }
      if (nav.contains(event.target) || toggle.contains(event.target)) { return; }
      setNav(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) { setNav(false); }
    });
  }

  /* ---------- Screenshot lightbox ---------- */
  var dialog = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxOpen = document.getElementById('lightbox-open');
  var closeButton = dialog ? dialog.querySelector('.lightbox-close') : null;
  var lastTrigger = null;

  function openLightbox(trigger) {
    var full = trigger.getAttribute('data-full');
    if (!full) { return; }

    lastTrigger = trigger;

    var sourceImage = trigger.querySelector('img');
    if (sourceImage && sourceImage.getAttribute('width') && sourceImage.getAttribute('height')) {
      lightboxImage.setAttribute('width', sourceImage.getAttribute('width'));
      lightboxImage.setAttribute('height', sourceImage.getAttribute('height'));
    }

    lightboxImage.src = full;
    lightboxImage.alt = trigger.getAttribute('data-alt') || '';
    lightboxCaption.textContent = trigger.getAttribute('data-caption') || '';
    lightboxOpen.href = full;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('lightbox-open');
      if (closeButton) { closeButton.focus(); }
    } else {
      window.open(full, '_blank', 'noopener');
    }
  }

  function cleanupLightbox() {
    if (dialog && dialog.open) { return; }
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
    if (lastTrigger && document.contains(lastTrigger)) {
      lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    }
  }

  function closeLightbox() {
    if (dialog && dialog.open) { dialog.close(); }
    cleanupLightbox();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.phone-screen'), function (button) {
    button.addEventListener('click', function () { openLightbox(button); });
  });

  if (dialog) {
    if (closeButton) { closeButton.addEventListener('click', closeLightbox); }

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { closeLightbox(); }
    });

    dialog.addEventListener('close', cleanupLightbox);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && dialog.open) {
        event.preventDefault();
        closeLightbox();
      }
    });

    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (!dialog.open) { cleanupLightbox(); }
      }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
  }

  /* ---------- TikTok live embed ---------- */
  var EMBED_SRC = 'https://www.tiktok.com/embed.js';
  var embedShell = document.getElementById('tiktok-embed-shell');
  var embedStage = document.getElementById('tiktok-embed-stage');
  var manualWrap = document.getElementById('tiktok-manual-videos');
  var embedFallback = document.getElementById('tiktok-embed-fallback');

  function videoHref(item) {
    var raw = item && (item.url || (item.videoId ? PROFILE_URL + '/video/' + item.videoId : ''));
    if (!raw) { return ''; }
    try {
      var parsed = new URL(String(raw), window.location.href);
      var host = parsed.hostname.replace(/^www\./, '');
      if (parsed.protocol === 'https:' && host === 'tiktok.com') { return parsed.href; }
    } catch (error) { return ''; }
    return '';
  }

  function buildVideoQuote(href) {
    var quote = document.createElement('blockquote');
    quote.className = 'tiktok-embed';
    quote.setAttribute('cite', href);
    quote.setAttribute('data-video-id', href.split('/video/')[1] || '');
    quote.setAttribute('data-embed-from', 'oembed');
    quote.style.maxWidth = '325px';
    quote.style.minWidth = '220px';
    quote.style.margin = '0';
    var section = document.createElement('section');
    var link = document.createElement('a');
    link.target = '_blank';
    link.href = href + (href.indexOf('?') === -1 ? '?refer=video_embed' : '&refer=video_embed');
    link.textContent = '@singlemarried_ on TikTok';
    section.appendChild(link);
    quote.appendChild(section);
    return quote;
  }

  function renderManualVideos() {
    if (!manualWrap) { return; }
    var items = Array.isArray(window.TIKTOK_VIDEOS) ? window.TIKTOK_VIDEOS : [];
    var hrefs = [];
    items.forEach(function (item) {
      var href = videoHref(item);
      if (href && hrefs.indexOf(href) === -1) { hrefs.push(href); }
    });
    if (hrefs.length === 0) { return; }
    hrefs.slice(0, 8).forEach(function (href) {
      manualWrap.appendChild(buildVideoQuote(href));
    });
    manualWrap.hidden = false;
  }

  function showEmbedFallback() {
    if (embedShell.classList.contains('is-ready')) { return; }
    if (embedStage) { embedStage.hidden = true; }
    if (manualWrap && !manualWrap.hidden) {
      manualWrap.classList.add('is-fallback');
    } else if (manualWrap) { manualWrap.hidden = true; }
    if (embedFallback) { embedFallback.hidden = false; }
  }

  function loadTikTokEmbeds() {
    if (!embedShell || !embedStage) { return; }
    renderManualVideos();

    var script = document.createElement('script');
    script.src = EMBED_SRC;
    script.async = true;
    var settled = false;

    function settleAsReady() {
      if (settled) { return; }
      settled = true;
      embedShell.classList.add('is-ready');
    }

    script.onload = function () {
      // embed.js swaps each blockquote for an iframe; watch for it.
      var started = Date.now();
      var timer = window.setInterval(function () {
        var frames = embedStage.querySelectorAll('iframe');
        var manualFrames = manualWrap ? manualWrap.querySelectorAll('iframe') : [];
        if (frames.length || manualFrames.length) {
          window.clearInterval(timer);
          settleAsReady();
        } else if (Date.now() - started > 15000) {
          window.clearInterval(timer);
          showEmbedFallback();
        }
      }, 400);
      window.setTimeout(function () {
        if (!settled && !embedStage.querySelector('iframe')) { showEmbedFallback(); }
      }, 16000);
    };
    script.onerror = function () { showEmbedFallback(); };

    document.body.appendChild(script);
  }

  loadTikTokEmbeds();
}());
