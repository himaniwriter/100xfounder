<?php
if (!defined('ABSPATH')) {
    exit;
}

/** Blog categories in homepage section order (slug => name). */
function xf_news_categories() {
    return [
        // Sector bar, in the design's order.
        'ai-deeptech' => 'AI & Deeptech',
        'fintech' => 'Fintech',
        'ecommerce' => 'eCommerce',
        'consumer-d2c' => 'Consumer & D2C',
        'ev-mobility' => 'EV & Mobility',
        'saas' => 'SaaS',
        'healthtech' => 'Healthtech',
        'web3' => 'Web3',
        'spacetech' => 'SpaceTech',
        'gaming' => 'Gaming',
        'press-releases' => 'Press releases',
        'reports' => 'Reports',
        // Story types.
        'funding' => 'Funding',
        'startup-news' => 'Startup News',
        'ai-news' => 'AI News',
        'founder-stories' => 'Founder Stories',
        'in-depth' => 'In Depth',
        'next-wave' => 'Next Wave',
    ];
}

/** Categories shown in the header sector bar. */
function xf_sector_categories() {
    return array_slice(xf_news_categories(), 0, 12, true);
}

/** Long-read categories that make up the Blog. */
function xf_blog_categories() {
    return ['in-depth', 'founder-stories', 'reports', 'next-wave'];
}

function xf_create_news_categories() {
    foreach (xf_news_categories() as $slug => $name) {
        if (!term_exists($slug, 'category')) {
            wp_insert_term($name, 'category', ['slug' => $slug]);
        }
    }
}

function xf_read_time($post_id) {
    $words = str_word_count(wp_strip_all_tags((string) get_post_field('post_content', $post_id)));
    return max(1, (int) ceil($words / 220)) . ' min read';
}

function xf_primary_category($post_id) {
    $cats = get_the_category($post_id);
    foreach ($cats as $cat) {
        if ($cat->slug !== 'uncategorized') {
            return $cat;
        }
    }
    return null;
}

function xf_post_meta_line($post_id) {
    $parts = array_filter([
        get_the_author_meta('display_name', (int) get_post_field('post_author', $post_id)),
        get_the_date('M j, Y', $post_id),
        xf_read_time($post_id),
    ]);
    return '<span class="xf-news-meta"><span>' . implode('</span><span>', array_map('esc_html', $parts)) . '</span></span>';
}

/** A news card. $size: lead (big image), card (image on top), row (small thumb at left), text (headline only). */
function xf_news_card($post_id, $size = 'card') {
    $cat = xf_primary_category($post_id);
    $badge = $cat ? '<span class="xf-cat">' . esc_html($cat->name) . '</span>' : '';
    $image_size = $size === 'lead' ? 'large' : ($size === 'row' ? 'thumbnail' : 'medium_large');
    $thumb = has_post_thumbnail($post_id) && $size !== 'text'
        ? '<span class="xf-news-thumb">' . get_the_post_thumbnail($post_id, $image_size, ['loading' => $size === 'lead' ? 'eager' : 'lazy']) . '</span>'
        : '';
    $excerpt = $size === 'lead' ? '<span class="xf-news-excerpt">' . esc_html(wp_trim_words(get_the_excerpt($post_id), 32)) . '</span>' : '';
    return sprintf(
        '<article class="xf-news-card xf-news-card--%s"><a href="%s">%s<span class="xf-news-body">%s<span class="xf-news-title">%s</span>%s%s</span></a></article>',
        esc_attr($size),
        esc_url(get_permalink($post_id)),
        $thumb,
        $badge,
        esc_html(get_the_title($post_id)),
        $excerpt,
        xf_post_meta_line($post_id)
    );
}

/** Most viewed posts, from the view counter below. */
function xf_popular_posts($count, array $exclude = []) {
    return get_posts([
        'post_type' => 'post',
        'posts_per_page' => $count,
        'post__not_in' => $exclude,
        'fields' => 'ids',
        'meta_key' => '_xf_views',
        'orderby' => 'meta_value_num',
        'order' => 'DESC',
    ]);
}

function xf_news_sidebar() {
    $out = '<aside class="xf-news-sidebar">';
    $popular = xf_popular_posts(5);
    if ($popular) {
        $out .= '<section class="xf-widget"><h3 class="xf-section-title">Most popular</h3><ol class="xf-ranked">';
        foreach ($popular as $id) {
            $out .= '<li>' . xf_news_card($id, 'row') . '</li>';
        }
        $out .= '</ol></section>';
    }
    $out .= xf_ad_unit('xf-ad--sidebar');
    $spotlights = get_posts(['post_type' => 'xf_spotlight', 'posts_per_page' => 3, 'fields' => 'ids']);
    if ($spotlights) {
        $out .= '<section class="xf-widget"><h3 class="xf-section-title">Founder spotlights</h3>';
        foreach ($spotlights as $id) {
            $out .= xf_spotlight_card($id);
        }
        $out .= '</section>';
    }
    $launches = get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 5, 'fields' => 'ids', 'meta_key' => '_xf_source', 'meta_value' => 'producthunt']);
    if ($launches) {
        $out .= '<section class="xf-widget"><h3 class="xf-section-title">Today\'s launches</h3><ul class="xf-plain-list">';
        foreach ($launches as $id) {
            $out .= '<li><a href="' . esc_url(get_permalink($id)) . '">' . esc_html(get_the_title($id)) . '</a> <span class="xf-muted">' . esc_html(wp_trim_words((string) get_post_meta($id, '_xf_tagline', true), 8)) . '</span></li>';
        }
        $out .= '</ul><a href="' . esc_url(xf_page_url('launches')) . '">All launches →</a></section>';
    }
    return $out . '</aside>';
}

/**
 * News-portal front page: lead story with a latest list, sidebar (most popular,
 * spotlights, launches), latest grid, then a row of cards per category.
 */
add_shortcode('xf_news', function () {
    $sticky = get_option('sticky_posts');
    $featured = $sticky ? get_posts(['post_type' => 'post', 'posts_per_page' => 1, 'post__in' => $sticky, 'ignore_sticky_posts' => true]) : [];
    if (!$featured) {
        // The lead story needs a picture: take the newest post that has one.
        $featured = get_posts(['post_type' => 'post', 'posts_per_page' => 1, 'meta_key' => '_thumbnail_id']);
    }
    if (!$featured) {
        $featured = get_posts(['post_type' => 'post', 'posts_per_page' => 1]);
    }
    if (!$featured) {
        return '<div class="xf xf-card"><p>Stories are on their way. Check back soon.</p></div>';
    }
    $lead = $featured[0]->ID;
    $side = get_posts(['post_type' => 'post', 'posts_per_page' => 5, 'post__not_in' => [$lead], 'fields' => 'ids']);
    $shown = array_merge([$lead], $side);
    $latest = get_posts(['post_type' => 'post', 'posts_per_page' => 6, 'post__not_in' => $shown, 'fields' => 'ids']);
    $shown = array_merge($shown, $latest);

    ob_start();
    echo '<div class="xf xf-news alignwide"><div class="xf-news-layout"><div class="xf-news-main">';
    echo '<section class="xf-news-hero">' . xf_news_card($lead, 'lead') . '<div class="xf-news-side"><h2 class="xf-section-title">Latest news</h2>'; // phpcs:ignore
    foreach ($side as $id) {
        echo xf_news_card($id, 'row'); // phpcs:ignore
    }
    echo '</div></section>';
    if ($latest) {
        echo '<section class="xf-news-section"><h2 class="xf-section-title">More stories</h2><div class="xf-news-grid">';
        foreach ($latest as $id) {
            echo xf_news_card($id, 'card'); // phpcs:ignore
        }
        echo '</div></section>';
    }
    echo '</div>' . xf_news_sidebar() . '</div>'; // phpcs:ignore
    echo xf_ad_unit('xf-ad--leaderboard'); // phpcs:ignore

    $n = 0;
    foreach (xf_news_categories() as $slug => $name) {
        $term = get_term_by('slug', $slug, 'category');
        if (!$term) {
            continue;
        }
        $ids = get_posts(['post_type' => 'post', 'posts_per_page' => 4, 'cat' => $term->term_id, 'post__not_in' => $shown, 'fields' => 'ids']);
        if (!$ids) {
            continue;
        }
        printf(
            '<section class="xf-news-section"><h2 class="xf-section-title">%s <a href="%s">View all →</a></h2><div class="xf-news-grid xf-news-grid--4">',
            esc_html($term->name),
            esc_url(get_term_link($term))
        );
        foreach ($ids as $id) {
            echo xf_news_card($id, 'card'); // phpcs:ignore
        }
        echo '</div></section>';
        if (++$n % 2 === 0) {
            echo xf_ad_unit('xf-ad--leaderboard'); // phpcs:ignore
        }
    }
    echo '</div>';
    return ob_get_clean();
});

/** Counts article views with a tiny beacon, so it still works behind page caching. */
add_action('wp_footer', function () {
    if (!is_singular('post')) {
        return;
    }
    printf(
        '<script>navigator.sendBeacon&&navigator.sendBeacon(%s);</script>',
        wp_json_encode(add_query_arg('id', get_queried_object_id(), rest_url('xf/v1/view')))
    );
});

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/view', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $id = (int) $request->get_param('id');
            if (get_post_type($id) !== 'post' || get_post_status($id) !== 'publish') {
                return new WP_REST_Response(null, 204);
            }
            // One counted view per visitor per post per hour.
            $key = 'xf_v_' . md5($id . '|' . ($_SERVER['REMOTE_ADDR'] ?? ''));
            if (!get_transient($key)) {
                set_transient($key, 1, HOUR_IN_SECONDS);
                update_post_meta($id, '_xf_views', (int) get_post_meta($id, '_xf_views', true) + 1);
            }
            return new WP_REST_Response(null, 204);
        },
    ]);
});

/** Posts need a view count of 0 so they sort into "Most popular". */
add_action('save_post_post', function ($post_id) {
    if (get_post_meta($post_id, '_xf_views', true) === '') {
        update_post_meta($post_id, '_xf_views', 0);
    }
});

/** Single articles: byline with read time on top, related stories at the end. */
add_filter('the_content', function ($content) {
    $post = get_post();
    if (!$post || $post->post_type !== 'post' || !is_singular('post') || $post->ID !== get_queried_object_id()) {
        return $content;
    }
    $cat = xf_primary_category($post->ID);
    $header = '<p class="xf xf-article-meta">' . ($cat ? '<a class="xf-cat" href="' . esc_url(get_term_link($cat)) . '">' . esc_html($cat->name) . '</a>' : '') . xf_post_meta_line($post->ID) . '</p>';

    $related = get_posts([
        'post_type' => 'post',
        'posts_per_page' => 3,
        'post__not_in' => [$post->ID],
        'fields' => 'ids',
        'cat' => $cat ? $cat->term_id : 0,
    ]);
    $footer = '';
    if ($related) {
        $footer = '<section class="xf xf-related"><h2 class="xf-section-title">Related stories</h2><div class="xf-news-grid">';
        foreach ($related as $id) {
            $footer .= xf_news_card($id, 'card');
        }
        $footer .= '</div></section>';
    }
    return $header . $content . xf_ad_unit() . $footer;
}, 15);

/** Main menu: works for block themes (wp_navigation) and classic themes (nav menu). */
function xf_create_navigation() {
    $items = ['news' => 'News', 'launches' => 'Launches', 'directory' => 'Startups', 'spotlights' => 'Founder Stories', 'about' => 'About', 'contact' => 'Contact'];
    if (wp_is_block_theme()) {
        if (get_posts(['post_type' => 'wp_navigation', 'post_status' => 'publish', 'posts_per_page' => 1, 'title' => '100xFounder menu'])) {
            return;
        }
        $blocks = '';
        foreach ($items as $key => $label) {
            $id = (int) (get_option('xf_pages', [])[$key] ?? 0);
            $blocks .= sprintf('<!-- wp:navigation-link {"label":"%s","type":"page","id":%d,"url":"%s","kind":"post-type"} /-->', esc_attr($label), $id, esc_url(xf_page_url($key)));
        }
        // The header Navigation block falls back to the most recent menu.
        wp_insert_post(['post_type' => 'wp_navigation', 'post_status' => 'publish', 'post_title' => '100xFounder menu', 'post_content' => $blocks]);
        return;
    }
    if (wp_get_nav_menu_object('100xFounder menu')) {
        return;
    }
    $menu_id = wp_create_nav_menu('100xFounder menu');
    if (is_wp_error($menu_id)) {
        return;
    }
    foreach ($items as $key => $label) {
        wp_update_nav_menu_item($menu_id, 0, [
            'menu-item-title' => $label,
            'menu-item-object' => 'page',
            'menu-item-object-id' => (int) (get_option('xf_pages', [])[$key] ?? 0),
            'menu-item-type' => 'post_type',
            'menu-item-status' => 'publish',
        ]);
    }
    $locations = get_theme_mod('nav_menu_locations', []);
    foreach (array_keys(get_registered_nav_menus()) as $location) {
        if (empty($locations[$location])) {
            $locations[$location] = $menu_id;
            break;
        }
    }
    set_theme_mod('nav_menu_locations', $locations);
}
