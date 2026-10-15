<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 100X Meter growth loops, built on meter.php:
 *  1. Founder milestone emails: the first time a startup crosses 10X, 25X, 50X or 100X
 *     (post meta _xf_meter_milestones), one short template email (no AI) goes to the
 *     company-published contact we already hold. It runs through the campaign email_log
 *     with the campaign footer, List-Unsubscribe headers, suppression, the shared daily
 *     cap, dry-run and stop-on-reply. Setting: "Milestone emails to founders".
 *  2. A per-startup 1080×1350 share card (PNG), cached under uploads with a random name.
 *  3. A Monday "This week's 100X climbers" Instagram carousel (approval-only, like every item).
 *  4. GET xf/v1/meter-breakouts?month=YYYY-MM for the monthly article brief
 *     (content/briefs/monthly-breakout.md).
 * The meter counts reader taps, not quality: every email, card and post says so.
 */

const XF_METER_MILESTONES = [10, 25, 50, 100];

/** Stage name for a level; meter.php's own wins if it ever defines one. */
function xf_meter_growth_stage($level) {
    if (function_exists('xf_meter_stage')) {
        return (string) xf_meter_stage($level);
    }
    $level = (int) $level;
    return $level >= 100 ? '100X club' : ($level >= 50 ? 'Breakout' : ($level >= 25 ? 'Liftoff' : ($level >= 10 ? 'Ignition' : 'Spark')));
}

function xf_meter_level_now($post_id) {
    return xf_meter_level(get_post_meta($post_id, '_xf_meter_30d', true));
}

/* ---- 1. Milestones ---- */

add_action('xf_meter_tapped', 'xf_meter_growth_on_tap', 10, 4);

function xf_meter_growth_on_tap($post_id, $old_level, $new_level, $taps_30d = 0) {
    $hit = xf_meter_record_milestones((int) $post_id, (int) $new_level);
    if ($hit && xf_get_setting('meter_milestone_emails')) {
        xf_meter_queue_milestone_email((int) $post_id, max($hit));
    }
}

/** Records every milestone at or below $level not seen before; returns the new ones. Each fires once, ever. */
function xf_meter_record_milestones($post_id, $level) {
    $seen = get_post_meta($post_id, '_xf_meter_milestones', true);
    $seen = is_array($seen) ? $seen : [];
    $new = [];
    foreach (XF_METER_MILESTONES as $m) {
        if ($level >= $m && !isset($seen[$m])) {
            $seen[$m] = wp_date('Y-m-d H:i:s');
            $new[] = $m;
        }
    }
    if ($new) {
        update_post_meta($post_id, '_xf_meter_milestones', $seen);
        delete_transient('xf_meter_breakouts_' . wp_date('Y-m'));
    }
    return $new;
}

/** One campaign row per milestone ("100X Meter: 25X"), so the log's one-email-per-address-per-campaign key blocks repeats. */
function xf_meter_milestone_campaign($milestone) {
    global $wpdb;
    $ids = get_option('xf_meter_campaigns', []);
    $ids = is_array($ids) ? $ids : [];
    if (!empty($ids[$milestone]) && $wpdb->get_var($wpdb->prepare('SELECT id FROM ' . xf_table('campaigns') . ' WHERE id = %d', $ids[$milestone]))) {
        return (int) $ids[$milestone];
    }
    // Status 'system': the generic batch sender only sends 'active' campaigns; xf_meter_send_milestones() sends these.
    $wpdb->insert(xf_table('campaigns'), [
        'name' => "100X Meter: {$milestone}X milestone",
        'offer' => 'other',
        'subject' => "{startup} just hit {$milestone}X on 100xFounder",
        'body' => "Hi {first_name},\n\n{startup} just hit {$milestone}X on the 100xFounder 100X Meter. Your listing: {listing_url}\n\n{signature}",
        'status' => 'system',
        'ai_approval' => 1,
        'followup_days' => '',
        'created_at' => xf_now(),
        'updated_at' => xf_now(),
    ]);
    $ids[$milestone] = (int) $wpdb->insert_id;
    update_option('xf_meter_campaigns', $ids, false);
    return $ids[$milestone];
}

/** The company-published founder contact we already hold for a listing, unless it opted out, bounced, paused or replied. */
function xf_meter_founder_contact($post_id) {
    global $wpdb;
    return $wpdb->get_row($wpdb->prepare(
        'SELECT email, name FROM ' . xf_table('contacts') . " WHERE startup_id = %d AND status NOT IN ('unsubscribed','bounced','paused','replied') ORDER BY id ASC LIMIT 1",
        $post_id
    ));
}

function xf_meter_badge_code($post_id) {
    return sprintf('<a href="%s"><img src="%s" alt="%s on the 100xFounder 100X Meter" width="168" height="28"></a>',
        esc_url(get_permalink($post_id)), esc_url(rest_url('xf/v1/meter-badge/' . (int) $post_id . '.svg')), esc_attr(get_the_title($post_id)));
}

function xf_meter_milestone_text($post_id, $milestone, $first_name) {
    $name = get_the_title($post_id);
    $s = xf_get_settings();
    $signature = stripos($s['from_name'], '100xfounder') !== false || trim($s['from_name']) === '' ? 'The 100xFounder team' : $s['from_name'] . "\n100xFounder";
    return [
        'subject' => "{$name} just hit {$milestone}X on 100xFounder",
        'body' => implode("\n", [
            'Hi ' . ($first_name !== '' ? $first_name : 'there') . ',', '',
            "{$name} just hit {$milestone}X on the 100xFounder 100X Meter. Readers are backing you.", '',
            'The meter counts reader taps on your listing over the last 30 days (one per reader per day). It is not a rating or a review, just a sign that people are paying attention.', '',
            'Your live listing: ' . get_permalink($post_id), '',
            'Share your 100X card (1080x1350, made for Instagram and LinkedIn): ' . xf_meter_share_url($post_id), '',
            'Want to show the meter on your site? Paste this badge code:',
            xf_meter_badge_code($post_id), '',
            'Congratulations, and keep building.', '',
            $signature,
        ]),
    ];
}

/** Queues the milestone email; returns the log id or 0. An unsent lower milestone for the same address is superseded, so a fast climb sends one email. */
function xf_meter_queue_milestone_email($post_id, $milestone) {
    global $wpdb;
    $post = get_post($post_id);
    $contact = $post && $post->post_status === 'publish' ? xf_meter_founder_contact($post_id) : null;
    if (!$contact) {
        return 0;
    }
    $email = strtolower($contact->email);
    if (!is_email($email) || xf_is_suppressed($email) || (function_exists('xf_camp_has_stopped') && xf_camp_has_stopped($email))) {
        return 0;
    }
    $log = xf_table('email_log');
    $campaigns = array_map('intval', array_values((array) get_option('xf_meter_campaigns', [])));
    if ($campaigns) {
        $in = implode(',', $campaigns); // integers from our own option
        $wpdb->query($wpdb->prepare(
            "UPDATE $log SET status = 'skipped', error = %s, updated_at = %s WHERE email = %s AND status = 'queued' AND campaign_id IN ($in)",
            "Superseded by the {$milestone}X milestone.", xf_now(), $email
        ));
    }
    $first = $contact->name ? (string) strtok($contact->name, ' ') : '';
    $copy = xf_meter_milestone_text($post_id, $milestone, $first);
    $token = wp_generate_password(32, false);
    $row = (object) ['startup' => get_the_title($post_id)];
    // ai_status 'template': plain template copy, so neither the AI writer nor the generic batch sender touches the row.
    $ok = $wpdb->insert($log, [
        'campaign_id' => xf_meter_milestone_campaign($milestone),
        'email' => $email,
        'first_name' => mb_substr(sanitize_text_field($first), 0, 100),
        'startup' => mb_substr(get_the_title($post_id), 0, 190),
        'article_url' => mb_substr(xf_meter_share_url($post_id), 0, 500),
        'listing_url' => mb_substr(get_permalink($post_id), 0, 500),
        'subject' => $copy['subject'],
        'body' => $copy['body'] . "\n\n" . xf_camp_footer($row, xf_unsubscribe_url($token)),
        'token' => $token,
        'status' => 'queued',
        'step' => 0,
        'ai_status' => 'template',
        'queued_at' => xf_now(),
        'updated_at' => xf_now(),
    ]);
    return $ok ? (int) $wpdb->insert_id : 0; // the unique (campaign, email, step) key refuses a second one
}

/** Sends queued milestone emails on the campaign tick, inside the campaign rules: switch, hours, postal address, cap, dry run. */
function xf_meter_send_milestones() {
    global $wpdb;
    $campaigns = array_map('intval', array_values((array) get_option('xf_meter_campaigns', [])));
    if (!$campaigns || !function_exists('xf_camp_block_reason')) {
        return ['sent' => 0];
    }
    if ($blocked = xf_camp_block_reason()) {
        return ['skipped' => $blocked, 'sent' => 0];
    }
    if (!xf_mutex_acquire('camp_send', 5 * MINUTE_IN_SECONDS)) {
        return ['skipped' => 'Another batch is running.', 'sent' => 0];
    }
    $c = xf_camp_settings();
    $dry = !empty($c['dry_run']);
    $limit = min(2, max((int) $c['daily_cap'] - xf_camp_sent_24h($dry), 0));
    $log = xf_table('email_log');
    $in = implode(',', $campaigns);
    $rows = $limit ? $wpdb->get_results($wpdb->prepare("SELECT * FROM $log WHERE status = 'queued' AND campaign_id IN ($in) ORDER BY id ASC LIMIT %d", $limit)) : [];
    $sent = 0;
    $mailer = null;
    foreach ($rows as $row) {
        $contacts_stop = (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('contacts') . " WHERE email = %s AND status IN ('unsubscribed','bounced','replied')", $row->email));
        if (xf_is_suppressed($row->email) || xf_camp_has_stopped($row->email) || $contacts_stop) {
            $wpdb->update($log, ['status' => 'skipped', 'error' => 'Unsubscribed, bounced or replied before this was sent.', 'updated_at' => xf_now()], ['id' => $row->id]);
            continue;
        }
        if ($dry) {
            $wpdb->update($log, ['status' => 'sent', 'dry_run' => 1, 'error' => null, 'sent_at' => xf_now(), 'updated_at' => xf_now()], ['id' => $row->id]);
            $sent++;
            continue;
        }
        $unsubscribe_url = xf_unsubscribe_url($row->token);
        try {
            $mailer = $mailer ?: xf_new_mailer();
            $mailer->clearAllRecipients();
            $mailer->clearCustomHeaders();
            $mailer->clearAttachments();
            $mailer->addAddress($row->email);
            $mailer->isHTML(true);
            $mailer->Subject = $row->subject;
            $mailer->Body = xf_camp_html($row->body, $row->token, $unsubscribe_url);
            $mailer->AltBody = $row->body;
            $mailer->MessageID = '';
            $mailer->addCustomHeader('List-Unsubscribe', '<' . $unsubscribe_url . '>');
            $mailer->addCustomHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
            $mailer->send();
            $wpdb->update($log, ['status' => 'sent', 'dry_run' => 0, 'error' => null, 'message_id' => $mailer->getLastMessageID(), 'sent_at' => xf_now(), 'updated_at' => xf_now()], ['id' => $row->id]);
            $sent++;
        } catch (Exception $e) {
            $wpdb->update($log, ['status' => 'failed', 'error' => substr($e->getMessage(), 0, 500), 'updated_at' => xf_now()], ['id' => $row->id]);
        }
    }
    if ($mailer) {
        $mailer->smtpClose();
    }
    xf_mutex_release('camp_send');
    return ['sent' => $sent, 'dry_run' => $dry];
}
add_action('xf_campaign_tick', 'xf_meter_send_milestones', 20);

/* ---- 2. Share card ---- */

function xf_meter_share_url($id) {
    return rest_url('xf/v1/meter-card/' . (int) $id . '.png');
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/meter-card/(?P<id>\d+)\.png', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_meter_card_serve',
    ]);
    register_rest_route('xf/v1', '/meter-breakouts', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_meter_breakouts_route',
    ]);
});

function xf_meter_card_serve(WP_REST_Request $r) {
    $id = (int) $r['id'];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'xf_startup' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'Not found.', ['status' => 404]);
    }
    $level = xf_meter_level_now($id);
    $base = trailingslashit(wp_upload_dir()['basedir']) . 'xf-meter-cards/';
    $card = get_post_meta($id, '_xf_meter_card', true);
    $file = is_array($card) && !empty($card['file']) ? $base . basename($card['file']) : '';
    // Re-rendered only when the level (or the name) changes; the random name keeps old cards unguessable.
    if (!$file || !is_readable($file) || (int) $card['level'] !== $level || ($card['title'] ?? '') !== get_the_title($id)) {
        if (xf_rate_limited('meter_card', 30, HOUR_IN_SECONDS)) {
            return new WP_Error('rate_limited', 'Too many requests', ['status' => 429]);
        }
        $img = xf_meter_card_image($id, $level);
        if (!$img) {
            return new WP_Error('unavailable', 'Card rendering is unavailable.', ['status' => 500]);
        }
        wp_mkdir_p($base);
        $new = $base . 'card-' . wp_generate_password(24, false) . '.png';
        imagepng($img, $new);
        imagedestroy($img);
        if ($file && is_file($file)) {
            @unlink($file);
        }
        $file = $new;
        update_post_meta($id, '_xf_meter_card', ['level' => $level, 'title' => get_the_title($id), 'file' => basename($file)]);
    }
    header('Content-Type: image/png');
    header('Cache-Control: public, max-age=3600');
    header('Content-Length: ' . filesize($file));
    header('X-Content-Type-Options: nosniff');
    readfile($file);
    exit;
}

/** 1080×1350 card in the Instagram templates' visual system (dark, violet, Inter + Geist Mono). */
function xf_meter_card_image($id, $level) {
    if (!function_exists('imagecreatetruecolor') || !function_exists('xf_ig_draw')) {
        return null;
    }
    $img = imagecreatetruecolor(XF_SLIDE_W, XF_SLIDE_H);
    imagealphablending($img, true);
    $c = [
        'bg' => imagecolorallocate($img, 11, 11, 12),
        'text' => imagecolorallocate($img, 242, 242, 239),
        'accent' => imagecolorallocate($img, 176, 124, 255),
        'muted' => imagecolorallocate($img, 140, 140, 134),
    ];
    imagefilledrectangle($img, 0, 0, XF_SLIDE_W, XF_SLIDE_H, $c['bg']);
    $m = XF_IG_MARGIN;
    $w = XF_SLIDE_W - 2 * $m;
    $mono = xf_ig_font('mono');
    imagettftext($img, 24, 0, $m, 112, $c['accent'], $mono, '100X METER');
    imagettftext($img, 24, 0, XF_SLIDE_W - $m - xf_ig_width(24, $mono, '100xFounder'), 112, $c['text'], $mono, '100xFounder');
    xf_ig_gradient_line($img, $m, XF_SLIDE_W - $m, 146, 3);
    $y = xf_ig_draw($img, $level . 'X', 'bold', 300, 120, $m - 8, 300, $w, 1, $c['accent'], '', null, 1.0);
    xf_ig_gradient_line($img, $m, $m + 200, $y + 40, 5);
    $y = xf_ig_draw($img, mb_strtoupper(xf_meter_growth_stage($level)), 'mono', 40, 28, $m, $y + 80, $w, 1, $c['muted']);
    $y = xf_ig_draw($img, get_the_title($id), 'bold', 110, 56, $m, $y + 50, $w, 3, $c['text'], '', null, 1.12);
    xf_ig_draw($img, 'Readers are backing it. The meter counts reader taps over 30 days, not a rating.', 'regular', 36, 26, $m, $y + 30, $w, 3, $c['muted'], '', null, 1.35);
    $slug = get_post_field('post_name', $id);
    xf_ig_gradient_line($img, $m, XF_SLIDE_W - $m, XF_SLIDE_H - 150, 3);
    xf_ig_draw($img, 'on 100xFounder · 100xfounder.com/startup/' . $slug, 'mono', 30, 18, $m, XF_SLIDE_H - 130, $w, 1, $c['text']);
    return $img;
}

/* ---- 3. Monday Instagram: this week's 100X climbers ---- */

add_action('xf_ig_calendar', function () {
    if ((int) wp_date('N') === 1) {
        xf_meter_weekly_ig();
    }
}, 20);

/** Upserts the week's carousel (top 5 by 7-day taps); null when fewer than 3 startups have taps or the owner already approved it. */
function xf_meter_weekly_ig() {
    global $wpdb;
    if (!function_exists('xf_ig_queue')) {
        return null;
    }
    $ids = get_posts([
        'post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 5, 'fields' => 'ids', 'no_found_rows' => true,
        'meta_key' => '_xf_meter_7d', 'orderby' => 'meta_value_num', 'order' => 'DESC',
        'meta_query' => [['key' => '_xf_meter_7d', 'value' => 0, 'compare' => '>', 'type' => 'NUMERIC']],
    ]);
    if (count($ids) < 3) {
        return null;
    }
    $week = wp_date('o-\WW');
    $ref = 'meter_weekly:' . $week;
    $old = $wpdb->get_row($wpdb->prepare('SELECT status, payload FROM ' . xf_table('ig_queue') . ' WHERE ref_key = %s', $ref));
    // Refreshing rewrites the payload, so never touch an item the owner approved, posted or skipped.
    if ($old && ($old->status !== 'ready' || !empty((json_decode($old->payload, true) ?: [])['ig_approved']))) {
        return null;
    }
    $slides = [['type' => 'hook', 'stat' => (string) count($ids), 'headline' => "This week's 100X climbers", 'accent' => '100X', 'sub' => 'The startups readers pushed most on the 100X Meter in the last 7 days. Swipe.', 'source' => '100xfounder.com']];
    $numbered = [];
    foreach ($ids as $i => $id) {
        $level = xf_meter_level_now($id);
        $week_taps = (int) get_post_meta($id, '_xf_meter_7d', true);
        $slides[] = ['type' => 'item', 'num' => $i + 1, 'kicker' => '100X METER · ' . xf_meter_growth_stage($level), 'title' => get_the_title($id),
            'lines' => array_values(array_filter([xf_ig_words(get_post_meta($id, '_xf_tagline', true), 16), "{$level}X · " . number_format($week_taps) . ' reader taps this week'])),
            'accent' => "{$level}X", 'source' => '100xfounder.com', 'logo' => xf_ig_logo_spec($id)];
        $numbered[] = ($i + 1) . '. ' . get_the_title($id) . " ({$level}X)";
    }
    $url = home_url('/');
    $slides[] = ['type' => 'cta', 'headline' => 'Back the startups you believe in: link in bio', 'accent' => 'link in bio', 'url' => xf_ig_short_url($url), 'note' => 'One tap per reader per day. The meter tracks reader buzz, not quality or a rating.', 'source' => '100xfounder.com'];
    $caption = xf_ig_caption(
        "This week's 100X climbers: the startups readers pushed hardest on the 100X Meter.",
        [implode("\n", $numbered)],
        'The meter counts reader taps over 30 days. It is not a rating.',
        'Tap the startups you back',
        $url,
        'Which one would you back?',
        ['#100xfounder', '#startups', '#indianstartups', '#founders', '#buildinpublic', '#100XMeter']
    );
    return xf_ig_queue('meter_weekly', $ref, "100X climbers, $week", $caption, $slides, ['week' => $week, 'ids' => $ids]);
}

/* ---- 4. Breakouts feed for the monthly article ---- */

function xf_meter_breakouts($month) {
    $key = 'xf_meter_breakouts_' . $month;
    $cached = get_transient($key);
    if (is_array($cached)) {
        return $cached;
    }
    $ids = get_posts([
        'post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true,
        'meta_query' => [['key' => '_xf_meter_milestones', 'compare' => 'EXISTS']],
    ]);
    $out = [];
    foreach ($ids as $id) {
        $seen = get_post_meta($id, '_xf_meter_milestones', true);
        if (!is_array($seen) || empty($seen[50]) || strpos((string) $seen[50], $month) !== 0) {
            continue;
        }
        $level = xf_meter_level_now($id);
        $out[] = [
            'id' => $id,
            'name' => get_the_title($id),
            'url' => get_permalink($id),
            'website' => (string) get_post_meta($id, '_xf_website', true),
            'tagline' => (string) get_post_meta($id, '_xf_tagline', true),
            'crossed_50x_at' => $seen[50],
            'reached_100x_at' => $seen[100] ?? null,
            'level_now' => $level,
            'stage_now' => xf_meter_growth_stage($level),
            'taps_30d' => (int) get_post_meta($id, '_xf_meter_30d', true),
            'taps_total' => (int) get_post_meta($id, '_xf_meter_total', true),
        ];
    }
    usort($out, function ($a, $b) { return strcmp($a['crossed_50x_at'], $b['crossed_50x_at']); });
    $data = ['month' => $month, 'count' => count($out), 'note' => 'The 100X Meter counts reader taps over 30 days (one per reader per day). It is not a rating.', 'startups' => $out];
    set_transient($key, $data, HOUR_IN_SECONDS);
    return $data;
}

function xf_meter_breakouts_route(WP_REST_Request $r) {
    $month = (string) $r->get_param('month');
    if ($month === '') {
        $month = wp_date('Y-m', strtotime('first day of last month', time()));
    }
    if (!preg_match('/^(20\d\d)-(0[1-9]|1[0-2])$/', $month)) {
        return new WP_Error('bad_month', 'Use month=YYYY-MM.', ['status' => 400]);
    }
    $res = rest_ensure_response(xf_meter_breakouts($month));
    $res->header('Cache-Control', 'public, max-age=3600');
    return $res;
}
