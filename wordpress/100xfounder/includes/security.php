<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Site hardening. What Hostinger already does at the server (security
 * headers, blocking dot-files and directory listings) isn't repeated here.
 *
 * - Real client IP behind Hostinger's CDN, for every rate limit
 * - Login and application-password brute-force lockout (covers the MCP server)
 * - Generic login errors (no "this username exists" hints)
 * - XML-RPC off, version and discovery tags removed
 * - Admin usernames kept out of author links
 * - File editor in wp-admin disabled
 * - readme.html / license.txt / xmlrpc.php blocked in .htaccess
 * - Extra CSP directives that can't break ads or embeds
 * ---------------------------------------------------------------------- */

/**
 * The visitor's IP. Behind Hostinger's CDN REMOTE_ADDR can be the CDN edge, so
 * the last X-Forwarded-For hop (the one the CDN itself appended) is combined
 * with it. A client can't push out the CDN's own entry, so it can't pose as
 * someone else; at most it splits its own requests into more buckets.
 */
function xf_client_ip() {
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $xff = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? array_map('trim', explode(',', (string) wp_unslash($_SERVER['HTTP_X_FORWARDED_FOR']))) : [];
    $last = $xff ? end($xff) : '';
    $last = filter_var($last, FILTER_VALIDATE_IP) ? $last : '';
    return $last && $last !== $remote ? $remote . '>' . $last : $remote;
}

/* ---- Brute-force lockout: 5 failures in 15 minutes locks that IP for 30 ---- */

const XF_LOGIN_MAX_FAILS = 5;
const XF_LOGIN_WINDOW = 15 * MINUTE_IN_SECONDS;
const XF_LOGIN_LOCK = 30 * MINUTE_IN_SECONDS;

function xf_login_key($suffix) {
    return 'xf_login_' . $suffix . '_' . md5(xf_client_ip());
}

function xf_login_locked() {
    return (bool) get_transient(xf_login_key('lock'));
}

function xf_login_record_failure() {
    $key = xf_login_key('fails');
    $fails = (int) get_transient($key) + 1;
    set_transient($key, $fails, XF_LOGIN_WINDOW);
    if ($fails >= XF_LOGIN_MAX_FAILS) {
        set_transient(xf_login_key('lock'), 1, XF_LOGIN_LOCK);
        delete_transient($key);
    }
}

function xf_login_locked_error() {
    return new WP_Error('xf_locked', 'Too many failed login attempts. Try again in 30 minutes.');
}

// Normal logins (wp-login.php, and XML-RPC if anything turns it back on).
// Runs last: WordPress's own password check (priority 20) ignores earlier errors.
add_filter('authenticate', function ($user) {
    return xf_login_locked() ? xf_login_locked_error() : $user;
}, 999);
add_action('wp_login_failed', 'xf_login_record_failure');
add_action('wp_login', function () {
    delete_transient(xf_login_key('fails'));
});

// Application passwords (REST API, the xf/v1 skill endpoints and the MCP server).
add_action('wp_authenticate_application_password_errors', function (WP_Error $error) {
    if (xf_login_locked()) {
        $error->add('xf_locked', 'Too many failed login attempts. Try again in 30 minutes.');
    }
});
add_action('application_password_failed_authentication', 'xf_login_record_failure');

// Don't tell attackers whether the username or the password was wrong.
add_filter('login_errors', function ($message) {
    return xf_login_locked() ? 'Too many failed login attempts. Try again in 30 minutes.' : '<strong>Error:</strong> The username or password is incorrect.';
});

/* ---- XML-RPC off; version and discovery tags out ---- */

add_filter('xmlrpc_enabled', '__return_false');
// Refuse XML-RPC entirely (its system.* methods answer even when "disabled").
add_action('plugins_loaded', function () {
    if (defined('XMLRPC_REQUEST') && XMLRPC_REQUEST) {
        status_header(403);
        exit;
    }
}, 0);
add_filter('xmlrpc_methods', function () {
    return [];
});
add_filter('wp_headers', function ($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

/* ---- Keep admin login names out of public URLs ---- */

function xf_is_admin_user($user_id) {
    return user_can((int) $user_id, 'manage_options');
}

// Article author links for administrators point at the About page instead of /author/<login>/.
add_filter('author_link', function ($link, $author_id) {
    return xf_is_admin_user($author_id) ? (xf_page_url('about') ?: home_url('/')) : $link;
}, 10, 2);

add_action('template_redirect', function () {
    if (is_author() && xf_is_admin_user(get_queried_object_id())) {
        wp_safe_redirect(xf_page_url('about') ?: home_url('/'), 301);
        exit;
    }
});

// The users list in the REST API is only for logged-in editors.
add_filter('rest_endpoints', function ($endpoints) {
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

/* ---- No editing PHP from the dashboard (a stolen admin login can't plant code that way) ---- */

if (!defined('DISALLOW_FILE_EDIT')) {
    define('DISALLOW_FILE_EDIT', true);
}

/* ---- Extra Content-Security-Policy directives that can't break AdSense or embeds ---- */

// Hostinger's plugin sends "upgrade-insecure-requests" and replaces earlier CSP headers,
// so send one combined policy last.
add_action('send_headers', function () {
    if (!is_admin()) {
        header("Content-Security-Policy: upgrade-insecure-requests; frame-ancestors 'self'; object-src 'none'; base-uri 'self'", true);
    }
}, 9999);

/* ---- Block files that only reveal the WordPress version, plus XML-RPC, at the web server ---- */

add_filter('mod_rewrite_rules', function ($rules) {
    $block = "\n# 100xFounder: hide version files and XML-RPC\n"
        . "RewriteRule ^(readme\\.html|license\\.txt|wp-config-sample\\.php|xmlrpc\\.php)$ - [F,L]\n";
    return str_replace("RewriteBase /\n", "RewriteBase /" . $block, $rules);
});

/** Rewrites .htaccess once per hardening version (it is only written from wp-admin). */
add_action('admin_init', function () {
    $version = '1';
    if (get_option('xf_htaccess_version') === $version || !current_user_can('manage_options')) {
        return;
    }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/misc.php';
    flush_rewrite_rules(true);
    update_option('xf_htaccess_version', $version, false);
});
