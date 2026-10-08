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
})();
