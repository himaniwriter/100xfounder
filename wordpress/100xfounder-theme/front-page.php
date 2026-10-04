<?php
/**
 * Home: the design's front page, filled only with real content. Sections with
 * nothing to show are left out rather than padded.
 */
get_header();

$lead = xft_lead_post();
$exclude = $lead ? [$lead->ID] : [];
$latest = xft_query_posts(['posts_per_page' => 8]);
$secondary = xft_query_posts(['posts_per_page' => 2, 'post__not_in' => $exclude, 'meta_key' => '_thumbnail_id']);
$popular = xft_popular(5);
$news_url = xft_page_url('news', 'news');
$launch_url = xft_page_url('launches', 'launches');
$events_url = xft_page_url('events', 'events');
$funding_url = xft_page_url('funding', 'funding-tracker');
$blog_url = xft_page_url('blog', 'blog');
$submit_url = xft_page_url('submit', 'submit');

// "Today in" strip, built from live counts.
$launch_count = 0;
if (post_type_exists('xf_startup')) {
    $last = get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 1, 'meta_key' => '_xf_launch_day', 'orderby' => 'meta_value', 'order' => 'DESC', 'fields' => 'ids']);
    if ($last) {
        $day = get_post_meta($last[0], '_xf_launch_day', true);
        $launch_count = count(get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 50, 'fields' => 'ids', 'meta_key' => '_xf_launch_day', 'meta_value' => $day]));
    }
}
$raised = function_exists('xf_rounds_total_usd') ? xf_rounds_total_usd(7) : 0;
$events = function_exists('xf_upcoming_events') ? xf_upcoming_events(4) : [];
$pillars = [
    ['Launched.', $launch_count ? sprintf(_n('%d launch in today’s list', '%d launches in today’s list', $launch_count), $launch_count) : 'The best Product Hunt launches, daily', $launch_url],
    ['Raised.', $raised ? xf_format_usd_short($raised) . ' on the funding tracker this week' : 'Funding rounds, tracked daily', $funding_url],
    ['Hiring.', 'Fresh roles at funded startups', xft_page_exists('jobs') ? home_url('/jobs/') : add_query_arg('type', 'job', $submit_url)],
    ['Happening.', $events ? sprintf(_n('%d event on the calendar', '%d events on the calendar', count($events)), count($events)) : 'Startup events worth your time', $events_url],
    ['Worth reading.', 'Long reads and founder stories', $blog_url],
];
?>

<section class="wrap" style="padding-top:28px;padding-bottom:28px">
    <h1 class="k" style="margin:0 0 14px;display:flex;align-items:center;gap:10px;font-weight:400"><span class="dot"></span>Today in Indian &amp; US startups</h1>
    <div class="pillars">
        <?php foreach ($pillars as $i => [$word, $meta, $href]) : ?>
            <a href="<?php echo esc_url($href); ?>" class="pc" style="animation-delay:<?php echo esc_attr(0.04 + $i * 0.06); ?>s"><span class="pw"><?php echo esc_html($word); ?></span><span class="meta"><?php echo esc_html($meta); ?></span></a>
        <?php endforeach; ?>
    </div>
</section>
<div class="hl"></div>

<?php if ($lead) : ?>
<section class="wrap" style="padding-top:36px;display:flex;flex-wrap:wrap;gap:36px 40px;align-items:flex-start">
    <aside style="flex:1 1 250px;order:1;min-width:0">
        <div class="sh"><h2>Latest</h2><a class="k u" href="<?php echo esc_url($news_url); ?>">All news</a></div>
        <?php foreach ($latest as $p) : ?>
            <a href="<?php echo esc_url(get_permalink($p)); ?>" class="row latest-item">
                <span style="display:flex;gap:10px;align-items:baseline"><span class="mono age"><?php echo esc_html(xft_age($p)); ?></span><span class="tag"><?php echo esc_html(xft_cat_name($p)); ?></span></span>
                <span class="t"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></span>
            </a>
        <?php endforeach; ?>
    </aside>

    <div class="o-lead" style="flex:2.2 1 480px;order:2;min-width:0">
        <a href="<?php echo esc_url(get_permalink($lead)); ?>" class="rv" style="display:block">
            <?php echo xft_image($lead, '16x10', 'xft-lead', true); // phpcs:ignore ?>
            <span style="display:flex;gap:12px;margin-top:18px"><span class="tag"><?php echo esc_html(xft_cat_name($lead)); ?> · Lead story</span><span class="k" style="font-size:10.5px"><?php echo esc_html(xft_read_time($lead)); ?></span></span>
            <span class="lead-title"><span class="u"><?php echo esc_html(get_the_title($lead)); ?></span></span>
            <span class="dek"><?php echo esc_html(wp_trim_words(get_the_excerpt($lead), 30)); ?></span>
            <span class="k" style="display:block;margin-top:12px;font-size:11px">By <?php echo esc_html(xft_author_name($lead) . ' · ' . get_the_date('j M Y', $lead)); ?></span>
        </a>
        <?php if ($secondary) : ?>
            <div style="margin-top:28px;padding-top:24px;border-top:1px solid var(--ln);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:24px">
                <?php foreach ($secondary as $p) : ?>
                    <a href="<?php echo esc_url(get_permalink($p)); ?>" class="rv" style="display:block"><?php echo xft_image($p, '16x10'); // phpcs:ignore ?><span class="tag" style="display:block;margin-top:12px"><?php echo esc_html(xft_cat_name($p)); ?></span><span class="card-title"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></span><span class="k" style="display:block;margin-top:8px;font-size:10.5px"><?php echo esc_html(xft_author_name($p) . ' · ' . str_replace(' read', '', xft_read_time($p))); ?></span></a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <aside style="flex:1 1 260px;order:3;min-width:0">
        <div class="sh"><h2>Most read</h2><span class="k">This week</span></div>
        <?php foreach ($popular as $i => $p) : ?>
            <a href="<?php echo esc_url(get_permalink($p)); ?>" class="row pop-item"><span class="n"><?php echo (int) $i + 1; ?></span><span><span class="t"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></span><span class="k" style="display:block;margin-top:6px;font-size:10.5px"><?php echo esc_html(xft_cat_name($p)); ?></span></span></a>
        <?php endforeach; ?>
        <div id="newsletter"><?php echo xft_newsletter(); // phpcs:ignore ?></div>
    </aside>
</section>
<?php else : ?>
<section class="wrap" style="padding-top:48px">
    <div class="notice">Stories are on their way. <a href="<?php echo esc_url($submit_url); ?>" style="border-bottom:1px solid var(--ln2)">Send us yours</a>.</div>
    <div id="newsletter" style="max-width:420px"><?php echo xft_newsletter(); // phpcs:ignore ?></div>
</section>
<?php endif; ?>

<?php echo xft_ad(); // phpcs:ignore ?>

<?php $rounds = function_exists('xf_recent_rounds') ? xf_recent_rounds(6) : []; if ($rounds) : ?>
<section class="wrap" style="padding-top:88px">
    <div class="sh"><h2>Funding tracker</h2><a class="k u" href="<?php echo esc_url($funding_url); ?>">Full tracker →</a></div>
    <?php get_template_part('parts/funding-rows', null, ['rounds' => $rounds]); ?>
</section>
<?php endif; ?>

<?php
$top_launches = post_type_exists('xf_startup') ? get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 5, 'meta_key' => '_xf_launch_day', 'orderby' => ['meta_value' => 'DESC', 'date' => 'DESC']]) : [];
$ig = [];
if (function_exists('xf_table') && function_exists('xf_slide_url')) {
    global $wpdb;
    $ig = $wpdb->get_results('SELECT id, title FROM ' . xf_table('ig_queue') . " WHERE status = 'posted' ORDER BY posted_at DESC LIMIT 4");
}
if ($top_launches || $ig) : ?>
<section class="wrap" style="padding-top:88px;display:flex;flex-wrap:wrap;gap:40px">
    <?php if ($top_launches) : ?>
    <div style="flex:999 1 560px;min-width:0">
        <div class="sh"><h2>Top launches</h2><a class="k u" href="<?php echo esc_url($launch_url); ?>">Launches →</a></div>
        <?php foreach ($top_launches as $i => $l) :
            $terms = wp_get_post_terms($l->ID, 'xf_industry', ['fields' => 'names']); ?>
            <a href="<?php echo esc_url(get_permalink($l)); ?>" class="row" style="display:flex;align-items:center;gap:18px;padding:18px 0;border-bottom:1px solid var(--ln)">
                <span class="mono" style="width:36px;font-size:22px;color:var(--t3);letter-spacing:-.04em"><?php echo esc_html(str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT)); ?></span>
                <span style="flex:1;min-width:0"><span style="display:block;font-size:17px;font-weight:600;letter-spacing:-.015em"><span class="u"><?php echo esc_html(get_the_title($l)); ?></span></span><span style="display:block;font-size:14px;color:var(--t2);margin-top:3px"><?php echo esc_html(wp_trim_words((string) get_post_meta($l->ID, '_xf_tagline', true), 14)); ?></span></span>
                <?php if ($terms) : ?><span class="tag hs" style="color:var(--t2)"><?php echo esc_html($terms[0]); ?></span><?php endif; ?>
                <span class="k hs" style="width:84px;text-align:right;font-size:10.5px"><?php echo (int) get_post_meta($l->ID, '_xf_votes', true); ?> votes</span>
            </a>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
    <?php if ($ig) : $ig_url = xf_get_setting('instagram_url'); ?>
    <div style="flex:1 1 300px">
        <div class="sh"><h2>On Instagram</h2><a class="k u" href="<?php echo esc_url($ig_url); ?>" target="_blank" rel="noopener">@<?php echo esc_html(xf_get_setting('instagram_handle')); ?></a></div>
        <div class="ig-grid">
            <?php foreach ($ig as $g) : ?>
                <a href="<?php echo esc_url($ig_url); ?>" target="_blank" rel="noopener" class="ph ph-1x1"><img src="<?php echo esc_url(xf_slide_url($g->id, 0)); ?>" alt="<?php echo esc_attr($g->title); ?>" loading="lazy"><span class="k"><?php echo esc_html(wp_trim_words($g->title, 3, '')); ?></span></a>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>
</section>
<?php endif; ?>

<?php
// Three sector blocks: the design's picks first, else whichever sectors have stories.
$blocks = [];
$candidates = ['ai-deeptech', 'fintech', 'consumer-d2c', 'ecommerce', 'saas', 'funding', 'startup-news', 'ev-mobility', 'healthtech'];
$used = $exclude;
foreach ($candidates as $slug) {
    if (count($blocks) >= 3) break;
    $term = get_term_by('slug', $slug, 'category');
    if (!$term) continue;
    $posts = xft_query_posts(['posts_per_page' => 4, 'cat' => $term->term_id, 'post__not_in' => $used]);
    if (count($posts) >= 2) {
        $blocks[] = [$term, $posts];
        $used = array_merge($used, wp_list_pluck($posts, 'ID'));
    }
}
if ($blocks) : ?>
<section class="wrap" style="padding-top:88px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:40px 32px">
    <?php foreach ($blocks as [$term, $posts]) : $first = array_shift($posts); ?>
        <div class="rv">
            <div class="sh"><h2><?php echo esc_html($term->name); ?></h2><a class="k u" href="<?php echo esc_url(get_category_link($term)); ?>">More</a></div>
            <a href="<?php echo esc_url(get_permalink($first)); ?>" style="display:block;padding-top:16px"><?php echo xft_image($first, '16x9'); // phpcs:ignore ?><span style="display:block;margin-top:12px;font-size:19px;line-height:1.28;font-weight:600;letter-spacing:-.02em"><span class="u"><?php echo esc_html(get_the_title($first)); ?></span></span><span class="k" style="display:block;margin-top:8px;font-size:10.5px"><?php echo esc_html(xft_age($first)); ?> ago</span></a>
            <?php foreach ($posts as $p) : ?>
                <a href="<?php echo esc_url(get_permalink($p)); ?>" class="row" style="display:block;padding:13px 0;border-top:1px solid var(--ln);margin-top:14px;font-size:15px;line-height:1.38;font-weight:500"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span><span class="k" style="display:block;margin-top:5px;font-size:10.5px"><?php echo esc_html(xft_age($p)); ?> ago</span></a>
            <?php endforeach; ?>
        </div>
    <?php endforeach; ?>
</section>
<?php endif; ?>

<?php if ($events) : ?>
<section class="wrap" style="padding-top:88px;display:flex;flex-wrap:wrap;gap:40px">
    <div style="flex:1 1 380px;min-width:0">
        <div class="sh"><h2>Startup events</h2><a class="k u" href="<?php echo esc_url($events_url); ?>">Calendar →</a></div>
        <?php foreach ($events as $e) echo xft_event_row($e); // phpcs:ignore ?>
    </div>
</section>
<?php endif; ?>

<?php
$blog_cats = function_exists('xf_blog_categories') ? array_filter(array_map(function ($s) { $t = get_term_by('slug', $s, 'category'); return $t ? $t->term_id : 0; }, xf_blog_categories())) : [];
$blog_posts = $blog_cats ? xft_query_posts(['posts_per_page' => 4, 'category__in' => $blog_cats]) : [];
if (count($blog_posts) < 4) {
    $blog_posts = xft_query_posts(['posts_per_page' => 4, 'meta_key' => '_thumbnail_id', 'offset' => 3]);
}
if ($blog_posts) : ?>
<section class="wrap" style="padding-top:88px">
    <div class="sh"><h2>From the blog</h2><a class="k u" href="<?php echo esc_url($blog_url); ?>">All stories →</a></div>
    <div class="grid-cards" style="padding-top:24px">
        <?php foreach ($blog_posts as $p) : ?>
            <a href="<?php echo esc_url(get_permalink($p)); ?>" class="rv" style="display:block"><?php echo xft_image($p, '3x2'); // phpcs:ignore ?><span class="tag" style="display:block;margin-top:14px"><?php echo esc_html(xft_cat_name($p)); ?></span><span class="card-title"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></span><span class="k" style="display:block;margin-top:8px;font-size:10.5px"><?php echo esc_html(xft_author_name($p) . ' · ' . str_replace(' read', '', xft_read_time($p))); ?></span></a>
        <?php endforeach; ?>
    </div>
</section>
<?php endif; ?>

<section class="wrap" style="padding-top:100px">
    <div class="contribute">
        <div style="flex:1 1 380px"><div class="k">Contribute</div><h2>Got news the ecosystem should hear?</h2><p style="margin:14px 0 0;font-size:16px;line-height:1.6;color:var(--t2);max-width:440px">Every submission is read by an editor. The good ones go on the front page, and the best go on Instagram too.</p></div>
        <div style="flex:1 1 420px">
            <?php foreach ([['article', 'Submit an article', 'Analysis, opinion, founder lessons'], ['press', 'Send a press release', 'Funding, launches, partnerships'], ['launch', 'Submit your launch', 'Get considered for founder of the day'], ['job', 'Post a job', 'Reach founders and operators']] as [$type, $title, $sub]) : ?>
                <a href="<?php echo esc_url(add_query_arg('type', $type, $submit_url)); ?>" class="row opt"><span><span style="display:block;font-size:17px;font-weight:600;letter-spacing:-.015em"><?php echo esc_html($title); ?></span><span style="display:block;font-size:14px;color:var(--t2);margin-top:3px"><?php echo esc_html($sub); ?></span></span><?php echo xft_icon('<path d="M5 12h14M13 6l6 6-6 6"/>', 20); // phpcs:ignore ?></a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<?php get_footer();
