<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Reader reviews on startup listings (xf_startup): a 1–5 star rating with an
 * optional short written review, held for moderation, shown once approved.
 *
 *  - Every review is a real visitor's. Nothing is seeded, imported or defaulted,
 *    and other platforms' ratings (Product Hunt, G2) stay text with a source.
 *  - Staff accounts (anyone who can edit posts) cannot submit, so the site never
 *    reviews its own listings.
 *  - The page's headline figure joins approved reviews with the footer star votes
 *    (ratings.php) for the same page, counting a visitor who did both once. It is
 *    published, on the page and in the SoftwareApplication schema alike, only once
 *    there are XF_RATING_MIN_VOTES ratings.
 *  - Abuse: honeypot, a signed token bound to the listing, a per-connection rate
 *    limit, and one review per listing per email and per connection (both hashed).
 *  - Stored in its own table, so reviews never mix with WordPress comments.
 *  - Auto-approval (setting review_auto_approve, on by default): a review nobody has
 *    moderated after XF_REVIEW_AUTO_MINUTES is approved by WP-Cron only if it passes
 *    every check in xf_review_safeguards(); otherwise it stays pending, flagged
 *    "needs manual review". Auto-approved reviews are marked in the admin and can
 *    still be rejected; a review a person has moderated is never auto-approved.
 */

const XF_REVIEWS_SHOWN = 5;     // newest approved reviews shown before "Show more"
const XF_REVIEWS_SCHEMA = 5;    // newest approved reviews put in the structured data
const XF_REVIEW_AUTO_MINUTES = 10;
const XF_REVIEW_DISPOSABLE = ['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com', '10minutemail.net', 'temp-mail.org', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempr.email', 'yopmail.com', 'yopmail.net', 'throwawaymail.com', 'trashmail.com', 'getnada.com', 'nada.email', 'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'mohmal.com', 'emailondeck.com', 'fakeinbox.com', 'spamgourmet.com', 'mailcatch.com', 'moakt.com', 'burnermail.io', 'inboxkitten.com', 'mail.tm', 'tmail.ws', 'tmpmail.org', 'tmpmail.net', 'emltmp.com', 'dropmail.me', '1secmail.com', '1secmail.net', 'cmail.club', 'byom.de', 'mytemp.email', 'harakirimail.com', 'discard.email', 'spam4.me', 'grr.la', 'pokemail.net', 'trbvm.com', 'wegwerfmail.de', 'mailpoof.com', 'linshiyouxiang.net'];
const XF_REVIEW_FREE_MAIL = ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'rediffmail.com', 'aol.com', 'zoho.com', 'gmx.com', 'yandex.com'];
const XF_REVIEW_STATUSES = ['pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected', 'spam' => 'Spam'];

/** Called from xf_install_schema(). */
function xf_reviews_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta("CREATE TABLE " . xf_table('reviews') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  post_id bigint(20) unsigned NOT NULL,
  stars tinyint(3) unsigned NOT NULL,
  title varchar(120) NOT NULL DEFAULT '',
  body text NOT NULL,
  name varchar(60) NOT NULL,
  email varchar(190) NOT NULL,
  email_hash char(32) NOT NULL,
  voter char(32) NOT NULL,
  ip_net char(32) NOT NULL DEFAULT '',
  body_hash char(32) NOT NULL DEFAULT '',
  status varchar(10) NOT NULL DEFAULT 'pending',
  auto tinyint(1) NOT NULL DEFAULT 0,
  flags varchar(255) DEFAULT NULL,
  created_at datetime NOT NULL,
  moderated_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY post_status (post_id,status),
  KEY status (status)
) " . $wpdb->get_charset_collate() . ";");
}

/* ---- Reading ---- */

/** Newest approved reviews for a listing. */
function xf_reviews_approved($post_id, $limit = 100) {
    global $wpdb;
    return $wpdb->get_results($wpdb->prepare(
        'SELECT id, stars, title, body, name, created_at FROM ' . xf_table('reviews') . " WHERE post_id = %d AND status = 'approved' ORDER BY created_at DESC, id DESC LIMIT %d",
        (int) $post_id, (int) $limit
    ));
}

/**
 * The listing's reader rating: approved reviews plus footer votes on its page,
 * a visitor with both counted once (their review wins).
 *
 * @return array{count:int, value:float, reviews:int}
 */
function xf_startup_rating($post_id) {
    static $cache = [];
    $post_id = (int) $post_id;
    if (isset($cache[$post_id])) {
        return $cache[$post_id];
    }
    global $wpdb;
    $rt = xf_table('reviews');
    $rev = $wpdb->get_row($wpdb->prepare("SELECT COUNT(*) AS n, COALESCE(SUM(stars), 0) AS s FROM $rt WHERE post_id = %d AND status = 'approved'", $post_id));
    $votes = $wpdb->get_row($wpdb->prepare(
        'SELECT COUNT(*) AS n, COALESCE(SUM(stars), 0) AS s FROM ' . xf_table('rating_votes') . " WHERE path_hash = %s AND voter NOT IN (SELECT voter FROM $rt WHERE post_id = %d AND status = 'approved')",
        xf_rating_hash(get_permalink($post_id)), $post_id
    ));
    $n = (int) ($rev->n ?? 0) + (int) ($votes->n ?? 0);
    $sum = (int) ($rev->s ?? 0) + (int) ($votes->s ?? 0);
    return $cache[$post_id] = ['count' => $n, 'value' => $n ? round($sum / $n, 1) : 0.0, 'reviews' => (int) ($rev->n ?? 0)];
}

/** The rating only when there are enough to publish; null otherwise. */
function xf_startup_rating_public($post_id) {
    $r = xf_startup_rating($post_id);
    return $r['count'] >= XF_RATING_MIN_VOTES ? $r : null;
}

/** schema.org fields for a listing: aggregateRating and review, or [] below the threshold. */
function xf_startup_rating_schema($post_id) {
    $r = xf_startup_rating_public($post_id);
    if (!$r) {
        return [];
    }
    $out = ['aggregateRating' => [
        '@type' => 'AggregateRating',
        'ratingValue' => $r['value'],
        'ratingCount' => $r['count'],
        'bestRating' => 5,
        'worstRating' => 1,
    ]];
    if ($r['reviews']) {
        $out['aggregateRating']['reviewCount'] = $r['reviews'];
    }
    foreach (xf_reviews_approved($post_id, XF_REVIEWS_SCHEMA) as $rv) {
        $out['review'][] = array_filter([
            '@type' => 'Review',
            'author' => ['@type' => 'Person', 'name' => $rv->name],
            'datePublished' => get_date_from_gmt($rv->created_at, 'Y-m-d'),
            'name' => $rv->title !== '' ? $rv->title : null,
            'reviewBody' => $rv->body !== '' ? $rv->body : null,
            'reviewRating' => ['@type' => 'Rating', 'ratingValue' => (int) $rv->stars, 'bestRating' => 5, 'worstRating' => 1],
        ]);
    }
    return $out;
}

/* ---- Signed token: the server rendered this listing's form ---- */

function xf_review_token($post_id, $ts = null) {
    $ts = $ts ?: time();
    return $ts . '.' . hash_hmac('sha256', 'review|' . (int) $post_id . '|' . $ts, wp_salt('auth'));
}

function xf_review_token_ok($post_id, $token) {
    [$ts, $mac] = array_pad(explode('.', (string) $token, 2), 2, '');
    if (!ctype_digit($ts) || !hash_equals(hash_hmac('sha256', 'review|' . (int) $post_id . '|' . $ts, wp_salt('auth')), $mac)) {
        return false;
    }
    $age = time() - (int) $ts;
    return $age >= 5 && $age <= 14 * DAY_IN_SECONDS; // cached pages carry old tokens; a human takes more than 5 s to write
}

/** True when the request carries a logged-in cookie for site staff (REST drops the user without a nonce, so check the cookie itself). */
function xf_review_from_staff() {
    $uid = is_user_logged_in() ? get_current_user_id() : (int) wp_validate_auth_cookie('', 'logged_in');
    return $uid && user_can($uid, 'edit_posts');
}

/* ---- Submitting ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/review', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'xf_handle_review',
    ]);
});

function xf_handle_review(WP_REST_Request $r) {
    global $wpdb;
    $post_id = (int) $r->get_param('post');
    if ((string) $r->get_param('website') !== '') {
        return ['success' => true, 'message' => 'Thanks. Your review will appear once a moderator has checked it.']; // bot: pretend
    }
    if (!xf_review_token_ok($post_id, $r->get_param('token'))) {
        return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 400]);
    }
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'xf_startup' || $post->post_status !== 'publish') {
        return new WP_Error('bad_post', 'That listing does not take reviews.', ['status' => 400]);
    }
    if (xf_review_from_staff()) {
        return new WP_Error('staff', 'Site staff cannot review listings.', ['status' => 403]);
    }
    if (xf_rate_limited('review', 5, HOUR_IN_SECONDS)) {
        return new WP_Error('rate_limited', 'Too many reviews from your connection. Please try again later.', ['status' => 429]);
    }

    $stars = (int) $r->get_param('stars');
    $title = trim(sanitize_text_field((string) $r->get_param('title')));
    $body = trim(sanitize_textarea_field((string) $r->get_param('body')));
    $name = trim(sanitize_text_field((string) $r->get_param('name')));
    $email = strtolower(sanitize_email((string) $r->get_param('email')));
    $len = function ($s) { return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s); };

    if ($stars < 1 || $stars > 5) {
        return new WP_Error('bad_stars', 'Please choose a rating from 1 to 5 stars.', ['status' => 400]);
    }
    if ($len($title) > 100) {
        return new WP_Error('bad_title', 'Please keep the title under 100 characters.', ['status' => 400]);
    }
    if ($body !== '' && ($len($body) < 20 || $len($body) > 1000)) {
        return new WP_Error('bad_body', 'A written review needs 20 to 1,000 characters (or leave it empty).', ['status' => 400]);
    }
    if ($len($name) < 2 || $len($name) > 60) {
        return new WP_Error('bad_name', 'Please enter the name to show with your review (2–60 characters).', ['status' => 400]);
    }
    if (!is_email($email)) {
        return new WP_Error('bad_email', 'Please enter a valid email address.', ['status' => 400]);
    }
    if (preg_match('#https?://|www\.|\.(com|in|io|ai|net|org)\b#i', $title . ' ' . $body . ' ' . $name)) {
        return new WP_Error('links', 'Please leave links out of your review.', ['status' => 400]);
    }

    $voter = xf_rating_voter();
    $email_hash = md5($email . '|' . wp_salt('nonce'));
    $lock = 'review_' . substr(md5($post_id . '|' . $voter . '|' . $email_hash), 0, 20);
    if (!xf_mutex_acquire($lock, 10, 3)) {
        return new WP_Error('slow_down', 'Please try again in a moment.', ['status' => 429]);
    }
    $table = xf_table('reviews');
    // shortcut: one review per listing per connection too, so people behind one shared (CGNAT) address get one review; drop the voter match if that bites.
    $new_id = 0;
    $dupe = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE post_id = %d AND (email_hash = %s OR voter = %s)", $post_id, $email_hash, $voter));
    if (!$dupe) {
        $wpdb->insert($table, [
            'post_id' => $post_id, 'stars' => $stars, 'title' => $title, 'body' => $body, 'name' => $name,
            'email' => $email, 'email_hash' => $email_hash, 'voter' => $voter, 'ip_net' => xf_review_ip_net(xf_client_ip()),
            'body_hash' => xf_review_body_hash($body), 'status' => 'pending', 'created_at' => gmdate('Y-m-d H:i:s'),
        ]);
        $new_id = (int) $wpdb->insert_id;
    }
    xf_mutex_release($lock);
    if ($dupe) {
        return new WP_Error('duplicate', 'You have already reviewed ' . get_the_title($post) . '. Thank you.', ['status' => 409]);
    }
    if ($new_id && ($row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $new_id)))) {
        $wpdb->update($table, ['flags' => implode('; ', xf_review_safeguards($row))], ['id' => $new_id]); // shown to the moderator straight away
    }
    xf_reviews_notify();
    return ['success' => true, 'message' => 'Thanks. Your review will appear once a moderator has checked it.'];
}

/** At most one email an hour to the site admin while reviews wait. */
function xf_reviews_notify() {
    if (get_transient('xf_review_mail')) {
        return;
    }
    set_transient('xf_review_mail', 1, HOUR_IN_SECONDS);
    $n = xf_review_counts()['pending'];
    wp_mail(
        get_option('admin_email'),
        sprintf('[100xFounder] %d review%s awaiting moderation', $n, $n === 1 ? '' : 's'),
"Readers have left reviews on startup listings. " . (xf_get_setting('review_auto_approve')
            ? 'Reviews that pass the safeguards are approved automatically after ' . XF_REVIEW_AUTO_MINUTES . " minutes unless you moderate them first; the rest wait for you:\n\n"
            : "They stay hidden until you approve them:\n\n") . admin_url('admin.php?page=xf-reviews') . "\n"
    );
}

/* ---- Auto-approval safeguards ---- */

/** Hash of the visitor's network (/24 for IPv4, /48 for IPv6), never the address itself. */
function xf_review_ip_net($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $net = implode('.', array_slice(explode('.', $ip), 0, 3));
    } elseif (($bin = @inet_pton($ip)) !== false) {
        $net = bin2hex(substr($bin, 0, 6));
    } else {
        $net = (string) $ip;
    }
    return md5($net . '|' . wp_salt('nonce'));
}

/** Same text, ignoring case, spacing and punctuation; '' for an empty body. */
function xf_review_body_hash($body) {
    $norm = preg_replace('/[^\p{L}\p{N}]+/u', '', function_exists('mb_strtolower') ? mb_strtolower((string) $body) : strtolower((string) $body));
    return $norm === '' ? '' : md5($norm);
}

/** The listing's founders' addresses: outreach contacts plus whoever launched or claimed it. */
function xf_review_owner_emails($post_id) {
    global $wpdb;
    $emails = (array) $wpdb->get_col($wpdb->prepare('SELECT email FROM ' . xf_table('contacts') . ' WHERE startup_id = %d', $post_id));
    $emails[] = (string) get_post_meta($post_id, '_xf_launch_founder_email', true);
    return array_values(array_unique(array_filter(array_map('strtolower', array_map('trim', $emails)))));
}

/** The listing's own domains: its website, plus its founders' work-email domains. */
function xf_review_owner_domains($post_id) {
    $domains = [];
    $host = strtolower((string) wp_parse_url((string) get_post_meta($post_id, '_xf_website', true), PHP_URL_HOST));
    if ($host) {
        $domains[] = preg_replace('/^www\./', '', $host);
    }
    foreach (xf_review_owner_emails($post_id) as $e) {
        $d = strtolower((string) substr(strrchr((string) $e, '@'), 1));
        if ($d && !in_array($d, XF_REVIEW_FREE_MAIL, true)) {
            $domains[] = $d;
        }
    }
    return array_unique(array_filter($domains));
}

/**
 * Why a review must not be auto-approved; [] when it passes every check.
 *
 * @param object $r a row of the reviews table
 * @return string[]
 */
function xf_review_safeguards($r) {
    global $wpdb;
    $why = [];
    $text = trim($r->title . ' ' . $r->body . ' ' . $r->name);
    $len = function_exists('mb_strlen') ? mb_strlen($r->body) : strlen($r->body);
    if ($len < 20) {
        $why[] = 'no written review of 20+ characters';
    }
    if (preg_match('#https?://|www\.|\b[a-z0-9-]+\.(com|in|io|ai|net|org|co|app|dev|xyz|me)\b#i', $text)) {
        $why[] = 'contains a link';
    }
    if (preg_match('/[^\s@]+@[^\s@]+\.[a-z]{2,}|\b(at|@)\s*\S+\s+dot\s+[a-z]{2,}\b/i', $text)) {
        $why[] = 'contains an email address';
    }
    if (preg_match('/\+?\d[\d\s().-]{7,}\d/', $text) && strlen(preg_replace('/\D/', '', $text)) >= 8) {
        $why[] = 'contains a phone number';
    }
    $letters = preg_replace('/[^\p{L}]/u', '', $r->title . $r->body);
    $upper = preg_replace('/[^\p{Lu}]/u', '', $letters);
    if (mb_strlen($letters) >= 10 && mb_strlen($upper) / mb_strlen($letters) > 0.7) {
        $why[] = 'written in capitals';
    }
    if (preg_match('/(.)\1{4,}/u', $text) || preg_match('/(\S{2,4})\1{3,}/u', $text)) {
        $why[] = 'repeated characters';
    }
    $domain = strtolower((string) substr(strrchr((string) $r->email, '@'), 1));
    foreach (XF_REVIEW_DISPOSABLE as $d) {
        if ($domain === $d || str_ends_with($domain, '.' . $d)) {
            $why[] = 'throwaway email address';
            break;
        }
    }
    if (in_array(strtolower((string) $r->email), xf_review_owner_emails((int) $r->post_id), true)) {
        $why[] = 'email belongs to the product\'s founder (self-review)';
    }
    foreach (xf_review_owner_domains((int) $r->post_id) as $d) {
        if ($domain === $d || str_ends_with($domain, '.' . $d)) {
            $why[] = 'email is from the product\'s own domain (possible self-review)';
            break;
        }
    }
    $table = xf_table('reviews');
    if ($r->body_hash !== '' && $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE body_hash = %s AND id < %d", $r->body_hash, (int) $r->id))) {
        $why[] = 'same text as another review';
    }
    if ($r->ip_net !== '') {
        $from_net = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE post_id = %d AND ip_net = %s AND id <= %d AND created_at > %s",
            (int) $r->post_id, $r->ip_net, (int) $r->id, gmdate('Y-m-d H:i:s', strtotime($r->created_at . ' UTC') - DAY_IN_SECONDS)
        ));
        if ($from_net > 3) {
            $why[] = 'more than 3 reviews of this product from one network in 24 hours';
        }
    }
    return $why;
}

add_filter('cron_schedules', function ($s) {
    $s['xf_5min'] = ['interval' => 5 * MINUTE_IN_SECONDS, 'display' => 'Every 5 minutes (100xFounder)'];
    return $s;
});

add_action('init', function () {
    if (!wp_next_scheduled('xf_reviews_auto')) {
        wp_schedule_event(time() + 60, 'xf_5min', 'xf_reviews_auto');
    }
});

add_action('xf_reviews_auto', 'xf_reviews_auto_approve');

/** Approves unmoderated pending reviews older than XF_REVIEW_AUTO_MINUTES that pass every safeguard. Returns how many. */
function xf_reviews_auto_approve() {
    global $wpdb;
    if (!xf_get_setting('review_auto_approve') || !xf_mutex_acquire('reviews_auto', 300)) {
        return 0;
    }
    $table = xf_table('reviews');
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table WHERE status = 'pending' AND moderated_at IS NULL AND created_at <= %s ORDER BY id LIMIT 200",
        gmdate('Y-m-d H:i:s', time() - XF_REVIEW_AUTO_MINUTES * MINUTE_IN_SECONDS)
    ));
    $done = 0;
    foreach ($rows as $r) {
        $why = xf_review_safeguards($r);
        if ($why) {
            $wpdb->update($table, ['flags' => implode('; ', $why)], ['id' => (int) $r->id]);
            continue;
        }
        $wpdb->update($table, ['status' => 'approved', 'auto' => 1, 'flags' => '', 'moderated_at' => gmdate('Y-m-d H:i:s')], ['id' => (int) $r->id, 'status' => 'pending']);
        clean_post_cache((int) $r->post_id);
        do_action('litespeed_purge_post', (int) $r->post_id);
        $done++;
    }
    xf_mutex_release('reviews_auto');
    return $done;
}

/* ---- Moderation ---- */

/** status => count, every status present. */
function xf_review_counts() {
    global $wpdb;
    $out = array_fill_keys(array_keys(XF_REVIEW_STATUSES), 0);
    foreach ($wpdb->get_results('SELECT status, COUNT(*) AS n FROM ' . xf_table('reviews') . ' GROUP BY status') as $row) {
        $out[$row->status] = (int) $row->n;
    }
    return $out;
}

add_action('admin_menu', function () {
    $pending = xf_review_counts()['pending'];
    $label = 'Reviews' . ($pending ? ' <span class="awaiting-mod">' . (int) $pending . '</span>' : '');
    add_submenu_page('xf', 'Reader reviews', $label, 'moderate_comments', 'xf-reviews', 'xf_reviews_admin_page');
}, 16);

add_action('admin_post_xf_review_mod', function () {
    if (!current_user_can('moderate_comments') || !check_admin_referer('xf_review_mod')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    global $wpdb;
    $id = absint($_GET['id'] ?? 0);
    $to = sanitize_key($_GET['to'] ?? '');
    $post_id = (int) $wpdb->get_var($wpdb->prepare('SELECT post_id FROM ' . xf_table('reviews') . ' WHERE id = %d', $id));
    if ($post_id && isset(XF_REVIEW_STATUSES[$to])) {
        $wpdb->update(xf_table('reviews'), ['status' => $to, 'auto' => 0, 'moderated_at' => gmdate('Y-m-d H:i:s')], ['id' => $id]);
        clean_post_cache($post_id);
        do_action('litespeed_purge_post', $post_id); // Hostinger's page cache, when installed
    }
    wp_safe_redirect(admin_url('admin.php?page=xf-reviews&status=' . rawurlencode(sanitize_key($_GET['back'] ?? 'pending'))));
    exit;
});

function xf_reviews_admin_page() {
    global $wpdb;
    $counts = xf_review_counts();
    $status = sanitize_key($_GET['status'] ?? 'pending');
    $status = isset(XF_REVIEW_STATUSES[$status]) ? $status : 'pending';
    $rows = $wpdb->get_results($wpdb->prepare('SELECT * FROM ' . xf_table('reviews') . ' WHERE status = %s ORDER BY created_at DESC LIMIT 200', $status));
    echo '<div class="wrap"><h1>Reader reviews</h1>';
    echo '<p>Reviews readers leave on startup listings. Only approved ones appear on the site and in its structured data. Reject anything fake, off-topic, written by the product\'s own team, or paid for.</p>';
    echo '<p>' . (xf_get_setting('review_auto_approve')
        ? 'Auto-approval is on: a review you have not moderated within ' . (int) XF_REVIEW_AUTO_MINUTES . ' minutes is approved if it passes every safeguard; the rest stay here marked <strong>needs manual review</strong>.'
        : 'Auto-approval is off: every review waits for you.') . ' <a href="' . esc_url(admin_url('admin.php?page=xf-settings')) . '">Change in Settings</a>.</p>'; // phpcs:ignore -- static text
    echo '<ul class="subsubsub">';
    $links = [];
    foreach (XF_REVIEW_STATUSES as $k => $label) {
        $links[] = '<li><a href="' . esc_url(admin_url('admin.php?page=xf-reviews&status=' . $k)) . '"' . ($k === $status ? ' class="current"' : '') . '>' . esc_html($label) . ' <span class="count">(' . (int) $counts[$k] . ')</span></a>';
    }
    echo implode(' | </li>', $links) . '</li></ul>'; // phpcs:ignore -- escaped above
    echo '<table class="widefat striped" style="clear:both"><thead><tr><th>Listing</th><th>Stars</th><th>Review</th><th>Reviewer</th><th>Received</th><th>Actions</th></tr></thead><tbody>';
    foreach ($rows as $r) {
        $actions = [];
        foreach (['approved' => 'Approve', 'rejected' => 'Reject', 'spam' => 'Spam', 'pending' => 'Back to pending'] as $to => $label) {
            if ($to !== $r->status) {
                $actions[] = '<a href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=xf_review_mod&id=' . (int) $r->id . '&to=' . $to . '&back=' . $status), 'xf_review_mod')) . '">' . esc_html($label) . '</a>';
            }
        }
        echo '<tr><td><a href="' . esc_url(get_permalink((int) $r->post_id)) . '" target="_blank">' . esc_html(get_the_title((int) $r->post_id)) . '</a></td>'
            . '<td>' . str_repeat('★', (int) $r->stars) . '<span style="color:#ccc">' . str_repeat('★', 5 - (int) $r->stars) . '</span></td>'
            . '<td>' . ($r->title !== '' ? '<strong>' . esc_html($r->title) . '</strong><br>' : '') . ($r->body !== '' ? esc_html($r->body) : '<em>Rating only</em>')
            . ((int) $r->auto ? '<br><span class="description" style="color:#2271b1">Auto-approved after ' . (int) XF_REVIEW_AUTO_MINUTES . ' minutes (passed every safeguard)</span>' : '')
            . ($r->status === 'pending' && (string) $r->flags !== '' ? '<br><span class="description" style="color:#b32d2e">Needs manual review: ' . esc_html($r->flags) . '</span>' : '') . '</td>'
            . '<td>' . esc_html($r->name) . '<br><span class="description">' . esc_html($r->email) . '</span></td>'
            . '<td>' . esc_html(get_date_from_gmt($r->created_at, 'j M Y H:i')) . '</td>'
            . '<td>' . implode(' · ', $actions) . '</td></tr>'; // phpcs:ignore -- escaped above
    }
    echo $rows ? '' : '<tr><td colspan="6">No ' . esc_html(strtolower(XF_REVIEW_STATUSES[$status])) . ' reviews.</td></tr>';
    echo '</tbody></table></div>';
}

/* ---- On the page ---- */

function xf_review_stars_html($stars) {
    $stars = (int) $stars;
    return '<span class="xf-rv-stars" role="img" aria-label="' . esc_attr(sprintf('%d out of 5 stars', $stars)) . '">'
        . str_repeat('★', $stars) . '<span class="off">' . str_repeat('★', 5 - $stars) . '</span></span>';
}

/** The reader-reviews block: headline figure, approved reviews, and the form. */
function xf_startup_reviews_html($post_id) {
    $name = get_the_title($post_id);
    $rating = xf_startup_rating($post_id);
    $public = $rating['count'] >= XF_RATING_MIN_VOTES;
    $reviews = xf_reviews_approved($post_id);
    $item = function ($rv) {
        return '<li class="xf-rv"><div class="xf-rv-top">' . xf_review_stars_html($rv->stars)
            . ($rv->title !== '' ? ' <strong>' . esc_html($rv->title) . '</strong>' : '') . '</div>'
            . ($rv->body !== '' ? '<p>' . esc_html($rv->body) . '</p>' : '')
            . '<div class="k">' . esc_html($rv->name) . ' · 100xFounder reader · ' . esc_html(get_date_from_gmt($rv->created_at, 'j M Y')) . '</div></li>';
    };
    ob_start();
    ?>
    <div class="sp-card sp-rating">
        <?php if ($public) : ?>
            <div class="sp-score"><?php echo esc_html(number_format_i18n($rating['value'], 1)); ?><span>/5</span></div>
            <div><strong>From <?php echo esc_html(number_format_i18n($rating['count'])); ?> ratings by 100xFounder readers</strong><br>
                <span class="muted"><?php
                    $stars_only = $rating['count'] - $rating['reviews'];
                    echo esc_html(sprintf('%s review%s', number_format_i18n($rating['reviews']), $rating['reviews'] === 1 ? '' : 's')
                        . ($stars_only ? sprintf(' and %s star rating%s left on this page.', number_format_i18n($stars_only), $stars_only === 1 ? '' : 's') : '.')); ?></span></div>
        <?php else : ?>
            <div><strong>No reader rating yet.</strong><br>
                <span class="muted"><?php echo esc_html(sprintf('We show an average once %d readers have rated %s. Ratings here come only from 100xFounder readers.', XF_RATING_MIN_VOTES, $name)); ?></span></div>
        <?php endif; ?>
    </div>

    <?php if ($reviews) : ?>
        <ol class="xf-rv-list" aria-label="<?php echo esc_attr('Reader reviews of ' . $name . ', newest first'); ?>">
            <?php foreach (array_slice($reviews, 0, XF_REVIEWS_SHOWN) as $rv) echo $item($rv); // phpcs:ignore -- escaped in $item ?>
        </ol>
        <?php if (count($reviews) > XF_REVIEWS_SHOWN) : $more = array_slice($reviews, XF_REVIEWS_SHOWN); ?>
            <details class="xf-rv-more"><summary class="k u"><?php echo esc_html(sprintf('Show %d more review%s', count($more), count($more) === 1 ? '' : 's')); ?></summary>
                <ol class="xf-rv-list"><?php foreach ($more as $rv) echo $item($rv); // phpcs:ignore ?></ol></details>
        <?php endif; ?>
    <?php endif; ?>

    <?php if (is_user_logged_in() && current_user_can('edit_posts')) : ?>
        <p class="sp-note">You are signed in as site staff, so the review form is hidden: the site does not review its own listings.</p>
    <?php else : ?>
        <details class="xf-rv-write">
            <summary class="btn">Write a review</summary>
            <form class="xf-rv-form" data-endpoint="<?php echo esc_url(rest_url('xf/v1/review')); ?>" novalidate>
                <input type="hidden" name="post" value="<?php echo (int) $post_id; ?>">
                <input type="hidden" name="token" value="<?php echo esc_attr(xf_review_token($post_id)); ?>">
                <fieldset class="xf-rv-pick">
                    <legend>Your rating of <?php echo esc_html($name); ?> <span aria-hidden="true">*</span></legend>
                    <?php for ($i = 5; $i >= 1; $i--) : $fid = 'xf-rv-s' . $i; ?>
                        <input type="radio" id="<?php echo esc_attr($fid); ?>" name="stars" value="<?php echo (int) $i; ?>" required>
                        <label for="<?php echo esc_attr($fid); ?>" title="<?php echo esc_attr(sprintf('%d out of 5', $i)); ?>"><span aria-hidden="true">★</span><span class="screen-reader-text"><?php echo esc_html(sprintf('%d star%s', $i, $i === 1 ? '' : 's')); ?></span></label>
                    <?php endfor; ?>
                </fieldset>
                <label><span>Title (optional)</span><input type="text" name="title" maxlength="100" autocomplete="off"></label>
                <label><span>Your review (optional, 20–1,000 characters)</span><textarea name="body" rows="4" minlength="20" maxlength="1000"></textarea></label>
                <div class="xf-rv-grid">
                    <label><span>Name to show *</span><input type="text" name="name" required minlength="2" maxlength="60" autocomplete="name"></label>
                    <label><span>Email (never shown) *</span><input type="email" name="email" required maxlength="190" autocomplete="email"></label>
                </div>
                <input class="xf-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
                <p class="hint">A moderator checks every review before it appears. We use your email only to confirm the review is genuine and to stop duplicates. Please don’t review a product you make, work for or are paid to promote.</p>
                <button type="submit" class="btn btn-w">Submit review</button>
                <p class="xf-rv-msg" role="status" aria-live="polite"></p>
            </form>
        </details>
        <script>
        (function(){var f=document.currentScript.previousElementSibling.querySelector('form');if(!f||!window.fetch)return;
        f.addEventListener('submit',function(e){e.preventDefault();var msg=f.querySelector('.xf-rv-msg'),btn=f.querySelector('button');
         if(!f.checkValidity()){f.reportValidity();return}
         var d={};new FormData(f).forEach(function(v,k){d[k]=v});btn.disabled=true;msg.textContent='Sending…';
         fetch(f.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
          .then(function(r){return r.json()}).then(function(j){
            if(j&&j.success){f.innerHTML='';f.appendChild(msg);msg.textContent=j.message}else{btn.disabled=false;msg.textContent=(j&&j.message)||'Could not send that. Please try again.'}
          }).catch(function(){btn.disabled=false;msg.textContent='Could not send that. Please try again.'});
        });})();
        </script>
    <?php endif;
    return ob_get_clean();
}
