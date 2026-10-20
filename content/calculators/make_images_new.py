#!/usr/bin/env python3
"""Draw the new tool pages' diagrams (1600x900, site dark theme) into the plugin's brand assets.
    python3 content/calculators/make_images_new.py
Numbers come from the calculators (content/calculators/tools.test.js checks the maths)."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONTS = os.path.join(ROOT, 'wordpress/100xfounder/assets/fonts')
OUT = os.path.join(ROOT, 'wordpress/100xfounder/assets/brand')
BG, TX, T2, T3, LN, AC, PINK, BLUE = '#0b0b0c', '#f2f2ef', '#a9a9a4', '#76766f', '#2a2a2e', '#b07cff', '#ff6ad5', '#6a7bff'
W, H = 1600, 900

def f(size, bold=False, mono=False):
    name = 'GeistMono-Medium.ttf' if mono else ('Inter-Bold.ttf' if bold else 'Inter-Regular.ttf')
    return ImageFont.truetype(os.path.join(FONTS, name), size)

_RUPEE = {}

def text(d, xy, s, font, fill, anchor='la'):
    """d.text that draws ₹ with Noto Sans (Inter and Geist Mono have no rupee glyph)."""
    size = font.size
    if size not in _RUPEE:
        _RUPEE[size] = ImageFont.truetype(os.path.join(FONTS, 'NotoSans-Regular.ttf'), size)
    parts = [(seg, font) for seg in s.split('₹')]
    segs = []
    for i, (seg, fnt) in enumerate(parts):
        if i:
            segs.append(('₹', _RUPEE[size]))
        if seg:
            segs.append((seg, fnt))
    w = sum(fn.getlength(t) for t, fn in segs)
    x, y = xy
    x -= {'l': 0, 'm': w / 2, 'r': w}[anchor[0]]
    if anchor[1] == 'a':
        y += font.getmetrics()[0]
    for t, fn in segs:
        d.text((x, y), t, font=fn, fill=fill, anchor='ls')
        x += fn.getlength(t)


def canvas(label, title):
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    for x in range(W):  # signature gradient hairline
        t = x / W
        stops = [(0, (124, 92, 255)), (.45, (176, 124, 255)), (.8, (255, 106, 213)), (1, (106, 123, 255))]
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if a <= t <= b:
                k = (t - a) / (b - a)
                d.line([(x, 0), (x, 6)], fill=tuple(int(ca[i] + (cb[i] - ca[i]) * k) for i in range(3)))
                break
    text(d, (80, 60), label.upper(), font=f(24, mono=True), fill=AC)
    text(d, (80, 100), title, font=f(46, bold=True), fill=TX)
    text(d, (80, H - 60), '100xfounder.com/tools', font=f(20, mono=True), fill=T3)
    return im, d

def inr(n):
    s = str(int(round(n)))
    if len(s) <= 3:
        return '₹' + s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:]); head = head[:-2]
    if head:
        parts.insert(0, head)
    return '₹' + ','.join(parts) + ',' + tail

def save(im, name):
    im.save(os.path.join(OUT, name), optimize=True)
    print('wrote', name)


CARD = '#141416'

def card(d, x, y, w, h, label, value, note, col=TX, vsize=72):
    d.rounded_rectangle([x, y, x + w, y + h], radius=16, outline=LN, width=2, fill=CARD)
    text(d, (x + 32, y + 30), label.upper(), font=f(20, mono=True), fill=T3)
    text(d, (x + 32, y + 72), value, font=f(vsize, bold=True), fill=col)
    if note:
        text(d, (x + 32, y + h - 52), note, font=f(22), fill=T2)

def hbars(d, rows, top, lab_w, maxv, fmt, row_h=56, bar_h=34, x0=80, right=1440, cols=None):
    """Horizontal bars: label column, bar, value at the bar end."""
    bx = x0 + lab_w
    for i, (lab, v) in enumerate(rows):
        y = top + i * row_h
        text(d, (bx - 24, y + bar_h / 2 + 9), lab, font=f(24), fill=T2, anchor='rs')
        w = max(4, v / maxv * (right - bx))
        d.rectangle([bx, y, bx + w, y + bar_h], fill=(cols[i] if cols else AC))
        text(d, (bx + w + 16, y + bar_h / 2 + 9), fmt(v), font=f(24, mono=True), fill=TX, anchor='ls')

def arrow(d, x1, y, x2, col=T3):
    d.line([(x1, y), (x2, y)], fill=col, width=3)
    d.polygon([(x2, y), (x2 - 14, y - 9), (x2 - 14, y + 9)], fill=col)

# 1. Token cost worked example
im, d = canvas('AI token cost · worked example · prices as of 20 Oct 2026', 'Claude Sonnet 5.5 at 1,000 calls a day')
text(d, (80, 172), '2,000 input + 500 output tokens per call, 1,000 calls a day', font=f(28), fill=T2)
rows = [('No cache', ['$0.009', '$9.00', '$270'], TX), ('50% of input from cache', ['$0.0071', '$7.10', '$213'], AC)]
heads = ['Per call', 'Per day', 'Per month']
for j, h in enumerate(heads):
    text(d, (760 + j * 270, 260), h.upper(), font=f(22, mono=True), fill=T3, anchor='ra')
for i, (lab, vals, col) in enumerate(rows):
    y = 320 + i * 150
    d.rounded_rectangle([80, y, 1520, y + 120], radius=16, outline=LN, width=2, fill=CARD)
    text(d, (112, y + 42), lab, font=f(32, bold=True), fill=col)
    for j, v in enumerate(vals):
        text(d, (760 + j * 270, y + 34), v, font=f(48, bold=True), fill=col, anchor='ra')
text(d, (80, 660), 'Batch API: halves both rows (input and output at 50% off).', font=f(30), fill=PINK)
save(im, 'tool-token-example.png')

# 2. Cost per day across models
im, d = canvas('AI token cost · cost per day', 'Same workload, ten models')
text(d, (80, 172), 'Cost per day, 1,000 calls of 2,000 in / 500 out tokens (no cache)', font=f(28), fill=T2)
models = [('Claude Fable 5.1', 45.00), ('gpt-6-astra', 45.00), ('Claude Opus 5.5', 18.00), ('Claude Sonnet 5.5', 9.00),
          ('gpt-6.1-sol', 9.00), ('Gemini 4 Argon', 9.00), ('Gemini 3.8 Flash', 3.38), ('Gemini 3.5 Flash-Lite', 1.85),
          ('Claude Haiku 5.5', 0.45), ('gpt-6-luna', 0.45)]
hbars(d, models, 232, 340, 45, lambda v: f'${v:.2f}', row_h=54, bar_h=34, right=1380,
      cols=[AC if 'Claude' in m else (PINK if 'gpt' in m else BLUE) for m, _ in models])
text(d, (1520, H - 60), 'Official list prices as of 20 Oct 2026', font=f(20, mono=True), fill=T3, anchor='ra')
save(im, 'tool-token-models.png')

# 3. Runway curve
im, d = canvas('Runway · worked example', 'Flat revenue runs out; 10% growth stays alive')
text(d, (80, 172), '₹50 lakh in the bank, ₹10 lakh gross burn, ₹4 lakh revenue a month', font=f(28), fill=T2)
flat = [5000000 - 600000 * m for m in range(19)]
grow, c = [5000000], 5000000
for m in range(1, 19):
    c -= 1000000 - 400000 * 1.1 ** (m - 1)
    grow.append(c)
gx0, gx1, gy0, gy1 = 220, 1500, 260, 760  # plot box; y from ₹0 (gy1) to ₹60 lakh (gy0)
px = lambda m: gx0 + m / 18 * (gx1 - gx0)
py = lambda v: gy1 - v / 6000000 * (gy1 - gy0)
for v in range(0, 6000001, 1000000):
    d.line([(gx0, py(v)), (gx1, py(v))], fill=LN, width=1 if v else 2)
    text(d, (gx0 - 20, py(v) + 8), '₹0' if not v else f'₹{v // 100000}L', font=f(20, mono=True), fill=T3, anchor='rs')
for m in range(0, 19, 3):
    text(d, (px(m), gy1 + 40), str(m), font=f(20, mono=True), fill=T3, anchor='ms')
text(d, ((gx0 + gx1) / 2, gy1 + 74), 'months', font=f(20, mono=True), fill=T3, anchor='ms')
zero = 5000000 / 600000
d.line([(px(0), py(5000000)), (px(zero), py(0))], fill=PINK, width=5)
d.ellipse([px(zero) - 9, py(0) - 9, px(zero) + 9, py(0) + 9], fill=PINK)
text(d, (px(zero) + 14, py(0) - 22), 'Cash hits zero at 8.3 months', font=f(24, bold=True), fill=PINK)
d.line([(px(m), py(v)) for m, v in enumerate(grow)], fill=AC, width=5, joint='curve')
text(d, (px(18) - 10, py(grow[18]) - 26), 'Revenue +10% a month: default alive', font=f(24, bold=True), fill=AC, anchor='rs')
save(im, 'tool-runway-curve.png')

# 4. Runway formula card
im, d = canvas('Runway · the formula', 'Runway in three lines')
steps = [('Net burn', 'gross burn − revenue', '₹10,00,000 − ₹4,00,000 = ₹6,00,000 a month'),
         ('Runway', 'cash ÷ net burn', '₹50,00,000 ÷ ₹6,00,000 = 8.3 months'),
         ('Zero-cash date', 'today + runway', 'the day the bank balance would reach ₹0')]
for i, (a, b, c) in enumerate(steps):
    y = 200 + i * 200
    d.rounded_rectangle([80, y, 1520, y + 176], radius=16, outline=LN, width=2, fill=CARD)
    text(d, (112, y + 30), a.upper(), font=f(22, mono=True), fill=AC)
    text(d, (112, y + 68), a + ' = ' + b, font=f(38, bold=True), fill=TX)
    text(d, (112, y + 122), c, font=f(26, mono=True), fill=T2)
save(im, 'tool-runway-formula.png')

# 5. Cap table before / after
im, d = canvas('Cap table · priced round with a SAFE', 'Who owns what, before and after')
text(d, (80, 172), '$20M pre-money, $5M raised, pool topped up to 10%, $1M SAFE at a $10M post-money cap', font=f(26), fill=T2)
bars = [('Before the round', [('Founders', 90, AC), ('Option pool', 10, BLUE)]),
        ('After the round', [('Founders', 62.31, AC), ('Option pool', 10.00, BLUE), ('SAFE', 7.69, PINK), ('New investors', 20.00, TX)])]
bx0, bx1 = 80, 1520
for i, (lab, segs) in enumerate(bars):
    y = 300 + i * 260
    text(d, (bx0, y - 46), lab.upper(), font=f(22, mono=True), fill=T3)
    x = bx0
    for name, pct, col in segs:
        w = pct / 100 * (bx1 - bx0)
        d.rectangle([x, y, x + w - 3, y + 110], fill=col)
        fc = BG if col in (TX, AC) else TX
        if w > 150:
            text(d, (x + 18, y + 22), f'{pct:.2f}%' if i else f'{pct:g}%', font=f(32, bold=True), fill=fc)
            text(d, (x + 18, y + 68), name, font=f(22), fill=fc)
        else:
            text(d, (x + w / 2, y + 150), f'{pct:.2f}%' if i else f'{pct:g}%', font=f(24, bold=True), fill=col, anchor='ms')
            text(d, (x + w / 2, y + 182), name, font=f(20), fill=T2, anchor='ms')
        x += w
save(im, 'tool-captable-before-after.png')

# 6. SAFE conversion
im, d = canvas('Cap table · how the SAFE converts', 'A $1M SAFE at a $10M post-money cap')
lines = [('Ownership', '$1M ÷ $10M post-money cap = 10%', 'of the company measured before the round'),
         ('SAFE shares', '1,111,111 shares', 'on 10,000,000 existing shares + the SAFE shares (10% of 11,111,111)'),
         ('Round price', '$1.7308 a share', 'the price new investors pay in the priced round'),
         ('After the round', 'SAFE holds 7.69%', 'diluted by the new money and the option pool top-up')]
for i, (a, b, c) in enumerate(lines):
    y = 200 + i * 150
    d.rounded_rectangle([80, y, 1520, y + 130], radius=16, outline=LN, width=2, fill=CARD)
    text(d, (112, y + 28), a.upper(), font=f(20, mono=True), fill=T3)
    text(d, (112, y + 58), b, font=f(36, bold=True), fill=AC if i == 3 else TX)
    text(d, (1488, y + 66), c, font=f(22), fill=T2, anchor='ra')
save(im, 'tool-captable-safe.png')

# 7. Equity split default weights
im, d = canvas('Co-founder equity split · default weights', 'What the calculator weighs')
factors = [('Full-time commitment', 25), ('Role and responsibility', 20), ('Skills and domain expertise', 15),
           ('Idea and early work', 10), ('Capital put in', 10), ('Network and customers', 10), ('Risk taken', 10)]
hbars(d, factors, 220, 420, 25, lambda v: str(v), row_h=72, bar_h=44, right=1400)
text(d, (80, 760), 'Total 100. Change any weight to match what matters in your company.', font=f(26), fill=T2)
save(im, 'tool-equity-factors.png')

# 8. Equity split example
im, d = canvas('Co-founder equity split · worked example', 'Two founders, seven factors')
names = ['Full-time commitment', 'Role and responsibility', 'Skills and domain expertise', 'Idea and early work',
         'Capital put in', 'Network and customers', 'Risk taken']
wts, A, B = [25, 20, 15, 10, 10, 10, 10], [10, 9, 8, 10, 5, 6, 8], [10, 8, 9, 4, 5, 8, 8]
text(d, (80, 200), 'FACTOR (WEIGHT)', font=f(20, mono=True), fill=T3)
text(d, (880, 200), 'A', font=f(24, mono=True), fill=AC, anchor='ma')
text(d, (1000, 200), 'B', font=f(24, mono=True), fill=PINK, anchor='ma')
for i, n in enumerate(names):
    y = 248 + i * 58
    d.line([(80, y + 46), (1060, y + 46)], fill=LN, width=1)
    text(d, (80, y + 8), f'{n} ({wts[i]})', font=f(26), fill=T2)
    text(d, (880, y + 6), str(A[i]), font=f(28, bold=True), fill=TX, anchor='ma')
    text(d, (1000, y + 6), str(B[i]), font=f(28, bold=True), fill=TX, anchor='ma')
card(d, 1130, 248, 390, 190, 'Founder A', '51.4%', None, col=AC, vsize=80)
card(d, 1130, 462, 390, 190, 'Founder B', '48.6%', None, col=PINK, vsize=80)
text(d, (80, 730), 'Scores out of 10, weighted and summed, then shared in proportion.', font=f(24), fill=T2)
text(d, (80, 772), 'A starting point for the conversation, not a verdict.', font=f(26, bold=True), fill=TX)
save(im, 'tool-equity-example.png')

# 9. ROI worked example
im, d = canvas('Software ROI · worked example', 'Does the tool pay for itself?')
text(d, (80, 172), '10 users × 2 hours a week saved × ₹1,000 an hour', font=f(28), fill=T2)
cards = [('Time saved a month', '₹86,667', 'value of the hours', TX), ('Tool cost a month', '₹20,000', 'subscription', TX),
         ('Net a month', '₹66,667', 'saved minus cost', AC), ('Setup cost', '₹50,000', 'one-time', TX),
         ('Payback', '0.75 months', 'setup ÷ net a month', PINK), ('Year-one ROI', '258.6%', 'after setup and 12 months', AC)]
for i, (a, b, c, col) in enumerate(cards):
    card(d, 80 + (i % 3) * 490, 230 + (i // 3) * 280, 460, 250, a, b, c, col=col, vsize=60)
save(im, 'tool-roi-example.png')

# 10. ROI payback curve
im, d = canvas('Software ROI · cumulative value', 'Paid back inside the first month')
cum = [-50000 + 66667 * m for m in range(13)]
gx0, gx1, gy0, gy1 = 240, 1500, 220, 740
lo, hi = -200000, 800000
px = lambda m: gx0 + m / 12 * (gx1 - gx0)
py = lambda v: gy1 - (v - lo) / (hi - lo) * (gy1 - gy0)
for v in range(-200000, 800001, 100000):
    d.line([(gx0, py(v)), (gx1, py(v))], fill=T3 if v == 0 else LN, width=2 if v == 0 else 1)
    if v % 200000 == 0:
        text(d, (gx0 - 20, py(v) + 8), ('−' + inr(-v)) if v < 0 else inr(v), font=f(20, mono=True), fill=T3, anchor='rs')
for m in range(0, 13):
    text(d, (px(m), gy1 + 40), str(m), font=f(20, mono=True), fill=T3, anchor='ms')
text(d, ((gx0 + gx1) / 2, gy1 + 74), 'months', font=f(20, mono=True), fill=T3, anchor='ms')
d.line([(px(m), py(v)) for m, v in enumerate(cum)], fill=AC, width=5)
for m, v in enumerate(cum):
    d.ellipse([px(m) - 6, py(v) - 6, px(m) + 6, py(v) + 6], fill=AC)
text(d, (px(0) + 16, py(-50000) + 36), 'Start: −₹50,000 setup', font=f(22), fill=PINK)
text(d, (px(1) + 20, py(16667) + 34), 'Month 1: ₹16,667', font=f(22, bold=True), fill=TX)
text(d, (px(12) - 16, py(750000) - 16), 'Month 12: ₹7,50,000', font=f(24, bold=True), fill=AC, anchor='rs')
text(d, (px(6) - 20, py(cum[6]) - 24), '+₹66,667 every month', font=f(24), fill=T2, anchor='rs')
save(im, 'tool-roi-payback.png')

# 11. SaaS LTV:CAC
im, d = canvas('SaaS metrics · worked example', 'LTV:CAC and CAC payback')
card(d, 80, 210, 700, 260, 'Lifetime value (LTV)', '₹1,33,333', 'ARPA ₹5,000 × 80% gross margin ÷ 3% monthly churn', col=TX)
card(d, 820, 210, 700, 260, 'Customer acquisition cost', '₹40,000', '₹4,00,000 spend ÷ 10 new customers', col=TX)
card(d, 80, 510, 700, 260, 'LTV:CAC', '3.3 : 1', '₹1,33,333 ÷ ₹40,000', col=AC)
card(d, 820, 510, 700, 260, 'CAC payback', '10 months', '₹40,000 ÷ (₹5,000 × 80%) a month', col=PINK)
save(im, 'tool-saas-ltv-cac.png')

# 12. NRR waterfall
im, d = canvas('SaaS metrics · net revenue retention', 'From ₹10 lakh to ₹10.2 lakh MRR: NRR 102%')
steps = [('Starting MRR', 1000000, 'total'), ('Expansion', 150000, 'up'), ('Contraction', -50000, 'down'),
         ('Churned', -80000, 'down'), ('Ending MRR', 1020000, 'final')]
base, lo = 690, 800000
sc = 480 / (1200000 - lo)
yv = lambda v: base - (v - lo) * sc
bw, run = 200, 0
for i, (lab, v, kind) in enumerate(steps):
    x = 140 + i * 280
    if kind in ('total', 'final'):
        y1, y2, run, col = yv(v), base, v, (TX if kind == 'total' else AC)
        val = inr(v)
    else:
        a, b = yv(run), yv(run + v)
        y1, y2 = min(a, b), max(a, b)
        run += v
        col = BLUE if v > 0 else PINK
        val = ('+' + inr(v)) if v > 0 else ('−' + inr(-v))
    d.rectangle([x, y1, x + bw, y2], fill=col)
    text(d, (x + bw / 2, y1 - 16), val, font=f(26, bold=True), fill=TX, anchor='ms')
    text(d, (x + bw / 2, base + 42), lab, font=f(24), fill=T2, anchor='ms')
d.line([(110, base), (1520, base)], fill=LN, width=2)
text(d, (110, base + 84), 'Axis starts at ₹8 lakh. NRR = ending MRR from the same customers ÷ starting MRR = 102%', font=f(22), fill=T3)
save(im, 'tool-saas-nrr.png')

# 13. Startup cost formula
im, d = canvas('Startup cost · the formula', 'How much cash you need to start')
boxes = [('One-time costs', 'setup, deposits, registrations', TX), ('Monthly costs', '× months until revenue', TX),
         ('Contingency buffer', 'for what you did not plan', TX), ('Cash you need', 'before the first rupee in', AC)]
ops = ['+', '+', '=']
bw2, gap = 310, 66
for i, (a, b, col) in enumerate(boxes):
    x = 80 + i * (bw2 + gap)
    d.rounded_rectangle([x, 330, x + bw2, 560], radius=16, outline=AC if i == 3 else LN, width=2, fill=CARD)
    text(d, (x + bw2 / 2, 405), a, font=f(28, bold=True), fill=col, anchor='ma')
    text(d, (x + bw2 / 2, 465), b, font=f(20), fill=T2, anchor='ma')
    if i < 3:
        text(d, (x + bw2 + gap / 2, 405), ops[i], font=f(56, bold=True), fill=PINK, anchor='ma')
text(d, (80, 660), 'One-time + (Monthly × months until revenue) + buffer = cash you need', font=f(32, mono=True), fill=TX)
save(im, 'tool-startup-cost-formula.png')

# 14. Startup cost checklist
im, d = canvas('Startup cost · what to budget for', 'The checklist')
colsx = [('One-time', ['Company incorporation', 'Trademark', 'GST and other registrations', 'Laptops and equipment',
                       'Office deposit and setup', 'Website and branding', 'Legal and agreements']),
         ('Monthly', ['Salaries', 'Office rent', 'Software tools', 'Cloud hosting', 'Marketing', 'Accounting and compliance'])]
for ci, (head, items) in enumerate(colsx):
    x = 80 + ci * 740
    text(d, (x, 200), head.upper(), font=f(26, mono=True), fill=AC if ci == 0 else PINK)
    for j, it in enumerate(items):
        y = 262 + j * 72
        d.rounded_rectangle([x, y, x + 32, y + 32], radius=6, outline=AC if ci == 0 else PINK, width=3)
        text(d, (x + 56, y), it, font=f(30), fill=TX)
save(im, 'tool-startup-cost-checklist.png')

# 15. ESOP vesting
im, d = canvas('ESOP · vesting schedule', '4,800 options, 1-year cliff, 4 years monthly')
gx0, gx1, gy0, gy1 = 220, 1500, 220, 740
px = lambda m: gx0 + m / 48 * (gx1 - gx0)
py = lambda v: gy1 - v / 4800 * (gy1 - gy0)
for v in range(0, 4801, 1200):
    d.line([(gx0, py(v)), (gx1, py(v))], fill=LN, width=2 if v == 0 else 1)
    text(d, (gx0 - 20, py(v) + 8), f'{v:,}', font=f(20, mono=True), fill=T3, anchor='rs')
for m in range(0, 49, 12):
    text(d, (px(m), gy1 + 40), str(m), font=f(20, mono=True), fill=T3, anchor='ms')
text(d, ((gx0 + gx1) / 2, gy1 + 74), 'months', font=f(20, mono=True), fill=T3, anchor='ms')
pts = [(px(0), py(0)), (px(12), py(0)), (px(12), py(1200))]
for m in range(13, 49):
    pts += [(px(m), py(1200 + 100 * (m - 13))), (px(m), py(1200 + 100 * (m - 12)))]
d.line(pts, fill=AC, width=4)
text(d, (px(12) - 14, py(1200) - 10), 'Cliff: 1,200 at month 12', font=f(22), fill=T2, anchor='rs')
mx, my = px(18), py(1800)
d.line([(mx, my), (mx, gy1)], fill=PINK, width=2)
d.ellipse([mx - 9, my - 9, mx + 9, my + 9], fill=PINK)
text(d, (mx - 14, my - 22), 'Month 18: 1,800 vested (37.5%)', font=f(24, bold=True), fill=PINK, anchor='rs')
text(d, (px(48), py(3900)), '4,800 at month 48', font=f(22), fill=AC, anchor='ra')
save(im, 'tool-esop-vesting.png')

# 16. ESOP tax timeline
im, d = canvas('ESOP · when tax hits (India)', 'Grant, vest, exercise, sale')
stages = [('Grant', 'No tax', [], T2), ('Vest', 'No tax', [], T2),
          ('Exercise', 'Perquisite tax', ['FMV − exercise price', 'taxed as salary at', 'your slab rate'], AC),
          ('Sale', 'Capital gains tax', ['sale price − FMV at exercise', '12.5% if unlisted, held', 'over 24 months; else slab rate'], PINK)]
xs = [200, 560, 920, 1280]
y = 300
d.line([(xs[0], y), (xs[-1], y)], fill=LN, width=4)
for i in range(3):
    arrow(d, xs[i] + 20, y, xs[i + 1] - 22, col=T3)
for i, (a, b, ls, col) in enumerate(stages):
    x = xs[i]
    d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=col if col != T2 else LN, outline=col, width=3)
    text(d, (x, y - 70), a.upper(), font=f(26, mono=True), fill=TX, anchor='ma')
    text(d, (x, y + 50), b, font=f(30, bold=True), fill=col if col != T2 else TX, anchor='ma')
    for j, l in enumerate(ls):
        text(d, (x, y + 104 + j * 38), l, font=f(24), fill=T2, anchor='ma')
text(d, (80, 680), 'Not tax advice.', font=f(26, bold=True), fill=TX)
save(im, 'tool-esop-tax.png')

# 17. GPU hourly prices
im, d = canvas('GPU cost · on-demand, US East, as of 20 Oct 2026', 'Price per GPU-hour (USD)')
gpus = [('AWS p6-b200.48xlarge (B200)', 14.24), ('Azure ND96isr H100 v5', 12.29), ('Azure NC40ads H100 v5', 6.98),
        ('AWS p5.4xlarge (H100)', 6.88), ('AWS p5.48xlarge (H100)', 6.88), ('Azure NC24ads A100 v4', 3.67),
        ('AWS p4d.24xlarge (A100 40GB)', 2.74), ('AWS g6e.xlarge (L40S)', 1.86), ('AWS g5.xlarge (A10G)', 1.01)]
hbars(d, gpus, 200, 480, 14.24, lambda v: f'${v:.2f}', row_h=62, bar_h=38, right=1400,
      cols=[AC if g.startswith('AWS') else BLUE for g, _ in gpus])
text(d, (1520, H - 60), 'AWS violet, Azure blue · list prices', font=f(20, mono=True), fill=T3, anchor='ra')
save(im, 'tool-gpu-hourly.png')

# 18. GPU worked example
im, d = canvas('GPU cost · worked example', 'AWS p5.48xlarge for a month')
text(d, (80, 172), '8× NVIDIA H100, on-demand, running around the clock', font=f(28), fill=T2)
text(d, (80, 300), '$55.04 an hour × 24 hours × 30 days', font=f(44, mono=True), fill=TX)
card(d, 80, 400, 453, 260, 'Monthly bill', '$39,628.80', 'a month', col=AC, vsize=60)
card(d, 573, 400, 453, 260, 'GPU-hours', '5,760', '8 GPUs × 720 hours', col=TX, vsize=60)
card(d, 1066, 400, 454, 260, 'Per GPU-hour', '$6.88', '$55.04 ÷ 8', col=PINK, vsize=60)
save(im, 'tool-gpu-example.png')
