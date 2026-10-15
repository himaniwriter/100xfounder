<?php
/**
 * External links, capped at render time (owner, 2026-10-15). Post content in the database is never
 * edited.
 *
 * Inside <main> each page keeps 0, 1 or 2 clickable external links: a stable mix chosen from the
 * URL, so a page always gets the same number. Every other external link becomes plain text, so a
 * source is still named and credited but isn't clickable. A button-style link that loses its link
 * is dropped, so no dead buttons are left. These are not counted and never touched: sponsored or
 * affiliate links (rel="sponsored", which carry revenue and the disclosure rules), image and
 * lightbox links, and the share buttons. The header and footer sit outside <main>.
 */
if (!defined('ABSPATH')) {
    exit;
}

/** 0, 1 or 2, fixed per page. */
function xf_external_link_cap($key) {
    return (int) (sprintf('%u', crc32((string) $key)) % 3);
}

function xf_strip_www($host) {
    return preg_replace('/^www\./', '', strtolower((string) $host));
}

/** $html with all but the first $keep external links inside <main> turned into text. */
function xf_cap_external_links($html, $keep) {
    $start = stripos($html, '<main');
    $end = strripos($html, '</main>');
    if ($start === false || $end === false || $end < $start) {
        return $html;
    }
    $home = xf_strip_www(wp_parse_url(home_url(), PHP_URL_HOST));
    $kept = 0;
    $main = preg_replace_callback('~<a\b([^>]*)>((?:(?!<a\b).)*?)</a>~is', function ($m) use (&$kept, $keep, $home) {
        if (!preg_match('~\bhref=(["\'])(https?://[^"\']+)\1~i', $m[1], $h)) {
            return $m[0];
        }
        $href = html_entity_decode($h[2]);
        $host = xf_strip_www(wp_parse_url($href, PHP_URL_HOST));
        if ($host === '' || $host === $home || substr($host, -strlen('.' . $home)) === '.' . $home) {
            return $m[0];
        }
        if (preg_match('~\brel=(["\'])[^"\']*\bsponsored\b~i', $m[1]) || stripos($m[2], '<img') !== false
            || preg_match('~^https?://(?:www\.)?(?:linkedin\.com/sharing/|x\.com/intent/|twitter\.com/intent/|wa\.me/)~i', $href)) {
            return $m[0];
        }
        if ($kept < $keep) {
            $kept++;
            return $m[0];
        }
        if (preg_match('~\bclass=(["\'])[^"\']*\b(?:btn|button)\b~i', $m[1])) {
            return '';
        }
        return '<span class="xf-ext">' . trim(str_replace('↗', '', $m[2])) . '</span>';  // the arrow promises a link
    }, substr($html, $start, $end - $start));
    // A page too large for PCRE comes back unchanged rather than broken.
    return $main === null ? $html : substr($html, 0, $start) . $main . substr($html, $end);
}

add_action('template_redirect', function () {
    if (is_admin() || is_feed() || is_robots() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return;
    }
    $key = strtok((string) ($_SERVER['REQUEST_URI'] ?? '/'), '?');
    ob_start(function ($html) use ($key) {
        return xf_cap_external_links($html, xf_external_link_cap($key));
    });
}, 1);
