<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Newsletter signups ("The 8AM brief") are stored here until a sender is
 * chosen, and "100x likes" on launches are counted separately from Product
 * Hunt votes.
 * ---------------------------------------------------------------------- */

function xf_rate_limited($bucket, $limit, $window) {
    $key = 'xf_rl_' . md5($bucket . '|' . xf_client_ip());
    $count = (int) get_transient($key);
    if ($count >= $limit) {
        return true;
    }
    set_transient($key, $count + 1, $window);
    return false;
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/subscribe', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            global $wpdb;
            if (!empty($request['website'])) {
                return ['success' => true];
            }
            $email = sanitize_email((string) $request['email']);
            if (!is_email($email)) {
                return new WP_Error('invalid_email', 'Please enter a valid email.', ['status' => 400]);
            }
            if (xf_rate_limited('subscribe', 5, HOUR_IN_SECONDS)) {
                return new WP_Error('rate_limited', 'Too many attempts. Try again later.', ['status' => 429]);
            }
            $wpdb->query($wpdb->prepare(
                'INSERT IGNORE INTO ' . xf_table('subscribers') . ' (email, source, status, created_at) VALUES (%s, %s, %s, %s)',
                strtolower($email), sanitize_key((string) ($request['source'] ?: 'site')), 'active', xf_now()
            ));
            return ['success' => true, 'message' => "You're on the list. The 8AM brief is coming soon."];
        },
    ]);

    register_rest_route('xf/v1', '/like', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $id = (int) $request['id'];
            if (get_post_type($id) !== 'xf_startup' || get_post_status($id) !== 'publish') {
                return new WP_Error('not_found', 'Not found', ['status' => 404]);
            }
            // One like per visitor per launch (the browser also remembers it).
            if (xf_rate_limited('like:' . $id, 1, WEEK_IN_SECONDS) || xf_rate_limited('likes', 60, HOUR_IN_SECONDS)) {
                return ['likes' => (int) get_post_meta($id, '_xf_likes', true)];
            }
            $likes = (int) get_post_meta($id, '_xf_likes', true) + 1;
            update_post_meta($id, '_xf_likes', $likes);
            return ['likes' => $likes];
        },
    ]);
});

/** Newsletter box markup shared by the theme. */
function xf_newsletter_form($heading = 'Every funding round, launch and hire — before your first meeting.', $kicker = 'The 8am brief') {
    ob_start();
    ?>
    <form class="xf-subscribe" data-endpoint="<?php echo esc_url(rest_url('xf/v1/subscribe')); ?>">
        <div class="k">
            <?php echo esc_html($kicker); ?>
        </div>
        <div class="xf-subscribe__title"><?php echo esc_html($heading); ?></div>
        <label class="screen-reader-text" for="xf-sub-<?php echo esc_attr(++$GLOBALS['xf_sub_n']); ?>">Email</label>
        <input id="xf-sub-<?php echo esc_attr($GLOBALS['xf_sub_n']); ?>" type="email" name="email" required placeholder="you@startup.com" autocomplete="email">
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="xf-hp" aria-hidden="true">
        <button type="submit" class="btn btn-w">Subscribe free</button>
        <p class="xf-subscribe__msg" role="status" aria-live="polite"></p>
    </form>
    <?php
    return ob_get_clean();
}
$GLOBALS['xf_sub_n'] = 0;

/* ---- Admin: subscribers list and CSV export ---- */

add_action('admin_menu', function () {
    add_submenu_page('xf', 'Subscribers', 'Subscribers', 'manage_options', 'xf-subscribers', function () {
        global $wpdb;
        $table = xf_table('subscribers');
        $rows = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC LIMIT 200");
        $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE status = 'active'");
        echo '<div class="wrap"><h1>Newsletter subscribers (' . (int) $total . ')</h1>';
        echo '<p><a class="button" href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=xf_export_subscribers'), 'xf_export_subscribers')) . '">Download CSV</a></p>';
        echo '<table class="widefat striped"><thead><tr><th>Email</th><th>Source</th><th>Joined</th></tr></thead><tbody>';
        foreach ($rows as $r) {
            echo '<tr><td>' . esc_html($r->email) . '</td><td>' . esc_html($r->source) . '</td><td>' . esc_html(get_date_from_gmt($r->created_at, 'j M Y H:i')) . '</td></tr>';
        }
        echo $rows ? '' : '<tr><td colspan="3">No subscribers yet.</td></tr>';
        echo '</tbody></table></div>';
    });
}, 20);

add_action('admin_post_xf_export_subscribers', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_export_subscribers')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    global $wpdb;
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="100xfounder-subscribers.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['email', 'source', 'joined_utc']);
    foreach ($wpdb->get_results('SELECT email, source, created_at FROM ' . xf_table('subscribers') . " WHERE status = 'active'", ARRAY_N) as $row) {
        fputcsv($out, $row);
    }
    exit;
});
