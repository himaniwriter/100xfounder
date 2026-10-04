<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Search foundations: meta and social tags, structured data, Google News
 * sitemap, IndexNow pings and verification snippets. Meta tags step aside
 * when Yoast or Rank Math is active; schema for our own types always runs.
 * ---------------------------------------------------------------------- */

function xf_seo_plugin_active() {
    return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('SEOPRESS_VERSION');
}

function xf_meta_description() {
    if (is_front_page()) {
        return get_bloginfo('description') ?: 'Startup news, daily launches, funding tracker, founder stories and jobs from India and the US.';
    }
    if (function_exists('xf_current_tool') && ($tool = xf_current_tool())) {
        return $tool['desc'];
    }
    if (is_tax('xf_company')) {
        $name = single_term_title('', false);
        return wp_strip_all_tags(term_description()) ?: sprintf('Open roles at %1$s in India, synced daily from %1$s\'s official careers page. See the location, team and salary where published, then apply on the company site.', $name);
    }
    if (is_page() && ($text = xf_page_description(xf_page_key()))) {
        return $text;
    }
    if (is_singular()) {
        $post = get_post();
        $text = $post->post_excerpt ?: (string) get_post_meta($post->ID, '_xf_tagline', true) ?: strip_shortcodes($post->post_content);
        $text = trim(wp_strip_all_tags($text));
        return $text !== '' ? wp_trim_words($text, 30, '…') : get_bloginfo('description');
    }
    if (is_category() || is_tag() || is_tax()) {
        return wp_strip_all_tags(term_description()) ?: single_term_title('', false) . ' news and analysis on 100Xfounder.';
    }
    return get_bloginfo('description');
}

/** Descriptions for the plugin's own pages, whose content is only a shortcode. */
function xf_page_description($key) {
    if ($key === 'jobs' && function_exists('xf_job_filters_from_request')) {
        $f = xf_job_filters_from_request();
        $n = (int) (new WP_Query(array_merge(xf_job_query_args($f, 1), ['fields' => 'ids'])))->found_posts;
        $what = ($f['function'] ? $f['function'] . ' ' : '') . 'jobs';
        $where = $f['city'] === 'Remote' || $f['workplace'] === 'Remote' ? ' (remote, open to India)' : ($f['city'] ? ' in ' . $f['city'] : ' in India');
        return sprintf('%s open %s%s at startups and top companies, taken only from official careers pages and updated daily. Filter by role and city, then apply on the company site.', number_format_i18n($n), $what, $where);
    }
    $map = [
        'news' => 'Startup and funding news from India and the US, written from named sources and reviewed by an editor before it goes live.',
        'blog' => 'Long reads, founder lessons and analysis from the 100xFounder editors.',
        'directory' => 'A directory of startups from India and around the world, with what they do, their stage and links to their launches.',
        'launches' => 'Today\'s Product Hunt launches, with founders, taglines and votes, refreshed every day.',
        'spotlights' => 'Founder spotlights: how startups were built, in the founders\' own words.',
        'events' => 'Upcoming startup, AI and tech events in Bengaluru, Delhi NCR, Mumbai and online, from official event calendars.',
        'funding' => 'A tracker of startup funding rounds, with the amount, stage, investors and a source for every round.',
        'submit' => 'Submit your startup, launch, news or press release to 100xFounder. An editor reads every submission.',
        'tools' => 'Free calculators for Indian salaried professionals: in-hand salary from CTC, salary hike and notice period buyout.',
        'guides' => 'How to apply at top companies hiring in India: the hiring process, interview rounds and tips, with sources.',
    ];
    return $map[$key] ?? '';
}

/**
 * The address of the page being viewed, for virtual pages that core gets wrong:
 * job landing pages and tools (core points them at /jobs/ and /tools/) and term archives (core prints none).
 */
function xf_current_canonical() {
    if (function_exists('xf_current_tool') && ($tool = xf_current_tool())) {
        return home_url('/tools/' . $tool['slug'] . '/');
    }
    if (is_page() && ($slug = (string) get_query_var('xf_jobs_slug'))) {
        return home_url('/jobs/' . $slug . '/');
    }
    if (is_tax() || is_category() || is_tag()) {
        $paged = max(1, (int) get_query_var('paged'));
        return $paged > 1 ? get_pagenum_link($paged) : get_term_link(get_queried_object());
    }
    return '';
}

add_filter('get_canonical_url', function ($url) {
    $here = xf_current_canonical();
    return $here && !is_wp_error($here) ? $here : $url;
});

add_action('wp_head', function () {
    if (xf_seo_plugin_active() || !(is_tax() || is_category() || is_tag())) {
        return;
    }
    $here = xf_current_canonical();
    if ($here && !is_wp_error($here)) {
        printf('<link rel="canonical" href="%s">' . "\n", esc_url($here));
    }
}, 3);

function xf_social_image() {
    if (is_singular() && has_post_thumbnail()) {
        return get_the_post_thumbnail_url(null, 'large');
    }
    if (is_singular('xf_startup') && ($thumb = get_post_meta(get_the_ID(), '_xf_thumbnail', true))) {
        return $thumb;
    }
    return (string) xf_get_setting('default_social_image');
}

add_action('wp_head', function () {
    $s = xf_get_settings();
    if (!empty($s['gsc_verification'])) {
        printf('<meta name="google-site-verification" content="%s">' . "\n", esc_attr($s['gsc_verification']));
    }
    if (!empty($s['bing_verification'])) {
        printf('<meta name="msvalidate.01" content="%s">' . "\n", esc_attr($s['bing_verification']));
    }
    if (xf_seo_plugin_active()) {
        return;
    }
    $title = wp_get_document_title();
    $desc = xf_meta_description();
    $url = xf_current_canonical();
    $url = $url && !is_wp_error($url) ? $url : (is_singular() ? get_permalink() : home_url(add_query_arg([], $GLOBALS['wp']->request ?? '')));
    $image = xf_social_image();
    printf('<meta name="description" content="%s">' . "\n", esc_attr($desc));
    printf('<meta property="og:site_name" content="%s">' . "\n", esc_attr(get_bloginfo('name')));
    printf('<meta property="og:type" content="%s">' . "\n", is_singular('post') ? 'article' : 'website');
    printf('<meta property="og:title" content="%s">' . "\n", esc_attr($title));
    printf('<meta property="og:description" content="%s">' . "\n", esc_attr($desc));
    printf('<meta property="og:url" content="%s">' . "\n", esc_url($url));
    if ($image) {
        printf('<meta property="og:image" content="%s">' . "\n", esc_url($image));
    }
    printf('<meta name="twitter:card" content="%s">' . "\n", $image ? 'summary_large_image' : 'summary');
    if (is_singular('post')) {
        printf('<meta property="article:published_time" content="%s">' . "\n", esc_attr(get_the_date('c')));
        printf('<meta property="article:modified_time" content="%s">' . "\n", esc_attr(get_the_modified_date('c')));
    }
}, 2);

/** GA4, only when a measurement ID is set. */
add_action('wp_head', function () {
    $id = preg_replace('/[^A-Z0-9-]/', '', strtoupper((string) xf_get_setting('ga4_id')));
    if (!$id || is_user_logged_in()) {
        return;
    }
    printf("<script async src=\"https://www.googletagmanager.com/gtag/js?id=%1\$s\"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','%1\$s');</script>\n", esc_attr($id));
}, 3);

function xf_json_ld(array $data) {
    echo '<script type="application/ld+json">' . wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . "</script>\n";
}

function xf_publisher_schema() {
    $logo = (string) xf_get_setting('logo_url');
    return array_filter([
        '@type' => 'Organization',
        'name' => get_bloginfo('name'),
        'url' => home_url('/'),
        'logo' => $logo ? ['@type' => 'ImageObject', 'url' => $logo] : null,
        'sameAs' => array_values(array_filter([xf_get_setting('instagram_url'), xf_get_setting('linkedin_url'), xf_get_setting('x_url')])),
    ]);
}

add_action('wp_head', function () {
    if (is_front_page()) {
        xf_json_ld(['@context' => 'https://schema.org'] + xf_publisher_schema());
        xf_json_ld([
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => get_bloginfo('name'),
            'url' => home_url('/'),
            'potentialAction' => ['@type' => 'SearchAction', 'target' => home_url('/?s={search_term_string}'), 'query-input' => 'required name=search_term_string'],
        ]);
        return;
    }
    if (is_singular('post')) {
        $post = get_post();
        $cat = get_the_category($post->ID)[0] ?? null;
        $citations = array_map(function ($s) {
            return array_filter(['@type' => 'CreativeWork', 'url' => $s['url'], 'publisher' => $s['publisher'] ? ['@type' => 'Organization', 'name' => $s['publisher']] : null, 'datePublished' => $s['date'] ?: null]);
        }, xf_get_sources($post->ID));
        xf_json_ld(array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            'headline' => wp_strip_all_tags(get_the_title($post)),
            'description' => xf_meta_description(),
            'image' => has_post_thumbnail($post) ? [get_the_post_thumbnail_url($post, 'full')] : null,
            'datePublished' => get_the_date('c', $post),
            'dateModified' => get_the_modified_date('c', $post),
            'author' => ['@type' => 'Person', 'name' => get_the_author_meta('display_name', (int) $post->post_author), 'url' => get_author_posts_url((int) $post->post_author)],
            'publisher' => xf_publisher_schema(),
            'mainEntityOfPage' => get_permalink($post),
            'articleSection' => $cat ? $cat->name : null,
            'citation' => $citations ?: null,
        ]));
        $crumbs = [['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url('/')]];
        if ($cat) {
            $crumbs[] = ['@type' => 'ListItem', 'position' => 2, 'name' => $cat->name, 'item' => get_category_link($cat)];
        }
        $crumbs[] = ['@type' => 'ListItem', 'position' => count($crumbs) + 1, 'name' => wp_strip_all_tags(get_the_title($post))];
        xf_json_ld(['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $crumbs]);
        return;
    }
    if (is_singular('xf_event')) {
        $id = get_the_ID();
        $city = get_post_meta($id, '_xf_city', true);
        $online = $city === 'Online';
        xf_json_ld(array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Event',
            'name' => wp_strip_all_tags(get_the_title()),
            'startDate' => ($s = get_post_meta($id, '_xf_start', true)) ? gmdate('c', strtotime($s . ' UTC')) : null,
            'endDate' => ($e = get_post_meta($id, '_xf_end', true)) ? gmdate('c', strtotime($e . ' UTC')) : null,
            'eventAttendanceMode' => $online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
            'location' => $online
                ? ['@type' => 'VirtualLocation', 'url' => get_post_meta($id, '_xf_url', true) ?: get_permalink()]
                : ['@type' => 'Place', 'name' => get_post_meta($id, '_xf_venue', true) ?: $city, 'address' => $city],
            'url' => get_post_meta($id, '_xf_url', true) ?: get_permalink(),
            'organizer' => ($o = get_post_meta($id, '_xf_organizer', true)) ? ['@type' => 'Organization', 'name' => $o] : null,
            'description' => xf_meta_description(),
        ]));
    }
}, 4);

/* ---- Google News sitemap: articles from the last 48 hours ---- */

add_action('init', function () {
    $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    if ($path !== 'news-sitemap.xml') {
        return;
    }
    $posts = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 1000, 'date_query' => [['after' => '48 hours ago']]]);
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";
    foreach ($posts as $p) {
        printf(
            "<url><loc>%s</loc><news:news><news:publication><news:name>%s</news:name><news:language>en</news:language></news:publication><news:publication_date>%s</news:publication_date><news:title>%s</news:title></news:news></url>\n",
            esc_url(get_permalink($p)), esc_html(get_bloginfo('name')), esc_html(get_the_date('c', $p)), esc_html(wp_strip_all_tags(get_the_title($p)))
        );
    }
    echo '</urlset>';
    exit;
}, 1);

add_filter('robots_txt', function ($output, $public) {
    if ($public) {
        // WordPress core already lists wp-sitemap.xml; add only the news sitemap.
        $output .= (strpos($output, 'wp-sitemap.xml') === false ? "\nSitemap: " . home_url('/wp-sitemap.xml') : '') . "\nSitemap: " . home_url('/news-sitemap.xml') . "\n";
    }
    return $output;
}, 10, 2);

/* ---- IndexNow (Bing, Yandex, Seznam…): ping on publish and update ---- */

function xf_indexnow_key() {
    $key = get_option('xf_indexnow_key');
    if (!$key) {
        $key = bin2hex(random_bytes(16));
        update_option('xf_indexnow_key', $key, false);
    }
    return $key;
}

add_action('init', function () {
    $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    if ($path !== '' && $path === xf_indexnow_key() . '.txt') {
        header('Content-Type: text/plain; charset=utf-8');
        echo esc_html(xf_indexnow_key());
        exit;
    }
}, 1);

function xf_indexnow_allowed() {
    return xf_get_setting('indexnow_enabled') && wp_get_environment_type() !== 'local' && !preg_match('/localhost|127\.0\.0\.1/', home_url());
}

/** Sends URLs to IndexNow in one request (the API takes up to 10,000). Returns the HTTP status. */
function xf_indexnow_submit(array $urls) {
    $urls = array_values(array_unique(array_filter($urls)));
    if (!$urls || !xf_indexnow_allowed()) {
        return 0;
    }
    $code = 0;
    foreach (array_chunk($urls, 10000) as $chunk) {
        $r = wp_remote_post('https://api.indexnow.org/indexnow', [
            'timeout' => 20,
            'headers' => ['Content-Type' => 'application/json; charset=utf-8'],
            'body' => wp_json_encode([
                'host' => wp_parse_url(home_url(), PHP_URL_HOST),
                'key' => xf_indexnow_key(),
                'keyLocation' => home_url('/' . xf_indexnow_key() . '.txt'),
                'urlList' => $chunk,
            ]),
        ]);
        $code = is_wp_error($r) ? 0 : (int) wp_remote_retrieve_response_code($r);
    }
    update_option('xf_indexnow_last', ['at' => time(), 'urls' => count($urls), 'status' => $code], false);
    return $code;
}

/** Published and updated pages are collected and sent in one batch a minute later (a job sync can publish hundreds). */
add_action('transition_post_status', function ($new, $old, $post) {
    if (($new !== 'publish' && $old !== 'publish') || !in_array($post->post_type, ['post', 'page', 'xf_startup', 'xf_spotlight', 'xf_event', 'xf_round', 'xf_job', 'xf_guide'], true) || !xf_indexnow_allowed()) {
        return;
    }
    $pending = (array) get_option('xf_indexnow_pending', []);
    $pending[] = get_permalink($post);
    update_option('xf_indexnow_pending', array_slice(array_unique($pending), -10000), false);
    if (!wp_next_scheduled('xf_indexnow_flush')) {
        wp_schedule_single_event(time() + 60, 'xf_indexnow_flush');
    }
}, 10, 3);

add_action('xf_indexnow_flush', function () {
    $pending = (array) get_option('xf_indexnow_pending', []);
    delete_option('xf_indexnow_pending');
    xf_indexnow_submit($pending);
});

/** Every public URL we want indexed: sitemap entries plus the virtual tool and job landing pages. */
function xf_all_public_urls() {
    $urls = [home_url('/')];
    $types = ['post', 'page', 'xf_job', 'xf_guide', 'xf_event', 'xf_round', 'xf_spotlight'];
    foreach ($types as $t) {
        if (!post_type_exists($t)) continue;
        foreach (get_posts(['post_type' => $t, 'post_status' => 'publish', 'posts_per_page' => 5000, 'fields' => 'ids', 'no_found_rows' => true]) as $id) {
            if (!xf_is_noindexed($id)) $urls[] = get_permalink($id);
        }
    }
    foreach (xf_landing_urls() as $u) $urls[] = $u;
    return array_values(array_unique($urls));
}

/** Respect the theme/plugin noindex rules for thin startup listings etc. */
function xf_is_noindexed($post_id) {
    return (bool) apply_filters('xf_is_noindexed', false, $post_id);
}

/** Tool pages, company pages and job landing pages with enough roles to be indexable. */
function xf_landing_urls() {
    $urls = [];
    if (function_exists('xf_tools')) {
        $urls[] = home_url('/tools/');
        foreach (array_keys(xf_tools()) as $slug) $urls[] = home_url('/tools/' . $slug . '/');
    }
    if (post_type_exists('xf_job') && function_exists('xf_job_query_args')) {
        $base = ['q' => '', 'where' => '', 'workplace' => '', 'function' => '', 'city' => ''];
        $combos = [];
        foreach (XF_JOB_FUNCTIONS as $fn) {
            $combos[] = ['function' => $fn, 'city' => ''];
            foreach (XF_JOB_CITIES as $c) $combos[] = ['function' => $fn, 'city' => $c];
        }
        foreach (XF_JOB_CITIES as $c) $combos[] = ['function' => '', 'city' => $c];
        foreach ($combos as $c) {
            $q = new WP_Query(array_merge(xf_job_query_args(array_merge($base, $c), 1, 1), ['fields' => 'ids']));
            if ($q->found_posts < 5) continue; // Same threshold as the page's noindex rule.
            $slug = $c['function'] && $c['city'] ? sanitize_title($c['function']) . '-jobs-in-' . sanitize_title($c['city'])
                : ($c['function'] ? sanitize_title($c['function']) . '-jobs' : 'jobs-in-' . sanitize_title($c['city']));
            $urls[] = home_url('/jobs/' . $slug . '/');
        }
        foreach (get_terms(['taxonomy' => 'xf_company', 'hide_empty' => true]) ?: [] as $t) {
            if (!is_wp_error($t)) $urls[] = get_term_link($t);
        }
    }
    return array_values(array_filter(array_unique($urls), 'is_string'));
}

/* ---- Sitemaps: drop the users list (it exposes login names), add tool and job landing pages ---- */

add_filter('wp_sitemaps_add_provider', function ($provider, $name) {
    return $name === 'users' ? false : $provider;
}, 10, 2);

add_action('init', function () {
    if (!function_exists('wp_register_sitemap_provider') || !class_exists('WP_Sitemaps_Provider')) {
        return;
    }
    if (!class_exists('XF_Landing_Sitemap')) {
        class XF_Landing_Sitemap extends WP_Sitemaps_Provider {
            public function __construct() {
                $this->name = 'landing';
                $this->object_type = 'landing';
            }
            public function get_url_list($page_num, $object_subtype = '') {
                $urls = get_transient('xf_landing_urls');
                if (!is_array($urls)) {
                    $urls = xf_landing_urls();
                    set_transient('xf_landing_urls', $urls, 6 * HOUR_IN_SECONDS);
                }
                return array_map(function ($u) { return ['loc' => $u]; }, array_slice($urls, ($page_num - 1) * 2000, 2000));
            }
            public function get_max_num_pages($object_subtype = '') {
                return 1;
            }
        }
    }
    wp_register_sitemap_provider('landing', new XF_Landing_Sitemap());
}, 20);
