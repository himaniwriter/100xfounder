<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('init', 'xf_register_post_types');

function xf_register_post_types() {
    register_post_type('xf_startup', [
        'labels' => [
            'name' => 'Startups',
            'singular_name' => 'Startup',
            'add_new_item' => 'Add startup',
            'edit_item' => 'Edit startup',
            'search_items' => 'Search startups',
        ],
        'public' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'startup', 'with_front' => false],
        'menu_icon' => 'dashicons-rocket',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
        'show_in_rest' => true,
    ]);

    register_post_type('xf_spotlight', [
        'labels' => [
            'name' => 'Founder Spotlights',
            'singular_name' => 'Founder Spotlight',
            'edit_item' => 'Edit spotlight',
            'search_items' => 'Search spotlights',
        ],
        'public' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'spotlight', 'with_front' => false],
        'menu_icon' => 'dashicons-star-filled',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
        'show_in_rest' => true,
    ]);

    register_taxonomy('xf_industry', ['xf_startup'], [
        'labels' => ['name' => 'Industries', 'singular_name' => 'Industry'],
        'public' => true,
        'hierarchical' => false,
        'rewrite' => ['slug' => 'industry', 'with_front' => false],
        'show_in_rest' => true,
        'show_admin_column' => true,
    ]);

    register_taxonomy('xf_stage', ['xf_startup'], [
        'labels' => ['name' => 'Stages', 'singular_name' => 'Stage'],
        'public' => true,
        'hierarchical' => false,
        'rewrite' => ['slug' => 'stage', 'with_front' => false],
        'show_in_rest' => true,
        'show_admin_column' => true,
    ]);
}

/** Selection reasons recorded by the Product Hunt importer, as shown to readers. */
function xf_reason_labels() {
    return [
        'product_of_the_day' => '#1 of the day',
        'top_featured' => 'Top 5 of the day',
        'top_votes' => 'Top 10 by votes',
        'vote_threshold' => '100+ upvotes',
    ];
}

function xf_startup_meta($post_id) {
    $keys = ['source', 'tagline', 'website', 'ph_url', 'thumbnail', 'votes', 'launch_day', 'reasons', 'topics',
        'founder_name', 'founded', 'hq', 'funding', 'employees', 'linkedin', 'twitter'];
    $meta = [];
    foreach ($keys as $key) {
        $meta[$key] = get_post_meta($post_id, '_xf_' . $key, true);
    }
    return $meta;
}

function xf_startup_logo_html($post_id, $size = 64) {
    if (has_post_thumbnail($post_id)) {
        return get_the_post_thumbnail($post_id, 'thumbnail', ['class' => 'xf-logo', 'style' => "width:{$size}px;height:{$size}px", 'loading' => 'lazy']);
    }
    $thumb = get_post_meta($post_id, '_xf_thumbnail', true);
    if ($thumb) {
        return sprintf('<img class="xf-logo" src="%s" alt="" width="%d" height="%d" loading="lazy">', esc_url($thumb), $size, $size);
    }
    $initial = mb_strtoupper(mb_substr(get_the_title($post_id), 0, 1));
    return sprintf('<span class="xf-logo xf-logo--initial" style="width:%1$dpx;height:%1$dpx">%2$s</span>', $size, esc_html($initial));
}

function xf_published_spotlight_for($startup_id) {
    $posts = get_posts([
        'post_type' => 'xf_spotlight',
        'post_status' => 'publish',
        'posts_per_page' => 1,
        'meta_key' => '_xf_startup_id',
        'meta_value' => $startup_id,
    ]);
    return $posts[0] ?? null;
}

/** Wraps a startup's description with its header, facts and links. */
add_filter('the_content', function ($content) {
    $post = get_post();
    // Block themes render post content outside the classic loop, so match the queried post instead.
    if (!is_singular() || !$post || $post->ID !== get_queried_object_id()) {
        return $content;
    }
    if ($post->post_type === 'xf_startup') {
        return xf_render_startup($post, $content);
    }
    if ($post->post_type === 'xf_spotlight') {
        return xf_render_spotlight($post, $content);
    }
    return $content;
}, 20);

function xf_render_startup(WP_Post $post, $content) {
    $m = xf_startup_meta($post->ID);
    $labels = xf_reason_labels();
    $spotlight = xf_published_spotlight_for($post->ID);
    $badges = '';
    foreach ((array) $m['reasons'] as $reason) {
        if (isset($labels[$reason])) {
            $badges .= '<span class="xf-badge xf-badge--accent">' . esc_html($labels[$reason]) . '</span>';
        }
    }
    foreach (wp_get_post_terms($post->ID, ['xf_industry', 'xf_stage'], ['fields' => 'names']) as $term) {
        $badges .= '<span class="xf-badge">' . esc_html($term) . '</span>';
    }

    $facts = [];
    if ($m['votes']) $facts[] = sprintf('%d upvotes on Product Hunt', (int) $m['votes']);
    if ($m['launch_day']) $facts[] = 'Launched ' . esc_html(mysql2date('F j, Y', $m['launch_day']));
    if ($m['founded']) $facts[] = 'Founded ' . esc_html($m['founded']);
    if ($m['hq']) $facts[] = esc_html($m['hq']);
    if ($m['employees']) $facts[] = esc_html($m['employees']);

    ob_start();
    ?>
    <div class="xf xf-startup">
        <div class="xf-startup__head">
            <?php echo xf_startup_logo_html($post->ID, 80); // phpcs:ignore WordPress.Security.EscapeOutput ?>
            <div>
                <?php if ($m['tagline']) : ?><p class="xf-tagline"><?php echo esc_html($m['tagline']); ?></p><?php endif; ?>
                <?php if ($facts) : ?><p class="xf-muted"><?php echo implode(' · ', $facts); // phpcs:ignore ?></p><?php endif; ?>
            </div>
        </div>
        <?php if ($badges) : ?><div class="xf-badges"><?php echo $badges; // phpcs:ignore ?></div><?php endif; ?>
        <div class="xf-startup__body"><?php echo $content; // phpcs:ignore ?></div>
        <?php if ($m['funding']) : ?><p><strong>Funding:</strong> <?php echo esc_html($m['funding']); ?></p><?php endif; ?>
        <div class="xf-actions">
            <?php if ($m['website']) : ?>
                <a class="xf-button" href="<?php echo esc_url($m['website']); ?>" target="_blank" rel="<?php echo $spotlight ? 'noopener' : 'nofollow noopener'; ?>">Visit <?php echo esc_html(get_the_title($post)); ?></a>
            <?php endif; ?>
            <?php if ($m['ph_url']) : ?>
                <a class="xf-button xf-button--ghost" href="<?php echo esc_url($m['ph_url']); ?>" target="_blank" rel="noopener">Spotted on Product Hunt</a>
            <?php endif; ?>
            <?php if ($m['linkedin']) : ?>
                <a class="xf-button xf-button--ghost" href="<?php echo esc_url($m['linkedin']); ?>" target="_blank" rel="nofollow noopener">LinkedIn</a>
            <?php endif; ?>
        </div>
        <?php if ($spotlight) : ?>
            <div class="xf-card xf-card--highlight">
                <p class="xf-eyebrow">Founder spotlight</p>
                <h3><?php echo esc_html(get_the_title($spotlight)); ?></h3>
                <p><?php echo esc_html(wp_trim_words(get_post_meta($spotlight->ID, '_xf_story_origin', true), 40)); ?></p>
                <a href="<?php echo esc_url(get_permalink($spotlight)); ?>">Read the full story →</a>
            </div>
        <?php else : ?>
            <div class="xf-card">
                <h3>Are you the founder of <?php echo esc_html(get_the_title($post)); ?>?</h3>
                <p class="xf-muted">Get a free founder spotlight on 100xFounder and our Instagram. Check your inbox for an invite, or reply to any of our emails.</p>
            </div>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}

function xf_render_spotlight(WP_Post $post, $content) {
    $startup_id = (int) get_post_meta($post->ID, '_xf_startup_id', true);
    $role = get_post_meta($post->ID, '_xf_role', true);
    $location = get_post_meta($post->ID, '_xf_location', true);
    $links = [
        'X / Twitter' => get_post_meta($post->ID, '_xf_twitter', true),
        'LinkedIn' => get_post_meta($post->ID, '_xf_linkedin', true),
    ];
    $website = $startup_id ? get_post_meta($startup_id, '_xf_website', true) : '';

    ob_start();
    ?>
    <div class="xf xf-spotlight">
        <p class="xf-eyebrow">Founder spotlight</p>
        <?php if ($role || $location) : ?>
            <p class="xf-muted"><?php echo esc_html(implode(' · ', array_filter([$role, $location]))); ?></p>
        <?php endif; ?>
        <?php if ($startup_id && get_post_status($startup_id) === 'publish') : ?>
            <p class="xf-card">
                <a href="<?php echo esc_url(get_permalink($startup_id)); ?>"><strong><?php echo esc_html(get_the_title($startup_id)); ?></strong></a>:
                <?php echo esc_html(get_post_meta($startup_id, '_xf_tagline', true)); ?>
            </p>
        <?php endif; ?>
        <div class="xf-spotlight__body"><?php echo $content; // phpcs:ignore ?></div>
        <div class="xf-actions">
            <?php if ($website) : ?>
                <a class="xf-button" href="<?php echo esc_url($website); ?>" target="_blank" rel="noopener">Visit <?php echo esc_html(get_the_title($startup_id)); ?></a>
            <?php endif; ?>
            <?php foreach ($links as $label => $url) : if ($url) : ?>
                <a class="xf-button xf-button--ghost" href="<?php echo esc_url($url); ?>" target="_blank" rel="nofollow noopener"><?php echo esc_html($label); ?></a>
            <?php endif; endforeach; ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

/**
 * Tagline-only listings are thin content. Keep them out of search results until
 * they have a founder spotlight or a substantial description.
 */
add_filter('wp_robots', function ($robots) {
    // Private, token-based pages never belong in search results.
    $pages = get_option('xf_pages', []);
    foreach (['feature', 'unsubscribe'] as $key) {
        if (!empty($pages[$key]) && is_page($pages[$key])) {
            $robots['noindex'] = true;
            $robots['nofollow'] = true;
        }
    }
    if (is_singular('xf_startup')) {
        $post = get_post();
        $rich = strlen(wp_strip_all_tags($post->post_content)) >= 600 || xf_published_spotlight_for($post->ID);
        if (!$rich) {
            $robots['noindex'] = true;
            $robots['follow'] = true;
        }
    }
    return $robots;
});

/** Keep thin startup listings out of the core XML sitemap too. */
add_filter('wp_sitemaps_posts_query_args', function ($args, $post_type) {
    if ($post_type === 'xf_startup') {
        $args['meta_query'] = [['key' => '_xf_indexable', 'value' => '1']];
    }
    return $args;
}, 10, 2);

/** Recomputes the sitemap flag whenever a startup or its spotlight changes. */
function xf_refresh_indexable_flag($startup_id) {
    $post = get_post($startup_id);
    if (!$post || $post->post_type !== 'xf_startup') {
        return;
    }
    $rich = strlen(wp_strip_all_tags($post->post_content)) >= 600 || xf_published_spotlight_for($startup_id);
    update_post_meta($startup_id, '_xf_indexable', $rich ? '1' : '0');
}

add_action('save_post_xf_startup', function ($post_id) {
    xf_refresh_indexable_flag($post_id);
});
