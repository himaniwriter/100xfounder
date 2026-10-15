<?php
/** Company hiring page: /jobs/company/{slug}/ */
get_header();
$term = get_queried_object();
$careers = get_term_meta($term->term_id, 'xf_careers_url', true);
$guide = function_exists('xf_guide_for_company') ? xf_guide_for_company($term) : null;
$paged = xft_paged();
$q = new WP_Query(['post_type' => 'xf_job', 'post_status' => 'publish', 'posts_per_page' => 30, 'paged' => $paged, 'tax_query' => [['taxonomy' => 'xf_company', 'terms' => $term->term_id]]]);
$fns = [];
foreach (get_posts(['post_type' => 'xf_job', 'posts_per_page' => -1, 'fields' => 'ids', 'tax_query' => [['taxonomy' => 'xf_company', 'terms' => $term->term_id]]]) as $jid) {
    $fn = get_post_meta($jid, '_xf_function', true);
    $fns[$fn] = ($fns[$fn] ?? 0) + 1;
}
arsort($fns);
add_filter('pre_get_document_title', function () use ($term, $q) { return $term->name . ' jobs in India (' . $q->found_posts . ' open roles) | ' . get_bloginfo('name'); });
?>
<section class="wrap" style="padding-top:4px;padding-bottom:40px">
    <div style="margin-top:36px;display:flex;flex-wrap:wrap;gap:24px 48px;align-items:flex-end">
        <div style="flex:999 1 600px"><div class="k in"><span class="ac">Hiring</span> · <?php echo (int) $q->found_posts; ?> open roles in India</div><div class="co-head in" style="animation-delay:.08s"><?php echo xft_company_mark($term, 72); // phpcs:ignore ?><h1 class="display"><?php echo esc_html($term->name); ?> jobs.</h1></div><?php $xi = function_exists('xf_job_landing_intro') ? xf_job_landing_intro($term) : ''; if ($xi) echo '<p class="muted in" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0;animation-delay:.12s">' . esc_html($xi) . '</p>'; ?></div>
        <div class="in" style="flex:1 1 260px;display:flex;flex-direction:column;gap:10px;animation-delay:.14s">
            <?php if ($guide) : ?><a class="btn btn-w" href="<?php echo esc_url(get_permalink($guide)); ?>">How to get hired at <?php echo esc_html($term->name); ?></a><?php endif; ?>
            <?php if ($careers) : ?><a class="btn" href="<?php echo esc_url($careers); ?>" target="_blank" rel="noopener">Official careers page ↗</a><?php endif; ?>
        </div>
    </div>
    <?php if ($fns) : ?><div class="facts in" style="margin-top:40px"><?php foreach (array_slice($fns, 0, 5, true) as $fn => $n) : ?><div><div class="k" style="font-size:10px"><?php echo esc_html($fn); ?></div><div class="v mono"><?php echo (int) $n; ?> roles</div></div><?php endforeach; ?></div><?php endif; ?>
</section>
<div class="hl"></div>
<section class="wrap" style="padding-top:24px">
    <?php foreach ($q->posts as $job) : ?>
        <div class="row job-row">
            <?php echo xft_company_mark($term); // phpcs:ignore ?>
            <div style="flex:1 1 260px;min-width:0"><a class="role" href="<?php echo esc_url(get_permalink($job)); ?>"><span class="u"><?php echo esc_html(get_the_title($job)); ?></span></a><div class="meta"><?php echo esc_html(get_post_meta($job->ID, '_xf_function', true) . ' · ' . wp_trim_words(get_post_meta($job->ID, '_xf_location', true), 6, '…')); ?></div></div>
            <span class="chip hs"><?php echo esc_html(get_post_meta($job->ID, '_xf_workplace', true)); ?></span>
            <span class="mono hs" style="width:28px;font-size:12px;color:var(--t3)"><?php echo esc_html(xft_age($job)); ?></span>
            <a href="<?php echo esc_url(get_permalink($job)); ?>" class="btn btn-w" style="height:40px">View role</a>
        </div>
    <?php endforeach; ?>
    <?php if (!$q->posts) : ?><div style="padding:48px 0;color:var(--t2)">No open roles right now.</div><?php endif; ?>
    <?php if ($q->max_num_pages > $paged) : ?><div class="pager"><a class="btn" href="<?php echo esc_url(add_query_arg('pg', $paged + 1)); ?>">More roles</a></div><?php endif; ?>
</section>
<?php get_footer();
