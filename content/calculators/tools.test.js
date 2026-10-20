// Hand-checked cases for the calculators in wordpress/100xfounder-theme/assets/js/tools.js.
// Run: node content/calculators/tools.test.js
global.document = { querySelector: function () { return null; } }; // no page: the DOM wiring skips itself
var t = require('../../wordpress/100xfounder-theme/assets/js/tools.js');
var assert = require('assert');
var near = function (a, b, msg) { assert.ok(Math.abs(a - b) < 0.01, msg + ': got ' + a + ', want ' + b); };

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
assert.ok(cut.after < cut.before && Math.abs(cut.pct + 16.667) < 0.01, 'pay cut shows a negative change');

near(t.notice({ monthly: 60000, total: 90, served: 30, leave: 0, divisor: 30 }).amount, 120000, 'notice buyout 60 days at 2,000/day');
near(t.notice({ monthly: 52000, total: 60, served: 10, leave: 5, divisor: 26 }).amount, 90000, 'leave set-off, 26-day divisor');
near(t.notice({ monthly: 60000, total: 30, served: 45, leave: 10, divisor: 30 }).amount, 0, 'served more than the notice');
console.log('tools.js: all checks passed');
