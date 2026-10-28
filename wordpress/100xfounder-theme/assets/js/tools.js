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
  /** Slab tax after the Section 87A rebate (and its marginal relief in the new regime), before surcharge and cess. */
  var baseTax = function (taxable, regime) {
    var tax = slabTax(taxable, regime === 'new' ? NEW : OLD);
    if (regime === 'new') {
      if (taxable <= 1200000) return 0; // rebate: no tax up to ₹12 lakh
      return Math.min(tax, taxable - 1200000); // marginal relief just above ₹12 lakh
    }
    return taxable <= 500000 ? 0 : tax;
  };

  /** Annual tax (incl. surcharge with marginal relief, and 4% cess) on taxable income under a regime. */
  function incomeTax(taxable, regime) {
    taxable = Math.max(0, taxable);
    var base = baseTax(taxable, regime);
    var tax = base * (1 + surchargeRate(taxable, regime));
    // Marginal relief: tax + surcharge may not exceed the tax at the threshold plus the income above it.
    [50000000, 20000000, 10000000, 5000000].some(function (th) {
      if (taxable <= th) return false;
      tax = Math.min(tax, baseTax(th, regime) * (1 + surchargeRate(th, regime)) + (taxable - th));
      return true;
    });
    return tax * 1.04;
  }

  /** CTC → take-home, with the assumptions shown on the page. */
  function salary(o) {
    var ctc = Math.max(0, o.ctc);
    var basic = ctc * Math.min(1, Math.max(.1, o.basicPct)); // basic is kept between 10% and 100% of CTC
    var pfMonthlyCap = o.pfCap ? 3000 : Infinity;
    var pf = Math.min(basic * 0.12, pfMonthlyCap * 12); // each side
    var gratuity = basic * 0.0481;
    var gross = Math.max(0, ctc - pf - gratuity);
    var pt = Math.min(o.pt, gross);
    var taxable;
    if (o.regime === 'new') {
      taxable = gross - 75000;
    } else {
      // HRA paid is assumed to equal the exempt cap (50% / 40% of basic), but never more than the gross left after basic.
      var hra = Math.min(basic * (o.metro ? .5 : .4), Math.max(0, gross - basic));
      var hraExempt = Math.max(0, Math.min(hra, o.rent * 12 - basic * .1));
      var c80 = Math.min(150000, Math.max(o.deductions, pf));
      taxable = gross - 50000 - hraExempt - c80 - pt;
    }
    var tax = incomeTax(taxable, o.regime);
    var inHand = Math.max(0, gross - pf - pt - tax);
    return { ctc: ctc, basic: basic, gross: gross, pf: pf, gratuity: gratuity, pt: pt, taxable: Math.max(0, taxable), tax: tax, inHand: inHand };
  }

  /** Hike: new CTC from a % (or % from a new CTC) and the change in yearly take-home, same assumptions as the page states. */
  function hike(o) {
    var next = o.mode === 'pct' ? o.cur * (1 + o.pct / 100) : o.next;
    var pct = o.mode === 'pct' ? o.pct : (o.cur ? (next / o.cur - 1) * 100 : 0);
    next = Math.max(0, next);
    var base = { regime: o.regime, metro: true, rent: 0, deductions: 150000, pt: 2500, basicPct: .5, pfCap: true };
    var a = salary(Object.assign({ ctc: o.cur }, base)), b = salary(Object.assign({ ctc: next }, base));
    return { cur: o.cur, next: next, pct: pct, before: a.inHand, after: b.inHand, keep: next !== o.cur ? (b.inHand - a.inHand) / (next - o.cur) * 100 : 0 };
  }

  /** Notice buyout: unserved days (after leave set-off) × monthly pay ÷ divisor. */
  function notice(o) {
    var served = Math.min(o.served, o.total);
    var leave = Math.min(o.leave, o.total - served);
    var remaining = Math.max(0, o.total - served - leave);
    var perDay = o.monthly / o.divisor;
    return { remaining: remaining, perDay: perDay, amount: perDay * remaining };
  }

  /* ---- Founder and AI calculators (pure maths; the page wiring is further down) ---- */

  /** LLM API cost. Prices are USD per million tokens; cachedShare is the share of input tokens read from cache (0–1). Batch halves every rate. */
  function tokenCost(o) {
    var share = Math.min(1, Math.max(0, o.cachedShare || 0));
    var perCall = (o.inTok * (1 - share) * o.inPrice + o.inTok * share * o.cachePrice + o.outTok * o.outPrice) / 1e6;
    if (o.batch) perCall *= 0.5;
    return { perCall: perCall, perDay: perCall * o.calls, perMonth: perCall * o.calls * 30, perYear: perCall * o.calls * 365 };
  }

  /** Months until cash runs out. Revenue grows by `growth` (fraction) a month; burn stays flat. months is null if cash never runs out within 50 years. */
  function runway(o) {
    var net = o.grossBurn - o.revenue;
    var simple = net > 0 ? o.cash / net : null;
    var cash = o.cash, months = null;
    for (var m = 1; m <= 600; m++) {
      var netM = o.grossBurn - o.revenue * Math.pow(1 + (o.growth || 0), m - 1);
      if (netM > 0 && cash - netM < 0) { months = (m - 1) + cash / netM; break; }
      cash -= netM;
    }
    var zero = null;
    if (months !== null && o.start) {
      zero = new Date(o.start.getTime());
      var whole = Math.floor(months);
      zero.setMonth(zero.getMonth() + whole);
      zero.setDate(zero.getDate() + Math.round((months - whole) * 30.44));
    }
    return { netBurn: net, simpleMonths: simple, months: months, zeroDate: zero, defaultAlive: months === null };
  }

  /** Cap table after one priced round. SAFEs are post-money (cap measured on founders + pool + SAFEs, before the pool top-up)
      and take the better of cap and discount; the pool top-up to `poolTarget` (of post-money) comes out of the pre-money. */
  function capTable(o) {
    var base = o.founders + o.pool, safes = o.safes || [];
    var price = 0, top = 0, safeShares = safes.map(function () { return 0; }), inv = 0;
    for (var it = 0; it < 200; it++) {
      var totalSafe = safeShares.reduce(function (a, b) { return a + b; }, 0);
      var preShares = base + totalSafe + top;
      price = o.preMoney / preShares;
      inv = o.invest / price;
      var post = preShares + inv;
      top = Math.max(0, o.poolTarget * post - o.pool);
      safeShares = safes.map(function (sf) {
        var byCap = sf.cap > 0 ? sf.amount / sf.cap * (base + totalSafe) : 0;
        var byDisc = sf.amount / (price * (1 - (sf.discount || 0)));
        return sf.cap > 0 && !(sf.discount > 0) ? byCap : Math.max(byCap, byDisc);
      });
    }
    var post = base + top + inv + safeShares.reduce(function (a, b) { return a + b; }, 0);
    var rows = [{ name: 'Founders', before: o.founders, after: o.founders }, { name: 'Option pool', before: o.pool, after: o.pool + top }]
      .concat(safes.map(function (sf, i) { return { name: 'SAFE ' + (i + 1), before: 0, after: safeShares[i] }; }))
      .concat([{ name: 'New investors', before: 0, after: inv }]);
    rows.forEach(function (r) { r.pctBefore = base ? r.before / base * 100 : 0; r.pctAfter = post ? r.after / post * 100 : 0; });
    return { price: price, postMoney: o.preMoney + o.invest, poolTopUp: top, totalShares: post, rows: rows };
  }

  /** Weighted-factor equity split: weights per factor, scores[founder][factor] (0–10). Returns percentages. */
  function equitySplit(o) {
    var pts = o.scores.map(function (row) { return row.reduce(function (a, v, i) { return a + v * (o.weights[i] || 0); }, 0); });
    var total = pts.reduce(function (a, b) { return a + b; }, 0);
    return pts.map(function (p) { return total ? p / total * 100 : 100 / pts.length; });
  }

  /** AI ROI: hours saved a week per user × hourly cost, against licence cost per user a month and a one-off setup cost. */
  function aiRoi(o) {
    var value = o.users * (o.adoption == null ? 1 : o.adoption) * o.hours * (52 / 12) * o.rate;
    var cost = o.users * o.toolCost;
    var net = value - cost;
    var yearCost = cost * 12 + o.setup;
    return { monthlyValue: value, monthlyCost: cost, monthlyNet: net, hoursPerMonth: o.users * (o.adoption == null ? 1 : o.adoption) * o.hours * (52 / 12),
      roiYear1: yearCost > 0 ? (value * 12 - yearCost) / yearCost * 100 : null, paybackMonths: net > 0 ? o.setup / net : null };
  }

  /** SaaS metrics. Rates are fractions (0.03 = 3%). Any metric whose inputs make it undefined comes back null. */
  var saas = {
    cac: function (o) { return o.newCustomers > 0 ? o.spend / o.newCustomers : null; },
    ltv: function (o) { return o.churn > 0 ? o.arpa * o.margin / o.churn : null; },
    ltvCac: function (o) { var l = saas.ltv(o), c = saas.cac(o); return l !== null && c ? l / c : null; },
    payback: function (o) { return o.arpa * o.margin > 0 ? o.cac / (o.arpa * o.margin) : null; },
    mrr: function (o) { var m = o.customers * o.arpa; return { mrr: m, arr: m * 12 }; },
    churn: function (o) { return o.start > 0 ? o.lost / o.start : null; },
    nrr: function (o) { return o.start > 0 ? (o.start + o.expansion - o.contraction - o.churned) / o.start : null; },
    rule40: function (o) { return o.growth + o.margin; }
  };

  /** Startup cost: one-time items + monthly items × months until revenue, plus a contingency buffer (fraction). */
  function startupCost(o) {
    var sum = function (a) { return (a || []).reduce(function (x, y) { return x + y; }, 0); };
    var one = sum(o.oneTime), monthly = sum(o.monthly), run = monthly * o.months;
    var buffer = (one + run) * (o.buffer || 0);
    return { oneTime: one, monthly: monthly, running: run, buffer: buffer, total: one + run + buffer };
  }

  /** ESOP: monthly vesting after a cliff; Indian tax as the page explains (perquisite at exercise taxed at the slab rate,
      capital gain at sale at 12.5% if held over 24 months, else the slab rate; 4% cess; surcharge not modelled). */
  function esop(o) {
    var total = o.vestYears * 12;
    var vested = o.monthsServed < o.cliffMonths || total <= 0 ? 0 : Math.floor(o.granted * Math.min(o.monthsServed, total) / total);
    var exercise = vested * o.strike;
    var perq = vested * Math.max(0, o.fmv - o.strike);
    var gain = vested * (o.exitPrice - o.fmv);
    var perqTax = perq * o.taxRate * 1.04;
    var cgTax = Math.max(0, gain) * (o.longTerm ? 0.125 : o.taxRate) * 1.04;
    var gross = vested * o.exitPrice;
    return { vested: vested, vestedPct: o.granted ? vested / o.granted * 100 : 0, exerciseCost: exercise, perquisite: perq, perqTax: perqTax,
      gain: gain, cgTax: cgTax, grossAtExit: gross, net: gross - exercise - perqTax - cgTax };
  }

  /** GPU cost: instance price per hour × instances × hours a day × days. */
  function gpuCost(o) {
    var hours = o.instances * o.hoursPerDay * o.days;
    var total = o.price * hours;
    return { total: total, instanceHours: hours, gpuHours: hours * o.gpus, perGpuHour: o.gpus > 0 ? o.price / o.gpus : null, perMonth: o.price * o.instances * o.hoursPerDay * 30 };
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  /* Tool pages: the grouped tools sidebar collapses to a dropdown on phones. */
  var side = $('[data-tl-side]');
  if (side && window.matchMedia && matchMedia('(max-width:860px)').matches) side.open = false;
  var usd = function (n, dp) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: dp == null ? 2 : dp, maximumFractionDigits: dp == null ? 2 : dp }); };
  var pctf = function (n, dp) { return n.toFixed(dp == null ? 1 : dp) + '%'; };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode: the ask just never shows */ } }
  };

  /** Reads number fields and collects errors; ok() shows the first error inline and blanks the outputs instead of NaN. */
  function form(root) {
    var errs = [];
    return {
      n: function (id, label, o) {
        o = o || {};
        var raw = String($('#' + id, root).value).replace(/[,₹$\s]/g, '');
        if (raw === '') { if ('dflt' in o) return o.dflt; errs.push('Enter ' + label + '.'); return 0; }
        var v = Number(raw);
        if (!isFinite(v)) { errs.push(label.charAt(0).toUpperCase() + label.slice(1) + ' must be a number.'); return 0; }
        if (o.min != null && v < o.min) { errs.push(label.charAt(0).toUpperCase() + label.slice(1) + ' can’t be below ' + o.min.toLocaleString('en-IN') + '.'); return 0; }
        if (o.max != null && v > o.max) { errs.push(label.charAt(0).toUpperCase() + label.slice(1) + ' can’t be above ' + o.max.toLocaleString('en-IN') + '.'); return 0; }
        return v;
      },
      err: function (m) { errs.push(m); },
      ok: function () {
        var box = $('[data-err]', root);
        if (box) { box.textContent = errs[0] || ''; box.hidden = !errs.length; }
        if (errs.length) {
          root.querySelectorAll('[data-out]').forEach(function (e) { e.textContent = '–'; });
          root.querySelectorAll('[data-out-html]').forEach(function (e) { e.innerHTML = ''; });
        }
        return !errs.length;
      }
    };
  }

  /* ---- Soft email ask: after 15 calculations across all tools. Counted in this browser only; nothing is sent until the form. ---- */
  var LEAD_AT = 15, DAY = 864e5;
  /** Pure: should the ask show? st = {n, until, done}. */
  function leadDue(st, now) { return st.n >= LEAD_AT && !st.done && now >= (st.until || 0); }
  var leadBox = $('[data-calc-lead]');
  var leadShow = function () {
    var st = { n: +store.get('xf_calc_n') || 0, until: +store.get('xf_calc_lead_until') || 0, done: store.get('xf_calc_lead_done') === '1' };
    if (!leadBox || leadBox.firstChild || !leadDue(st, Date.now())) return;
    leadBox.innerHTML = '<div class="tl-lead" role="region" aria-label="Get your results by email"><button type="button" class="tl-lead__x" aria-label="Close" data-lead-no>×</button>' +
      '<p class="tl-lead__t">Want your results and new founder tools by email?</p>' +
      '<form data-lead-form novalidate><div class="tl-lead__row"><label><span class="k">Name (optional)</span><input name="name" autocomplete="name" maxlength="80"></label>' +
      '<label><span class="k">Email</span><input name="email" type="email" autocomplete="email" required></label></div>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">' +
      '<label class="tl-lead__ck"><input type="checkbox" name="consent"> <span></span></label>' +
      '<div class="tl-lead__row"><button type="submit" class="btn btn-w btn-sm">Email me</button><button type="button" class="btn btn-sm" data-lead-no>No thanks</button></div>' +
      '<p class="k" data-lead-msg role="status" style="text-transform:none;letter-spacing:0"></p></form></div>';
    leadBox.querySelector('.tl-lead__ck span').textContent = leadBox.getAttribute('data-consent');
    leadBox.addEventListener('click', function (e) {
      if (!e.target.closest('[data-lead-no]')) return;
      store.set('xf_calc_lead_until', String(Date.now() + 30 * DAY));
      leadBox.innerHTML = '';
    });
    var fm = leadBox.querySelector('[data-lead-form]');
    fm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = fm.elements, msg = $('[data-lead-msg]', fm), btn = fm.querySelector('button[type=submit]');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value)) { msg.textContent = 'Please enter a valid email address.'; return; }
      if (!f.consent.checked) { msg.textContent = 'Please tick the box so we can email you.'; return; }
      var res = document.querySelector('[data-tool] .result');
      btn.disabled = true; msg.textContent = 'Sending…';
      fetch(leadBox.getAttribute('data-endpoint'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: f.name.value, email: f.email.value, website: f.website.value, consent: true, token: leadBox.getAttribute('data-token'),
        slug: leadBox.getAttribute('data-slug'), count: +store.get('xf_calc_n') || 0, summary: res ? res.innerText.replace(/\n{2,}/g, '\n').slice(0, 600) : ''
      }) }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) { store.set('xf_calc_lead_done', '1'); fm.innerHTML = '<p>Done. Check your inbox for your results.</p>'; }
        else { btn.disabled = false; msg.textContent = (d && d.message) || 'Could not send that. Please try again.'; }
      }).catch(function () { btn.disabled = false; msg.textContent = 'Could not send that. Please try again.'; });
    });
  };
  var tickTimer;
  /** One finished calculation = a valid result after the reader stops typing for 1.5 s. */
  var tick = function () {
    clearTimeout(tickTimer);
    tickTimer = setTimeout(function () { store.set('xf_calc_n', String((+store.get('xf_calc_n') || 0) + 1)); leadShow(); }, 1500);
  };
  /** Wires a calculator: render(f) fills the outputs from form f and returns nothing; re-runs on any input or button. */
  var wire = function (root, render) {
    var run = function (e) {
      var f = form(root);
      render(f);
      if (f.ok() && e) tick();
    };
    root.addEventListener('input', run);
    root.addEventListener('change', run);
    run();
    leadShow();
    return run;
  };

  /* ---- In-hand salary ---- */
  var ih = $('[data-tool="in-hand"]');
  if (ih) {
    var state = { regime: 'new', metro: true };
    var seg = function (name, value) {
      ih.querySelectorAll('[data-' + name + ']').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-' + name) === String(value) ? 'true' : 'false'); });
    };
    var runIh = wire(ih, function (f) {
      ih.querySelectorAll('[data-old-only]').forEach(function (el) { el.hidden = state.regime !== 'old'; });
      var o = { ctc: f.n('ctc', 'your annual CTC', { min: 0 }), metro: state.metro, rent: f.n('rent', 'monthly rent', { min: 0, dflt: 0 }), deductions: f.n('ded', '80C investments', { min: 0, dflt: 0 }),
        pt: f.n('pt', 'professional tax', { min: 0, dflt: 2500 }), basicPct: f.n('basic', 'basic pay %', { min: 1, max: 100, dflt: 50 }) / 100, pfCap: $('#pfcap', ih).checked };
      if (!f.ok()) { ['hand', 'tax', 'pf', 'other'].forEach(function (k) { $('#bar-' + k, ih).style.width = '0'; }); $('#ih-rows', ih).innerHTML = ''; $('#ih-compare', ih).textContent = ''; return; }
      var r = salary(Object.assign({ regime: state.regime }, o));
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
      var other = salary(Object.assign({ regime: state.regime === 'new' ? 'old' : 'new' }, o));
      var diff = other.inHand - r.inHand;
      $('#ih-compare', ih).textContent = Math.abs(diff) < 12 ? 'Both regimes give about the same take-home.' :
        (diff > 0 ? 'The ' + (state.regime === 'new' ? 'old' : 'new') + ' regime would give you about ' + inr(diff / 12) + ' more a month.' :
          'This regime gives you about ' + inr(-diff / 12) + ' more a month than the ' + (state.regime === 'new' ? 'old' : 'new') + ' regime.');
    });
    ih.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-regime')) { state.regime = b.getAttribute('data-regime'); seg('regime', state.regime); }
      if (b.hasAttribute('data-metro')) { state.metro = b.getAttribute('data-metro') === 'true'; seg('metro', state.metro); }
      if (b.hasAttribute('data-preset')) { $('#ctc', ih).value = b.getAttribute('data-preset'); }
      runIh(e);
    });
  }

  /* ---- Salary hike ---- */
  var hk = $('[data-tool="hike"]');
  if (hk) {
    wire(hk, function (f) {
      var mode = $('#mode-pct', hk).checked ? 'pct' : 'ctc';
      hk.querySelector('[data-pct-field]').hidden = mode !== 'pct';
      hk.querySelector('[data-ctc-field]').hidden = mode !== 'ctc';
      var o = { cur: f.n('cur', 'your current CTC', { min: 0 }), mode: mode, regime: $('#hk-old', hk).checked ? 'old' : 'new' };
      if (mode === 'pct') o.pct = f.n('pct', 'the hike %', { min: -100 }); else o.next = f.n('newctc', 'the new CTC', { min: 0 });
      if (!f.ok()) return;
      var r = hike(o);
      var signed = function (n) { return (n < 0 ? '−' : '+') + inr(Math.abs(n)); };
      $('#hk-new', hk).textContent = inr(r.next);
      $('#hk-pct', hk).textContent = o.cur ? r.pct.toFixed(1) + '%' : '–';
      $('#hk-before', hk).textContent = inr(r.before / 12);
      $('#hk-after', hk).textContent = inr(r.after / 12);
      $('#hk-diff', hk).textContent = signed((r.after - r.before) / 12);
      $('#hk-take', hk).textContent = r.next !== r.cur ? r.keep.toFixed(0) + '%' : '–';
    });
  }

  /* ---- Notice period buyout ---- */
  var nb = $('[data-tool="notice"]');
  if (nb) {
    wire(nb, function (f) {
      var o = { monthly: f.n('nb-salary', 'your monthly pay', { min: 0 }), total: f.n('nb-total', 'the notice period', { min: 0 }), served: f.n('nb-served', 'days served', { min: 0, dflt: 0 }),
        leave: f.n('nb-leave', 'leave days', { min: 0, dflt: 0 }), divisor: $('#nb-days', nb).value === '26' ? 26 : 30 };
      if (!f.ok()) return;
      var r = notice(o);
      $('#nb-remaining', nb).textContent = (+r.remaining.toFixed(1)).toLocaleString('en-IN') + (r.remaining === 1 ? ' day' : ' days');
      $('#nb-amount', nb).textContent = inr(r.amount);
      $('#nb-perday', nb).textContent = inr(r.perDay) + ' per day';
    });
  }

  /* ---- Runway ---- */
  var rw = $('[data-tool="runway"]');
  if (rw) {
    wire(rw, function (f) {
      var o = { cash: f.n('rw-cash', 'cash in the bank', { min: 0 }), grossBurn: f.n('rw-burn', 'monthly gross burn', { min: 0 }), revenue: f.n('rw-rev', 'monthly revenue', { min: 0, dflt: 0 }),
        growth: f.n('rw-growth', 'revenue growth %', { min: -100, max: 1000, dflt: 0 }) / 100, start: new Date() };
      if (!f.ok()) return;
      var r = runway(o);
      var mo = function (m) { return m.toFixed(1) + ' months'; };
      $('#rw-months', rw).textContent = r.defaultAlive ? 'Default alive' : mo(r.months);
      $('#rw-date', rw).textContent = r.zeroDate ? r.zeroDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not within 50 years';
      $('#rw-net', rw).textContent = r.netBurn > 0 ? inr(r.netBurn) : 'None: profitable (' + inr(-r.netBurn) + ' surplus)';
      $('#rw-simple', rw).textContent = r.simpleMonths === null ? 'Unlimited' : mo(r.simpleMonths);
    });
  }

  /* ---- Cap table ---- */
  var ct = $('[data-tool="captable"]');
  if (ct) {
    wire(ct, function (f) {
      var o = { founders: f.n('ct-founders', 'founder shares', { min: 1 }), pool: f.n('ct-pool', 'option pool shares', { min: 0, dflt: 0 }), preMoney: f.n('ct-pre', 'the pre-money valuation', { min: 1 }),
        invest: f.n('ct-inv', 'the amount raised', { min: 0 }), poolTarget: f.n('ct-target', 'the pool target %', { min: 0, max: 50, dflt: 0 }) / 100, safes: [] };
      [1, 2].forEach(function (i) {
        var amt = f.n('ct-s' + i + '-amt', 'SAFE ' + i + ' amount', { min: 0, dflt: 0 });
        if (!amt) return;
        var cap = f.n('ct-s' + i + '-cap', 'SAFE ' + i + ' cap', { min: 0, dflt: 0 }), disc = f.n('ct-s' + i + '-disc', 'SAFE ' + i + ' discount', { min: 0, max: 99, dflt: 0 }) / 100;
        if (cap && amt >= cap) f.err('SAFE ' + i + ' amount must be below its cap.');
        o.safes.push({ amount: amt, cap: cap, discount: disc });
      });
      if (!f.ok()) return;
      var r = capTable(o);
      var nf = function (n) { return Math.round(n).toLocaleString('en-IN'); };
      $('#ct-founders-after', ct).textContent = pctf(r.rows[0].pctAfter, 2);
      $('#ct-price', ct).textContent = r.price.toFixed(4);
      $('#ct-post', ct).textContent = nf(r.postMoney);
      $('#ct-topup', ct).textContent = nf(r.poolTopUp);
      $('#ct-rows', ct).innerHTML = r.rows.map(function (x) {
        return '<div class="br" style="color:var(--t2)"><span>' + x.name + '</span><span class="mono" style="display:flex;gap:18px"><span style="width:70px;text-align:right">' + pctf(x.pctBefore, 2) + '</span><span style="width:70px;text-align:right;color:var(--tx)">' + pctf(x.pctAfter, 2) + '</span><span class="hs" style="width:110px;text-align:right;color:var(--t3)">' + nf(x.after) + '</span></span></div>';
      }).join('');
    });
  }

  /* ---- Co-founder equity split ---- */
  var eq = $('[data-tool="equity"]');
  if (eq) {
    var FACTORS = [['Full-time commitment', 25], ['Role and responsibility', 20], ['Skills and domain expertise', 15], ['Idea and early work', 10], ['Capital put in', 10], ['Network and customers', 10], ['Risk taken (salary forgone)', 10]];
    var DEMO = [[10, 9, 8, 10, 5, 6, 8], [10, 8, 9, 4, 5, 8, 8], [5, 5, 5, 5, 5, 5, 5], [5, 5, 5, 5, 5, 5, 5]];
    var NAMES = ['A', 'B', 'C', 'D'];
    var eqN = 2;
    var grid = function () {
      var head = '<div class="tl-eq__row tl-eq__head"><span class="k">Factor</span><span class="k">Weight</span>' + NAMES.slice(0, eqN).map(function (n) { return '<span class="k">' + n + '</span>'; }).join('') + '</div>';
      $('#eq-grid', eq).innerHTML = head + FACTORS.map(function (fc, i) {
        return '<div class="tl-eq__row"><span>' + fc[0] + '</span><input id="eq-w' + i + '" inputmode="decimal" value="' + fc[1] + '" aria-label="Weight for ' + fc[0] + '">' +
          NAMES.slice(0, eqN).map(function (n, j) { return '<input id="eq-s' + j + '-' + i + '" inputmode="decimal" value="' + DEMO[j][i] + '" aria-label="Founder ' + n + ' score for ' + fc[0] + '">'; }).join('') + '</div>';
      }).join('');
    };
    grid();
    var runEq = wire(eq, function (f) {
      var weights = FACTORS.map(function (fc, i) { return f.n('eq-w' + i, 'the weight for ' + fc[0].toLowerCase(), { min: 0, dflt: 0 }); });
      var scores = NAMES.slice(0, eqN).map(function (n, j) { return FACTORS.map(function (fc, i) { return f.n('eq-s' + j + '-' + i, 'founder ' + n + '’s ' + fc[0].toLowerCase() + ' score', { min: 0, max: 10, dflt: 0 }); }); });
      if (!weights.some(Boolean)) f.err('Give at least one factor a weight above zero.');
      if (!f.ok()) return;
      var r = equitySplit({ weights: weights, scores: scores });
      $('#eq-a', eq).textContent = pctf(r[0]);
      $('#eq-rows', eq).innerHTML = r.map(function (v, j) { return '<div class="br"><span style="color:var(--t2)">Founder ' + NAMES[j] + '</span><span class="mono">' + pctf(v) + '</span></div>'; }).join('');
    });
    eq.addEventListener('click', function (e) {
      var b = e.target.closest('[data-n]');
      if (!b) return;
      eqN = +b.getAttribute('data-n');
      eq.querySelectorAll('[data-n]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      grid();
      runEq(e);
    });
  }

  /* ---- AI ROI ---- */
  var roi = $('[data-tool="roi"]');
  if (roi) {
    wire(roi, function (f) {
      var o = { users: f.n('roi-users', 'the number of people', { min: 0 }), hours: f.n('roi-hours', 'hours saved a week', { min: 0, max: 168 }), rate: f.n('roi-rate', 'the hourly cost', { min: 0 }),
        adoption: f.n('roi-adopt', 'the share who use it', { min: 0, max: 100, dflt: 100 }) / 100, toolCost: f.n('roi-cost', 'the tool cost', { min: 0, dflt: 0 }), setup: f.n('roi-setup', 'the setup cost', { min: 0, dflt: 0 }) };
      if (!f.ok()) return;
      var r = aiRoi(o);
      $('#roi-net', roi).textContent = (r.monthlyNet < 0 ? '−' : '') + inr(Math.abs(r.monthlyNet));
      $('#roi-value', roi).textContent = inr(r.monthlyValue);
      $('#roi-costm', roi).textContent = inr(r.monthlyCost);
      $('#roi-hrs', roi).textContent = (+r.hoursPerMonth.toFixed(1)).toLocaleString('en-IN') + ' hours';
      $('#roi-pay', roi).textContent = r.paybackMonths === null ? 'Never at these numbers' : r.paybackMonths.toFixed(r.paybackMonths < 1 ? 2 : 1) + ' months';
      $('#roi-year', roi).textContent = r.roiYear1 === null ? '–' : pctf(r.roiYear1);
    });
  }

  /* ---- SaaS metrics (tabs) ---- */
  var sm = $('[data-tool="saas"]');
  if (sm) {
    var tab = 'ltv';
    var runSm = wire(sm, function (f) {
      sm.querySelectorAll('[data-pane]').forEach(function (p) { var on = p.getAttribute('data-pane').split(' ').indexOf(tab) >= 0; p.hidden = !on; p.style.display = on ? 'flex' : ''; });
      var rows = [], main = '', label = '', x;
      var nfr = function (n, dp) { return n === null ? 'n/a' : n.toFixed(dp == null ? 1 : dp); };
      if (tab === 'ltv') {
        x = { arpa: f.n('sm-arpa', 'ARPA', { min: 0 }), margin: f.n('sm-gm', 'gross margin', { min: 0, max: 100 }) / 100, churn: f.n('sm-churn', 'monthly churn', { min: 0, max: 100 }) / 100,
          spend: f.n('sm-spend', 'sales and marketing spend', { min: 0 }), newCustomers: f.n('sm-new', 'new customers', { min: 0 }) };
        if (!x.churn) f.err('Churn must be above 0% for LTV (with no churn, lifetime value has no limit).');
        if (!x.newCustomers) f.err('New customers must be above 0 to work out CAC.');
        if (!f.ok()) return;
        var cac = saas.cac(x), ltv = saas.ltv(x);
        label = 'LTV:CAC'; main = nfr(saas.ltvCac(x)) + ' : 1';
        rows = [['Lifetime value (LTV)', inr(ltv)], ['CAC', inr(cac)], ['CAC payback', nfr(saas.payback({ cac: cac, arpa: x.arpa, margin: x.margin })) + ' months'], ['Average customer lifetime', nfr(1 / x.churn) + ' months']];
      } else if (tab === 'pay') {
        x = { arpa: f.n('sm-arpa', 'ARPA', { min: 0 }), margin: f.n('sm-gm', 'gross margin', { min: 0, max: 100 }) / 100, cac: f.n('sm-cac', 'CAC', { min: 0 }) };
        if (!(x.arpa * x.margin)) f.err('ARPA and gross margin must be above zero for payback.');
        if (!f.ok()) return;
        label = 'CAC payback'; main = nfr(saas.payback(x)) + ' months';
        rows = [['Gross profit per customer a month', inr(x.arpa * x.margin)]];
      } else if (tab === 'mrr') {
        x = saas.mrr({ customers: f.n('sm-cust', 'paying customers', { min: 0 }), arpa: f.n('sm-arpa2', 'ARPA', { min: 0 }) });
        if (!f.ok()) return;
        label = 'MRR'; main = inr(x.mrr); rows = [['ARR (MRR × 12)', inr(x.arr)]];
      } else if (tab === 'churn') {
        x = { start: f.n('sm-start', 'customers at the start', { min: 0 }), lost: f.n('sm-lost', 'customers lost', { min: 0 }) };
        if (!x.start) f.err('Customers at the start must be above 0.');
        if (x.lost > x.start) f.err('Customers lost can’t exceed customers at the start.');
        if (!f.ok()) return;
        var c = saas.churn(x);
        label = 'Monthly churn'; main = pctf(c * 100, 2);
        rows = [['Customers kept', pctf(100 - c * 100, 2)], ['Average lifetime at this churn', c ? nfr(1 / c) + ' months' : 'No churn']];
      } else if (tab === 'nrr') {
        x = { start: f.n('sm-mrr0', 'starting MRR', { min: 0 }), expansion: f.n('sm-exp', 'expansion MRR', { min: 0, dflt: 0 }), contraction: f.n('sm-con', 'contraction MRR', { min: 0, dflt: 0 }), churned: f.n('sm-chm', 'churned MRR', { min: 0, dflt: 0 }) };
        if (!x.start) f.err('Starting MRR must be above 0.');
        if (!f.ok()) return;
        label = 'Net revenue retention'; main = pctf(saas.nrr(x) * 100);
        rows = [['MRR from the same customers now', inr(x.start + x.expansion - x.contraction - x.churned)], ['Gross revenue retention', pctf(Math.max(0, x.start - x.contraction - x.churned) / x.start * 100)]];
      } else {
        x = { growth: f.n('sm-growth', 'revenue growth', { min: -100 }), margin: f.n('sm-margin', 'profit margin', { min: -1000, max: 100 }) };
        if (!f.ok()) return;
        var r40 = saas.rule40(x);
        label = 'Rule of 40 score'; main = pctf(r40);
        rows = [['Meets the rule of 40', r40 >= 40 ? 'Yes' : 'No']];
      }
      $('#sm-label', sm).textContent = label;
      $('#sm-main', sm).textContent = main;
      $('#sm-rows', sm).innerHTML = rows.map(function (r) { return '<div class="br"><span style="color:var(--t2)">' + r[0] + '</span><span class="mono">' + r[1] + '</span></div>'; }).join('');
    });
    sm.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      tab = b.getAttribute('data-tab');
      sm.querySelectorAll('[data-tab]').forEach(function (t) { t.setAttribute('aria-pressed', t === b ? 'true' : 'false'); });
      runSm(e);
    });
  }

  /* ---- Startup cost ---- */
  var sc = $('[data-tool="startup"]');
  if (sc) {
    wire(sc, function (f) {
      var pick = function (pre, n) { var a = []; for (var i = 1; i <= n; i++) a.push(f.n(pre + i, 'that cost', { min: 0, dflt: 0 })); return a; };
      var o = { oneTime: pick('sc-o', 8), monthly: pick('sc-m', 7), months: f.n('sc-months', 'months until revenue', { min: 0, max: 120, dflt: 0 }), buffer: f.n('sc-buffer', 'the buffer %', { min: 0, max: 200, dflt: 0 }) / 100 };
      var r = startupCost(o);
      if (!r.oneTime && !r.monthly) f.err('Enter your own costs on the left to see the total.');
      if (!f.ok()) return;
      $('#sc-total', sc).textContent = inr(r.total);
      $('#sc-one', sc).textContent = inr(r.oneTime);
      $('#sc-mon', sc).textContent = inr(r.monthly);
      $('#sc-run', sc).textContent = inr(r.running);
      $('#sc-buf', sc).textContent = inr(r.buffer);
    });
  }

  /* ---- ESOP ---- */
  var es = $('[data-tool="esop"]');
  if (es) {
    wire(es, function (f) {
      var o = { granted: f.n('es-granted', 'options granted', { min: 0 }), strike: f.n('es-strike', 'the exercise price', { min: 0 }), vestYears: f.n('es-years', 'the vesting period', { min: 0.1, max: 20 }),
        cliffMonths: f.n('es-cliff', 'the cliff', { min: 0, dflt: 0 }), monthsServed: f.n('es-months', 'months worked', { min: 0 }), fmv: f.n('es-fmv', 'the fair market value', { min: 0 }),
        exitPrice: f.n('es-exit', 'the sale price', { min: 0 }), taxRate: f.n('es-rate', 'your tax rate', { min: 0, max: 50 }) / 100, longTerm: $('#es-long', es).checked };
      if (!f.ok()) return;
      var r = esop(o);
      $('#es-net', es).textContent = (r.net < 0 ? '−' : '') + inr(Math.abs(r.net));
      $('#es-vested', es).textContent = r.vested.toLocaleString('en-IN') + ' (' + pctf(r.vestedPct) + ')';
      $('#es-ex', es).textContent = inr(r.exerciseCost);
      $('#es-perq', es).textContent = inr(r.perquisite);
      $('#es-perqtax', es).textContent = inr(r.perqTax);
      $('#es-gain', es).textContent = (r.gain < 0 ? '−' : '') + inr(Math.abs(r.gain));
      $('#es-cgtax', es).textContent = inr(r.cgTax);
      $('#es-gross', es).textContent = inr(r.grossAtExit);
    });
  }

  /* ---- AI token cost ---- */
  var tk = $('[data-tool="token"]');
  if (tk) {
    wire(tk, function (f) {
      var opt = $('#tk-model', tk).selectedOptions[0];
      var o = { inPrice: +opt.getAttribute('data-in'), cachePrice: +opt.getAttribute('data-cache'), outPrice: +opt.getAttribute('data-outp'),
        inTok: f.n('tk-in', 'input tokens', { min: 0 }), outTok: f.n('tk-out', 'output tokens', { min: 0 }), calls: f.n('tk-calls', 'calls per day', { min: 0 }),
        cachedShare: f.n('tk-cache', 'the cached share', { min: 0, max: 100, dflt: 0 }) / 100, batch: $('#tk-batch', tk).checked };
      if (!f.ok()) return;
      var r = tokenCost(o);
      var small = function (n) { return n > 0 && n < 0.01 ? usd(n, 5) : usd(n); };
      $('#tk-month', tk).textContent = usd(r.perMonth);
      $('#tk-call', tk).textContent = small(r.perCall);
      $('#tk-day', tk).textContent = small(r.perDay);
      $('#tk-year', tk).textContent = usd(r.perYear);
      $('#tk-rates', tk).textContent = '$' + o.inPrice + ' in · $' + o.cachePrice + ' cached · $' + o.outPrice + ' out' + (o.batch ? ' (−50%)' : '');
    });
  }

  /* ---- GPU cost ---- */
  var gp = $('[data-tool="gpu"]');
  if (gp) {
    wire(gp, function (f) {
      var opt = $('#gp-inst', gp).selectedOptions[0], custom = opt.value === 'custom';
      var box = $('[data-custom]', gp); box.hidden = !custom; box.style.display = custom ? 'flex' : '';
      var o = { price: custom ? f.n('gp-price', 'the price per hour', { min: 0 }) : +opt.getAttribute('data-price'), gpus: custom ? f.n('gp-gpus', 'GPUs per instance', { min: 1 }) : +opt.getAttribute('data-gpus'),
        instances: f.n('gp-n', 'the number of instances', { min: 0 }), hoursPerDay: f.n('gp-hours', 'hours a day', { min: 0, max: 24 }), days: f.n('gp-days', 'the number of days', { min: 0 }) };
      if (!f.ok()) return;
      var r = gpuCost(o);
      $('#gp-total', gp).textContent = usd(r.total);
      $('#gp-per', gp).textContent = r.perGpuHour === null ? '–' : usd(r.perGpuHour);
      $('#gp-gh', gp).textContent = (+r.gpuHours.toFixed(1)).toLocaleString('en-US');
      $('#gp-ih', gp).textContent = (+r.instanceHours.toFixed(1)).toLocaleString('en-US');
      $('#gp-month', gp).textContent = usd(r.perMonth);
    });
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
      var grad = function (x0, x1) { var g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#7c5cff'); g.addColorStop(.45, '#b07cff'); g.addColorStop(.8, '#7c8cff'); g.addColorStop(1, '#6a7bff'); return g; };
      x.fillStyle = '#0b0b0c'; x.fillRect(0, 0, 1080, 1350);
      var glow = x.createRadialGradient(900, 120, 0, 900, 120, 700); glow.addColorStop(0, 'rgba(124,92,255,.45)'); glow.addColorStop(1, 'rgba(124,92,255,0)');
      x.fillStyle = glow; x.fillRect(0, 0, 1080, 1350);
      x.fillStyle = grad(0, 1080); x.fillRect(0, 0, 1080, 8);
      x.fillStyle = '#b07cff'; x.font = '500 30px Poppins, monospace'; x.fillText('MY STARTUP’S 100X SCORE', 80, 130);
      x.lineCap = 'round'; x.lineWidth = 44;
      x.strokeStyle = '#232326'; x.beginPath(); x.arc(540, 560, 300, Math.PI, 2 * Math.PI); x.stroke();
      x.strokeStyle = grad(240, 840); x.beginPath(); x.arc(540, 560, 300, Math.PI, Math.PI * (1 + Math.max(.001, r.score / 100))); x.stroke();
      x.textAlign = 'center'; x.fillStyle = grad(330, 750); x.font = '400 190px Poppins, sans-serif'; x.fillText(r.score + 'X', 540, 560);
      x.fillStyle = '#f2f2ef'; x.font = '500 34px Poppins, monospace'; x.fillText(quizBand(r.score).toUpperCase(), 540, 625);
      x.textAlign = 'left'; x.fillStyle = '#8c8c88'; x.font = '500 28px Poppins, monospace'; x.fillText('BIGGEST LEVERS', 80, 760);
      var y = 820; x.font = '400 36px Poppins, sans-serif';
      r.tips.forEach(function (t, i) { x.fillStyle = '#b07cff'; x.fillText((i + 1) + '.', 80, y); x.fillStyle = '#d6d6d2'; y = wrapText(x, t, 130, y, 870, 48) + 22; });
      x.fillStyle = '#f2f2ef'; x.font = '500 44px Poppins, sans-serif'; x.fillText('100xFounder', 80, 1230);
      x.fillStyle = '#8c8c88'; x.font = '500 26px Poppins, monospace'; x.fillText('100xfounder.com/tools/startup-100x-score', 80, 1280);
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

  if (typeof module === 'object' && module.exports) module.exports = { incomeTax: incomeTax, salary: salary, hike: hike, notice: notice, quizScore: quizScore, tokenCost: tokenCost, runway: runway, capTable: capTable, equitySplit: equitySplit, aiRoi: aiRoi, saas: saas, startupCost: startupCost, esop: esop, gpuCost: gpuCost, leadDue: leadDue, form: form }; // for tests/tools.test.js
})();
