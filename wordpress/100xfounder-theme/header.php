<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#main">Skip to content</a>
<?php
$nav = xft_nav_items();
$submit_url = xft_page_url('submit', 'submit');
$instagram = xft_plugin() ? xf_get_setting('instagram_url') : '';
$linkedin = xft_plugin() ? xf_get_setting('linkedin_url') : '';
?>
<div class="dateline">
    <div class="wrap k">
        <span><?php echo esc_html(wp_date('l, j F Y')); ?><span class="hs"> · Bengaluru · New Delhi · San Francisco</span></span>
        <nav aria-label="Social">
            <?php if ($instagram) : ?><a class="hs" href="<?php echo esc_url($instagram); ?>" target="_blank" rel="noopener">Instagram</a><?php endif; ?>
            <?php if ($linkedin) : ?><a class="hs" href="<?php echo esc_url($linkedin); ?>" target="_blank" rel="noopener">LinkedIn</a><?php endif; ?>
            <a href="<?php echo esc_url(home_url("/#newsletter")); ?>" style="color:var(--tx)">Newsletter</a>
        </nav>
    </div>
</div>

<header class="site-header">
    <div class="wrap bar">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo"><img src="<?php echo esc_url(get_template_directory_uri() . '/assets/logo.png'); ?>" width="161" height="24" alt="<?php echo esc_attr(get_bloginfo('name') ?: '100xFounder'); ?> home"></a>
        <nav class="primary-nav" aria-label="Main">
            <?php foreach ($nav as $item) : ?>
                <a class="nl<?php echo xft_is_current($item['url']) ? ' on' : ''; ?>" href="<?php echo esc_url($item['url']); ?>"><?php echo esc_html($item['label']); ?></a>
            <?php endforeach; ?>
        </nav>
        <div class="header-actions">
            <button class="btn btn-icon" type="button" data-search-toggle aria-expanded="false" aria-controls="search-panel" aria-label="Search"><?php echo xft_icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 17); // phpcs:ignore ?></button>
            <a href="<?php echo esc_url($submit_url); ?>" class="btn btn-w hs">Submit story</a>
            <button class="btn btn-icon mb" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu">
                <span class="icon-menu"><?php echo xft_icon('<path d="M4 8h16M4 16h16"/>', 18); // phpcs:ignore ?></span>
                <span class="icon-close"><?php echo xft_icon('<path d="M6 6l12 12M18 6 6 18"/>', 18); // phpcs:ignore ?></span>
            </button>
        </div>
    </div>
    <nav class="mnav wrap" id="mobile-nav" aria-label="Menu">
        <?php foreach ($nav as $item) : ?>
            <a class="ml" href="<?php echo esc_url($item['url']); ?>"><?php echo esc_html($item['label']); ?><span class="k">→</span></a>
        <?php endforeach; ?>
        <a href="<?php echo esc_url($submit_url); ?>" class="btn btn-w" style="margin-top:16px;height:48px">Submit story</a>
    </nav>
    <div class="search-panel" id="search-panel">
        <form class="wrap" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
            <label class="screen-reader-text" for="site-search">Search</label>
            <input id="site-search" type="search" name="s" value="<?php echo esc_attr(get_search_query()); ?>" placeholder="Search stories, startups, founders">
            <button class="btn btn-w" type="submit">Search</button>
        </form>
    </div>
    <?php $sectors = xft_sector_links(); if ($sectors) : ?>
        <div class="sectors">
            <div class="wrap">
                <?php foreach ($sectors as $s) : ?>
                    <a class="sec<?php echo is_category($s['slug']) ? ' on' : ''; ?>" href="<?php echo esc_url($s['url']); ?>"><?php echo esc_html($s['label']); ?></a>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
</header>

<?php if (is_front_page()) :
    // News headlines when there are any; until then the newest roles, labelled as such.
    $ticker = xft_ticker_posts();
    $label = 'Breaking';
    if (!$ticker && post_type_exists('xf_job')) {
        $ticker = get_posts(['post_type' => 'xf_job', 'posts_per_page' => 8]);
        $label = 'Now hiring';
    }
    if ($ticker) : ?>
        <div class="ticker" aria-label="<?php echo esc_attr($label); ?>">
            <div class="k label"><?php echo esc_html($label); ?></div>
            <div class="track"><div class="mq">
                <?php for ($copy = 0; $copy < 2; $copy++) : foreach ($ticker as $t) :
                    $co = $t->post_type === 'xf_job' ? get_post_meta($t->ID, '_xf_company_name', true) : ''; ?>
                    <a href="<?php echo esc_url(get_permalink($t)); ?>"<?php echo $copy ? ' aria-hidden="true" tabindex="-1"' : ''; ?>><span class="mono" style="color:var(--t3);font-size:11px"><?php echo esc_html($co ?: get_the_time('H:i', $t)); ?></span>&nbsp;&nbsp;<?php echo esc_html(get_the_title($t)); ?></a>
                <?php endforeach; endfor; ?>
            </div></div>
        </div>
    <?php endif;
endif; ?>
<main id="main">
