<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Indexing policy (owner, 2026-10-09): every public page is indexable except
 * tag archives (/tag/…), which stay noindex,follow and out of the sitemap.
 * The only other exceptions are the private, token-based feature and
 * unsubscribe pages, which have no content of their own.
 *
 * This runs last, so it also overrides older "thin page" noindex rules that
 * the theme's templates still add (jobs landing pages, the guides index).
 * ---------------------------------------------------------------------- */

add_filter('wp_robots', function ($robots) {
    if (is_tag()) {
        unset($robots['index']);
        $robots['noindex'] = true;
        $robots['follow'] = true;
        return $robots;
    }
    $pages = (array) get_option('xf_pages', []);
    foreach (['feature', 'unsubscribe'] as $key) {
        if (!empty($pages[$key]) && is_page($pages[$key])) {
            return $robots; // Keeps the private-page noindex set in post-types.php.
        }
    }
    unset($robots['noindex'], $robots['nofollow'], $robots['none']);
    $robots['max-image-preview'] = 'large';
    return $robots;
}, PHP_INT_MAX);

// Tag archives are noindex, so they don't belong in the sitemap.
add_filter('wp_sitemaps_taxonomies', function ($taxonomies) {
    unset($taxonomies['post_tag']);
    return $taxonomies;
});

/* ---- Industry and stage pages list their own startups (they used to repeat the news feed) ---- */

add_filter('template_include', function ($template) {
    if (is_tax('xf_industry') || is_tax('xf_stage')) {
        return XF_DIR . 'templates/startup-terms.php';
    }
    return $template;
}, 99);

// Make the main query fetch startups for these archives, newest first, 24 a page.
add_action('pre_get_posts', function (WP_Query $q) {
    if (!is_admin() && $q->is_main_query() && ($q->is_tax('xf_industry') || $q->is_tax('xf_stage'))) {
        $q->set('post_type', 'xf_startup');
        $q->set('posts_per_page', 24);
    }
});

/** Industry/stage archives with no startups have nothing to index: drop them from the sitemap. */
add_filter('wp_sitemaps_taxonomies_query_args', function ($args, $taxonomy) {
    if (in_array($taxonomy, ['xf_industry', 'xf_stage'], true)) {
        $args['hide_empty'] = true;
    }
    return $args;
}, 10, 2);
