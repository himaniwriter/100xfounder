<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Instagram DMs (owner, 2026-10-21): auto-reply to people who message
 * @100xfounder first. Instagram's API only allows replies inside the 24-hour
 * window a person opens by messaging us; cold DMs are never sent from here.
 *
 * Meta setup (owner): app → Instagram → Webhooks → callback URL
 * /wp-json/xf/v1/ig-webhook with the verify token below, subscribe to
 * "messages"; the access token needs instagram_business_manage_messages.
 * Every webhook call is checked against the app secret (X-Hub-Signature-256).
 * ---------------------------------------------------------------------- */

const XF_IG_DM_REPLY_DAYS = 7; // one auto-reply per person per week; humans take it from there

function xf_ig_dm_opts() {
    $o = (array) get_option('xf_ig_dm', []);
    if (empty($o['verify'])) {
        $o['verify'] = wp_generate_password(32, false);
        update_option('xf_ig_dm', $o, false);
    }
    return $o + [
        'enabled' => 0,
        'secret' => '',
        'text' => "Thanks for messaging 100xFounder! 👋\n\nWant your startup featured? Launch it free: https://100xfounder.com/launch/\nJoin the founders' circle (private WhatsApp + weekly 8am brief): https://100xfounder.com/join/\n\nA person from our team will read your message and reply here.",
    ];
}

/** True when $raw was signed by the app secret (header "sha256=<hex>"). Pure; self-checked. */
function xf_ig_dm_signature_ok($raw, $header, $secret) {
    if ($secret === '' || !is_string($header) || strpos($header, 'sha256=') !== 0) {
        return false;
    }
    return hash_equals(hash_hmac('sha256', (string) $raw, $secret), substr($header, 7));
}

/**
 * Which incoming messages get an auto-reply. $events: webhook messaging items; $last: sender id => last reply time.
 * Skips our own echoes, reactions/reads and anyone replied to in the last XF_IG_DM_REPLY_DAYS days. Pure; self-checked.
 */
function xf_ig_dm_to_reply(array $events, array $last, $self_id, $now) {
    $out = [];
    foreach ($events as $e) {
        $from = (string) ($e['sender']['id'] ?? '');
        if ($from === '' || $from === (string) $self_id || empty($e['message']) || !empty($e['message']['is_echo'])) {
            continue;
        }
        if (isset($last[$from]) && $now - (int) $last[$from] < XF_IG_DM_REPLY_DAYS * DAY_IN_SECONDS) {
            continue;
        }
        $out[$from] = true;
    }
    return array_keys($out);
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/ig-webhook', [
        [
            'methods' => 'GET',
            'permission_callback' => '__return_true', // Meta's verification handshake; checked against the verify token below
            'callback' => function (WP_REST_Request $r) {
                $o = xf_ig_dm_opts();
                if ($r->get_param('hub_mode') === 'subscribe' && hash_equals($o['verify'], (string) $r->get_param('hub_verify_token'))) {
                    header('Content-Type: text/plain; charset=utf-8');
                    echo preg_replace('/[^A-Za-z0-9_-]/', '', (string) $r->get_param('hub_challenge')); // phpcs:ignore -- sanitised above
                    exit;
                }
                return new WP_Error('forbidden', 'Bad verify token', ['status' => 403]);
            },
        ],
        [
            'methods' => 'POST',
            'permission_callback' => '__return_true', // authenticated by the app-secret signature below
            'callback' => 'xf_ig_dm_receive',
        ],
    ]);
});

function xf_ig_dm_receive(WP_REST_Request $r) {
    $o = xf_ig_dm_opts();
    $raw = $r->get_body();
    if (!xf_ig_dm_signature_ok($raw, $r->get_header('x_hub_signature_256'), (string) $o['secret'])) {
        return new WP_Error('forbidden', 'Bad signature', ['status' => 403]);
    }
    $body = json_decode($raw, true);
    $events = [];
    foreach ((array) ($body['entry'] ?? []) as $entry) {
        foreach ((array) ($entry['messaging'] ?? []) as $m) {
            $events[] = $m;
        }
    }
    $log = (array) get_option('xf_ig_dm_log', []);
    $last = (array) get_option('xf_ig_dm_last', []);
    $self = (string) (function_exists('xf_ig_opt') ? xf_ig_opt('ig_user_id') : '');
    foreach ($events as $e) {
        if (!empty($e['message']) && empty($e['message']['is_echo'])) {
            $log[] = ['at' => time(), 'from' => (string) ($e['sender']['id'] ?? ''), 'text' => mb_substr((string) ($e['message']['text'] ?? '[attachment]'), 0, 280), 'replied' => ''];
        }
    }
    if (!empty($o['enabled']) && $self !== '' && function_exists('xf_ig_api')) {
        foreach (xf_ig_dm_to_reply($events, $last, $self, time()) as $to) {
            $res = xf_ig_api('POST', $self . '/messages', [
                'recipient' => wp_json_encode(['id' => $to]),
                'message' => wp_json_encode(['text' => (string) $o['text']]),
            ]);
            $ok = !is_wp_error($res);
            if ($ok) {
                $last[$to] = time();
            }
            foreach ($log as &$row) {
                if ($row['from'] === $to && $row['replied'] === '') {
                    $row['replied'] = $ok ? 'auto-replied' : 'reply failed: ' . $res->get_error_message();
                }
            }
            unset($row);
        }
    }
    update_option('xf_ig_dm_log', array_slice($log, -100), false);
    update_option('xf_ig_dm_last', $last, false);
    return ['ok' => true];
}

/* ---- Admin: Instagram → DMs tab ---- */

function xf_ig_dm_tab() {
    $o = xf_ig_dm_opts();
    $log = array_reverse((array) get_option('xf_ig_dm_log', []));
    ?>
    <div class="card" style="max-width:none">
        <h2>Auto-reply to DMs</h2>
        <p>When someone messages @<?php echo esc_html(xf_ig_token()['username'] ?? '100xfounder'); ?>, this sends one reply (at most once a week per person) with the launch and join links. Instagram only allows replies to people who wrote first, so nothing here sends cold DMs.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="xf_ig_dm_save"><?php wp_nonce_field('xf_ig_dm_save'); ?>
            <table class="form-table">
                <tr><th scope="row">Auto-reply</th><td><label><input type="checkbox" name="enabled" value="1" <?php checked(!empty($o['enabled'])); ?>> Reply automatically</label></td></tr>
                <tr><th scope="row"><label for="xf_dm_text">Reply text</label></th><td><textarea id="xf_dm_text" name="text" rows="7" class="large-text" maxlength="1000"><?php echo esc_textarea($o['text']); ?></textarea></td></tr>
                <tr><th scope="row"><label for="xf_dm_secret">Meta app secret</label></th><td><input id="xf_dm_secret" type="password" name="secret" class="regular-text" autocomplete="off" placeholder="<?php echo $o['secret'] ? esc_attr__('Saved. Paste a new one to replace it.') : ''; ?>"><p class="description">Meta app → App settings → Basic → App secret. Used only to check that webhook calls come from Meta.</p></td></tr>
                <tr><th scope="row">Webhook</th><td><code><?php echo esc_html(rest_url('xf/v1/ig-webhook')); ?></code><br>Verify token: <code><?php echo esc_html($o['verify']); ?></code><p class="description">Meta app → Instagram → Webhooks: paste both, then subscribe to <em>messages</em>. The access token needs the <em>instagram_business_manage_messages</em> permission.</p></td></tr>
            </table>
            <?php submit_button('Save DM settings'); ?>
        </form>
    </div>
    <div class="card" style="max-width:none">
        <h2>Recent messages (<?php echo count($log); ?>)</h2>
        <?php if (!$log) : ?><p class="description">None yet. Messages appear here once the webhook is connected.</p><?php else : ?>
        <table class="widefat striped"><thead><tr><th>When</th><th>From (Instagram ID)</th><th>Message</th><th>Reply</th></tr></thead><tbody>
            <?php foreach (array_slice($log, 0, 50) as $row) : ?>
                <tr><td><?php echo esc_html(wp_date('j M, H:i', (int) $row['at'])); ?></td><td><?php echo esc_html($row['from']); ?></td><td><?php echo esc_html($row['text']); ?></td><td><?php echo esc_html($row['replied'] ?: '—'); ?></td></tr>
            <?php endforeach; ?>
        </tbody></table>
        <?php endif; ?>
    </div>
    <?php
}

add_action('admin_post_xf_ig_dm_save', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_dm_save')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $o = xf_ig_dm_opts();
    $o['enabled'] = empty($_POST['enabled']) ? 0 : 1;
    $text = sanitize_textarea_field(wp_unslash($_POST['text'] ?? ''));
    if ($text !== '') {
        $o['text'] = $text;
    }
    $secret = preg_replace('/\s+/', '', sanitize_text_field(wp_unslash($_POST['secret'] ?? '')));
    if ($secret !== '') {
        $o['secret'] = $secret;
    }
    update_option('xf_ig_dm', $o, false);
    xf_ig_redirect('DM settings saved.', xf_ig_tab_url('dms'));
});

function xf_ig_dm_selfcheck() {
    $raw = '{"entry":[]}';
    $sig = 'sha256=' . hash_hmac('sha256', $raw, 's3cret');
    assert(xf_ig_dm_signature_ok($raw, $sig, 's3cret'), 'valid signature passes');
    assert(!xf_ig_dm_signature_ok($raw, $sig, 'other'), 'wrong secret fails');
    assert(!xf_ig_dm_signature_ok($raw, $sig, ''), 'no secret saved fails closed');
    assert(!xf_ig_dm_signature_ok($raw, 'md5=x', 's3cret'), 'other schemes fail');
    $now = 1800000000;
    $ev = [
        ['sender' => ['id' => 'A'], 'message' => ['text' => 'hi']],
        ['sender' => ['id' => 'A'], 'message' => ['text' => 'again']],
        ['sender' => ['id' => 'ME'], 'message' => ['text' => 'echo', 'is_echo' => true]],
        ['sender' => ['id' => 'B'], 'read' => ['mid' => 'x']],
        ['sender' => ['id' => 'C'], 'message' => ['text' => 'yo']],
    ];
    assert(xf_ig_dm_to_reply($ev, [], 'ME', $now) === ['A', 'C'], 'one reply per sender; no echoes or reads');
    assert(xf_ig_dm_to_reply($ev, ['A' => $now - 3600], 'ME', $now) === ['C'], 'no second reply within a week');
    assert(xf_ig_dm_to_reply($ev, ['A' => $now - 8 * DAY_IN_SECONDS], 'ME', $now) === ['A', 'C'], 'replies again after a week');
    return true;
}
