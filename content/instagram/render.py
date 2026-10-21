#!/usr/bin/env python3
"""Render an Instagram post (1080x1350 slides) from a JSON spec, in the 100xFounder Poster System.

    python3 content/instagram/render.py content/instagram/<post>/post.json

Writes <post>/slide-N.png next to the spec. Images in the spec are paths relative to the spec's folder.
Rules (design system "100xFounder Poster System"): Poppins + one Playfair italic highlight word,
no bold weights, violet-to-blue gradient, centred wordmark, a different credited image on every slide.

Slide keys:
  layout   "cover" (framed photo panel on top) or "bg" (photo full-bleed behind a dark fade)
  img, credit, pos   image path, credit line, CSS object-position
  img_blur           true blurs a bg image (busy app screenshots)
  shade              bg overlay strength 0-1 (default .78; ~.9 for light screenshots)
  logo               optional square brand logo shown above the headline (company/startup logo)
  label              small uppercase line above the headline
  big, big_label     giant figure (e.g. "$5.15B") and its caption
  h1                 [before, highlight, after]
  deck               one sentence; *word* renders in ink 500
  cards              [{"k": label, "v": value, "s": sub, "wide": bool}]
  cta                closing line
  foot               [left, right]
"""
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CSS = """
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;background:#0b0b0c;overflow:hidden}
.p{width:1080px;height:1350px;background:#0b0b0c;color:#f2f2ef;font-family:'Poppins',sans-serif;display:flex;flex-direction:column;position:relative}
.hair{height:6px;background:linear-gradient(90deg,#7c5cff,#b07cff,#7c8cff,#6a7bff)}
.logo{display:flex;justify-content:center;padding:44px 64px 0}.logo img{height:42px}
.acc{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:600;font-size:1.06em;letter-spacing:-.02em;padding:0 .04em;background:linear-gradient(90deg,#b07cff,#7c8cff);-webkit-background-clip:text;background-clip:text;color:transparent}
h1{margin:0;font-weight:400;letter-spacing:-.045em;text-wrap:balance;text-align:center;line-height:1}
.deck{margin:0;font-size:34px;line-height:1.32;color:#a6a6a2;font-weight:400;text-align:center;text-wrap:balance}
.deck b{color:#f2f2ef;font-weight:500}
.lbl{font-size:24px;letter-spacing:.08em;text-transform:uppercase;color:#b07cff;text-align:center}
.foot{display:flex;justify-content:space-between;align-items:center;padding:0 64px 48px;font-size:22px;letter-spacing:.08em;text-transform:uppercase;color:#8c8c88}
.foot .go{color:#f2f2ef;text-transform:none;letter-spacing:.02em}
.card{background:#121214;border:1px solid #232326;border-radius:28px;padding:30px 36px}
.card .k{font-size:20px;letter-spacing:.08em;text-transform:uppercase;color:#8c8c88}
.card .v{font-size:64px;font-weight:400;letter-spacing:-.04em;margin-top:10px;line-height:1.05}
.card .s{font-size:25px;color:#a6a6a2;margin-top:8px;line-height:1.35}
.credit{position:absolute;z-index:2;right:64px;bottom:96px;font-size:15px;color:#c8c8c4;background:rgba(11,11,12,.6);padding:4px 10px;border-radius:6px}
.big{font-size:300px;line-height:.9;font-weight:400;letter-spacing:-.06em;background:linear-gradient(180deg,#d6c4ff 0%,#b07cff 50%,#7c8cff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-align:center}
.blogo{display:flex;justify-content:center}.blogo img{width:150px;height:150px;border-radius:36px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.14)}
.bg{position:absolute;inset:0;z-index:0;overflow:hidden}.bg img{width:100%;height:100%;object-fit:cover;filter:saturate(.9)}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,12,.82) 0%,rgba(11,11,12,.74) 40%,rgba(11,11,12,.9) 100%)}
.p.isbg>*:not(.bg):not(.credit){position:relative;z-index:1}
.p.isbg .card{background:rgba(18,18,20,.62);border-color:rgba(255,255,255,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.p.isbg .deck{color:#d2d2ce}
"""


def esc(s):
    return html.escape(str(s or ""))


def deck_html(s):
    return re.sub(r"\*(.+?)\*", r"<b>\1</b>", esc(s))


def slide_html(sl):
    bg = sl.get("layout") == "bg"
    out = ['<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="fonts/fonts.css"><style>', CSS, "</style></head><body>"]
    out.append(f'<div class="p{" isbg" if bg else ""}">')
    if bg and sl.get("img"):
        # "shade": overlay strength 0-1; raise it for light images such as app screenshots.
        k = float(sl.get("shade", 0.78))
        shade = f"background:linear-gradient(180deg,rgba(11,11,12,{k + .04:.2f}) 0%,rgba(11,11,12,{k - .04:.2f}) 40%,rgba(11,11,12,{min(k + .12, .97):.2f}) 100%)"
        blur = "filter:blur(10px) saturate(.9);transform:scale(1.06);" if sl.get("img_blur") else ""  # img_blur: soften busy screenshots
        out.append(f'<div class="bg"><img src="{esc(sl["img"])}" style="{blur}object-position:{esc(sl.get("pos", "50% 50%"))}"><div class="shade" style="{shade}"></div></div>')
        if sl.get("credit"):
            out.append(f'<div class="credit">{esc(sl["credit"])}</div>')
    out.append('<div class="hair"></div><div class="logo"><img src="brand/wordmark.png" alt=""></div>')
    if not bg and sl.get("img"):
        out.append(f'<div style="margin:40px 64px 0;height:{sl.get("panel_h", 600)}px;border-radius:28px;position:relative;overflow:hidden;border:1px solid #232326;flex:none">'
                   f'<img src="{esc(sl["img"])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:{esc(sl.get("fit", "cover"))};object-position:{esc(sl.get("pos", "50% 50%"))};background:#121214">'
                   '<div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg,rgba(11,11,12,0),#0b0b0c)"></div>'
                   + (f'<div class="credit" style="top:14px;bottom:auto;right:20px">{esc(sl["credit"])}</div>' if sl.get("credit") else "") + "</div>")
    out.append('<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:26px;padding:0 64px">')
    if sl.get("logo"):
        out.append(f'<div class="blogo"><img src="{esc(sl["logo"])}" alt=""></div>')
    if sl.get("label"):
        out.append(f'<div class="lbl">{esc(sl["label"])}</div>')
    if sl.get("big"):
        out.append(f'<div class="big">{esc(sl["big"])}</div>')
        if sl.get("big_label"):
            out.append(f'<div class="lbl" style="color:#a6a6a2;margin-top:-6px">{esc(sl["big_label"])}</div>')
    if sl.get("h1"):
        a, b, c = (sl["h1"] + ["", "", ""])[:3]
        size = sl.get("h1_size", 96)
        out.append(f'<h1 style="font-size:{size}px">{esc(a)}<span class="acc">{esc(b)}</span>{esc(c)}</h1>')
    if sl.get("deck"):
        out.append(f'<p class="deck">{deck_html(sl["deck"])}</p>')
    if sl.get("cards"):
        out.append('<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:10px">')
        for c in sl["cards"]:
            span = "grid-column:1/3;" if c.get("wide") else ""
            vsize = f"font-size:{c['vsize']}px;" if c.get("vsize") else ""
            out.append(f'<div class="card" style="{span}"><div class="k">{esc(c.get("k"))}</div><div class="v" style="{vsize}">{esc(c.get("v"))}</div>'
                       + (f'<div class="s">{esc(c.get("s"))}</div>' if c.get("s") else "") + "</div>")
        out.append("</div>")
    if sl.get("cta"):
        out.append(f'<div style="text-align:center;font-size:32px;line-height:1.35;margin-top:8px">{deck_html(sl["cta"])}<br><span style="color:#b07cff">100xfounder.com</span></div>')
    out.append("</div>")
    left, right = ((sl.get("foot") or ["100xfounder.com", "Swipe →"]) + ["", ""])[:2]
    out.append(f'<div class="foot"><span>{esc(left)}</span><span class="go">{esc(right)}</span></div>')
    out.append("</div></body></html>")
    return "".join(out)


def main(spec_path):
    spec_path = Path(spec_path).resolve()
    folder = spec_path.parent
    spec = json.loads(spec_path.read_text())
    for name in ("fonts", "brand"):
        dst = folder / name
        if not dst.exists():
            shutil.copytree(HERE / name, dst)
    for i, sl in enumerate(spec["slides"], 1):
        page = folder / f".slide-{i}.html"
        page.write_text(slide_html(sl))
        png = folder / f"slide-{i}.png"
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                        "--window-size=1080,1350", "--virtual-time-budget=8000", f"--screenshot={png}", page.as_uri()],
                       check=True, capture_output=True)
        page.unlink()
        print(png)
    for name in ("fonts", "brand"):
        shutil.rmtree(folder / name, ignore_errors=True)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        main(p)
