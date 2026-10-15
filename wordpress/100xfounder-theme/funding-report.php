<?php
/**
 * Monthly Indian startup funding report (/funding-report/YYYY-MM/) and its index (/funding-report/).
 * Loaded by the plugin (includes/funding-report.php), which computes every number from sourced xf_round posts.
 */
$req = xf_fr_request();
$is_index = $req[0] === 'index';
$r = $req[1];
$months = xf_fr_reports();
get_header();

$crumbs = xf_fr_crumbs();
$round_link = function ($row) {
    return '<a href="' . esc_url($row['url']) . '">' . esc_html($row['company']) . '</a>';
};
$source_link = function ($row) {
    return '<a href="' . esc_url($row['source']) . '" target="_blank" rel="noopener nofollow">Source<span class="screen-reader-text"> for ' . esc_html($row['company']) . '</span> ↗</a>';
};
$by_id = $r ? array_column($r['rows'], null, 'id') : [];
$names = function (array $ids) use ($by_id, $round_link) {
    return implode(', ', array_map(function ($id) use ($by_id, $round_link) { return $round_link($by_id[$id]); }, $ids));
};
?>
<style>
.fr .xf-table{font-size:14px;min-width:600px}.fr details .xf-table,.fr .fr-mom{min-width:0}.fr .xf-table th{font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);font-weight:400}
.fr .xf-table td.n,.fr .xf-table th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.fr .xf-table a{color:var(--tx);text-decoration:underline;text-decoration-color:var(--ln2);text-underline-offset:3px}.fr .xf-table a:hover{text-decoration-color:var(--ac)}
.fr-sec{padding-top:56px}.fr-sec h2{margin:0;font-size:24px;letter-spacing:-.02em}
.fr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr));gap:40px 48px;margin-top:22px}
.fr-chart h3{margin:0 0 14px;font-size:17px}.fr-svg{display:block;max-width:560px;height:auto;overflow:visible}
.fr-l{fill:var(--tx);font:500 14px Inter,system-ui,sans-serif}.fr-v{fill:var(--t2);font:12px 'Geist Mono',monospace}
.fr-track{fill:var(--bg2)}.fr-bar{fill:var(--ac)}
.fr details{margin-top:12px}.fr summary{cursor:pointer;color:var(--t2);font-size:13px}.fr summary:hover{color:var(--tx)}
.fr-note{border:1px solid var(--ln2);padding:16px 18px;margin-top:22px;color:var(--t2);font-size:14px;line-height:1.6;max-width:760px}
.fr-method{border:1px solid var(--ln2);border-top:2px solid var(--ac);padding:22px 24px;margin-top:22px;max-width:860px;line-height:1.65;color:var(--t2);font-size:15px}
.fr-method h2{color:var(--tx)}.fr-method ul{padding-left:20px;margin:12px 0 0}.fr-method li{margin:6px 0}
.fr-rate{margin:12px 0 0;color:var(--t3);font-size:13px;line-height:1.5}
.fr .pillars .meta{display:block;margin-top:6px}
.fr .up{color:#7ddc9b}.fr .down{color:#ff8a8a}
</style>
<nav class="wrap crumbs-bar" aria-label="Breadcrumb"><ol class="crumbs k">
    <?php foreach ($crumbs as $i => [$name, $url]) : ?>
        <li><?php if ($url) : ?><a href="<?php echo esc_url($url); ?>"><?php echo esc_html($name); ?></a><?php else : ?><span aria-current="page"><?php echo esc_html($name); ?></span><?php endif; ?></li>
    <?php endforeach; ?>
</ol></nav>

<div class="fr">
<?php if ($is_index) : ?>
    <section class="wrap" style="padding-top:28px">
        <div class="k in">Funding report</div>
        <h1 class="page-title in" style="animation-delay:.06s">Indian startup funding, month by month.</h1>
        <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Monthly reports built from the funding rounds in our <a class="u" href="<?php echo esc_url(xf_page_url('funding')); ?>">funding tracker</a>: totals, the biggest rounds, stages, sectors, cities and investors. Every round has a published source, and each report links to all of them.</p>
    </section>
    <section class="wrap fr-sec">
        <div class="sh"><h2>All reports</h2><span class="k"><?php echo esc_html(count($months)); ?> months</span></div>
        <?php if ($months) : ?>
            <div class="xf-tablewrap" tabindex="0" role="region" aria-label="Monthly reports"><table class="xf-table">
                <thead><tr><th scope="col">Month</th><th scope="col" class="n">Rounds</th><th scope="col" class="n">Disclosed (USD)</th><th scope="col" class="n">Undisclosed</th></tr></thead>
                <tbody>
                <?php foreach ($months as $ym => $m) : ?>
                    <tr><td><a href="<?php echo esc_url(xf_fr_url($ym)); ?>"><?php echo esc_html(xf_fr_label($ym)); ?></a></td><td class="n"><?php echo esc_html($m['count']); ?></td><td class="n"><?php echo esc_html($m['total_usd'] > 0 ? xf_format_usd_short($m['total_usd']) : '—'); ?></td><td class="n"><?php echo esc_html($m['undisclosed']); ?></td></tr>
                <?php endforeach; ?>
                </tbody>
            </table></div>
        <?php else : ?>
            <p style="padding:32px 0;color:var(--t2)">The first report appears once a full month of sourced rounds is in the tracker.</p>
        <?php endif; ?>
    </section>
<?php else :
    $month = xf_fr_label($r['month']);
    $prev = xf_fr_report(xf_fr_prev_month($r['month']));
    $disclosed_rows = array_values(array_filter($r['rows'], function ($row) { return $row['usd'] > 0; }));
    ?>
    <section class="wrap" style="padding-top:28px">
        <div class="k in">Funding report · <?php echo esc_html($month); ?></div>
        <h1 class="page-title in" style="animation-delay:.06s">Indian startup funding in <?php echo esc_html($month); ?>.</h1>
        <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Funding rounds announced by Indian startups in <?php echo esc_html($month); ?>, as tracked by 100xFounder. Each round below links to its page in our tracker and to its original source.</p>
        <?php if (!$r['indexable']) : ?>
            <p class="fr-note">This month has fewer than <?php echo esc_html(XF_FR_INDEX_MIN); ?> sourced rounds in our tracker, so we keep this report out of search results until there is enough data for it to be useful. The numbers below are still complete for the rounds we have.</p>
        <?php endif; ?>
        <div class="pillars" style="margin-top:28px">
            <div class="pc"><span class="pw"><?php echo esc_html($r['count']); ?></span><span class="meta">Rounds tracked</span></div>
            <div class="pc"><span class="pw"><?php echo esc_html($r['total_usd'] > 0 ? xf_format_usd_short($r['total_usd']) : '—'); ?></span><span class="meta">Disclosed, USD (<?php echo esc_html($r['disclosed']); ?> rounds)</span></div>
            <div class="pc"><span class="pw"><?php echo esc_html($r['total_inr'] ? xf_fr_format_inr($r['total_inr']) : '—'); ?></span><span class="meta">Disclosed, INR</span></div>
            <div class="pc"><span class="pw"><?php echo esc_html($r['undisclosed']); ?></span><span class="meta">Amount undisclosed</span></div>
        </div>
        <?php if ($r['rate']) : ?>
            <p class="fr-rate">INR at the European Central Bank reference rate of ₹<?php echo esc_html(number_format($r['rate']['rate'], 2)); ?> per US dollar on <?php echo esc_html(gmdate('j F Y', strtotime($r['rate']['date']))); ?> (via the Frankfurter API). Exact USD total: $<?php echo esc_html(number_format($r['total_usd'])); ?>.</p>
        <?php elseif ($r['total_usd'] > 0) : ?>
            <p class="fr-rate">Exact USD total: $<?php echo esc_html(number_format($r['total_usd'])); ?>. The INR figure appears once the month-end reference rate is available.</p>
        <?php endif; ?>
    </section>

    <?php if ($prev) :
        $change = function ($a, $b) {
            if ($a <= 0) return '—';
            $pct = round(($b - $a) / $a * 100);
            return '<span class="' . ($pct >= 0 ? 'up' : 'down') . '">' . esc_html(($pct >= 0 ? '+' : '') . $pct . '%') . '</span>';
        }; ?>
        <section class="wrap fr-sec">
            <div class="sh"><h2>Compared with <?php echo esc_html(xf_fr_label($prev['month'])); ?></h2><a class="k u" href="<?php echo esc_url(xf_fr_url($prev['month'])); ?>"><?php echo esc_html(xf_fr_label($prev['month'])); ?> report →</a></div>
            <div class="xf-tablewrap" tabindex="0" role="region" aria-label="Month-over-month comparison"><table class="xf-table">
                <thead><tr><th scope="col"></th><th scope="col" class="n"><?php echo esc_html(xf_fr_label($prev['month'])); ?></th><th scope="col" class="n"><?php echo esc_html($month); ?></th><th scope="col" class="n">Change</th></tr></thead>
                <tbody>
                    <tr><th scope="row">Rounds tracked</th><td class="n"><?php echo esc_html($prev['count']); ?></td><td class="n"><?php echo esc_html($r['count']); ?></td><td class="n"><?php echo $change($prev['count'], $r['count']); // phpcs:ignore ?></td></tr>
                    <tr><th scope="row">Disclosed (USD)</th><td class="n"><?php echo esc_html($prev['total_usd'] > 0 ? xf_format_usd_short($prev['total_usd']) : '—'); ?></td><td class="n"><?php echo esc_html($r['total_usd'] > 0 ? xf_format_usd_short($r['total_usd']) : '—'); ?></td><td class="n"><?php echo $change($prev['total_usd'], $r['total_usd']); // phpcs:ignore ?></td></tr>
                    <tr><th scope="row">Undisclosed rounds</th><td class="n"><?php echo esc_html($prev['undisclosed']); ?></td><td class="n"><?php echo esc_html($r['undisclosed']); ?></td><td class="n"></td></tr>
                </tbody>
            </table></div>
        </section>
    <?php endif; ?>

    <?php if ($disclosed_rows) : ?>
        <section class="wrap fr-sec">
            <div class="sh"><h2>Biggest rounds</h2><span class="k">Top <?php echo esc_html(min(10, count($disclosed_rows))); ?> by disclosed amount</span></div>
            <div class="xf-tablewrap" tabindex="0" role="region" aria-label="Biggest rounds"><table class="xf-table">
                <thead><tr><th scope="col">#</th><th scope="col">Company</th><th scope="col">Stage</th><th scope="col">Sector</th><th scope="col">Lead investor</th><th scope="col" class="n">Amount</th><th scope="col">Source</th></tr></thead>
                <tbody>
                <?php foreach (array_slice($disclosed_rows, 0, 10) as $i => $row) : ?>
                    <tr><td><?php echo esc_html($i + 1); ?></td><td><?php echo $round_link($row); // phpcs:ignore ?></td><td><?php echo esc_html($row['stage']); ?></td><td><?php echo esc_html($row['sector']); ?></td><td><?php echo esc_html($row['lead'] ?: '—'); ?></td><td class="n"><?php echo esc_html($row['display']); ?></td><td><?php echo $source_link($row); // phpcs:ignore ?></td></tr>
                <?php endforeach; ?>
                </tbody>
            </table></div>
        </section>
    <?php endif; ?>

    <section class="wrap fr-sec">
        <div class="sh"><h2>Where the money went</h2><span class="k">By stage, sector and city</span></div>
        <div class="fr-grid">
            <?php foreach (['stage' => 'Stage', 'sector' => 'Sector', 'city' => 'City'] as $key => $label) : ?>
                <figure class="fr-chart" style="margin:0">
                    <h3>By <?php echo esc_html(strtolower($label)); ?></h3>
                    <?php echo xf_fr_bar_chart('fr-' . $key, 'Funding rounds by ' . strtolower($label) . ', ' . $month, $r[$key]); // phpcs:ignore -- escaped inside ?>
                    <details>
                        <summary>Show as a table, with the rounds behind each figure</summary>
                        <div class="xf-tablewrap"><table class="xf-table">
                            <thead><tr><th scope="col"><?php echo esc_html($label); ?></th><th scope="col" class="n">Rounds</th><th scope="col" class="n">Disclosed</th><th scope="col">Rounds counted</th></tr></thead>
                            <tbody>
                            <?php foreach ($r[$key] as $name => $g) : ?>
                                <tr><th scope="row"><?php echo esc_html($name); ?></th><td class="n"><?php echo esc_html($g['n']); ?></td><td class="n"><?php echo esc_html($g['usd'] > 0 ? xf_format_usd_short($g['usd']) : '—'); ?></td><td><?php echo $names($g['ids']); // phpcs:ignore ?></td></tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table></div>
                    </details>
                </figure>
            <?php endforeach; ?>
        </div>
    </section>

    <?php if ($r['investors']) : ?>
        <section class="wrap fr-sec">
            <div class="sh"><h2>Most active investors</h2><span class="k">By number of rounds</span></div>
            <div class="xf-tablewrap" tabindex="0" role="region" aria-label="Most active investors"><table class="xf-table">
                <thead><tr><th scope="col">Investor</th><th scope="col" class="n">Rounds</th><th scope="col">Rounds counted</th></tr></thead>
                <tbody>
                <?php foreach ($r['investors'] as $inv) : ?>
                    <tr><th scope="row"><?php echo esc_html($inv['name']); ?></th><td class="n"><?php echo esc_html($inv['n']); ?></td><td><?php echo $names($inv['ids']); // phpcs:ignore ?></td></tr>
                <?php endforeach; ?>
                </tbody>
            </table></div>
        </section>
    <?php endif; ?>

    <section class="wrap fr-sec">
        <div class="sh"><h2>Every round this month</h2><span class="k"><?php echo esc_html($r['count']); ?> rounds</span></div>
        <div class="xf-tablewrap" tabindex="0" role="region" aria-label="Every round this month"><table class="xf-table">
            <thead><tr><th scope="col">Announced</th><th scope="col">Company</th><th scope="col">Stage</th><th scope="col">City</th><th scope="col">Investors</th><th scope="col" class="n">Amount</th><th scope="col">Source</th></tr></thead>
            <tbody>
            <?php $all = $r['rows']; usort($all, function ($a, $b) { return [$a['date'], $a['company']] <=> [$b['date'], $b['company']]; });
            foreach ($all as $row) : ?>
                <tr><td class="mono" style="white-space:nowrap"><?php echo esc_html(gmdate('j M', strtotime($row['date']))); ?></td><td><?php echo $round_link($row); // phpcs:ignore ?></td><td><?php echo esc_html($row['stage']); ?></td><td><?php echo esc_html($row['city']); ?></td><td><?php echo esc_html(implode(', ', $row['investors']) ?: '—'); ?></td><td class="n"><?php echo esc_html($row['display']); ?></td><td><?php echo $source_link($row); // phpcs:ignore ?></td></tr>
            <?php endforeach; ?>
            </tbody>
        </table></div>
    </section>
<?php endif; ?>

    <section class="wrap fr-sec">
        <div class="fr-method">
            <h2>Methodology</h2>
            <ul>
                <li><strong>What is counted:</strong> funding rounds announced by startups based in India, published in the <a class="u" href="<?php echo esc_url(xf_page_url('funding')); ?>">100xFounder funding tracker</a>, dated by the announcement date (the date we published the round when no announcement date is recorded). It covers rounds tracked by 100xFounder, not the whole market, so totals will differ from other trackers.</li>
                <li><strong>Sources:</strong> a round is counted only if it links to a press release, filing or reputable report. Each round in this report links to that source.</li>
                <li><strong>Disclosed and undisclosed:</strong> totals add up only amounts that were publicly disclosed. Rounds without a disclosed amount are counted as rounds but add nothing to the totals; we never estimate them.</li>
                <li><strong>Currency:</strong> US dollar amounts are as recorded for each round: as reported, or converted by our editors when the source gives another currency. Rupee totals convert the USD total at the European Central Bank reference rate for the last business day of the month, which is stated with the figure.</li>
                <li><strong>Stage, sector, city and investors</strong> are as named in the source. "Not stated" means the source did not say. Investor counts include lead and named co-investors, one count per round.</li>
                <li><strong>Updates:</strong> the report is recalculated whenever a round in the month is added or corrected. Spotted an error or a missing round? <a class="u" href="<?php echo esc_url(add_query_arg('type', 'press', xft_page_url('submit', 'submit'))); ?>">Tell us</a>.</li>
            </ul>
        </div>
    </section>

<?php if (!$is_index && count($months) > 1) : ?>
    <section class="wrap fr-sec">
        <div class="sh"><h2>Other months</h2><a class="k u" href="<?php echo esc_url(xf_fr_url()); ?>">All reports →</a></div>
        <div class="pillars" style="margin-top:18px">
            <?php foreach (array_slice(array_diff_key($months, [$r['month'] => 1]), 0, 6, true) as $ym => $m) : ?>
                <a class="pc" href="<?php echo esc_url(xf_fr_url($ym)); ?>"><span class="pw"><?php echo esc_html($m['total_usd'] > 0 ? xf_format_usd_short($m['total_usd']) : $m['count'] . ' rounds'); ?></span><span class="meta"><?php echo esc_html(xf_fr_label($ym) . ' · ' . $m['count'] . ' rounds'); ?></span></a>
            <?php endforeach; ?>
        </div>
    </section>
<?php endif; ?>
</div>
<?php get_footer();
