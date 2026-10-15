/* 100Xfounder free tools. Runs in the browser; nothing is sent anywhere.
   Tax rules: tax year 2026-27 under the Income-tax Act, 2025 (in force 1 April 2026; slabs unchanged by Budget 2026).
   PF: EPF wage ceiling ₹25,000 a month from 17 September 2026 (S.O. 5109(E)), so the capped PF is ₹3,000. */
(function () {
  'use strict';
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var slabTax = function (income, slabs) {
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      var upto = slabs[i][0], rate = slabs[i][1];
      if (income > prev) tax += (Math.min(income, upto) - prev) * rate;
      prev = upto;
    }
    return tax;
  };
  var NEW = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
  var OLD = [[250000, 0], [500000, .05], [1000000, .20], [Infinity, .30]];
  var surchargeRate = function (income, regime) {
    if (income > 50000000 && regime === 'old') return .37;
    if (income > 20000000) return .25;
    if (income > 10000000) return .15;
    if (income > 5000000) return .10;
    return 0;
  };

  /** Annual tax (incl. 4% cess) on taxable income under a regime. */
  function incomeTax(taxable, regime) {
    taxable = Math.max(0, taxable);
    var tax = slabTax(taxable, regime === 'new' ? NEW : OLD);
    if (regime === 'new') {
      if (taxable <= 1200000) tax = 0; // Section 87A rebate
      else tax = Math.min(tax, taxable - 1200000); // marginal relief just above ₹12L
    } else if (taxable <= 500000) {
      tax = 0;
    }
    tax += tax * surchargeRate(taxable, regime);
    return tax * 1.04;
  }

  /** CTC → take-home, with the assumptions shown on the page. */
  function salary(o) {
    var ctc = Math.max(0, o.ctc);
    var basic = ctc * o.basicPct;
    var pfMonthlyCap = o.pfCap ? 3000 : Infinity;
    var pf = Math.min(basic * 0.12, pfMonthlyCap * 12); // each side
    var gratuity = basic * 0.0481;
    var gross = Math.max(0, ctc - pf - gratuity);
    var pt = gross > 0 ? Math.min(o.pt, gross) : 0;
    var taxable;
    if (o.regime === 'new') {
      taxable = gross - 75000;
    } else {
      var hra = basic * (o.metro ? .5 : .4);
      var rent = o.rent * 12;
      var hraExempt = rent > 0 ? Math.max(0, Math.min(hra, rent - basic * .1, basic * (o.metro ? .5 : .4))) : 0;
      var c80 = Math.min(150000, Math.max(o.deductions, pf));
      taxable = gross - 50000 - hraExempt - c80 - pt;
    }
    var tax = incomeTax(taxable, o.regime);
    var inHand = Math.max(0, gross - pf - pt - tax);
    return { ctc: ctc, basic: basic, gross: gross, pf: pf, gratuity: gratuity, pt: pt, taxable: Math.max(0, taxable), tax: tax, inHand: inHand };
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var num = function (el) { return Math.max(0, parseFloat(String(el.value).replace(/[^0-9.]/g, '')) || 0); };

  /* ---- In-hand salary ---- */
  var ih = $('[data-tool="in-hand"]');
  if (ih) {
    var state = { regime: 'new', metro: true };
    var seg = function (name, value) {
      ih.querySelectorAll('[data-' + name + ']').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-' + name) === String(value) ? 'true' : 'false'); });
    };
    var render = function () {
      var r = salary({ ctc: num($('#ctc', ih)), regime: state.regime, metro: state.metro, rent: num($('#rent', ih)), deductions: num($('#ded', ih)), pt: num($('#pt', ih)), basicPct: num($('#basic', ih)) / 100 || .5, pfCap: $('#pfcap', ih).checked });
      $('#ih-monthly', ih).textContent = inr(r.inHand / 12);
      $('#ih-yearly', ih).textContent = inr(r.inHand);
      $('#ih-rate', ih).textContent = (r.ctc ? (r.tax / r.ctc * 100) : 0).toFixed(1) + '%';
      $('#ih-regime', ih).textContent = state.regime === 'new' ? 'New regime' : 'Old regime';
      var rows = [['Gross salary', r.gross], ['Employee PF', -r.pf], ['Professional tax', -r.pt], ['Income tax + cess', -r.tax], ['In-hand', r.inHand], ['Employer PF (in CTC)', r.pf], ['Gratuity (in CTC)', r.gratuity]];
      $('#ih-rows', ih).innerHTML = rows.map(function (row) {
        var strong = row[0] === 'In-hand';
        return '<div class="br"' + (strong ? ' style="color:var(--tx);font-weight:600"' : ' style="color:var(--t2)"') + '><span>' + row[0] + '</span><span class="mono" style="display:flex;gap:28px"><span style="width:110px;text-align:right">' + (row[1] < 0 ? '−' : '') + inr(Math.abs(row[1]) / 12) + '</span><span class="hs" style="width:120px;text-align:right;color:var(--t3)">' + (row[1] < 0 ? '−' : '') + inr(Math.abs(row[1])) + '</span></span></div>';
      }).join('');
      var total = r.ctc || 1;
      $('#bar-hand', ih).style.width = (r.inHand / total * 100) + '%';
      $('#bar-tax', ih).style.width = (r.tax / total * 100) + '%';
      $('#bar-pf', ih).style.width = (r.pf * 2 / total * 100) + '%';
      $('#bar-other', ih).style.width = ((r.gratuity + r.pt) / total * 100) + '%';
      ih.querySelectorAll('[data-old-only]').forEach(function (el) { el.hidden = state.regime !== 'old'; });
      var other = salary({ ctc: r.ctc, regime: state.regime === 'new' ? 'old' : 'new', metro: state.metro, rent: num($('#rent', ih)), deductions: num($('#ded', ih)), pt: num($('#pt', ih)), basicPct: num($('#basic', ih)) / 100 || .5, pfCap: $('#pfcap', ih).checked });
      var diff = other.inHand - r.inHand;
      $('#ih-compare', ih).textContent = Math.abs(diff) < 12 ? 'Both regimes give about the same take-home.' :
        (diff > 0 ? 'The ' + (state.regime === 'new' ? 'old' : 'new') + ' regime would give you about ' + inr(diff / 12) + ' more a month.' :
          'This regime gives you about ' + inr(-diff / 12) + ' more a month than the ' + (state.regime === 'new' ? 'old' : 'new') + ' regime.');
    };
    ih.addEventListener('input', render);
    ih.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-regime')) { state.regime = b.getAttribute('data-regime'); seg('regime', state.regime); }
      if (b.hasAttribute('data-metro')) { state.metro = b.getAttribute('data-metro') === 'true'; seg('metro', state.metro); }
      if (b.hasAttribute('data-preset')) { $('#ctc', ih).value = b.getAttribute('data-preset'); }
      render();
    });
    render();
  }

  /* ---- Salary hike ---- */
  var hk = $('[data-tool="hike"]');
  if (hk) {
    var renderHike = function () {
      var cur = num($('#cur', hk));
      var pct = parseFloat($('#pct', hk).value) || 0;
      var next = num($('#newctc', hk));
      var mode = $('#mode-pct', hk).checked ? 'pct' : 'ctc';
      if (mode === 'pct') { next = cur * (1 + pct / 100); } else { pct = cur ? (next / cur - 1) * 100 : 0; }
      var regime = $('#hk-old', hk).checked ? 'old' : 'new';
      var base = { regime: regime, metro: true, rent: 0, deductions: 150000, pt: 2500, basicPct: .5, pfCap: true };
      var a = salary(Object.assign({ ctc: cur }, base));
      var b = salary(Object.assign({ ctc: next }, base));
      $('#hk-new', hk).textContent = inr(next);
      $('#hk-pct', hk).textContent = pct.toFixed(1) + '%';
      $('#hk-before', hk).textContent = inr(a.inHand / 12);
      $('#hk-after', hk).textContent = inr(b.inHand / 12);
      $('#hk-diff', hk).textContent = '+' + inr(Math.max(0, b.inHand - a.inHand) / 12);
      $('#hk-take', hk).textContent = (next > cur ? ((b.inHand - a.inHand) / (next - cur) * 100) : 0).toFixed(0) + '%';
      hk.querySelector('[data-pct-field]').hidden = mode !== 'pct';
      hk.querySelector('[data-ctc-field]').hidden = mode !== 'ctc';
    };
    hk.addEventListener('input', renderHike);
    renderHike();
  }

  /* ---- Notice period buyout ---- */
  var nb = $('[data-tool="notice"]');
  if (nb) {
    var renderNotice = function () {
      var monthly = num($('#nb-salary', nb));
      var total = num($('#nb-total', nb));
      var served = Math.min(num($('#nb-served', nb)), total);
      var leave = Math.min(num($('#nb-leave', nb)), total - served);
      var divisor = $('#nb-days', nb).value === '26' ? 26 : 30;
      var remaining = Math.max(0, total - served - leave);
      var amount = monthly / divisor * remaining;
      $('#nb-remaining', nb).textContent = remaining + ' days';
      $('#nb-amount', nb).textContent = inr(amount);
      $('#nb-perday', nb).textContent = inr(monthly / divisor) + ' per day';
    };
    nb.addEventListener('input', renderNotice);
    renderNotice();
  }

  /* ---- Startup 100X score (quiz). Weights add up to 100; nothing leaves the browser unless the reader asks for the email. ---- */
  var QUIZ = [
    ['Stage', 'Where is the product today?', [['Idea', 2], ['Building the MVP', 4], ['Live with first users', 7], ['Paying customers', 10]], 'Get to paying customers: one paying user teaches you more than a long waitlist.'],
    ['Revenue', 'Monthly revenue right now?', [['None yet', 1], ['Under ₹1 lakh', 5], ['₹1–10 lakh', 9], ['Over ₹10 lakh', 12]], 'Put a price on it this month, even a small one, and see who pays.'],
    ['Growth', 'Average monthly growth over the last 3 months?', [['Flat or not tracked', 2], ['Under 5%', 5], ['5–15%', 10], ['Over 15%', 14]], 'Pick one weekly growth number, track it, and run one experiment a week to move it.'],
    ['Retention', 'Of users who joined 3 months ago, how many still use it?', [['Not sure', 1], ['Under 10%', 4], ['10–40%', 8], ['Over 40%', 12]], 'Call five users who stopped using it and fix the top reason before building anything new.'],
    ['Team', 'Who is building it?', [['Solo, part-time', 2], ['Solo, full-time', 5], ['2+ full-time founders', 8], ['Founders plus first hires', 10]], 'Find a full-time co-founder or first hire who covers your weakest skill.'],
    ['Distribution', 'How do new users find you?', [['Not sure yet', 2], ['Word of mouth', 6], ['One channel that works', 8], ['Several channels', 10]], 'Ask where your last 20 customers came from and double down on the top source.'],
    ['Funding', 'How much runway do you have?', [['Under 3 months', 1], ['3–9 months', 3], ['9–18 months', 5], ['18+ months or profitable', 6]], 'Cut spend or bring in revenue until you have at least 12 months of runway.'],
    ['Moat', 'What stops a copycat?', [['Nothing yet', 1], ['Speed and execution', 4], ['Own data or tech', 7], ['Network effects or switching costs', 8]], 'Write down what gets better for users as you grow, and build towards it.'],
    ['Market', 'How big is the problem you solve?', [['Small niche', 2], ['Sizeable niche', 5], ['Large market', 7], ['Large and growing fast', 9]], 'Size the market bottom-up: how many buyers, and what each would pay a year.'],
    ['Speed', 'How often do you ship to users?', [['Monthly or slower', 2], ['Every 2 weeks', 5], ['Every week', 7], ['Several times a week', 9]], 'Ship something users can see every week, even if it is small.']
  ];
  /** picks: one option index (or -1) per question → {score, done, tips}. */
  function quizScore(picks) {
    var score = 0, done = 0, gaps = [];
    QUIZ.forEach(function (q, i) {
      var max = q[2][q[2].length - 1][1];
      if (picks[i] < 0) return;
      var pts = q[2][picks[i]][1];
      score += pts; done++;
      gaps.push([pts / max, i]);
    });
    gaps.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return { score: score, done: done === QUIZ.length, tips: gaps.slice(0, 3).map(function (g) { return QUIZ[g[1]][3]; }) };
  }
  var quizBand = function (n) { return n < 30 ? 'Early' : n < 60 ? 'Traction' : n < 85 ? 'Scaling' : 'Breakout'; };
  console.assert(quizScore(QUIZ.map(function (q) { return q[2].length - 1; })).score === 100 && quizScore(QUIZ.map(function () { return -1; })).score === 0, 'quiz weights must add up to 100');

  var mq = $('[data-tool="meter100x"]');
  if (mq) {
    var picks = QUIZ.map(function () { return -1; });
    var box = $('[data-quiz]', mq), last = null;
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var setGauge = function (n) {
      var arc = mq.querySelector('.xf-meter__arc'), needle = mq.querySelector('.xf-meter__needle');
      if (arc) arc.setAttribute('stroke-dasharray', n + ' 100');
      if (needle) needle.style.transform = 'rotate(' + (-90 + 1.8 * n) + 'deg)';
    };
    var renderQuiz = function () {
      box.innerHTML = QUIZ.map(function (q, i) {
        return '<fieldset class="xf-quiz__q"><legend><span class="k">' + (i + 1) + ' · ' + q[0] + '</span><br>' + esc(q[1]) + '</legend><div class="xf-quiz__opts">' +
          q[2].map(function (o, j) { return '<button type="button" class="xf-quiz__opt" data-q="' + i + '" data-o="' + j + '" aria-pressed="' + (picks[i] === j) + '">' + esc(o[0]) + '</button>'; }).join('') + '</div></fieldset>';
      }).join('');
    };
    var renderResult = function () {
      var r = quizScore(picks);
      last = r;
      $('[data-q-score]', mq).textContent = r.score;
      $('[data-q-answered]', mq).textContent = picks.filter(function (p) { return p >= 0; }).length;
      $('[data-q-band]', mq).textContent = r.done ? quizBand(r.score) : 'Answer all 10';
      setGauge(r.score);
      $('[data-q-done]', mq).hidden = !r.done;
      if (!r.done) return;
      $('[data-q-tips]', mq).innerHTML = r.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      var url = location.origin + location.pathname, text = 'My startup scored ' + r.score + 'X on the 100X score. How 100X is yours?';
      var bar = $('[data-share]', mq);
      if (bar && window.xfShareSet) window.xfShareSet(bar, url, text);
    };
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (!b) return;
      picks[+b.getAttribute('data-q')] = +b.getAttribute('data-o');
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderResult();
    });

    /* Score card: 1080×1350 PNG in the site's style. */
    var wrapText = function (ctx, t, x, y, w, lh) {
      var words = t.split(' '), line = '';
      words.forEach(function (wd) {
        if (ctx.measureText(line + wd).width > w && line) { ctx.fillText(line.trim(), x, y); y += lh; line = ''; }
        line += wd + ' ';
      });
      ctx.fillText(line.trim(), x, y);
      return y + lh;
    };
    var drawCard = function (r) {
      var c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
      var x = c.getContext('2d');
      var grad = function (x0, x1) { var g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#7c5cff'); g.addColorStop(.45, '#b07cff'); g.addColorStop(.8, '#ff6ad5'); g.addColorStop(1, '#6a7bff'); return g; };
      x.fillStyle = '#0b0b0c'; x.fillRect(0, 0, 1080, 1350);
      var glow = x.createRadialGradient(900, 120, 0, 900, 120, 700); glow.addColorStop(0, 'rgba(124,92,255,.45)'); glow.addColorStop(1, 'rgba(124,92,255,0)');
      x.fillStyle = glow; x.fillRect(0, 0, 1080, 1350);
      x.fillStyle = grad(0, 1080); x.fillRect(0, 0, 1080, 8);
      x.fillStyle = '#b07cff'; x.font = '500 30px "Geist Mono", monospace'; x.fillText('MY STARTUP’S 100X SCORE', 80, 130);
      x.lineCap = 'round'; x.lineWidth = 44;
      x.strokeStyle = '#232326'; x.beginPath(); x.arc(540, 560, 300, Math.PI, 2 * Math.PI); x.stroke();
      x.strokeStyle = grad(240, 840); x.beginPath(); x.arc(540, 560, 300, Math.PI, Math.PI * (1 + Math.max(.001, r.score / 100))); x.stroke();
      x.textAlign = 'center'; x.fillStyle = grad(330, 750); x.font = '700 190px Inter, sans-serif'; x.fillText(r.score + 'X', 540, 560);
      x.fillStyle = '#f2f2ef'; x.font = '500 34px "Geist Mono", monospace'; x.fillText(quizBand(r.score).toUpperCase(), 540, 625);
      x.textAlign = 'left'; x.fillStyle = '#8c8c88'; x.font = '500 28px "Geist Mono", monospace'; x.fillText('BIGGEST LEVERS', 80, 760);
      var y = 820; x.font = '400 36px Inter, sans-serif';
      r.tips.forEach(function (t, i) { x.fillStyle = '#b07cff'; x.fillText((i + 1) + '.', 80, y); x.fillStyle = '#d6d6d2'; y = wrapText(x, t, 130, y, 870, 48) + 22; });
      x.fillStyle = '#f2f2ef'; x.font = '700 44px Inter, sans-serif'; x.fillText('100xFounder', 80, 1230);
      x.fillStyle = '#8c8c88'; x.font = '500 26px "Geist Mono", monospace'; x.fillText('100xfounder.com/tools/startup-100x-score', 80, 1280);
      return c;
    };
    $('[data-q-png]', mq).addEventListener('click', function () {
      if (!last || !last.done) return;
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
        drawCard(last).toBlob(function (blob) {
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-100x-score-' + last.score + 'x.png';
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        }, 'image/png');
      });
    });

    var form = $('[data-q-mail]', mq);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, msg = $('[data-q-mail-msg]', form), btn = form.querySelector('button[type=submit]');
      btn.disabled = true; msg.textContent = 'Sending…';
      fetch(form.getAttribute('data-endpoint'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: f.name.value, email: f.email.value, website: f.website.value, token: form.getAttribute('data-token'),
        consent_request: f.consent_request.checked, consent_news: f.consent_news.checked, score: last.score, tips: last.tips
      }) }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) { msg.textContent = 'Done. Your report is on its way to ' + f.email.value + '.'; form.reset(); }
        else { btn.disabled = false; msg.textContent = (d && d.message) || 'Could not send that. Please try again.'; }
      }).catch(function () { btn.disabled = false; msg.textContent = 'Could not send that. Please try again.'; });
    });

    renderQuiz();
    renderResult();
  }
})();
