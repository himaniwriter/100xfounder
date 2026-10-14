<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Structured data for the pages seo.php doesn't cover: list/collection pages, company pages, apply guides, startups and tools.
 * Only describes what is visibly on the page (Google's structured-data rules).
 * JobPosting stays on single job pages only, as Google requires.
 * ---------------------------------------------------------------------- */

/** CollectionPage whose main entity is an ordered list of the URLs shown. */
function xf_collection($name, $url, array $urls, $description = '') {
    xf_json_ld(array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'CollectionPage',
        'name' => wp_strip_all_tags($name),
        'url' => $url,
        'description' => $description ?: null,
        'isPartOf' => ['@type' => 'WebSite', 'name' => get_bloginfo('name'), 'url' => home_url('/')],
        'mainEntity' => $urls ? [
            '@type' => 'ItemList',
            'numberOfItems' => count($urls),
            'itemListElement' => array_map(function ($u, $i) { return ['@type' => 'ListItem', 'position' => $i + 1, 'url' => $u]; }, array_values($urls), array_keys(array_values($urls))),
        ] : null,
    ]));
}

function xf_page_key() {
    if (!is_page()) {
        return '';
    }
    $id = get_queried_object_id();
    foreach ((array) get_option('xf_pages', []) as $key => $pid) {
        if ((int) $pid === $id) {
            return $key;
        }
    }
    return '';
}

add_action('wp_head', function () {
    if (is_front_page() || is_singular('post') || is_404() || is_search()) {
        return; // Covered in seo.php, or not worth marking up.
    }
    $jobs_url = home_url('/jobs/');

    /* Single job: JobPosting is in jobs.php, breadcrumbs in breadcrumbs.php. */
    if (is_singular('xf_job') || is_singular('xf_event')) {
        return;
    }

    /* Company hiring page: the employer + its open roles. */
    if (is_tax('xf_company')) {
        $t = get_queried_object();
        $website = get_term_meta($t->term_id, 'xf_website', true);
        xf_json_ld(array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $t->name,
            'url' => $website ?: null,
            'sameAs' => array_values(array_filter([get_term_meta($t->term_id, 'xf_careers_url', true)])),
        ]));
        $ids = get_posts(['post_type' => 'xf_job', 'posts_per_page' => 30, 'fields' => 'ids', 'tax_query' => [['taxonomy' => 'xf_company', 'terms' => $t->term_id]]]);
        xf_collection($t->name . ' jobs', get_term_link($t), array_map('get_permalink', $ids));
        return;
    }

    /* Apply guide: an Article with its sources, about the employer. */
    if (is_singular('xf_guide')) {
        $p = get_post();
        $company = function_exists('xf_guide_company') ? xf_guide_company($p->ID) : null;
        xf_json_ld(array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => wp_strip_all_tags(get_the_title($p)),
            'description' => xf_meta_description(),
            'image' => has_post_thumbnail($p) ? [get_the_post_thumbnail_url($p, 'full')] : null,
            'datePublished' => get_the_date('c', $p),
            'dateModified' => get_the_modified_date('c', $p),
            'author' => ['@type' => 'Organization', 'name' => get_bloginfo('name'), 'url' => home_url('/')],
            'publisher' => xf_publisher_schema(),
            'mainEntityOfPage' => get_permalink($p),
            'about' => $company ? ['@type' => 'Organization', 'name' => $company->name] : null,
            'citation' => array_map(function ($s) { return array_filter(['@type' => 'CreativeWork', 'url' => $s['url'], 'name' => $s['publisher'] ?: null]); }, xf_get_sources($p->ID)) ?: null,
        ]));
        return;
    }

    /* Startup profile: the company behind the launch (only when indexable). */
    if (is_singular('xf_startup')) {
        $p = get_post();
        $website = get_post_meta($p->ID, '_xf_website', true);
        // Researched profiles already describe the product as a SoftwareApplication; a second, unlinked entity only confuses it.
        if (!(function_exists('xf_startup_is_rich') && xf_startup_is_rich($p))) xf_json_ld(array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => wp_strip_all_tags(get_the_title($p)),
            'description' => get_post_meta($p->ID, '_xf_tagline', true) ?: null,
            'url' => $website ?: null,
            'sameAs' => array_values(array_filter([get_post_meta($p->ID, '_xf_ph_url', true)])),
        ]));
        return;
    }

    if (is_category()) {
        $cat = get_queried_object();
        global $wp_query;
        xf_collection($cat->name, get_category_link($cat), array_map('get_permalink', array_slice($wp_query->posts, 0, 20)), $cat->description);
        return;
    }

    $key = xf_page_key();
    $here = get_permalink(get_queried_object_id());

    /* Jobs board and its role/city landing pages. */
    if ($key === 'jobs' && function_exists('xf_job_filters_from_request')) {
        $f = xf_job_filters_from_request();
        $ids = (new WP_Query(array_merge(xf_job_query_args($f, 25, 1), ['fields' => 'ids'])))->posts;
        $slug = (string) get_query_var('xf_jobs_slug');
        $url = $slug ? home_url('/jobs/' . $slug . '/') : $jobs_url;
        $label = trim(($f['function'] ? $f['function'] . ' jobs' : 'Jobs') . ($f['city'] && $f['city'] !== 'Remote' ? ' in ' . $f['city'] : ($f['city'] === 'Remote' ? ' (remote)' : '')));
        xf_collection($slug ? $label : 'Jobs in India at startups and top companies', $url, array_map('get_permalink', $ids));
        return;
    }

    /* Tools hub and each tool (WebApplication for a tool is in the theme). */
    if ($key === 'tools' && function_exists('xf_tools')) {
        $tool = xf_current_tool();
        if ($tool) {
        } else {
            xf_collection('Free tools', home_url('/tools/'), array_map(function ($s) { return home_url('/tools/' . $s . '/'); }, array_keys(xf_tools())));
        }
        return;
    }

    if ($key === 'guides') {
        $ids = get_posts(['post_type' => 'xf_guide', 'post_status' => 'publish', 'posts_per_page' => 100, 'fields' => 'ids', 'orderby' => 'title', 'order' => 'ASC']);
        xf_collection('How to apply guides', $here, array_map('get_permalink', $ids));
        return;
    }

    if ($key === 'events') {
        // Each upcoming event is also marked up on its own page; here we list them.
        $events = function_exists('xf_upcoming_events') ? xf_upcoming_events(20) : [];
        xf_collection('Startup events', $here, array_map('get_permalink', $events));
        return;
    }

    /* Topic hubs list their articles (funding also shows rounds, which are not listed here). */
    $hub_key = function_exists('xf_hubs') && $key ? array_search($key, wp_list_pluck(xf_hubs(), 'page'), true) : false;
    if ($hub_key !== false) {
        xf_collection(xf_hubs()[$hub_key]['title'], $here, array_map('get_permalink', xf_hub_posts($hub_key)));
        return;
    }

    if ($key === 'sitemap') {
        xf_collection('Sitemap', $here, []);
        return;
    }

    if (in_array($key, ['news', 'blog', 'launches', 'directory', 'spotlights'], true)) {
        $map = [
            'news' => ['post', []], 'blog' => ['post', []],
            'launches' => ['xf_startup', ['meta_key' => '_xf_source', 'meta_value' => 'producthunt']],
            'directory' => ['xf_startup', []], 'spotlights' => ['xf_spotlight', []],
        ];
        [$type, $extra] = $map[$key];
        $ids = post_type_exists($type) ? get_posts(array_merge(['post_type' => $type, 'post_status' => 'publish', 'posts_per_page' => 20, 'fields' => 'ids'], $extra)) : [];
        // Thin startup listings are noindexed, so don't advertise them in lists.
        xf_collection(get_the_title(), $here, in_array($type, ['xf_round', 'xf_startup'], true) ? [] : array_map('get_permalink', $ids));
        return;
    }

    if (is_page()) {
        $title = get_the_title();
        $type = $key === 'about' ? 'AboutPage' : ($key === 'contact' ? 'ContactPage' : 'WebPage');
        xf_json_ld(['@context' => 'https://schema.org', '@type' => $type, 'name' => wp_strip_all_tags($title), 'url' => $here, 'publisher' => xf_publisher_schema()]);
    }
}, 5);
