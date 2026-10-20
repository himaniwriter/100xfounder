<?php
/**
 * Free tools (design: FreeTools.dc.html): the hub at /tools/ and each
 * calculator at /tools/{slug}/. All maths runs in assets/js/tools.js.
 */
if (!function_exists('xf_tools')) {
    get_template_part('singular');
    return;
}
$tools = xf_tools();
$tool = xf_current_tool();
$hub = home_url('/tools/');

/* Below-the-fold SEO content for a tool: parts/tools/<slug>.php returns h1, lede, features,
   sections, howto, faq and sources (format: content/calculators/REFERENCE.md). */
$content = [];
if ($tool && ($file = locate_template('parts/tools/' . $tool['slug'] . '.php'))) {
    $content = include $file;
    $content = is_array($content) ? $content : [];
}
$brand = function_exists('xf_brand_asset') ? xf_brand_asset('') : '';
$fill = function ($html) use ($brand) { return str_replace('{{brand}}', esc_url($brand), $html); };

if ($tool) {
    add_action('wp_head', function () use ($tool, $content, $file, $fill) {
        $url = home_url('/tools/' . $tool['slug'] . '/');
        $plain = function ($t) { return trim(preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $t))); };
        $image = null;
        foreach ($content['sections'] ?? [] as $sec) {
            if (preg_match('/<img[^>]+src="([^"]+)"/', $fill($sec['html']), $m)) { $image = html_entity_decode($m[1]); break; }
        }
        $graph = [];
        $page = [
            '@type' => !empty($content['faq']) ? ['WebPage', 'FAQPage'] : 'WebPage',
            '@id' => $url . '#webpage',
            'url' => $url,
            'name' => $tool['seo_title'],
            'description' => $tool['desc'],
            'inLanguage' => 'en-IN',
            'dateModified' => gmdate('c', (int) filemtime($file ?: __FILE__)),
            'about' => ['@id' => $url . '#app'],
        ];
        if ($image) {
            $page['primaryImageOfPage'] = ['@type' => 'ImageObject', 'url' => $image, 'width' => 1600, 'height' => 900];
        }
        if (!empty($content['faq'])) {
            $page['mainEntity'] = array_map(function ($f) use ($plain) {
                return ['@type' => 'Question', 'name' => $plain($f['q']), 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $plain($f['a'])]];
            }, $content['faq']);
        }
        $graph[] = $page;
        // No aggregateRating: tools have no visitor votes (CLAUDE.md: ratings only from real votes).
        $graph[] = array_filter([
            '@type' => 'WebApplication',
            '@id' => $url . '#app',
            'name' => $content['h1'] ?? $tool['title'],
            'url' => $url,
            'description' => $tool['desc'],
            'applicationCategory' => $tool['app_category'] ?? 'FinanceApplication',
            'operatingSystem' => 'Any',
            'browserRequirements' => 'Requires JavaScript',
            'isAccessibleForFree' => true,
            'inLanguage' => 'en-IN',
            'image' => $image,
            'featureList' => $content['features'] ?? null,
            'offers' => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'INR'],
            'publisher' => ['@type' => 'Organization', 'name' => get_bloginfo('name'), 'url' => home_url('/')],
        ]);
        if (!empty($content['howto']['steps'])) {
            $graph[] = [
                '@type' => 'HowTo',
                '@id' => $url . '#how-to',
                'name' => $plain($content['howto']['h2']),
                'description' => $plain($content['howto']['intro'] ?? ''),
                'tool' => ['@type' => 'HowToTool', 'name' => $content['h1'] ?? $tool['title']],
                'step' => array_map(function ($st, $i) use ($plain, $url) {
                    return ['@type' => 'HowToStep', 'position' => $i + 1, 'name' => $plain($st['name']), 'text' => $plain($st['text']), 'url' => $url . '#how-to-step-' . ($i + 1)];
                }, $content['howto']['steps'], array_keys($content['howto']['steps'])),
            ];
        }
        echo '<script type="application/ld+json">' . wp_json_encode(['@context' => 'https://schema.org', '@graph' => $graph], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
    });
}

$tool_icons = [
    'in-hand-salary-calculator' => '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    'salary-hike-calculator' => '<path d="M4 17l6-6 4 4 6-7"/><path d="M14 8h6v6"/>',
    'notice-period-buyout-calculator' => '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    'startup-100x-score' => '<path d="M4 17a8 8 0 0 1 16 0"/><path d="M12 17l4-5"/>',
];

get_header();

if (!$tool) : ?>
<section class="wrap" style="padding-top:80px;padding-bottom:48px">
    <div class="k in"><span class="ac">Free tools</span> · Runs in your browser · Nothing to sign up for</div>
    <h1 class="display in" style="animation-delay:.08s">Numbers that<br>help you decide.</h1>
    <p class="in" style="max-width:620px;margin-top:22px;font-size:18px;line-height:1.6;color:var(--t2);animation-delay:.16s">Calculators for salaries, hikes and job switches in India. Your numbers never leave this page.</p>
</section>
<div class="hl"></div>
<section class="wrap" style="padding-top:40px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px">
    <?php foreach ($tools as $slug => $t) : ?>
        <a class="card" href="<?php echo esc_url($hub . $slug . '/'); ?>">
            <span class="ico"><?php echo xft_icon($tool_icons[$slug] ?? '<circle cx="12" cy="12" r="8"/>', 20); // phpcs:ignore ?></span>
            <span class="k"><?php echo esc_html($t['group']); ?></span>
            <span class="card-title"><?php echo esc_html($t['title']); ?></span>
            <span style="color:var(--t2);font-size:15px;line-height:1.55"><?php echo esc_html($t['desc']); ?></span>
            <span class="k" style="margin-top:auto;color:var(--tx)">Open tool →</span>
        </a>
    <?php endforeach; ?>
</section>
<section class="wrap" style="padding-top:56px">
    <p class="k" style="font-size:10.5px;max-width:720px;line-height:1.7">Estimates only, not tax or legal advice. Tax figures follow the Income-tax Act, 2025 for tax year 2026-27 (Budget 2026 kept the slabs unchanged). Check your final tax on <a class="u" href="https://www.incometax.gov.in/" target="_blank" rel="noopener">incometax.gov.in</a>.</p>
</section>
<?php get_footer(); return; endif; ?>

<nav class="tl-switch" aria-label="Free tools">
    <div class="wrap tl-switch__in">
        <?php foreach ($tools as $slug => $t) : ?><a href="<?php echo esc_url($hub . $slug . '/'); ?>"<?php echo $slug === $tool['slug'] ? ' aria-current="page"' : ''; ?>><?php echo esc_html($t['short']); ?></a><?php endforeach; ?>
        <a href="<?php echo esc_url($hub); ?>">All tools</a>
    </div>
</nav>
<section class="wrap tl-head">
    <h1 class="tl-h1"><?php echo esc_html($content['h1'] ?? $tool['title']); ?></h1>
    <p class="tl-lede"><?php echo esc_html($content['lede'] ?? $tool['desc']); ?></p>
</section>

<?php if ($tool['slug'] === 'in-hand-salary-calculator') : ?>
<section class="wrap tool-grid" data-tool="in-hand">
    <div class="tool-in">
        <label class="k" for="ctc">Annual CTC (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="ctc" inputmode="numeric" value="1500000" aria-describedby="ctc-help"></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px" id="ctc-help">
            <?php foreach ([600000 => '6L', 1000000 => '10L', 1500000 => '15L', 2500000 => '25L', 4000000 => '40L'] as $v => $l) : ?><button type="button" class="preset" data-preset="<?php echo (int) $v; ?>">₹<?php echo esc_html($l); ?></button><?php endforeach; ?>
        </div>
        <div class="k" style="margin-top:12px">Tax regime</div>
        <div class="seg" role="group" aria-label="Tax regime"><button type="button" data-regime="new" aria-pressed="true">New (default)</button><button type="button" data-regime="old" aria-pressed="false">Old</button></div>
        <div data-old-only hidden style="display:flex;flex-direction:column;gap:12px">
            <div class="k" style="margin-top:12px">City</div>
            <div class="seg" role="group" aria-label="City type"><button type="button" data-metro="true" aria-pressed="true" title="50% HRA cities: Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad">50% HRA city</button><button type="button" data-metro="false" aria-pressed="false">Other city</button></div>
            <label class="k" for="rent">Monthly rent paid (₹)</label>
            <div class="fld"><input id="rent" inputmode="numeric" value="0"></div>
            <label class="k" for="ded">80C investments, yearly (₹, max 1.5L incl. PF)</label>
            <div class="fld"><input id="ded" inputmode="numeric" value="150000"></div>
        </div>
        <details style="margin-top:12px">
            <summary class="k" style="cursor:pointer">Assumptions</summary>
            <div style="display:flex;flex-direction:column;gap:12px;padding-top:14px">
                <label class="k" for="basic">Basic pay, % of CTC</label>
                <div class="fld"><input id="basic" inputmode="numeric" value="50"><span class="mono" style="color:var(--t3)">%</span></div>
                <label class="k" for="pt">Professional tax, yearly (₹)</label>
                <div class="fld"><input id="pt" inputmode="numeric" value="2500"></div>
                <label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--t2)"><input id="pfcap" type="checkbox" checked> PF capped at ₹3,000 a month (₹25,000 wage ceiling from 17 Sep 2026)</label>
            </div>
        </details>
    </div>
    <div class="result" aria-live="polite">
        <div><div class="k">In-hand per month · <span id="ih-regime">New regime</span></div><div class="big" id="ih-monthly" style="margin-top:12px">₹0</div></div>
        <div style="display:flex;gap:28px;flex-wrap:wrap" class="mono">
            <span><span class="k">Yearly</span><br><span id="ih-yearly" style="font-size:18px">₹0</span></span>
            <span><span class="k">Tax as % of CTC</span><br><span id="ih-rate" style="font-size:18px">0%</span></span>
        </div>
        <div>
            <div class="splitbar" aria-hidden="true"><span id="bar-hand" style="background:var(--tx)"></span><span id="bar-tax" style="background:var(--ac)"></span><span id="bar-pf" style="background:#c56bff"></span><span id="bar-other" style="background:#4aa8ff"></span></div>
            <div class="k" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:10px"><span>■ In-hand</span><span style="color:var(--ac)">■ Tax</span><span style="color:#c56bff">■ PF (both sides)</span><span style="color:#4aa8ff">■ Gratuity + PT</span></div>
        </div>
        <div><div class="br k" style="font-size:10px"><span>Component</span><span style="display:flex;gap:28px"><span style="width:110px;text-align:right">Monthly</span><span class="hs" style="width:120px;text-align:right">Yearly</span></span></div><div id="ih-rows"></div></div>
        <p id="ih-compare" style="font-size:15px;color:var(--t2)"></p>
    </div>
</section>
<?php elseif ($tool['slug'] === 'salary-hike-calculator') : ?>
<section class="wrap tool-grid" data-tool="hike">
    <div class="tool-in">
        <label class="k" for="cur">Current annual CTC (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="cur" inputmode="numeric" value="1200000"></div>
        <div class="k" style="margin-top:12px">I know the</div>
        <div style="display:flex;gap:18px;font-size:14px;color:var(--t2)"><label><input type="radio" name="mode" id="mode-pct" checked> Hike %</label><label><input type="radio" name="mode" id="mode-ctc"> New CTC</label></div>
        <div data-pct-field style="display:flex;flex-direction:column;gap:10px"><label class="k" for="pct">Hike (%)</label><div class="fld"><input id="pct" inputmode="decimal" value="30"><span class="mono" style="color:var(--t3)">%</span></div></div>
        <div data-ctc-field hidden style="display:flex;flex-direction:column;gap:10px"><label class="k" for="newctc">New annual CTC (₹)</label><div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="newctc" inputmode="numeric" value="1560000"></div></div>
        <label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--t2);margin-top:12px"><input id="hk-old" type="checkbox"> Use the old tax regime</label>
    </div>
    <div class="result" aria-live="polite">
        <div><div class="k">Extra in-hand per month</div><div class="big" id="hk-diff" style="margin-top:12px">₹0</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">New CTC</span><span class="mono" id="hk-new"></span></div>
            <div class="br"><span style="color:var(--t2)">Hike</span><span class="mono" id="hk-pct"></span></div>
            <div class="br"><span style="color:var(--t2)">In-hand per month now</span><span class="mono" id="hk-before"></span></div>
            <div class="br"><span style="color:var(--t2)">In-hand per month after</span><span class="mono" id="hk-after"></span></div>
            <div class="br"><span style="color:var(--t2)">Share of the raise you keep</span><span class="mono" id="hk-take"></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">Assumes basic = 50% of CTC, PF capped at ₹3,000 a month, ₹2,500 professional tax and, for the old regime, ₹1.5L of 80C.</p>
    </div>
</section>
<?php elseif ($tool['slug'] === 'startup-100x-score') : get_template_part('parts/tool-100x-score'); ?>
<?php else : ?>
<section class="wrap tool-grid" data-tool="notice">
    <div class="tool-in">
        <label class="k" for="nb-salary">Monthly basic pay (₹) <span style="text-transform:none;letter-spacing:0">· check your offer letter; some firms use gross</span></label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="nb-salary" inputmode="numeric" value="60000"></div>
        <label class="k" for="nb-total">Notice period (days)</label>
        <div class="fld"><input id="nb-total" inputmode="numeric" value="90"></div>
        <label class="k" for="nb-served">Days already served</label>
        <div class="fld"><input id="nb-served" inputmode="numeric" value="30"></div>
        <label class="k" for="nb-leave">Earned leave you can set off (days)</label>
        <div class="fld"><input id="nb-leave" inputmode="numeric" value="0"></div>
        <label class="k" for="nb-days">Per-day pay is monthly pay divided by</label>
        <select id="nb-days" class="fld" style="font-size:16px;color:var(--tx)"><option value="30">30 days</option><option value="26">26 working days</option></select>
    </div>
    <div class="result" aria-live="polite">
        <div><div class="k">Buyout amount</div><div class="big" id="nb-amount" style="margin-top:12px">₹0</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Days left to buy out</span><span class="mono" id="nb-remaining"></span></div>
            <div class="br"><span style="color:var(--t2)">Rate</span><span class="mono" id="nb-perday"></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">Your employment contract decides the rule. Many employers accept leave set-off or early release; ask HR in writing. New employers often reimburse the buyout as a joining bonus, so ask for it during the offer.</p>
    </div>
</section>
<?php endif; ?>

<?php
$groups = [];
foreach ($tools as $slug => $t) {
    $groups[$t['group']][$slug] = $t;
}
$sections = $content['sections'] ?? [];
$howto = $content['howto'] ?? null;
?>
<div class="hl" style="margin-top:56px"></div>
<div class="wrap tl-body">
    <details class="tl-side" open data-tl-side>
        <summary class="k">All free tools</summary>
        <nav aria-label="Tools by category">
            <?php foreach ($groups as $group => $items) : ?>
                <p class="k tl-side__g"><?php echo esc_html($group); ?></p>
                <ul>
                    <?php foreach ($items as $slug => $t) : ?><li><a href="<?php echo esc_url($hub . $slug . '/'); ?>"<?php echo $slug === $tool['slug'] ? ' aria-current="page"' : ''; ?>><?php echo esc_html($t['short']); ?></a></li><?php endforeach; ?>
                </ul>
            <?php endforeach; ?>
            <p class="k tl-side__g">More for your career</p>
            <ul>
                <li><a href="<?php echo esc_url(home_url('/jobs/')); ?>">Jobs in India</a></li>
                <li><a href="<?php echo esc_url(home_url('/guides/')); ?>">How to apply guides</a></li>
                <li><a href="<?php echo esc_url(home_url('/funding-tracker/')); ?>">Funding tracker</a></li>
            </ul>
        </nav>
    </details>

    <article class="prose tl-content">
        <?php foreach ($sections as $i => $sec) : ?>
            <section id="<?php echo esc_attr($sec['id']); ?>">
                <h2><?php echo esc_html($sec['h2']); ?></h2>
                <?php echo wp_kses_post($fill($sec['html'])); ?>
            </section>
            <?php if ($i === 0 && $howto) : ?>
            <section id="how-to">
                <h2><?php echo esc_html($howto['h2']); ?></h2>
                <?php if (!empty($howto['intro'])) : ?><p><?php echo esc_html($howto['intro']); ?></p><?php endif; ?>
                <ol class="tl-steps">
                    <?php foreach ($howto['steps'] as $n => $st) : ?><li id="how-to-step-<?php echo (int) $n + 1; ?>"><strong><?php echo esc_html($st['name']); ?>.</strong> <?php echo esc_html($st['text']); ?></li><?php endforeach; ?>
                </ol>
            </section>
            <?php endif; ?>
        <?php endforeach; ?>

        <section id="related-tools">
            <h2>Related free tools</h2>
            <ul class="tl-related">
                <?php foreach ($tools as $slug => $t) : if ($slug === $tool['slug']) continue; ?>
                    <li><a href="<?php echo esc_url($hub . $slug . '/'); ?>"><?php echo esc_html($t['title']); ?></a>: <?php echo esc_html($t['desc']); ?></li>
                <?php endforeach; ?>
                <li><a href="<?php echo esc_url(home_url('/jobs/')); ?>">Jobs in India</a>: open roles from official company career pages, updated daily.</li>
            </ul>
        </section>

        <?php if (!empty($content['faq'])) : ?>
        <section id="faq">
            <h2>FAQ</h2>
            <?php foreach ($content['faq'] as $f) : ?>
                <h3><?php echo esc_html($f['q']); ?></h3>
                <p><?php echo wp_kses($f['a'], ['a' => ['href' => true], 'strong' => [], 'em' => []]); ?></p>
            <?php endforeach; ?>
        </section>
        <?php endif; ?>

        <?php if (!empty($content['sources'])) : ?>
        <section id="sources">
            <h2>Sources</h2>
            <ol class="tl-sources">
                <?php foreach ($content['sources'] as $src) : ?>
                    <li><?php echo esc_html($src['publisher']); ?>, <a href="<?php echo esc_url($src['url']); ?>" rel="noopener nofollow" target="_blank">“<?php echo esc_html($src['title']); ?>”</a><?php echo !empty($src['date']) ? ', ' . esc_html($src['date']) : ''; ?></li>
                <?php endforeach; ?>
            </ol>
        </section>
        <?php endif; ?>

        <?php if ($tool['slug'] === 'startup-100x-score') : ?>
        <p class="k tl-note">A self-assessment to help you prioritise, not an investment view or a valuation. Your answers stay in your browser unless you ask us to email the report.</p>
        <?php else : ?>
        <p class="k tl-note">Estimate only, not tax or legal advice. Slabs, the ₹75,000 / ₹50,000 standard deduction, the Section 87A rebate (up to ₹12 lakh taxable income in the new regime, ₹5 lakh in the old) with marginal relief, surcharge with marginal relief and the 4% cess follow the Income-tax Act, 2025 for tax year 2026-27 (rates unchanged by the Finance Act, 2026); the PF cap uses the ₹25,000 wage ceiling in force from 17 September 2026. Your payslip may differ (allowances, perks, state professional tax rules). Confirm your tax with a qualified professional or on incometax.gov.in.</p>
        <?php endif; ?>
    </article>
</div>
<?php get_footer();
