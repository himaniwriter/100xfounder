<?php
/**
 * /leaderboard/: startups ranked by reader taps on the 100X Meter (week, month,
 * all time) and by Product Hunt launch-day votes. Ranking, rows and the "Load more"
 * endpoint live in the plugin (includes/meter.php); taps reuse the meter's token.
 * Only the default view (no ?tab / ?industry) is indexable.
 */
if (!function_exists('xf_meter_board_ids')) {
    get_template_part('singular');
    return;
}
[$tab, $ind] = xf_meter_board_args();
$tabs = xf_meter_board_tabs();
[$ids, $more] = xf_meter_board_ids($tab, $ind);
$ranked = count($ids) >= 3;
$base = get_permalink();
$link = function ($t, $i) use ($base) {
    return add_query_arg(array_filter(['tab' => $t === 'week' ? '' : $t, 'industry' => $i]), $base);
};
$img = function ($file) { return function_exists('xf_brand_asset') ? xf_brand_asset($file) : ''; };

if ($ranked && $tab === 'week' && !$ind) {
    add_action('wp_head', function () use ($ids) {
        $ld = ['@context' => 'https://schema.org', '@type' => 'ItemList', 'name' => '100X Meter: startups readers backed this week', 'itemListOrder' => 'https://schema.org/ItemListOrderDescending', 'itemListElement' => []];
        foreach ($ids as $i => $id) {
            $ld['itemListElement'][] = ['@type' => 'ListItem', 'position' => $i + 1, 'url' => get_permalink($id), 'name' => get_the_title($id)];
        }
        echo '<script type="application/ld+json">' . wp_json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
    });
}

get_header();
?>
<article class="page">
    <header class="wrap page-head">
        <div class="k in"><span class="ac">100X Meter</span> · Reader taps, updated live</div>
        <h1 class="page-title in" style="animation-delay:.06s">Startup Leaderboard</h1>
        <p class="muted in" style="font-size:18px;margin:16px 0 0;max-width:760px;animation-delay:.12s">The startups 100xFounder readers are backing right now. One tap per reader per day, counted over the last 7 and 30 days. It shows buzz, not quality.</p>
        <?php if (function_exists('xf_share_bar_html')) echo '<div class="in" style="margin-top:20px;animation-delay:.16s">' . xf_share_bar_html(get_permalink(), 'Startup Leaderboard: the startups 100xFounder readers are backing', 'leaderboard') . '</div>'; // phpcs:ignore -- escaped inside ?>
    </header>
    <div class="hl"></div>
    <div class="wrap xf-lb" style="padding-top:28px" data-lb data-endpoint="<?php echo esc_url(rest_url('xf/v1/meter')); ?>">
        <nav class="xf-lb__tabs" aria-label="Leaderboard views">
            <?php foreach ($tabs as $key => $t) : ?>
                <a class="xf-lb__tab<?php echo $key === $tab ? ' on' : ''; ?>" href="<?php echo esc_url($link($key, $ind)); ?>"<?php echo $key === $tab ? ' aria-current="page"' : ''; ?>><?php echo esc_html($t[0]); ?></a>
            <?php endforeach; ?>
        </nav>
        <?php $inds = xf_meter_board_industries($tab); if ($inds) : ?>
            <div class="xf-lb__chips" aria-label="Filter by industry">
                <a class="chip<?php echo $ind ? '' : ' on'; ?>" href="<?php echo esc_url($link($tab, '')); ?>">All</a>
                <?php foreach (array_slice($inds, 0, 14) as $term) : ?>
                    <a class="chip<?php echo $ind === $term->slug ? ' on' : ''; ?>" href="<?php echo esc_url($link($tab, $term->slug)); ?>"><?php echo esc_html($term->name); ?></a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <?php if ($tab === 'launch') : ?>
            <p class="k xf-lb__src">Launch day ranks by upvotes on Product Hunt, as Product Hunt reports them. It is Product Hunt's data, not 100xFounder taps.</p>
        <?php endif; ?>

        <?php if ($ranked) : ?>
            <ol class="xf-lb__podium"><?php echo xf_meter_board_rows(array_slice($ids, 0, 3), 0, $tab); // phpcs:ignore -- escaped inside ?></ol>
            <ol class="xf-lb__list" data-lb-list><?php echo xf_meter_board_rows(array_slice($ids, 3), 3, $tab); // phpcs:ignore -- escaped inside ?></ol>
            <?php if ($more) : ?>
                <button type="button" class="btn xf-lb__more" data-lb-more data-src="<?php echo esc_url(add_query_arg(['tab' => $tab, 'industry' => $ind], rest_url('xf/v1/leaderboard'))); ?>" data-offset="<?php echo count($ids); ?>">Load more</button>
            <?php endif; ?>
            <p class="xf-lb__msg" data-lb-msg role="status"></p>
        <?php else :
            $recent = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 6, 'fields' => 'ids', 'no_found_rows' => true]); ?>
            <div class="xf-lb__empty">
                <?php echo function_exists('xf_meter_gauge_svg') ? xf_meter_gauge_svg(0) : ''; // phpcs:ignore -- static markup ?>
                <p class="xf-meter__eyebrow">The board is warming up</p>
                <h2><?php echo $tab === 'launch' ? 'Not enough launch-day votes here yet' : 'Be one of the first to back a startup'; ?></h2>
                <p class="muted">We show a ranking once at least three startups have <?php echo $tab === 'launch' ? 'Product Hunt votes' : 'reader taps'; ?> in this view. Open a startup you like and tap “100X it”. Your tap counts today.</p>
                <?php if ($recent) : ?>
                    <ul class="xf-lb__recent">
                        <?php foreach ($recent as $rid) : ?>
                            <li><a href="<?php echo esc_url(get_permalink($rid)); ?>"><?php echo xf_startup_logo_html($rid, 32); // phpcs:ignore ?><span><?php echo esc_html(get_the_title($rid)); ?></span></a></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
                <p><a class="btn btn-w" href="<?php echo esc_url(home_url('/launches/')); ?>">Browse recent launches</a></p>
            </div>
        <?php endif; ?>
    </div>

    <section class="wrap" style="padding-top:72px">
        <div class="prose">
            <h2>How the leaderboard works</h2>
            <p>Every startup listed on 100xFounder has a <a href="<?php echo esc_url(home_url('/100x-meter/')); ?>">100X Meter</a> on its page. Readers push it with a single tap when they think the startup could go a hundred times bigger. Each reader gets one tap per startup per day. This leaderboard simply sorts those taps, so you can see which launches people here are most excited about.</p>
            <p><b>This week</b> ranks startups by the number of taps in the last seven days. It moves fastest and is the best place to spot something new. <b>This month</b> ranks by taps in the last 30 days, which is also what sets each startup’s meter level from 0X to 100X. <b>All time</b> adds up every tap a startup has had since the meter began. <b>Launch day</b> is different: it ranks by upvotes on Product Hunt, as Product Hunt reported them for the launch. We show that number as Product Hunt’s data, never as our own.</p>
            <p>The small arrow next to a level shows how far it has moved since the week began. We save each startup’s level once a week, and the arrow is the difference. A green ▲ means more readers have been backing it lately; a ▼ means older taps have aged out of the 30-day window faster than new ones arrived.</p>

            <figure class="xf-figure">
                <img src="<?php echo esc_url($img('meter-taps.jpg')); ?>" alt="A curve rising steeply then flattening: 1 tap is 11X, 10 taps 39X, 50 taps 63X, 100 taps 74X and 500 taps 100X" width="1600" height="1000" loading="lazy" decoding="async">
                <figcaption>How taps in the last 30 days become the meter level. The points come from the meter’s formula, not from any startup. Graphic: 100xFounder.</figcaption>
            </figure>

            <h2>Buzz, not quality</h2>
            <p>A high place on this board means many of our readers backed a startup recently. It doesn’t mean the product is better, the company is healthier or that it is a good investment. Small teams with loyal communities often rank above much larger companies, and that’s fine: the board is a snapshot of attention, not a verdict. Before you sign up for, buy or invest in anything, read the startup’s profile, its sources and its visitor reviews.</p>
            <p>For the same reason, the leaderboard is not a rating. The star rating on a startup page comes only from visitors’ own votes. Taps never appear in ratings or in the data we give search engines.</p>

            <h2>The stages</h2>
            <p>Each row shows a stage that matches the bands of our founder quiz: <b>Early</b> below 30X, <b>Traction</b> from 30X, <b>Scaling</b> from 60X and <b>Breakout</b> from 85X. The scale is gentle at the top. A single tap lifts a new listing to about 11X, but reaching 100X takes 500 taps from readers within 30 days.</p>

            <figure class="xf-figure">
                <img src="<?php echo esc_url($img('meter-gauge.jpg')); ?>" alt="A semicircle meter from 0X to 100X with the four bands labelled early, traction, scaling and breakout" width="1600" height="1000" loading="lazy" decoding="async">
                <figcaption>The four stages on the meter. Graphic: 100xFounder.</figcaption>
            </figure>

            <h2>Keeping it fair</h2>
            <p>Taps are checked on our server, one per reader per startup per day. Every tap carries a signed token from the page we served, crawlers and automated tools are ignored, our own editors can’t tap, and each connection is limited to a set number of taps an hour. We never seed the board, add taps by hand or sell positions on it. Sponsored listings get no extra taps, and a startup can’t pay to move up.</p>

            <h2>Back a startup from here</h2>
            <p>Tap the ⚡ on any row to back that startup without leaving the page. It counts exactly like the button on the startup page, and it is added to <a href="<?php echo esc_url(home_url('/my-100x/')); ?>">your 100X list</a>, which stays in your browser. Founders can show their live level on their own site with the badge on their listing. Read more in <a href="<?php echo esc_url(home_url('/100x-meter/')); ?>">What is the 100X Meter?</a></p>
        </div>
    </section>
</article>
<?php
get_footer();
