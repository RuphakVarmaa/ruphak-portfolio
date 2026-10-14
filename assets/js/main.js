/* Ruphak Varmaa S — interaction & motion layer.
   Classic deferred script, zero dependencies, works from file://.
   - One rAF-throttled scroll loop. It returns early when scrollY is unchanged,
     writes a 0–1 --p only on the few [data-track] elements (and only when the
     value changes), and drives the pinned project gallery with one direct
     transform. Geometry is cached on resize / ResizeObserver, so the scroll
     frame itself never reads layout.
   - IntersectionObservers reveal [data-reveal] once, track the active nav link
     and pause decorative loops that are off-screen (.is-live).
   - Everything degrades: without JS or with reduced motion the page is static
     and complete. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pinMQ = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  var reduced = reduceMQ.matches;
  var hasIO = 'IntersectionObserver' in window;
  window.__rvReady = true;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function onMQ(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }
  function smoothBehavior() { return reduced ? 'auto' : 'smooth'; }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Photo slot: monogram until assets/img/profile.jpg exists ---------- */
  $$('.avatar[data-photo]').forEach(function (slot) {
    var src = slot.getAttribute('data-photo');
    if (!src) return;
    var img = new Image();
    img.decoding = 'async';
    img.alt = 'Photo of Ruphak Varmaa S';
    img.onload = function () {
      slot.appendChild(img);
      requestAnimationFrame(function () { requestAnimationFrame(function () { slot.classList.add('has-photo'); }); });
    };
    img.src = src; // a 404 simply leaves the monogram in place
  });

  /* ---------- Statement: wrap words so CSS can light them up one by one ---------- */
  var statement = $('[data-statement]');
  if (statement) {
    var count = 0;
    var walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--i', String(count++));
        span.textContent = part;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    statement.style.setProperty('--n', String(count));
  }

  /* ---------- Navigation: solid on scroll, mobile sheet, active section ---------- */
  var nav = $('[data-nav-bar]');
  var toggle = $('.nav-toggle');
  var menu = $('#nav-menu');
  var mainEl = $('#main');
  var footerEl = $('.footer');
  var skipEl = $('.skip-link');

  function setMenu(open, restoreFocus) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    nav.classList.toggle('is-open', open);
    doc.classList.toggle('menu-open', open);
    // Keep focus inside the sheet: the page behind it is inert while it is open.
    if (mainEl) mainEl.inert = open;
    if (footerEl) footerEl.inert = open;
    if (skipEl) skipEl.inert = open;
    if (!open && restoreFocus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true', false);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && toggle.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        setMenu(false, true);
      }
    });
    onMQ(window.matchMedia('(min-width: 768px)'), function (mq) { if (mq.matches) setMenu(false, false); });
  }

  var navLinks = {};
  $$('[data-nav-link]').forEach(function (a) { navLinks[a.getAttribute('data-nav-link')] = a; });
  var currentSection = null;
  function setActive(key) {
    if (key === currentSection) return;
    currentSection = key;
    Object.keys(navLinks).forEach(function (k) {
      if (k === key) navLinks[k].setAttribute('aria-current', 'location');
      else navLinks[k].removeAttribute('aria-current');
    });
  }
  if (hasIO) {
    // A hairline across the middle of the viewport decides the active section.
    var navSections = $$('[data-nav-section]');
    var hits = new Map();
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { hits.set(entry.target, entry.isIntersecting); });
      var active = null;
      navSections.forEach(function (s) { if (hits.get(s)) active = s.getAttribute('data-nav-section'); });
      setActive(active);
    }, { rootMargin: '-50% 0px -49.5% 0px' });
    navSections.forEach(function (s) { sectionIO.observe(s); });
  }

  /* ---------- Reveals: one observer, once only ---------- */
  var revealEls = $$('[data-reveal]');
  if (reduced || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- Decorative loops only run while on screen ---------- */
  var hero = $('.hero');
  var heroVisible = true;
  var onHeroVisibility = function () {};
  var liveEls = $$('.hero, .tile-now, .project');
  if (hasIO) {
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-live', entry.isIntersecting);
        if (entry.target === hero) { heroVisible = entry.isIntersecting; onHeroVisibility(); }
      });
    });
    liveEls.forEach(function (el) { liveIO.observe(el); });
  } else {
    liveEls.forEach(function (el) { el.classList.add('is-live'); });
  }

  /* ---------- Rotating role: the old word leaves before the new one enters ---------- */
  var rot = $('[data-rotator]');
  if (rot) {
    var line = rot.closest('.role-line');
    var items = $$('.rot-item', rot);
    var idx = 0;
    var widths = [];
    var maxW = 0;
    var rotTimer = 0;

    var setShift = function () {
      line.style.setProperty('--shift', ((maxW - widths[idx]) / 2).toFixed(2) + 'px');
    };
    var measureRot = function () {
      widths = items.map(function (it) { return it.getBoundingClientRect().width; });
      maxW = Math.max.apply(Math, widths);
      setShift();
    };
    var step = function () {
      var prev = items[idx];
      idx = (idx + 1) % items.length;
      var next = items[idx];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      next.classList.remove('is-leaving');
      next.classList.add('is-active');
      setShift();
      setTimeout(function () { prev.classList.remove('is-leaving'); }, 600);
    };
    var running = function () { return !reduced && heroVisible && !document.hidden; };
    var schedule = function () {
      clearTimeout(rotTimer);
      if (running()) rotTimer = setTimeout(function () { if (running()) step(); schedule(); }, 2600);
    };
    var startRot = function () {
      if (reduced) return;
      line.classList.add('is-rotating');
      measureRot();
      schedule();
    };
    var stopRot = function () {
      clearTimeout(rotTimer); rotTimer = 0;
      line.classList.remove('is-rotating');
      items.forEach(function (it, i) { it.classList.toggle('is-active', i === 0); it.classList.remove('is-leaving'); });
      idx = 0;
      line.style.removeProperty('--shift');
    };
    startRot();
    onMQ(reduceMQ, function () { if (reduceMQ.matches) stopRot(); else startRot(); });
    document.addEventListener('visibilitychange', schedule);
    onHeroVisibility = schedule;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!reduced) measureRot(); });
    window.addEventListener('resize', function () { if (!reduced) measureRot(); });
  }

  /* ---------- Hero: keyboard focus brings the (scrubbed) hero back into view ---------- */
  if (hero) {
    hero.addEventListener('focusin', function () {
      if (window.pageYOffset > 1) window.scrollTo({ top: 0, behavior: smoothBehavior() });
    });
  }

  /* ---------- Scroll tracks ---------- */
  var tracks = $$('[data-track]').map(function (el) {
    var s = parseFloat(el.getAttribute('data-track-start'));
    var e = parseFloat(el.getAttribute('data-track-end'));
    return { el: el, s: isNaN(s) ? 1 : s, e: isNaN(e) ? 0 : e, y0: 0, y1: 1, last: -1 };
  });
  var heroTrack = null;
  tracks.forEach(function (t) { if (t.el === hero) heroTrack = t; });

  /* Pinned gallery. The section is 100vh + SPAN tall; while its sticky panel is
     pinned, scroll progress u (0–1) pans the track. Each card gets a gentle
     ease-in-out "settle" so stills tend to land on whole cards. */
  var SPAN = 0.82;               // vertical scroll per px of horizontal travel
  var HOLD = 0.04;               // still at the start and end of the pin
  var EASE = 0.55;               // 0 = linear pan, 1 = full smoothstep per card
  var gallery = $('[data-gallery]');
  var galleryTrack = gallery ? $('.gallery-track', gallery) : null;
  var galleryPin = gallery ? $('.gallery-pin', gallery) : null;
  var galleryCount = gallery ? $('[data-count]', gallery) : null;
  var galleryBar = gallery ? $('[data-progress]', gallery) : null;
  var galleryCards = galleryTrack ? $$('.project', galleryTrack) : [];
  var gN = galleryCards.length;
  var g = { y0: 0, span: 1, travel: -1, lastX: null, lastCount: -1 };
  var pinned = false;

  var timeline = $('[data-timeline]');
  var navScrolled = null;
  var navNamed = null;
  var heroH = 1;
  var lastY = -1;
  var ticking = false;

  function galleryTp(y) {
    var u = clamp01((y - g.y0) / g.span);
    var lin = clamp01((u - HOLD) / (1 - 2 * HOLD));
    if (gN < 2) return lin;
    var s = lin * (gN - 1);
    var i = Math.min(Math.floor(s), gN - 2);
    var f = s - i;
    var sm = f * f * (3 - 2 * f);
    return (i + f + (sm - f) * EASE) / (gN - 1);
  }
  function galleryYFor(index) {
    var lin = gN > 1 ? index / (gN - 1) : 0;
    return g.y0 + (HOLD + lin * (1 - 2 * HOLD)) * g.span;
  }

  function measure() {
    var vh = window.innerHeight;
    var sy = window.pageYOffset;

    if (gallery) {
      var wantPin = pinMQ.matches;
      if (wantPin !== pinned) {
        pinned = wantPin;
        gallery.classList.toggle('is-pinned', pinned);
        g.travel = -1;
        if (!pinned) {
          gallery.style.removeProperty('--span');
          galleryTrack.style.removeProperty('transform');
          if (galleryBar) galleryBar.style.removeProperty('transform');
          g.lastX = null; g.lastCount = -1;
        }
      }
      if (pinned) {
        var travel = Math.max(0, galleryTrack.scrollWidth - galleryPin.clientWidth);
        // Only write when it changes, so the ResizeObserver doesn't loop us.
        if (travel !== g.travel) {
          g.travel = travel;
          g.span = Math.max(1, Math.round(travel * SPAN));
          gallery.style.setProperty('--span', g.span + 'px');
        }
        g.y0 = gallery.getBoundingClientRect().top + sy;
        g.lastX = null;
      }
    }

    tracks.forEach(function (t) {
      var r = t.el.getBoundingClientRect();
      var top = r.top + sy;
      t.y0 = top - t.s * vh;
      t.y1 = top + r.height - t.e * vh;
      if (t.y1 - t.y0 < 1) t.y1 = t.y0 + 1;
      t.last = -1;
    });
    heroH = hero ? hero.offsetHeight || 1 : 1;

    // Timeline nodes light up exactly when the rail fill reaches them.
    if (timeline) {
      var th = timeline.offsetHeight || 1;
      $$('.tl-node', timeline).forEach(function (node) {
        var item = node.parentNode;
        var at = (item.offsetTop + node.offsetTop + node.offsetHeight / 2) / th;
        node.style.setProperty('--at', at.toFixed(4));
      });
    }
    lastY = -1;
    frame();
  }

  function frame() {
    ticking = false;
    var y = window.pageYOffset;
    if (y === lastY) return;
    lastY = y;

    if (nav) {
      var scrolled = y > 8;
      if (scrolled !== navScrolled) { navScrolled = scrolled; nav.classList.toggle('is-scrolled', scrolled); }
      // The name hands off from the hero to the nav once the hero is ~60% gone.
      var named = y > heroH * 0.6;
      if (named !== navNamed) { navNamed = named; nav.classList.toggle('has-name', named); }
    }

    if (reduced) return;

    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      // The hero is static once it has scrolled away; skip its writes there.
      if (t === heroTrack && t.last === 1 && y > t.y1) continue;
      var p = Math.round(clamp01((y - t.y0) / (t.y1 - t.y0)) * 1000) / 1000;
      if (p !== t.last) { t.last = p; t.el.style.setProperty('--p', String(p)); }
    }

    if (pinned) {
      var tp = galleryTp(y);
      var x = Math.round(tp * g.travel * 10) / 10;
      if (x !== g.lastX) {
        g.lastX = x;
        galleryTrack.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
        if (galleryBar) galleryBar.style.transform = 'scaleX(' + tp.toFixed(4) + ')';
      }
      if (galleryCount) {
        var n = Math.min(gN, Math.round(tp * (gN - 1)) + 1);
        if (n !== g.lastCount) { g.lastCount = n; galleryCount.textContent = (n < 10 ? '0' : '') + n; }
      }
    }
  }

  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  var measureQueued = false;
  function requestMeasure() {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(function () { measureQueued = false; measure(); });
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestMeasure);
  window.addEventListener('load', requestMeasure);
  onMQ(pinMQ, requestMeasure);
  onMQ(reduceMQ, function () {
    reduced = reduceMQ.matches;
    if (reduced) revealEls.forEach(function (el) { el.classList.add('in'); });
    requestMeasure();
  });
  if ('ResizeObserver' in window) {
    var lastBox = '';
    new ResizeObserver(function (entries) {
      var r = entries[0].contentRect;
      var box = Math.round(r.width) + 'x' + Math.round(r.height);
      if (box !== lastBox) { lastBox = box; requestMeasure(); }
    }).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestMeasure);
  measure();

  /* Keyboard users: focusing a project card scrolls the pinned gallery to it. */
  if (galleryTrack) {
    galleryTrack.addEventListener('focusin', function (e) {
      if (!pinned) return;
      var card = e.target.closest && e.target.closest('.project');
      var i = galleryCards.indexOf(card);
      if (i < 0) return;
      window.scrollTo({ top: Math.round(galleryYFor(i)), behavior: smoothBehavior() });
    });
  }

  /* ---------- Copy email ---------- */
  var copyBtn = $('[data-copy]');
  var copyStatus = $('[data-copy-status]');
  if (copyBtn) {
    var label = $('.copy-label', copyBtn);
    var resetTimer = null;
    var fallbackCopy = function (text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    };
    var done = function (ok) {
      copyBtn.classList.toggle('is-copied', ok);
      if (label) label.textContent = ok ? 'Copied' : 'Copy email';
      if (copyStatus) copyStatus.textContent = ok ? 'Email address copied to clipboard.' : 'Couldn’t copy — the address is ruphak2022@gmail.com';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        copyBtn.classList.remove('is-copied');
        if (label) label.textContent = 'Copy email';
        if (copyStatus) copyStatus.textContent = '';
      }, 1600);
    };
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  }
})();
