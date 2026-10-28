#!/usr/bin/env python3
"""Draw the tool pages' diagrams (1600x900, site dark theme) into the plugin's brand assets.
    python3 content/calculators/make_images.py
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

# 1. In-hand waterfall, 15 LPA new regime
im, d = canvas('In-hand salary · tax year 2026-27 · new regime', 'Where a ₹15 lakh CTC goes')
steps = [('CTC', 1500000, 'total'), ('Employer PF', -36000, 'out'), ('Gratuity', -36075, 'out'), ('Gross', 1427925, 'total'),
         ('Employee PF', -36000, 'out'), ('Prof. tax', -2500, 'out'), ('Tax + cess', -86256, 'out'), ('In-hand', 1303169, 'final')]
x0, top, base, scale = 100, 250, 770, 480 / 1500000
bw, gap, run = 150, 32, 0
for i, (lab, v, kind) in enumerate(steps):
    x = x0 + i * (bw + gap)
    if kind in ('total', 'final'):
        y1, y2, run, col = base - v * scale, base, v, (TX if kind == 'total' else AC)
    else:
        y1, y2, col = base - run * scale, base - (run + v) * scale, PINK
        run += v
        y2 = max(y2, y1 + 4)
    d.rectangle([x, y1, x + bw, y2], fill=col)
    text(d, (x + bw / 2, y1 - 14), (inr(v) if v > 0 else '−' + inr(-v)), font=f(22, mono=True), fill=TX, anchor='ms')
    text(d, (x + bw / 2, base + 40), lab, font=f(24), fill=T2, anchor='ms')
d.line([(x0 - 20, base), (x0 + 8 * (bw + gap), base)], fill=LN, width=2)
text(d, (80, 160), '₹1,08,597 a month in hand · basic 50% of CTC, PF capped at ₹3,000 a month', font=f(28), fill=T2)
save(im, 'tool-in-hand-waterfall.png')

# 2. Regime slabs side by side
im, d = canvas('Income tax slabs · tax year 2026-27', 'New regime vs old regime')
cols = [('New regime (default)', [('Up to ₹4 lakh', 'Nil'), ('₹4–8 lakh', '5%'), ('₹8–12 lakh', '10%'), ('₹12–16 lakh', '15%'),
                                   ('₹16–20 lakh', '20%'), ('₹20–24 lakh', '25%'), ('Above ₹24 lakh', '30%')],
         ['Standard deduction ₹75,000', 'No tax up to ₹12 lakh taxable (87A rebate)']),
        ('Old regime (opt in)', [('Up to ₹2.5 lakh', 'Nil'), ('₹2.5–5 lakh', '5%'), ('₹5–10 lakh', '20%'), ('Above ₹10 lakh', '30%')],
         ['Standard deduction ₹50,000', 'No tax up to ₹5 lakh taxable (87A rebate)', 'HRA, 80C and other deductions allowed'])]
for ci, (head, rows, notes) in enumerate(cols):
    x = 80 + ci * 740
    text(d, (x, 200), head, font=f(32, bold=True), fill=AC if ci == 0 else TX)
    y = 260
    for a, b in rows:
        d.line([(x, y + 52), (x + 680, y + 52)], fill=LN, width=2)
        text(d, (x, y + 10), a, font=f(28), fill=T2)
        text(d, (x + 680, y + 10), b, font=f(28, mono=True), fill=TX, anchor='ra')
        y += 56
    y += 20
    for n in notes:
        text(d, (x, y), '· ' + n, font=f(24), fill=T2); y += 36
text(d, (80, H - 110), 'Plus surcharge above ₹50 lakh and 4% health and education cess. Source: Income Tax Department.', font=f(22), fill=T3)
save(im, 'tool-in-hand-regimes.png')

# 3. Hike worked example
im, d = canvas('Salary hike · worked example · new regime', '₹12 lakh CTC, 30% hike to ₹15.6 lakh')
cards = [('In hand now', '₹91,387', 'a month', TX), ('In hand after', '₹1,12,716', 'a month', TX), ('Extra each month', '+₹21,329', 'a month', AC), ('Share of raise kept', '71%', 'of the CTC increase', PINK)]
for i, (a, b, c, col) in enumerate(cards):
    x, y = 80 + (i % 2) * 740, 220 + (i // 2) * 290
    d.rounded_rectangle([x, y, x + 700, y + 250], radius=16, outline=LN, width=2, fill='#141416')
    text(d, (x + 36, y + 36), a.upper(), font=f(22, mono=True), fill=T3)
    text(d, (x + 36, y + 90), b, font=f(84, bold=True), fill=col)
    text(d, (x + 36, y + 196), c, font=f(24), fill=T2)
text(d, (80, 168), 'CTC rises by ₹30,000 a month; take-home rises by ₹21,329. Basic 50%, PF capped, ₹2,500 professional tax.', font=f(24), fill=T2)
save(im, 'tool-hike-example.png')

# 4. Share of a 30% hike kept, by CTC
im, d = canvas('Salary hike · new regime · 30% hike', 'How much of a 30% hike reaches your account')
data = [('₹6L', 97.6), ('₹10L', 97.6), ('₹15L', 80.2), ('₹25L', 67.6), ('₹40L', 67.1)]
base, left, maxh, bw = 770, 160, 480, 180
for i, (lab, v) in enumerate(data):
    x = left + i * 270
    h = v / 100 * maxh
    d.rectangle([x, base - h, x + bw, base], fill=AC if v > 90 else PINK)
    text(d, (x + bw / 2, base - h - 16), f'{v:.1f}%', font=f(32, bold=True), fill=TX, anchor='ms')
    text(d, (x + bw / 2, base + 44), lab + ' CTC', font=f(26), fill=T2, anchor='ms')
d.line([(left - 30, base), (left + 5 * 270 - 60, base)], fill=LN, width=2)
text(d, (80, 168), 'Share of the extra CTC that lands as take-home pay (rest goes to tax, PF and gratuity).', font=f(26), fill=T2)
save(im, 'tool-hike-kept.png')

# 5. Notice timeline
im, d = canvas('Notice period buyout · worked example', '90-day notice: what is left to buy out')
x0, x1, y = 80, 1520, 330
unit = (x1 - x0) / 90
segs = [(30, 'Served', TX, '30 days'), (10, 'Leave set off', BLUE, '10 days'), (50, 'To buy out', AC, '50 days')]
x = x0
for i, (n, lab, col, txt) in enumerate(segs):
    d.rectangle([x, y, x + n * unit - 4, y + 110], fill=col)
    lx = x + 16 if i != 1 else x + 16
    ly = y + 150 if i != 1 else y - 110
    text(d, (lx, ly), lab.upper(), font=f(22, mono=True), fill=T2)
    text(d, (lx, ly + 36), txt, font=f(34, bold=True), fill=TX)
    x += n * unit
text(d, (80, 620), 'Rate: ₹60,000 monthly pay ÷ 30 = ₹2,000 a day', font=f(32), fill=T2)
text(d, (80, 680), 'Buyout: 50 days × ₹2,000 = ₹1,00,000', font=f(44, bold=True), fill=AC)
save(im, 'tool-notice-timeline.png')

# 6. Divisor comparison
im, d = canvas('Notice period buyout · 30 vs 26 days', 'The divisor changes the bill')
rows = [('', '30-day divisor', '26-day divisor'), ('Monthly pay', '₹60,000', '₹60,000'), ('Per-day rate', '₹2,000', '₹2,308'),
        ('Days to buy out', '60', '60'), ('Buyout amount', '₹1,20,000', '₹1,38,462')]
y = 230
for i, (a, b, c) in enumerate(rows):
    fnt = f(24, mono=True) if i == 0 else f(34, bold=(i == len(rows) - 1))
    text(d, (80, y), a, font=f(30), fill=T2)
    text(d, (900, y), b, font=fnt, fill=T3 if i == 0 else TX, anchor='ra')
    text(d, (1480, y), c, font=fnt, fill=T3 if i == 0 else (AC if i == len(rows) - 1 else TX), anchor='ra')
    d.line([(80, y + 66), (1520, y + 66)], fill=LN, width=2)
    y += 100
text(d, (80, 760), 'A 26-day (working-day) divisor makes each day about 15% dearer. Check which one your contract uses.', font=f(26), fill=T2)
save(im, 'tool-notice-divisor.png')
