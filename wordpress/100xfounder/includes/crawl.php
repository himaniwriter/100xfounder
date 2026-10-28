<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Crawl budget: spend Google's visits on pages worth indexing.
 *
 * A young domain gets a small crawl allowance, and this one also carries the
 * old site's 4,600 URLs. Every visit spent on a tag page with one post in it,
 * a filtered copy of the jobs board or a machine endpoint is a visit not spent
 * on a new article or job. So:
 *
 *  - thin archives (tags, the stage taxonomy, categories and industries with
 *    fewer than three posts or startups) are noindex,follow and left out of the sitemaps;
 *  - filtered and paginated copies of the jobs board, search results and
 *    per-post feeds are kept out of the crawl in robots.txt (every job is in
 *    the sitemap, so nothing goes undiscovered);
 *  - the head stops advertising oEmbed, REST and XML-RPC endpoints on every
 *    page, which crawlers otherwise follow.
 */

const XF_MIN_CATEGORY_POSTS = 10; // raised from 3 (owner, 2026-10-20): thin archives stay out of the index

/** Is this archive too thin to be worth a place in Google's index? */
function xf_is_thin_archive() {
    // The author page stays indexable: it is where the byline explains itself.
    if (is_tag() || is_tax('xf_stage') || is_date()) {
        return true;
    }
    if (is_category() || is_tax('xf_industry')) {
        $term = get_queried_object();
        return $term && (int) $term->count < XF_MIN_CATEGORY_POSTS;
    }
    return false;
}

add_filter('wp_robots', function ($robots) {
    if (xf_is_thin_archive() || is_search()) {
        unset($robots['index'], $robots['max-image-preview']);
        $robots['noindex'] = true;
        $robots['follow'] = true;
    }
    return $robots;
}, 20);

/* ---- Sitemaps list only what should be indexed ---- */

add_filter('wp_sitemaps_taxonomies', function ($taxonomies) {
    unset($taxonomies['post_tag'], $taxonomies['xf_stage']);
    // No industry has enough startups yet: leave the whole taxonomy out rather than list an empty sitemap.
    $ready = get_terms(['taxonomy' => 'xf_industry', 'hide_empty' => true, 'fields' => 'count']);
    if (!array_filter((array) $ready, function ($n) { return (int) $n >= XF_MIN_CATEGORY_POSTS; })) {
        unset($taxonomies['xf_industry']);
    }
    return $taxonomies;
});

add_filter('wp_sitemaps_taxonomies_query_args', function ($args, $taxonomy) {
    if (in_array($taxonomy, ['category', 'xf_industry'], true)) {
        $exclude = [];
        foreach (get_terms(['taxonomy' => $taxonomy, 'hide_empty' => false]) as $term) {
            if ((int) $term->count < XF_MIN_CATEGORY_POSTS) {
                $exclude[] = (int) $term->term_id;
            }
        }
        if ($exclude) {
            $args['exclude'] = $exclude;
        }
    }
    // Company job pages that are noindexed for having too few open roles stay out of the sitemap too.
    if ($taxonomy === 'xf_company' && function_exists('xf_company_page_indexable')) {
        $exclude = get_transient('xf_company_sitemap_exclude');
        if (!is_array($exclude)) {
            $exclude = [];
            foreach (get_terms(['taxonomy' => 'xf_company', 'hide_empty' => true]) as $term) {
                if (!xf_company_page_indexable($term)) {
                    $exclude[] = (int) $term->term_id;
                }
            }
            set_transient('xf_company_sitemap_exclude', $exclude, 6 * HOUR_IN_SECONDS);
        }
        if ($exclude) {
            $args['exclude'] = $exclude;
        }
    }
    return $args;
}, 10, 2);

add_filter('wp_sitemaps_users_pre_url_list', '__return_empty_array');

// Community entries exist to sit behind the join gate on the events pages, not to rank on their own.
add_filter('wp_sitemaps_post_types', function ($types) {
    unset($types['xf_community']);
    return $types;
});

/* ---- robots.txt: keep crawlers off duplicates and machine URLs ---- */

add_filter('robots_txt', function ($output, $public) {
    if (!$public) {
        return $output;
    }
    $rules = [
        '# Filtered and paginated copies of the jobs board; every job is in the sitemap',
        'Disallow: /jobs/*?',
        '# Site search results',
        'Disallow: /?s=',
        'Disallow: /*?s=',
        '# Per-post, category and tag feeds (the main feed /feed/ stays open)',
        'Disallow: /*/feed/',
        '# Comment reply links and preview URLs',
        'Disallow: /*?replytocom=',
        'Disallow: /*?preview=',
    ];
    // Insert under the existing "User-agent: *" group, before the sitemap lines.
    $pos = strpos($output, "\nSitemap:");
    $block = "\n" . implode("\n", $rules) . "\n";
    return $pos === false ? $output . $block : substr_replace($output, $block, $pos, 0);
}, 5, 2);

/* ---- The head stops advertising endpoints crawlers waste visits on ---- */

remove_action('wp_head', 'rest_output_link_wp_head', 10);
remove_action('wp_head', 'wp_oembed_add_discovery_links');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'wp_shortlink_wp_head', 10);
remove_action('wp_head', 'feed_links_extra', 3);
remove_action('template_redirect', 'rest_output_link_header', 11);
remove_action('template_redirect', 'wp_shortlink_header', 11);

/* ---- Attachment pages: an image's own page is thin, send people to the image ---- */

add_action('template_redirect', function () {
    if (!is_attachment()) {
        return;
    }
    $id = get_queried_object_id();
    $parent = (int) wp_get_post_parent_id($id);
    $target = $parent && get_post_status($parent) === 'publish' ? get_permalink($parent) : wp_get_attachment_url($id);
    if ($target) {
        wp_redirect($target, 301, '100xFounder');
        exit;
    }
}, 2);

/* ---- One address per page: /Best-AI-Tools/ is /best-ai-tools/ ---- */

add_action('init', function () {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET' || is_admin()) {
        return;
    }
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '');
    $path = (string) wp_parse_url($uri, PHP_URL_PATH);
    if (!preg_match('/[A-Z]/', $path) || preg_match('#^/(wp-|feature|unsubscribe|xmlrpc)#i', $path)) {
        return;
    }
    $query = (string) wp_parse_url($uri, PHP_URL_QUERY);
    wp_redirect(home_url(strtolower($path)) . ($query !== '' ? '?' . $query : ''), 301, '100xFounder');
    exit;
}, 0);
