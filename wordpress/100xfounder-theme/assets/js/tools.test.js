// Hand-checked cases for the calculators in wordpress/100xfounder-theme/assets/js/tools.js.
// Run: node wordpress/100xfounder-theme/assets/js/tools.test.js
global.document = { querySelector: function () { return null; } }; // no page: the DOM wiring skips itself
var t = require('./tools.js');
var assert = require('assert');
var passed = 0;
var near = function (a, b, msg) { assert.ok(Math.abs(a - b) < 0.01, msg + ': got ' + a + ', want ' + b); passed++; };
var ok = function (c, msg) { assert.ok(c, msg); passed++; };

near(t.incomeTax(1200000, 'new'), 0, 'new regime: rebate up to 12L');
near(t.incomeTax(1250000, 'new'), 52000, 'new regime: 87A marginal relief (50,000 + 4% cess)');
near(t.incomeTax(1352925, 'new'), 86256.3, 'new regime 13.53L: 20k + 40k + 15% of 1,52,925, + cess');
near(t.incomeTax(500000, 'old'), 0, 'old regime: rebate up to 5L');
near(t.incomeTax(1000000, 'old'), 117000, 'old regime 10L: 12,500 + 1,00,000, + cess');
near(t.incomeTax(5010000, 'new'), 1133600, 'surcharge marginal relief just above 50L');
near(t.incomeTax(0, 'old') + t.incomeTax(-5, 'new'), 0, 'zero and negative income');

var s = t.salary({ ctc: 1500000, regime: 'new', metro: true, rent: 0, deductions: 0, pt: 2500, basicPct: .5, pfCap: true });
near(s.pf, 36000, 'PF capped at 3,000 a month');
near(s.gratuity, 36075, 'gratuity 4.81% of basic');
near(s.inHand, 1303168.7, '15L CTC new regime take-home');
var o = t.salary({ ctc: 1500000, regime: 'old', metro: true, rent: 30000, deductions: 150000, pt: 2500, basicPct: .5, pfCap: true });
// HRA exempt = min(3,75,000, 3,60,000 − 75,000 = 2,85,000) ; taxable = 14,27,925 − 50,000 − 2,85,000 − 1,50,000 − 2,500 = 9,40,425
near(o.taxable, 940425, 'old regime taxable with HRA and 80C');
near(o.tax, (12500 + 0.2 * 440425) * 1.04, 'old regime tax');
var z = t.salary({ ctc: 0, regime: 'new', metro: true, rent: 0, deductions: 0, pt: 2500, basicPct: .5, pfCap: true });
near(z.inHand + z.tax + z.pt, 0, 'zero CTC gives zero everywhere');

var h = t.hike({ cur: 1200000, pct: 30, mode: 'pct', regime: 'new' });
near(h.next, 1560000, '30% hike on 12L');
var cut = t.hike({ cur: 1200000, next: 1000000, mode: 'ctc', regime: 'new' });
ok(cut.after < cut.before && Math.abs(cut.pct + 16.667) < 0.01, 'pay cut shows a negative change');

near(t.notice({ monthly: 60000, total: 90, served: 30, leave: 0, divisor: 30 }).amount, 120000, 'notice buyout 60 days at 2,000/day');
near(t.notice({ monthly: 52000, total: 60, served: 10, leave: 5, divisor: 26 }).amount, 90000, 'leave set-off, 26-day divisor');
near(t.notice({ monthly: 60000, total: 30, served: 45, leave: 10, divisor: 30 }).amount, 0, 'served more than the notice');
near(t.incomeTax(1e12, 'new'), (0.3 * (1e12 - 2400000) + 300000) * 1.25 * 1.04, 'huge income: 30% slab, 25% surcharge cap, cess');
near(t.incomeTax(1200000.5, 'new'), 0.52, 'decimal just above the rebate line: marginal relief');
near(t.notice({ monthly: 45000.5, total: 30, served: 0, leave: 0, divisor: 30 }).amount, 45000.5, 'notice with decimals');
near(t.hike({ cur: 0, pct: 50, mode: 'pct', regime: 'new' }).next, 0, 'hike on zero CTC');

/* ---- AI token cost (USD per million tokens) ---- */
var tk = function (o) { return t.tokenCost(Object.assign({ inPrice: 2, cachePrice: 0.1, outPrice: 10, inTok: 2000, outTok: 500, calls: 1000, cachedShare: 0, batch: false }, o)); };
near(tk({}).perCall, 0.009, 'Sonnet 5.5: (2000×2 + 500×10) / 1e6');
near(tk({}).perMonth, 270, '1,000 calls a day for 30 days');
near(tk({ cachedShare: 0.5 }).perDay, 7.1, 'half the input from cache');
near(tk({ batch: true }).perDay, 4.5, 'batch halves the bill');
near(tk({ inTok: 0, outTok: 0 }).perYear, 0, 'zero tokens');
near(tk({ inTok: 1e9, outTok: 0, calls: 1 }).perCall, 2000, 'a billion input tokens at $2 per million');

/* ---- Runway ---- */
var rw = t.runway({ cash: 6000000, grossBurn: 1000000, revenue: 400000, growth: 0, start: new Date(2026, 0, 1) });
near(rw.months, 10, '60L cash, 6L net burn');
ok(rw.zeroDate.getFullYear() === 2026 && rw.zeroDate.getMonth() === 10 && rw.zeroDate.getDate() === 1, 'zero-cash date 10 months on');
near(t.runway({ cash: 5000000, grossBurn: 1000000, revenue: 400000, growth: 0 }).months, 8.3333, '50L / 6L = 8.33 months');
ok(t.runway({ cash: 5000000, grossBurn: 1000000, revenue: 400000, growth: 0.1 }).defaultAlive, '10% monthly revenue growth closes the gap');
ok(t.runway({ cash: 0, grossBurn: 100, revenue: 0, growth: 0 }).months === 0, 'zero cash: zero runway');
near(t.runway({ cash: 1e12, grossBurn: 1e9, revenue: 0, growth: 0 }).simpleMonths, 1000, 'huge numbers (simple runway)');
ok(t.runway({ cash: 1e12, grossBurn: 1e9, revenue: 0, growth: 0 }).defaultAlive, 'beyond 50 years counts as not running out');
near(t.runway({ cash: 1000.5, grossBurn: 200.1, revenue: 0, growth: 0 }).months, 5, 'decimals');

/* ---- Cap table: 9M founders, 1M pool, $1M SAFE at $10M post cap, $20M pre / $5M in, 10% pool ---- */
var ctab = t.capTable({ founders: 9e6, pool: 1e6, safes: [{ amount: 1e6, cap: 1e7, discount: 0 }], preMoney: 2e7, invest: 5e6, poolTarget: 0.1 });
near(ctab.price, 20e6 / 11555555.5556, 'price = pre-money / pre-money fully diluted shares');
near(ctab.rows[0].pctAfter, 62.3077, 'founders after');
near(ctab.rows[2].pctAfter, 7.6923, 'SAFE after');
near(ctab.rows[3].pctAfter, 20, 'new investors own invest / post-money');
var plain = t.capTable({ founders: 1e6, pool: 0, safes: [], preMoney: 4e6, invest: 1e6, poolTarget: 0 });
near(plain.rows[0].pctAfter, 80, 'no SAFE, no pool: 4M pre / 1M in');
near(t.capTable({ founders: 1e6, pool: 0, safes: [{ amount: 1e5, cap: 0, discount: 0.2 }], preMoney: 1e6, invest: 0, poolTarget: 0 }).rows[2].after, 1e6 / 7, 'discount-only SAFE: s = 1e5 / (0.8 × 1e6 / (1e6 + s)), so s = 1e6 / 7 (SAFE shares sit in the pre-money)');
near(t.capTable({ founders: 1e6, pool: 0, safes: [], preMoney: 1e6, invest: 0, poolTarget: 0 }).rows[0].pctAfter, 100, 'zero raised');

/* ---- Co-founder equity split ---- */
near(t.equitySplit({ weights: [1, 1], scores: [[10, 0], [0, 10]] })[0], 50, 'mirror scores split evenly');
near(t.equitySplit({ weights: [2, 1], scores: [[10, 0], [0, 10]] })[0], 66.6667, 'weights 2:1');
near(t.equitySplit({ weights: [25, 20, 15, 10, 10, 10, 10], scores: [[10, 9, 8, 10, 5, 6, 8], [10, 8, 9, 4, 5, 8, 8]] })[0], 51.3761, 'page example');
near(t.equitySplit({ weights: [1], scores: [[0], [0], [0]] })[1], 33.3333, 'all zero: equal split');
near(t.equitySplit({ weights: [0.5], scores: [[7.5], [2.5]] })[0], 75, 'decimals');

/* ---- AI ROI ---- */
var roi = t.aiRoi({ users: 10, hours: 2, rate: 1000, adoption: 1, toolCost: 2000, setup: 50000 });
near(roi.monthlyValue, 86666.6667, '10 × 2 h × 52/12 × 1,000');
near(roi.paybackMonths, 0.75, 'payback 50,000 / 66,667');
near(roi.roiYear1, 258.6207, 'year-one ROI');
ok(t.aiRoi({ users: 5, hours: 0, rate: 500, adoption: 1, toolCost: 1000, setup: 0 }).paybackMonths === null, 'no savings: never pays back');
near(t.aiRoi({ users: 0, hours: 1, rate: 1, adoption: 1, toolCost: 1, setup: 0 }).monthlyNet, 0, 'zero users');
near(t.aiRoi({ users: 1, hours: 1.5, rate: 1200, adoption: 0.5, toolCost: 0, setup: 0 }).monthlyValue, 3900, 'decimals and adoption');

/* ---- SaaS metrics ---- */
var m = { arpa: 5000, margin: 0.8, churn: 0.03, spend: 400000, newCustomers: 10 };
near(t.saas.ltv(m), 133333.3333, 'LTV = 5,000 × 80% / 3%');
near(t.saas.cac(m), 40000, 'CAC');
near(t.saas.ltvCac(m), 3.3333, 'LTV:CAC');
near(t.saas.payback({ cac: 40000, arpa: 5000, margin: 0.8 }), 10, 'payback months');
near(t.saas.mrr({ customers: 200, arpa: 5000 }).arr, 12000000, 'ARR');
near(t.saas.churn({ start: 200, lost: 6 }), 0.03, 'churn');
near(t.saas.nrr({ start: 1000000, expansion: 150000, contraction: 50000, churned: 80000 }), 1.02, 'NRR 102%');
near(t.saas.rule40({ growth: 30, margin: 15 }), 45, 'rule of 40');
ok(t.saas.ltv({ arpa: 1, margin: 1, churn: 0 }) === null && t.saas.cac({ spend: 1, newCustomers: 0 }) === null, 'zero churn / zero customers are undefined, not Infinity');
near(t.saas.mrr({ customers: 1e9, arpa: 1e6 }).mrr, 1e15, 'huge numbers');

/* ---- Startup cost ---- */
var sc = t.startupCost({ oneTime: [10000, 5000], monthly: [100000, 20000], months: 6, buffer: 0.2 });
near(sc.running, 720000, 'monthly × months');
near(sc.total, (15000 + 720000) * 1.2, 'total with 20% buffer');
near(t.startupCost({ oneTime: [], monthly: [], months: 12, buffer: 0.2 }).total, 0, 'nothing entered');
near(t.startupCost({ oneTime: [999.5], monthly: [0.5], months: 1, buffer: 0 }).total, 1000, 'decimals');

/* ---- ESOP ---- */
var es = t.esop({ granted: 4800, strike: 10, vestYears: 4, cliffMonths: 12, monthsServed: 18, fmv: 200, exitPrice: 500, taxRate: 0.3, longTerm: true });
near(es.vested, 1800, '18 of 48 months vested');
near(es.perqTax, 1800 * 190 * 0.3 * 1.04, 'perquisite tax at 30% + cess');
near(es.cgTax, 1800 * 300 * 0.125 * 1.04, 'LTCG at 12.5% + cess');
near(es.net, 900000 - 18000 - 106704 - 70200, 'net value');
near(t.esop({ granted: 4800, strike: 10, vestYears: 4, cliffMonths: 12, monthsServed: 11, fmv: 200, exitPrice: 500, taxRate: 0.3, longTerm: true }).vested, 0, 'before the cliff');
near(t.esop({ granted: 4800, strike: 10, vestYears: 4, cliffMonths: 12, monthsServed: 100, fmv: 200, exitPrice: 500, taxRate: 0.3, longTerm: false }).cgTax, 4800 * 300 * 0.3 * 1.04, 'fully vested, short-term gain at slab');
near(t.esop({ granted: 0, strike: 0, vestYears: 4, cliffMonths: 0, monthsServed: 0, fmv: 0, exitPrice: 0, taxRate: 0, longTerm: true }).net, 0, 'zero grant');

/* ---- GPU cost ---- */
var g = t.gpuCost({ price: 55.04, gpus: 8, instances: 1, hoursPerDay: 24, days: 30 });
near(g.total, 39628.8, 'p5.48xlarge for a 30-day month');
near(g.perGpuHour, 6.88, 'per GPU-hour');
near(g.gpuHours, 5760, 'GPU-hours');
near(t.gpuCost({ price: 6.98, gpus: 1, instances: 0, hoursPerDay: 24, days: 30 }).total, 0, 'zero instances');
near(t.gpuCost({ price: 1.861, gpus: 1, instances: 2, hoursPerDay: 7.5, days: 10 }).total, 279.15, 'decimals');

/* ---- 15-calculation email ask ---- */
var now = Date.UTC(2026, 9, 20);
ok(!t.leadDue({ n: 14, until: 0, done: false }, now), 'not before 15');
ok(t.leadDue({ n: 15, until: 0, done: false }, now), 'shows at 15');
ok(!t.leadDue({ n: 40, until: now + 30 * 864e5, done: false }, now), 'hidden for 30 days after No thanks');
ok(t.leadDue({ n: 40, until: now - 1, done: false }, now), 'back after the 30 days');
ok(!t.leadDue({ n: 99, until: 0, done: true }, now), 'never again after submitting');

/* ---- Inline input errors (no NaN or blank output) ---- */
var fakeRoot = function (vals) {
  var errBox = { textContent: '', hidden: true }, outs = [{ textContent: 'x' }];
  return { errBox: errBox, outs: outs, querySelector: function (sel) { return sel === '[data-err]' ? errBox : { value: vals[sel.slice(1)] }; },
    querySelectorAll: function (sel) { return sel === '[data-out]' ? outs : []; } };
};
var r1 = fakeRoot({ a: '', b: 'abc', c: '1,50,000' }), f1 = t.form(r1);
f1.n('c', 'pay');
ok(f1.ok() && r1.errBox.hidden, 'commas and lakh grouping parse');
var r2 = fakeRoot({ a: '' }), f2 = t.form(r2);
f2.n('a', 'your annual CTC');
ok(!f2.ok() && r2.errBox.textContent === 'Enter your annual CTC.' && r2.outs[0].textContent === '–', 'empty field: inline message, outputs blanked');
var r3 = fakeRoot({ b: 'abc' }), f3 = t.form(r3);
f3.n('b', 'pay');
ok(!f3.ok() && /must be a number/.test(r3.errBox.textContent), 'text in a number field');
var r4 = fakeRoot({ a: '-5' }), f4 = t.form(r4);
f4.n('a', 'days', { min: 0 });
ok(!f4.ok() && /below 0/.test(r4.errBox.textContent), 'below the minimum');
var r5 = fakeRoot({ a: '' }), f5 = t.form(r5);
near(f5.n('a', 'rent', { dflt: 0 }), 0, 'optional blank uses the default');

console.log('tools.js: ' + passed + ' checks passed');
