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
    if (is_singular()) {
        $post = get_post();
        $text = $post->post_excerpt ?: (string) get_post_meta($post->ID, '_xf_tagline', true) ?: wp_strip_all_tags($post->post_content);
        return wp_trim_words(wp_strip_all_tags($text), 30, '…');
    }
    if (is_category() || is_tag() || is_tax()) {
        return wp_strip_all_tags(term_description()) ?: single_term_title('', false) . ' news and analysis on 100Xfounder.';
    }
    return get_bloginfo('description');
}

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
    $url = is_singular() ? get_permalink() : home_url(add_query_arg([], $GLOBALS['wp']->request ?? ''));
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
        $output .= "\nSitemap: " . home_url('/wp-sitemap.xml') . "\nSitemap: " . home_url('/news-sitemap.xml') . "\n";
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

add_action('transition_post_status', function ($new, $old, $post) {
    if ($new !== 'publish' || !in_array($post->post_type, ['post', 'page', 'xf_startup', 'xf_spotlight', 'xf_event', 'xf_round'], true)) {
        return;
    }
    if (!xf_get_setting('indexnow_enabled') || wp_get_environment_type() === 'local' || preg_match('/localhost|127\.0\.0\.1/', home_url())) {
        return;
    }
    // Defer so the permalink is final.
    wp_schedule_single_event(time() + 10, 'xf_indexnow_ping', [get_permalink($post)]);
}, 10, 3);

add_action('xf_indexnow_ping', function ($url) {
    wp_remote_post('https://api.indexnow.org/indexnow', [
        'timeout' => 10,
        'blocking' => false,
        'headers' => ['Content-Type' => 'application/json; charset=utf-8'],
        'body' => wp_json_encode([
            'host' => wp_parse_url(home_url(), PHP_URL_HOST),
            'key' => xf_indexnow_key(),
            'keyLocation' => home_url('/' . xf_indexnow_key() . '.txt'),
            'urlList' => [$url],
        ]),
    ]);
});
