#!/usr/bin/env python3
"""Render the original article graphics in content/<dir>/*.html to JPEGs we own.

    python3 content/render-graphics.py semrush-graphics

Each HTML file is a self-contained 1600x1000 block in the site's dark theme; headless
Chrome screenshots it, and the result goes to wordpress/100xfounder/assets/brand/
as graphic-<name>.jpg, ready for the article's <!-- xf-graphic-NAME --> marker.
"""
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
FONTS = (ROOT / 'wordpress/100xfounder-theme/assets/fonts').as_uri()
OUT = ROOT / 'wordpress/100xfounder/assets/brand'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

CSS = '''
@font-face{font-family:Inter;src:url(FONTS/inter-400.woff2);font-weight:400}
@font-face{font-family:Inter;src:url(FONTS/inter-500.woff2);font-weight:500}
@font-face{font-family:Inter;src:url(FONTS/inter-600.woff2);font-weight:600}
@font-face{font-family:Inter;src:url(FONTS/inter-700.woff2);font-weight:700}
@font-face{font-family:'Geist Mono';src:url(FONTS/geist-mono-500.woff2);font-weight:500}
:root{--bg:#0b0b0c;--bg2:#121214;--ln:#232326;--ln2:#303035;--tx:#f2f2ef;--t2:#a6a6a2;--t3:#8c8c88;--ac:#b07cff;--ac2:#ff6ad5;--ac3:#6a7bff}
*{box-sizing:border-box;margin:0}
html,body{width:1600px;height:1000px;background:var(--bg);overflow:hidden}
body{font-family:Inter,system-ui,sans-serif;color:var(--tx);-webkit-font-smoothing:antialiased;padding:64px;position:relative}
body::before{content:"";position:absolute;left:0;right:0;top:0;height:6px;background:linear-gradient(90deg,#7c5cff,#b07cff,#ff6ad5,#6a7bff)}
.k{font-family:'Geist Mono',monospace;font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:var(--ac)}
h1{font-size:50px;line-height:1.05;letter-spacing:-.035em;font-weight:700;margin:14px 0 8px}
.sub{font-size:22px;color:var(--t2);margin-bottom:26px}
table{width:100%;border-collapse:collapse;font-size:21px}
th{text-align:left;font-family:'Geist Mono',monospace;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);padding:12px 14px;border-bottom:1px solid var(--ln2)}
td{padding:14px;border-bottom:1px solid var(--ln);color:#d6d6d2}
td strong{color:var(--tx)}
.pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:16px;background:linear-gradient(90deg,#7c5cff,#ff6ad5);color:#fff}
.foot{position:absolute;left:64px;right:64px;bottom:28px;display:flex;justify-content:space-between;font-family:'Geist Mono',monospace;font-size:15px;color:var(--t3)}
'''.replace('FONTS', FONTS)


def main():
    src_dir = HERE / (sys.argv[1] if len(sys.argv) > 1 else 'semrush-graphics')
    OUT.mkdir(parents=True, exist_ok=True)
    for src in sorted(src_dir.glob('*.html')):
        body = src.read_text()
        page = f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{body}</body>'
        tmp = src.with_suffix('.render.html')
        tmp.write_text(page)
        png = OUT / f'graphic-{src.stem}.png'
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                        '--force-device-scale-factor=1', '--window-size=1600,1000',
                        f'--screenshot={png}', '--virtual-time-budget=4000', tmp.as_uri()],
                       check=True, capture_output=True)
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85',
                        str(png), '--out', str(png.with_suffix('.jpg'))], check=True, capture_output=True)
        png.unlink()
        tmp.unlink()
        print('graphic-' + src.stem + '.jpg')


if __name__ == '__main__':
    main()
