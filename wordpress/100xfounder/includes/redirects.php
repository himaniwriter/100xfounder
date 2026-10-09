<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 301s from the old Next.js URLs, so existing search rankings and links keep
 * working after the move to WordPress.
 */
add_action('template_redirect', function () {
    if (!is_404()) {
        return;
    }
    $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    $parts = explode('/', $path);
    $target = null;

    switch ($parts[0] ?? '') {
        case 'company':
        case 'launches':
            if (!empty($parts[1])) {
                $post = get_page_by_path(sanitize_title($parts[1]), OBJECT, 'xf_startup');
                $target = $post ? get_permalink($post) : null;
                if (!$target) {
                    xf_gone();
                }
            }
            break;
        case 'blog':
        case 'newsroom':
            if (!empty($parts[1])) {
                $post = get_page_by_path(sanitize_title($parts[1]), OBJECT, 'post');
                $target = $post ? get_permalink($post) : null;
                if (!$target) {
                    xf_gone();
                }
            }
            $target = $target ?: xf_page_url('blog');
            break;
        case 'founders':
        case 'founder':
        case 'companies':
        case 'industries':
        case 'stages':
        case 'countries':
        case 'funding-rounds':
        case 'search':
        case 'startups':
            // The old profile pages had unsourced data and are gone for good. Tell Google so
            // (410) instead of redirecting them all to one page, which it treats as soft 404s.
            if (!empty($parts[1])) {
                xf_gone();
            }
            $target = xf_page_url('directory');
            break;
        case 'signals':
        case 'salary-equity':
        case 'compare':
        case 'changelog':
        case 'dashboard':
        case 'login':
        case 'help':
        case 'cookies':
            xf_gone();
            break;
        case 'careers':
            $target = home_url('/jobs/');
            break;
        case 'get-featured':
        case 'feature-now':
        case 'pricing':
        case 'guest-post-marketplace':
        case 'guest-post-order':
        case 'interview-questionnaire':
            $target = xf_page_url('contact');
            break;
        case 'about-newsroom':
            $target = xf_page_url('about');
            break;
        case 'contact-newsroom':
            $target = xf_page_url('contact');
            break;
    }

    if ($target) {
        wp_safe_redirect($target, 301);
        exit;
    }
});

/** 410 Gone: removed for good, so search engines drop the URL quickly. */
function xf_gone() {
    status_header(410);
    nocache_headers();
    header('X-Robots-Tag: noindex');
    echo '<!doctype html><meta charset="utf-8"><title>Gone</title><p>This page was removed. <a href="' . esc_url(home_url('/')) . '">Go to 100xFounder</a>.</p>';
    exit;
}

/* Don't let WordPress "guess" a redirect for unknown URLs (it sent /founders to an event page). */
add_filter('do_redirect_guess_404_permalink', '__return_false');
