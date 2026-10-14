<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Hardening for a shared-hosting WordPress with one administrator.
 *
 * Every piece is behind its own filter, so a single measure can be switched off
 * from a must-use plugin without touching this file:
 *
 *     add_filter('xf_security_hsts', '__return_false');
 *
 * Deliberately absent: a Content-Security-Policy. AdSense Auto ads pull scripts,
 * frames and images from a list of Google domains that changes without notice,
 * and a policy that is a little too tight stops the ads loading without any
 * visible error. Hostinger already sends `upgrade-insecure-requests`, which is
 * the part of a CSP worth having here.
 */

function xf_security_on($feature, $default = true) {
    return (bool) apply_filters('xf_security_' . $feature, $default);
}

/* -------------------------------------------------------------------------
 * Response headers
 * ---------------------------------------------------------------------- */

add_action('send_headers', function () {
    if (headers_sent()) {
        return;
    }
    // The PHP version tells an attacker which exploits are worth trying.
    header_remove('X-Powered-By');

    if (xf_security_on('headers')) {
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('X-Frame-Options: SAMEORIGIN');
        // Powers this site never uses. The advertising permissions
        // (browsing-topics, attribution-reporting, the ad-auction pair) are
        // left at their defaults so AdSense keeps working.
        header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()');
    }

    // HTTPS only, for a year. Browsers that have seen this header refuse to
    // fall back to http://, which closes the gap a hijacked DNS or a café
    // network could use. Not submitted to the preload list: that is one-way.
    if (xf_security_on('hsts') && is_ssl()) {
        header('Strict-Transport-Security: max-age=31536000');
    }
});

/* -------------------------------------------------------------------------
 * XML-RPC: a login endpoint nothing here uses
 *
 * system.multicall lets one request try hundreds of passwords, and pingback
 * turns the site into a reflector for attacks on other people. We publish
 * through the REST API, so none of it is needed.
 * ---------------------------------------------------------------------- */

add_filter('xmlrpc_enabled', function ($on) {
    return xf_security_on('disable_xmlrpc') ? false : $on;
});

add_filter('xmlrpc_methods', function ($methods) {
    if (!xf_security_on('disable_xmlrpc')) {
        return $methods;
    }
    unset($methods['pingback.ping'], $methods['pingback.extensions.getPingbacks'], $methods['system.multicall']);
    return $methods;
});

add_filter('wp_headers', function ($headers) {
    if (xf_security_on('disable_xmlrpc')) {
        unset($headers['X-Pingback']);
    }
    return $headers;
});

/* -------------------------------------------------------------------------
 * User enumeration
 *
 * A brute-force run starts by collecting usernames. WordPress hands them out
 * through /?author=1 and the REST users route unless you stop it.
 * ---------------------------------------------------------------------- */

add_action('template_redirect', function () {
    if (!xf_security_on('no_enumeration') || is_user_logged_in()) {
        return;
    }
    if (!empty($_GET['author']) && !is_admin()) { // phpcs:ignore WordPress.Security.NonceVerification
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
}, 1);

add_filter('rest_endpoints', function ($endpoints) {
    if (!xf_security_on('no_enumeration') || is_user_logged_in()) {
        return $endpoints;
    }
    unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    return $endpoints;
});

// The generator tag names the exact WordPress version.
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

/* -------------------------------------------------------------------------
 * Login throttle
 *
 * Shared hosting has no fail2ban. This counts failures per address and stops
 * answering after a run of them, which is what makes a password list
 * uneconomical. The window is generous enough that a person mistyping their
 * own password several times is never locked out for long.
 * ---------------------------------------------------------------------- */

const XF_LOGIN_MAX_TRIES = 10;
const XF_LOGIN_WINDOW = 900;   // failures are counted over 15 minutes
const XF_LOGIN_LOCKOUT = 1200; // and the address waits 20 minutes

/**
 * The visitor's address. The site sits behind Hostinger's CDN (server: hcdn),
 * which passes the visitor in X-Real-IP; anything else in the request is the
 * client's own say-so. CF-Connecting-IP is never trusted: the site is not on
 * Cloudflare, so any visitor could set it and get a fresh "address" (and a
 * fresh login, vote and rate-limit allowance) on every request. Change the
 * header with the xf_client_ip_header filter ('' = REMOTE_ADDR only).
 */
function xf_client_ip() {
    $header = (string) apply_filters('xf_client_ip_header', 'HTTP_X_REAL_IP');
    if ($header !== '' && !empty($_SERVER[$header])) {
        $ip = trim(explode(',', (string) $_SERVER[$header])[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

/** A key for the requesting address that never stores the address itself. */
function xf_login_key($prefix = 'xf_lf_') {
    return $prefix . substr(md5(xf_client_ip() . wp_salt('auth')), 0, 20);
}

/**
 * A lock that two PHP processes can't both take. add_option() and transients
 * are not safe for this (add_option() writes with ON DUPLICATE KEY UPDATE), so
 * two cron runs, or a cron run and a button click, could both "get" them.
 * INSERT IGNORE on the unique option_name is atomic in MySQL (and in the local
 * SQLite driver). A lock older than $ttl seconds is treated as abandoned.
 */
function xf_mutex_acquire($name, $ttl = 60, $wait = 0) {
    global $wpdb;
    $option = 'xf_mutex_' . $name;
    $deadline = microtime(true) + max(0, $wait);
    do {
        $now = time();
        $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value < %s", $option, (string) ($now - $ttl)));
        if ($wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", $option, (string) $now))) {
            return true;
        }
        if ($wait > 0) {
            usleep(200000);
        }
    } while (microtime(true) < $deadline);
    return false;
}

/**
 * True when $url uses one of $schemes on its default port and its host resolves only to public
 * addresses. wp_http_validate_url() (used by wp_safe_remote_*) lets through link-local
 * (169.254.x, cloud metadata), CGNAT and every IPv6 range, so outbound fetches of
 * user- or third-party-supplied URLs check here first, on every redirect hop.
 */
function xf_url_is_public($url, array $schemes = ['https']) {
    $p = wp_parse_url((string) $url);
    $scheme = strtolower($p['scheme'] ?? '');
    if (!$p || !in_array($scheme, $schemes, true) || empty($p['host']) || isset($p['user']) || isset($p['pass'])
        || (isset($p['port']) && (int) $p['port'] !== ($scheme === 'http' ? 80 : 443))) {
        return false;
    }
    $host = strtolower(trim($p['host'], '[]'));
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        $ips = [$host];
    } else {
        $ips = gethostbynamel($host) ?: [];
        foreach ((array) @dns_get_record($host, DNS_AAAA) as $r) { // phpcs:ignore WordPress.PHP.NoSilencedErrors
            if (!empty($r['ipv6'])) $ips[] = $r['ipv6'];
        }
    }
    if (!$ips) {
        return false;
    }
    $flags = defined('FILTER_FLAG_GLOBAL_RANGE') ? FILTER_FLAG_GLOBAL_RANGE : FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, $flags) || preg_match('/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./', $ip)) {
            return false; // private, loopback, link-local, reserved or CGNAT
        }
    }
    return true;
}

/**
 * wp_safe_remote_get() that follows up to $max redirects itself, checking every hop with
 * xf_url_is_public(). Returns the final response or a WP_Error.
 * shortcut: cURL resolves DNS again after the check (rebinding window); pin with CURLOPT_RESOLVE if that matters.
 */
function xf_public_remote_get($url, array $args = [], $max = 3, array $schemes = ['https', 'http'], $same_host = false) {
    $args['redirection'] = 0;
    $first = strtolower(rtrim((string) wp_parse_url((string) $url, PHP_URL_HOST), '.'));
    for ($hop = 0; $hop <= $max; $hop++) {
        if (!xf_url_is_public($url, $schemes)) {
            return new WP_Error('xf_not_public', 'The address does not resolve to a public server.');
        }
        $res = wp_safe_remote_get($url, $args);
        $code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
        if ($code < 300 || $code > 399) {
            return $res;
        }
        $loc = wp_remote_retrieve_header($res, 'location');
        $loc = is_array($loc) ? end($loc) : (string) $loc;
        if ($loc === '') {
            return $res;
        }
        $url = WP_Http::make_absolute_url($loc, $url);
        if ($same_host && strtolower(rtrim((string) wp_parse_url($url, PHP_URL_HOST), '.')) !== $first) {
            return new WP_Error('xf_cross_host', 'Redirected to another host.');
        }
    }
    return new WP_Error('xf_redirects', 'Too many redirects.');
}

function xf_mutex_release($name) {
    global $wpdb;
    $wpdb->delete($wpdb->options, ['option_name' => 'xf_mutex_' . $name]);
}

add_filter('authenticate', function ($user, $username) {
    if (!xf_security_on('login_throttle') || $username === '') {
        return $user;
    }
    if (get_transient(xf_login_key('xf_lb_'))) {
        return new WP_Error(
            'xf_locked',
            __('Too many failed sign-in attempts. Please wait twenty minutes and try again.', '100xfounder')
        );
    }
    return $user;
}, 20, 2);

add_action('wp_login_failed', function () {
    if (!xf_security_on('login_throttle')) {
        return;
    }
    $key = xf_login_key();
    $tries = (int) get_transient($key) + 1;
    set_transient($key, $tries, XF_LOGIN_WINDOW);
    if ($tries >= XF_LOGIN_MAX_TRIES) {
        set_transient(xf_login_key('xf_lb_'), 1, XF_LOGIN_LOCKOUT);
        delete_transient($key);
    }
});

add_action('wp_login', function () {
    delete_transient(xf_login_key());
    delete_transient(xf_login_key('xf_lb_'));
});

/**
 * "Unknown username" tells an attacker which half of the guess was right, so
 * both failures get the same answer. Only those two messages are replaced —
 * an expired session, a lockout or a password-reset notice still says what it
 * means, because a person who sees one needs to know what happened.
 */
add_filter('login_errors', function ($error) {
    if (!xf_security_on('login_throttle') || !is_string($error)) {
        return $error;
    }
    $reveals = ['is not registered', 'Unknown username', 'The password you entered', 'incorrect password'];
    foreach ($reveals as $phrase) {
        if (stripos($error, $phrase) !== false) {
            return __('That username and password combination is not right.', '100xfounder');
        }
    }
    return $error;
});

/* -------------------------------------------------------------------------
 * Blast radius
 * ---------------------------------------------------------------------- */

// Somebody who gets into the dashboard should not also get a PHP editor.
if (!defined('DISALLOW_FILE_EDIT') && xf_security_on('no_file_edit')) {
    define('DISALLOW_FILE_EDIT', true);
}

/**
 * Uploads are media, not code. WordPress already refuses .php, but an .htaccess
 * or .phtml slipped past a future plugin would not be caught by that list.
 */
add_filter('wp_check_filetype_and_ext', function ($info, $file, $filename) {
    if (!xf_security_on('upload_filter')) {
        return $info;
    }
    if (preg_match('/\.(php\d?|phtml|phar|htaccess|htpasswd|cgi|pl|py|sh|exe)$/i', (string) $filename)) {
        return ['ext' => false, 'type' => false, 'proper_filename' => false];
    }
    return $info;
}, 10, 3);
