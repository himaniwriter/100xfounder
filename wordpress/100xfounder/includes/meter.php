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
    return rest_ensure_response(['level' => xf_meter_level($taps), 'taps_30d' => $taps]);
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
        . '<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".5" stop-color="#b07cff"/><stop offset="1" stop-color="#ff6ad5"/></linearGradient></defs>'
        . '<rect x=".5" y=".5" width="167" height="27" rx="7" fill="#0b0b0c" stroke="#303035"/>'
        . '<text x="12" y="18.5" fill="#f2f2ef" font-family="Inter,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" font-weight="600">⚡ 100xFounder</text>'
        . '<rect x="112" y="5" width="50" height="18" rx="5" fill="url(#g)"/>'
        . '<text x="137" y="18" text-anchor="middle" fill="#0b0b0c" font-family="Inter,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" font-weight="800">' . $level . 'X</text></svg>';
}

/* ---- The gauge panel on a startup page ---- */

function xf_meter_gauge_svg($level) {
    $level = (int) $level;
    return '<svg viewBox="0 0 260 150" aria-hidden="true" focusable="false">'
        . '<defs><linearGradient id="xfmg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".45" stop-color="#b07cff"/><stop offset=".8" stop-color="#ff6ad5"/><stop offset="1" stop-color="#6a7bff"/></linearGradient></defs>'
        . '<path d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke="var(--ln)" stroke-width="16" stroke-linecap="round"/>'
        . '<path class="xf-meter__arc" d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke="url(#xfmg)" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" data-to="' . $level . '"/>'
        . '<g class="xf-meter__needle"><line x1="130" y1="130" x2="130" y2="40" stroke="var(--tx)" stroke-width="3" stroke-linecap="round"/><circle cx="130" cy="130" r="7" fill="var(--tx)"/></g>'
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
    <div class="xf-meter" data-meter="<?php echo (int) $id; ?>" data-endpoint="<?php echo esc_url(rest_url('xf/v1/meter')); ?>" data-t="<?php echo esc_attr(xf_rating_token($url)); ?>">
        <div class="xf-meter__gauge">
            <?php echo xf_meter_gauge_svg($level); // phpcs:ignore -- built from an integer ?>
            <div class="xf-meter__read" aria-live="polite"><div class="xf-meter__num"><span data-meter-level><?php echo (int) $level; ?></span>X</div><div class="k xf-meter__sub">Taps, last 30 days: <span data-meter-taps><?php echo esc_html(number_format_i18n($taps)); ?></span></div></div>
        </div>
        <div class="xf-meter__side">
            <div class="k">100X Meter</div>
            <button type="button" class="xf-meter__btn" data-meter-tap<?php echo $team ? ' disabled title="Taps from the team are not counted"' : ''; ?>>⚡ 100X it</button>
            <input class="xf-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
            <p class="xf-meter__note" data-meter-msg>One tap per reader per day. Taps show how much buzz <?php echo esc_html($name); ?> has here; they aren’t a rating.</p>
            <?php if ($stars) : ?>
                <div class="xf-meter__chips"><span class="chip">Visitor rating <b><?php echo esc_html(number_format_i18n($stars['value'], 1)); ?></b>/5 · <?php echo esc_html(sprintf(_n('%s vote', '%s votes', $stars['count']), number_format_i18n($stars['count']))); ?></span></div>
            <?php endif; ?>
            <div class="xf-meter__embed">
                <span class="k">Founders: embed your meter</span>
                <img src="<?php echo esc_url($badge); ?>" alt="<?php echo esc_attr($name); ?> 100X Meter badge" width="168" height="28" loading="lazy">
                <button type="button" class="chip" data-copy-link="<?php echo esc_attr($snippet); ?>">Copy embed code</button>
                <a class="k u" href="<?php echo esc_url(home_url('/tools/startup-100x-score/')); ?>">Founder? Score your startup →</a>
            </div>
        </div>
    </div>
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
        <div class="sh"><h2>100X this week</h2><span class="k">Reader taps · 7 days</span></div>
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

/* Self-check (WP_DEBUG only): the log scale's fixed points. */
if (defined('WP_DEBUG') && WP_DEBUG) {
    assert(xf_meter_level(0) === 0 && xf_meter_level(1) === 11 && xf_meter_level(500) === 100 && xf_meter_level(5000) === 100);
}
