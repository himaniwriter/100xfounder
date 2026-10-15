<?php
/**
 * Headless feed for the Astro front end (astro/ in the repo). WordPress stays the CMS: these two
 * read-only endpoints hand the static build the data and the page chrome WordPress would render.
 *
 *   GET /wp-json/xf/v1/headless/home          what front-page.php renders, section by section
 *   GET /wp-json/xf/v1/headless/chrome?path=/ wp_head (SEO, schema, Consent Mode, GA4, AdSense),
 *                                             the header and the footer incl. wp_footer scripts
 *
 * Public (anonymous visitors see the same on the page itself), cached 5 minutes in a transient.
 * Text fields are already HTML-escaped exactly as the theme escapes them; URL fields are raw.
 */
if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/headless/home', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            return xf_headless_cached('home', '/', 'xf_headless_home');
        },
    ]);
    register_rest_route('xf/v1', '/headless/chrome', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'args' => ['path' => ['type' => 'string', 'default' => '/']],
        'callback' => function (WP_REST_Request $r) {
            $path = '/' . ltrim((string) wp_parse_url((string) $r['path'], PHP_URL_PATH), '/');
            return xf_headless_cached('chrome', $path, 'xf_headless_chrome');
        },
    ]);
});

function xf_headless_cached($what, $path, $build) {
    $key = 'xf_hl_' . $what . '_' . md5($path);
    $data = get_transient($key);
    if (!is_array($data)) {
        // Always build as a logged-out visitor, so nothing private can end up in the cache.
        $uid = get_current_user_id();
        wp_set_current_user(0);
        xf_headless_route($path);
        $data = call_user_func($build, $path);
        wp_set_current_user($uid);
        set_transient($key, $data, 5 * MINUTE_IN_SECONDS);
    }
    $res = new WP_REST_Response($data);
    $res->header('Cache-Control', 'public, max-age=300');
    return $res;
}

/** Point WordPress's main query at $path, as if that URL had been requested. */
function xf_headless_route($path) {
    global $wp;
    $_SERVER['REQUEST_URI'] = $path;
    $_SERVER['QUERY_STRING'] = '';
    unset($_SERVER['PATH_INFO'], $_SERVER['ORIG_PATH_INFO']);
    $_GET = [];
    $wp->parse_request();
    // WP_Query never flags the main query as home/front page during a REST request, so query on a
    // fresh object first and only then make it the main query.
    $q = new WP_Query();
    $q->query($wp->query_vars);
    $GLOBALS['wp_the_query'] = $GLOBALS['wp_query'] = $q;
    $wp->handle_404();
    $wp->register_globals();
    do_action_ref_array('wp', [&$wp]);
}

/**
 * WordPress's own head, header and footer for the routed URL: the page is rendered through its real
 * template and WordPress's template output filter (which hoists on-demand block styles), exactly as
 * a visitor gets it, then split where Astro's <main> goes.
 */
function xf_headless_chrome($path) {
    $tags = ['is_404' => 'get_404_template', 'is_search' => 'get_search_template', 'is_front_page' => 'get_front_page_template',
        'is_home' => 'get_home_template', 'is_privacy_policy' => 'get_privacy_policy_template', 'is_post_type_archive' => 'get_post_type_archive_template',
        'is_tax' => 'get_taxonomy_template', 'is_single' => 'get_single_template', 'is_page' => 'get_page_template', 'is_singular' => 'get_singular_template',
        'is_category' => 'get_category_template', 'is_tag' => 'get_tag_template', 'is_author' => 'get_author_template', 'is_archive' => 'get_archive_template'];
    $template = '';
    foreach ($tags as $tag => $getter) {
        if (call_user_func($tag) && ($template = call_user_func($getter))) {
            break;
        }
    }
    $template = apply_filters('template_include', $template ?: get_index_template());
    // Render as a front-end request: WordPress loads every block stylesheet during REST requests.
    add_filter('wp_is_rest_endpoint', '__return_false');
    ob_start();
    do_action('wp_template_enhancement_output_buffer_started'); // what wp_start_template_enhancement_output_buffer() fires
    include $template;
    $page = (string) ob_get_clean();
    $page = (string) apply_filters('wp_template_enhancement_output_buffer', $page, $page);
    remove_filter('wp_is_rest_endpoint', '__return_false');
    $main_open = stripos($page, '<main id="main">');
    $main_close = strripos($page, '</main>');
    $top = substr($page, 0, $main_open === false ? 0 : $main_open);
    $bottom = $main_close === false ? '' : substr($page, $main_close + 7);
    $tail = '';
    if (function_exists('xf_breadcrumbs_html')) {
        $tail = (string) xf_breadcrumbs_html(); // the footer prints these just before </main>
    }

    $head = preg_match('~<head>(.*?)</head>~is', $top, $m) ? $m[1] : '';
    $body = preg_match('~<body\b[^>]*>~i', $top, $m, PREG_OFFSET_CAPTURE) ? $m[0] : ['', 0];
    $end = strripos($bottom, '</body>');
    return [
        'path' => $path,
        'lang' => get_bloginfo('language'),
        'body_class' => implode(' ', get_body_class()),
        'head' => $head,
        'header' => substr($top, $body[1] + strlen($body[0])),
        'main_tail' => $tail,
        'footer' => $end === false ? $bottom : substr($bottom, 0, $end),
        'built' => gmdate('c'),
    ];
}

/** One post as the home page's cards and rows use it. */
function xf_headless_post($p, $img_ratio = '', $img_size = 'xft-card', $eager = false) {
    return [
        'url' => esc_url_raw(get_permalink($p)),
        'title' => esc_html(get_the_title($p)),
        'age' => esc_html(xft_age($p)),
        'cat' => esc_html(xft_cat_name($p)),
        'meta' => esc_html(xft_author_name($p) . ' · ' . str_replace(' read', '', xft_read_time($p))),
        'read' => esc_html(str_replace(' read', '', xft_read_time($p))),
        'img' => $img_ratio ? xft_image($p, $img_ratio, $img_size, $eager) : '',
    ];
}

/** Everything front-page.php renders, in its order. Mirrors that template; keep the two in step. */
function xf_headless_home() {
    if (!function_exists('xft_lead_post')) {
        return ['error' => 'theme_missing'];
    }
    $lead = xft_lead_post();
    $exclude = $lead ? [$lead->ID] : [];
    $latest = xft_query_posts(['posts_per_page' => 12]);
    $secondary = xft_query_posts(['posts_per_page' => 4, 'post__not_in' => $exclude, 'meta_key' => '_thumbnail_id']);
    $popular = xft_popular(6);
    $news_url = xft_page_url('news', 'news');
    $launch_url = xft_page_url('launches', 'launches');
    $events_url = xft_page_url('events', 'events');
    $funding_url = xft_page_url('funding', 'funding-tracker');
    $blog_url = xft_page_url('blog', 'blog');
    $submit_url = xft_page_url('submit', 'submit');
    $jobs_url = home_url('/jobs/');
    $out = [];

    // "Today in" strip.
    $launch_count = 0;
    if (post_type_exists('xf_startup')) {
        $last = get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 1, 'meta_key' => '_xf_launch_day', 'orderby' => 'meta_value', 'order' => 'DESC', 'fields' => 'ids']);
        if ($last) {
            $day = get_post_meta($last[0], '_xf_launch_day', true);
            $launch_count = count(get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 50, 'fields' => 'ids', 'meta_key' => '_xf_launch_day', 'meta_value' => $day]));
        }
    }
    $raised = function_exists('xf_rounds_total_usd') ? xf_rounds_total_usd(7) : 0;
    $events = function_exists('xf_upcoming_events') ? xf_upcoming_events(4) : [];
    $event_total = function_exists('xf_upcoming_events') ? count(xf_upcoming_events(200)) : count($events);
    $open_roles = post_type_exists('xf_job') ? (int) wp_count_posts('xf_job')->publish : 0;
    $pillars = [
        ['Launched.', $launch_count ? sprintf(_n('%d launch in today’s list', '%d launches in today’s list', $launch_count), $launch_count) : 'The best Product Hunt launches, daily', $launch_url],
        ['Raised.', $raised ? xf_format_usd_short($raised) . ' on the funding tracker this week' : 'Funding rounds, tracked daily', $funding_url],
        ['Hiring.', $open_roles ? sprintf('%s open roles from official careers pages', number_format_i18n($open_roles)) : 'Fresh roles at funded startups', xft_page_exists('jobs') ? $jobs_url : add_query_arg('type', 'job', $submit_url)],
        ['Happening.', $event_total ? sprintf(_n('%d event on the calendar', '%d events on the calendar', $event_total), $event_total) : 'Startup events worth your time', $events_url],
        ['Worth reading.', 'Long reads and founder stories', $blog_url],
    ];
    $out['pillars'] = [];
    foreach ($pillars as $i => [$word, $meta, $href]) {
        $out['pillars'][] = ['word' => esc_html($word), 'meta' => esc_html($meta), 'url' => esc_url_raw($href), 'delay' => esc_attr(0.04 + $i * 0.06)];
    }
    $out['event_strip'] = xft_photo_strip(xft_event_strip_items(), 'Upcoming startup events', 'events');

    // The three columns: news when there is any, else jobs (same markup, different content).
    if ($lead) {
        $out['top'] = [
            'latest' => ['label' => 'All news', 'url' => esc_url_raw($news_url), 'items' => array_map(function ($p) {
                $d = xf_headless_post($p);
                return ['url' => $d['url'], 'age' => $d['age'], 'tag' => $d['cat'], 'title' => $d['title']];
            }, $latest)],
            'lead' => [
                'url' => esc_url_raw(get_permalink($lead)),
                'img' => xft_image($lead, '16x10', 'xft-lead', true),
                'tag' => esc_html(xft_cat_name($lead)) . ' · Lead story',
                'k' => esc_html(xft_read_time($lead)),
                'title' => esc_html(get_the_title($lead)),
                'dek' => esc_html(wp_trim_words(get_the_excerpt($lead), 30)),
                'by' => esc_html(xft_author_name($lead) . ' · ' . get_the_date('j M Y', $lead)),
            ],
            'cards' => array_map(function ($p) {
                $d = xf_headless_post($p, '16x10');
                return ['url' => $d['url'], 'img' => $d['img'], 'tag' => $d['cat'], 'title' => $d['title'], 'meta' => $d['meta']];
            }, $secondary),
            'side' => ['h2' => 'Most read', 'k' => 'This week', 'items' => array_map(function ($p) {
                return ['url' => esc_url_raw(get_permalink($p)), 'title' => esc_html(get_the_title($p)), 'sub' => esc_html(xft_cat_name($p))];
            }, (array) $popular)],
        ];
    } else {
        $home_jobs = post_type_exists('xf_job') ? get_posts(['post_type' => 'xf_job', 'posts_per_page' => 8]) : [];
        $home_tools = function_exists('xf_tools') ? array_slice(xf_tools(), 0, 2, true) : [];
        $top_cos = taxonomy_exists('xf_company') ? get_terms(['taxonomy' => 'xf_company', 'orderby' => 'count', 'order' => 'DESC', 'number' => 5, 'hide_empty' => true]) : [];
        $cards = [];
        foreach ($home_tools as $slug => $t) {
            $cards[] = ['url' => esc_url_raw(home_url('/tools/' . $slug . '/')), 'img' => function_exists('xf_brand_photo_html') ? xf_brand_photo_html('tools') : '',
                'tag' => 'Free tool', 'title' => esc_html($t['title']), 'meta' => esc_html($t['group'] . ' · No sign-up')];
        }
        $out['top'] = [
            'latest' => ['label' => 'All jobs', 'url' => esc_url_raw($jobs_url), 'items' => array_map(function ($j) {
                $co = get_post_meta($j->ID, '_xf_company_name', true);
                return ['url' => esc_url_raw(get_permalink($j)), 'age' => esc_html(xft_age($j)), 'tag' => esc_html(get_post_meta($j->ID, '_xf_function', true) ?: 'Hiring'),
                    'title' => esc_html(get_the_title($j) . ($co ? ' at ' . $co : ''))];
            }, $home_jobs)],
            'lead' => [
                'url' => esc_url_raw($jobs_url),
                'img' => function_exists('xf_brand_photo_html') ? xf_brand_photo_html('jobs', '16x10', true) : '',
                'tag' => 'Jobs · Lead',
                'k' => 'Updated daily',
                'title' => esc_html(sprintf('%s open roles at startups and top companies, straight from their careers pages', number_format_i18n($open_roles))),
                'dek' => esc_html('Every role comes from a company’s own careers page or applicant-tracking feed, never a reposting site. Filter by role and city, see the salary where it’s published, and apply on the company site.'),
                'by' => esc_html('the 100xFounder jobs desk · ' . wp_date('j M Y')),
            ],
            'cards' => $cards,
            'side' => ['h2' => 'Hiring most', 'k' => 'Open roles', 'items' => array_map(function ($c) {
                return ['url' => esc_url_raw(get_term_link($c)), 'title' => esc_html($c->name), 'sub' => esc_html(sprintf(_n('%s open role', '%s open roles', $c->count), number_format_i18n($c->count)))];
            }, is_array($top_cos) ? $top_cos : [])],
        ];
    }
    $out['newsletter'] = xft_newsletter();
    $out['ad'] = xft_ad();

    $rounds = function_exists('xf_recent_rounds') ? xf_recent_rounds(6) : [];
    $out['funding'] = null;
    if ($rounds) {
        ob_start();
        get_template_part('parts/funding-rows', null, ['rounds' => $rounds]);
        $out['funding'] = ['url' => esc_url_raw($funding_url), 'rows' => (string) ob_get_clean()];
    }
    $out['leaderboard'] = function_exists('xf_meter_leaderboard_html') ? xf_meter_leaderboard_html() : '';

    $top_launches = post_type_exists('xf_startup') ? get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 5, 'meta_key' => '_xf_launch_day', 'orderby' => ['meta_value' => 'DESC', 'date' => 'DESC']]) : [];
    $out['launches'] = ['url' => esc_url_raw($launch_url), 'items' => []];
    foreach ($top_launches as $i => $l) {
        $terms = wp_get_post_terms($l->ID, 'xf_industry', ['fields' => 'names']);
        $out['launches']['items'][] = [
            'url' => esc_url_raw(get_permalink($l)),
            'n' => esc_html(str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT)),
            'title' => esc_html(get_the_title($l)),
            'tagline' => esc_html(wp_trim_words((string) get_post_meta($l->ID, '_xf_tagline', true), 14)),
            'industry' => $terms && !is_wp_error($terms) ? esc_html($terms[0]) : '',
            'votes' => (int) get_post_meta($l->ID, '_xf_votes', true),
        ];
    }
    $out['instagram'] = null;
    if (function_exists('xf_table') && function_exists('xf_slide_url')) {
        global $wpdb;
        $ig = $wpdb->get_results('SELECT id, title FROM ' . xf_table('ig_queue') . " WHERE status = 'posted' ORDER BY posted_at DESC LIMIT 4");
        if ($ig) {
            $out['instagram'] = ['url' => esc_url_raw(xf_get_setting('instagram_url')), 'handle' => esc_html(xf_get_setting('instagram_handle')), 'items' => array_map(function ($g) {
                return ['img' => esc_url_raw(xf_slide_url($g->id, 0)), 'alt' => (string) $g->title, 'label' => esc_html(wp_trim_words($g->title, 3, ''))];
            }, $ig)];
        }
    }

    // One block per category with stories, in the site's order.
    $blocks = [];
    $candidates = function_exists('xf_news_categories') ? array_keys(xf_news_categories())
        : ['ai-deeptech', 'fintech', 'consumer-d2c', 'ecommerce', 'saas', 'funding', 'startup-news', 'ev-mobility', 'healthtech'];
    $used = $exclude;
    foreach ($candidates as $slug) {
        if (count($blocks) >= 12) break;
        $term = get_term_by('slug', $slug, 'category');
        if (!$term || !$term->count) continue;
        $posts = xft_query_posts(['posts_per_page' => 5, 'cat' => $term->term_id, 'post__not_in' => $used]);
        if (count($posts) >= 1) {
            $first = array_shift($posts);
            $blocks[] = [
                'name' => esc_html($term->name),
                'url' => esc_url_raw(get_category_link($term)),
                'first' => ['url' => esc_url_raw(get_permalink($first)), 'img' => xft_image($first, '16x9'), 'title' => esc_html(get_the_title($first)), 'age' => esc_html(xft_age($first))],
                'rest' => array_map(function ($p) {
                    return ['url' => esc_url_raw(get_permalink($p)), 'title' => esc_html(get_the_title($p)), 'age' => esc_html(xft_age($p))];
                }, $posts),
            ];
            $used = array_merge($used, [$first->ID], wp_list_pluck($posts, 'ID'));
        }
    }
    $out['news_url'] = esc_url_raw($news_url);
    $out['story_strip'] = $blocks ? xft_photo_strip(xft_story_strip_items(), 'Recent stories in pictures', 'stories') : '';
    $out['blocks'] = $blocks;

    $hiring = post_type_exists('xf_job') ? get_posts(['post_type' => 'xf_job', 'posts_per_page' => 5, 'meta_key' => '_xf_salary_min', 'meta_compare' => '>', 'meta_value' => 0, 'meta_type' => 'NUMERIC']) : [];
    if (count($hiring) < 5 && post_type_exists('xf_job')) {
        $hiring = array_merge($hiring, get_posts(['post_type' => 'xf_job', 'posts_per_page' => 5 - count($hiring), 'offset' => 8, 'post__not_in' => wp_list_pluck($hiring, 'ID')]));
    }
    $out['events'] = ['url' => esc_url_raw($events_url), 'rows' => implode('', array_map('xft_event_row', $events))];
    $out['hiring'] = ['url' => esc_url_raw($jobs_url), 'items' => array_map(function ($j) {
        return [
            'url' => esc_url_raw(get_permalink($j)),
            'mark' => xft_company_mark((int) $j->ID, 40),
            'title' => esc_html(get_the_title($j)),
            'sub' => esc_html(implode(' · ', array_filter([get_post_meta($j->ID, '_xf_company_name', true), get_post_meta($j->ID, '_xf_location', true) ?: get_post_meta($j->ID, '_xf_city', true)]))),
            'sal' => esc_html(function_exists('xf_job_salary_label') ? xf_job_salary_label($j->ID) : ''),
            'age' => esc_html(xft_age($j)),
        ];
    }, $hiring)];

    $blog_cats = function_exists('xf_blog_categories') ? array_filter(array_map(function ($s) { $t = get_term_by('slug', $s, 'category'); return $t ? $t->term_id : 0; }, xf_blog_categories())) : [];
    $blog_posts = $blog_cats ? xft_query_posts(['posts_per_page' => 8, 'category__in' => $blog_cats]) : [];
    if (count($blog_posts) < 8) {
        $blog_posts = xft_query_posts(['posts_per_page' => 8, 'meta_key' => '_thumbnail_id', 'offset' => 3]);
    }
    $out['blog'] = ['url' => esc_url_raw($blog_url), 'items' => array_map(function ($p) { return xf_headless_post($p, '3x2'); }, $blog_posts)];

    $shown = array_merge($exclude, wp_list_pluck($latest, 'ID'), wp_list_pluck($secondary, 'ID'), wp_list_pluck((array) $popular, 'ID'), $used, wp_list_pluck($blog_posts, 'ID'));
    $guides = xft_query_posts(['posts_per_page' => 8, 'post__not_in' => array_values(array_unique(array_map('intval', $shown)))]);
    $out['guides'] = ['url' => esc_url_raw($blog_url), 'items' => array_map(function ($p) { return xf_headless_post($p, '3x2'); }, $guides)];

    $out['contribute'] = [];
    foreach ([['article', 'Submit an article', 'Analysis, opinion, founder lessons'], ['press', 'Send a press release', 'Funding, launches, partnerships'], ['launch', 'Submit your launch', 'Get considered for founder of the day'], ['job', 'Post a job', 'Reach founders and operators']] as [$type, $title, $sub]) {
        $out['contribute'][] = ['url' => esc_url_raw(add_query_arg('type', $type, $submit_url)), 'title' => esc_html($title), 'sub' => esc_html($sub)];
    }
    $out['arrow'] = xft_icon('<path d="M5 12h14M13 6l6 6-6 6"/>', 20);
    $out['built'] = gmdate('c');
    return $out;
}

/* ---- Route 2: articles (astro/src/pages/[...slug].astro mirrors single-post.php) ----
 *
 *   GET /wp-json/xf/v1/headless/posts          published post slugs + modified_gmt, for incremental builds
 *   GET /wp-json/xf/v1/headless/post?slug=x    one article: WP's head/header/footer for its URL plus every
 *                                              block single-post.php renders, in its order
 *
 * Built as a logged-out visitor, so [xf_reveal] hidden parts and anything private never get in.
 * Cached per post + modified time + a generation that any post save bumps (related lists change).
 */
add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/headless/posts', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_headless_posts',
    ]);
    register_rest_route('xf/v1', '/headless/post', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'args' => ['slug' => ['type' => 'string', 'required' => true]],
        'callback' => function (WP_REST_Request $r) {
            $post = get_page_by_path(sanitize_title((string) $r['slug']), OBJECT, 'post');
            if (!$post || $post->post_status !== 'publish' || post_password_required($post) || $post->post_password !== '') {
                return new WP_REST_Response(['error' => 'not_found'], 404);
            }
            $key = 'xf_hl_post_' . $post->ID . '_' . md5($post->post_modified_gmt . '|' . (int) get_option('xf_hl_gen') . '|' . xf_headless_code_ver());
            $data = get_transient($key);
            if (!is_array($data)) {
                $uid = get_current_user_id();
                wp_set_current_user(0);
                $path = (string) wp_parse_url(get_permalink($post), PHP_URL_PATH);
                xf_headless_route($path);
                $data = xf_headless_article($path, $post->ID);
                wp_set_current_user($uid);
                if (empty($data['error'])) {
                    set_transient($key, $data, 6 * HOUR_IN_SECONDS);
                }
            }
            $res = new WP_REST_Response($data, empty($data['error']) ? 200 : 404);
            $res->header('Cache-Control', 'public, max-age=300');
            return $res;
        },
    ]);
});

// Any post change can alter other articles' related lists, so start a new cache generation.
add_action('save_post', function ($id, $p) {
    if ($p->post_type === 'post' && !wp_is_post_revision($id)) {
        update_option('xf_hl_gen', (int) get_option('xf_hl_gen') + 1, false);
    }
}, 10, 2);

/** Changes whenever plugin or theme code is deployed, so a release never serves a stale render. */
function xf_headless_code_ver() {
    $t = 0;
    foreach (array_merge(glob(__DIR__ . '/*.php') ?: [], glob(get_template_directory() . '/*.php') ?: [], glob(get_template_directory() . '/parts/*.php') ?: []) as $f) {
        $t = max($t, (int) filemtime($f));
    }
    return $t;
}

function xf_headless_posts() {
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT ID, post_name, post_modified_gmt FROM {$wpdb->posts} WHERE post_type = %s AND post_status = %s AND post_password = '' ORDER BY post_date_gmt DESC",
        'post', 'publish'
    ));
    $out = [];
    foreach ($rows as $r) {
        $path = (string) wp_parse_url(get_permalink((int) $r->ID), PHP_URL_PATH);
        // Only plain ASCII /slug/ URLs map 1:1 onto a static file the .htaccess rule can find.
        if ($path === '/' . $r->post_name . '/' && preg_match('~^/[a-z0-9-]+/$~', $path)) {
            $out[] = ['slug' => $r->post_name, 'path' => $path, 'modified_gmt' => $r->post_modified_gmt];
        }
    }
    $res = new WP_REST_Response(['posts' => $out, 'count' => count($out), 'built' => gmdate('c')]);
    $res->header('Cache-Control', 'no-cache');
    return $res;
}

/** Everything single-post.php renders, field by field. Keep in step with that template. */
function xf_headless_article($path, $id) {
    if (!is_singular('post') || get_queried_object_id() !== (int) $id || !function_exists('xft_toc')) {
        return ['error' => 'not_routed'];
    }
    $chrome = xf_headless_chrome($path); // renders the real template (head/robots/schema exactly as WP)
    rewind_posts();
    the_post();
    $post = get_post();
    $author_id = (int) $post->post_author;
    $cat = xft_category($post);
    [$content, $toc] = xft_toc(apply_filters('the_content', get_the_content()));
    $credit = get_post_meta($post->ID, '_xf_image_credit', true) ?: wp_get_attachment_caption(get_post_thumbnail_id());
    $hub = function_exists('xf_post_hub') ? xf_post_hub((int) get_post_meta($post->ID, '_xf_ai_source', true) ?: $post->ID) : '';
    $tags = get_the_tags() ?: [];
    $cats = get_the_category() ?: [];
    $terms = null;
    if ($tags || $cats) {
        $terms = [];
        foreach ((array) $cats as $c) {
            if ($c->slug !== 'uncategorized') $terms[] = ['url' => esc_url_raw(get_category_link($c)), 'name' => esc_html($c->name)];
        }
        foreach ((array) $tags as $t) {
            $terms[] = ['url' => esc_url_raw(get_tag_link($t)), 'name' => esc_html($t->name)];
        }
    }
    $date = get_the_date('j M Y') . ' · ' . xft_read_time($post);
    if (get_the_modified_time('U') > get_the_time('U') + DAY_IN_SECONDS) {
        $date .= ' · Updated ' . get_the_modified_date('j M Y');
    }
    ob_start();
    post_class();
    $post_class = trim((string) ob_get_clean());
    $related = xft_related_posts($post, 4);
    $data = [
        'chrome' => $chrome,
        'id' => (int) $post->ID,
        'path' => $path,
        'modified_gmt' => $post->post_modified_gmt,
        'post_class' => preg_match('~class="([^"]*)"~', $post_class, $m) ? $m[1] : '',
        'cat' => $cat ? ['url' => esc_url_raw(get_category_link($cat)), 'name' => esc_html($cat->name)] : null,
        'is_lead' => is_sticky($post->ID),
        'title' => get_the_title(), // what the_title() prints
        'dek' => has_excerpt() ? esc_html(get_the_excerpt()) : '',
        'avatar' => get_avatar($author_id, 72, '', '', ['force_display' => false]) ?: esc_html(xft_initials(xft_author_name($post))),
        'author' => ['url' => esc_url_raw(get_author_posts_url($author_id)), 'name' => esc_html(xft_author_name($post))],
        'date' => get_the_date('c'),
        'read_time' => esc_html(xft_read_time($post)),
        'date_line' => esc_html($date),
        'share' => function_exists('xf_share_bar_html') ? xf_share_bar_html(get_permalink(), get_the_title(), 'article') : '',
        'image' => has_post_thumbnail() ? ['html' => xft_image($post, '21x10', 'full', true), 'credit' => $credit ? esc_html($credit) : ''] : null,
        'toc' => array_map(function ($t) { return ['id' => $t['id'], 'text' => esc_html($t['text'])]; }, $toc),
        'content_html' => $content,
        'hub' => $hub ? ['url' => esc_url_raw(xf_hub_url($hub)), 'title' => esc_html(xf_hubs()[$hub]['title'])] : null,
        'terms' => $terms,
        'original' => esc_url_raw((string) get_post_meta($post->ID, '_xf_original_url', true)),
        'related' => $related ? ['url' => esc_url_raw(xft_page_url('news', 'news')), 'items' => array_map(function ($p) {
            return ['url' => esc_url_raw(get_permalink($p)), 'img' => xft_image($p, '3x2'), 'cat' => esc_html(xft_cat_name($p)), 'title' => esc_html(get_the_title($p))];
        }, $related)] : null,
        'reveal_probe' => xf_headless_reveal_probe($post->ID),
        'built' => gmdate('c'),
    ];
    wp_reset_postdata();
    return $data;
}

/**
 * Hashes of 8-word runs of the hidden [xf_reveal] text, so the parity gate can prove none of it is on
 * the page without the endpoint ever exposing the text itself.
 */
function xf_headless_reveal_probe($id) {
    $block = function_exists('xf_reveal_block') ? xf_reveal_block($id) : null;
    if (!$block) {
        return [];
    }
    $text = strtolower(html_entity_decode(wp_strip_all_tags(strip_shortcodes($block['inner'])), ENT_QUOTES, 'UTF-8'));
    preg_match_all('/[a-z0-9]+/', $text, $m);
    $w = $m[0];
    $out = [];
    for ($i = 0; $i + 8 <= count($w); $i += 4) {
        $out[] = substr(hash('sha256', implode(' ', array_slice($w, $i, 8))), 0, 16);
    }
    return array_values(array_unique($out));
}
