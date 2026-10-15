<?php
if (!defined('ABSPATH')) {
    exit;
}

const XF_OUTREACH_STEPS = 3;

function xf_feature_url($token) {
    return xf_page_url('feature', ['t' => $token]);
}

function xf_unsubscribe_url($token) {
    return xf_page_url('unsubscribe', ['t' => $token]);
}

/**
 * Plain-text emails read like a personal note and deliver better than HTML for
 * one-to-one outreach. Steps 1 and 2 go out as replies in the same thread.
 */
function xf_render_outreach_email($step, array $v) {
    $s = xf_get_settings();
    $greeting = 'Hi ' . ($v['first_name'] ?: 'there') . ',';
    $first_subject = $v['product'] . ' is now listed on 100xFounder';
    $footer = implode("\n", array_filter([
        '--',
        "You're getting this because {$v['product']} launched publicly on Product Hunt.",
        "Don't want to hear from us again? {$v['unsubscribe_url']}",
        $s['postal_address'],
    ]));
    $sender = $s['from_name'];
    $ig = $s['instagram_handle'] ? " and shared on our Instagram (@{$s['instagram_handle']})" : '';

    if ($step === 0) {
        $votes = $v['votes'] >= 50 ? " ({$v['votes']} upvotes, nice work)" : '';
        $body = [
            $greeting, '',
            "Congrats on launching {$v['product']} on Product Hunt{$votes}. \"{$v['tagline']}\" stood out, and it made our pick of the day's top launches.", '',
            "We've listed it on 100xFounder, a directory of new startups: {$v['listing_url']}", '',
            "We'd also love to feature you in a free founder spotlight: a short story about why you built {$v['product']}, published on our site{$ig}. It takes about 5 minutes:",
            $v['feature_url'], '',
            "No cost and no catch. If it's not for you, just ignore this email.", '',
            $sender, '100xFounder', '', $footer,
        ];
        return ['subject' => $first_subject, 'body' => implode("\n", $body)];
    }
    if ($step === 1) {
        $body = [
            $greeting, '',
            "Quick follow-up: your free founder spotlight for {$v['product']} is still open. Founders use it to tell their story and get a backlink plus an Instagram feature.", '',
            $v['feature_url'], '', $sender, '', $footer,
        ];
        return ['subject' => 'Re: ' . $first_subject, 'body' => implode("\n", $body)];
    }
    $body = [
        $greeting, '',
        "Last note from me. If you'd like {$v['product']} featured in a founder spotlight, the form is here whenever you're ready:",
        $v['feature_url'], '',
        'Either way, good luck with the launch!', '', $sender, '', $footer,
    ];
    return ['subject' => 'Re: ' . $first_subject, 'body' => implode("\n", $body)];
}

function xf_new_mailer() {
    require_once ABSPATH . WPINC . '/PHPMailer/PHPMailer.php';
    require_once ABSPATH . WPINC . '/PHPMailer/SMTP.php';
    require_once ABSPATH . WPINC . '/PHPMailer/Exception.php';
    $s = xf_get_settings();
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $s['smtp_host'];
    $mail->Port = (int) $s['smtp_port'];
    $mail->SMTPAuth = true;
    $mail->Username = $s['smtp_user'];
    $mail->Password = $s['smtp_pass'];
    $mail->SMTPSecure = (int) $s['smtp_port'] === 465 ? 'ssl' : 'tls';
    $mail->SMTPKeepAlive = true;
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 20;
    $mail->isHTML(false);
    $mail->setFrom(xf_from_email(), $s['from_name']);
    if ($s['reply_to']) {
        $mail->addReplyTo($s['reply_to']);
    }
    /** Lets site owners adjust the SMTP connection (e.g. TLS options) if their host needs it. */
    do_action('xf_mailer_init', $mail);
    return $mail;
}

/** Why sending is currently blocked, or null when it can run. */
function xf_outreach_block_reason() {
    $s = xf_get_settings();
    if (empty($s['outreach_enabled'])) return 'Outreach sending is turned off in Settings.';
    if (!xf_smtp_configured()) return 'SMTP mailbox is not configured.';
    // CAN-SPAM requires a physical postal address in commercial email.
    if (trim($s['postal_address']) === '') return 'Postal address is not set.';
    return null;
}

function xf_send_due_outreach() {
    global $wpdb;
    $blocked = xf_outreach_block_reason();
    if ($blocked) {
        return ['skipped' => $blocked, 'sent' => 0, 'failed' => 0];
    }
    $s = xf_get_settings();
    $contacts_table = xf_table('contacts');
    $messages_table = xf_table('messages');

    $sent_today = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $messages_table WHERE status = 'sent' AND sent_at >= %s",
        gmdate('Y-m-d 00:00:00')
    ));
    $remaining = max((int) $s['daily_limit'] - $sent_today, 0);
    if ($remaining === 0) {
        return ['skipped' => 'Daily limit reached', 'sent' => 0, 'failed' => 0];
    }

    // Follow-ups first so existing threads progress before new ones start.
    $due = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $contacts_table WHERE status IN ('queued','contacted') AND step < %d AND next_send_at <= %s ORDER BY step DESC, next_send_at ASC LIMIT %d",
        XF_OUTREACH_STEPS, xf_now(), $remaining
    ));
    if (!$due) {
        return ['sent' => 0, 'failed' => 0];
    }

    $mailer = xf_new_mailer();
    $delays = [(int) $s['followup_1_days'], (int) $s['followup_2_days']];
    $sent = 0;
    $failed = 0;

    foreach ($due as $contact) {
        $startup = get_post($contact->startup_id);
        if (!$startup || $startup->post_status !== 'publish') {
            continue;
        }
        if (xf_is_suppressed($contact->email)) {
            $wpdb->update($contacts_table, ['status' => 'unsubscribed', 'next_send_at' => null, 'updated_at' => xf_now()], ['id' => $contact->id]);
            continue;
        }

        $step = (int) $contact->step;
        $unsubscribe_url = xf_unsubscribe_url($contact->token);
        $email = xf_render_outreach_email($step, [
            'first_name' => $contact->name ? strtok($contact->name, ' ') : '',
            'product' => get_the_title($startup),
            'tagline' => (string) get_post_meta($startup->ID, '_xf_tagline', true),
            'votes' => (int) get_post_meta($startup->ID, '_xf_votes', true),
            'listing_url' => get_permalink($startup),
            'feature_url' => xf_feature_url($contact->token),
            'unsubscribe_url' => $unsubscribe_url,
        ]);
        $thread_root = $wpdb->get_var($wpdb->prepare(
            "SELECT message_id FROM $messages_table WHERE contact_id = %d AND status = 'sent' ORDER BY sent_at ASC LIMIT 1",
            $contact->id
        ));

        try {
            $mailer->clearAllRecipients();
            $mailer->clearCustomHeaders();
            $mailer->addAddress($contact->email);
            $mailer->Subject = $email['subject'];
            $mailer->Body = $email['body'];
            $mailer->MessageID = '';
            $mailer->addCustomHeader('List-Unsubscribe', '<' . $unsubscribe_url . '>');
            $mailer->addCustomHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
            if ($thread_root) {
                $mailer->addCustomHeader('In-Reply-To', $thread_root);
                $mailer->addCustomHeader('References', $thread_root);
            }
            $mailer->send();

            $next_step = $step + 1;
            $done = $next_step >= XF_OUTREACH_STEPS;
            $wpdb->insert($messages_table, [
                'contact_id' => $contact->id, 'step' => $step, 'subject' => $email['subject'], 'body' => $email['body'],
                'message_id' => $mailer->getLastMessageID(), 'status' => 'sent', 'sent_at' => xf_now(),
            ]);
            $wpdb->update($contacts_table, [
                'step' => $next_step,
                'status' => $done ? 'sequence_done' : 'contacted',
                'last_sent_at' => xf_now(),
                'next_send_at' => $done ? null : gmdate('Y-m-d H:i:s', time() + $delays[$step] * DAY_IN_SECONDS),
                'updated_at' => xf_now(),
            ], ['id' => $contact->id]);
            $sent++;
        } catch (Exception $e) {
            $failed++;
            $wpdb->insert($messages_table, [
                'contact_id' => $contact->id, 'step' => $step, 'subject' => $email['subject'], 'body' => $email['body'],
                'status' => 'failed', 'error' => substr($e->getMessage(), 0, 500), 'sent_at' => xf_now(),
            ]);
            // Retry tomorrow rather than hammering a failing address.
            $wpdb->update($contacts_table, ['next_send_at' => gmdate('Y-m-d H:i:s', time() + DAY_IN_SECONDS), 'updated_at' => xf_now()], ['id' => $contact->id]);
        }
    }
    $mailer->smtpClose();
    return ['sent' => $sent, 'failed' => $failed];
}

function xf_contact_by_token($token) {
    global $wpdb;
    if (!is_string($token) || !preg_match('/^[A-Za-z0-9]{20,64}$/', $token)) {
        return null;
    }
    return $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('contacts') . ' WHERE token = %s', $token));
}

function xf_suppress_email($email, $reason) {
    global $wpdb;
    $wpdb->query($wpdb->prepare(
        'INSERT IGNORE INTO ' . xf_table('suppressions') . ' (email, reason, created_at) VALUES (%s, %s, %s)',
        $email, $reason, xf_now()
    ));
    $wpdb->query($wpdb->prepare(
        'UPDATE ' . xf_table('contacts') . " SET status = %s, next_send_at = NULL, updated_at = %s WHERE email = %s AND status NOT IN ('form_submitted','featured')",
        $reason === 'bounced' ? 'bounced' : 'unsubscribed', xf_now(), $email
    ));
}

/**
 * Lifts a 'bounced' mark from an address we never actually emailed (a false bounce match).
 * Unsubscribes, and bounces after a real send, can never be lifted. Admins only:
 * POST /xf/v1/unsuppress {email}.
 */
function xf_unsuppress_unsent_bounce($email) {
    global $wpdb;
    $email = strtolower(sanitize_email($email));
    $reason = $wpdb->get_var($wpdb->prepare('SELECT reason FROM ' . xf_table('suppressions') . ' WHERE email = %s', $email));
    if ($reason !== 'bounced') {
        return new WP_Error('xf_not_bounced', 'Only a bounced address can be lifted (this one is: ' . ($reason ?: 'not suppressed') . ').', ['status' => 400]);
    }
    $sent = $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('email_log') . " WHERE email = %s AND status IN ('sent','replied','bounced')", $email))
        + $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('contacts') . ' WHERE email = %s AND last_sent_at IS NOT NULL', $email));
    if ($sent) {
        return new WP_Error('xf_real_bounce', 'This address was emailed before, so the bounce is real; leaving it suppressed.', ['status' => 400]);
    }
    $wpdb->delete(xf_table('suppressions'), ['email' => $email]);
    $wpdb->query($wpdb->prepare('UPDATE ' . xf_table('contacts') . " SET status = 'queued', next_send_at = %s, updated_at = %s WHERE email = %s AND status = 'bounced'", xf_now(), xf_now(), $email));
    return ['email' => $email, 'lifted' => true];
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/unsuppress', [
        'methods' => 'POST',
        'permission_callback' => function () { return current_user_can('manage_options'); },
        'callback' => function (WP_REST_Request $r) { return xf_unsuppress_unsent_bounce((string) $r->get_param('email')); },
    ]);
});

/**
 * Reads the outreach mailbox over IMAP (needs PHP's imap extension) and reports
 * which of $emails replied and which bounced since $since (a Unix time).
 * Shared by the founder sequence and the campaign dashboard.
 */
function xf_imap_scan(array $emails, $since) {
    if (!function_exists('imap_open')) {
        return ['skipped' => 'PHP imap extension is not enabled (hPanel → Advanced → PHP Configuration → Extensions → imap).'];
    }
    if (!xf_imap_available()) {
        return ['skipped' => 'Mailbox is not configured.'];
    }
    $emails = array_values(array_unique(array_map('strtolower', $emails)));
    $s = xf_get_settings();
    $mailbox = sprintf('{%s:%d/imap/ssl}INBOX', $s['imap_host'], (int) $s['imap_port']);
    $imap = @imap_open($mailbox, $s['smtp_user'], $s['smtp_pass'], OP_READONLY, 1);
    if (!$imap) {
        return ['skipped' => 'IMAP login failed: ' . imap_last_error()];
    }

    $replied = [];
    $bounced = [];
    $uids = imap_search($imap, 'SINCE "' . gmdate('j-M-Y', $since) . '"', SE_UID) ?: [];
    foreach ($uids as $uid) {
        $header = imap_rfc822_parse_headers(imap_fetchheader($imap, $uid, FT_UID));
        $from = isset($header->from[0]) ? strtolower($header->from[0]->mailbox . '@' . $header->from[0]->host) : '';
        if (in_array($from, $emails, true)) {
            $replied[$from] = true;
            continue;
        }
        if (preg_match('/^(mailer-daemon|postmaster)@/i', $from)) {
            $body = strtolower((string) imap_body($imap, $uid, FT_UID | FT_PEEK));
            foreach ($emails as $email) {
                if (strpos($body, $email) !== false) {
                    $bounced[$email] = true;
                }
            }
        }
    }
    imap_close($imap);
    return ['scanned' => count($uids), 'replied' => $replied, 'bounced' => array_diff_key($bounced, $replied)];
}

/**
 * Stops the sequence for anyone who replied and suppresses addresses that
 * bounced, by reading the outreach mailbox over IMAP.
 */
function xf_check_replies() {
    global $wpdb;
    if (!function_exists('imap_open')) {
        return ['skipped' => 'PHP imap extension is not enabled (hPanel → Advanced → PHP Configuration → Extensions → imap).'];
    }
    if (!xf_imap_available()) {
        return ['skipped' => 'Mailbox is not configured.'];
    }
    $contacts_table = xf_table('contacts');
    $active = $wpdb->get_results("SELECT email, last_sent_at FROM $contacts_table WHERE status IN ('contacted','sequence_done') AND last_sent_at IS NOT NULL");
    if (!$active) {
        return ['scanned' => 0, 'replies' => 0, 'bounces' => 0];
    }
    $since = min(array_map('strtotime', wp_list_pluck($active, 'last_sent_at'))) - DAY_IN_SECONDS;
    $scan = xf_imap_scan(wp_list_pluck($active, 'email'), $since);
    if (isset($scan['skipped'])) {
        return $scan;
    }

    foreach (array_keys($scan['replied']) as $email) {
        $wpdb->query($wpdb->prepare(
            "UPDATE $contacts_table SET status = 'replied', replied_at = %s, next_send_at = NULL, updated_at = %s WHERE email = %s AND status IN ('contacted','sequence_done')",
            xf_now(), xf_now(), $email
        ));
    }
    foreach (array_keys($scan['bounced']) as $email) {
        xf_suppress_email($email, 'bounced');
    }
    return ['scanned' => $scan['scanned'], 'replies' => count($scan['replied']), 'bounces' => count($scan['bounced'])];
}
