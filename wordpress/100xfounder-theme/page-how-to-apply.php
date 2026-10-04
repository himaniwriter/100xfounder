<?php
/** Index of "How to apply" guides, grouped A–Z, plus companies still without one. */
get_header();
$guides = get_posts(['post_type' => 'xf_guide', 'post_status' => 'publish', 'posts_per_page' => 300, 'orderby' => 'title', 'order' => 'ASC']);
$covered = array_filter(array_map(function ($g) { return get_post_meta($g->ID, '_xf_company_slug', true); }, $guides));
$companies = get_terms(['taxonomy' => 'xf_company', 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC', 'number' => 40]);
if (!$guides) {
    add_filter('wp_robots', function ($r) { $r['noindex'] = true; $r['follow'] = true; return $r; });
}
?>
<section class="wrap" style="padding-top:80px;padding-bottom:48px">
    <div class="k in"><span class="ac">How to apply</span> · Hiring process, interview rounds and tips, from public sources</div>
    <h1 class="display in" style="animation-delay:.08s">Get hired at<br>the company you want.</h1>
</section>
<div class="hl"></div>
<section class="wrap" style="padding-top:40px">
    <?php if ($guides) : ?>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px">
            <?php foreach ($guides as $g) : $c = function_exists('xf_guide_company') ? xf_guide_company($g->ID) : null; ?>
                <a class="card" style="min-height:180px" href="<?php echo esc_url(get_permalink($g)); ?>">
                    <span class="av"><?php echo esc_html(xft_initials($c ? $c->name : get_the_title($g))); ?></span>
                    <span class="card-title"><?php echo esc_html(get_the_title($g)); ?></span>
                    <span style="color:var(--t2);font-size:14px"><?php echo esc_html(implode(' · ', array_filter([get_post_meta($g->ID, '_xf_rounds', true), $c ? $c->count . ' open roles' : '']))); ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    <?php else : ?>
        <p style="color:var(--t2);font-size:17px">The first guides are being written and fact-checked. Meanwhile, browse roles from companies hiring now.</p>
    <?php endif; ?>
    <?php if ($companies && !is_wp_error($companies)) : ?>
        <div class="sh" style="margin-top:56px"><h2>Companies hiring now</h2><a class="k u" href="<?php echo esc_url(home_url('/jobs/')); ?>">All jobs →</a></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:18px">
            <?php foreach ($companies as $c) : if (in_array($c->slug, $covered, true)) continue; ?><a class="chip" href="<?php echo esc_url(get_term_link($c)); ?>"><?php echo esc_html($c->name . ' · ' . $c->count); ?></a><?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>
<?php get_footer();
