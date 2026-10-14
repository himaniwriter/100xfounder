/* 100Xfounder theme behaviour: menu, search, newsletter, likes, share, submit types. */
(function () {
  'use strict';
  var root = document.documentElement;

  function toggle(cls, btn) {
    var open = !root.classList.contains(cls);
    root.classList.toggle(cls, open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    return open;
  }

  document.addEventListener('click', function (e) {
    var menuBtn = e.target.closest('[data-menu-toggle]');
    if (menuBtn) {
      e.preventDefault();
      root.classList.remove('search-open');
      toggle('menu-open', menuBtn);
      return;
    }
    var searchBtn = e.target.closest('[data-search-toggle]');
    if (searchBtn) {
      e.preventDefault();
      root.classList.remove('menu-open');
      if (toggle('search-open', searchBtn)) {
        var input = document.querySelector('.search-panel input');
        if (input) input.focus();
      }
      return;
    }
    // Close the mobile menu after choosing a link.
    if (e.target.closest('.mnav a')) root.classList.remove('menu-open');

    var copy = e.target.closest('[data-copy-link]');
    if (copy) {
      e.preventDefault();
      var url = copy.getAttribute('data-copy-link');
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
        copy.setAttribute('aria-label', 'Link copied');
        copy.classList.add('done');
      }).catch(function () { window.prompt('Copy this link', url); });
      return;
    }

    var like = e.target.closest('[data-like]');
    if (like) {
      e.preventDefault();
      var id = like.getAttribute('data-like');
      var key = 'xf_like_' + id;
      try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (err) {}
      like.classList.add('on');
      fetch(like.getAttribute('data-endpoint'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { var n = like.querySelector('[data-count]'); if (n && d && typeof d.likes === 'number') n.textContent = d.likes; })
        .catch(function () {});
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { root.classList.remove('menu-open', 'search-open'); }
  });

  // Close the mobile menu when the screen becomes wide (rotation, resize).
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) root.classList.remove('menu-open');
  });

  // Saved jobs live in this browser only (no account needed).
  var savedKey = 'xf_saved_jobs';
  var readSaved = function () { try { return JSON.parse(localStorage.getItem(savedKey) || '[]'); } catch (err) { return []; } };
  document.querySelectorAll('[data-save]').forEach(function (b) {
    if (readSaved().indexOf(b.getAttribute('data-save')) !== -1) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-save]');
    if (!b) return;
    var id = b.getAttribute('data-save');
    var list = readSaved();
    var i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    try { localStorage.setItem(savedKey, JSON.stringify(list)); } catch (err) {}
    b.classList.toggle('on', i === -1);
    b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
  });

  // Mark liked launches from earlier visits.
  document.querySelectorAll('[data-like]').forEach(function (b) {
    try { if (localStorage.getItem('xf_like_' + b.getAttribute('data-like'))) b.classList.add('on'); } catch (err) {}
  });

  // Newsletter signup.
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('.xf-subscribe');
    if (!form) return;
    e.preventDefault();
    var msg = form.querySelector('.xf-subscribe__msg');
    var data = { email: form.email.value, website: form.website ? form.website.value : '', source: form.getAttribute('data-source') || 'site', filters: form.getAttribute('data-alert') || '' };
    fetch(form.getAttribute('data-endpoint'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        msg.textContent = res.ok ? (res.d.message || 'Subscribed.') : (res.d.message || 'Please try again.');
        if (res.ok) form.email.value = '';
      })
      .catch(function () { msg.textContent = 'Network error. Please try again.'; });
  });

  // Submit page: change field labels to match the chosen type.
  var types = document.querySelectorAll('[data-sub-type]');
  if (types.length) {
    var apply = function (input) {
      var d = input.dataset;
      var set = function (sel, attr, val) { var el = document.querySelector(sel); if (el && val) el[attr] = val; };
      set('[data-f="form-title"]', 'textContent', 'New ' + d.label.toLowerCase());
      set('label[for="sub-title"]', 'textContent', d.title);
      set('#sub-title', 'placeholder', d.titlePh);
      set('label[for="sub-body"]', 'textContent', d.body);
      set('#sub-body', 'placeholder', d.bodyPh);
      types.forEach(function (i) { i.closest('.ty').classList.toggle('on', i.checked); });
    };
    types.forEach(function (input) {
      input.addEventListener('change', function () { apply(input); });
      if (input.checked) apply(input);
    });
  }

  // Reading progress for browsers without scroll-driven animations.
  var prog = document.querySelector('.prog');
  if (prog && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
    };
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  // A table only earns its "scroll sideways" line when it really is wider
  // than the column it sits in, which depends on the device.
  var tables = document.querySelectorAll('.xf-tablewrap');
  if (tables.length) {
    var mark = function () {
      Array.prototype.forEach.call(tables, function (w) {
        if (w.scrollWidth - w.clientWidth > 4) {
          w.setAttribute('data-overflow', '1');
        } else {
          w.removeAttribute('data-overflow');
        }
      });
    };
    mark();
    window.addEventListener('resize', mark, { passive: true });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(mark); }
  }

  // Startup pages: click-to-load video (no third-party request before the click) and a
  // screenshot lightbox on a native <dialog> (Esc closes, focus returns to the thumbnail).
  document.querySelectorAll('.sp-video').forEach(function (box) {
    var btn = box.querySelector('.sp-video-play');
    if (!btn) return;
    var src = box.getAttribute('data-embed') || '';
    // Same allowlist as xf_profile_video(): never frame anything else.
    if (!/^https:\/\/(?:www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|www\.loom\.com\/embed\/)[A-Za-z0-9_-]+(?:\?[\w=&;-]*)?$/.test(src)) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = src;
      f.title = box.getAttribute('data-title') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(f);
      f.focus();
    });
  });
  document.querySelectorAll('[data-gallery]').forEach(function (gal) {
    var dlg = gal.nextElementSibling;
    if (!dlg || !dlg.showModal) return; // no <dialog> support: thumbnails stay as they are
    var btns = Array.prototype.slice.call(gal.querySelectorAll('.sp-shot-btn'));
    var img = dlg.querySelector('img'), cap = dlg.querySelector('figcaption'), at = 0, opener = null;
    function show(i) {
      at = (i + btns.length) % btns.length;
      var b = btns[at], t = b.querySelector('img'), fc = b.parentNode.querySelector('figcaption');
      img.src = b.getAttribute('data-full');
      img.alt = t ? t.alt : '';
      cap.textContent = (fc ? fc.textContent + ' · ' : '') + (at + 1) + ' / ' + btns.length;
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { opener = b; show(i); dlg.showModal(); });
    });
    dlg.querySelectorAll('[data-lb]').forEach(function (b) {
      if (btns.length < 2) { b.hidden = true; return; }
      b.addEventListener('click', function () { show(at + parseInt(b.getAttribute('data-lb'), 10)); });
    });
    dlg.querySelector('[data-lb-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(at + 1);
      if (e.key === 'ArrowLeft') show(at - 1);
    });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  });

  // Smooth scrolling for mouse and trackpad. Phones keep their own touch
  // scrolling, and anyone who has asked their device for less motion gets the
  // browser's ordinary scroll. Sideways scrollers (tables, photo strips) and
  // ad frames are left alone, so they scroll and click exactly as before.
  if (window.Lenis && window.matchMedia &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches &&
      matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var lenis = new Lenis({
      autoRaf: true,
      lerp: 0.11,
      smoothWheel: true,
      allowNestedScroll: true,
      anchors: { offset: -120 },
      prevent: function (node) {
        return !!(node && node.closest && node.closest('.xf-tablewrap, .strip, iframe, [data-lenis-prevent], .ins, ins.adsbygoogle'));
      }
    });
    window.xfLenis = lenis;
  }
})();
