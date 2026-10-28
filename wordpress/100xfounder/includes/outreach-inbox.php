<?php
/**
 * Outreach inbox (100xFounder → Outreach inbox): one page that shows who was
 * emailed, who is still queued, which of their listings are live or scheduled,
 * and the exact replies, with a reply box that sends through the campaign mailer.
 *
 * Replies are copied from the mailbox over IMAP into xf_inbox, read-only
 * (OP_READONLY + FT_PEEK), so nothing changes in Hostinger webmail.
 * Email content is untrusted: it is stored as plain text and only ever printed
 * through esc_html(). No HTML, no remote images, no clickable links from senders.
 * Nothing is sent unless the owner clicks Send. There is no AI auto-reply here.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_INBOX_BODY_MAX = 20480;
const XF_INBOX_PER_PAGE = 50;

/** Called from xf_install_schema() whenever XF_DB_VERSION changes. */
function xf_inbox_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta("CREATE TABLE " . xf_table('inbox') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  message_id varchar(255) NOT NULL,
  in_reply_to varchar(255) NOT NULL DEFAULT '',
  email varchar(190) NOT NULL,
  direction varchar(3) NOT NULL DEFAULT 'in',
  subject varchar(255) NOT NULL DEFAULT '',
  body_text mediumtext,
  received_at datetime NOT NULL,
  handled tinyint(1) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY  (id),
  UNIQUE KEY message_id (message_id),
  KEY email (email),
  KEY received_at (received_at)
) " . $wpdb->get_charset_collate() . ";");
}

/* -------------------------------------------------------------------------
 * Plain-text extraction (pure functions, covered by xf_inbox_selftest())
 * ---------------------------------------------------------------------- */

/** HTML email to readable plain text. Links become "text (url)" so they show but never render. */
function xf_inbox_html_to_text($html) {
    $html = preg_replace('#<(head|style|script|title)\b[^>]*>.*?</\1>#is', '', (string) $html);
    $html = preg_replace_callback('#<a\b[^>]*href\s*=\s*["\']([^"\']+)["\'][^>]*>(.*?)</a>#is', function ($m) {
        $text = trim(wp_strip_all_tags($m[2]));
        return $text === '' || $text === $m[1] ? $m[1] : $text . ' (' . $m[1] . ')';
    }, $html);
    $html = preg_replace('#<br\s*/?>#i', "\n", $html);
    $html = preg_replace('#</(p|div|tr|li|h[1-6]|blockquote)>#i', "\n", $html);
    $html = preg_replace('#<blockquote\b[^>]*>#i', "\n> ", $html);
    $text = html_entity_decode(wp_strip_all_tags($html, false), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace("/[ \t]+\n/", "\n", str_replace("\r", '', $text));
    return trim(preg_replace("/\n{3,}/", "\n\n", $text));
}

/** Transfer-decodes one MIME part and converts it to UTF-8. $encoding is imap's numeric code. */
function xf_inbox_decode_part($raw, $encoding, $charset = '') {
    if ((int) $encoding === 3) {
        $raw = base64_decode((string) $raw);
    } elseif ((int) $encoding === 4) {
        $raw = quoted_printable_decode((string) $raw);
    }
    $charset = strtoupper(trim((string) $charset));
    if ($charset !== '' && $charset !== 'UTF-8' && $charset !== 'US-ASCII' && function_exists('mb_convert_encoding')) {
        $converted = @mb_convert_encoding($raw, 'UTF-8', $charset);
        if (is_string($converted)) {
            $raw = $converted;
        }
    }
    return function_exists('mb_scrub') ? mb_scrub((string) $raw, 'UTF-8') : (string) $raw;
}

/** Caps stored text at 20 KB without cutting a UTF-8 character in half. */
function xf_inbox_cap($text) {
    $text = trim(str_replace("\r\n", "\n", (string) $text));
    return strlen($text) > XF_INBOX_BODY_MAX ? mb_strcut($text, 0, XF_INBOX_BODY_MAX, 'UTF-8') . "\n[…trimmed]" : $text;
}

/** Display only: drops quoted history ("> …" lines) and the "On … wrote:" line that introduces it. */
function xf_inbox_trim_quotes($text) {
    $out = [];
    foreach (explode("\n", str_replace("\r", '', (string) $text)) as $line) {
        if (preg_match('/^\s*>/', $line)) {
            // The attribution line usually sits right above the quote, maybe with a blank line between.
            while ($out && trim(end($out)) === '') array_pop($out);
            if ($out && preg_match('/\bwrote:\s*$/i', end($out))) array_pop($out);
            continue;
        }
        $out[] = $line;
    }
    return trim(preg_replace("/\n{3,}/", "\n\n", implode("\n", $out)));
}

/** Only well-formed <id@host> values reach In-Reply-To / References. */
function xf_inbox_valid_msgid($id) {
    return is_string($id) && strlen($id) <= 250 && preg_match('/^<[^<>\s@]+@[^<>\s@]+>$/', $id);
}

/** Assert-based self-check for the extraction helpers. Run with: wp eval 'var_dump(xf_inbox_selftest());' */
function xf_inbox_selftest() {
    $t = xf_inbox_html_to_text('<html><head><style>p{color:red}</style></head><body><p>Hi&nbsp;there &amp; thanks</p><p>See <a href="https://x.example/a">our page</a><br>Bye</p><img src="https://track.example/p.gif"><script>alert(1)</script></body></html>');
    assert(strpos($t, 'color:red') === false && strpos($t, 'alert') === false && strpos($t, '<') === false);
    assert(strpos($t, 'Hi' . "\u{a0}" . 'there & thanks') !== false || strpos($t, 'Hi there & thanks') !== false);
    assert(strpos($t, 'our page (https://x.example/a)') !== false);
    assert(strpos($t, "\nBye") !== false && strpos($t, 'track.example') === false);
    assert(xf_inbox_decode_part(base64_encode('héllo'), 3, 'utf-8') === 'héllo');
    assert(xf_inbox_decode_part('caf=E9', 4, 'ISO-8859-1') === 'café');
    $q = xf_inbox_trim_quotes("Sounds good, send the price.\n\nOn Tue, 14 Oct 2026, Asha <a@x.com> wrote:\n> Hi Ravi,\n>> older\n> thanks");
    assert($q === 'Sounds good, send the price.');
    assert(xf_inbox_trim_quotes("Line one\n > quoted\nLine two") === "Line one\nLine two");
    assert(strlen(xf_inbox_cap(str_repeat('é', 20000))) <= XF_INBOX_BODY_MAX + 20);
    assert(xf_inbox_valid_msgid('<abc.1@mail.example>') && !xf_inbox_valid_msgid("<a@b>\r\nBcc: x@y"));
    return true;
}

/* -------------------------------------------------------------------------
 * IMAP sync (read-only)
 * ---------------------------------------------------------------------- */

/** Addresses we actually emailed (not dry runs), with the earliest send time. */
function xf_inbox_known_addresses() {
    global $wpdb;
    $known = [];
    $rows = $wpdb->get_results('SELECT email, MIN(sent_at) AS first_sent FROM ' . xf_table('email_log') . ' WHERE sent_at IS NOT NULL AND dry_run = 0 GROUP BY email');
    $rows = array_merge($rows, $wpdb->get_results('SELECT email, MIN(last_sent_at) AS first_sent FROM ' . xf_table('contacts') . ' WHERE last_sent_at IS NOT NULL GROUP BY email'));
    foreach ($rows as $r) {
        $e = strtolower($r->email);
        $t = strtotime($r->first_sent . ' UTC');
        $known[$e] = isset($known[$e]) ? min($known[$e], $t) : $t;
    }
    // Founder-sequence contacts only keep last_sent_at; their first send is in xf_messages.
    $first = $wpdb->get_var('SELECT MIN(sent_at) FROM ' . xf_table('messages') . " WHERE status = 'sent'");
    if ($first && $known) {
        $known = array_map(function ($t) use ($first) { return min($t, strtotime($first . ' UTC')); }, $known);
    }
    return $known;
}

function xf_inbox_imap_ref() {
    $s = xf_get_settings();
    return sprintf('{%s:%d/imap/ssl}', $s['imap_host'], (int) $s['imap_port']);
}

/** Why syncing can't run, or null. */
function xf_inbox_block_reason() {
    if (!function_exists('imap_open')) {
        return 'The PHP imap extension is not enabled, so replies can\'t be read from the mailbox (hPanel → Advanced → PHP Configuration → Extensions → imap). Replies detected earlier still show as "replied".';
    }
    if (!xf_imap_available()) {
        return 'The mailbox is not configured (100xFounder → Settings → Outreach email: IMAP host, mailbox user and password).';
    }
    return null;
}

/** Finds the best text part: text/plain first, else text/html converted to text. */
function xf_inbox_fetch_text($imap, $uid) {
    $structure = imap_fetchstructure($imap, $uid, FT_UID);
    if (!$structure) {
        return '';
    }
    $found = ['plain' => null, 'html' => null];
    $walk = function ($part, $num) use (&$walk, &$found) {
        $charset = '';
        foreach (array_merge((array) ($part->parameters ?? []), (array) ($part->dparameters ?? [])) as $p) {
            if (strtolower($p->attribute) === 'charset') $charset = $p->value;
        }
        $is_attachment = !empty($part->disposition) && strtolower($part->disposition) === 'attachment';
        if ((int) $part->type === 0 && !$is_attachment) {
            $sub = strtolower((string) ($part->subtype ?? 'plain'));
            $key = $sub === 'html' ? 'html' : ($sub === 'plain' ? 'plain' : null);
            if ($key && !$found[$key]) $found[$key] = [$num, (int) $part->encoding, $charset];
        }
        foreach ((array) ($part->parts ?? []) as $i => $child) {
            $walk($child, ($num === '' ? '' : $num . '.') . ($i + 1));
        }
    };
    $walk($structure, '');
    $pick = $found['plain'] ?: $found['html'];
    if (!$pick) {
        return '';
    }
    $raw = $pick[0] === '' ? imap_body($imap, $uid, FT_UID | FT_PEEK) : imap_fetchbody($imap, $uid, $pick[0], FT_UID | FT_PEEK);
    $text = xf_inbox_decode_part($raw, $pick[1], $pick[2]);
    return $found['plain'] ? $text : xf_inbox_html_to_text($text);
}

function xf_inbox_mime_header($value) {
    $decoded = function_exists('iconv_mime_decode') ? @iconv_mime_decode((string) $value, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8') : false;
    return sanitize_text_field($decoded !== false ? $decoded : (string) $value);
}

/**
 * Copies new replies from known outreach addresses into xf_inbox.
 * A new reply also stops any queued campaign or sequence emails to that address.
 */
function xf_inbox_sync() {
    global $wpdb;
    $blocked = xf_inbox_block_reason();
    if ($blocked) {
        update_option('xf_inbox_last_sync', ['at' => time(), 'result' => ['skipped' => $blocked]], false);
        return ['skipped' => $blocked];
    }
    $known = xf_inbox_known_addresses();
    if (!$known) {
        return ['scanned' => 0, 'stored' => 0];
    }
    if (function_exists('xf_mutex_acquire') && !xf_mutex_acquire('inbox_sync', 5 * MINUTE_IN_SECONDS)) {
        return ['skipped' => 'Another sync is running.'];
    }
    $s = xf_get_settings();
    $imap = @imap_open(xf_inbox_imap_ref() . 'INBOX', $s['smtp_user'], $s['smtp_pass'], OP_READONLY, 1);
    if (!$imap) {
        if (function_exists('xf_mutex_release')) xf_mutex_release('inbox_sync');
        $result = ['skipped' => 'IMAP login failed: ' . imap_last_error()];
        update_option('xf_inbox_last_sync', ['at' => time(), 'result' => $result], false);
        return $result;
    }
    $table = xf_table('inbox');
    $since = min($known) - DAY_IN_SECONDS;
    $uids = imap_search($imap, 'SINCE "' . gmdate('j-M-Y', $since) . '"', SE_UID) ?: [];
    $stored = 0;
    $new_from = [];
    // One round trip for all headers; bodies are fetched only for new messages, at most 50 per run.
    foreach (array_chunk($uids, 200) as $chunk) {
        foreach (imap_fetch_overview($imap, implode(',', $chunk), FT_UID) ?: [] as $ov) {
            if ($stored >= 50) break 2;
            $addr = imap_rfc822_parse_adrlist((string) ($ov->from ?? ''), 'invalid.local');
            $from = isset($addr[0]->mailbox, $addr[0]->host) ? strtolower($addr[0]->mailbox . '@' . $addr[0]->host) : '';
            if (!isset($known[$from])) continue;
            $msgid = trim((string) ($ov->message_id ?? ''));
            if (!xf_inbox_valid_msgid($msgid)) {
                $msgid = '<uid-' . (int) $ov->uid . '-' . md5($from . ($ov->date ?? '')) . '@xf-inbox.local>';
            }
            if ($wpdb->get_var($wpdb->prepare("SELECT 1 FROM $table WHERE message_id = %s", $msgid))) continue;
            $when = strtotime((string) ($ov->date ?? '')) ?: time();
            $in_reply_to = trim((string) ($ov->in_reply_to ?? ''));
            $ok = $wpdb->insert($table, [
                'message_id' => $msgid,
                'in_reply_to' => xf_inbox_valid_msgid($in_reply_to) ? $in_reply_to : '',
                'email' => $from,
                'direction' => 'in',
                'subject' => mb_substr(xf_inbox_mime_header($ov->subject ?? ''), 0, 255),
                'body_text' => xf_inbox_cap(xf_inbox_fetch_text($imap, (int) $ov->uid)),
                'received_at' => gmdate('Y-m-d H:i:s', $when),
                'handled' => 0,
            ]);
            if ($ok) {
                $stored++;
                $new_from[$from] = true;
            }
        }
    }
    imap_close($imap);
    foreach (array_keys($new_from) as $email) {
        xf_inbox_stop_sends($email);
    }
    if (function_exists('xf_mutex_release')) xf_mutex_release('inbox_sync');
    $result = ['scanned' => count($uids), 'stored' => $stored];
    update_option('xf_inbox_last_sync', ['at' => time(), 'result' => $result], false);
    return $result;
}

/** Stops everything still queued to an address, in campaigns and the founder sequence. */
function xf_inbox_stop_sends($email) {
    global $wpdb;
    if (function_exists('xf_camp_stop_address') && !xf_camp_has_stopped($email)) {
        xf_camp_stop_address($email, 'replied');
    }
    $wpdb->query($wpdb->prepare(
        'UPDATE ' . xf_table('contacts') . " SET status = 'replied', replied_at = COALESCE(replied_at, %s), next_send_at = NULL, updated_at = %s WHERE email = %s AND status IN ('queued','contacted','sequence_done')",
        xf_now(), xf_now(), $email
    ));
}

add_action('init', function () {
    if (!wp_next_scheduled('xf_inbox_sync_event')) {
        wp_schedule_event(time() + 10 * MINUTE_IN_SECONDS, 'xf_quarter_hour', 'xf_inbox_sync_event');
    }
});
add_action('xf_inbox_sync_event', 'xf_inbox_sync');
register_deactivation_hook(XF_FILE, function () {
    wp_clear_scheduled_hook('xf_inbox_sync_event');
});

/* -------------------------------------------------------------------------
 * Replying
 * ---------------------------------------------------------------------- */

/** The unsubscribe token for an address: its latest campaign row, else its sequence contact. */
function xf_inbox_token($email) {
    global $wpdb;
    $t = $wpdb->get_var($wpdb->prepare('SELECT token FROM ' . xf_table('email_log') . ' WHERE email = %s ORDER BY id DESC LIMIT 1', $email));
    return $t ?: $wpdb->get_var($wpdb->prepare('SELECT token FROM ' . xf_table('contacts') . ' WHERE email = %s', $email));
}

/** Copies a sent message into the mailbox's Sent folder so it shows in webmail. Best effort. */
function xf_inbox_append_sent($mime) {
    if (!function_exists('imap_open') || !xf_imap_available() || $mime === '') {
        return false;
    }
    $s = xf_get_settings();
    $ref = xf_inbox_imap_ref();
    $imap = @imap_open($ref, $s['smtp_user'], $s['smtp_pass'], OP_HALFOPEN, 1);
    if (!$imap) {
        return false;
    }
    $folder = null;
    foreach (imap_list($imap, $ref, '*') ?: [] as $name) {
        $short = substr($name, strlen($ref));
        if (preg_match('/^(INBOX[.\/])?Sent( Items| Messages)?$/i', $short)) {
            $folder = $name;
            break;
        }
    }
    $ok = $folder ? @imap_append($imap, $folder, str_replace("\n", "\r\n", str_replace("\r\n", "\n", $mime)), '\\Seen') : false;
    imap_close($imap);
    return (bool) $ok;
}

/** Sends the owner's reply. Returns a short result message, or WP_Error. */
function xf_inbox_send_reply($email, $text) {
    global $wpdb;
    $text = trim((string) $text);
    if ($text === '') return new WP_Error('empty', 'Write a reply first.');
    if (xf_is_suppressed($email)) return new WP_Error('suppressed', 'This address unsubscribed or bounced. Nothing was sent.');
    if (!xf_smtp_configured()) return new WP_Error('smtp', 'SMTP is not configured (100xFounder → Settings).');
    $s = xf_get_settings();
    $table = xf_table('inbox');
    $last_in = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE email = %s AND direction = 'in' ORDER BY received_at DESC LIMIT 1", $email));
    $last_out = $wpdb->get_row($wpdb->prepare('SELECT subject, message_id FROM ' . xf_table('email_log') . ' WHERE email = %s AND sent_at IS NOT NULL AND dry_run = 0 ORDER BY sent_at DESC LIMIT 1', $email));
    $subject = $last_in && $last_in->subject !== '' ? $last_in->subject : ($last_out->subject ?? '100xFounder');
    $subject = 'Re: ' . preg_replace('/^(\s*(re|fwd?|aw)\s*:\s*)+/i', '', $subject);
    $parent = $last_in ? $last_in->message_id : ($last_out->message_id ?? '');
    $parent = xf_inbox_valid_msgid($parent) && strpos($parent, '@xf-inbox.local>') === false ? $parent : '';
    $refs = $parent;
    if ($last_in && xf_inbox_valid_msgid($last_in->in_reply_to) && $last_in->in_reply_to !== $parent) {
        $refs = $last_in->in_reply_to . ' ' . $parent;
    }
    // Still outreach mail, so the postal address and one-click unsubscribe go below the owner's words.
    $token = xf_inbox_token($email);
    $unsub = $token ? xf_unsubscribe_url($token) : '';
    $body = $text . "\n\n" . implode("\n", array_filter(['--', $unsub ? "Don't want to hear from us again? $unsub" : '', trim($s['postal_address'])]));

    try {
        $mailer = xf_new_mailer();
        $mailer->clearAllRecipients();
        $mailer->clearCustomHeaders();
        $mailer->addAddress($email);
        $mailer->isHTML(false);
        $mailer->Subject = $subject;
        $mailer->Body = $body;
        $mailer->MessageID = '';
        if ($unsub) {
            $mailer->addCustomHeader('List-Unsubscribe', '<' . $unsub . '>');
            $mailer->addCustomHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
        }
        if ($parent) {
            $mailer->addCustomHeader('In-Reply-To', $parent);
            $mailer->addCustomHeader('References', trim($refs));
        }
        $mailer->send();
        $mime = $mailer->getSentMIMEMessage();
        $msgid = $mailer->getLastMessageID();
        $mailer->smtpClose();
    } catch (Exception $e) {
        return new WP_Error('send', 'Not sent: ' . $e->getMessage());
    }
    $wpdb->insert($table, [
        'message_id' => xf_inbox_valid_msgid($msgid) ? $msgid : '<out-' . wp_generate_password(16, false) . '@xf-inbox.local>',
        'in_reply_to' => $parent,
        'email' => $email,
        'direction' => 'out',
        'subject' => mb_substr($subject, 0, 255),
        'body_text' => xf_inbox_cap($body),
        'received_at' => xf_now(),
        'handled' => 1,
    ]);
    xf_inbox_mark_handled($email);
    return xf_inbox_append_sent($mime) ? 'Reply sent and copied to the Sent folder.' : 'Reply sent (it could not be copied to the webmail Sent folder).';
}

function xf_inbox_mark_handled($email) {
    global $wpdb;
    $wpdb->query($wpdb->prepare('UPDATE ' . xf_table('inbox') . " SET handled = 1 WHERE email = %s AND direction = 'in'", $email));
    // Replies detected before this page existed have no stored message; remember those here.
    $handled = (array) get_option('xf_inbox_handled', []);
    $handled[$email] = time();
    update_option('xf_inbox_handled', $handled, false);
}

/* -------------------------------------------------------------------------
 * Data for the page
 * ---------------------------------------------------------------------- */

/** Listing status label for a startup post id. */
function xf_inbox_listing($post_id) {
    $p = $post_id ? get_post($post_id) : null;
    if (!$p || $p->post_type !== 'xf_startup' || $p->post_status === 'trash') {
        return ['key' => 'none', 'label' => 'None', 'url' => '', 'title' => ''];
    }
    $map = ['publish' => 'Live', 'future' => 'Scheduled', 'pending' => 'Pending', 'draft' => 'Draft'];
    $label = $map[$p->post_status] ?? ucfirst($p->post_status);
    if ($p->post_status === 'future') {
        $label .= ' ' . get_the_date('j M', $p);
    }
    return [
        'key' => isset($map[$p->post_status]) ? $p->post_status : 'other',
        'label' => $label,
        'url' => $p->post_status === 'publish' ? get_permalink($p) : (get_edit_post_link($p->ID, 'raw') ?: ''),
        'title' => get_the_title($p),
        'id' => $p->ID,
    ];
}

/**
 * One row per address across campaigns and the founder sequence.
 * shortcut: aggregates every log row in PHP; fine for a few thousand rows, move to SQL GROUP BY if the log grows past ~20k.
 */
function xf_inbox_contacts() {
    global $wpdb;
    $c = xf_camp_settings();
    $auto = (int) $c['auto_approve_minutes'];
    $out = [];
    $blank = function ($email) {
        return ['email' => $email, 'name' => '', 'startup' => '', 'post_id' => 0, 'campaign' => '', 'step' => -1, 'last_sent' => null,
            'next_send' => null, 'next_note' => '', 'opens' => 0, 'clicks' => 0, 'statuses' => [], 'dry' => false,
            'replied_at' => null, 'last_in' => null, 'unhandled' => false, 'queued' => false, 'listing_url' => ''];
    };
    $campaign_names = [];
    $followups = [];
    foreach ($wpdb->get_results('SELECT id, name, followup_days FROM ' . xf_table('campaigns')) as $cp) {
        $campaign_names[$cp->id] = $cp->name;
        $followups[$cp->id] = function_exists('xf_camp_followup_days') ? xf_camp_followup_days($cp->followup_days) : [];
    }
    $first_sent = [];
    $rows = $wpdb->get_results('SELECT id, campaign_id, email, first_name, startup, listing_url, status, step, dry_run, sent_at, opens, clicks, replied_at, ai_status, updated_at FROM ' . xf_table('email_log') . ' ORDER BY id ASC');
    foreach ($rows as $r) {
        $e = strtolower($r->email);
        $o = $out[$e] ?? $blank($e);
        $o['name'] = $r->first_name ?: $o['name'];
        $o['startup'] = $r->startup ?: $o['startup'];
        $o['listing_url'] = $r->listing_url ?: $o['listing_url'];
        $o['campaign'] = $campaign_names[$r->campaign_id] ?? ('Campaign #' . $r->campaign_id);
        $o['statuses'][] = $r->status;
        $o['opens'] += (int) $r->opens;
        $o['clicks'] += (int) $r->clicks;
        if ($r->sent_at) {
            $o['step'] = max($o['step'], (int) $r->step);
            $o['last_sent'] = max((string) $o['last_sent'], $r->sent_at);
            $o['dry'] = (bool) $r->dry_run;
            if ((int) $r->step === 0) $first_sent[$e] = [$r->sent_at, $r->campaign_id];
        }
        if ($r->replied_at) $o['replied_at'] = max((string) $o['replied_at'], $r->replied_at);
        if ($r->status === 'queued') {
            $o['queued'] = true;
            if ($r->ai_status === 'draft') {
                $o['next_note'] = $auto > 0 ? 'AI draft, auto-sends after ' . wp_date('j M H:i', strtotime($r->updated_at . ' UTC') + $auto * MINUTE_IN_SECONDS) : 'AI draft, waiting for approval';
            } elseif ($r->ai_status === 'pending') {
                $o['next_note'] = 'Claude is writing it';
            } else {
                $o['next_note'] = 'Next batch (' . xf_camp_step_label($r->step) . ')';
            }
        }
        $out[$e] = $o;
    }
    // Expected follow-up date for campaign threads still waiting on one.
    foreach ($first_sent as $e => [$at, $cid]) {
        $o = &$out[$e];
        $next_step = $o['step'] + 1;
        if (!$o['queued'] && isset($followups[$cid][$next_step - 1]) && in_array('sent', $o['statuses'], true) && !array_intersect(['replied', 'bounced', 'unsubscribed'], $o['statuses'])) {
            $o['next_send'] = gmdate('Y-m-d H:i:s', strtotime($at . ' UTC') + $followups[$cid][$next_step - 1] * DAY_IN_SECONDS);
            $o['next_note'] = 'Follow-up ' . $next_step;
        }
        unset($o);
    }
    foreach ($wpdb->get_results('SELECT email, name, startup_id, status, step, next_send_at, last_sent_at, replied_at FROM ' . xf_table('contacts')) as $r) {
        $e = strtolower($r->email);
        $o = $out[$e] ?? $blank($e);
        $o['name'] = $o['name'] ?: (string) $r->name;
        $o['post_id'] = (int) $r->startup_id;
        $o['campaign'] = $o['campaign'] !== '' ? $o['campaign'] . ' + sequence' : 'Founder sequence';
        $map = ['contacted' => 'sent', 'sequence_done' => 'sent', 'queued' => 'queued'];
        $o['statuses'][] = $map[$r->status] ?? $r->status;
        if ($r->last_sent_at) {
            $o['step'] = max($o['step'], (int) $r->step - 1);
            $o['last_sent'] = max((string) $o['last_sent'], $r->last_sent_at);
        }
        if ($r->next_send_at && in_array($r->status, ['queued', 'contacted'], true)) {
            $o['next_send'] = $r->next_send_at;
            $o['next_note'] = (int) $r->step === 0 ? 'First email' : 'Follow-up ' . (int) $r->step;
            $o['queued'] = $o['queued'] || $r->status === 'queued';
        }
        if ($r->replied_at) $o['replied_at'] = max((string) $o['replied_at'], $r->replied_at);
        $out[$e] = $o;
    }
    // Stored replies.
    foreach ($wpdb->get_results('SELECT email, MAX(received_at) AS last_in, SUM(CASE WHEN handled = 0 THEN 1 ELSE 0 END) AS open_n FROM ' . xf_table('inbox') . " WHERE direction = 'in' GROUP BY email") as $r) {
        $e = strtolower($r->email);
        if (!isset($out[$e])) continue;
        $out[$e]['last_in'] = $r->last_in;
        $out[$e]['unhandled'] = (int) $r->open_n > 0;
    }
    $handled = (array) get_option('xf_inbox_handled', []);
    $suppressed = array_flip(array_map('strtolower', $wpdb->get_col('SELECT email FROM ' . xf_table('suppressions'))));
    $post_cache = [];
    foreach ($out as $e => &$o) {
        $st = $o['statuses'];
        if (isset($suppressed[$e]) || in_array('unsubscribed', $st, true) || in_array('bounced', $st, true)) {
            $o['status'] = in_array('bounced', $st, true) ? 'bounced' : 'unsubscribed';
        } elseif (in_array('replied', $st, true) || $o['last_in'] || $o['replied_at']) {
            $o['status'] = 'replied';
        } elseif (in_array('sent', $st, true)) {
            $o['status'] = 'sent';
        } elseif ($o['queued'] || in_array('queued', $st, true)) {
            $o['status'] = 'queued';
        } else {
            $o['status'] = end($st) ?: 'none';
        }
        $replied_at = max((string) $o['last_in'], (string) $o['replied_at']);
        $o['last_reply'] = $replied_at !== '' ? $replied_at : null;
        // Needs reply: an unanswered stored reply, or a detected reply with no stored copy that nobody marked handled.
        $o['needs_reply'] = $o['status'] !== 'bounced' && ($o['unhandled'] || ($o['status'] === 'replied' && !$o['last_in'] && empty($handled[$e])));
        if (!$o['post_id']) {
            $key = $o['listing_url'] . '|' . $o['startup'];
            if (!isset($post_cache[$key])) {
                $id = $o['listing_url'] ? url_to_postid($o['listing_url']) : 0;
                if (!$id && $o['startup'] !== '') {
                    $found = get_posts(['post_type' => 'xf_startup', 'post_status' => ['publish', 'future', 'pending', 'draft'], 'title' => $o['startup'], 'numberposts' => 1, 'fields' => 'ids']);
                    $id = $found[0] ?? 0;
                }
                $post_cache[$key] = (int) $id;
            }
            $o['post_id'] = $post_cache[$key];
        }
        $o['listing'] = xf_inbox_listing($o['post_id']);
        if ($o['startup'] === '' && $o['listing']['title'] !== '') $o['startup'] = $o['listing']['title'];
    }
    unset($o);
    uasort($out, function ($a, $b) {
        return [$b['needs_reply'], (string) $b['last_reply'], (string) $b['last_sent']] <=> [$a['needs_reply'], (string) $a['last_reply'], (string) $a['last_sent']];
    });
    return $out;
}

function xf_inbox_tabs() {
    return [
        'all' => ['All', function ($o) { return true; }],
        'needs_reply' => ['Needs reply', function ($o) { return $o['needs_reply']; }],
        'pending' => ['Pending / queued', function ($o) { return $o['queued'] || $o['status'] === 'queued'; }],
        'sent' => ['Sent, awaiting reply', function ($o) { return $o['status'] === 'sent'; }],
        'stopped' => ['Bounced / unsubscribed', function ($o) { return in_array($o['status'], ['bounced', 'unsubscribed'], true); }],
    ];
}

/** Sends vs replies per local day for the last 14 days. */
function xf_inbox_daily() {
    global $wpdb;
    $since = gmdate('Y-m-d H:i:s', time() - 15 * DAY_IN_SECONDS);
    $days = [];
    for ($i = 13; $i >= 0; $i--) {
        $days[wp_date('Y-m-d', time() - $i * DAY_IN_SECONDS)] = ['sent' => 0, 'replies' => 0];
    }
    $bump = function ($gmt, $key) use (&$days) {
        $d = wp_date('Y-m-d', strtotime($gmt . ' UTC'));
        if (isset($days[$d])) $days[$d][$key]++;
    };
    foreach ($wpdb->get_col($wpdb->prepare('SELECT sent_at FROM ' . xf_table('email_log') . ' WHERE sent_at >= %s AND dry_run = 0', $since)) as $t) $bump($t, 'sent');
    foreach ($wpdb->get_col($wpdb->prepare('SELECT sent_at FROM ' . xf_table('messages') . " WHERE status = 'sent' AND sent_at >= %s", $since)) as $t) $bump($t, 'sent');
    foreach ($wpdb->get_col($wpdb->prepare('SELECT received_at FROM ' . xf_table('inbox') . " WHERE direction = 'out' AND received_at >= %s", $since)) as $t) $bump($t, 'sent');
    $replies = $wpdb->get_col($wpdb->prepare('SELECT received_at FROM ' . xf_table('inbox') . " WHERE direction = 'in' AND received_at >= %s", $since));
    if (!$replies && !$wpdb->get_var('SELECT 1 FROM ' . xf_table('inbox') . " WHERE direction = 'in' LIMIT 1")) {
        // No stored replies yet (IMAP off): fall back to detected reply times.
        $replies = array_merge(
            $wpdb->get_col($wpdb->prepare('SELECT replied_at FROM ' . xf_table('email_log') . ' WHERE replied_at >= %s', $since)),
            $wpdb->get_col($wpdb->prepare('SELECT replied_at FROM ' . xf_table('contacts') . ' WHERE replied_at >= %s', $since))
        );
    }
    foreach ($replies as $t) $bump($t, 'replies');
    return $days;
}

function xf_inbox_chart_svg(array $days) {
    $max = max(1, max(array_map(function ($d) { return max($d['sent'], $d['replies']); }, $days)));
    $w = 560; $h = 150; $pad = 22; $slot = ($w - $pad) / count($days); $bw = max(4, ($slot - 6) / 2);
    $svg = '<svg viewBox="0 0 ' . $w . ' ' . ($h + 24) . '" width="100%" style="max-width:' . $w . 'px" role="img" aria-label="Emails sent and replies received per day, last 14 days">';
    $svg .= '<line x1="' . $pad . '" y1="' . $h . '" x2="' . $w . '" y2="' . $h . '" stroke="#c3c4c7"/>';
    $svg .= '<text x="0" y="12" font-size="10" fill="#646970">' . (int) $max . '</text>';
    $i = 0;
    foreach ($days as $date => $d) {
        $x = $pad + $i * $slot + 3;
        foreach (['sent' => '#2271b1', 'replies' => '#00a32a'] as $k => $color) {
            $bh = round(($h - 16) * $d[$k] / $max);
            $svg .= sprintf('<rect x="%.1f" y="%d" width="%.1f" height="%d" fill="%s"><title>%s: %d %s</title></rect>', $x, $h - $bh, $bw, $bh, $color, esc_attr(wp_date('j M', strtotime($date . ' 12:00'))), $d[$k], $k === 'sent' ? 'sent' : 'replies');
            $x += $bw;
        }
        if ($i % 2 === 0) {
            $svg .= sprintf('<text x="%.1f" y="%d" font-size="10" fill="#646970" text-anchor="middle">%s</text>', $pad + $i * $slot + $slot / 2, $h + 14, esc_html(wp_date('j M', strtotime($date . ' 12:00'))));
        }
        $i++;
    }
    return $svg . '</svg>';
}

/* -------------------------------------------------------------------------
 * Admin actions
 * ---------------------------------------------------------------------- */

function xf_inbox_url(array $args = []) {
    return add_query_arg($args, admin_url('admin.php?page=xf-inbox'));
}

add_action('admin_menu', function () {
    add_submenu_page('xf', 'Outreach inbox', 'Outreach inbox', 'manage_options', 'xf-inbox', 'xf_inbox_admin_page');
}, 21);

add_action('admin_post_xf_inbox', function () {
    $do = isset($_REQUEST['do']) ? sanitize_key(wp_unslash($_REQUEST['do'])) : '';
    if (!current_user_can('manage_options') || !in_array($do, ['sync', 'reply', 'handled', 'stop'], true) || !check_admin_referer('xf_inbox_' . $do)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $email = isset($_REQUEST['email']) ? strtolower(sanitize_email(wp_unslash($_REQUEST['email']))) : '';
    $back = $email ? xf_inbox_url(['email' => $email]) : xf_inbox_url();
    if ($do !== 'sync' && !is_email($email)) {
        wp_die('Invalid address', '', ['response' => 400]);
    }
    $msg = '';
    switch ($do) {
        case 'sync':
            $r = xf_inbox_sync();
            $msg = isset($r['skipped']) ? 'Sync skipped: ' . $r['skipped'] : sprintf('Mailbox checked: %d messages scanned, %d new replies stored.', $r['scanned'], $r['stored']);
            $back = wp_get_referer() ?: xf_inbox_url();
            break;
        case 'reply':
            $r = xf_inbox_send_reply($email, isset($_POST['reply']) ? sanitize_textarea_field(wp_unslash($_POST['reply'])) : '');
            $msg = is_wp_error($r) ? $r->get_error_message() : $r;
            break;
        case 'handled':
            xf_inbox_mark_handled($email);
            $msg = 'Marked handled.';
            break;
        case 'stop':
            xf_inbox_stop_sends($email);
            global $wpdb;
            // Stopping counts as a "replied" status; don't then list someone who never wrote as needing a reply.
            if (!$wpdb->get_var($wpdb->prepare('SELECT 1 FROM ' . xf_table('inbox') . " WHERE email = %s AND direction = 'in' AND handled = 0", $email))) {
                xf_inbox_mark_handled($email);
            }
            $msg = 'All queued emails to ' . $email . ' are stopped.';
            break;
    }
    set_transient('xf_notice_' . get_current_user_id(), $msg, 60);
    wp_safe_redirect($back);
    exit;
});

function xf_inbox_action_url($do, array $args = []) {
    return wp_nonce_url(add_query_arg(array_merge(['action' => 'xf_inbox', 'do' => $do], $args), admin_url('admin-post.php')), 'xf_inbox_' . $do);
}

/* -------------------------------------------------------------------------
 * Admin page
 * ---------------------------------------------------------------------- */

function xf_inbox_date($gmt, $fmt = 'j M Y, H:i') {
    return $gmt ? wp_date($fmt, strtotime($gmt . ' UTC')) : '—';
}

function xf_inbox_badge($key, $label) {
    return '<span class="xf-ib-badge xf-ib-' . esc_attr($key) . '">' . esc_html($label) . '</span>';
}

function xf_inbox_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $email = isset($_GET['email']) ? strtolower(sanitize_email(wp_unslash($_GET['email']))) : '';
    ?>
    <div class="wrap xf-ib">
        <style>
            .xf-ib .xf-ib-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0}
            .xf-ib .xf-ib-card{background:#fff;border:1px solid #dcdcde;border-radius:4px;padding:10px 12px}
            .xf-ib .xf-ib-card b{display:block;font-size:22px;line-height:1.3}
            .xf-ib .xf-ib-card span{color:#646970}
            .xf-ib .xf-ib-row{display:grid;grid-template-columns:2fr 1fr;gap:12px}
            @media (max-width:1100px){.xf-ib .xf-ib-row{grid-template-columns:1fr}}
            .xf-ib .xf-ib-badge{display:inline-block;padding:1px 7px;border-radius:10px;font-size:11px;background:#f0f0f1;color:#3c434a;white-space:nowrap}
            .xf-ib .xf-ib-publish{background:#d1f5d3;color:#0a5c1a}.xf-ib .xf-ib-future{background:#dbe9fb;color:#0a3d7a}
            .xf-ib .xf-ib-pending{background:#fcf0c3;color:#6b4e00}.xf-ib .xf-ib-draft{background:#ececec}
            .xf-ib .xf-ib-replied{background:#d1f5d3;color:#0a5c1a}.xf-ib .xf-ib-bounced,.xf-ib .xf-ib-unsubscribed{background:#fbdada;color:#8a1f1f}
            .xf-ib .xf-ib-needs{background:#d63638;color:#fff}
            .xf-ib tr.xf-ib-click{cursor:pointer}
            .xf-ib .xf-ib-msg{background:#fff;border:1px solid #dcdcde;border-radius:6px;padding:10px 14px;margin:10px 0;max-width:820px}
            .xf-ib .xf-ib-in{border-left:4px solid #00a32a}.xf-ib .xf-ib-out{border-left:4px solid #2271b1;margin-left:40px}
            .xf-ib .xf-ib-meta{color:#646970;font-size:12px;margin-bottom:6px}
            .xf-ib .xf-ib-body{white-space:normal;word-wrap:break-word;overflow-wrap:anywhere}
        </style>
        <h1 class="wp-heading-inline">Outreach inbox</h1>
        <a class="page-title-action" href="<?php echo esc_url(xf_inbox_action_url('sync')); ?>">Sync now</a>
        <hr class="wp-header-end">
        <?php
        $blocked = xf_inbox_block_reason();
        if ($blocked) {
            echo '<div class="notice notice-warning inline"><p>' . esc_html($blocked) . '</p></div>';
        }
        $last = get_option('xf_inbox_last_sync');
        if (!empty($last['at'])) {
            $r = $last['result'];
            echo '<p class="description">Last mailbox sync: ' . esc_html(wp_date('j M H:i', $last['at'])) . ' — ' . esc_html(isset($r['skipped']) ? $r['skipped'] : sprintf('%d scanned, %d new', $r['scanned'] ?? 0, $r['stored'] ?? 0)) . '. Runs every 15 minutes; it reads the mailbox without marking anything as read.</p>';
        }
        $contacts = xf_inbox_contacts();
        if ($email !== '' && isset($contacts[$email])) {
            xf_inbox_thread_view($contacts[$email]);
        } else {
            xf_inbox_overview($contacts);
        }
        ?>
    </div>
    <?php
}

function xf_inbox_overview(array $contacts) {
    global $wpdb;
    $log = xf_table('email_log');
    $today = gmdate('Y-m-d H:i:s', strtotime(wp_date('Y-m-d 00:00:00') . ' ' . wp_timezone_string()));
    $count = function ($status) use ($contacts) {
        return count(array_filter($contacts, function ($o) use ($status) { return $o['status'] === $status; }));
    };
    $queued = (int) $wpdb->get_var("SELECT COUNT(*) FROM $log WHERE status = 'queued'")
        + (int) $wpdb->get_var('SELECT COUNT(*) FROM ' . xf_table('contacts') . " WHERE status IN ('queued','contacted') AND next_send_at IS NOT NULL");
    $sent_today = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $log WHERE dry_run = 0 AND sent_at >= %s", $today))
        + (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('messages') . " WHERE status = 'sent' AND sent_at >= %s", $today));
    $sent_total = (int) $wpdb->get_var("SELECT COUNT(*) FROM $log WHERE dry_run = 0 AND sent_at IS NOT NULL")
        + (int) $wpdb->get_var('SELECT COUNT(*) FROM ' . xf_table('messages') . " WHERE status = 'sent'");
    $dry_total = (int) $wpdb->get_var("SELECT COUNT(*) FROM $log WHERE dry_run = 1 AND sent_at IS NOT NULL");
    $ai = $wpdb->get_results("SELECT email, startup, updated_at FROM $log WHERE status = 'queued' AND ai_status = 'draft' ORDER BY updated_at ASC LIMIT 20");
    $auto = (int) xf_camp_settings()['auto_approve_minutes'];
    $needs = count(array_filter($contacts, function ($o) { return $o['needs_reply']; }));

    $cards = [
        ['Needs reply', $needs], ['Queued', $queued], ['Sent today', $sent_today], ['Sent in total', $sent_total],
        ['Awaiting reply', $count('sent')], ['Replied', $count('replied')], ['Bounced', $count('bounced')],
        ['Unsubscribed', $count('unsubscribed')], ['AI emails to approve', count($ai)],
    ];
    // Listings tied to anyone we emailed or queued.
    $products = ['publish' => [], 'future' => [], 'pending' => [], 'draft' => []];
    foreach ($contacts as $o) {
        if (isset($products[$o['listing']['key']])) $products[$o['listing']['key']][$o['listing']['id']] = $o['listing'];
    }
    ?>
    <div class="xf-ib-cards">
        <?php foreach ($cards as [$label, $n]) : ?>
            <div class="xf-ib-card"><b><?php echo (int) $n; ?></b><span><?php echo esc_html($label); ?></span></div>
        <?php endforeach; ?>
    </div>
    <?php if ($dry_total) : ?><p class="description"><?php echo (int) $dry_total; ?> dry-run emails were rendered but never sent; they're not counted above.</p><?php endif; ?>

    <div class="xf-ib-row">
        <div class="card" style="max-width:none">
            <h2>Sends vs replies, last 14 days</h2>
            <?php echo xf_inbox_chart_svg(xf_inbox_daily()); // phpcs:ignore WordPress.Security.EscapeOutput -- built from integers and escaped dates. ?>
            <p class="description"><span style="color:#2271b1">■</span> sent &nbsp; <span style="color:#00a32a">■</span> replies</p>
        </div>
        <div class="card" style="max-width:none">
            <h2>Products of people we contacted</h2>
            <ul>
                <li><?php echo xf_inbox_badge('publish', 'Live'); ?> <?php echo count($products['publish']); ?></li>
                <li><?php echo xf_inbox_badge('future', 'Scheduled'); ?> <?php echo count($products['future']); ?>
                    <?php foreach (array_slice($products['future'], 0, 5) as $l) : ?><br><span class="description"><?php echo esc_html($l['title'] . ' — ' . $l['label']); ?></span><?php endforeach; ?></li>
                <li><?php echo xf_inbox_badge('pending', 'Pending review'); ?> <?php echo count($products['pending']); ?></li>
                <li><?php echo xf_inbox_badge('draft', 'Draft'); ?> <?php echo count($products['draft']); ?></li>
            </ul>
            <?php if ($ai) : ?>
                <h3>AI emails waiting for approval</h3>
                <ul>
                    <?php foreach ($ai as $a) : ?>
                        <li><?php echo esc_html($a->email . ($a->startup ? ' (' . $a->startup . ')' : '')); ?> —
                            <?php echo $auto > 0 ? 'auto-sends after ' . esc_html(wp_date('j M H:i', strtotime($a->updated_at . ' UTC') + $auto * MINUTE_IN_SECONDS)) : 'waits for your approval'; ?></li>
                    <?php endforeach; ?>
                </ul>
                <p><a href="<?php echo esc_url(admin_url('admin.php?page=xf-outreach')); ?>">Review them in Founder outreach</a></p>
            <?php endif; ?>
        </div>
    </div>
    <?php
    xf_inbox_table($contacts);
    xf_inbox_pipeline($contacts);
}

function xf_inbox_table(array $contacts) {
    $tabs = xf_inbox_tabs();
    $tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'all';
    if (!isset($tabs[$tab])) $tab = 'all';
    $q = isset($_GET['q']) ? strtolower(sanitize_text_field(wp_unslash($_GET['q']))) : '';
    $paged = max(1, isset($_GET['paged']) ? absint($_GET['paged']) : 1);
    $rows = array_filter($contacts, $tabs[$tab][1]);
    if ($q !== '') {
        $rows = array_filter($rows, function ($o) use ($q) {
            return strpos(strtolower($o['email'] . ' ' . $o['name'] . ' ' . $o['startup'] . ' ' . $o['campaign']), $q) !== false;
        });
    }
    $total = count($rows);
    $pages = max(1, (int) ceil($total / XF_INBOX_PER_PAGE));
    $rows = array_slice($rows, ($paged - 1) * XF_INBOX_PER_PAGE, XF_INBOX_PER_PAGE);
    ?>
    <h2>Contacts</h2>
    <ul class="subsubsub">
        <?php $i = 0; foreach ($tabs as $key => [$label, $fn]) : ?>
            <li><?php echo $i++ ? '| ' : ''; ?><a class="<?php echo $tab === $key ? 'current' : ''; ?>" href="<?php echo esc_url(xf_inbox_url(['tab' => $key])); ?>"><?php echo esc_html($label); ?> <span class="count">(<?php echo count(array_filter($contacts, $fn)); ?>)</span></a></li>
        <?php endforeach; ?>
    </ul>
    <form method="get" style="float:right;margin:6px 0">
        <input type="hidden" name="page" value="xf-inbox"><input type="hidden" name="tab" value="<?php echo esc_attr($tab); ?>">
        <input type="search" name="q" value="<?php echo esc_attr($q); ?>" placeholder="Email, name or startup"> <button class="button">Search</button>
    </form>
    <table class="widefat striped" style="clear:both">
        <thead><tr><th>Contact</th><th>Startup / listing</th><th>Campaign</th><th>Step</th><th>Last sent</th><th>Next send</th><th>Opened / clicked</th><th>Status</th><th>Last reply</th></tr></thead>
        <tbody>
        <?php if (!$rows) : ?><tr><td colspan="9">Nobody here.</td></tr><?php endif; ?>
        <?php foreach ($rows as $o) : $url = xf_inbox_url(['email' => $o['email']]); ?>
            <tr class="xf-ib-click" data-href="<?php echo esc_url($url); ?>">
                <td><a href="<?php echo esc_url($url); ?>"><strong><?php echo esc_html($o['name'] ?: $o['email']); ?></strong></a><?php if ($o['name']) : ?><br><span class="description"><?php echo esc_html($o['email']); ?></span><?php endif; ?></td>
                <td><?php echo esc_html($o['startup'] ?: '—'); ?><br><?php echo xf_inbox_badge($o['listing']['key'], $o['listing']['label']); ?></td>
                <td><?php echo esc_html($o['campaign']); ?></td>
                <td><?php echo $o['step'] < 0 ? '—' : esc_html(xf_camp_step_label($o['step'])); ?></td>
                <td><?php echo esc_html(xf_inbox_date($o['last_sent'], 'j M H:i')); ?><?php echo $o['dry'] ? '<br><span class="description">dry run</span>' : ''; ?></td>
                <td><?php echo $o['next_send'] ? esc_html(xf_inbox_date($o['next_send'], 'j M H:i')) . '<br>' : ''; ?><span class="description"><?php echo esc_html($o['status'] === 'sent' || $o['queued'] ? $o['next_note'] : ''); ?></span></td>
                <td><?php echo $o['opens'] ? 'Opened (' . (int) $o['opens'] . ')' : '—'; ?><?php echo $o['clicks'] ? '<br>Clicked (' . (int) $o['clicks'] . ')' : ''; ?></td>
                <td><?php echo xf_inbox_badge($o['status'], $o['status']); ?><?php echo $o['needs_reply'] ? ' ' . xf_inbox_badge('needs', 'needs reply') : ''; ?></td>
                <td><?php echo esc_html(xf_inbox_date($o['last_reply'], 'j M H:i')); ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php if ($pages > 1) : ?>
        <div class="tablenav"><div class="tablenav-pages"><span class="displaying-num"><?php echo (int) $total; ?> contacts</span>
            <?php echo wp_kses_post(paginate_links(['base' => add_query_arg('paged', '%#%', xf_inbox_url(array_filter(['tab' => $tab, 'q' => $q]))), 'format' => '', 'current' => $paged, 'total' => $pages])); ?>
        </div></div>
    <?php endif; ?>
    <script>
        document.querySelectorAll('.xf-ib tr.xf-ib-click').forEach(function (tr) {
            tr.addEventListener('click', function (e) { if (!e.target.closest('a')) location.href = tr.dataset.href; });
        });
    </script>
    <?php
}

/** Upcoming and recent listings, and whether their founder knows. */
function xf_inbox_pipeline(array $contacts) {
    $by_post = [];
    foreach ($contacts as $o) {
        if ($o['post_id']) $by_post[$o['post_id']][] = $o;
    }
    $upcoming = get_posts(['post_type' => 'xf_startup', 'post_status' => ['future', 'pending', 'draft'], 'numberposts' => 30, 'orderby' => 'date', 'order' => 'ASC']);
    $recent = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'numberposts' => 20, 'orderby' => 'date', 'order' => 'DESC']);
    $order = ['future' => 0, 'pending' => 1, 'draft' => 2];
    usort($upcoming, function ($a, $b) use ($order) {
        return [$order[$a->post_status] ?? 3, $a->post_date] <=> [$order[$b->post_status] ?? 3, $b->post_date];
    });
    ?>
    <h2 style="margin-top:28px">Product pipeline</h2>
    <p class="description">Scheduled and pending listings first, then the latest live ones, with whether the founder has heard from us.</p>
    <table class="widefat striped">
        <thead><tr><th>Listing</th><th>Status</th><th>Date</th><th>Founder emailed?</th><th>Reply</th></tr></thead>
        <tbody>
        <?php foreach (array_merge($upcoming, $recent) as $p) : $l = xf_inbox_listing($p->ID); $people = $by_post[$p->ID] ?? []; ?>
            <tr>
                <td><?php if ($l['url']) : ?><a href="<?php echo esc_url($l['url']); ?>"><?php echo esc_html(get_the_title($p)); ?></a><?php else : echo esc_html(get_the_title($p)); endif; ?>
                    <?php if (get_post_meta($p->ID, '_xf_source', true) === 'launch_form') : ?><br><span class="description">Submitted by the founder</span><?php endif; ?></td>
                <td><?php echo xf_inbox_badge($l['key'], $l['label']); ?></td>
                <td><?php echo esc_html(get_the_date('j M Y', $p)); ?></td>
                <td><?php if (!$people) : ?><span class="description">Not contacted</span><?php endif; ?>
                    <?php foreach ($people as $o) : ?><a href="<?php echo esc_url(xf_inbox_url(['email' => $o['email']])); ?>"><?php echo esc_html($o['email']); ?></a> <span class="description">(<?php echo esc_html($o['last_sent'] ? 'emailed ' . xf_inbox_date($o['last_sent'], 'j M') : $o['status']); ?>)</span><br><?php endforeach; ?></td>
                <td><?php foreach ($people as $o) : ?><?php echo xf_inbox_badge($o['status'], $o['status']); ?><?php echo $o['needs_reply'] ? ' ' . xf_inbox_badge('needs', 'needs reply') : ''; ?><br><?php endforeach; ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$upcoming && !$recent) : ?><tr><td colspan="5">No listings yet.</td></tr><?php endif; ?>
        </tbody>
    </table>
    <?php
}

/** Every message to and from one address, oldest first. */
function xf_inbox_thread($email) {
    global $wpdb;
    $items = [];
    foreach ($wpdb->get_results($wpdb->prepare('SELECT l.subject, l.body, l.sent_at, l.dry_run, l.step, c.name AS campaign FROM ' . xf_table('email_log') . ' l LEFT JOIN ' . xf_table('campaigns') . ' c ON c.id = l.campaign_id WHERE l.email = %s AND l.sent_at IS NOT NULL', $email)) as $r) {
        $items[] = ['dir' => 'out', 'at' => $r->sent_at, 'subject' => $r->subject, 'body' => (string) $r->body, 'note' => ($r->campaign ?: 'Campaign') . ' · ' . xf_camp_step_label($r->step) . ($r->dry_run ? ' · dry run, not actually sent' : '')];
    }
    foreach ($wpdb->get_results($wpdb->prepare('SELECT m.subject, m.body, m.sent_at, m.step, m.status FROM ' . xf_table('messages') . ' m INNER JOIN ' . xf_table('contacts') . ' c ON c.id = m.contact_id WHERE c.email = %s', $email)) as $r) {
        $items[] = ['dir' => 'out', 'at' => $r->sent_at, 'subject' => $r->subject, 'body' => (string) $r->body, 'note' => 'Founder sequence · ' . xf_camp_step_label($r->step) . ($r->status !== 'sent' ? ' · ' . $r->status : '')];
    }
    foreach ($wpdb->get_results($wpdb->prepare('SELECT * FROM ' . xf_table('inbox') . ' WHERE email = %s', $email)) as $r) {
        $items[] = ['dir' => $r->direction === 'out' ? 'out' : 'in', 'at' => $r->received_at, 'subject' => $r->subject, 'body' => (string) $r->body_text, 'note' => $r->direction === 'out' ? 'Your reply from WordPress' : ($r->handled ? 'Reply · handled' : 'Reply · not answered yet')];
    }
    usort($items, function ($a, $b) { return strcmp($a['at'], $b['at']); });
    return $items;
}

function xf_inbox_thread_view(array $o) {
    $email = $o['email'];
    ?>
    <p><a href="<?php echo esc_url(xf_inbox_url()); ?>">&larr; All contacts</a></p>
    <h2><?php echo esc_html(($o['name'] ? $o['name'] . ' · ' : '') . $email); ?></h2>
    <p><?php echo esc_html($o['startup'] ?: '—'); ?> <?php echo xf_inbox_badge($o['listing']['key'], $o['listing']['label']); ?>
        · <?php echo esc_html($o['campaign']); ?> · <?php echo xf_inbox_badge($o['status'], $o['status']); ?>
        <?php echo $o['needs_reply'] ? xf_inbox_badge('needs', 'needs reply') : ''; ?></p>
    <p>
        <?php if ($o['needs_reply']) : ?><a class="button" href="<?php echo esc_url(xf_inbox_action_url('handled', ['email' => $email])); ?>">Mark handled</a><?php endif; ?>
        <a class="button" href="<?php echo esc_url(xf_inbox_action_url('stop', ['email' => $email])); ?>" onclick="return confirm('Stop every queued email to this address?');">Stop all emails to this address</a>
        <?php if ($o['listing']['url']) : ?><a class="button" href="<?php echo esc_url($o['listing']['url']); ?>" target="_blank" rel="noopener">Open listing</a><?php endif; ?>
    </p>
    <p class="description">Replies are shown as plain text. Links in them are not clickable and images are never loaded; copy a link only if you trust it.</p>
    <?php
    $items = xf_inbox_thread($email);
    if (!$items) echo '<p>No messages yet.</p>';
    foreach ($items as $m) :
        $shown = $m['dir'] === 'in' ? xf_inbox_trim_quotes($m['body']) : $m['body'];
        ?>
        <div class="xf-ib-msg xf-ib-<?php echo esc_attr($m['dir']); ?>">
            <div class="xf-ib-meta"><strong><?php echo $m['dir'] === 'in' ? esc_html($email) : 'You'; ?></strong> · <?php echo esc_html(xf_inbox_date($m['at'])); ?> · <?php echo esc_html($m['note']); ?></div>
            <div><strong><?php echo esc_html($m['subject']); ?></strong></div>
            <div class="xf-ib-body"><?php echo nl2br(esc_html($shown)); ?></div>
            <?php if ($shown !== trim($m['body'])) : ?>
                <details><summary>Show quoted text</summary><div class="xf-ib-body"><?php echo nl2br(esc_html($m['body'])); ?></div></details>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>

    <h3>Reply</h3>
    <?php if (in_array($o['status'], ['bounced', 'unsubscribed'], true)) : ?>
        <p>This address <?php echo esc_html($o['status']); ?>. Replies are disabled.</p>
    <?php else : ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="max-width:820px">
            <input type="hidden" name="action" value="xf_inbox"><input type="hidden" name="do" value="reply"><input type="hidden" name="email" value="<?php echo esc_attr($email); ?>">
            <?php wp_nonce_field('xf_inbox_reply'); ?>
            <textarea name="reply" rows="8" class="large-text" required placeholder="Write your reply. It goes from the outreach mailbox, in the same thread, with the unsubscribe line and postal address added below."></textarea>
            <p><button class="button button-primary">Send reply</button> <span class="description">Sent only when you click. Copied to the webmail Sent folder when IMAP allows.</span></p>
        </form>
    <?php endif;
}
