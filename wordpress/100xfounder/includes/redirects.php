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
                $target = $post ? get_permalink($post) : xf_page_url('directory');
            }
            break;
        case 'blog':
        case 'newsroom':
            if (!empty($parts[1])) {
                $post = get_page_by_path(sanitize_title($parts[1]), OBJECT, 'post');
                $target = $post ? get_permalink($post) : null;
            }
            $target = $target ?: (get_option('page_for_posts') ? get_permalink(get_option('page_for_posts')) : home_url('/'));
            break;
        case 'founders':
        case 'founder':
        case 'companies':
        case 'industries':
        case 'stages':
        case 'countries':
        case 'funding-rounds':
        case 'search':
            $target = xf_page_url('directory');
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
