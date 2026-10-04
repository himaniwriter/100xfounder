<?php
if (!defined('ABSPATH')) {
    exit;
}

const XF_CONTACT_PATHS = ['', '/contact', '/about', '/team'];

function xf_http_get($url, $timeout = 8) {
    return wp_remote_get($url, [
        'timeout' => $timeout,
        'redirection' => 5,
        'user-agent' => 'Mozilla/5.0 (compatible; 100xFounderBot/1.0; +' . home_url('/') . ')',
        'limit_response_size' => 600000,
    ]);
}

function xf_strip_tracking($url) {
    $parts = wp_parse_url($url);
    if (!$parts || empty($parts['host'])) {
        return $url;
    }
    $query = [];
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $query);
        foreach (array_keys($query) as $key) {
            if (strpos($key, 'utm_') === 0 || $key === 'ref') {
                unset($query[$key]);
            }
        }
    }
    $clean = ($parts['scheme'] ?? 'https') . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '') . ($parts['path'] ?? '/');
    return $query ? $clean . '?' . http_build_query($query) : $clean;
}

/**
 * Product Hunt's `website` field is a producthunt.com redirect. Follow it to the
 * maker's real site so listings link directly and contacts can be discovered.
 */
function xf_resolve_website($website) {
    if (!$website) {
        return '';
    }
    $response = xf_http_get($website);
    if (is_wp_error($response)) {
        return '';
    }
    $final = $website;
    if (isset($response['http_response']) && method_exists($response['http_response'], 'get_response_object')) {
        $final = $response['http_response']->get_response_object()->url ?: $website;
    }
    $host = (string) wp_parse_url($final, PHP_URL_HOST);
    if ($host === '' || preg_match('/(^|\.)producthunt\.com$/i', $host)) {
        return '';
    }
    return xf_strip_tracking($final);
}

function xf_registrable_domain($host) {
    $parts = explode('.', strtolower(preg_replace('/^www\./i', '', (string) $host)));
    return implode('.', array_slice($parts, -2));
}

function xf_email_score($email, $site_domain) {
    $priorities = [
        '/^(founders?|ceo|cofounder|co-founder)@/i' => 0,
        '/^(hello|hi|hey|team)@/i' => 2,
        '/^(contact|info|partnerships?|marketing|growth)@/i' => 3,
        '/^(support|help|sales)@/i' => 4,
    ];
    $score = 1;
    foreach ($priorities as $pattern => $value) {
        if (preg_match($pattern, $email)) {
            $score = $value;
            break;
        }
    }
    return xf_registrable_domain(substr(strrchr($email, '@'), 1)) === $site_domain ? $score : $score + 10;
}

function xf_ignored_email($email) {
    $patterns = [
        '/^no-?reply@/i', '/^donotreply@/i',
        '/@(example|domain|email|yourdomain|sentry|wixpress|sentry-next)\./i',
        '/\.(png|jpe?g|gif|svg|webp|css|js)$/i',
        '/^(privacy|legal|abuse|security|dmca|gdpr|billing|invoices?|careers|jobs|press)@/i',
    ];
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $email)) {
            return true;
        }
    }
    return !is_email($email);
}

/**
 * Looks for a contact email the company publishes on its own website, plus X
 * and LinkedIn profiles. Only published addresses are used.
 */
function xf_discover_contact($website) {
    $host = wp_parse_url($website, PHP_URL_HOST);
    $scheme = wp_parse_url($website, PHP_URL_SCHEME) ?: 'https';
    $port = wp_parse_url($website, PHP_URL_PORT);
    if (!$host) {
        return null;
    }
    $origin = $scheme . '://' . $host . ($port ? ':' . $port : '');
    $site_domain = xf_registrable_domain($host);
    $candidates = [];
    $twitter = '';
    $linkedin = '';

    foreach (XF_CONTACT_PATHS as $path) {
        $page_url = $origin . ($path ?: '/');
        $response = xf_http_get($page_url);
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            continue;
        }
        if (stripos((string) wp_remote_retrieve_header($response, 'content-type'), 'text/html') === false) {
            continue;
        }
        $html = (string) wp_remote_retrieve_body($response);

        if (preg_match_all('/mailto:([^"\'?>\s]+)/i', $html, $m)) {
            foreach ($m[1] as $email) {
                $email = strtolower(rawurldecode($email));
                $candidates[$email] = $candidates[$email] ?? $page_url;
            }
        }
        if (preg_match_all('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', $html, $m)) {
            foreach ($m[0] as $email) {
                $email = strtolower($email);
                // Bare-text addresses are only trusted on the product's own domain.
                if (xf_registrable_domain(substr(strrchr($email, '@'), 1)) === $site_domain) {
                    $candidates[$email] = $candidates[$email] ?? $page_url;
                }
            }
        }
        if (!$twitter && preg_match('#https?://(?:www\.)?(?:twitter|x)\.com/(?!intent|share|home)[A-Za-z0-9_]{1,15}#i', $html, $m)) {
            $twitter = $m[0];
        }
        if (!$linkedin && preg_match('#https?://(?:[a-z]{2,3}\.)?linkedin\.com/(?:company|in)/[A-Za-z0-9_-]+#i', $html, $m)) {
            $linkedin = $m[0];
        }
    }

    $emails = array_filter(array_keys($candidates), function ($email) { return !xf_ignored_email($email); });
    if (!$emails) {
        return null;
    }
    usort($emails, function ($a, $b) use ($site_domain) {
        return xf_email_score($a, $site_domain) <=> xf_email_score($b, $site_domain);
    });
    $best = reset($emails);
    return ['email' => $best, 'discovered_from' => $candidates[$best], 'twitter' => $twitter, 'linkedin' => $linkedin];
}

function xf_is_suppressed($email) {
    global $wpdb;
    return (bool) $wpdb->get_var($wpdb->prepare('SELECT 1 FROM ' . xf_table('suppressions') . ' WHERE email = %s', $email));
}

/** Finds contacts for recently imported Product Hunt startups and queues outreach. */
function xf_discover_contacts_for_new_startups($limit = 15) {
    global $wpdb;
    $ids = get_posts([
        'post_type' => 'xf_startup',
        'post_status' => 'publish',
        'posts_per_page' => $limit,
        'fields' => 'ids',
        'orderby' => 'date',
        'order' => 'DESC',
        'meta_query' => [
            ['key' => '_xf_source', 'value' => 'producthunt'],
            ['key' => '_xf_contacts_checked', 'compare' => 'NOT EXISTS'],
        ],
    ]);

    $found = 0;
    foreach ($ids as $startup_id) {
        $website = get_post_meta($startup_id, '_xf_website', true);
        $contact = $website ? xf_discover_contact($website) : null;
        if ($contact && !xf_is_suppressed($contact['email'])) {
            // The unique email index means each address is only ever contacted once.
            $inserted = $wpdb->query($wpdb->prepare(
                'INSERT IGNORE INTO ' . xf_table('contacts') . ' (startup_id, email, twitter_url, linkedin_url, discovered_from, status, step, next_send_at, token, created_at, updated_at)
                 VALUES (%d, %s, %s, %s, %s, %s, 0, %s, %s, %s, %s)',
                $startup_id, $contact['email'], $contact['twitter'], $contact['linkedin'], $contact['discovered_from'],
                'queued', xf_now(), wp_generate_password(40, false), xf_now(), xf_now()
            ));
            if ($inserted) {
                $found++;
            }
        }
        update_post_meta($startup_id, '_xf_contacts_checked', time());
    }
    return ['checked' => count($ids), 'found' => $found];
}
