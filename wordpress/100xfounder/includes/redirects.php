<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * The old Next.js site's URLs (Feb–Sep 2026). Google still knows about 4,600
 * of them, and had read and declined 2,500: most were generated combinations
 * such as salary by city by stage, or startups by country by industry.
 *
 * Each old URL now gets one of two answers:
 *   301 to the page that really replaces it (the same article, the same
 *       startup, or the section that covers the same thing), or
 *   410 Gone when nothing here replaces it, which tells Google to stop asking
 *       sooner than a 404 does.
 *
 * A redirect to an unrelated page (every old URL to the homepage, say) is
 * treated by Google as a soft 404 and keeps being recrawled, so there are none.
 * This only runs for requests that would otherwise 404, so live pages are
 * never affected.
 */

/** A published item with this slug, in the first of these post types that has one. */
function xf_legacy_find($slug, array $types) {
    $slug = sanitize_title($slug);
    if ($slug === '') {
        return '';
    }
    foreach ($types as $type) {
        $post = get_page_by_path($slug, OBJECT, $type);
        if ($post && $post->post_status === 'publish') {
            return get_permalink($post);
        }
    }
    return '';
}

/** A category archive, but only one with posts in it: an empty archive is no replacement. */
function xf_legacy_category($slug, $min_posts = 1) {
    $aliases = [
        'ai' => 'ai-deeptech', 'artificial-intelligence' => 'ai-deeptech', 'deeptech' => 'ai-deeptech', 'ai-ml' => 'ai-deeptech',
        'e-commerce' => 'ecommerce', 'd2c' => 'consumer-d2c', 'consumer' => 'consumer-d2c', 'consumer-internet' => 'consumer-d2c',
        'health' => 'healthtech', 'healthcare' => 'healthtech', 'ev' => 'ev-mobility', 'mobility' => 'ev-mobility',
        'automotive' => 'ev-mobility', 'electric-vehicles' => 'ev-mobility', 'crypto' => 'web3', 'blockchain' => 'web3',
        'space' => 'spacetech', 'software' => 'saas', 'b2b-saas' => 'saas', 'enterprise' => 'saas',
        'finance' => 'fintech', 'payments' => 'fintech', 'founders' => 'founder-stories', 'careers' => 'careers-salary',
    ];
    $slug = sanitize_title($slug);
    $term = get_term_by('slug', $aliases[$slug] ?? $slug, 'category');
    return $term && (int) $term->count >= $min_posts ? get_term_link($term) : '';
}

/** A jobs landing page that exists here: /jobs/{function}-jobs/ or /jobs/jobs-in-{city}/. */
function xf_legacy_jobs($kind, $slug) {
    $slug = sanitize_title($slug);
    if ($kind === 'location') {
        $alias = ['bangalore' => 'bengaluru', 'delhi' => 'delhi-ncr', 'new-delhi' => 'delhi-ncr', 'gurgaon' => 'delhi-ncr',
                  'gurugram' => 'delhi-ncr', 'noida' => 'delhi-ncr', 'bombay' => 'mumbai'];
        $slug = $alias[$slug] ?? $slug;
        foreach (XF_JOB_CITIES as $city) {
            if (sanitize_title($city) === $slug) {
                return home_url($slug === 'remote' ? '/jobs/remote-jobs/' : '/jobs/jobs-in-' . $slug . '/');
            }
        }
        return home_url('/jobs/');
    }
    // A role or title: file it under the function our own classifier would give it.
    $fn = function_exists('xf_job_function') ? xf_job_function(str_replace('-', ' ', $slug)) : '';
    return $fn ? home_url('/jobs/' . sanitize_title($fn) . '-jobs/') : home_url('/jobs/');
}

/**
 * [status, url] for an old path, or null to leave it as an ordinary 404.
 *
 * @param string[] $p the path split on "/"
 */
function xf_legacy_route(array $p) {
    $gone = [410, ''];
    $a = $p[0] ?? '';
    $b = $p[1] ?? '';
    $c = $p[2] ?? '';
    $d = $p[3] ?? '';
    // Section pages live at fixed slugs (news, launches, funding-tracker, ...).
    $page = function ($key, $path) {
        return home_url($path);
    };

    switch ($a) {
        // Articles: the same article if it came across, otherwise gone.
        case 'blog':
        case 'newsroom':
        case 'compare':
            if (!$b) return [301, $page('news', '/news/')];
            return ($u = xf_legacy_find($b, ['post', 'xf_guide'])) ? [301, $u] : $gone;

        case 'founders':
        case 'founder':
            if ($b && ($u = xf_legacy_find($b, ['post', 'xf_spotlight', 'xf_startup']))) return [301, $u];
            // Old team pages were "{company}-team-{company}": send them to the company's profile.
            if ($b && preg_match('/^(.+?)-team-/', $b, $m) && ($u = xf_legacy_find($m[1], ['xf_startup']))) return [301, $u];
            if ($b) return $gone;
            return ($u = xf_legacy_category('founder-stories')) ? [301, $u] : [301, $page('spotlights', '/spotlights/')];

        // Startups: the same listing if it exists.
        case 'company':
        case 'launches':
        case 'spotlight':
            if (!$b) return [301, $page($a === 'spotlight' ? 'spotlights' : 'launches', '/launches/')];
            return ($u = xf_legacy_find($b, ['xf_startup', 'xf_spotlight'])) ? [301, $u] : $gone;

        case 'companies':
            return $b && ($u = xf_legacy_find($b, ['xf_startup'])) ? [301, $u] : $gone;

        case 'startups':
            switch ($b) {
                case 'jobs':
                    if (in_array($c, ['location', 'role', 'title', 'market'], true) && $d) {
                        return [301, xf_legacy_jobs($c === 'location' ? 'location' : 'role', $d)];
                    }
                    return [301, home_url('/jobs/')];
                case 'funding-round':
                case 'investor':
                    return [301, $page('funding-tracker', '/funding-tracker/')];
                case 'industry':
                    if ($c && ($u = xf_legacy_category($c))) return [301, $u];
                    return $c ? $gone : [301, $page('startups', '/startups/')];
                case 'salary-equity':
                    // The hub has a successor in the salary tools; the generated combinations do not.
                    return $c ? $gone : [301, home_url('/tools/')];
                case 'location':
                    return $gone;
                default:
                    return ($u = xf_legacy_find($b, ['xf_startup'])) ? [301, $u] : $gone;
            }

        // Apply guides: /how-to-get-a-job-at-x/ (posts, in the sitemap) is the main
        // pattern. A /how-to-apply/{slug}/ URL with no guide behind it goes to the
        // post with the same slug; live guides never reach here (404s only).
        case 'how-to-apply':
            if ($b && !$c && ($u = xf_legacy_find($b, ['post']))) return [301, $u];
            return null;

        case 'funding-rounds':
            return [301, $page('funding-tracker', '/funding-tracker/')];

        case 'industries':
            if ($b && ($u = xf_legacy_category($b))) return [301, $u];
            return $b ? $gone : [301, $page('startups', '/startups/')];

        case 'topics':
            if ($b && ($u = xf_legacy_category($b))) return [301, $u];
            return $b ? $gone : [301, $page('news', '/news/')];

        case 'startup-salary-equity-database':
            return [301, home_url('/tools/')];

        case 'careers':
            return [301, home_url('/jobs/')];

        // Whole sections with nothing equivalent here.
        case 'countries':
        case 'stages':
        case 'signals':
            return $a === 'signals' ? [301, $page('news', '/news/')] : $gone;

        case 'authors':
            return [301, home_url('/author/ishaan-vardhan/')];

        case 'pages':
            return $b && ($u = xf_legacy_find($b, ['page'])) ? [301, $u] : $gone;

        // Old commercial and contact pages.
        case 'get-featured':
        case 'feature-now':
        case 'pricing':
        case 'guest-post-marketplace':
        case 'guest-post-order':
            return [301, $page('advertise', '/advertise/')];
        case 'interview-questionnaire':
            return [301, $page('submit', '/submit/')];
        case 'about-newsroom':
            return [301, $page('about', '/about/')];
        case 'contact-newsroom':
            return [301, $page('contact', '/contact/')];
        case 'methodology':
            return [301, $page('editorial', '/editorial-policy/')];
        case 'search':
            return [301, home_url('/news/')];

        // Old feeds and sitemaps.
        case 'sitemap':
        case 'sitemap-categories.xml':
        case 'sitemap-directory.xml':
        case 'sitemap-pages.xml':
        case 'sitemap-posts.xml':
        case 'ai-sitemap.xml':
            return [301, home_url('/wp-sitemap.xml')];
        case 'sitemap-news.xml':
        case 'ai-sitemap-news.xml':
            return [301, home_url('/news-sitemap.xml')];
        case 'rss.xml':
        case 'atom.xml':
            return [301, get_feed_link()];

        // Private screens of the old app: there is nothing to send anyone to.
        case 'login':
        case 'dashboard':
        case 'admin':
        case 'feature':
        case 'outreach':
            return $gone;
    }
    return null;
}

/**
 * WordPress's own "did you mean" redirect matches any post whose slug starts
 * the same way. With a thousand job slugs that sends old URLs to unrelated
 * jobs, so it only redirects on an exact slug match.
 */
add_filter('strict_redirect_guess_404_permalink', '__return_true');

add_action('template_redirect', function () {
    if (!is_404()) {
        return;
    }
    $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $route = xf_legacy_route(array_map('rawurldecode', explode('/', strtolower($path))));
    if (!$route) {
        return;
    }
    [$status, $url] = $route;
    if ($status === 301 && $url) {
        wp_redirect($url, 301, '100xFounder legacy');
        exit;
    }
    // 410: the theme's not-found page, with the status that says it is not coming back.
    remove_action('template_redirect', 'redirect_canonical');
    add_filter('do_redirect_guess_404_permalink', '__return_false');
    status_header(410);
    nocache_headers();
    header('X-Robots-Tag: noindex');
}, 1);
