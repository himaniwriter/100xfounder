#!/usr/bin/env python3
"""Word count and keyword stats for a tool page's content file.

    python3 content/calculators/measure.py <slug> [<slug> ...]

Counts the below-the-fold content the template renders from
wordpress/100xfounder-theme/parts/tools/<slug>.php: the sections, the how-to steps and the FAQ
(not Sources or the template's related-tools block). "Exact" is the main keyword (hyphens and
case ignored); "variants" are natural synonyms and related phrases, counted outside exact matches.
"""
import html, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KW = {
    'in-hand-salary-calculator': ('in hand salary calculator', [
        r'salary calculator for india', r'in hand salary', r'take home (?:pay|salary)', r'salary calculator', r'ctc to in hand', r'net (?:salary|pay)',
        r'salary after tax', r'salary calculator india', r'in hand pay', r'monthly in hand', r'how much (?:salary )?(?:will|do) i get in hand', r'in hand calculator']),
    'salary-hike-calculator': ('salary hike calculator', [
        r'hike percentage calculator', r'salary increment calculator', r'appraisal hike calculator', r'salary hike', r'hike calculator', r'hike percentage', r'pay (?:raise|hike|rise)', r'salary increase', r'salary increment',
        r'increment calculator', r'appraisal hike', r'raise calculator', r'percentage hike', r'how much hike']),
    'notice-period-buyout-calculator': ('notice period buyout calculator', [
        r'notice period buyout', r'notice buyout', r'buyout calculator', r'buyout amount', r'notice pay', r'notice period recovery',
        r'buy out (?:the |your )?(?:rest of (?:the |your )?)?notice', r'notice period calculator', r'buyout cost']),
    'startup-100x-score': ('startup score', [
        r'100x score', r'startup scorecard', r'startup assessment', r'startup readiness', r'score (?:your|my) startup',
        r'startup health check', r'startup evaluation', r'startup self assessment', r'how 100x is your startup']),
    'ai-token-cost-calculator': ('token cost calculator', [
        r'llm api cost calculator', r'api cost calculator', r'token calculator', r'(?:claude|openai|gemini|llm) api cost', r'cost per (?:million )?tokens?',
        r'price per million tokens', r'llm pricing', r'api pricing', r'token costs?', r'token pricing']),
    'runway-calculator': ('runway calculator', [
        r'cash runway', r'financial runway', r'burn rate calculator', r'startup runway', r'burn rate', r'months of runway', r'zero cash date', r'default alive', r'runway']),
    'cap-table-calculator': ('cap table calculator', [
        r'equity dilution calculator', r'dilution calculator', r'safe calculator', r'convertible (?:note|debt) calculator', r'option pool calculator',
        r'cap table', r'dilution', r'ownership after']),
    'cofounder-equity-split-calculator': ('co founder equity split calculator', [
        r'cofounder equity (?:split )?calculator', r'founders? equity calculator', r'equity split between (?:co ?)?founders', r'(?:co ?)?founder equity split',
        r'equity split', r'split equity']),
    'ai-roi-calculator': ('ai roi calculator', [
        r'ai (?:agent|automation|chatbot) roi calculator', r'roi of ai', r'ai roi', r'return on (?:ai|investment)', r'payback period', r'roi calculator', r'hours saved']),
    'saas-metrics-calculator': ('ltv cac calculator', [
        r'saas metrics calculator', r'ltv (?:to )?cac(?: ratio)?', r'cac calculation', r'mrr calculator', r'arr calculation', r'nrr calculator',
        r'churn rate calculator', r'payback period calculator', r'rule of 40', r'saas metrics']),
    'startup-cost-calculator': ('startup cost calculator', [
        r'business startup cost calculator', r'startup costs?', r'cost to start a (?:business|startup)', r'startup budget', r'how much does it cost to start', r'cost of starting']),
    'esop-calculator': ('esop calculator', [
        r'esop calculation', r'esop vesting calculator', r'esop tax(?:ation)?', r'esop value', r'stock options? calculator', r'vesting schedule', r'esops?']),
    'gpu-cost-calculator': ('gpu cost calculator', [
        r'(?:aws|azure) gpu cost calculator', r'gpu pricing', r'h100 price per hour', r'gpu cloud costs?', r'cost per gpu hour', r'price per gpu hour', r'gpu hours?', r'gpu costs?']),
}

def norm(t):
    return re.sub(r'\s+', ' ', re.sub(r'[-:‐-—]', ' ', t.lower()))

def load(slug):
    php = ("define('ABSPATH','/');$c=include $argv[1];echo json_encode($c);")
    out = subprocess.run(['php', '-r', php, os.path.join(ROOT, 'wordpress/100xfounder-theme/parts/tools', slug + '.php')],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def text(c):
    parts = [s['h2'] + ' ' + s['html'] for s in c['sections']]
    h = c.get('howto') or {}
    parts.append(' '.join([h.get('h2', ''), h.get('intro', '')] + [s['name'] + ' ' + s['text'] for s in h.get('steps', [])]))
    parts.append(' '.join(f['q'] + ' ' + f['a'] for f in c.get('faq', [])))
    raw = ' '.join(parts)
    raw = re.sub(r'<figcaption.*?</figcaption>', ' ', raw, flags=re.S)
    return html.unescape(re.sub(r'<[^>]+>', ' ', raw))

for slug in sys.argv[1:]:
    c = load(slug)
    t = norm(text(c))
    words = len(t.split())
    exact, variants = KW[slug]
    n_exact = len(re.findall(r'\b' + re.escape(exact) + r'\b', t))
    rest = re.sub(r'\b' + re.escape(exact) + r'\b', ' ', t)
    n_var = 0
    for v in variants:
        found = re.findall(r'\b' + v + r'\b', rest)
        n_var += len(found)
        rest = re.sub(r'\b' + v + r'\b', ' ', rest)
    imgs = len(re.findall(r'<img\b', ' '.join(s['html'] for s in c['sections'])))
    print(f"{slug}: words={words} exact='{exact}' x{n_exact} ({n_exact * len(exact.split()) / words * 100:.2f}% of words) "
          f"variants={n_var} total={n_exact + n_var} faq={len(c.get('faq', []))} steps={len(c.get('howto', {}).get('steps', []))} "
          f"images_in_content={imgs} sources={len(c.get('sources', []))}")
