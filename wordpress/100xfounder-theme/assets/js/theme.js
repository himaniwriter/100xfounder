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

  // Share bars (plugin includes/share.php): intent links rebuilt from the bar's data-* at click time,
  // the Web Share API where it exists, UTM tags on every link, and a GA4 `share` event only through
  // the consent-gated gtag. No third-party scripts, no counts.
  var E = encodeURIComponent;
  var utm = function (u, src, ctx) {
    var h = u.indexOf('#'), hash = h < 0 ? '' : u.slice(h);
    u = h < 0 ? u : u.slice(0, h);
    return u + (u.indexOf('?') < 0 ? '?' : '&') + 'utm_source=' + src + '&utm_medium=share&utm_campaign=' + ctx + hash;
  };
  var intent = {
    whatsapp: function (u, t) { return 'https://wa.me/?text=' + E(t + ' ' + u); },
    x: function (u, t) { return 'https://x.com/intent/post?text=' + E(t) + '&url=' + E(u); },
    linkedin: function (u) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + E(u); },
    telegram: function (u, t) { return 'https://t.me/share/url?url=' + E(u) + '&text=' + E(t); }
  };
  // Prefill a bar from script (tap moment, review, quote, quiz): Copy then copies the message too.
  var shareSet = window.xfShareSet = function (bar, url, text) {
    bar.dataset.url = url; bar.dataset.text = text;
    var c = bar.querySelector('[data-net="copy"]');
    if (c) { c.setAttribute('data-copy-link', text + ' ' + utm(url, 'copy', bar.dataset.ctx)); c.classList.remove('done'); }
  };
  if (navigator.share) document.querySelectorAll('[data-net="native"]').forEach(function (b) { b.hidden = false; });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-net]'), bar = b && b.closest('[data-share]');
    if (!bar) return;
    var net = b.getAttribute('data-net'), ctx = bar.dataset.ctx, u = utm(bar.dataset.url, net, ctx), t = bar.dataset.text;
    if (intent[net]) b.href = intent[net](u, t);
    if (net === 'native') navigator.share({ text: t, url: u }).catch(function () {});
    if (typeof window.gtag === 'function') window.gtag('event', 'share', { method: net, content_type: ctx, item_id: bar.dataset.url.split('#')[0].replace(location.origin, '') });
  });
  // "Add your take" opens the review form it points at.
  var openReview = function () { var d = document.getElementById('write-review'); if (d) d.open = true; };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-open-review]')) openReview(); });
  if (location.hash === '#write-review') openReview();

  // Quote sharing: select 8–40 words of an article (not in forms or code) to get a "Share quote" button.
  var qs = document.querySelector('[data-qs]'), qroot = document.querySelector('[data-quote-root]');
  if (qs && qroot) {
    var qpop = qs.querySelector('[data-qs-pop]'), qbar = qpop.querySelector('[data-share]'), qbase = qbar.dataset.url, quote = '', qt;
    var tf = function (x) { return E(x).replace(/-/g, '%2D').replace(/,/g, '%2C'); };
    var frag = function (s) { var w = s.split(' '); return '#:~:text=' + (w.length > 10 ? tf(w.slice(0, 4).join(' ')) + ',' + tf(w.slice(-4).join(' ')) : tf(s)); };
    var qcheck = function () {
      var sel = getSelection(), s = sel.toString().replace(/\s+/g, ' ').trim(), n = s ? s.split(' ').length : 0, a = sel.rangeCount && sel.getRangeAt(0).commonAncestorContainer;
      a = a && (a.nodeType === 1 ? a : a.parentNode);
      if (n < 8 || n > 40 || !a || !qroot.contains(a) || a.closest('form,input,textarea,select,pre,code,[data-share]')) { if (qpop.hidden) qs.hidden = true; return; }
      quote = s; qpop.hidden = true; qs.hidden = false;
      var r = sel.getRangeAt(0).getBoundingClientRect(), W = document.documentElement.clientWidth;
      qs.style.top = (r.bottom + window.scrollY + 12) + 'px';
      qs.style.left = Math.max(16, Math.min(r.left + window.scrollX, W - 16 - qs.offsetWidth)) + 'px';
    };
    document.addEventListener('selectionchange', function () { clearTimeout(qt); qt = setTimeout(qcheck, 300); });
    document.addEventListener('pointerdown', function (e) { if (!qs.contains(e.target)) { qs.hidden = true; qpop.hidden = true; } });
    qs.querySelector('[data-qs-btn]').addEventListener('click', function () {
      shareSet(qbar, qbase + frag(quote), '“' + quote + '” — via 100xFounder');
      qpop.hidden = false;
      qs.style.left = Math.max(16, Math.min(parseFloat(qs.style.left), document.documentElement.clientWidth - 16 - qs.offsetWidth)) + 'px';
    });
  }

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

  // 100X Meter: gauge, one tap per reader per day, the tap moment, level messages,
  // and "Your 100X list" + streak kept only in this browser (localStorage, every call guarded).
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var meterDay = new Date().toDateString();
  var ymd = function (d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var lsGet = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var lsSet = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var mine = function () { try { return JSON.parse(lsGet('xf_100x')) || {}; } catch (e) { return {}; } };
  var esc = function (v) { return String(v).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var lvlMsg = function (n) {
    return n >= 100 ? 'Breakout. Readers pushed this one all the way.' : n >= 50 ? 'Half way to 100X. The crowd is noticing.'
      : n >= 25 ? 'Picking up steam. Thanks for the push.' : n >= 10 ? 'Momentum building. Your tap counts.' : 'You’re early. First believers matter most.';
  };
  var remember = function (id, slug, name, lvl) {
    var o = mine(), e = o[id] || { s: slug, n: name, l: lvl, d: [] }, t = ymd();
    if (e.d.indexOf(t) < 0) e.d = e.d.concat(t).slice(-60);
    o[id] = e; lsSet('xf_100x', JSON.stringify(o)); lsSet('xf_meter_' + id, meterDay);
  };
  // Startups backed in the last 7 days, and consecutive days (ending today or yesterday) with a tap.
  var stats = function (o) {
    var days = {}, wk = 0, from = ymd(new Date(Date.now() - 6 * 864e5)), k, n = 0, d = new Date();
    for (k in o) { o[k].d.forEach(function (x) { days[x] = 1; }); if (o[k].d.some(function (x) { return x >= from; })) wk++; }
    if (!days[ymd(d)]) d.setDate(d.getDate() - 1);
    while (days[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
    return { wk: wk, streak: n, all: Object.keys(o).length };
  };
  var sumLine = function (s) {
    return (s.wk ? 'You’ve backed ' + s.wk + ' startup' + (s.wk > 1 ? 's' : '') + ' this week' : 'Your 100X list') + (s.streak > 1 ? ' · 🔥 ' + s.streak + '-day streak' : '');
  };
  var post = function (url, id, t, hp) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: +id, t: t, website: hp || '' }) }).then(function (r) { return r.json(); });
  };
  var meterSet = function (m, n) {
    var arc = m.querySelector('.xf-meter__arc'), needle = m.querySelector('.xf-meter__needle');
    if (arc) arc.setAttribute('stroke-dasharray', n + ' 100');
    if (needle) needle.style.transform = 'rotate(' + (-90 + 1.8 * n) + 'deg)';
  };
  var countUp = function (el, to) {
    var from = +el.textContent || 0, t0 = performance.now();
    if (RM || from === to) { el.textContent = to; return; }
    (function step(t) { var p = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  };
  // A short burst of gradient sparks off the end of the arc.
  var sparks = function (m, n) {
    var g = m.querySelector('.xf-meter__gauge svg');
    if (RM || !g) return;
    var r = g.getBoundingClientRect(), P = 30, k = r.width / 260, q = window.devicePixelRatio || 1, c = document.createElement('canvas'), x = c.getContext('2d'), a = Math.PI * (1 - n / 100), ps = [], f = 0, i, th, v;
    c.className = 'xf-meter__fx'; c.width = (r.width + 2 * P) * q; c.height = (r.height + 2 * P) * q; c.style.width = r.width + 2 * P + 'px'; c.style.height = r.height + 2 * P + 'px';
    g.parentNode.appendChild(c); x.scale(q, q);
    for (i = 0; i < 24; i++) { th = Math.random() * 6.283; v = 1 + Math.random() * 3; ps.push([P + (130 + 110 * Math.cos(a)) * k, P + (130 - 110 * Math.sin(a)) * k, Math.cos(th) * v, Math.sin(th) * v - 1.6, ['#7c5cff', '#b07cff', '#ff6ad5', '#6a7bff', '#fff'][i % 5]]); }
    (function tick() {
      x.clearRect(0, 0, c.width, c.height); x.globalAlpha = 1 - f / 42;
      ps.forEach(function (p) { p[0] += p[2]; p[1] += p[3]; p[3] += 0.12; x.fillStyle = p[4]; x.beginPath(); x.arc(p[0], p[1], 2.2, 0, 6.283); x.fill(); });
      if (++f < 42) requestAnimationFrame(tick); else c.remove();
    })();
  };
  document.querySelectorAll('[data-meter]').forEach(function (m) {
    var id = m.getAttribute('data-meter'), arc = m.querySelector('.xf-meter__arc'), btn = m.querySelector('[data-meter-tap]'), msg = m.querySelector('[data-meter-msg]'), lvlEl = m.querySelector('[data-meter-level]'), mineEl = m.querySelector('[data-meter-mine]');
    requestAnimationFrame(function () { requestAnimationFrame(function () { meterSet(m, arc ? +arc.getAttribute('data-to') : 0); }); });
    var showMine = function () { var s = stats(mine()); if (mineEl && s.all) { mineEl.textContent = sumLine(s) + ' →'; mineEl.hidden = false; } };
    var counted = function () { if (btn) { btn.disabled = true; btn.lastChild.textContent = 'Counted today'; } };
    showMine();
    if (lsGet('xf_meter_' + id) === meterDay) { counted(); if (msg) msg.textContent = lvlMsg(+lvlEl.textContent); }
    if (!btn) return;
    btn.addEventListener('click', function () {
      var hp = m.querySelector('.xf-hp');
      btn.disabled = true;
      post(m.getAttribute('data-endpoint'), id, m.getAttribute('data-t'), hp && hp.value).then(function (d) {
        var info = d && d.data && d.data.level !== undefined ? d.data : d, st = m.querySelector('[data-meter-stage]');
        if (info && typeof info.level === 'number') {
          countUp(lvlEl, info.level);
          var tp = m.querySelector('[data-meter-taps]'); tp.textContent = info.taps_30d; tp.nextSibling.textContent = (info.taps_30d === 1 ? ' tap' : ' taps') + ' \u00b7 30 days';
          meterSet(m, info.level);
          if (st && info.stage) st.textContent = info.stage;
        }
        if (d && typeof d.level === 'number') {
          m.classList.add('xf-meter--pop'); sparks(m, d.level);
          if (navigator.vibrate) navigator.vibrate(12);
          remember(id, m.getAttribute('data-slug'), m.getAttribute('data-name'), d.level);
          var bd = m.querySelector('[data-meter-badge]'); if (bd) bd.src = bd.src.replace(/([?&]v=)\d*/, '$1' + Date.now());
          counted(); showMine(); if (msg) msg.textContent = lvlMsg(d.level);
          var mo = m.querySelector('[data-moment]'), mb = mo && mo.querySelector('[data-share]');
          if (mb && !lsGet('xf_moment_x_' + id)) { shareSet(mb, mb.dataset.url, 'I just backed ' + m.getAttribute('data-name') + ' at ' + d.level + 'X on 100xFounder ⚡'); mo.hidden = false; }
        } else if (d && d.code === 'already') { lsSet('xf_meter_' + id, meterDay); counted(); if (msg) msg.textContent = d.message; }
        else { btn.disabled = false; if (msg) msg.textContent = (d && d.message) || 'Could not save that. Please try again.'; }
      }).catch(function () { btn.disabled = false; if (msg) msg.textContent = 'Could not save that. Please try again.'; });
    });
  });

  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-moment-x]'), m = x && x.closest('[data-meter]');
    if (!m) return;
    x.parentNode.hidden = true; lsSet('xf_moment_x_' + m.getAttribute('data-meter'), '1');
  });

  // Leaderboard: tap straight from a row, and "Load more".
  document.querySelectorAll('[data-lb]').forEach(function (lb) {
    var note = lb.querySelector('[data-lb-msg]'), more = lb.querySelector('[data-lb-more]');
    var mark = function () { lb.querySelectorAll('[data-lb-id]').forEach(function (r) { if (lsGet('xf_meter_' + r.getAttribute('data-lb-id')) === meterDay) { var b = r.querySelector('[data-lb-tap]'); b.disabled = true; b.classList.add('done'); } }); };
    mark();
    lb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb-tap]'), r = b && b.closest('[data-lb-id]'), id;
      if (!r) return;
      id = r.getAttribute('data-lb-id'); b.disabled = true;
      post(lb.getAttribute('data-endpoint'), id, r.getAttribute('data-t')).then(function (d) {
        var ok = d && typeof d.level === 'number', info = ok ? d : d && d.data;
        if (info && typeof info.level === 'number') { countUp(r.querySelector('[data-lb-level]'), info.level); r.querySelector('[data-lb-bar]').style.width = info.level + '%'; if (info.stage) r.querySelector('[data-lb-stage]').textContent = info.stage; }
        if (ok) { remember(id, r.getAttribute('data-slug'), r.getAttribute('data-name'), d.level); b.classList.add('done'); if (navigator.vibrate) navigator.vibrate(12); }
        else if (d && d.code === 'already') { lsSet('xf_meter_' + id, meterDay); b.classList.add('done'); } else b.disabled = false;
        if (note) note.textContent = ok ? r.getAttribute('data-name') + ': ' + lvlMsg(d.level) : (d && d.message) || 'Could not save that. Please try again.';
      }).catch(function () { b.disabled = false; });
    });
    if (more) more.addEventListener('click', function () {
      more.disabled = true;
      fetch(more.getAttribute('data-src') + '&offset=' + more.getAttribute('data-offset')).then(function (r) { return r.json(); }).then(function (d) {
        lb.querySelector('[data-lb-list]').insertAdjacentHTML('beforeend', d.html || '');
        more.setAttribute('data-offset', lb.querySelectorAll('[data-lb-id]').length); more.disabled = false; more.hidden = !d.more; mark();
      }).catch(function () { more.disabled = false; });
    });
  });

  // /my-100x/: the browser's own list, with today's levels and milestones crossed since backing.
  document.querySelectorAll('[data-my100x]').forEach(function (box) {
    var o = mine(), ids = Object.keys(o), s = stats(o), sum = document.querySelector('[data-my100x-sum]');
    if (!ids.length) { box.querySelector('[data-my100x-empty]').hidden = false; return; }
    if (sum) sum.textContent = ids.length + ' startup' + (ids.length > 1 ? 's' : '') + ' backed' + (s.wk ? ' · ' + s.wk + ' this week' : '') + (s.streak > 1 ? ' · 🔥 ' + s.streak + '-day streak' : '');
    ids.sort(function (a, b) { return o[b].d[o[b].d.length - 1] > o[a].d[o[a].d.length - 1] ? 1 : -1; });
    fetch(box.getAttribute('data-endpoint') + '?ids=' + ids.slice(0, 50).join(',')).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (lv) {
      var rows = '', notes = '';
      ids.forEach(function (id) {
        var e = o[id], v = lv[id], n = v ? v.level : null, ms = [100, 50, 25, 10].filter(function (x) { return n !== null && e.l < x && n >= x; })[0];
        if (ms) notes += '<li>' + esc(v.name) + ' crossed ' + ms + 'X since you backed it. You were early.</li>';
        rows += '<li class="xf-lb__row"><span class="xf-lb__rank mono">' + e.d.length + '×</span><a class="xf-lb__who" href="' + esc(v ? v.url : '/?s=' + encodeURIComponent(e.n)) + '"><span class="xf-lb__name"><b>' + esc(v ? v.name : e.n) + '</b><small>Last backed ' + esc(e.d[e.d.length - 1]) + '</small></span></a>'
          + (v ? '<span class="xf-stage">' + esc(v.stage) + '</span><span class="xf-lb__bar"><span style="width:' + n + '%"></span></span><span class="xf-lb__lvl mono">' + n + 'X</span>' : '<span class="xf-lb__lvl mono">—</span>') + '</li>';
      });
      box.querySelector('[data-my100x-notes]').innerHTML = notes;
      box.querySelector('[data-my100x-list]').innerHTML = rows;
    });
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
