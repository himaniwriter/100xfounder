<?php
/** Funding hub: every sourced round, newest first, then our funding stories and the startups in them. */
get_header();
$paged = xft_paged();
$q = new WP_Query(['post_type' => 'xf_round', 'post_status' => 'publish', 'posts_per_page' => 30, 'paged' => $paged]);
$week = function_exists('xf_rounds_total_usd') ? xf_rounds_total_usd(7) : 0;
$month = function_exists('xf_rounds_total_usd') ? xf_rounds_total_usd(30) : 0;
$stories = function_exists('xf_hub_posts') && $paged === 1 ? xf_hub_posts('funding') : [];
$named = function_exists('xf_hub_startups_mentioned') && $paged === 1 ? xf_hub_startups_mentioned('funding', 12) : [];
?>
<section class="wrap" style="padding-top:28px">
    <div class="k in">Funding tracker</div>
    <h1 class="page-title in" style="animation-delay:.06s">Who raised, from whom.</h1>
    <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Funding rounds across Indian and US startups. Every row links to its source. Below the rounds are our funding news stories and explainers on how rounds, IPOs and startup equity work, and the startups those stories cover.</p>
    <?php if ($week || $month) : ?>
        <div class="pillars" style="margin-top:28px;max-width:640px">
            <div class="pc"><span class="pw"><?php echo esc_html(xf_format_usd_short($week)); ?></span><span class="meta">Disclosed this week</span></div>
            <div class="pc"><span class="pw"><?php echo esc_html(xf_format_usd_short($month)); ?></span><span class="meta">Disclosed in 30 days</span></div>
        </div>
    <?php endif; ?>
</section>
<?php if ($paged === 1 && function_exists('xf_fr_links_html')) echo xf_fr_links_html(); // phpcs:ignore -- escaped inside ?>
<section class="wrap" style="padding-top:48px">
    <div class="sh"><h2>Latest rounds</h2><a class="k u" href="<?php echo esc_url(add_query_arg('type', 'press', xft_page_url('submit', 'submit'))); ?>">Report a round →</a></div>
    <?php if ($q->posts) : get_template_part('parts/funding-rows', null, ['rounds' => $q->posts]);
    else : ?><div style="padding:48px 0;color:var(--t2)">Rounds will appear here as we track them.</div><?php endif; ?>
    <?php if ($q->max_num_pages > $paged) : ?><div class="pager"><a class="btn" href="<?php echo esc_url(add_query_arg('pg', $paged + 1)); ?>">Older rounds</a></div><?php endif; ?>
</section>
<?php if ($stories) : ?>
    <section class="wrap" style="padding-top:64px">
        <div class="sh"><h2>Funding stories and explainers</h2><span class="k"><?php echo esc_html(number_format_i18n(count($stories))); ?> articles</span></div>
        <?php foreach ($stories as $p) echo xft_feed_item($p); // phpcs:ignore ?>
    </section>
<?php endif; ?>
<?php if ($named) : ?>
    <section class="wrap" style="padding-top:64px">
        <div class="sh"><h2>Startups in these stories</h2><a class="k u" href="<?php echo esc_url(xft_page_url('directory', 'startups')); ?>">All startups →</a></div>
        <?php get_template_part('parts/startup-grid', null, ['startups' => $named]); ?>
    </section>
<?php endif; ?>
<?php get_footer();
