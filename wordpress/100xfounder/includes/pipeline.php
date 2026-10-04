<?php
if (!defined('ABSPATH')) {
    exit;
}

function xf_pipeline_stages() {
    return [
        'import' => function () { return xf_ph_import_day(1); },
        'contacts' => function () { return xf_discover_contacts_for_new_startups(15); },
        // Replies are checked before sending so nobody who answered gets a follow-up.
        'replies' => 'xf_check_replies',
        'send' => 'xf_send_due_outreach',
        'digest' => function () { return xf_queue_daily_digest(1) ?: ['queued' => null]; },
        'events' => 'xf_import_events',
    ];
}

/**
 * The daily growth routine. Each stage is isolated so one failure doesn't stop
 * the rest. Results are kept for the admin dashboard.
 */
function xf_run_pipeline(array $only = []) {
    if (function_exists('set_time_limit')) {
        @set_time_limit(300);
    }
    $results = [];
    foreach (xf_pipeline_stages() as $stage => $runner) {
        if ($only && !in_array($stage, $only, true)) {
            continue;
        }
        try {
            $results[$stage] = ['ok' => true, 'result' => call_user_func($runner)];
        } catch (Throwable $e) {
            $results[$stage] = ['ok' => false, 'error' => $e->getMessage()];
        }
    }
    update_option('xf_last_run', ['at' => time(), 'results' => $results], false);
    return $results;
}

/** Daily at 14:00 UTC (7am Pacific), after Product Hunt's day has closed. */
function xf_schedule_daily_event() {
    if (!wp_next_scheduled('xf_daily_growth')) {
        $next = strtotime('today 14:00 UTC');
        if ($next < time()) {
            $next += DAY_IN_SECONDS;
        }
        wp_schedule_event($next, 'daily', 'xf_daily_growth');
    }
}

add_action('xf_daily_growth', function () {
    xf_run_pipeline();
});

/**
 * Endpoint for a real server cron (hPanel → Advanced → Cron Jobs), which is
 * more reliable than WP-Cron on low-traffic sites:
 *   wget -q -O /dev/null "https://example.com/wp-json/xf/v1/run?key=CRON_KEY"
 */
add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/run', [
        'methods' => ['GET', 'POST'],
        'permission_callback' => function (WP_REST_Request $request) {
            $key = (string) xf_get_setting('cron_key');
            return $key !== '' && hash_equals($key, (string) $request->get_param('key'));
        },
        'callback' => function (WP_REST_Request $request) {
            $stages = array_filter(array_map('trim', explode(',', (string) $request->get_param('stages'))));
            return rest_ensure_response(xf_run_pipeline($stages));
        },
    ]);
});
