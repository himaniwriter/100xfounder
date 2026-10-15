"""Builds the 100xFounder social images and logo: HTML templates rendered by headless Chrome.
Run: python3 wordpress/design/build.py  (writes PNGs into wordpress/100xfounder/assets/brand/)"""
import os, subprocess, pathlib
HERE = pathlib.Path(__file__).resolve().parent
FONTS = (HERE.parent / '100xfounder-theme/assets/fonts').as_uri()
OUT = HERE.parent / '100xfounder/assets/brand'; OUT.mkdir(parents=True, exist_ok=True)
WORDMARK = (HERE.parent / '100xfounder/assets/brand/100xfounder-wordmark.png').as_uri()
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

MARK = '<svg viewBox="0 0 22 22" width="{s}" height="{s}"><rect width="22" height="22" rx="6" fill="#f2f2ef"/><path d="M6 15.5 11 6.5l5 9" stroke="#0b0b0c" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# Abstract right-hand motifs, one per section (no fake names or numbers).
ART = {
 'grid': '''<div class="tiles">''' + ''.join(f'<i style="--d:{i%5}"></i>' for i in range(20)) + '</div>',
 'jobs': '<div class="cards">' + ''.join(f'<div class="card" style="--i:{i}"><b></b><span></span><span class="s"></span><em></em></div>' for i in range(4)) + '</div>',
 'rupee': '<div class="glyph">₹</div>',
 'up': '<div class="glyph">%<small>↑</small></div>',
 'clock': '<div class="ring"><div class="hand"></div></div>',
 'rocket': '<div class="bars">' + ''.join(f'<i style="--h:{h}"></i>' for h in (28,44,36,62,50,78,96)) + '</div>',
 'cal': '<div class="cal">' + ''.join(f'<i class="{"on" if i in (9,17,23) else ""}"></i>' for i in range(28)) + '</div>',
 'doc': '<div class="doc"><b></b><span></span><span></span><span class="s"></span><span></span><span class="s"></span></div>',
 'tools': '<div class="glyph">=</div>',
}

IMAGES = [
 ('og-default', 'Startups · Launches · Jobs', 'The <g>founder</g> front page for India.', 'Startup and funding news, daily launches, jobs from official careers pages and free tools.', 'grid'),
 ('og-news', 'News', 'Startup news, <g>sourced</g>.', 'Funding, launches and founder stories from India and the US, reviewed by an editor.', 'doc'),
 ('og-jobs', 'Jobs in India', 'Jobs straight from <g>official</g> careers pages.', 'Startups and top companies, updated daily. Filter by role and city, apply on the company site.', 'jobs'),
 ('og-tools', 'Free tools', 'Free salary <g>calculators</g> for India.', 'In-hand salary, salary hike and notice period buyout. No sign-up.', 'tools'),
 ('og-tool-in-hand-salary-calculator', 'Free tool · FY 2025-26', 'In-hand salary <g>calculator</g>.', 'Turn your CTC into monthly take-home pay under the new or old tax regime.', 'rupee'),
 ('og-tool-salary-hike-calculator', 'Free tool', 'Salary hike <g>calculator</g>.', 'See your new CTC and how much more lands in your account each month.', 'up'),
 ('og-tool-notice-period-buyout-calculator', 'Free tool', 'Notice period <g>buyout</g> calculator.', 'Work out what it costs to buy out the rest of your notice period.', 'clock'),
 ('og-launches', 'Launches', 'Today\'s <g>launches</g>, ranked.', 'New products from Product Hunt, with their founders, refreshed every day.', 'rocket'),
 ('og-funding', 'Funding tracker', 'Who raised, <g>and from whom</g>.', 'Startup funding rounds with amount, stage, investors and a source for every round.', 'rocket'),
 ('og-events', 'Events', 'Startup and AI <g>events</g>.', 'Meetups and conferences in Bengaluru, Delhi NCR, Mumbai and online.', 'cal'),
 ('og-guides', 'How to apply', 'How to get hired at <g>top companies</g>.', 'Hiring process, interview rounds and tips, with sources.', 'doc'),
]

CSS = '''
@font-face{font-family:Inter;src:url(FONTS/inter-400.woff2);font-weight:400}
@font-face{font-family:Inter;src:url(FONTS/inter-500.woff2);font-weight:500}
@font-face{font-family:Inter;src:url(FONTS/inter-600.woff2);font-weight:600}
@font-face{font-family:Inter;src:url(FONTS/inter-700.woff2);font-weight:700}
@font-face{font-family:Geist Mono;src:url(FONTS/geist-mono-500.woff2);font-weight:500}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden;background:#0b0b0c}
body{font-family:Inter;color:#f2f2ef;-webkit-font-smoothing:antialiased;position:relative}
.bg{position:absolute;inset:0;background:
 radial-gradient(520px 420px at 92% 18%,rgba(124,92,255,.42),transparent 70%),
 radial-gradient(460px 380px at 78% 105%,rgba(255,106,213,.30),transparent 70%),
 radial-gradient(600px 400px at -5% 110%,rgba(106,123,255,.18),transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(900px 600px at 80% 40%,#000 20%,transparent 75%)}
.hl{position:absolute;left:0;right:0;top:0;height:4px;background:linear-gradient(90deg,#7c5cff,#b07cff,#ff6ad5,#6a7bff)}
.wrap{position:absolute;left:72px;top:64px;bottom:60px;width:640px;display:flex;flex-direction:column}
.k{font-family:'Geist Mono';font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:#b07cff;display:flex;align-items:center;gap:12px}
.k:before{content:"";width:28px;height:2px;background:linear-gradient(90deg,#7c5cff,#ff6ad5)}
h1{font-size:68px;line-height:1.02;letter-spacing:-.045em;font-weight:700;margin-top:30px}
g{background:linear-gradient(90deg,#9b7bff,#ff6ad5 60%,#8a96ff);-webkit-background-clip:text;color:transparent}
p{font-size:25px;line-height:1.4;color:#a6a6a2;margin-top:24px;letter-spacing:-.01em}
.foot{margin-top:auto;display:flex;align-items:center;gap:14px;font-weight:700;font-size:28px;letter-spacing:-.035em}
.dom{position:absolute;right:72px;bottom:72px;font-family:'Geist Mono';font-weight:500;font-size:19px;color:#8c8c88;letter-spacing:.02em}
.art{position:absolute;right:56px;top:96px;width:400px;height:440px;display:flex;align-items:center;justify-content:center}
.glyph{font-size:300px;font-weight:700;letter-spacing:-.06em;line-height:1;background:linear-gradient(160deg,#c9b2ff 0%,#b07cff 35%,#ff6ad5 75%,#6a7bff);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 30px 60px rgba(176,124,255,.35));position:relative}
.glyph small{font-size:140px;position:absolute;right:-70px;top:10px}
.panel{background:rgba(18,18,20,.72);border:1px solid #303035;border-radius:18px;backdrop-filter:blur(6px)}
.cards{position:relative;width:380px;height:400px}
.card{position:absolute;left:calc(var(--i)*14px);top:calc(var(--i)*92px);width:340px;height:76px;border-radius:14px;background:rgba(18,18,20,.82);border:1px solid #303035;display:grid;grid-template-columns:44px 1fr auto;grid-template-rows:1fr 1fr;column-gap:14px;padding:14px 16px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.card b{grid-row:1/3;border-radius:10px;background:linear-gradient(135deg,#7c5cff,#ff6ad5);opacity:calc(1 - var(--i)*.18)}
.card span{height:10px;border-radius:5px;background:#3a3a40;align-self:center;width:85%}
.card span.s{width:55%;background:#2a2a2f}
.card em{grid-row:1/3;grid-column:3;align-self:center;width:58px;height:26px;border-radius:13px;border:1px solid #b07cff;opacity:.8}
.tiles{display:grid;grid-template-columns:repeat(5,64px);gap:14px;transform:rotate(-8deg)}
.tiles i{height:64px;border-radius:14px;border:1px solid #303035;background:rgba(18,18,20,.7)}
.tiles i:nth-child(7),.tiles i:nth-child(13){background:linear-gradient(135deg,#7c5cff,#ff6ad5);border:0;box-shadow:0 0 40px rgba(176,124,255,.5)}
.tiles i:nth-child(3),.tiles i:nth-child(19){background:linear-gradient(135deg,#6a7bff,#b07cff);border:0;opacity:.75}
.tiles i:nth-child(10){border-color:#b07cff}
.bars{display:flex;align-items:flex-end;gap:16px;height:340px;padding:0 10px;border-bottom:1px solid #303035}
.bars i{width:34px;height:calc(var(--h)*1%);border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#ff6ad5,#7c5cff 70%,rgba(124,92,255,.25))}
.bars i:not(:last-child){opacity:.55}
.bars i:last-child{box-shadow:0 0 50px rgba(255,106,213,.55)}
.cal{display:grid;grid-template-columns:repeat(7,42px);gap:10px;padding:26px;border-radius:20px;background:rgba(18,18,20,.8);border:1px solid #303035}
.cal i{height:42px;border-radius:10px;background:#1b1b1f}
.cal i.on{background:linear-gradient(135deg,#7c5cff,#ff6ad5);box-shadow:0 0 30px rgba(255,106,213,.45)}
.ring{width:300px;height:300px;border-radius:50%;border:16px solid #232326;position:relative;background:conic-gradient(from 0deg,#7c5cff,#ff6ad5 62%,transparent 62%);-webkit-mask:radial-gradient(circle,transparent 118px,#000 119px)}
.ring .hand{display:none}
.doc{width:330px;height:400px;border-radius:20px;background:rgba(18,18,20,.82);border:1px solid #303035;padding:34px;display:flex;flex-direction:column;gap:20px;transform:rotate(4deg);box-shadow:0 30px 60px rgba(0,0,0,.4)}
.doc b{height:120px;border-radius:12px;background:linear-gradient(135deg,#7c5cff,#ff6ad5 70%,#6a7bff)}
.doc span{height:12px;border-radius:6px;background:#3a3a40}
.doc span.s{width:60%;background:#2a2a2f}
'''.replace('FONTS', FONTS)

def page(body, w, h):
    return f'<!doctype html><meta charset=utf-8><style>{CSS}html,body{{width:{w}px;height:{h}px}}</style><body>{body}</body>'

def shot(name, html, w, h):
    src = HERE / 'og' / f'{name}.html'; src.write_text(html)
    png = OUT / f'{name}.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    f'--window-size={w},{h}', f'--screenshot={png}', '--virtual-time-budget=3000', src.as_uri()],
                   check=True, capture_output=True)
    print(png.relative_to(HERE.parent))

for name, kicker, title, sub, art in IMAGES:
    body = f'''<div class="bg"></div><div class="grid"></div><div class="hl"></div>
<div class="art">{ART[art]}</div>
<div class="wrap"><div class="k">{kicker}</div><h1>{title}</h1><p>{sub}</p>
<div class="foot"><img src="{WORDMARK}" alt="" style="height:40px"></div></div><div class="dom">100xfounder.com</div>'''
    shot(name, page(body, 1200, 630), 1200, 630)

# Square logo for Organization schema: the wordmark on the brand background.
logo = f'''<div class="bg" style="background:radial-gradient(360px 360px at 85% 0%,rgba(124,92,255,.55),transparent 70%),radial-gradient(360px 360px at 0% 100%,rgba(255,106,213,.35),transparent 70%)"></div>
<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><img src="{WORDMARK}" style="width:420px"></div>'''
shot('logo-512', page(logo, 512, 512), 512, 512)
# Favicon / app icon: the X from the wordmark (og/x-glyph.png, cropped from it) on a rounded dark tile.
XGLYPH = (HERE / 'og/x-glyph.png').as_uri()
icon = f'''<div style="position:absolute;inset:0;border-radius:112px;background:radial-gradient(300px 300px at 85% 0%,rgba(124,92,255,.6),transparent 70%),#0b0b0c;display:flex;align-items:center;justify-content:center">
<img src="{XGLYPH}" style="width:330px"></div>'''
shot('icon-512', page(icon, 512, 512).replace('html,body{width:512px;height:512px}', 'html,body{width:512px;height:512px;background:transparent}'), 512, 512)

# Editorial images for on-page frames (16:10, no text, so nothing is cropped or repeated).
CARDS = [('card-jobs', 'jobs'), ('card-tool-in-hand-salary-calculator', 'rupee'), ('card-tool-salary-hike-calculator', 'up'),
         ('card-tool-notice-period-buyout-calculator', 'clock'), ('card-tools', 'tools'), ('card-news', 'doc'),
         ('card-launches', 'rocket'), ('card-events', 'cal'), ('card-default', 'grid')]
for name, art in CARDS:
    body = f'''<div class="bg" style="background:radial-gradient(700px 520px at 78% 12%,rgba(124,92,255,.5),transparent 70%),radial-gradient(620px 460px at 18% 105%,rgba(255,106,213,.32),transparent 70%),radial-gradient(500px 400px at 0% 0%,rgba(106,123,255,.2),transparent 70%)"></div>
<div class="grid" style="mask-image:radial-gradient(900px 700px at 50% 50%,#000 25%,transparent 80%)"></div>
<div class="art" style="left:0;right:0;top:0;bottom:0;width:auto;height:auto;transform:scale(1.55)">{ART[art]}</div>'''
    shot(name, page(body, 1600, 1000), 1600, 1000)
    # Photos-style cards ship as JPEG (~80 KB instead of ~350 KB).
    png = OUT / f'{name}.png'
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', str(png), '--out', str(png.with_suffix('.jpg'))], check=True, capture_output=True)
    png.unlink()
