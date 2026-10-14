<?php
/** Hub: every "best AI tools" guide and review, plus the AI startups we have researched. */
get_header();
$guides = function_exists('xf_hub_posts') ? xf_hub_posts('ai_tools') : [];
$startups = function_exists('xf_hub_ai_startups') ? xf_hub_ai_startups(12) : [];
$industry = get_term_by('slug', 'artificial-intelligence', 'xf_industry');
?>
<section class="wrap" style="padding-top:28px">
    <div class="k in">Topic hub</div>
    <h1 class="page-title in" style="animation-delay:.06s">Best AI tools</h1>
    <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Our guides to choosing AI tools for a specific job: coding, writing, design, sales, support, research and more. Each one compares prices, free-plan limits and who the tool suits, with the vendors' own pages linked as sources. Below the guides are AI startups we have profiled from public sources.</p>
</section>
<section class="wrap" style="padding-top:48px">
    <div class="sh"><h2>Guides and reviews</h2><span class="k"><?php echo esc_html(number_format_i18n(count($guides))); ?> articles</span></div>
    <?php if ($guides) : foreach ($guides as $p) echo xft_feed_item($p); // phpcs:ignore
    else : ?><div style="padding:48px 0;color:var(--t2)">Guides will appear here as we publish them.</div><?php endif; ?>
</section>
<?php if ($startups) : ?>
    <section class="wrap" style="padding-top:64px">
        <div class="sh"><h2>AI startups we have profiled</h2><?php if ($industry) : ?><a class="k u" href="<?php echo esc_url(get_term_link($industry)); ?>">All AI startups →</a><?php endif; ?></div>
        <?php get_template_part('parts/startup-grid', null, ['startups' => $startups]); ?>
    </section>
<?php endif; ?>
<?php get_footer();
