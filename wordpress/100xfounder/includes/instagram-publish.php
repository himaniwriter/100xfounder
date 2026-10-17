<?php
/**
 * Instagram auto-posting through the official Instagram API with Instagram Login
 * (graph.instagram.com, Content Publishing API). Posts only queue items the owner
 * approved (and, for founder features, recorded the founder's consent for), at the
 * configured IST slots, up to a daily maximum. Off by default.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_IG_GRAPH = 'https://graph.instagram.com/v25.0/';
const XF_IG_MAX_TRIES = 3; // first attempt + at most two retries
const XF_IG_SLOT_WINDOW = 3 * HOUR_IN_SECONDS; // a slot missed by more than this is skipped
const XF_IG_FILE_DAYS = 7; // JPEGs under uploads/xf-ig/ are deleted after this many days
const XF_IG_FOUNDER_KINDS = ['spotlight', 'founder_story'];

/* ---- Settings and token ---- */

function xf_ig_opt($key) {
    $defaults = ['ig_user_id' => '', 'ig_autopost' => 0, 'ig_slots' => '09:30,19:30', 'ig_max_per_day' => 2];
    $v = xf_get_setting($key);
    return $v === null ? $defaults[$key] : $v;
}

/** ['token', 'saved' (issued/refreshed unix time), 'expires', 'username', 'account_type'] or []. */
function xf_ig_token() {
    $t = get_option('xf_ig_token');
    return is_array($t) && !empty($t['token']) ? $t : [];
}

/* ---- Pure helpers (self-checked below) ---- */

/** "09:30, 19:30" -> ['09:30', '19:30'] (valid HH:MM only, sorted, unique). */
function xf_ig_parse_slots($csv) {
    preg_match_all('/\b([01]?\d|2[0-3]):([0-5]\d)\b/', (string) $csv, $m, PREG_SET_ORDER);
    $out = array_unique(array_map(function ($x) { return sprintf('%02d:%s', $x[1], $x[2]); }, $m));
    sort($out);
    return $out;
}

/** The latest IST slot ("Y-m-d H:i") that started at most XF_IG_SLOT_WINDOW ago and is after $last_done, or ''. */
function xf_ig_slot_due($csv, $now, $last_done) {
    $today = (new DateTimeImmutable('@' . (int) $now))->setTimezone(new DateTimeZone('Asia/Kolkata'));
    $due = '';
    foreach (xf_ig_parse_slots($csv) as $hm) {
        [$h, $i] = explode(':', $hm);
        $at = $today->setTime((int) $h, (int) $i);
        $key = $at->format('Y-m-d H:i');
        $age = $now - $at->getTimestamp();
        if ($age >= 0 && $age <= XF_IG_SLOT_WINDOW && strcmp($key, (string) $last_done) > 0) {
            $due = $key;
        }
    }
    return $due;
}

/** Instagram's caption limits: at most 30 hashtags and 2,200 characters. */
function xf_ig_clean_caption($caption) {
    $n = 0;
    $caption = preg_replace_callback('/(^|\s)#[\p{L}\p{N}_]+/u', function ($m) use (&$n) {
        return ++$n > 30 ? $m[1] : $m[0];
    }, (string) $caption);
    $caption = trim(preg_replace('/[ \t]+$/m', '', $caption));
    if (mb_strlen($caption) > 2200) {
        $caption = rtrim(mb_substr($caption, 0, 2199)) . '…';
    }
    return $caption;
}

/** Why an item can't be posted yet ('' when it can). $manual: the owner pressed "Post now". */
function xf_ig_blocker($item, array $payload, $manual = false) {
    if ($item->status !== 'ready') {
        return 'not ready (' . $item->status . ')';
    }
    if (empty($payload['ig_approved'])) {
        return 'not approved for posting';
    }
    if ((in_array($item->kind, XF_IG_FOUNDER_KINDS, true) || !empty($payload['needs_founder_ok'])) && empty($payload['ig_consent'])) {
        return 'founder consent not recorded';
    }
    if (!$manual && (int) ($payload['ig_tries'] ?? 0) >= XF_IG_MAX_TRIES) {
        return 'failed ' . XF_IG_MAX_TRIES . ' times; use Post now to retry';
    }
    return '';
}

/* ---- API ---- */

/** One Graph call with the saved token (Bearer header, so it never lands in a URL). Returns the body or WP_Error. */
function xf_ig_api($method, $path, array $args = [], $token = null) {
    $token = $token ?? (xf_ig_token()['token'] ?? '');
    if ($token === '') {
        return new WP_Error('ig_not_connected', 'No Instagram access token saved.');
    }
    $req = ['timeout' => 45, 'headers' => ['Authorization' => 'Bearer ' . $token]];
    $url = XF_IG_GRAPH . ltrim($path, '/');
    $res = $method === 'GET'
        ? wp_remote_get(add_query_arg(array_map('rawurlencode', $args), $url), $req)
        : wp_remote_post($url, $req + ['body' => $args]);
    if (is_wp_error($res)) {
        return $res;
    }
    $body = json_decode(wp_remote_retrieve_body($res), true);
    if (!is_array($body) || !empty($body['error']) || (int) wp_remote_retrieve_response_code($res) >= 400) {
        $msg = is_array($body) ? ($body['error']['message'] ?? '') : '';
        return new WP_Error('ig_api', 'Instagram API: ' . ($msg !== '' ? $msg : 'HTTP ' . wp_remote_retrieve_response_code($res)));
    }
    return $body;
}

/** Renders the slides to JPEG (Instagram accepts JPEG only) under uploads/xf-ig/ with unguessable names; returns public URLs. */
function xf_ig_slide_jpegs($item) {
    $up = wp_upload_dir();
    $dir = trailingslashit($up['basedir']) . 'xf-ig/';
    if (!wp_mkdir_p($dir)) {
        return new WP_Error('ig_files', 'Could not create uploads/xf-ig/.');
    }
    if (!file_exists($dir . 'index.php')) {
        file_put_contents($dir . 'index.php', "<?php\n// Silence is golden.\n"); // no directory listing
    }
    $urls = [];
    for ($n = 0, $count = min(10, max(1, (int) $item->slide_count)); $n < $count; $n++) {
        $img = xf_ig_item_image($item, $n);
        if (!$img) {
            return new WP_Error('ig_render', 'Slide ' . ($n + 1) . ' could not be rendered.');
        }
        $name = bin2hex(random_bytes(16)) . '.jpg';
        $ok = imagejpeg($img, $dir . $name, 90);
        imagedestroy($img);
        if (!$ok) {
            return new WP_Error('ig_files', 'Could not write a slide JPEG.');
        }
        $urls[] = trailingslashit($up['baseurl']) . 'xf-ig/' . $name;
    }
    return $urls;
}

/** Waits for a container to be FINISHED (images usually take seconds). */
function xf_ig_wait_container($id) {
    for ($i = 0; $i < 8; $i++) {
        $s = xf_ig_api('GET', $id, ['fields' => 'status_code']);
        if (is_wp_error($s)) {
            return $s;
        }
        $code = (string) ($s['status_code'] ?? '');
        if ($code === 'FINISHED') {
            return true;
        }
        if (in_array($code, ['ERROR', 'EXPIRED'], true)) {
            return new WP_Error('ig_container', "Instagram could not process the media ($code).");
        }
        sleep(4);
    }
    return new WP_Error('ig_container', 'Instagram was still processing the media after ~30 seconds.');
}

/** Publishes one queue row (single image or carousel). Returns ['id', 'permalink'] or WP_Error. */
function xf_ig_publish($item) {
    $user = trim((string) xf_ig_opt('ig_user_id'));
    if ($user === '' || !xf_ig_token()) {
        return new WP_Error('ig_not_connected', 'Instagram user ID or access token missing.');
    }
    $limit = xf_ig_api('GET', $user . '/content_publishing_limit', ['fields' => 'quota_usage,config']);
    if (is_wp_error($limit)) {
        return $limit;
    }
    $usage = (int) ($limit['data'][0]['quota_usage'] ?? 0);
    $total = (int) ($limit['data'][0]['config']['quota_total'] ?? 50);
    if ($usage >= $total) {
        return new WP_Error('ig_quota', "Instagram's publishing limit is used up ($usage of $total in 24 hours).");
    }
    $urls = xf_ig_slide_jpegs($item);
    if (is_wp_error($urls)) {
        return $urls;
    }
    $caption = xf_ig_clean_caption($item->caption);
    if (count($urls) === 1) {
        $c = xf_ig_api('POST', $user . '/media', ['image_url' => $urls[0], 'caption' => $caption]);
    } else {
        $children = [];
        foreach ($urls as $url) {
            $child = xf_ig_api('POST', $user . '/media', ['image_url' => $url, 'is_carousel_item' => 'true']);
            if (is_wp_error($child)) {
                return $child;
            }
            $children[] = (string) $child['id'];
        }
        $c = xf_ig_api('POST', $user . '/media', ['media_type' => 'CAROUSEL', 'children' => implode(',', $children), 'caption' => $caption]);
    }
    if (is_wp_error($c)) {
        return $c;
    }
    $ready = xf_ig_wait_container((string) $c['id']);
    if (is_wp_error($ready)) {
        return $ready;
    }
    $p = xf_ig_api('POST', $user . '/media_publish', ['creation_id' => (string) $c['id']]);
    if (is_wp_error($p)) {
        return $p;
    }
    $m = xf_ig_api('GET', (string) $p['id'], ['fields' => 'permalink']);
    return ['id' => (string) $p['id'], 'permalink' => is_wp_error($m) ? '' : (string) ($m['permalink'] ?? '')];
}

/** Claims, posts and records one item. Returns true or WP_Error (error saved on the row). $via: 'auto' or 'post_now'. */
function xf_ig_post_item($item, $via = 'auto') {
    global $wpdb;
    $table = xf_table('ig_queue');
    // Claim the row first so an overlapping run can never post it twice. updated_at keys the preview cache, so it stays.
    if (!$wpdb->update($table, ['status' => 'posting'], ['id' => $item->id, 'status' => 'ready'])) {
        return new WP_Error('ig_claimed', 'Item is not ready or is already being posted.');
    }
    $payload = json_decode($item->payload, true) ?: [];
    $r = xf_ig_publish($item);
    if (is_wp_error($r)) {
        if (!in_array($r->get_error_code(), ['ig_quota', 'ig_not_connected'], true)) {
            $payload['ig_tries'] = (int) ($payload['ig_tries'] ?? 0) + 1;
        }
        $payload['ig_error'] = $r->get_error_message();
        $wpdb->update($table, ['status' => 'ready', 'payload' => wp_json_encode($payload)], ['id' => $item->id]);
        return $r;
    }
    unset($payload['ig_error']);
    $payload['ig_media_id'] = $r['id'];
    $payload['ig_permalink'] = $r['permalink'];
    $wpdb->update($table, [
        'status' => 'posted', 'posted_at' => xf_now(), 'payload' => wp_json_encode($payload), 'posted_via' => $via,
        'ig_media_id' => $r['id'], 'ig_permalink' => $r['permalink'], 'verify_status' => '', 'verify_note' => '',
    ], ['id' => $item->id]);
    if (function_exists('xf_ig_verify_item')) {
        xf_ig_verify_item((int) $item->id);
    }
    return true;
}

/** The next approved, ready item that is planned for now or earlier (or unplanned). */
function xf_ig_next_item($now) {
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
        'SELECT * FROM ' . xf_table('ig_queue') . " WHERE status = 'ready' AND (planned_at IS NULL OR planned_at <= %s) ORDER BY planned_at IS NULL, planned_at ASC, id ASC LIMIT 50",
        gmdate('Y-m-d H:i:s', $now + 15 * MINUTE_IN_SECONDS)
    ));
    foreach ($rows as $row) {
        if (xf_ig_blocker($row, json_decode($row->payload, true) ?: []) === '') {
            return $row;
        }
    }
    return null;
}

/** Cron (every 15 min): posts one approved item when a slot is due. Returns a status line. */
function xf_ig_autopost_tick($now = null) {
    global $wpdb;
    $now = $now ?? time();
    if (!xf_ig_opt('ig_autopost') || !xf_ig_token() || xf_ig_opt('ig_user_id') === '') {
        return 'off';
    }
    $slot = xf_ig_slot_due(xf_ig_opt('ig_slots'), $now, (string) get_option('xf_ig_last_slot', ''));
    if ($slot === '') {
        return 'no slot due';
    }
    $midnight = (new DateTimeImmutable('@' . $now))->setTimezone(new DateTimeZone('Asia/Kolkata'))->setTime(0, 0)->getTimestamp();
    $today = (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('ig_queue') . " WHERE status = 'posted' AND posted_at >= %s", gmdate('Y-m-d H:i:s', $midnight)));
    if ($today >= max(1, (int) xf_ig_opt('ig_max_per_day'))) {
        update_option('xf_ig_last_slot', $slot, false);
        return "daily maximum reached ($today)";
    }
    if (!xf_mutex_acquire('ig_post', 10 * MINUTE_IN_SECONDS)) {
        return 'another run is posting';
    }
    $item = xf_ig_next_item($now);
    $r = $item ? xf_ig_post_item($item) : null;
    xf_mutex_release('ig_post');
    if (!$item) {
        return "slot $slot: nothing approved to post";
    }
    if (is_wp_error($r)) {
        return "slot $slot: item {$item->id} failed: " . $r->get_error_message(); // slot stays open: the next tick retries
    }
    update_option('xf_ig_last_slot', $slot, false);
    return "slot $slot: posted item {$item->id}";
}

/* ---- Token refresh and file cleanup (daily) ---- */

/** Refreshes a long-lived token that is older than 7 days and within 50 days of expiry. */
function xf_ig_maybe_refresh_token($now = null) {
    $now = $now ?? time();
    $t = xf_ig_token();
    if (!$t || $now - (int) $t['saved'] < 7 * DAY_IN_SECONDS || (int) $t['expires'] - $now > 50 * DAY_IN_SECONDS) {
        return 'not due';
    }
    $res = wp_remote_get(add_query_arg(['grant_type' => 'ig_refresh_token', 'access_token' => rawurlencode($t['token'])], 'https://graph.instagram.com/refresh_access_token'), ['timeout' => 30]);
    $body = is_wp_error($res) ? [] : (json_decode(wp_remote_retrieve_body($res), true) ?: []);
    if (empty($body['access_token'])) {
        $why = is_wp_error($res) ? $res->get_error_message() : (string) ($body['error']['message'] ?? 'HTTP ' . wp_remote_retrieve_response_code($res));
        update_option('xf_ig_alert', 'Instagram token refresh failed (' . $why . '). The token expires on ' . wp_date('j M Y', (int) $t['expires']) . ': generate a new one and paste it under Settings → Instagram (auto-post).', false);
        return 'failed';
    }
    $t['token'] = (string) $body['access_token'];
    $t['saved'] = $now;
    $t['expires'] = $now + (int) ($body['expires_in'] ?? 60 * DAY_IN_SECONDS);
    update_option('xf_ig_token', $t, false);
    delete_option('xf_ig_alert');
    return 'refreshed';
}

function xf_ig_cleanup_files() {
    foreach (glob(trailingslashit(wp_upload_dir()['basedir']) . 'xf-ig/*.jpg') ?: [] as $f) {
        if (filemtime($f) < time() - XF_IG_FILE_DAYS * DAY_IN_SECONDS) {
            @unlink($f);
        }
    }
}

add_filter('cron_schedules', function ($s) {
    $s['xf_ig_15min'] = ['interval' => 15 * MINUTE_IN_SECONDS, 'display' => 'Every 15 minutes (100xFounder Instagram)'];
    return $s;
});
add_action('init', function () {
    if (!wp_next_scheduled('xf_ig_autopost')) {
        wp_schedule_event(time() + 60, 'xf_ig_15min', 'xf_ig_autopost');
    }
    if (!wp_next_scheduled('xf_ig_daily')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'xf_ig_daily');
    }
});
add_action('xf_ig_autopost', function () {
    $out = xf_ig_autopost_tick();
    if ($out !== 'off' && $out !== 'no slot due') {
        update_option('xf_ig_last_tick', ['at' => time(), 'result' => $out], false);
    }
});
add_action('xf_ig_daily', function () {
    xf_ig_maybe_refresh_token();
    xf_ig_cleanup_files();
});
register_deactivation_hook(XF_FILE, function () {
    wp_clear_scheduled_hook('xf_ig_autopost');
    wp_clear_scheduled_hook('xf_ig_daily');
});

add_action('admin_notices', function () {
    $alert = get_option('xf_ig_alert');
    if ($alert && current_user_can('manage_options')) {
        echo '<div class="notice notice-error"><p>' . esc_html($alert) . '</p></div>';
    }
});

/* ---- Admin: settings section ---- */

function xf_ig_settings_card() {
    $t = xf_ig_token();
    $last = get_option('xf_ig_last_tick');
    ?>
    <h2 id="xf-ig-autopost">Instagram (auto-post)</h2>
    <p>Posts approved items from the Instagram queue to Instagram through the official Instagram API with Instagram Login. Nothing posts until "Auto-post" is ticked, and only items you approved (plus the founder's consent for founder features).</p>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <input type="hidden" name="action" value="xf_ig_settings">
        <?php wp_nonce_field('xf_ig_settings'); ?>
        <table class="form-table" role="presentation">
            <tr><th scope="row"><label for="xf_ig_user_id">Instagram user ID</label></th>
                <td><input type="text" class="regular-text" id="xf_ig_user_id" name="ig_user_id" value="<?php echo esc_attr(xf_ig_opt('ig_user_id')); ?>">
                    <p class="description">The numeric Instagram account ID shown next to @100x.founder in the Meta app dashboard. "Test connection" fills it in if empty.</p></td></tr>
            <tr><th scope="row"><label for="xf_ig_token">Access token</label></th>
                <td><?php if ($t) : ?>
                        <p>Saved<?php echo !empty($t['username']) ? ' for @' . esc_html($t['username']) : ''; ?>, expires on <strong><?php echo esc_html(wp_date('j M Y', (int) $t['expires'])); ?></strong> (renewed automatically).</p>
                        <details><summary>Replace token</summary>
                            <input type="password" class="regular-text" id="xf_ig_token" name="ig_token" value="" autocomplete="new-password" placeholder="Paste the new token">
                        </details>
                    <?php else : ?>
                        <input type="password" class="regular-text" id="xf_ig_token" name="ig_token" value="" autocomplete="new-password" placeholder="Paste the access token">
                    <?php endif; ?>
                    <p class="description">How to get the ID and token: Meta for Developers → My Apps → your app (Business type, with the Instagram product added) → Instagram → <em>API setup with Instagram login</em> → step 1 "Generate access tokens": click <em>Add account</em> and log in as @100x.founder (a Business or Creator account), then <em>Generate token</em> next to it, accept the permissions (instagram_business_basic, instagram_business_content_publish) and copy the token. The ID is the number shown next to the account. The token is long-lived (60 days) and refreshed here automatically.</p></td></tr>
            <tr><th scope="row"><label for="xf_ig_autopost_cb">Auto-post</label></th>
                <td><input type="checkbox" id="xf_ig_autopost_cb" name="ig_autopost" value="1" <?php checked((bool) xf_ig_opt('ig_autopost')); ?>>
                    <p class="description">Off by default. When on, the next approved item posts at each slot below.</p></td></tr>
            <tr><th scope="row"><label for="xf_ig_slots">Posting slots (IST)</label></th>
                <td><input type="text" class="regular-text" id="xf_ig_slots" name="ig_slots" value="<?php echo esc_attr(xf_ig_opt('ig_slots')); ?>">
                    <p class="description">Comma-separated 24-hour times, e.g. 09:30,19:30. A slot missed by more than 3 hours is skipped.</p></td></tr>
            <tr><th scope="row"><label for="xf_ig_max">Maximum posts per day</label></th>
                <td><input type="number" min="1" max="10" id="xf_ig_max" name="ig_max_per_day" value="<?php echo (int) xf_ig_opt('ig_max_per_day'); ?>"></td></tr>
        </table>
        <?php submit_button('Save Instagram settings', 'secondary'); ?>
    </form>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <input type="hidden" name="action" value="xf_ig_test">
        <?php wp_nonce_field('xf_ig_test'); ?>
        <button class="button" <?php disabled(!$t); ?>>Test connection</button>
        <?php if ($last) : ?><span class="description">Last auto-post run <?php echo esc_html(wp_date('j M, H:i', (int) $last['at'])); ?>: <?php echo esc_html($last['result']); ?></span><?php endif; ?>
    </form>
    <?php
}

function xf_ig_redirect($notice, $back) {
    set_transient('xf_notice_' . get_current_user_id(), $notice, 60);
    wp_safe_redirect($back);
    exit;
}

add_action('admin_post_xf_ig_settings', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_settings')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $slots = xf_ig_parse_slots(isset($_POST['ig_slots']) ? sanitize_text_field(wp_unslash($_POST['ig_slots'])) : '');
    xf_update_settings([
        'ig_user_id' => preg_replace('/\D/', '', isset($_POST['ig_user_id']) ? wp_unslash($_POST['ig_user_id']) : ''),
        'ig_autopost' => empty($_POST['ig_autopost']) ? 0 : 1,
        'ig_slots' => $slots ? implode(',', $slots) : '09:30,19:30',
        'ig_max_per_day' => min(10, max(1, isset($_POST['ig_max_per_day']) ? absint($_POST['ig_max_per_day']) : 2)),
    ]);
    $token = preg_replace('/\s+/', '', isset($_POST['ig_token']) ? sanitize_text_field(wp_unslash($_POST['ig_token'])) : '');
    if ($token !== '') {
        // Tokens from "Generate token" are long-lived: 60 days from now.
        update_option('xf_ig_token', ['token' => $token, 'saved' => time(), 'expires' => time() + 60 * DAY_IN_SECONDS], false);
        delete_option('xf_ig_alert');
    }
    xf_ig_redirect('Instagram settings saved.' . ($token !== '' ? ' New token stored: use "Test connection" to check it.' : ''), admin_url('admin.php?page=xf-settings#xf-ig-autopost'));
});

add_action('admin_post_xf_ig_test', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_test')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $me = xf_ig_api('GET', 'me', ['fields' => 'user_id,username,account_type']);
    $back = admin_url('admin.php?page=xf-settings#xf-ig-autopost');
    if (is_wp_error($me)) {
        xf_ig_redirect('Instagram connection failed: ' . $me->get_error_message(), $back);
    }
    $me = $me['data'][0] ?? $me; // the docs show both a bare object and a data[] wrapper
    $t = xf_ig_token();
    $t['username'] = (string) ($me['username'] ?? '');
    $t['account_type'] = (string) ($me['account_type'] ?? '');
    update_option('xf_ig_token', $t, false);
    $note = '';
    if (xf_ig_opt('ig_user_id') === '' && !empty($me['user_id'])) {
        xf_update_settings(['ig_user_id' => preg_replace('/\D/', '', (string) $me['user_id'])]);
        $note = ' User ID saved.';
    } elseif (!empty($me['user_id']) && (string) $me['user_id'] !== (string) xf_ig_opt('ig_user_id')) {
        $note = ' Warning: the token belongs to user ID ' . $me['user_id'] . ', not the saved ID.';
    }
    xf_ig_redirect('Instagram connected: @' . $t['username'] . ' (' . ($t['account_type'] ?: 'account type not returned') . ').' . $note, $back);
});

/* ---- Admin: per-item approval, consent and "Post now" in the queue card ---- */

/** One-line status for the top of the queue card. */
function xf_ig_autopost_status() {
    $t = xf_ig_token();
    $on = $t && xf_ig_opt('ig_autopost');
    echo '<p><strong>Auto-post:</strong> ' . esc_html($on ? 'on at ' . xf_ig_opt('ig_slots') . ' IST, up to ' . (int) xf_ig_opt('ig_max_per_day') . ' a day, approved items only' : ($t ? 'off' : 'not connected'))
        . ' · <a href="' . esc_url(admin_url('admin.php?page=xf-settings#xf-ig-autopost')) . '">Instagram settings</a></p>';
}

function xf_ig_item_controls($item, array $payload) {
    $founder = in_array($item->kind, XF_IG_FOUNDER_KINDS, true) || !empty($payload['needs_founder_ok']);
    $blocker = $item->status === 'ready' ? xf_ig_blocker($item, $payload, true) : '';
    ?>
    <?php if (!empty($payload['ig_permalink']) || !empty($payload['ig_media_id'])) : ?>
        <span>· Posted via API: <?php echo !empty($payload['ig_permalink']) ? '<a href="' . esc_url($payload['ig_permalink']) . '" target="_blank" rel="noopener">view on Instagram</a>' : 'media ' . esc_html($payload['ig_media_id']); ?></span>
    <?php endif; ?>
    <?php if ($item->status === 'posting') : ?>
        <span style="color:#b32d2e">· Stuck while posting: check Instagram, then Mark posted, or <a href="<?php echo esc_url(xf_admin_action_url('ig_ready', ['id' => $item->id])); ?>">reset to ready</a></span>
    <?php endif; ?>
    <?php if (!empty($payload['ig_error'])) : ?>
        <span style="color:#b32d2e">· Auto-post failed (<?php echo (int) ($payload['ig_tries'] ?? 0); ?>/<?php echo (int) XF_IG_MAX_TRIES; ?> tries): <?php echo esc_html($payload['ig_error']); ?></span>
    <?php endif; ?>
    <?php if ($item->status === 'ready') : ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:6px 0">
            <input type="hidden" name="action" value="xf_ig_review">
            <input type="hidden" name="id" value="<?php echo (int) $item->id; ?>">
            <?php wp_nonce_field('xf_ig_review_' . (int) $item->id); ?>
            <label><input type="checkbox" name="approved" value="1" <?php checked(!empty($payload['ig_approved'])); ?>> Approve for posting</label>
            <?php if ($founder) : ?>
                <label style="margin-left:10px"><input type="checkbox" name="consent" value="1" <?php checked(!empty($payload['ig_consent'])); ?>> Founder consent received</label>
            <?php endif; ?>
            <button class="button button-small" name="save" value="1">Save</button>
            <?php if (!empty($payload['ig_approved']) && xf_ig_token()) : ?>
                <button class="button button-small button-primary" name="post_now" value="1" <?php disabled($blocker !== ''); ?> onclick="return confirm('Post this to Instagram now?')">Post now</button>
            <?php endif; ?>
            <?php if ($blocker !== '') : ?><span class="description">Won't auto-post: <?php echo esc_html($blocker); ?>.</span><?php endif; ?>
        </form>
    <?php endif; ?>
    <?php
}

add_action('admin_post_xf_ig_review', function () {
    global $wpdb;
    $id = isset($_POST['id']) ? absint($_POST['id']) : 0;
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_review_' . $id)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $back = admin_url('admin.php?page=xf');
    $table = xf_table('ig_queue');
    $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
    if (!$item || $item->status !== 'ready') {
        xf_ig_redirect('That Instagram item is no longer ready.', $back);
    }
    $payload = json_decode($item->payload, true) ?: [];
    $stamp = ['by' => wp_get_current_user()->user_login, 'at' => time()];
    // Kept until the content changes: xf_ig_upsert rewrites the payload, which clears both, so new content needs a new approval.
    $payload['ig_approved'] = !empty($_POST['approved']) ? ($payload['ig_approved'] ?? $stamp) : null;
    $payload['ig_consent'] = !empty($_POST['consent']) ? ($payload['ig_consent'] ?? $stamp) : null;
    $payload = array_filter($payload, function ($v) { return $v !== null; });
    $wpdb->update($table, ['payload' => wp_json_encode($payload)], ['id' => $id]);
    if (empty($_POST['post_now'])) {
        xf_ig_redirect('Instagram item saved' . (!empty($payload['ig_approved']) ? ': approved for posting.' : ': not approved.'), $back);
    }
    $item->payload = wp_json_encode($payload);
    $blocker = xf_ig_blocker($item, $payload, true);
    if ($blocker !== '') {
        xf_ig_redirect('Not posted: ' . $blocker . '.', $back);
    }
    $r = xf_ig_post_item($item, 'post_now');
    xf_ig_redirect(is_wp_error($r) ? 'Instagram post failed: ' . $r->get_error_message() : 'Posted to Instagram.', $back);
});

/* ---- Self-check: wp eval 'ini_set("zend.assertions", 1); var_dump(xf_ig_publish_selfcheck());' (needs zend.assertions=1 and assert.exception=1) ---- */

function xf_ig_publish_selfcheck() {
    // Caption: 35 hashtags -> 30 kept; 2,500 chars -> 2,200.
    $tags = implode(' ', array_map(function ($i) { return '#tag' . $i; }, range(1, 35)));
    $c = xf_ig_clean_caption("Hello #one\n\n" . $tags);
    assert(preg_match_all('/#\w+/', $c) === 30, 'caption keeps 30 hashtags');
    assert(strpos($c, '#tag29') !== false && strpos($c, '#tag30') === false, 'drops hashtags after the 30th');
    assert(mb_strlen(xf_ig_clean_caption(str_repeat('é', 2500))) === 2200, 'caption capped at 2,200 chars');
    assert(xf_ig_clean_caption('short #a') === 'short #a', 'short caption unchanged');
    // Slots (IST = UTC+5:30). 2026-10-15 04:10 UTC = 09:40 IST.
    $t = strtotime('2026-10-15 04:10:00 UTC');
    assert(xf_ig_parse_slots('19:30, 9:30,bad,25:00,09:30') === ['09:30', '19:30'], 'parses and sorts slots');
    assert(xf_ig_slot_due('09:30,19:30', $t, '') === '2026-10-15 09:30', 'morning slot due');
    assert(xf_ig_slot_due('09:30,19:30', $t, '2026-10-15 09:30') === '', 'done slot not due twice');
    assert(xf_ig_slot_due('09:30,19:30', $t - 15 * 60, '') === '', 'nothing before the first slot');
    assert(xf_ig_slot_due('09:30,19:30', $t + 4 * HOUR_IN_SECONDS, '') === '', 'slot missed by > 3h skipped');
    assert(xf_ig_slot_due('09:30,19:30', strtotime('2026-10-15 14:05:00 UTC'), '2026-10-15 09:30') === '2026-10-15 19:30', 'evening slot due');
    assert(xf_ig_slot_due('09:30,19:30', strtotime('2026-10-16 04:00:00 UTC'), '2026-10-15 19:30') === '2026-10-16 09:30', 'next day slot due');
    // Approval gate.
    $row = (object) ['status' => 'ready', 'kind' => 'founder_story'];
    assert(xf_ig_blocker($row, []) === 'not approved for posting', 'needs approval');
    assert(xf_ig_blocker($row, ['ig_approved' => 1]) === 'founder consent not recorded', 'founder kinds need consent');
    assert(xf_ig_blocker($row, ['ig_approved' => 1, 'ig_consent' => 1]) === '', 'approved + consent ok');
    assert(xf_ig_blocker((object) ['status' => 'ready', 'kind' => 'news_card'], ['ig_approved' => 1, 'ig_tries' => 3]) !== '', 'stops after 3 tries');
    assert(xf_ig_blocker((object) ['status' => 'ready', 'kind' => 'news_card'], ['ig_approved' => 1, 'ig_tries' => 3], true) === '', 'Post now can retry');
    return true;
}
