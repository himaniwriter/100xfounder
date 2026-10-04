<?php
/** Funding tracker: every sourced round, newest first. */
get_header();
$paged = xft_paged();
$q = new WP_Query(['post_type' => 'xf_round', 'post_status' => 'publish', 'posts_per_page' => 30, 'paged' => $paged]);
$week = function_exists('xf_rounds_total_usd') ? xf_rounds_total_usd(7) : 0;
$month = function_exists('xf_rounds_total_usd') ? xf_rounds_total_usd(30) : 0;
?>
<section class="wrap" style="padding-top:56px">
    <div class="k in">Funding tracker</div>
    <h1 class="page-title in" style="animation-delay:.06s">Who raised, from whom.</h1>
    <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Funding rounds across Indian and US startups. Every row links to its source.</p>
    <?php if ($week || $month) : ?>
        <div class="pillars" style="margin-top:28px;max-width:640px">
            <div class="pc"><span class="pw"><?php echo esc_html(xf_format_usd_short($week)); ?></span><span class="meta">Disclosed this week</span></div>
            <div class="pc"><span class="pw"><?php echo esc_html(xf_format_usd_short($month)); ?></span><span class="meta">Disclosed in 30 days</span></div>
        </div>
    <?php endif; ?>
</section>
<section class="wrap" style="padding-top:48px">
    <div class="sh"><h2>Latest rounds</h2><a class="k u" href="<?php echo esc_url(add_query_arg('type', 'press', xft_page_url('submit', 'submit'))); ?>">Report a round →</a></div>
    <?php if ($q->posts) : get_template_part('parts/funding-rows', null, ['rounds' => $q->posts]);
    else : ?><div style="padding:48px 0;color:var(--t2)">Rounds will appear here as we track them.</div><?php endif; ?>
    <?php if ($q->max_num_pages > $paged) : ?><div class="pager"><a class="btn" href="<?php echo esc_url(add_query_arg('pg', $paged + 1)); ?>">Older rounds</a></div><?php endif; ?>
</section>
<?php get_footer();
