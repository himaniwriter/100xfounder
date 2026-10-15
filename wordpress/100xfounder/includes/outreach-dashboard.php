<?php
/**
 * Founder outreach campaigns: templates, campaigns, a per-email log with open
 * and click tracking, and a wp-admin dashboard (100xFounder → Founder outreach).
 *
 * Used to offer sponsored articles and featured listings (see the Advertise page).
 * Compliance is built in and can't be switched off per email:
 *  - every email carries the postal address and a one-click unsubscribe link,
 *    plus List-Unsubscribe / List-Unsubscribe-Post headers (RFC 8058);
 *  - the suppression list (xf_suppressions) is checked right before each send;
 *  - a daily cap (default 30 in any 24 hours, shared with the founder sequence)
 *    is sent in small WP-Cron batches during working hours;
 *  - a reply, bounce or unsubscribe stops every queued email to that address.
 * Dry-run mode (on by default) renders and logs emails without sending them.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_CAMP_STATUSES = ['queued', 'sent', 'replied', 'bounced', 'unsubscribed', 'failed', 'skipped'];
const XF_CAMP_TAGS = ['first_name', 'startup', 'article_url', 'listing_url', 'sender_name', 'signature', 'site_url', 'advertise_url'];

/* -------------------------------------------------------------------------
 * Schema and settings
 * ---------------------------------------------------------------------- */

/** Called from xf_install_schema() whenever XF_DB_VERSION changes. */
function xf_camp_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();

    dbDelta("CREATE TABLE " . xf_table('email_templates') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(190) NOT NULL,
  offer varchar(30) NOT NULL DEFAULT 'other',
  subject varchar(255) NOT NULL,
  body longtext NOT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('campaigns') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(190) NOT NULL,
  offer varchar(30) NOT NULL DEFAULT 'other',
  subject varchar(255) NOT NULL,
  body longtext NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'draft',
  ai_approval tinyint(1) unsigned NOT NULL DEFAULT 1,
  followup_days varchar(20) NOT NULL DEFAULT '',
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY status (status)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('email_log') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  campaign_id bigint(20) unsigned NOT NULL,
  email varchar(190) NOT NULL,
  first_name varchar(100) NOT NULL DEFAULT '',
  startup varchar(190) NOT NULL DEFAULT '',
  article_url varchar(500) NOT NULL DEFAULT '',
  listing_url varchar(500) NOT NULL DEFAULT '',
  subject varchar(255) NOT NULL DEFAULT '',
  body longtext,
  token varchar(40) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'queued',
  dry_run tinyint(1) unsigned NOT NULL DEFAULT 0,
  error varchar(500) DEFAULT NULL,
  message_id varchar(255) DEFAULT NULL,
  queued_at datetime NOT NULL,
  sent_at datetime DEFAULT NULL,
  opens int(10) unsigned NOT NULL DEFAULT 0,
  first_open_at datetime DEFAULT NULL,
  last_open_at datetime DEFAULT NULL,
  clicks int(10) unsigned NOT NULL DEFAULT 0,
  first_click_at datetime DEFAULT NULL,
  last_click_at datetime DEFAULT NULL,
  replied_at datetime DEFAULT NULL,
  updated_at datetime NOT NULL,
  step tinyint(1) unsigned NOT NULL DEFAULT 0,
  ai_status varchar(20) NOT NULL DEFAULT '',
  ai_subject varchar(255) NOT NULL DEFAULT '',
  ai_body longtext,
  ai_note varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY  (id),
  UNIQUE KEY token (token),
  UNIQUE KEY campaign_email_step (campaign_id,email,step),
  KEY email (email),
  KEY status (status),
  KEY sent_at (sent_at)
) $charset;");

    // Follow-ups are extra rows for the same address (step 1, 2), so the old one-row-per-address key goes.
    $log = xf_table('email_log');
    // Dropped only once the new key exists: without either one, a cron overlap could queue duplicate follow-ups.
    // SHOW INDEX ... WHERE works on MySQL 5.7/8 and MariaDB; both checks make a re-run a no-op.
    $has = function ($key) use ($wpdb, $log) {
        return (bool) $wpdb->get_var($wpdb->prepare("SHOW INDEX FROM $log WHERE Key_name = %s", $key)); // phpcs:ignore
    };
    if ($has('campaign_email') && $has('campaign_email_step')) {
        $wpdb->query("ALTER TABLE $log DROP INDEX campaign_email"); // phpcs:ignore
    }

    if (!(int) $wpdb->get_var('SELECT COUNT(*) FROM ' . xf_table('email_templates'))) {
        foreach (xf_camp_starter_templates() as $t) {
            $wpdb->insert(xf_table('email_templates'), $t + ['created_at' => xf_now(), 'updated_at' => xf_now()]);
        }
    }
}

/**
 * Starter copy. Honest and low-pressure: no deadlines, no "only N spots",
 * no ranking or traffic promises, prices only on request (manual invoice).
 */
function xf_camp_starter_templates() {
    return [
        [
            'name' => 'Sponsored article',
            'offer' => 'sponsored_article',
            'subject' => 'A sponsored article about {startup} on 100xFounder',
            'body' => "Hi {first_name},

I'm writing from 100xFounder ({site_url}), a site covering new startups, AI tools and founders, mostly for readers in India.

[if article_url]We wrote about {startup} recently: {article_url}
[/if]
If you'd like a fuller piece about {startup}, we offer sponsored articles. You share the story and the facts, our editors write and fact-check it with you, and it's published clearly labelled \"Sponsored\", with paid links marked as sponsored, as Google requires. We can't promise rankings or a set amount of traffic, and we won't pretend otherwise.

We bill by invoice. If you'd like the price and details, just reply to this email. If it isn't a fit, there's no need to reply.

More about our ad options: {advertise_url}

{signature}",
        ],
        [
            'name' => 'Featured startup listing',
            'offer' => 'featured_listing',
            'subject' => 'Featuring {startup} on 100xFounder',
            'body' => "Hi {first_name},

I'm writing from 100xFounder ({site_url}), a directory and news site for new startups and AI tools.

[if listing_url]{startup} is listed in our directory here: {listing_url}
[/if]
We also offer a paid featured listing: priority review and placement in the directory and on the homepage, marked as featured. It's optional, and a basic listing stays as it is whether or not you take it.

We bill by invoice. If you'd like the price, reply to this email and I'll send it over. If not, no reply needed.

Details of all our options: {advertise_url}

{signature}",
        ],
    ];
}

function xf_camp_offers() {
    return ['sponsored_article' => 'Sponsored article', 'featured_listing' => 'Featured listing', 'other' => 'Other'];
}

function xf_camp_settings() {
    $saved = get_option('xf_camp_settings', []);
    return array_merge([
        'enabled' => 0,
        'dry_run' => 1,
        'daily_cap' => 30,
        'batch_size' => 3,
        'hour_start' => 9,
        'hour_end' => 19,
        'auto_approve_minutes' => 10,
    ], is_array($saved) ? $saved : []);
}

/* -------------------------------------------------------------------------
 * Rendering
 * ---------------------------------------------------------------------- */

function xf_camp_vars($row) {
    $s = xf_get_settings();
    return [
        'first_name' => $row->first_name !== '' ? $row->first_name : 'there',
        'startup' => $row->startup !== '' ? $row->startup : 'your company',
        'article_url' => $row->article_url,
        'listing_url' => $row->listing_url,
        'sender_name' => $s['from_name'],
        // "Asha Rao\n100xFounder", or just the team when the From name is the brand itself.
        'signature' => stripos($s['from_name'], '100xfounder') !== false || trim($s['from_name']) === '' ? 'The 100xFounder team' : $s['from_name'] . "\n100xFounder",
        'site_url' => home_url('/'),
        'advertise_url' => home_url('/advertise/'),
    ];
}

/** Merge tags {tag} plus optional blocks [if tag]…[/if] that vanish when the tag is empty. */
function xf_camp_merge($text, array $vars) {
    $text = preg_replace_callback('/\[if (\w+)\]\R?(.*?)\[\/if\](\R?)/s', function ($m) use ($vars) {
        return !empty($vars[$m[1]]) ? $m[2] . $m[3] : '';
    }, $text);
    $text = preg_replace_callback('/\{(\w+)\}/', function ($m) use ($vars) {
        return array_key_exists($m[1], $vars) ? (string) $vars[$m[1]] : '';
    }, $text);
    return preg_replace("/\n{3,}/", "\n\n", $text);
}

/** Merge tags used in $text that we don't know, so typos never reach a founder. */
function xf_camp_unknown_tags($text) {
    preg_match_all('/\{(\w+)\}|\[if (\w+)\]/', $text, $m);
    $used = array_filter(array_merge($m[1], $m[2]));
    return array_values(array_diff(array_unique($used), XF_CAMP_TAGS));
}

function xf_camp_footer($row, $unsubscribe_url) {
    $s = xf_get_settings();
    $who = $row->startup !== '' ? $row->startup : 'your company';
    return implode("\n", array_filter([
        '--',
        "You're getting this because this address is listed as a contact for {$who}.",
        "Unsubscribe with one click and we won't email you again: {$unsubscribe_url}",
        trim($s['postal_address']),
    ]));
}

function xf_camp_sign($token, $url) {
    return substr(hash_hmac('sha256', $token . '|' . $url, wp_salt('auth') . 'xf_camp_click'), 0, 32);
}

function xf_camp_b64url($s) {
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function xf_camp_click_url($token, $url) {
    return add_query_arg(['u' => xf_camp_b64url($url), 's' => xf_camp_sign($token, $url)], rest_url('xf/v1/t/c/' . $token));
}

function xf_camp_open_url($token) {
    return rest_url('xf/v1/t/o/' . $token . '.gif');
}

/** The links in a stored plain-text body, cut exactly as xf_camp_html() cuts them. */
function xf_camp_body_links($text) {
    preg_match_all('#https?://[^\s<>"\']+#', $text, $m);
    return array_map(function ($u) {
        return preg_replace('/[.,;:!?)]+$/', '', $u);
    }, $m[0]);
}

/** Plain text to HTML: escaped, links tracked (except unsubscribe), plus the open pixel. */
function xf_camp_html($text, $token, $unsubscribe_url) {
    $parts = preg_split('#(https?://[^\s<>"\']+)#', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
    $html = '';
    foreach ($parts as $i => $part) {
        if ($i % 2 === 0) {
            $html .= esc_html($part);
            continue;
        }
        $trail = '';
        if (preg_match('/[.,;:!?)]+$/', $part, $m)) {
            $trail = $m[0];
            $part = substr($part, 0, -strlen($trail));
        }
        $href = $part === $unsubscribe_url ? $part : xf_camp_click_url($token, $part);
        $html .= '<a href="' . esc_url($href) . '">' . esc_html($part) . '</a>' . esc_html($trail);
    }
    return '<!doctype html><html><body><div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:600px">'
        . nl2br($html, false)
        . '</div><img src="' . esc_url(xf_camp_open_url($token)) . '" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px"></body></html>';
}

/** Builds the final email for a log row from its campaign's current copy. */
function xf_camp_build($row, $campaign) {
    $vars = xf_camp_vars($row);
    $unsubscribe_url = xf_unsubscribe_url($row->token);
    $ai = ($row->ai_status ?? '') === 'approved' && (string) $row->ai_body !== '';
    $subject = trim(preg_replace('/\s+/', ' ', $ai && $row->ai_subject !== '' ? $row->ai_subject : xf_camp_merge($campaign->subject, $vars)));
    // The footer is always added here, after any AI text, so it can never be rewritten or dropped.
    $text = trim($ai ? $row->ai_body : xf_camp_merge($campaign->body, $vars)) . "\n\n" . xf_camp_footer($row, $unsubscribe_url);
    return [
        'subject' => $subject,
        'text' => $text,
        'html' => xf_camp_html($text, $row->token, $unsubscribe_url),
        'unsubscribe_url' => $unsubscribe_url,
    ];
}

/* -------------------------------------------------------------------------
 * Recipients
 * ---------------------------------------------------------------------- */

/**
 * Queues one recipient. Returns 'added', 'duplicate', 'suppressed' or 'invalid'.
 * Suppressed (unsubscribed or bounced) addresses are never queued.
 */
function xf_camp_add_recipient($campaign_id, $email, $first_name = '', $startup = '', $article_url = '', $listing_url = '') {
    global $wpdb;
    $email = strtolower(sanitize_email($email));
    if (!$email || !is_email($email)) {
        return 'invalid';
    }
    if (xf_is_suppressed($email)) {
        return 'suppressed';
    }
    $log = xf_table('email_log');
    if ($wpdb->get_var($wpdb->prepare("SELECT 1 FROM $log WHERE campaign_id = %d AND email = %s", $campaign_id, $email))) {
        return 'duplicate';
    }
    $ok = $wpdb->insert($log, [
        'campaign_id' => (int) $campaign_id,
        'email' => $email,
        'first_name' => mb_substr(sanitize_text_field($first_name), 0, 100),
        'startup' => mb_substr(sanitize_text_field($startup), 0, 190),
        'article_url' => mb_substr(esc_url_raw($article_url), 0, 500),
        'listing_url' => mb_substr(esc_url_raw($listing_url), 0, 500),
        'token' => wp_generate_password(32, false),
        'status' => 'queued',
        'queued_at' => xf_now(),
        'updated_at' => xf_now(),
    ]);
    return $ok ? 'added' : 'duplicate';
}

/** Lines of "email, first name, startup, article URL" (only email is required). */
function xf_camp_add_lines($campaign_id, $text) {
    $counts = ['added' => 0, 'duplicate' => 0, 'suppressed' => 0, 'invalid' => 0];
    foreach (preg_split('/\R/', (string) $text) as $line) {
        if (trim($line) === '') {
            continue;
        }
        $cols = array_map('trim', str_getcsv($line));
        $result = xf_camp_add_recipient($campaign_id, $cols[0] ?? '', $cols[1] ?? '', $cols[2] ?? '', $cols[3] ?? '');
        $counts[$result]++;
    }
    return $counts;
}

/** Founders already found by the Product Hunt routine, minus anyone who opted out, bounced or was paused. */
function xf_camp_add_from_contacts($campaign_id) {
    global $wpdb;
    $counts = ['added' => 0, 'duplicate' => 0, 'suppressed' => 0, 'invalid' => 0];
    $rows = $wpdb->get_results('SELECT email, name, startup_id FROM ' . xf_table('contacts') . " WHERE status NOT IN ('unsubscribed','bounced','paused')");
    foreach ($rows as $c) {
        $startup = get_post($c->startup_id);
        $result = xf_camp_add_recipient(
            $campaign_id, $c->email,
            $c->name ? strtok($c->name, ' ') : '',
            $startup ? get_the_title($startup) : '',
            '',
            $startup && $startup->post_status === 'publish' ? get_permalink($startup) : ''
        );
        $counts[$result]++;
    }
    return $counts;
}

/* -------------------------------------------------------------------------
 * Sending (WP-Cron batches)
 * ---------------------------------------------------------------------- */

function xf_camp_block_reason($manual = false) {
    $c = xf_camp_settings();
    $s = xf_get_settings();
    if (empty($c['enabled'])) return 'Campaign sending is turned off (Settings tab).';
    if (trim($s['postal_address']) === '') return 'Postal address is not set (100xFounder → Settings). Every email must carry it.';
    if (empty($c['dry_run']) && !xf_smtp_configured()) return 'SMTP mailbox is not configured (100xFounder → Settings).';
    if (!$manual) {
        $hour = (int) wp_date('G');
        if ($hour < (int) $c['hour_start'] || $hour >= (int) $c['hour_end']) {
            return 'Outside sending hours.';
        }
    }
    return null;
}

/** Emails sent in the last 24 hours, counting the founder sequence too (same mailbox). */
function xf_camp_sent_24h($dry_run) {
    global $wpdb;
    $since = gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS);
    $n = (int) $wpdb->get_var($wpdb->prepare(
        'SELECT COUNT(*) FROM ' . xf_table('email_log') . ' WHERE sent_at >= %s AND dry_run = %d',
        $since, $dry_run ? 1 : 0
    ));
    if (!$dry_run) {
        $n += (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('messages') . " WHERE status = 'sent' AND sent_at >= %s", $since));
    }
    return $n;
}

function xf_camp_send_batch($manual = false) {
    global $wpdb;
    $blocked = xf_camp_block_reason($manual);
    if ($blocked) {
        return ['skipped' => $blocked, 'sent' => 0, 'failed' => 0];
    }
    // An atomic lock: WP-Cron, the hPanel cron URL and the "Send now" button can overlap,
    // and two batches reading the same queued rows would email the same founder twice.
    if (!xf_mutex_acquire('camp_send', 5 * MINUTE_IN_SECONDS)) {
        return ['skipped' => 'Another batch is running.', 'sent' => 0, 'failed' => 0];
    }

    $c = xf_camp_settings();
    $dry = !empty($c['dry_run']);
    $remaining = max((int) $c['daily_cap'] - xf_camp_sent_24h($dry), 0);
    $limit = min(max((int) $c['batch_size'], 1), $remaining);
    if ($limit === 0) {
        xf_mutex_release('camp_send');
        return ['skipped' => 'Daily cap reached.', 'sent' => 0, 'failed' => 0];
    }

    $log = xf_table('email_log');
    $campaigns = xf_table('campaigns');
    // Owner option: AI drafts nobody reviewed within N minutes approve themselves (0 = never).
    // Mock/placeholder copy never auto-approves.
    $auto = (int) $c['auto_approve_minutes'];
    if ($auto > 0) {
        $wpdb->query($wpdb->prepare(
            "UPDATE $log SET ai_status = 'approved', ai_note = CONCAT(ai_note, ' [auto-approved]') WHERE status = 'queued' AND ai_status = 'draft' AND ai_body <> '' AND ai_body NOT LIKE %s AND updated_at <= %s",
            '%' . $wpdb->esc_like('[MOCK]') . '%', gmdate('Y-m-d H:i:s', time() - $auto * MINUTE_IN_SECONDS)
        ));
    }
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT l.* FROM $log l INNER JOIN $campaigns c ON c.id = l.campaign_id WHERE l.status = 'queued' AND c.status = 'active' AND l.ai_status IN ('', 'approved') ORDER BY l.id ASC LIMIT %d",
        $limit
    ));
    $sent = 0;
    $failed = 0;
    $skipped = 0;
    $mailer = null;

    foreach ($rows as $row) {
        // Checked at send time too: someone may have opted out after being queued.
        if (xf_is_suppressed($row->email) || xf_camp_has_stopped($row->email)) {
            $wpdb->update($log, ['status' => 'skipped', 'error' => 'Unsubscribed, bounced or replied before this was sent.', 'updated_at' => xf_now()], ['id' => $row->id]);
            $skipped++;
            continue;
        }
        $campaign = $wpdb->get_row($wpdb->prepare("SELECT * FROM $campaigns WHERE id = %d", $row->campaign_id));
        $email = xf_camp_build($row, $campaign);

        if ($dry) {
            $wpdb->update($log, [
                'subject' => $email['subject'], 'body' => $email['text'], 'status' => 'sent', 'dry_run' => 1,
                'error' => null, 'sent_at' => xf_now(), 'updated_at' => xf_now(),
            ], ['id' => $row->id]);
            $sent++;
            continue;
        }

        try {
            if (!$mailer) {
                $mailer = xf_new_mailer();
            }
            $mailer->clearAllRecipients();
            $mailer->clearCustomHeaders();
            $mailer->clearAttachments();
            $mailer->addAddress($row->email);
            $mailer->isHTML(true);
            $mailer->Subject = $email['subject'];
            $mailer->Body = $email['html'];
            $mailer->AltBody = $email['text'];
            $mailer->MessageID = '';
            $mailer->addCustomHeader('List-Unsubscribe', '<' . $email['unsubscribe_url'] . '>');
            $mailer->addCustomHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
            if ($thread = xf_camp_thread_ids($row)) { // follow-ups reply in the first email's thread
                $mailer->addCustomHeader('In-Reply-To', end($thread));
                $mailer->addCustomHeader('References', implode(' ', $thread));
            }
            $mailer->send();
            $wpdb->update($log, [
                'subject' => $email['subject'], 'body' => $email['text'], 'status' => 'sent', 'dry_run' => 0, 'error' => null,
                'message_id' => $mailer->getLastMessageID(), 'sent_at' => xf_now(), 'updated_at' => xf_now(),
            ], ['id' => $row->id]);
            $sent++;
        } catch (Exception $e) {
            $wpdb->update($log, [
                'subject' => $email['subject'], 'body' => $email['text'], 'status' => 'failed',
                'error' => substr($e->getMessage(), 0, 500), 'updated_at' => xf_now(),
            ], ['id' => $row->id]);
            $failed++;
        }
    }
    if ($mailer) {
        $mailer->smtpClose();
    }
    xf_mutex_release('camp_send');
    return ['sent' => $sent, 'failed' => $failed, 'skipped' => $skipped, 'dry_run' => $dry];
}

/** True once an address replied, bounced or unsubscribed in any campaign. */
function xf_camp_has_stopped($email) {
    global $wpdb;
    return (bool) $wpdb->get_var($wpdb->prepare(
        'SELECT 1 FROM ' . xf_table('email_log') . " WHERE email = %s AND status IN ('replied','bounced','unsubscribed') LIMIT 1",
        $email
    ));
}

/** Marks an address replied/bounced/unsubscribed and cancels everything still queued for it. */
function xf_camp_stop_address($email, $status, $log_id = 0) {
    global $wpdb;
    $log = xf_table('email_log');
    $email = strtolower($email);
    $now = xf_now();
    if ($status === 'unsubscribed' || $status === 'bounced') {
        xf_suppress_email($email, $status);
    }
    $fields = ['status' => $status, 'updated_at' => $now];
    if ($status === 'replied') {
        $fields['replied_at'] = $now;
    }
    if ($log_id) {
        $wpdb->update($log, $fields, ['id' => $log_id]);
    } else {
        // The most recent sent email to this address gets the status.
        $last = $wpdb->get_var($wpdb->prepare("SELECT id FROM $log WHERE email = %s AND status = 'sent' ORDER BY sent_at DESC LIMIT 1", $email));
        if ($last) {
            $wpdb->update($log, $fields, ['id' => (int) $last]);
        }
    }
    $wpdb->query($wpdb->prepare(
        "UPDATE $log SET status = 'skipped', error = %s, updated_at = %s WHERE email = %s AND status = 'queued'",
        'Stopped: the recipient ' . $status . '.', $now, $email
    ));
}

/** Reply and bounce detection over IMAP, reusing the founder-sequence scanner. */
function xf_camp_check_replies() {
    global $wpdb;
    if (!function_exists('xf_imap_scan')) {
        return ['skipped' => 'IMAP scanner unavailable.'];
    }
    $rows = $wpdb->get_results($wpdb->prepare(
        'SELECT email, MIN(sent_at) AS first_sent FROM ' . xf_table('email_log') . " WHERE status = 'sent' AND dry_run = 0 AND sent_at >= %s GROUP BY email",
        gmdate('Y-m-d H:i:s', time() - 30 * DAY_IN_SECONDS)
    ));
    if (!$rows) {
        return ['scanned' => 0, 'replies' => 0, 'bounces' => 0];
    }
    $since = min(array_map('strtotime', wp_list_pluck($rows, 'first_sent'))) - DAY_IN_SECONDS;
    $scan = xf_imap_scan(wp_list_pluck($rows, 'email'), $since);
    if (isset($scan['skipped'])) {
        return $scan;
    }
    foreach (array_keys($scan['replied']) as $email) {
        xf_camp_stop_address($email, 'replied');
    }
    foreach (array_keys($scan['bounced']) as $email) {
        xf_camp_stop_address($email, 'bounced');
    }
    return ['scanned' => $scan['scanned'], 'replies' => count($scan['replied']), 'bounces' => count($scan['bounced'])];
}

/** One WP-Cron tick: check replies at most hourly, then send a small batch. */
function xf_camp_tick() {
    $result = [];
    if (!get_transient('xf_camp_replies_checked')) {
        set_transient('xf_camp_replies_checked', 1, HOUR_IN_SECONDS);
        $result['replies'] = xf_camp_check_replies();
    }
    if (function_exists('xf_camp_queue_followups')) {
        $result['followups'] = xf_camp_queue_followups();
    }
    $result['send'] = xf_camp_send_batch();
    update_option('xf_camp_last_tick', ['at' => time(), 'result' => $result], false);
    return $result;
}

add_filter('cron_schedules', function ($schedules) {
    $schedules['xf_quarter_hour'] = ['interval' => 15 * MINUTE_IN_SECONDS, 'display' => 'Every 15 minutes (100xFounder campaigns)'];
    return $schedules;
});

add_action('init', function () {
    if (!wp_next_scheduled('xf_campaign_tick')) {
        wp_schedule_event(time() + 5 * MINUTE_IN_SECONDS, 'xf_quarter_hour', 'xf_campaign_tick');
    }
});
add_action('xf_campaign_tick', 'xf_camp_tick');
register_deactivation_hook(XF_FILE, function () {
    wp_clear_scheduled_hook('xf_campaign_tick');
});

/* -------------------------------------------------------------------------
 * Public endpoints: open pixel, signed click redirect, unsubscribe
 * ---------------------------------------------------------------------- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/t/o/(?P<token>[A-Za-z0-9]{32})(?:\.gif)?', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_camp_serve_pixel',
    ]);
    register_rest_route('xf/v1', '/t/c/(?P<token>[A-Za-z0-9]{32})', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_camp_serve_click',
    ]);
    // For a server cron (hPanel), like /xf/v1/run: every 15 minutes, ?key=CRON_KEY.
    register_rest_route('xf/v1', '/campaign-tick', [
        'methods' => ['GET', 'POST'],
        'permission_callback' => function (WP_REST_Request $request) {
            $key = (string) xf_get_setting('cron_key');
            return $key !== '' && hash_equals($key, (string) $request->get_param('key'));
        },
        'callback' => function () {
            return rest_ensure_response(xf_camp_tick());
        },
    ]);
});

function xf_camp_serve_pixel(WP_REST_Request $request) {
    global $wpdb;
    $now = xf_now();
    $wpdb->query($wpdb->prepare(
        'UPDATE ' . xf_table('email_log') . ' SET opens = opens + 1, first_open_at = COALESCE(first_open_at, %s), last_open_at = %s WHERE token = %s AND sent_at IS NOT NULL',
        $now, $now, $request['token']
    ));
    nocache_headers();
    header('Content-Type: image/gif');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    exit;
}

/**
 * Redirects only to a URL that was in the email: the signature must match
 * (HMAC of token + URL), or the URL must appear in that email's stored body.
 * Anything else goes to the home page, so this is never an open redirect.
 */
function xf_camp_serve_click(WP_REST_Request $request) {
    global $wpdb;
    $token = $request['token'];
    $raw = (string) $request->get_param('u');
    $url = base64_decode(strtr($raw, '-_', '+/'), true);
    $sig = (string) $request->get_param('s');
    $log = xf_table('email_log');
    $row = $wpdb->get_row($wpdb->prepare("SELECT id, body FROM $log WHERE token = %s", $token));

    // The fallback compares whole links, not substrings: "https://goo" is a prefix of
    // "https://google.com" in the body, and a substring match would redirect to goo.
    $valid = $row && is_string($url) && preg_match('#^https?://#i', $url)
        && (hash_equals(xf_camp_sign($token, $url), $sig) || in_array($url, xf_camp_body_links((string) $row->body), true));
    if (!$valid) {
        wp_safe_redirect(home_url('/'));
        exit;
    }
    $now = xf_now();
    // A click proves the email was opened even when images were blocked.
    $wpdb->query($wpdb->prepare(
        "UPDATE $log SET clicks = clicks + 1, first_click_at = COALESCE(first_click_at, %s), last_click_at = %s,
         opens = CASE WHEN opens = 0 THEN 1 ELSE opens END, first_open_at = COALESCE(first_open_at, %s), last_open_at = COALESCE(last_open_at, %s)
         WHERE id = %d",
        $now, $now, $now, $now, $row->id
    ));
    nocache_headers();
    wp_redirect(esc_url_raw($url), 302); // phpcs:ignore WordPress.Security.SafeRedirect -- verified above.
    exit;
}

/**
 * Campaign unsubscribes use the site's existing /unsubscribe/ page. This runs
 * before the founder-sequence handler and only acts on campaign tokens.
 */
add_action('template_redirect', function () {
    global $wpdb;
    $pages = get_option('xf_pages', []);
    if (empty($pages['unsubscribe']) || !is_page($pages['unsubscribe']) || ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    $token = isset($_REQUEST['t']) ? sanitize_text_field(wp_unslash($_REQUEST['t'])) : '';
    if (!preg_match('/^[A-Za-z0-9]{32}$/', $token)) {
        return;
    }
    $row = $wpdb->get_row($wpdb->prepare('SELECT id, email FROM ' . xf_table('email_log') . ' WHERE token = %s', $token));
    if (!$row) {
        return;
    }
    xf_camp_stop_address($row->email, 'unsubscribed', (int) $row->id);
    if (isset($_POST['List-Unsubscribe']) && $_POST['List-Unsubscribe'] === 'One-Click') {
        status_header(200);
        exit;
    }
    wp_safe_redirect(xf_page_url('unsubscribe', ['done' => 1]));
    exit;
}, 5);

/* -------------------------------------------------------------------------
 * Stats and queries
 * ---------------------------------------------------------------------- */

function xf_camp_stats() {
    global $wpdb;
    $log = xf_table('email_log');
    $campaigns = xf_table('campaigns');
    return $wpdb->get_results("SELECT c.id, c.name, c.offer, c.status,
        COUNT(l.id) AS total,
        SUM(CASE WHEN l.status = 'queued' THEN 1 ELSE 0 END) AS queued,
        SUM(CASE WHEN l.sent_at IS NOT NULL THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN l.sent_at IS NOT NULL AND l.dry_run = 1 THEN 1 ELSE 0 END) AS dry,
        SUM(CASE WHEN l.opens > 0 THEN 1 ELSE 0 END) AS opened,
        SUM(CASE WHEN l.clicks > 0 THEN 1 ELSE 0 END) AS clicked,
        SUM(CASE WHEN l.status = 'replied' THEN 1 ELSE 0 END) AS replied,
        SUM(CASE WHEN l.status = 'bounced' THEN 1 ELSE 0 END) AS bounced,
        SUM(CASE WHEN l.status = 'unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed,
        SUM(CASE WHEN l.status = 'failed' THEN 1 ELSE 0 END) AS failed
        FROM $campaigns c LEFT JOIN $log l ON l.campaign_id = c.id
        GROUP BY c.id, c.name, c.offer, c.status ORDER BY c.id DESC");
}

function xf_camp_rate($n, $of) {
    return $of > 0 ? round(100 * $n / $of, 1) . '%' : '—';
}

/** Reads the email-list filters from the request. */
function xf_camp_filters() {
    $f = [
        'campaign' => isset($_REQUEST['campaign']) ? absint($_REQUEST['campaign']) : 0,
        'status' => isset($_REQUEST['status']) ? sanitize_key(wp_unslash($_REQUEST['status'])) : '',
        'opened' => isset($_REQUEST['opened']) ? sanitize_key(wp_unslash($_REQUEST['opened'])) : '',
        'q' => isset($_REQUEST['q']) ? sanitize_text_field(wp_unslash($_REQUEST['q'])) : '',
    ];
    if (!in_array($f['status'], XF_CAMP_STATUSES, true)) $f['status'] = '';
    if (!in_array($f['opened'], ['yes', 'no', 'clicked'], true)) $f['opened'] = '';
    return $f;
}

function xf_camp_where(array $f) {
    global $wpdb;
    $where = ['1=1'];
    if ($f['campaign']) $where[] = $wpdb->prepare('l.campaign_id = %d', $f['campaign']);
    if ($f['status']) $where[] = $wpdb->prepare('l.status = %s', $f['status']);
    if ($f['opened'] === 'yes') $where[] = 'l.opens > 0';
    if ($f['opened'] === 'no') $where[] = 'l.opens = 0 AND l.sent_at IS NOT NULL';
    if ($f['opened'] === 'clicked') $where[] = 'l.clicks > 0';
    if ($f['q'] !== '') {
        $like = '%' . $wpdb->esc_like($f['q']) . '%';
        $where[] = $wpdb->prepare('(l.email LIKE %s OR l.subject LIKE %s OR l.startup LIKE %s)', $like, $like, $like);
    }
    return implode(' AND ', $where);
}

/* -------------------------------------------------------------------------
 * Admin: actions
 * ---------------------------------------------------------------------- */

function xf_camp_url(array $args = []) {
    return add_query_arg($args, admin_url('admin.php?page=xf-outreach'));
}

function xf_camp_notice($msg) {
    set_transient('xf_notice_' . get_current_user_id(), $msg, 60);
}

add_action('admin_menu', function () {
    add_submenu_page('xf', 'Founder outreach', 'Founder outreach', 'manage_options', 'xf-outreach', 'xf_camp_admin_page');
}, 20);

add_action('admin_post_xf_camp', function () {
    $do = isset($_REQUEST['do']) ? sanitize_key(wp_unslash($_REQUEST['do'])) : '';
    if (!current_user_can('manage_options') || !check_admin_referer('xf_camp_' . $do)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    global $wpdb;
    $id = isset($_REQUEST['id']) ? absint($_REQUEST['id']) : 0;
    $templates = xf_table('email_templates');
    $campaigns = xf_table('campaigns');
    $log = xf_table('email_log');
    $back = wp_get_referer() ?: xf_camp_url();
    $post = function ($key) {
        return isset($_POST[$key]) ? wp_unslash($_POST[$key]) : '';
    };

    switch ($do) {
        case 'save_template':
        case 'save_campaign':
            $subject = sanitize_text_field($post('subject'));
            $body = sanitize_textarea_field($post('body'));
            $name = sanitize_text_field($post('name'));
            $offer = array_key_exists($post('offer'), xf_camp_offers()) ? $post('offer') : 'other';
            $unknown = xf_camp_unknown_tags($subject . "\n" . $body);
            if ($unknown || $name === '' || $subject === '' || trim($body) === '') {
                xf_camp_notice($unknown ? 'Not saved. Unknown merge tags: ' . implode(', ', $unknown) . '. Allowed: ' . implode(', ', XF_CAMP_TAGS) . '.' : 'Not saved. Name, subject and body are all required.');
                break;
            }
            $table = $do === 'save_template' ? $templates : $campaigns;
            $data = ['name' => $name, 'offer' => $offer, 'subject' => $subject, 'body' => $body, 'updated_at' => xf_now()];
            if ($do === 'save_campaign') {
                $data['ai_approval'] = $post('ai_approval') ? 1 : 0;
                $data['followup_days'] = implode(',', xf_camp_followup_days($post('followup_days')));
            }
            if ($id) {
                $wpdb->update($table, $data, ['id' => $id]);
            } else {
                $wpdb->insert($table, $data + ['created_at' => xf_now()]);
                $id = (int) $wpdb->insert_id;
            }
            xf_camp_notice('Saved.');
            $back = xf_camp_url(['tab' => $do === 'save_template' ? 'templates' : 'campaigns', 'edit' => $id]);
            break;
        case 'delete_template':
            $wpdb->delete($templates, ['id' => $id]);
            xf_camp_notice('Template deleted.');
            $back = xf_camp_url(['tab' => 'templates']);
            break;
        case 'new_campaign':
            $t = $wpdb->get_row($wpdb->prepare("SELECT * FROM $templates WHERE id = %d", absint($post('template_id'))));
            if (!$t) {
                xf_camp_notice('Choose a template.');
                break;
            }
            $name = sanitize_text_field($post('name')) ?: $t->name . ' ' . wp_date('M j');
            $wpdb->insert($campaigns, ['name' => $name, 'offer' => $t->offer, 'subject' => $t->subject, 'body' => $t->body, 'status' => 'draft', 'created_at' => xf_now(), 'updated_at' => xf_now()]);
            $back = xf_camp_url(['tab' => 'campaigns', 'edit' => (int) $wpdb->insert_id]); // read before the notice writes a transient
            xf_camp_notice('Campaign created as a draft. Add recipients, check the preview, then start it.');
            break;
        case 'add_recipients':
            $counts = xf_camp_add_lines($id, $post('lines'));
            xf_camp_notice(sprintf('Added %d. Skipped: %d already in this campaign, %d unsubscribed or bounced, %d invalid.', $counts['added'], $counts['duplicate'], $counts['suppressed'], $counts['invalid']));
            break;
        case 'add_contacts':
            $counts = xf_camp_add_from_contacts($id);
            xf_camp_notice(sprintf('Added %d founder contacts. Skipped: %d already in this campaign, %d unsubscribed or bounced, %d invalid.', $counts['added'], $counts['duplicate'], $counts['suppressed'], $counts['invalid']));
            break;
        case 'campaign_status':
            $status = sanitize_key($post('status') ?: (isset($_GET['status']) ? wp_unslash($_GET['status']) : ''));
            if (in_array($status, ['draft', 'active', 'paused'], true)) {
                $wpdb->update($campaigns, ['status' => $status, 'updated_at' => xf_now()], ['id' => $id]);
                xf_camp_notice('Campaign is now ' . $status . '.');
            }
            break;
        case 'remove_recipient':
            $wpdb->query($wpdb->prepare("DELETE FROM $log WHERE id = %d AND status = 'queued'", $id));
            xf_camp_notice('Removed from the queue.');
            break;
        case 'mark':
            $status = isset($_GET['status']) ? sanitize_key(wp_unslash($_GET['status'])) : '';
            $row = $wpdb->get_row($wpdb->prepare("SELECT id, email FROM $log WHERE id = %d", $id));
            if ($row && in_array($status, ['replied', 'bounced', 'unsubscribed'], true)) {
                xf_camp_stop_address($row->email, $status, (int) $row->id);
                xf_camp_notice(sprintf('%s marked %s; nothing more will be sent to that address.', $row->email, $status));
            }
            break;
        case 'reset_dry_run':
            // Dry-run follow-ups are dropped: they are re-queued on schedule after the real first email.
            $wpdb->query($wpdb->prepare("DELETE FROM $log WHERE campaign_id = %d AND step > 0 AND (dry_run = 1 OR status = 'queued')", $id));
            $n = $wpdb->query($wpdb->prepare(
                // Mock-mode AI copy was only for the dry run; real sends fall back to the template.
                "UPDATE $log SET status = 'queued', dry_run = 0, sent_at = NULL,
                    ai_status = CASE WHEN ai_body LIKE '%%[MOCK]%%' THEN '' ELSE ai_status END,
                    ai_body = CASE WHEN ai_body LIKE '%%[MOCK]%%' THEN NULL ELSE ai_body END,
                    ai_subject = CASE WHEN ai_subject LIKE '%%[MOCK]%%' THEN '' ELSE ai_subject END, opens = 0, first_open_at = NULL, last_open_at = NULL, clicks = 0, first_click_at = NULL, last_click_at = NULL, updated_at = %s WHERE campaign_id = %d AND dry_run = 1 AND status = 'sent'",
                xf_now(), $id
            ));
            xf_camp_notice(sprintf('%d dry-run emails put back in the queue for real sending.', (int) $n));
            break;
        case 'send_now':
            $r = xf_camp_send_batch(true);
            xf_camp_notice(isset($r['skipped']) && is_string($r['skipped']) ? 'Not sent: ' . $r['skipped'] : sprintf('Batch done: %d %s, %d failed, %d skipped.', $r['sent'], $r['dry_run'] ? 'logged (dry run, nothing emailed)' : 'sent', $r['failed'], $r['skipped']));
            break;
        case 'check_replies':
            xf_camp_notice('Reply check: ' . wp_json_encode(xf_camp_check_replies()));
            break;
        case 'save_settings':
            update_option('xf_camp_settings', [
                'enabled' => $post('enabled') ? 1 : 0,
                'dry_run' => $post('dry_run') ? 1 : 0,
                'daily_cap' => min(max(absint($post('daily_cap')), 1), 200),
                'batch_size' => min(max(absint($post('batch_size')), 1), 20),
                'hour_start' => min(absint($post('hour_start')), 23),
                'hour_end' => min(max(absint($post('hour_end')), 1), 24),
                'auto_approve_minutes' => min(absint($post('auto_approve_minutes')), 1440),
            ], false);
            xf_camp_notice('Settings saved.');
            break;
    }
    wp_safe_redirect($back);
    exit;
});

/** CSV of the filtered email list. */
add_action('admin_post_xf_camp_csv', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_camp_csv')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    global $wpdb;
    $where = xf_camp_where(xf_camp_filters());
    $rows = $wpdb->get_results('SELECT l.*, c.name AS campaign FROM ' . xf_table('email_log') . ' l LEFT JOIN ' . xf_table('campaigns') . " c ON c.id = l.campaign_id WHERE $where ORDER BY l.id DESC", ARRAY_A);
    nocache_headers();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="outreach-emails-' . gmdate('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    $cols = ['id', 'campaign', 'step', 'email', 'first_name', 'startup', 'subject', 'status', 'ai_status', 'dry_run', 'queued_at', 'sent_at', 'opens', 'first_open_at', 'last_open_at', 'clicks', 'first_click_at', 'last_click_at', 'replied_at', 'error'];
    fputcsv($out, $cols);
    foreach ($rows as $r) {
        $line = [];
        foreach ($cols as $col) {
            $v = (string) ($r[$col] ?? '');
            // Spreadsheet formula injection guard.
            $line[] = preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
        }
        fputcsv($out, $line);
    }
    fclose($out);
    exit;
});

function xf_camp_action_url($do, array $args = []) {
    return wp_nonce_url(add_query_arg(array_merge(['action' => 'xf_camp', 'do' => $do], $args), admin_url('admin-post.php')), 'xf_camp_' . $do);
}

function xf_camp_form_open($do, array $hidden = []) {
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    echo '<input type="hidden" name="action" value="xf_camp"><input type="hidden" name="do" value="' . esc_attr($do) . '">';
    foreach ($hidden as $k => $v) {
        echo '<input type="hidden" name="' . esc_attr($k) . '" value="' . esc_attr($v) . '">';
    }
    wp_nonce_field('xf_camp_' . $do);
}

/* -------------------------------------------------------------------------
 * Admin: page
 * ---------------------------------------------------------------------- */

function xf_camp_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'overview';
    $tabs = ['overview' => 'Overview', 'campaigns' => 'Campaigns', 'templates' => 'Templates', 'settings' => 'Settings'];
    $c = xf_camp_settings();
    ?>
    <div class="wrap">
        <h1>Founder outreach</h1>
        <nav class="nav-tab-wrapper">
            <?php foreach ($tabs as $key => $label) : ?>
                <a class="nav-tab <?php echo $tab === $key ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url(xf_camp_url(['tab' => $key])); ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </nav>
        <?php if (!empty($c['dry_run'])) : ?>
            <div class="notice notice-warning inline"><p><strong>Dry-run mode is on.</strong> Batches render and log emails but nothing is emailed. Turn it off in Settings when you're ready, then use "Re-queue dry-run emails" on each campaign.</p></div>
        <?php endif; ?>
        <?php
        if ($tab === 'campaigns') {
            xf_camp_tab_campaigns();
        } elseif ($tab === 'templates') {
            xf_camp_tab_templates();
        } elseif ($tab === 'settings') {
            xf_camp_tab_settings();
        } elseif ($tab === 'preview') {
            xf_camp_tab_preview();
        } else {
            xf_camp_tab_overview();
        }
        ?>
    </div>
    <?php
}

function xf_camp_status_box() {
    $c = xf_camp_settings();
    $s = xf_get_settings();
    $dry = !empty($c['dry_run']);
    $blocked = xf_camp_block_reason(true);
    $next = wp_next_scheduled('xf_campaign_tick');
    $last = get_option('xf_camp_last_tick');
    ?>
    <div class="card" style="max-width:none">
        <h2>Sending</h2>
        <ul>
            <?php
            xf_status_row(!empty($c['enabled']), 'Campaign sending turned on', 'Settings tab');
            xf_status_row(trim($s['postal_address']) !== '', 'Postal address in every email', '100xFounder → Settings');
            xf_status_row($dry || xf_smtp_configured(), $dry ? 'Dry run (SMTP not needed)' : 'SMTP mailbox', '100xFounder → Settings');
            xf_status_row(function_exists('imap_open') && xf_imap_available(), 'Reply and bounce detection (IMAP)', 'enable PHP imap and the mailbox; until then use "Mark replied / bounced" below');
            ?>
        </ul>
        <p>Sent in the last 24 hours: <strong><?php echo (int) xf_camp_sent_24h($dry); ?></strong> / <?php echo (int) $c['daily_cap']; ?> daily cap<?php echo $dry ? ' (dry-run count)' : ' (includes the founder sequence)'; ?>.
            Batches of <?php echo (int) $c['batch_size']; ?> every 15 minutes between <?php echo (int) $c['hour_start']; ?>:00 and <?php echo (int) $c['hour_end']; ?>:00 site time.
            Next batch: <strong><?php echo $next ? esc_html(wp_date('M j, H:i', $next)) : 'not scheduled'; ?></strong>.
            <?php if ($last) : ?>Last batch <?php echo esc_html(wp_date('M j, H:i', $last['at'])); ?>: <code><?php echo esc_html(wp_json_encode($last['result'])); ?></code><?php endif; ?></p>
        <?php if ($blocked) : ?><p><strong>Not sending:</strong> <?php echo esc_html($blocked); ?></p><?php endif; ?>
        <p>
            <a class="button button-primary" href="<?php echo esc_url(xf_camp_action_url('send_now')); ?>">Send one batch now</a>
            <a class="button" href="<?php echo esc_url(xf_camp_action_url('check_replies')); ?>">Check replies and bounces</a>
        </p>
        <p class="description">For reliable timing on a quiet site, add an hPanel cron job every 15 minutes:
            <code>wget -q -O /dev/null "<?php echo esc_html(add_query_arg('key', $s['cron_key'], rest_url('xf/v1/campaign-tick'))); ?>"</code></p>
    </div>
    <?php
}

function xf_camp_tab_overview() {
    global $wpdb;
    $stats = xf_camp_stats();
    $f = xf_camp_filters();
    $where = xf_camp_where($f);
    $paged = max(1, isset($_GET['paged']) ? absint($_GET['paged']) : 1);
    $per = 50;
    $log = xf_table('email_log');
    $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM $log l WHERE $where");
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT l.*, c.name AS campaign FROM $log l LEFT JOIN " . xf_table('campaigns') . " c ON c.id = l.campaign_id WHERE $where ORDER BY COALESCE(l.sent_at, l.queued_at) DESC, l.id DESC LIMIT %d OFFSET %d",
        $per, ($paged - 1) * $per
    ));
    $all = $wpdb->get_results('SELECT id, name FROM ' . xf_table('campaigns') . ' ORDER BY id DESC');
    xf_camp_status_box();
    ?>
    <div class="card" style="max-width:none">
        <h2>Campaign results</h2>
        <p class="description"><strong>Opens are approximate.</strong> Apple Mail Privacy Protection and Gmail's image proxy load images automatically, which counts opens nobody made, while mail apps that block images count none. A click also counts as an open. Link-scanning security tools can register clicks. Treat replies as the number that matters.</p>
        <table class="widefat striped">
            <thead><tr><th>Campaign</th><th>Status</th><th>Queued</th><th>Sent</th><th>Opened</th><th>Open rate</th><th>Clicked</th><th>Click rate</th><th>Replied</th><th>Reply rate</th><th>Bounced</th><th>Unsubscribed</th><th>Failed</th></tr></thead>
            <tbody>
            <?php foreach ($stats as $r) : $sent = (int) $r->sent; ?>
                <tr>
                    <td><a href="<?php echo esc_url(xf_camp_url(['tab' => 'campaigns', 'edit' => $r->id])); ?>"><?php echo esc_html($r->name); ?></a><br><span class="description"><?php echo esc_html(xf_camp_offers()[$r->offer] ?? $r->offer); ?></span></td>
                    <td><?php echo esc_html($r->status); ?></td>
                    <td><?php echo (int) $r->queued; ?></td>
                    <td><?php echo (int) $sent; ?><?php if ((int) $r->dry) : ?><br><span class="description"><?php echo (int) $r->dry; ?> dry run</span><?php endif; ?></td>
                    <td><?php echo (int) $r->opened; ?></td>
                    <td><?php echo esc_html(xf_camp_rate((int) $r->opened, $sent)); ?></td>
                    <td><?php echo (int) $r->clicked; ?></td>
                    <td><?php echo esc_html(xf_camp_rate((int) $r->clicked, $sent)); ?></td>
                    <td><?php echo (int) $r->replied; ?></td>
                    <td><?php echo esc_html(xf_camp_rate((int) $r->replied, $sent)); ?></td>
                    <td><?php echo (int) $r->bounced; ?></td>
                    <td><?php echo (int) $r->unsubscribed; ?></td>
                    <td><?php echo (int) $r->failed; ?></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$stats) : ?><tr><td colspan="13">No campaigns yet. Create one on the Campaigns tab.</td></tr><?php endif; ?>
            </tbody>
        </table>
    </div>

    <div class="card" style="max-width:none">
        <h2>Emails (<?php echo (int) $total; ?>)</h2>
        <form method="get" style="margin-bottom:8px">
            <input type="hidden" name="page" value="xf-outreach">
            <select name="campaign"><option value="0">All campaigns</option>
                <?php foreach ($all as $cmp) : ?><option value="<?php echo (int) $cmp->id; ?>" <?php selected($f['campaign'], (int) $cmp->id); ?>><?php echo esc_html($cmp->name); ?></option><?php endforeach; ?>
            </select>
            <select name="status"><option value="">Any status</option>
                <?php foreach (XF_CAMP_STATUSES as $st) : ?><option value="<?php echo esc_attr($st); ?>" <?php selected($f['status'], $st); ?>><?php echo esc_html($st); ?></option><?php endforeach; ?>
            </select>
            <select name="opened"><option value="">Opened or not</option>
                <option value="yes" <?php selected($f['opened'], 'yes'); ?>>Opened</option>
                <option value="no" <?php selected($f['opened'], 'no'); ?>>Sent, not opened</option>
                <option value="clicked" <?php selected($f['opened'], 'clicked'); ?>>Clicked</option>
            </select>
            <input type="search" name="q" value="<?php echo esc_attr($f['q']); ?>" placeholder="Email, subject or startup">
            <button class="button">Filter</button>
            <a class="button" href="<?php echo esc_url(wp_nonce_url(add_query_arg(array_merge(['action' => 'xf_camp_csv'], array_filter($f)), admin_url('admin-post.php')), 'xf_camp_csv')); ?>">Download CSV</a>
        </form>
        <table class="widefat striped">
            <thead><tr><th>Recipient</th><th>Campaign</th><th>Step</th><th>Subject</th><th>Status</th><th>Sent</th><th>Opens</th><th>First / last open</th><th>Clicks</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($rows as $r) : ?>
                <tr>
                    <td><?php echo esc_html($r->email); ?><?php if ($r->startup) : ?><br><span class="description"><?php echo esc_html($r->startup); ?></span><?php endif; ?></td>
                    <td><?php echo esc_html((string) $r->campaign); ?></td>
                    <td><?php echo esc_html(xf_camp_step_label($r->step)); ?></td>
                    <td><?php echo esc_html($r->subject !== '' ? $r->subject : ($r->ai_subject !== '' ? $r->ai_subject : '(rendered when sent)')); ?></td>
                    <td><?php echo esc_html($r->status); ?><?php if ($r->status === 'queued' && $r->ai_status !== '') : ?><br><strong><?php echo esc_html(xf_camp_ai_label($r)); ?></strong><?php endif; ?><?php echo (int) $r->dry_run ? ' <span class="description">(dry run)</span>' : ''; ?><?php if ($r->error) : ?><br><span class="description"><?php echo esc_html($r->error); ?></span><?php endif; ?></td>
                    <td><?php echo $r->sent_at ? esc_html(get_date_from_gmt($r->sent_at, 'M j, H:i')) : '—'; ?></td>
                    <td><?php echo (int) $r->opens; ?></td>
                    <td><?php echo $r->first_open_at ? esc_html(get_date_from_gmt($r->first_open_at, 'M j, H:i') . ' / ' . get_date_from_gmt($r->last_open_at, 'M j, H:i')) : '—'; ?></td>
                    <td><?php echo (int) $r->clicks; ?></td>
                    <td>
                        <a href="<?php echo esc_url(xf_camp_url(['tab' => 'preview', 'id' => $r->id])); ?>"><?php echo $r->status === 'queued' && in_array($r->ai_status, ['draft', 'approved'], true) ? 'Review / edit' : 'View'; ?></a>
                        <?php if ($r->status === 'sent') : ?>
                            · <a href="<?php echo esc_url(xf_camp_action_url('mark', ['id' => $r->id, 'status' => 'replied'])); ?>">Mark replied</a>
                            · <a href="<?php echo esc_url(xf_camp_action_url('mark', ['id' => $r->id, 'status' => 'bounced'])); ?>">Mark bounced</a>
                        <?php elseif ($r->status === 'queued') : ?>
                            · <a href="<?php echo esc_url(xf_camp_action_url('remove_recipient', ['id' => $r->id])); ?>">Remove</a>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows) : ?><tr><td colspan="10">No emails match.</td></tr><?php endif; ?>
            </tbody>
        </table>
        <?php
        $pages = (int) ceil($total / $per);
        if ($pages > 1) {
            echo '<p>' . paginate_links(['base' => add_query_arg('paged', '%#%'), 'format' => '', 'current' => $paged, 'total' => $pages]) . '</p>'; // phpcs:ignore -- core-escaped
        }
        ?>
    </div>
    <?php
}

function xf_camp_tag_help() {
    echo '<p class="description">Merge tags: <code>{' . implode('}</code> <code>{', array_map('esc_html', XF_CAMP_TAGS)) . '}</code>. Wrap a line in <code>[if article_url]…[/if]</code> to drop it when that value is empty. {first_name} falls back to "there". The unsubscribe link and postal address are added automatically below the body and can\'t be removed. Keep it honest: no deadlines or scarcity you can\'t back up, no ranking or traffic promises.</p>';
}

function xf_camp_editor($do, $item) {
    xf_camp_form_open($do, ['id' => $item ? (int) $item->id : 0]);
    ?>
    <table class="form-table" role="presentation">
        <tr><th><label for="xf_camp_name">Name</label></th><td><input class="regular-text" id="xf_camp_name" name="name" value="<?php echo esc_attr($item->name ?? ''); ?>" required></td></tr>
        <tr><th><label for="xf_camp_offer">Offer</label></th><td><select id="xf_camp_offer" name="offer">
            <?php foreach (xf_camp_offers() as $k => $label) : ?><option value="<?php echo esc_attr($k); ?>" <?php selected($item->offer ?? 'other', $k); ?>><?php echo esc_html($label); ?></option><?php endforeach; ?>
        </select></td></tr>
        <tr><th><label for="xf_camp_subject">Subject</label></th><td><input class="large-text" id="xf_camp_subject" name="subject" value="<?php echo esc_attr($item->subject ?? ''); ?>" required></td></tr>
        <tr><th><label for="xf_camp_body">Body (plain text)</label></th><td><textarea class="large-text code" rows="16" id="xf_camp_body" name="body" required><?php echo esc_textarea($item->body ?? ''); ?></textarea><?php xf_camp_tag_help(); ?></td></tr>
        <?php if ($do === 'save_campaign') : ?>
            <tr><th>AI-written emails</th><td><label><input type="checkbox" name="ai_approval" value="1" <?php checked(!isset($item->ai_approval) || (int) $item->ai_approval); ?>> Require my approval before AI-written emails send</label></td></tr>
            <tr><th><label for="xf_camp_fu">Follow-ups</label></th><td><input id="xf_camp_fu" name="followup_days" value="<?php echo esc_attr($item->followup_days ?? ''); ?>" placeholder="4,10">
                <p class="description">Days after the first email, comma-separated, at most two (for example <code>4,10</code>). Leave empty for none. Claude writes each follow-up from the listing; it goes in the same thread, only to people who have not replied, unsubscribed or bounced, and counts against the daily cap.</p></td></tr>
        <?php endif; ?>
    </table>
    <?php
    submit_button('Save');
    echo '</form>';
}

function xf_camp_tab_campaigns() {
    global $wpdb;
    $edit = isset($_GET['edit']) ? absint($_GET['edit']) : 0;
    $campaign = $edit ? $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('campaigns') . ' WHERE id = %d', $edit)) : null;
    if ($campaign) {
        $counts = $wpdb->get_results($wpdb->prepare('SELECT status, COUNT(*) n FROM ' . xf_table('email_log') . ' WHERE campaign_id = %d GROUP BY status', $campaign->id), OBJECT_K);
        $first = $wpdb->get_row($wpdb->prepare('SELECT id FROM ' . xf_table('email_log') . ' WHERE campaign_id = %d ORDER BY id ASC LIMIT 1', $campaign->id));
        ?>
        <h2><?php echo esc_html($campaign->name); ?> <span class="description">(<?php echo esc_html($campaign->status); ?>)</span></h2>
        <p>
            <?php foreach ($counts as $st => $row) echo esc_html("$st: {$row->n}") . ' · '; ?>
            <a href="<?php echo esc_url(xf_camp_url(['campaign' => $campaign->id])); ?>">See emails</a>
            <?php if ($first) : ?> · <a href="<?php echo esc_url(xf_camp_url(['tab' => 'preview', 'id' => $first->id])); ?>">Preview the first email</a><?php endif; ?>
        </p>
        <p>
            <?php if ($campaign->status !== 'active') : ?>
                <a class="button button-primary" href="<?php echo esc_url(xf_camp_action_url('campaign_status', ['id' => $campaign->id, 'status' => 'active'])); ?>">Start sending</a>
            <?php else : ?>
                <a class="button" href="<?php echo esc_url(xf_camp_action_url('campaign_status', ['id' => $campaign->id, 'status' => 'paused'])); ?>">Pause</a>
            <?php endif; ?>
            <a class="button" href="<?php echo esc_url(xf_camp_action_url('reset_dry_run', ['id' => $campaign->id])); ?>">Re-queue dry-run emails</a>
        </p>
        <div class="card" style="max-width:none">
            <h3>Add recipients</h3>
            <p>One per line: <code>email, first name, startup, article URL</code>. Only the email is required. Unsubscribed and bounced addresses are skipped automatically, and nobody is added twice to the same campaign. Only use addresses a company publishes for business contact.</p>
            <?php xf_camp_form_open('add_recipients', ['id' => $campaign->id]); ?>
            <textarea class="large-text code" rows="6" name="lines" placeholder="founder@startup.example, Asha, Startup Name, https://100xfounder.com/startup-article/"></textarea>
            <?php submit_button('Add to queue', 'secondary'); ?>
            </form>
            <?php xf_camp_form_open('add_contacts', ['id' => $campaign->id]); ?>
            <p>Or add every founder contact found by the Product Hunt routine (except anyone unsubscribed, bounced or paused). Their directory page is used as {listing_url}.</p>
            <?php submit_button('Add founder contacts', 'secondary', 'submit', false); ?>
            </form>
        </div>
        <?php if (function_exists('xf_camp_ai_card')) xf_camp_ai_card($campaign); ?>
        <h3>Email copy</h3>
        <?php
        xf_camp_editor('save_campaign', $campaign);
        return;
    }

    $templates = $wpdb->get_results('SELECT id, name FROM ' . xf_table('email_templates') . ' ORDER BY id ASC');
    $stats = xf_camp_stats();
    ?>
    <div class="card" style="max-width:none">
        <h2>New campaign</h2>
        <?php xf_camp_form_open('new_campaign'); ?>
        <p><select name="template_id">
            <?php foreach ($templates as $t) : ?><option value="<?php echo (int) $t->id; ?>"><?php echo esc_html($t->name); ?></option><?php endforeach; ?>
        </select>
        <input class="regular-text" name="name" placeholder="Campaign name (optional)">
        <?php submit_button('Create from template', 'primary', 'submit', false); ?></p>
        </form>
    </div>
    <table class="widefat striped">
        <thead><tr><th>Campaign</th><th>Status</th><th>Recipients</th><th>Queued</th><th>Sent</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($stats as $r) : ?>
            <tr>
                <td><a href="<?php echo esc_url(xf_camp_url(['tab' => 'campaigns', 'edit' => $r->id])); ?>"><?php echo esc_html($r->name); ?></a></td>
                <td><?php echo esc_html($r->status); ?></td>
                <td><?php echo (int) $r->total; ?></td>
                <td><?php echo (int) $r->queued; ?></td>
                <td><?php echo (int) $r->sent; ?></td>
                <td><a href="<?php echo esc_url(xf_camp_url(['tab' => 'campaigns', 'edit' => $r->id])); ?>">Open</a></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$stats) : ?><tr><td colspan="6">No campaigns yet.</td></tr><?php endif; ?>
        </tbody>
    </table>
    <?php
}

function xf_camp_tab_templates() {
    global $wpdb;
    $table = xf_table('email_templates');
    $edit = isset($_GET['edit']) ? absint($_GET['edit']) : 0;
    if ($edit || isset($_GET['new'])) {
        $item = $edit ? $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $edit)) : null;
        echo '<h2>' . ($item ? 'Edit template' : 'New template') . '</h2>';
        echo '<p class="description">Editing a template doesn\'t change campaigns already created from it; each campaign keeps its own copy.</p>';
        xf_camp_editor('save_template', $item);
        return;
    }
    $templates = $wpdb->get_results("SELECT * FROM $table ORDER BY id ASC");
    ?>
    <p><a class="button" href="<?php echo esc_url(xf_camp_url(['tab' => 'templates', 'new' => 1])); ?>">New template</a></p>
    <table class="widefat striped">
        <thead><tr><th>Template</th><th>Offer</th><th>Subject</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($templates as $t) : ?>
            <tr>
                <td><?php echo esc_html($t->name); ?></td>
                <td><?php echo esc_html(xf_camp_offers()[$t->offer] ?? $t->offer); ?></td>
                <td><?php echo esc_html($t->subject); ?></td>
                <td><a href="<?php echo esc_url(xf_camp_url(['tab' => 'templates', 'edit' => $t->id])); ?>">Edit</a>
                    · <a href="<?php echo esc_url(xf_camp_action_url('delete_template', ['id' => $t->id])); ?>" onclick="return confirm('Delete this template?')">Delete</a></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php
}

function xf_camp_tab_settings() {
    $c = xf_camp_settings();
    xf_camp_form_open('save_settings');
    ?>
    <table class="form-table" role="presentation">
        <tr><th>Send campaign emails</th><td><label><input type="checkbox" name="enabled" value="1" <?php checked(!empty($c['enabled'])); ?>> Batches run every 15 minutes for active campaigns.</label></td></tr>
        <tr><th>Dry run</th><td><label><input type="checkbox" name="dry_run" value="1" <?php checked(!empty($c['dry_run'])); ?>> Render and log emails without sending anything (for testing).</label></td></tr>
        <tr><th><label for="xf_auto">Auto-approve AI drafts after</label></th><td><input type="number" id="xf_auto" name="auto_approve_minutes" min="0" max="1440" value="<?php echo (int) $c['auto_approve_minutes']; ?>"> minutes<p class="description">AI-written emails you haven't reviewed send after this many minutes. 0 = always wait for your approval.</p></td></tr>
        <tr><th><label for="xf_cap">Daily cap</label></th><td><input type="number" id="xf_cap" name="daily_cap" min="1" max="200" value="<?php echo (int) $c['daily_cap']; ?>"><p class="description">Emails in any 24 hours from this mailbox, including the founder sequence. Keep it low (30) to protect deliverability.</p></td></tr>
        <tr><th><label for="xf_batch">Batch size</label></th><td><input type="number" id="xf_batch" name="batch_size" min="1" max="20" value="<?php echo (int) $c['batch_size']; ?>"><p class="description">Emails per 15-minute batch.</p></td></tr>
        <tr><th>Sending hours (site time)</th><td><input type="number" name="hour_start" min="0" max="23" value="<?php echo (int) $c['hour_start']; ?>"> to <input type="number" name="hour_end" min="1" max="24" value="<?php echo (int) $c['hour_end']; ?>"></td></tr>
    </table>
    <p class="description">SMTP, From name, reply-to and the postal address come from 100xFounder → Settings → Outreach email.</p>
    <?php
    submit_button();
    echo '</form>';
}

function xf_camp_tab_preview() {
    global $wpdb;
    $id = isset($_GET['id']) ? absint($_GET['id']) : 0;
    $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('email_log') . ' WHERE id = %d', $id));
    $campaign = $row ? $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('campaigns') . ' WHERE id = %d', $row->campaign_id)) : null;
    if (!$row || !$campaign) {
        echo '<p>Email not found.</p>';
        return;
    }
    $draft = $row->ai_status === 'draft' && (string) $row->ai_body !== '';
    $built = xf_camp_build($draft ? (object) array_merge((array) $row, ['ai_status' => 'approved']) : $row, $campaign);
    $sent = $row->sent_at !== null && $row->body;
    ?>
    <h2><?php echo esc_html($sent ? $row->subject : $built['subject']); ?></h2>
    <p>To <strong><?php echo esc_html($row->email); ?></strong> · <?php echo esc_html($campaign->name); ?> · <?php echo esc_html(xf_camp_step_label($row->step)); ?> · status <?php echo esc_html($row->status); ?>
        <?php echo $sent ? '· as sent ' . esc_html(get_date_from_gmt($row->sent_at, 'M j, H:i')) : '· preview with the current copy'; ?>
        · opens <?php echo (int) $row->opens; ?> · clicks <?php echo (int) $row->clicks; ?></p>
    <?php if (function_exists('xf_camp_ai_editor')) xf_camp_ai_editor($row); ?>
    <h3>Plain-text version<?php echo $draft && !$sent ? ' (as it will send once approved)' : ''; ?></h3>
    <pre style="white-space:pre-wrap;background:#fff;border:1px solid #ddd;padding:12px;max-width:760px"><?php echo esc_html($sent ? $row->body : $built['text']); ?></pre>
    <p class="description">Headers: List-Unsubscribe: &lt;<?php echo esc_html($built['unsubscribe_url']); ?>&gt; and List-Unsubscribe-Post: List-Unsubscribe=One-Click. The HTML version has the same text with tracked links and a 1×1 open pixel.</p>
    <p><a href="<?php echo esc_url(xf_camp_url(['campaign' => $row->campaign_id])); ?>">← Back to emails</a></p>
    <?php
}

/**
 * Add recipients from scripts (the daily profile routines) without a browser session:
 * POST /xf/v1/campaign-recipients {campaign_id, lines: "email,first name,startup,url\n…"}.
 * Admins only (Application Password); same validation, suppression and de-duplication as the paste box.
 */
add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/campaign-recipients', [
        'methods' => 'POST',
        'permission_callback' => function () { return current_user_can('manage_options'); },
        'callback' => function (WP_REST_Request $r) {
            global $wpdb;
            $id = absint($r->get_param('campaign_id'));
            if (!$id || !$wpdb->get_var($wpdb->prepare('SELECT id FROM ' . xf_table('campaigns') . ' WHERE id = %d', $id))) {
                return new WP_Error('no_campaign', 'Unknown campaign.', ['status' => 404]);
            }
            $lines = (string) $r->get_param('lines');
            if (strlen($lines) > 200000 || substr_count($lines, "\n") > 1000) {
                return new WP_Error('too_many', 'Send at most 1,000 lines at a time.', ['status' => 400]);
            }
            return xf_camp_add_lines($id, $lines);
        },
    ]);
});
