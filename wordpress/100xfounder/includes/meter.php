<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * The 100X Meter: a 0–100X gauge on every startup page that readers push with
 * one tap a day, a weekly leaderboard on the homepage, an embeddable badge for
 * founders, and the email report for the /tools/startup-100x-score/ quiz.
 *
 *  - Taps are on-page only. They never go into structured data: a tap is not a
 *    rating, so marking it up as one would mislead. The startup page's schema
 *    keeps carrying the real visitor star rating (ratings.php, startup-reviews.php).
 *  - One tap per visitor (salted address hash, xf_rating_voter()) per startup
 *    per day, enforced by a unique index. The button carries the same signed
 *    token as the rating box, so a script can't tap a page the server never showed.
 *  - Level is a log scale: early taps move the needle, 500 taps in 30 days is 100X.
 */

const XF_METER_FULL = 500;

function xf_meter_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta("CREATE TABLE " . xf_table('meter_votes') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  post_id bigint(20) unsigned NOT NULL,
  voter char(32) NOT NULL,
  day date NOT NULL,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY one_a_day (post_id,voter,day),
  KEY day (day)
) " . $wpdb->get_charset_collate() . ";");
}

/** 0–100 from the taps in the last 30 days. */
function xf_meter_level($taps30) {
    $taps30 = max(0, (int) $taps30);
    return (int) min(100, round(100 * log(1 + $taps30) / log(1 + XF_METER_FULL)));
}

/** The quiz's bands (tools.js quizBand), so a listing and a founder's own score speak the same language. */
function xf_meter_stage($level) {
    $level = (int) $level;
    return $level < 30 ? 'Early' : ($level < 60 ? 'Traction' : ($level < 85 ? 'Scaling' : 'Breakout'));
}

/** Recounts one startup's cached tap totals from the table. */
function xf_meter_refresh($post_id) {
    global $wpdb;
    $t = xf_table('meter_votes');
    $today = wp_date('Y-m-d');
    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT COUNT(*) AS total, SUM(day > %s) AS d30, SUM(day > %s) AS d7 FROM $t WHERE post_id = %d",
        gmdate('Y-m-d', strtotime($today . ' -30 days')), gmdate('Y-m-d', strtotime($today . ' -7 days')), $post_id
    ));
    update_post_meta($post_id, '_xf_meter_total', (int) ($row->total ?? 0));
    update_post_meta($post_id, '_xf_meter_30d', (int) ($row->d30 ?? 0));
    update_post_meta($post_id, '_xf_meter_7d', (int) ($row->d7 ?? 0));
    return (int) ($row->d30 ?? 0);
}

/** Hourly: old taps age out of the 7- and 30-day windows. */
add_action('xf_index_control_hourly', function () {
    global $wpdb;
    $ids = $wpdb->get_col($wpdb->prepare(
        'SELECT DISTINCT post_id FROM ' . xf_table('meter_votes') . ' WHERE day > %s',
        gmdate('Y-m-d', strtotime(wp_date('Y-m-d') . ' -32 days'))
    ));
    foreach ($ids as $id) {
        xf_meter_refresh((int) $id);
    }
});

/** Crawlers and scripts don't tap. */
function xf_meter_is_bot() {
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    return $ua === '' || (bool) preg_match('/bot|crawl|spider|slurp|curl|wget|python|httpclient|headless|lighthouse|preview|facebookexternalhit|scrapy|go-http|java\//i', $ua);
}

/* ---- REST ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/meter', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'xf_meter_tap',
    ]);
    register_rest_route('xf/v1', '/meter-badge/(?P<id>\d+)\.svg', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_meter_badge',
    ]);
    register_rest_route('xf/v1', '/meter-levels', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_meter_levels',
    ]);
    register_rest_route('xf/v1', '/leaderboard', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => 'xf_meter_board_rest',
    ]);
    register_rest_route('xf/v1', '/score-report', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'xf_score_report',
    ]);
});

function xf_meter_tap(WP_REST_Request $r) {
    global $wpdb;
    $id = (int) $r->get_param('id');
    if ((string) $r->get_param('website') !== '') {
        return new WP_Error('bad_tap', 'Please try again.', ['status' => 400]); // honeypot
    }
    $post = get_post($id);
    if (!$post || $post->post_type !== 'xf_startup' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'That startup is not listed.', ['status' => 404]);
    }
    if (!xf_rating_token_ok(get_permalink($id), $r->get_param('t'))) {
        return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 403]);
    }
    if (xf_meter_is_bot() || current_user_can('edit_posts')) {
        return new WP_Error('not_counted', 'Taps from the team and from bots are not counted.', ['status' => 403]);
    }
    if (xf_rate_limited('meter', 60, HOUR_IN_SECONDS)) {
        return new WP_Error('slow_down', 'Too many taps from this connection. Try again later.', ['status' => 429]);
    }
    $old_level = xf_meter_level(get_post_meta($id, '_xf_meter_30d', true));
    $added = $wpdb->query($wpdb->prepare(
        'INSERT IGNORE INTO ' . xf_table('meter_votes') . ' (post_id, voter, day, created_at) VALUES (%d, %s, %s, %s)',
        $id, xf_rating_voter(), wp_date('Y-m-d'), xf_now()
    ));
    // Serialise the recount so two taps at once can't leave a stale total behind.
    $lock = 'meter_' . $id;
    $locked = xf_mutex_acquire($lock, 10, 3);
    $taps = xf_meter_refresh($id);
    if ($locked) {
        xf_mutex_release($lock);
    }
    if (!$added) {
        return new WP_Error('already', 'You already 100X’d this today. Come back tomorrow.', ['status' => 409, 'level' => xf_meter_level($taps), 'taps_30d' => $taps]);
    }
    $level = xf_meter_level($taps);
    do_action('xf_meter_tapped', $id, $old_level, $level, $taps);
    return rest_ensure_response(['level' => $level, 'taps_30d' => $taps, 'stage' => xf_meter_stage($level)]);
}

/** Public, read-only: current level for up to 50 startups (the /my-100x/ list). */
function xf_meter_levels(WP_REST_Request $r) {
    $ids = array_slice(array_unique(array_filter(array_map('intval', explode(',', (string) $r->get_param('ids'))))), 0, 50);
    sort($ids);
    $key = 'xf_meter_lv_' . md5(implode(',', $ids));
    $out = get_transient($key);
    if (!is_array($out)) {
        $out = [];
        foreach ($ids as $id) {
            if (get_post_type($id) === 'xf_startup' && get_post_status($id) === 'publish') {
                $level = xf_meter_level(get_post_meta($id, '_xf_meter_30d', true));
                $out[$id] = ['level' => $level, 'stage' => xf_meter_stage($level), 'taps_30d' => (int) get_post_meta($id, '_xf_meter_30d', true), 'name' => html_entity_decode(wp_strip_all_tags(get_the_title($id)), ENT_QUOTES, 'UTF-8'), 'url' => get_permalink($id)];
            }
        }
        set_transient($key, $out, 5 * MINUTE_IN_SECONDS);
    }
    $res = rest_ensure_response((object) $out);
    $res->header('Cache-Control', 'public, max-age=300');
    return $res;
}

function xf_meter_badge(WP_REST_Request $r) {
    $id = (int) $r['id'];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'xf_startup' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'Not found.', ['status' => 404]);
    }
    $level = xf_meter_level(get_post_meta($id, '_xf_meter_30d', true));
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    header('X-Content-Type-Options: nosniff');
    echo xf_meter_badge_svg($level); // phpcs:ignore WordPress.Security.EscapeOutput -- built from an integer
    exit;
}

function xf_meter_badge_svg($level) {
    $level = (int) $level;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="168" height="28" viewBox="0 0 168 28" role="img" aria-label="100xFounder 100X Meter: ' . $level . 'X">'
        . '<title>100xFounder 100X Meter: ' . $level . 'X</title>'
        . '<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".5" stop-color="#b07cff"/><stop offset="1" stop-color="#7c8cff"/></linearGradient></defs>'
        . '<rect x=".5" y=".5" width="167" height="27" rx="7" fill="#0b0b0c" stroke="#303035"/>'
        . '<text x="12" y="18.5" fill="#f2f2ef" font-family="Inter,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" font-weight="600">⚡ 100xFounder</text>'
        . '<rect x="112" y="5" width="50" height="18" rx="5" fill="url(#g)"/>'
        . '<text x="137" y="18" text-anchor="middle" fill="#0b0b0c" font-family="Inter,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" font-weight="800">' . $level . 'X</text></svg>';
}

/* ---- The gauge panel on a startup page ---- */

function xf_meter_gauge_svg($level) {
    $level = (int) $level;
    // Instrument scale: 21 ticks round the arc, longer at 0/25/50/75/100.
    $ticks = '';
    for ($i = 0; $i <= 20; $i++) {
        $a = deg2rad(180 - 9 * $i);
        $major = $i % 5 === 0;
        $r1 = $major ? 119 : 122;
        $ticks .= sprintf('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" class="%s"/>', 130 + $r1 * cos($a), 130 - $r1 * sin($a), 130 + 127 * cos($a), 130 - 127 * sin($a), $major ? 'xf-meter__tick xf-meter__tick--major' : 'xf-meter__tick');
    }
    return '<svg viewBox="0 0 260 140" aria-hidden="true" focusable="false">'
        . '<defs><linearGradient id="xfmg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".45" stop-color="#b07cff"/><stop offset=".8" stop-color="#7c8cff"/><stop offset="1" stop-color="#6a7bff"/></linearGradient>'
        . '<radialGradient id="xfmk"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e9dcff"/><stop offset="1" stop-color="#b07cff" stop-opacity="0"/></radialGradient></defs>'
        . $ticks
        . '<path class="xf-meter__track" d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke-width="12" stroke-linecap="round"/>'
        . '<path class="xf-meter__arc" d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke="url(#xfmg)" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" data-to="' . $level . '"/>'
        . '<g class="xf-meter__needle"><circle cx="130" cy="20" r="13" fill="url(#xfmk)" opacity=".55"/><circle cx="130" cy="20" r="6" fill="#fff"/></g>'
        . '</svg>';
}

function xf_meter_html($id) {
    $id = (int) $id;
    $taps = (int) get_post_meta($id, '_xf_meter_30d', true);
    $level = xf_meter_level($taps);
    $url = get_permalink($id);
    $name = get_the_title($id);
    $stars = function_exists('xf_startup_rating_public') ? xf_startup_rating_public($id) : null;
    $badge = rest_url('xf/v1/meter-badge/' . $id . '.svg');
    $snippet = sprintf('<a href="%s"><img src="%s" alt="%s on the 100xFounder 100X Meter" width="168" height="28"></a>', esc_url($url), esc_url($badge), esc_attr($name));
    $team = current_user_can('edit_posts');
    ob_start();
    ?>
    <section class="xf-meter" aria-label="100X Meter" data-meter="<?php echo (int) $id; ?>" data-name="<?php echo esc_attr($name); ?>" data-slug="<?php echo esc_attr(get_post_field('post_name', $id)); ?>" data-endpoint="<?php echo esc_url(rest_url('xf/v1/meter')); ?>" data-t="<?php echo esc_attr(xf_rating_token($url)); ?>">
        <div class="xf-meter__gauge">
            <?php echo xf_meter_gauge_svg($level); // phpcs:ignore -- built from an integer ?>
            <div class="xf-meter__read" aria-live="polite">
                <div class="xf-meter__num"><span data-meter-level><?php echo (int) $level; ?></span><i>X</i></div>
                <div class="xf-meter__sub"><span data-meter-taps><?php echo esc_html(number_format_i18n($taps)); ?></span> <?php echo esc_html(_n('tap', 'taps', $taps)); ?> · 30 days</div>
            </div>
            <span class="xf-meter__scale" aria-hidden="true"><span>0</span><span>100X</span></span>
        </div>
        <div class="xf-meter__side">
            <p class="xf-meter__eyebrow">100X Meter <span class="xf-stage" data-meter-stage><?php echo esc_html(xf_meter_stage($level)); ?></span></p>
            <h3 class="xf-meter__title">Think <?php echo esc_html($name); ?> could go 100X?</h3>
            <p class="xf-meter__note" data-meter-msg>Give it a push. One tap per reader each day; the meter tracks buzz here, not quality.</p>
            <button type="button" class="xf-meter__btn" data-meter-tap<?php echo $team ? ' disabled title="Taps from the team are not counted"' : ''; ?>><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg><span>100X it</span></button>
            <input class="xf-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
            <?php echo function_exists('xf_share_tap_moment') ? xf_share_tap_moment($id) : ''; // phpcs:ignore -- escaped inside ?>
        </div>
        <footer class="xf-meter__foot">
            <?php if ($stars) : ?>
                <span>Visitor rating <b><?php echo esc_html(number_format_i18n($stars['value'], 1)); ?></b>/5 · <?php echo esc_html(sprintf(_n('%s vote', '%s votes', $stars['count']), number_format_i18n($stars['count']))); ?></span>
            <?php endif; ?>
            <span class="xf-meter__badge">
                <img src="<?php echo esc_url(add_query_arg('v', $taps, $badge)); ?>" alt="<?php echo esc_attr($name); ?> 100X Meter badge" width="168" height="28" loading="lazy" data-meter-badge>
                <button type="button" class="xf-meter__link" data-copy-link="<?php echo esc_attr($snippet); ?>">Copy badge code</button>
            </span>
            <a class="xf-meter__link" href="<?php echo esc_url(home_url('/100x-meter/')); ?>">What's this?</a>
            <a class="xf-meter__link" href="<?php echo esc_url(home_url('/tools/startup-100x-score/')); ?>">Founder? Score your startup →</a>
            <a class="xf-meter__mine" href="<?php echo esc_url(home_url('/my-100x/')); ?>" data-meter-mine hidden></a>
            <?php if (function_exists('xf_share_bar_html')) : ?>
                <span class="xf-meter__share"><?php echo xf_share_bar_html($url, $name . ' on the 100xFounder 100X Meter', 'meter', ['compact' => true]); // phpcs:ignore -- escaped inside ?></span>
                <?php echo xf_share_take_cta($id); // phpcs:ignore -- escaped inside ?>
                <a class="xf-meter__link" href="<?php echo esc_url(xf_share_kit_url($id)); ?>">Founder? Get your share kit</a>
            <?php endif; ?>
        </footer>
    </section>
    <?php
    return ob_get_clean();
}

/* ---- Homepage: 100X this week ---- */

/** Top 5 by taps in the last 7 days; '' until at least 3 startups have taps, so it's never a near-empty list. */
function xf_meter_leaderboard_html() {
    $ids = get_posts([
        'post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 5, 'fields' => 'ids', 'no_found_rows' => true,
        'meta_key' => '_xf_meter_7d', 'orderby' => 'meta_value_num', 'order' => 'DESC',
        'meta_query' => [['key' => '_xf_meter_7d', 'value' => 0, 'compare' => '>', 'type' => 'NUMERIC']],
    ]);
    if (count($ids) < 3) {
        return '';
    }
    ob_start();
    ?>
    <section class="wrap" style="padding-top:88px">
        <div class="sh"><h2>100X this week</h2><a class="k u" href="<?php echo esc_url(home_url('/leaderboard/')); ?>">Full leaderboard →</a></div>
        <div class="xf-board">
            <?php foreach ($ids as $i => $sid) :
                $level = xf_meter_level(get_post_meta($sid, '_xf_meter_30d', true));
                $week = (int) get_post_meta($sid, '_xf_meter_7d', true); ?>
                <a class="xf-board__row" href="<?php echo esc_url(get_permalink($sid)); ?>">
                    <span class="mono xf-board__rank"><?php echo esc_html(str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT)); ?></span>
                    <span class="xf-board__name"><span class="u"><?php echo esc_html(get_the_title($sid)); ?></span><small><?php echo esc_html(wp_trim_words((string) get_post_meta($sid, '_xf_tagline', true), 10) . ' · ' . sprintf(_n('%s tap this week', '%s taps this week', $week), number_format_i18n($week))); ?></small></span>
                    <span class="xf-board__bar" aria-hidden="true"><span style="width:<?php echo (int) $level; ?>%"></span></span>
                    <span class="mono xf-board__lvl"><?php echo (int) $level; ?>X</span>
                </a>
            <?php endforeach; ?>
        </div>
    </section>
    <?php
    return ob_get_clean();
}

/* ---- Quiz: "Email me the full report" ---- */

function xf_score_consent_request() {
    return 'Save my details with 100xFounder and email me my 100X startup score report.';
}

function xf_score_report(WP_REST_Request $r) {
    if ((string) $r->get_param('website') !== '') {
        return new WP_Error('bad_request', 'Please try again.', ['status' => 400]);
    }
    if (!xf_join_token_ok($r->get_param('token'))) {
        return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 403]);
    }
    if (xf_rate_limited('score_report', 5, HOUR_IN_SECONDS)) {
        return new WP_Error('rate_limited', 'Too many requests from your connection. Please try again later.', ['status' => 429]);
    }
    $email = strtolower(sanitize_email((string) $r->get_param('email')));
    if (!is_email($email)) {
        return new WP_Error('bad_email', 'Please enter a valid email address.', ['status' => 400]);
    }
    if (!$r->get_param('consent_request')) {
        return new WP_Error('no_consent', 'Please tick the first box so we can email your report.', ['status' => 400]);
    }
    $name = sanitize_text_field(mb_substr((string) $r->get_param('name'), 0, 80));
    $score = max(0, min(100, (int) $r->get_param('score')));
    $tips = array_slice(array_map(function ($t) { return sanitize_text_field(mb_substr((string) $t, 0, 240)); }, (array) $r->get_param('tips')), 0, 3);
    $news_ok = (bool) $r->get_param('consent_news');
    $now = current_time('mysql');
    $page = home_url('/tools/startup-100x-score/');

    if ($news_ok) {
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            'INSERT IGNORE INTO ' . xf_table('subscribers') . ' (email, source, status, created_at) VALUES (%s, %s, %s, %s)',
            $email, '100x-score', 'active', xf_now()
        ));
    }
    $meta = array_filter([
        '_xf_lead_email' => $email,
        '_xf_lead_name' => $name ?: null,
        '_xf_lead_niche' => '100x-score',
        '_xf_lead_sub' => 'quiz',
        '_xf_lead_source' => $page,
        '_xf_lead_score' => (string) $score,
        '_xf_lead_consent' => $now,
        '_xf_lead_consent_text' => xf_score_consent_request(),
        '_xf_lead_consent_news' => $news_ok ? $now : null,
        '_xf_lead_consent_news_text' => $news_ok ? xf_join_consent_email() : null,
    ]);
    $existing = get_posts([
        'post_type' => 'xf_lead', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_lead_email', 'value' => $email], ['key' => '_xf_lead_niche', 'value' => '100x-score']],
    ]);
    if ($existing) {
        foreach ($meta as $k => $v) {
            update_post_meta($existing[0], $k, $v);
        }
    } else {
        wp_insert_post([
            'post_type' => 'xf_lead',
            'post_status' => 'private',
            'post_title' => sprintf('%s (%s) — 100x-score', $name ?: 'Founder', $email),
            'post_content' => sprintf("Startup 100X score: %dX\nTips:\n- %s", $score, implode("\n- ", $tips)),
            'meta_input' => $meta,
        ]);
    }

    $body = sprintf("Hi%s,\n\nYour startup scored %dX on the 100xFounder 100X score.\n\nYour three biggest levers:\n- %s\n\nRetake the quiz any time: %s\n\nThe score is a self-assessment, not an investment view.\n\n100xFounder",
        $name ? ' ' . $name : '', $score, implode("\n- ", $tips), $page);
    wp_mail($email, sprintf('Your startup scored %dX — your 100X report', $score), $body);
    return ['ok' => true];
}

/* ---- Weekly snapshot: the leaderboard's ▲/▼ is the level change since the week began ---- */

add_action('xf_index_control_hourly', function () {
    $week = wp_date('o-W');
    if (get_option('xf_meter_snap_week') === $week) {
        return;
    }
    update_option('xf_meter_snap_week', $week, false);
    $ids = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true, 'meta_key' => '_xf_meter_total', 'meta_compare' => 'EXISTS']);
    foreach ($ids as $id) {
        update_post_meta($id, '_xf_meter_prev', xf_meter_level(get_post_meta($id, '_xf_meter_30d', true)));
    }
}, 20);

/* ---- /leaderboard/ ---- */

/** Tab => [label, meta key ranked by, what the number means]. Launch day is Product Hunt's count, not ours. */
function xf_meter_board_tabs() {
    return [
        'week' => ['This week', '_xf_meter_7d', 'taps this week'],
        'month' => ['This month', '_xf_meter_30d', 'taps · 30 days'],
        'all' => ['All time', '_xf_meter_total', 'taps all time'],
        'launch' => ['Launch day', '_xf_votes', 'Product Hunt votes'],
    ];
}

/** [tab, industry slug] from the request, both validated. */
function xf_meter_board_args($src = null) {
    $src = $src ?? $_GET; // phpcs:ignore WordPress.Security.NonceVerification -- read-only filters
    $tab = sanitize_key((string) ($src['tab'] ?? 'week'));
    $tab = isset(xf_meter_board_tabs()[$tab]) ? $tab : 'week';
    $ind = sanitize_title((string) ($src['industry'] ?? ''));
    return [$tab, $ind && term_exists($ind, 'xf_industry') ? $ind : ''];
}

/** Ranked startup ids (value > 0 only, nothing seeded) and whether more follow. */
function xf_meter_board_ids($tab, $industry = '', $offset = 0, $limit = 25) {
    $key = xf_meter_board_tabs()[$tab][1];
    $args = [
        'post_type' => 'xf_startup', 'post_status' => 'publish', 'fields' => 'ids', 'no_found_rows' => true,
        'posts_per_page' => $limit + 1, 'offset' => max(0, (int) $offset),
        'meta_key' => $key, 'orderby' => ['meta_value_num' => 'DESC', 'date' => 'DESC'],
        'meta_query' => [['key' => $key, 'value' => 0, 'compare' => '>', 'type' => 'NUMERIC']],
    ];
    if ($industry) {
        $args['tax_query'] = [['taxonomy' => 'xf_industry', 'field' => 'slug', 'terms' => $industry]];
    }
    $ids = get_posts($args);
    return [array_slice($ids, 0, $limit), count($ids) > $limit];
}

/** Industries that have at least one startup ranked on this tab. */
function xf_meter_board_industries($tab) {
    $ids = xf_meter_board_ids($tab, '', 0, 500)[0];
    if (!$ids) {
        return [];
    }
    $terms = wp_get_object_terms($ids, 'xf_industry', ['orderby' => 'count', 'order' => 'DESC']);
    return is_wp_error($terms) ? [] : $terms;
}

function xf_meter_board_row($id, $rank, $tab) {
    $level = xf_meter_level(get_post_meta($id, '_xf_meter_30d', true));
    $tabs = xf_meter_board_tabs();
    $value = (int) get_post_meta($id, $tabs[$tab][1], true);
    $prev = get_post_meta($id, '_xf_meter_prev', true);
    $delta = $prev === '' ? 0 : $level - (int) $prev;
    $url = get_permalink($id);
    $name = get_the_title($id);
    $team = current_user_can('edit_posts');
    ob_start();
    ?>
    <li class="xf-lb__row<?php echo $rank <= 3 ? ' xf-lb__row--top' : ''; ?>" data-lb-id="<?php echo (int) $id; ?>" data-name="<?php echo esc_attr($name); ?>" data-slug="<?php echo esc_attr(get_post_field('post_name', $id)); ?>" data-t="<?php echo esc_attr(xf_rating_token($url)); ?>">
        <span class="xf-lb__rank mono"><?php echo esc_html(str_pad((string) $rank, 2, '0', STR_PAD_LEFT)); ?></span>
        <a class="xf-lb__who" href="<?php echo esc_url($url); ?>">
            <?php echo xf_startup_logo_html($id, 40); // phpcs:ignore -- escaped inside ?>
            <span class="xf-lb__name"><b><?php echo esc_html($name); ?></b><small><?php echo esc_html(wp_trim_words((string) get_post_meta($id, '_xf_tagline', true), 12)); ?></small></span>
        </a>
        <span class="xf-stage" data-lb-stage><?php echo esc_html(xf_meter_stage($level)); ?></span>
        <span class="xf-lb__bar" aria-hidden="true"><span data-lb-bar style="width:<?php echo (int) $level; ?>%"></span></span>
        <?php if ($tab === 'launch') : // Product Hunt's count leads here; our meter level is secondary. ?>
            <span class="xf-lb__lvl mono"><?php echo esc_html(number_format_i18n($value)); ?><small>PH votes · <span data-lb-level><?php echo (int) $level; ?></span>X meter</small></span>
        <?php else : ?>
            <span class="xf-lb__lvl mono"><span data-lb-level><?php echo (int) $level; ?></span>X<?php if ($delta) : ?> <em class="<?php echo $delta > 0 ? 'up' : 'dn'; ?>" title="Change since last week"><?php echo esc_html(($delta > 0 ? '▲' : '▼') . abs($delta)); ?></em><?php endif; ?><small><?php echo esc_html(number_format_i18n($value) . ' ' . $tabs[$tab][2]); ?></small></span>
        <?php endif; ?>
        <button type="button" class="xf-lb__tap" data-lb-tap aria-label="<?php echo esc_attr('100X ' . $name); ?>"<?php echo $team ? ' disabled title="Taps from the team are not counted"' : ''; ?>><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></button>
    </li>
    <?php
    return ob_get_clean();
}

/** Rows HTML for a slice; rank continues from the offset. */
function xf_meter_board_rows($ids, $offset, $tab) {
    $html = '';
    foreach ($ids as $i => $id) {
        $html .= xf_meter_board_row($id, $offset + $i + 1, $tab);
    }
    return $html;
}

function xf_meter_board_rest(WP_REST_Request $r) {
    [$tab, $ind] = xf_meter_board_args($r->get_params());
    $offset = max(0, min(1000, (int) $r->get_param('offset')));
    [$ids, $more] = xf_meter_board_ids($tab, $ind, $offset);
    $res = rest_ensure_response(['html' => xf_meter_board_rows($ids, $offset, $tab), 'more' => $more]);
    $res->header('Cache-Control', 'public, max-age=300');
    return $res;
}

/* ---- Pages: /100x-meter/ (explainer), /leaderboard/, /my-100x/ (private, browser-only list) ---- */

add_action('init', function () {
    if (get_option('xf_meter_pages') === '2' || (function_exists('xf_mutex_acquire') && !xf_mutex_acquire('meter_pages', 60))) {
        return;
    }
    $pages = [
        '100x-meter' => ['What is the 100X Meter?', 'How the 100X Meter on 100xFounder works: one tap a day per reader, the four stages, why it measures buzz and not quality, and how founders embed the badge.'],
        'leaderboard' => ['Startup Leaderboard', 'The startups 100xFounder readers are backing this week, this month and all time on the 100X Meter, plus Product Hunt launch-day votes.'],
        'my-100x' => ['Your 100X list', 'The startups you backed on the 100X Meter, kept only in this browser.'],
    ];
    foreach ($pages as $slug => [$title, $excerpt]) {
        if (!get_page_by_path($slug)) {
            wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'post_excerpt' => $excerpt, 'post_content' => '']);
        }
    }
    update_option('xf_meter_pages', '2');
}, 30);

function xf_meter_is_private_page() {
    return is_page('my-100x');
}

/** Leaderboard views with a tab or industry, and the private list, are noindex. Registered late so it runs after indexing.php's "index everything". */
add_action('wp', function () {
    add_filter('wp_robots', function ($robots) {
        // phpcs:ignore WordPress.Security.NonceVerification -- read-only
        if (xf_meter_is_private_page() || (is_page('leaderboard') && (isset($_GET['tab']) || isset($_GET['industry'])))) {
            unset($robots['index'], $robots['max-image-preview']);
            $robots['noindex'] = true;
            $robots['follow'] = true;
        }
        return $robots;
    }, PHP_INT_MAX);
});

add_filter('xf_page_allows_ads', function ($ok) {
    return xf_meter_is_private_page() ? false : $ok;
});

add_filter('wp_sitemaps_posts_query_args', function ($args, $post_type) {
    if ($post_type === 'page' && ($p = get_page_by_path('my-100x'))) {
        $args['post__not_in'] = array_merge((array) ($args['post__not_in'] ?? []), [$p->ID]);
    }
    return $args;
}, 10, 2);

/* Self-check (WP_DEBUG only): the log scale's fixed points. */
if (defined('WP_DEBUG') && WP_DEBUG) {
    assert(xf_meter_stage(29) === 'Early' && xf_meter_stage(30) === 'Traction' && xf_meter_stage(85) === 'Breakout');
    assert(xf_meter_level(0) === 0 && xf_meter_level(1) === 11 && xf_meter_level(500) === 100 && xf_meter_level(5000) === 100);
}
