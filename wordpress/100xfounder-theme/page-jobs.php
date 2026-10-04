<?php
/**
 * Jobs board (design: Jobs.dc.html). Also serves the clean URLs
 * /jobs/{function}-jobs-in-{city}/, /jobs/{function}-jobs/ and /jobs/jobs-in-{city}/.
 */
if (!function_exists('xf_job_filters_from_request')) {
    get_template_part('singular');
    return;
}
$f = xf_job_filters_from_request();
$paged = xft_paged();
$q = new WP_Query(xf_job_query_args($f, 25, $paged));
$counts = xf_job_counts_by_function(array_merge($f, ['function' => '']));
$total_all = (int) (new WP_Query(array_merge(xf_job_query_args(array_merge($f, ['function' => '']), 1), ['fields' => 'ids'])))->found_posts;
$base = home_url('/jobs/');

// Headline for clean URLs: "AI & ML jobs in Bengaluru".
$remote = $f['city'] === 'Remote' || $f['workplace'] === 'Remote';
$in_city = $f['city'] && $f['city'] !== 'Remote' ? ' in ' . $f['city'] : '';
if ($f['function']) $heading = ($remote ? 'Remote ' : '') . $f['function'] . ' jobs' . $in_city;
elseif ($remote) $heading = 'Remote jobs' . $in_city;
elseif ($in_city) $heading = 'Jobs' . $in_city;
else $heading = '';
$is_landing = (bool) get_query_var('xf_jobs_slug');

// Thin landing pages stay out of the index until they have enough roles.
if ($is_landing && $q->found_posts < 5) {
    add_filter('wp_robots', function ($r) { $r['noindex'] = true; $r['follow'] = true; return $r; });
}
add_filter('pre_get_document_title', function () use ($heading) {
    return ($heading ?: 'Jobs in India at Startups and Top Companies') . ' (' . wp_date('F Y') . ') | ' . get_bloginfo('name');
});

if (!function_exists('xft_jobs_link')) :
function xft_jobs_link($f, $changes) {
    $f = array_merge($f, $changes);
    // Function + city pick a clean URL; everything else is a query string.
    $slug = '';
    if ($f['function'] && $f['city']) $slug = sanitize_title($f['function']) . '-jobs-in-' . sanitize_title($f['city']);
    elseif ($f['function']) $slug = sanitize_title($f['function']) . '-jobs';
    elseif ($f['city']) $slug = 'jobs-in-' . sanitize_title($f['city']);
    $url = home_url('/jobs/' . ($slug ? $slug . '/' : ''));
    return add_query_arg(array_filter(['q' => $f['q'], 'where' => $f['where'], 'wp' => $f['workplace'] && $f['workplace'] !== 'All' ? $f['workplace'] : '']), $url);
}
endif;

get_header();
?>
<section class="wrap" style="padding-top:80px;padding-bottom:40px">
    <div class="k in"><span class="ac">Jobs</span> · <?php echo $heading ? esc_html($heading) : 'Startups and top companies hiring in India'; ?></div>
    <h1 class="display in" style="animation-delay:.08s"><?php echo $heading ? esc_html($heading) . '.' : 'Find your<br>next day one.'; // phpcs:ignore ?></h1>
    <form class="jsearch in" method="get" action="<?php echo esc_url(xft_jobs_link($f, ['q' => '', 'where' => ''])); ?>" style="animation-delay:.16s">
        <div class="fp" style="flex:2 1 300px"><label for="jq" class="k" style="font-size:10px">What</label><input id="jq" name="q" value="<?php echo esc_attr($f['q']); ?>" placeholder="Role, skill or company"></div>
        <div class="fp" style="flex:1 1 220px"><label for="jw" class="k" style="font-size:10px">Where</label><input id="jw" name="where" value="<?php echo esc_attr($f['where']); ?>" placeholder="Bengaluru, Remote, Pune"></div>
        <?php if ($f['workplace']) : ?><input type="hidden" name="wp" value="<?php echo esc_attr($f['workplace']); ?>"><?php endif; ?>
        <button type="submit">Search</button>
    </form>
</section>
<div class="hl"></div>

<section class="wrap" style="padding-top:40px;padding-bottom:40px;display:flex;flex-wrap:wrap;gap:40px 56px;align-items:flex-start">
    <aside style="flex:1 1 230px;max-width:100%">
        <div class="k" style="padding-bottom:8px;border-bottom:1px solid var(--ln)">Function</div>
        <a class="opt<?php echo !$f['function'] ? ' on' : ''; ?>" href="<?php echo esc_url(xft_jobs_link($f, ['function' => ''])); ?>"><span>All roles</span><span class="mono" style="font-size:12px;color:var(--t3)"><?php echo (int) $total_all; ?></span></a>
        <?php foreach ($counts as $fn => $n) : if (!$n) continue; ?>
            <a class="opt<?php echo $f['function'] === $fn ? ' on' : ''; ?>" href="<?php echo esc_url(xft_jobs_link($f, ['function' => $fn])); ?>"><span><?php echo esc_html($fn); ?></span><span class="mono" style="font-size:12px;color:var(--t3)"><?php echo (int) $n; ?></span></a>
        <?php endforeach; ?>
        <div class="k" style="padding:32px 0 12px">City</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
            <?php foreach (XF_JOB_CITIES as $city) : ?>
                <a class="chip<?php echo $f['city'] === $city ? ' chip-ac' : ''; ?>" href="<?php echo esc_url(xft_jobs_link($f, ['city' => $f['city'] === $city ? '' : $city, 'where' => ''])); ?>"><?php echo esc_html($city); ?></a>
            <?php endforeach; ?>
        </div>
        <form class="xf-subscribe hs" style="margin-top:36px" data-endpoint="<?php echo esc_url(rest_url('xf/v1/job-alert')); ?>" data-alert="<?php echo esc_attr(trim($f['function'] . ' ' . $f['city'])); ?>">
            <div class="k">Morning job alerts</div>
            <div class="xf-subscribe__title" style="font-size:15px;font-weight:500;color:var(--t2)">New roles matching your filters, in your inbox at 8am.</div>
            <label class="screen-reader-text" for="ja-email">Email</label>
            <input id="ja-email" type="email" name="email" required placeholder="you@email.com" autocomplete="email">
            <input type="text" name="website" tabindex="-1" autocomplete="off" class="xf-hp" aria-hidden="true">
            <button type="submit" class="btn">Create alert</button>
            <p class="xf-subscribe__msg" role="status" aria-live="polite"></p>
        </form>
    </aside>

    <div style="flex:999 1 600px;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--ln)">
            <nav class="tabs-s" aria-label="Work type">
                <?php foreach (['All', 'Full-time', 'Remote', 'Hybrid'] as $t) : $on = ($f['workplace'] ?: 'All') === $t; ?>
                    <a class="tab-s<?php echo $on ? ' on' : ''; ?>" href="<?php echo esc_url(xft_jobs_link($f, ['workplace' => $t === 'All' ? '' : $t])); ?>"<?php echo $on ? ' aria-current="page"' : ''; ?>><?php echo esc_html($t); ?></a>
                <?php endforeach; ?>
            </nav>
            <span class="k" style="padding-bottom:8px"><span style="color:var(--tx)"><?php echo (int) $q->found_posts; ?></span> roles</span>
        </div>
        <?php foreach ($q->posts as $job) :
            $company = get_post_meta($job->ID, '_xf_company_name', true);
            $salary = xf_job_salary_label($job->ID);
            $type = get_post_meta($job->ID, '_xf_workplace', true) === 'On-site' ? get_post_meta($job->ID, '_xf_type', true) : get_post_meta($job->ID, '_xf_workplace', true);
            $loc = get_post_meta($job->ID, '_xf_city', true);
            $loc = $loc && $loc !== 'Other' ? $loc : get_post_meta($job->ID, '_xf_location', true); ?>
            <div class="row job-row">
                <span class="av"><?php echo esc_html(xft_initials($company)); ?></span>
                <div style="flex:1 1 260px;min-width:0">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><a class="role" href="<?php echo esc_url(get_permalink($job)); ?>"><span class="u"><?php echo esc_html(get_the_title($job)); ?></span></a><?php if (get_post_meta($job->ID, '_xf_hot', true) === 'yes') : ?><span class="chip chip-ac">Founder replies fast</span><?php endif; ?></div>
                    <div class="meta"><?php echo esc_html(implode(' · ', array_filter([$company, get_post_meta($job->ID, '_xf_function', true), wp_trim_words($loc, 6, '…')]))); ?></div>
                </div>
                <span class="chip hs"><?php echo esc_html($type); ?></span>
                <?php if ($salary) : ?><span class="mono" style="width:120px;font-size:14px"><?php echo esc_html($salary); ?></span><?php endif; ?>
                <span class="mono hs" style="width:28px;font-size:12px;color:var(--t3)"><?php echo esc_html(xft_age($job)); ?></span>
                <button class="save" type="button" data-save="<?php echo (int) $job->ID; ?>" aria-label="Save <?php echo esc_attr(get_the_title($job)); ?>"><?php echo xft_icon('<path d="M6 3h12v18l-6-4-6 4z"/>', 15); // phpcs:ignore ?></button>
                <a href="<?php echo esc_url(get_permalink($job)); ?>" class="btn btn-w" style="height:40px">Apply</a>
            </div>
        <?php endforeach; ?>
        <?php if (!$q->posts) : ?><div style="padding:56px 0;color:var(--t2)">No roles match these filters yet. <a href="<?php echo esc_url($base); ?>" style="border-bottom:1px solid var(--ln2)">See all jobs</a>.</div><?php endif; ?>
        <?php if ($q->max_num_pages > 1) : ?>
            <div class="pager">
                <?php if ($paged > 1) : ?><a class="btn" href="<?php echo esc_url(add_query_arg('pg', $paged - 1)); ?>">Newer roles</a><?php endif; ?>
                <?php if ($paged < $q->max_num_pages) : ?><a class="btn" href="<?php echo esc_url(add_query_arg('pg', $paged + 1)); ?>">Older roles</a><?php endif; ?>
            </div>
        <?php endif; ?>
        <p class="k" style="margin-top:18px;font-size:10.5px">Roles come from companies' official careers pages and are checked daily. Apply on the company's site; we never charge candidates.</p>
    </div>
</section>

<?php
// Popular searches: internal links to the clean role/city pages.
$links = [];
foreach (['Engineering', 'AI & ML', 'Product', 'Marketing', 'Data', 'Design'] as $fn) {
    foreach (['Bengaluru', 'Delhi NCR', 'Hyderabad', 'Mumbai', 'Pune', 'Remote'] as $city) {
        $links[] = [$fn . ' jobs in ' . $city, home_url('/jobs/' . sanitize_title($fn) . '-jobs-in-' . sanitize_title($city) . '/')];
    }
}
$companies = get_terms(['taxonomy' => 'xf_company', 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC', 'number' => 24]);
?>
<section class="wrap" style="padding-top:40px">
    <div class="sh"><h2>Popular searches</h2><a class="k u" href="<?php echo esc_url(xft_page_url('tools', 'tools')); ?>">Salary calculators →</a></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px 18px;padding-top:18px;font-size:14px">
        <?php foreach ($links as [$label, $url]) : ?><a class="nl" href="<?php echo esc_url($url); ?>"><?php echo esc_html($label); ?></a><?php endforeach; ?>
    </div>
    <?php if ($companies && !is_wp_error($companies)) : ?>
        <div class="sh" style="margin-top:48px"><h2>Companies hiring</h2><a class="k u" href="<?php echo esc_url(xft_page_url('guides', 'how-to-apply')); ?>">How to apply guides →</a></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:18px">
            <?php foreach ($companies as $c) : ?><a class="chip" href="<?php echo esc_url(get_term_link($c)); ?>"><?php echo esc_html($c->name . ' · ' . $c->count); ?></a><?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>
<?php get_footer();
