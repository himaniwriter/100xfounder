<?php
/**
 * Instagram posted log: 100xFounder → Instagram posted. Lists posted (and skipped) queue items and checks each
 * one against the account through the Graph API (graph.instagram.com, Bearer token via xf_ig_api()).
 * verify_status: verified (media id fetched), matched (hand-posted, found by caption/date), not_found, unchecked (no token).
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_IG_MEDIA_CACHE = 'xf_ig_media_list';

/* ---- Pure helpers (self-checked below) ---- */

/** Lowercase, emoji/punctuation-free, single-spaced caption text for comparison. */
function xf_ig_norm_caption($text) {
    $t = mb_strtolower(wp_strip_all_tags((string) $text));
    $t = preg_replace('/[^\p{L}\p{N}#@]+/u', ' ', $t);
    return trim(preg_replace('/\s+/u', ' ', $t));
}

/** Share of the shorter caption's words (first 200 normalised chars) that appear in the other. */
function xf_ig_caption_overlap($a, $b) {
    $wa = array_unique(explode(' ', mb_substr(xf_ig_norm_caption($a), 0, 200)));
    $wb = array_unique(explode(' ', mb_substr(xf_ig_norm_caption($b), 0, 200)));
    $wa = array_filter($wa, 'strlen');
    $wb = array_filter($wb, 'strlen');
    if (!$wa || !$wb) {
        return 0.0;
    }
    return count(array_intersect($wa, $wb)) / min(count($wa), count($wb));
}

/**
 * The account media entry that is this item: same first 80 normalised caption chars, or posted within 48 hours
 * of $posted_ts with at least half the caption words shared. $taken: media ids already linked to other rows.
 */
function xf_ig_match_media($caption, $posted_ts, array $media, array $taken = []) {
    $head = mb_substr(xf_ig_norm_caption(function_exists('xf_ig_clean_caption') ? xf_ig_clean_caption($caption) : $caption), 0, 80);
    $by_time = null;
    foreach ($media as $m) {
        $id = (string) ($m['id'] ?? '');
        if ($id === '' || in_array($id, $taken, true)) {
            continue;
        }
        $mc = (string) ($m['caption'] ?? '');
        // Prefix compare: a shorter caption (under 80 chars) still matches one Instagram shows with extra text after it.
        if (mb_strlen($head) >= 20 && mb_substr(xf_ig_norm_caption($mc), 0, mb_strlen($head)) === $head) {
            return $m;
        }
        $ts = strtotime((string) ($m['timestamp'] ?? ''));
        if (!$by_time && $posted_ts && $ts && abs($ts - $posted_ts) <= 48 * HOUR_IN_SECONDS && xf_ig_caption_overlap($caption, $mc) >= 0.5) {
            $by_time = $m;
        }
    }
    return $by_time;
}

/** Shortcode from an instagram.com /p/, /reel/ or /tv/ URL, or '' when it isn't one. */
function xf_ig_shortcode($url) {
    return preg_match('~^https?://(?:www\.)?instagram\.com/(?:[A-Za-z0-9_.]+/)?(?:p|reel|reels|tv)/([A-Za-z0-9_-]{5,40})/?(?:[?#].*)?$~', trim((string) $url), $m) ? $m[1] : '';
}

/** The URL if it is an https instagram.com link, else '' (only instagram.com links are ever rendered). */
function xf_ig_safe_link($url) {
    $p = wp_parse_url((string) $url);
    return ($p['scheme'] ?? '') === 'https' && in_array(strtolower($p['host'] ?? ''), ['instagram.com', 'www.instagram.com'], true) ? (string) $url : '';
}

/* ---- API ---- */

/** The account's latest 50 media. One Graph call at most per 10 minutes (transient). Array or WP_Error. */
function xf_ig_media_list() {
    $cached = get_transient(XF_IG_MEDIA_CACHE);
    if (is_array($cached)) {
        return $cached;
    }
    $user = trim((string) xf_ig_opt('ig_user_id'));
    if ($user === '') {
        return new WP_Error('ig_not_connected', 'Instagram user ID missing.');
    }
    $r = xf_ig_api('GET', $user . '/media', ['fields' => 'id,permalink,caption,timestamp', 'limit' => 50]);
    if (is_wp_error($r)) {
        return $r;
    }
    $list = array_values(array_filter((array) ($r['data'] ?? []), 'is_array'));
    set_transient(XF_IG_MEDIA_CACHE, $list, 10 * MINUTE_IN_SECONDS);
    return $list;
}

function xf_ig_save_verify($id, $status, $note, array $extra = []) {
    global $wpdb;
    $wpdb->update(xf_table('ig_queue'), ['verify_status' => $status, 'verify_note' => mb_substr((string) $note, 0, 250), 'verified_at' => xf_now()] + $extra, ['id' => (int) $id]);
    return $status;
}

function xf_ig_media_fields(array $m) {
    $ts = strtotime((string) ($m['timestamp'] ?? ''));
    return ['ig_media_id' => (string) $m['id'], 'ig_permalink' => xf_ig_safe_link($m['permalink'] ?? ''), 'ig_timestamp' => $ts ? gmdate('Y-m-d H:i:s', $ts) : null];
}

/** Media ids already linked to other posted rows, so two rows never claim the same post. */
function xf_ig_taken_media($except_id) {
    global $wpdb;
    return array_map('strval', $wpdb->get_col($wpdb->prepare('SELECT ig_media_id FROM ' . xf_table('ig_queue') . " WHERE ig_media_id <> '' AND id <> %d", (int) $except_id)));
}

/** Checks one posted row against Instagram and stores the result. Returns the new verify_status. */
function xf_ig_verify_item($id) {
    global $wpdb;
    $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('ig_queue') . ' WHERE id = %d', (int) $id));
    if (!$row || $row->status !== 'posted') {
        return '';
    }
    if (!xf_ig_token() || trim((string) xf_ig_opt('ig_user_id')) === '') {
        return xf_ig_save_verify($id, 'unchecked', 'No Instagram token or user ID saved (Settings → Instagram).');
    }
    $payload = json_decode($row->payload, true) ?: [];
    $media_id = (string) ($row->ig_media_id !== '' ? $row->ig_media_id : ($payload['ig_media_id'] ?? '')); // rows posted before the columns existed
    if ($media_id !== '') {
        $m = xf_ig_api('GET', rawurlencode($media_id), ['fields' => 'id,permalink,timestamp,media_type,caption']);
        if (is_wp_error($m) || empty($m['id'])) {
            return xf_ig_save_verify($id, 'not_found', is_wp_error($m) ? $m->get_error_message() : 'Instagram returned no media for this id (deleted?).', ['ig_media_id' => $media_id]);
        }
        $status = $row->verify_status === 'matched' ? 'matched' : 'verified';
        return xf_ig_save_verify($id, $status, (string) ($m['media_type'] ?? ''), xf_ig_media_fields($m));
    }
    $list = xf_ig_media_list();
    if (is_wp_error($list)) {
        return xf_ig_save_verify($id, 'not_found', $list->get_error_message());
    }
    $m = xf_ig_match_media($row->caption, $row->posted_at ? strtotime($row->posted_at . ' UTC') : 0, $list, xf_ig_taken_media($id));
    if (!$m) {
        return xf_ig_save_verify($id, 'not_found', 'No post among the account\'s latest ' . count($list) . ' matches the caption or posting date. Paste the post link to link it.');
    }
    return xf_ig_save_verify($id, 'matched', 'Matched by ' . (xf_ig_norm_caption($m['caption'] ?? '') !== '' ? 'caption' : 'date'), xf_ig_media_fields($m));
}

/** Links a pasted instagram.com post URL after confirming it is among the account's recent media. True or WP_Error. */
function xf_ig_link_pasted($id, $url) {
    $code = xf_ig_shortcode($url);
    if ($code === '') {
        return new WP_Error('ig_link', 'That is not an instagram.com/p/… or /reel/… link.');
    }
    if (!xf_ig_token()) {
        return new WP_Error('ig_not_connected', 'No Instagram token saved, so the link cannot be checked.');
    }
    $list = xf_ig_media_list();
    if (is_wp_error($list)) {
        return $list;
    }
    foreach ($list as $m) {
        if (xf_ig_shortcode($m['permalink'] ?? '') === $code) {
            if (in_array((string) $m['id'], xf_ig_taken_media($id), true)) {
                return new WP_Error('ig_link', 'That post is already linked to another item.');
            }
            xf_ig_save_verify($id, 'verified', 'Link pasted and found in the account\'s media', xf_ig_media_fields($m));
            return true;
        }
    }
    return new WP_Error('ig_link', 'That post is not among @' . (xf_ig_token()['username'] ?? 'the account') . '\'s latest ' . count($list) . ' posts (list cached for 10 minutes).');
}

/** Verifies posted rows (last $days days, or all when 0). Returns ['checked', 'not_found']. */
function xf_ig_verify_recent($days = 30) {
    global $wpdb;
    $table = xf_table('ig_queue');
    $ids = $days
        ? $wpdb->get_col($wpdb->prepare("SELECT id FROM $table WHERE status = 'posted' AND posted_at >= %s ORDER BY posted_at DESC LIMIT 200", gmdate('Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS)))
        : $wpdb->get_col("SELECT id FROM $table WHERE status = 'posted' ORDER BY posted_at DESC LIMIT 200");
    $missing = 0;
    foreach ($ids as $id) {
        $missing += xf_ig_verify_item((int) $id) === 'not_found' ? 1 : 0;
    }
    update_option('xf_ig_last_sync', time(), false);
    if ($missing && xf_ig_token()) {
        update_option('xf_ig_posted_alert', $missing, false);
    } else {
        delete_option('xf_ig_posted_alert');
    }
    return ['checked' => count($ids), 'not_found' => $missing];
}

add_action('xf_ig_daily', function () {
    xf_ig_verify_recent(30);
});

/** Backfill once: verify every existing posted row as soon as a token is saved. */
add_action('init', function () {
    if (!get_option('xf_ig_verify_backfilled') && xf_ig_token() && !wp_next_scheduled('xf_ig_verify_backfill')) {
        wp_schedule_single_event(time(), 'xf_ig_verify_backfill');
    }
});
add_action('xf_ig_verify_backfill', function () {
    xf_ig_verify_recent(0);
    update_option('xf_ig_verify_backfilled', time(), false);
});

add_action('admin_notices', function () {
    $n = (int) get_option('xf_ig_posted_alert');
    if ($n && current_user_can('manage_options')) {
        echo '<div class="notice notice-error"><p>' . esc_html(sprintf(_n('%d posted Instagram item could not be found on Instagram (deleted or never posted).', '%d posted Instagram items could not be found on Instagram (deleted or never posted).', $n), $n))
            . ' <a href="' . esc_url(xf_ig_tab_url('posted')) . '">Review the posted list</a></p></div>';
    }
});

/* ---- Admin: Posted and Skipped tabs of 100xFounder → Instagram (instagram-admin.php) ---- */

function xf_ig_ist($utc, $format = 'j M Y, H:i') {
    return $utc ? (new DateTimeImmutable($utc, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('Asia/Kolkata'))->format($format) . ' IST' : '—';
}

function xf_ig_via_label($row) {
    $labels = ['auto' => 'Auto', 'post_now' => 'Post now', 'manual' => 'Marked posted by hand'];
    return $labels[$row->posted_via] ?? ((json_decode($row->payload, true)['ig_media_id'] ?? '') !== '' ? 'API' : 'Marked posted by hand');
}

function xf_ig_verify_badge($row) {
    $map = [
        'verified' => ['Verified ✓', '#16a34a'],
        'matched' => ['Verified by match ✓', '#16a34a'],
        'not_found' => ['Not found ✗', '#b32d2e'],
        'unchecked' => ['Not checked', '#757575'],
    ];
    [$label, $color] = $map[$row->verify_status] ?? ['Not checked yet', '#757575'];
    return '<strong style="color:' . esc_attr($color) . '">' . esc_html($label) . '</strong>';
}

function xf_ig_posted_page($view = 'posted') {
    global $wpdb;
    if (!current_user_can('manage_options')) {
        return;
    }
    $table = xf_table('ig_queue');
    $view = $view === 'skipped' ? 'skipped' : 'posted';
    $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE status = %s ORDER BY " . ($view === 'posted' ? 'posted_at' : 'updated_at') . ' DESC LIMIT 200', $view));
    $tz = new DateTimeZone('Asia/Kolkata');
    $now = new DateTimeImmutable('now', $tz);
    $since = function (DateTimeImmutable $d) { return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'); };
    $count = function ($sql, ...$args) use ($wpdb) { return (int) $wpdb->get_var($args ? $wpdb->prepare($sql, ...$args) : $sql); };
    $week = $count("SELECT COUNT(*) FROM $table WHERE status = 'posted' AND posted_at >= %s", $since($now->modify('monday this week')->setTime(0, 0)));
    $month = $count("SELECT COUNT(*) FROM $table WHERE status = 'posted' AND posted_at >= %s", $since($now->modify('first day of this month')->setTime(0, 0)));
    $verified = $count("SELECT COUNT(*) FROM $table WHERE status = 'posted' AND verify_status IN ('verified','matched')");
    $total = $count("SELECT COUNT(*) FROM $table WHERE status = 'posted'");
    $sync = (int) get_option('xf_ig_last_sync');
    $has_token = (bool) xf_ig_token();
    $post = admin_url('admin-post.php');
    ?>
    <div>
        <div class="card" style="max-width:none">
            <p>Posted this week: <strong><?php echo (int) $week; ?></strong> · this month: <strong><?php echo (int) $month; ?></strong> ·
                verified: <strong style="color:#16a34a"><?php echo (int) $verified; ?></strong> · unverified: <strong style="color:#b32d2e"><?php echo (int) ($total - $verified); ?></strong> ·
                <a href="https://www.instagram.com/100x.founder/" target="_blank" rel="noopener">@100x.founder</a> ·
                last sync: <?php echo $sync ? esc_html(wp_date('j M, H:i', $sync, $tz) . ' IST') : 'never'; ?>
                <?php if (!$has_token) : ?> · <span style="color:#b32d2e">No Instagram token saved: items show as Not checked.</span><?php endif; ?></p>
            <form method="post" action="<?php echo esc_url($post); ?>">
                <input type="hidden" name="action" value="xf_ig_posted"><input type="hidden" name="do" value="sync">
                <?php wp_nonce_field('xf_ig_posted_sync'); ?>
                <button class="button" <?php disabled(!$has_token); ?>>Verify last 30 days now</button>
                <span class="description">Also runs daily and right after each post. The account's media list is fetched at most once per 10 minutes.</span>
            </form>
        </div>
        <table class="widefat striped" style="margin-top:12px">
            <thead><tr><th style="width:90px">Slide 1</th><th>Item</th><th><?php echo $view === 'posted' ? 'Posted' : 'Skipped'; ?></th><?php if ($view === 'posted') : ?><th>Instagram</th><th>Verification</th><?php endif; ?><th>Actions</th></tr></thead>
            <tbody>
            <?php foreach ($rows as $r) : $link = xf_ig_safe_link($r->ig_permalink); ?>
                <tr>
                    <td><img src="<?php echo esc_url(xf_slide_url($r->id, 0)); ?>" width="72" height="90" loading="lazy" style="border-radius:4px;border:1px solid #ddd" alt=""></td>
                    <td><strong><?php echo esc_html($r->title !== '' ? $r->title : $r->kind); ?></strong> <code><?php echo esc_html($r->kind); ?></code>
                        <p class="description" style="margin:4px 0 0"><?php echo esc_html(mb_strimwidth(preg_replace('/\s+/u', ' ', (string) $r->caption), 0, 160, '…')); ?></p></td>
                    <?php if ($view === 'posted') : ?>
                        <td><?php echo esc_html(xf_ig_ist($r->posted_at)); ?><br><span class="description"><?php echo esc_html(xf_ig_via_label($r)); ?></span></td>
                        <td><?php echo $link ? '<a href="' . esc_url($link) . '" target="_blank" rel="noopener">View post</a>' : '—'; ?>
                            <?php if ($r->ig_timestamp) : ?><br><span class="description">on Instagram <?php echo esc_html(xf_ig_ist($r->ig_timestamp, 'j M, H:i')); ?></span><?php endif; ?></td>
                        <td><?php echo xf_ig_verify_badge($r); // escaped inside ?>
                            <?php if ($r->verify_note !== '') : ?><br><span class="description"><?php echo esc_html($r->verify_note); ?></span><?php endif; ?>
                            <?php if ($r->verified_at) : ?><br><span class="description">checked <?php echo esc_html(xf_ig_ist($r->verified_at, 'j M, H:i')); ?></span><?php endif; ?>
                            <?php if (!in_array($r->verify_status, ['verified', 'matched'], true)) : ?>
                                <form method="post" action="<?php echo esc_url($post); ?>" style="margin-top:6px">
                                    <input type="hidden" name="action" value="xf_ig_posted"><input type="hidden" name="do" value="paste"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>">
                                    <?php wp_nonce_field('xf_ig_posted_paste_' . (int) $r->id); ?>
                                    <input type="url" name="url" placeholder="https://www.instagram.com/p/…" style="width:220px" required>
                                    <button class="button button-small">Paste link</button>
                                </form>
                            <?php endif; ?></td>
                    <?php else : ?>
                        <td><?php echo esc_html(xf_ig_ist($r->updated_at)); ?></td>
                    <?php endif; ?>
                    <td>
                        <form method="post" action="<?php echo esc_url($post); ?>" style="display:inline">
                            <input type="hidden" name="action" value="xf_ig_posted"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>">
                            <?php if ($view === 'posted') : ?>
                                <?php wp_nonce_field('xf_ig_posted_verify_' . (int) $r->id); ?>
                                <button class="button button-small" name="do" value="verify" <?php disabled(!$has_token); ?>><?php echo $r->verify_status === 'not_found' ? 'Retry verify' : 'Verify'; ?></button>
                            <?php endif; ?>
                        </form>
                        <form method="post" action="<?php echo esc_url($post); ?>" style="display:inline">
                            <input type="hidden" name="action" value="xf_ig_posted"><input type="hidden" name="do" value="unpost"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>">
                            <?php wp_nonce_field('xf_ig_posted_unpost_' . (int) $r->id); ?>
                            <button class="button button-small" onclick="return confirm('Move this back to the queue? It will need approval again before it can post.')"><?php echo $view === 'posted' ? 'Unpost' : 'Back to queue'; ?></button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows) : ?><tr><td colspan="6">Nothing <?php echo esc_html($view); ?> yet.</td></tr><?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

add_action('admin_post_xf_ig_posted', function () {
    global $wpdb;
    $do = isset($_POST['do']) ? sanitize_key(wp_unslash($_POST['do'])) : '';
    $id = isset($_POST['id']) ? absint($_POST['id']) : 0;
    if (!current_user_can('manage_options') || !in_array($do, ['sync', 'verify', 'paste', 'unpost'], true) || !check_admin_referer($do === 'sync' ? 'xf_ig_posted_sync' : "xf_ig_posted_{$do}_{$id}")) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $table = xf_table('ig_queue');
    $row = $id ? $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id)) : null;
    $back = xf_ig_tab_url($row && $row->status === 'skipped' ? 'skipped' : 'posted');
    if ($do !== 'sync' && !$row) {
        xf_ig_redirect('That Instagram item no longer exists.', $back);
    }
    if ($do === 'sync') {
        $r = xf_ig_verify_recent(30);
        xf_ig_redirect(sprintf('Checked %d posted items: %d not found.', $r['checked'], $r['not_found']), $back);
    }
    if ($do === 'verify') {
        $labels = ['verified' => 'Verified', 'matched' => 'Verified by match', 'not_found' => 'Not found', 'unchecked' => 'Not checked (no token)', '' => 'Not a posted item'];
        $s = xf_ig_verify_item($id);
        xf_ig_redirect('Verification: ' . ($labels[$s] ?? $s) . '.', $back);
    }
    if ($do === 'paste') {
        $r = xf_ig_link_pasted($id, isset($_POST['url']) ? esc_url_raw(wp_unslash($_POST['url'])) : '');
        xf_ig_redirect(is_wp_error($r) ? 'Link not saved: ' . $r->get_error_message() : 'Instagram link verified and saved.', $back);
    }
    // Unpost: back to the queue. Approval is cleared so auto-post can't publish it a second time without a fresh OK.
    $payload = json_decode($row->payload, true) ?: [];
    unset($payload['ig_approved'], $payload['ig_media_id'], $payload['ig_permalink'], $payload['ig_error'], $payload['ig_tries']);
    $wpdb->update($table, [
        'status' => 'ready', 'posted_at' => null, 'posted_via' => '', 'ig_media_id' => '', 'ig_permalink' => '', 'ig_timestamp' => null,
        'verify_status' => '', 'verify_note' => '', 'verified_at' => null, 'payload' => wp_json_encode($payload), 'updated_at' => xf_now(),
    ], ['id' => $id]);
    xf_ig_redirect('Moved back to the Instagram queue (needs approval again before it can post).', $back);
});

/* ---- Self-check: wp eval 'ini_set("zend.assertions", 1); ini_set("assert.exception", 1); var_dump(xf_ig_posted_selfcheck());' ---- */

function xf_ig_posted_selfcheck() {
    $cap = "🚀 Top 5 startup launches on Product Hunt, October 13\n\n1. Foo: bar\n2. Baz: qux";
    $media = [
        ['id' => '1', 'caption' => 'Something else entirely', 'timestamp' => '2026-10-15T05:00:00+0000', 'permalink' => 'https://www.instagram.com/p/AAAAA1/'],
        ['id' => '2', 'caption' => "Top 5 startup launches on Product Hunt, October 13\n1. Foo: bar\n2. Baz: qux #startups", 'timestamp' => '2026-10-10T05:00:00+0000', 'permalink' => 'https://www.instagram.com/p/BBBBB2/'],
    ];
    $posted = strtotime('2026-10-15 06:00:00 UTC');
    assert(xf_ig_match_media($cap, $posted, $media)['id'] === '2', 'matches by caption head despite emoji');
    assert(xf_ig_match_media($cap, $posted, $media, ['2']) === null, 'skips media linked to another row');
    $edited = [['id' => '3', 'caption' => 'Our top 5 launches today on Product Hunt Foo Baz', 'timestamp' => '2026-10-15T04:00:00+0000']];
    assert(xf_ig_match_media('Top 5 launches on Product Hunt: Foo, Baz', $posted, $edited)['id'] === '3', 'matches by date + overlap');
    assert(xf_ig_match_media('Top 5 launches on Product Hunt: Foo, Baz', $posted + 4 * DAY_IN_SECONDS, $edited) === null, 'date too far apart');
    assert(xf_ig_shortcode('https://www.instagram.com/p/DPx_ab-12/') === 'DPx_ab-12', 'post shortcode');
    assert(xf_ig_shortcode('https://instagram.com/reel/DPxab12?igsh=x') === 'DPxab12', 'reel shortcode');
    assert(xf_ig_shortcode('https://evil.com/p/DPxab12/') === '', 'other hosts rejected');
    assert(xf_ig_shortcode('https://www.instagram.com.evil.com/p/DPxab12/') === '', 'lookalike host rejected');
    assert(xf_ig_safe_link('javascript:alert(1)') === '' && xf_ig_safe_link('https://www.instagram.com/p/x/') !== '', 'only instagram.com links render');
    return true;
}
