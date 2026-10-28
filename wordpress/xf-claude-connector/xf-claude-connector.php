<?php
/**
 * Plugin Name: 100xFounder Claude Connector
 * Description: A private, locked-down MCP connection for one Claude account. One secret token, bound to one WordPress user, limited to the tools you allow, logged, rate-limited and revocable.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 8.0
 * Author: 100xFounder
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Security model
 *
 * - One connection, one secret. The token is 256 random bits, shown once,
 *   stored only as an HMAC (so a database leak doesn't reveal it). Rotating
 *   it kills the old one instantly. It expires (default 90 days).
 * - The token does not log anyone into WordPress. It only works on this one
 *   endpoint, and only for the duration of a request, as the single
 *   WordPress user the owner bound it to (Author by default).
 * - Nothing else gets in: WordPress cookies, application passwords and the
 *   old /xf/v1/mcp endpoint are all refused while this plugin is active.
 * - Tools are opt-in by group; publishing and admin routines are off by
 *   default. The bound user's own WordPress role still applies on top.
 * - HTTPS only; browser requests from other sites are refused (Origin
 *   check, per the MCP spec's DNS-rebinding guidance); request body capped.
 * - Brute force: 10 bad tokens in an hour block that address for an hour.
 *   Valid traffic is capped at 120 calls a minute.
 * - Every call is logged (time, tool, IP, result) for the owner to review.
 * - Optional IP allowlist.
 * ---------------------------------------------------------------------- */

const XFCC_VERSION = '1.0.0';
const XFCC_OPTION = 'xfcc_settings';
const XFCC_LOG = 'xfcc_log';
const XFCC_MAX_BODY = 1048576; // 1 MB

/** Tool groups the owner can switch on or off. Tool names come from the 100xFounder plugin. */
function xfcc_tool_groups() {
    return [
        'read' => ['label' => 'Read the site', 'help' => 'Overview, queue, categories, posts, launches, jobs, companies.', 'default' => 1,
            'tools' => ['site_overview', 'list_queue', 'list_categories', 'recent_posts', 'search_content', 'get_post', 'review_checklist', 'list_launches', 'list_jobs', 'list_companies']],
        'write' => ['label' => 'Write drafts', 'help' => 'Create and edit drafts, add to or skip queue items. Drafts land as Pending review.', 'default' => 1,
            'tools' => ['create_draft', 'update_draft', 'add_to_queue', 'skip_queue_item']],
        'media' => ['label' => 'Add images', 'help' => 'Download a credited image into the media library and set it as featured.', 'default' => 1,
            'tools' => ['set_featured_image']],
        'publish' => ['label' => 'Publish posts', 'help' => 'Make a post live. Also needs "Allow publishing through MCP" in 100xFounder → Settings and an Editor-level user.', 'default' => 0,
            'tools' => ['publish_post']],
        'admin' => ['label' => 'Run routines', 'help' => 'Imports, job sync and indexing submissions. Needs an Administrator-level user.', 'default' => 0,
            'tools' => ['run_routine', 'submit_all_for_indexing']],
    ];
}

function xfcc_settings() {
    $defaults = ['user_id' => 0, 'token_hash' => '', 'token_hint' => '', 'created' => 0, 'expires' => 0, 'last_used' => 0, 'groups' => [], 'ips' => '', 'enabled' => 1];
    foreach (xfcc_tool_groups() as $k => $g) {
        $defaults['groups'][$k] = $g['default'];
    }
    $s = get_option(XFCC_OPTION, []);
    return array_merge($defaults, is_array($s) ? $s : []);
}

function xfcc_save(array $s) {
    update_option(XFCC_OPTION, $s, false);
}

function xfcc_hash($token) {
    return hash_hmac('sha256', $token, wp_salt('auth') . '|xfcc');
}

function xfcc_client_ip() {
    return function_exists('xf_client_ip') ? xf_client_ip() : (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

/* ---- The endpoint ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf-claude/v1', '/mcp', [
        ['methods' => 'POST', 'callback' => 'xfcc_handle', 'permission_callback' => '__return_true'],
        ['methods' => ['GET', 'DELETE'], 'callback' => function () { return new WP_REST_Response(null, 405); }, 'permission_callback' => '__return_true'],
    ]);
}, 20);

// The old, broader endpoint is closed while this connector is active.
add_filter('rest_endpoints', function ($endpoints) {
    unset($endpoints['/xf/v1/mcp']);
    return $endpoints;
});

// A Bearer token must never be treated as a WordPress login anywhere else.
add_filter('application_password_is_api_request', function ($is) {
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '');
    return strpos($uri, '/xf-claude/v1/') !== false ? false : $is;
});

function xfcc_fail($status, $message, $log = true) {
    if ($log) {
        xfcc_log('-', $message, $status);
    }
    return new WP_REST_Response(['jsonrpc' => '2.0', 'id' => null, 'error' => ['code' => -32001, 'message' => $message]], $status, $status === 401 ? ['WWW-Authenticate' => 'Bearer realm="100xFounder"'] : []);
}

function xfcc_handle(WP_REST_Request $request) {
    $s = xfcc_settings();
    $ip = xfcc_client_ip();

    if (!is_ssl() && wp_get_environment_type() !== 'local') {
        return xfcc_fail(403, 'HTTPS required.');
    }
    if (empty($s['enabled']) || !$s['token_hash'] || !$s['user_id']) {
        return xfcc_fail(503, 'The Claude connection is switched off.');
    }
    // Browsers send Origin; Claude's MCP clients don't. Refuse cross-site browser calls.
    $origin = (string) $request->get_header('origin');
    if ($origin !== '' && untrailingslashit($origin) !== untrailingslashit(home_url())) {
        return xfcc_fail(403, 'Origin not allowed.');
    }
    $allow = array_filter(array_map('trim', preg_split('/[\s,]+/', (string) $s['ips'])));
    if ($allow && !array_filter($allow, function ($a) use ($ip) { return $a !== '' && strpos($ip, $a) !== false; })) {
        return xfcc_fail(403, 'This address is not on the allowlist.');
    }
    $lock_key = 'xfcc_bad_' . md5($ip);
    if ((int) get_transient($lock_key) >= 10) {
        return xfcc_fail(429, 'Too many failed attempts. Try again later.', false);
    }

    $auth = (string) $request->get_header('authorization');
    $token = preg_match('/^Bearer\s+(xfcc_[A-Za-z0-9_-]{40,})$/', trim($auth), $m) ? $m[1] : '';
    if ($token === '' || !hash_equals((string) $s['token_hash'], xfcc_hash($token))) {
        set_transient($lock_key, (int) get_transient($lock_key) + 1, HOUR_IN_SECONDS);
        return xfcc_fail(401, 'Invalid or missing connection token.');
    }
    if ($s['expires'] && time() > (int) $s['expires']) {
        return xfcc_fail(401, 'The connection token has expired. Create a new one in Settings → Claude connector.');
    }
    $rate_key = 'xfcc_rate_' . gmdate('YmdHi');
    $calls = (int) get_transient($rate_key);
    if ($calls >= 120) {
        return xfcc_fail(429, 'Rate limit: 120 calls a minute.', false);
    }
    set_transient($rate_key, $calls + 1, 2 * MINUTE_IN_SECONDS);

    $body = $request->get_body();
    if (strlen($body) > XFCC_MAX_BODY) {
        return xfcc_fail(413, 'Request too large.');
    }
    $user = get_userdata((int) $s['user_id']);
    if (!$user || !user_can($user, 'edit_posts')) {
        return xfcc_fail(503, 'The connected WordPress user no longer exists or cannot edit posts.');
    }
    if (!function_exists('xf_mcp_tools')) {
        return xfcc_fail(503, 'The 100xFounder plugin is not active.');
    }

    // Act as the bound user for this request only. No cookie, no session.
    wp_set_current_user($user->ID);
    $s['last_used'] = time();
    xfcc_save($s);

    $msg = json_decode($body, true, 32);
    if (!is_array($msg)) {
        return new WP_REST_Response(['jsonrpc' => '2.0', 'id' => null, 'error' => ['code' => -32700, 'message' => 'Parse error']], 400);
    }
    if (isset($msg[0])) {
        $out = array_values(array_filter(array_map('xfcc_dispatch', array_slice($msg, 0, 20))));
        return $out ? new WP_REST_Response($out, 200) : new WP_REST_Response(null, 202);
    }
    $reply = xfcc_dispatch($msg);
    return $reply === null ? new WP_REST_Response(null, 202) : new WP_REST_Response($reply, 200);
}

/** The tools this connection may use: enabled groups, and only ones the 100xFounder plugin offers. */
function xfcc_allowed_tools() {
    $s = xfcc_settings();
    $names = [];
    foreach (xfcc_tool_groups() as $k => $g) {
        if (!empty($s['groups'][$k])) {
            $names = array_merge($names, $g['tools']);
        }
    }
    return array_intersect_key(xf_mcp_tools(), array_flip($names));
}

function xfcc_dispatch($msg) {
    if (!is_array($msg) || ($msg['jsonrpc'] ?? '') !== '2.0' || empty($msg['method']) || !is_string($msg['method'])) {
        return ['jsonrpc' => '2.0', 'id' => null, 'error' => ['code' => -32600, 'message' => 'Invalid request']];
    }
    if (!array_key_exists('id', $msg)) {
        return null; // Notifications.
    }
    $id = $msg['id'];
    $params = is_array($msg['params'] ?? null) ? $msg['params'] : [];
    switch ($msg['method']) {
        case 'initialize':
            xfcc_log('initialize', 'ok', 200, (string) ($params['clientInfo']['name'] ?? ''));
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => [
                'protocolVersion' => is_string($params['protocolVersion'] ?? null) ? $params['protocolVersion'] : '2025-06-18',
                'capabilities' => ['tools' => ['listChanged' => false]],
                'serverInfo' => ['name' => '100xfounder', 'title' => '100xFounder (private Claude connection)', 'version' => XFCC_VERSION],
                'instructions' => function_exists('xf_mcp_instructions') ? xf_mcp_instructions() : '',
            ]];
        case 'ping':
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => new stdClass()];
        case 'tools/list':
            $tools = [];
            foreach (xfcc_allowed_tools() as $name => $t) {
                $tools[] = ['name' => $name, 'description' => $t['description'], 'inputSchema' => $t['schema']];
            }
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['tools' => $tools]];
        case 'tools/call':
            $name = (string) ($params['name'] ?? '');
            $tools = xfcc_allowed_tools();
            if (!isset($tools[$name])) {
                xfcc_log($name, 'not allowed', 403);
                return ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => -32602, 'message' => 'Tool not available on this connection: ' . $name]];
            }
            try {
                $result = call_user_func($tools[$name]['run'], is_array($params['arguments'] ?? null) ? $params['arguments'] : []);
            } catch (Throwable $e) {
                $result = new WP_Error('xfcc', 'The tool failed.'); // Never leak internals.
            }
            if (is_wp_error($result)) {
                xfcc_log($name, $result->get_error_message(), 400);
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['isError' => true, 'content' => [['type' => 'text', 'text' => $result->get_error_message()]]]];
            }
            xfcc_log($name, 'ok', 200);
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => [
                'content' => [['type' => 'text', 'text' => wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]],
                'structuredContent' => is_array($result) && !isset($result[0]) ? $result : ['items' => $result],
            ]];
        default:
            return ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => -32601, 'message' => 'Method not found']];
    }
}

/* ---- Audit log (last 300 events) ---- */

function xfcc_log($tool, $result, $status, $client = '') {
    $log = get_option(XFCC_LOG, []);
    $log = is_array($log) ? $log : [];
    array_unshift($log, ['t' => time(), 'tool' => mb_substr((string) $tool, 0, 60), 'result' => mb_substr((string) $result, 0, 160), 'status' => (int) $status, 'ip' => xfcc_client_ip(), 'client' => mb_substr($client, 0, 60)]);
    update_option(XFCC_LOG, array_slice($log, 0, 300), false);
}

/* ---- Admin: Settings → Claude connector ---- */

add_action('admin_menu', function () {
    add_options_page('Claude connector', 'Claude connector', 'manage_options', 'xfcc', 'xfcc_admin_page');
});

add_action('admin_post_xfcc', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xfcc')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $s = xfcc_settings();
    $do = sanitize_key(wp_unslash($_POST['do'] ?? ''));
    $notice = '';
    if ($do === 'save') {
        $uid = absint($_POST['user_id'] ?? 0);
        $s['user_id'] = ($uid && user_can($uid, 'edit_posts')) ? $uid : $s['user_id'];
        foreach (array_keys(xfcc_tool_groups()) as $k) {
            $s['groups'][$k] = empty($_POST['groups'][$k]) ? 0 : 1;
        }
        $s['ips'] = sanitize_textarea_field(wp_unslash($_POST['ips'] ?? ''));
        $s['enabled'] = empty($_POST['enabled']) ? 0 : 1;
        $notice = 'Saved.';
    } elseif ($do === 'rotate') {
        if (!$s['user_id']) {
            $notice = 'Choose the WordPress user first and save.';
        } else {
            $token = 'xfcc_' . rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
            $days = max(1, min(365, absint($_POST['days'] ?? 90)));
            $s['token_hash'] = xfcc_hash($token);
            $s['token_hint'] = substr($token, -4);
            $s['created'] = time();
            $s['expires'] = time() + $days * DAY_IN_SECONDS;
            // Shown once, to this admin only, then gone.
            set_transient('xfcc_new_' . get_current_user_id(), $token, 5 * MINUTE_IN_SECONDS);
            xfcc_log('token', 'new token created (old one revoked)', 200);
            $notice = 'New token created. The old one stopped working.';
        }
    } elseif ($do === 'revoke') {
        $s['token_hash'] = '';
        $s['token_hint'] = '';
        xfcc_log('token', 'token revoked', 200);
        $notice = 'Token revoked. Nothing can connect until you create a new one.';
    }
    xfcc_save($s);
    wp_safe_redirect(add_query_arg(['page' => 'xfcc', 'msg' => rawurlencode($notice)], admin_url('options-general.php')));
    exit;
});

function xfcc_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $s = xfcc_settings();
    $new = get_transient('xfcc_new_' . get_current_user_id());
    if ($new) {
        delete_transient('xfcc_new_' . get_current_user_id());
    }
    $users = get_users(['capability' => 'edit_posts', 'fields' => ['ID', 'user_login', 'display_name']]);
    $url = rest_url('xf-claude/v1/mcp');
    $log = array_slice((array) get_option(XFCC_LOG, []), 0, 50);
    ?>
    <div class="wrap">
        <h1>Claude connector</h1>
        <p>A private MCP connection for your Claude account. Claude connects to <code><?php echo esc_html($url); ?></code> with the token below. Nothing else can use this endpoint.</p>
        <?php if (!empty($_GET['msg'])) : ?><div class="notice notice-success"><p><?php echo esc_html(sanitize_text_field(wp_unslash($_GET['msg']))); ?></p></div><?php endif; ?>
        <?php if ($new) : ?>
            <div class="notice notice-warning"><p><strong>Copy this token now. It won't be shown again.</strong></p>
                <p><input type="text" readonly class="large-text code" value="<?php echo esc_attr($new); ?>" onclick="this.select()"></p>
                <p>Put it in Claude's environment as <code>XF_MCP_TOKEN</code> (never in a file in the repo, never in chat).</p></div>
        <?php endif; ?>

        <h2>Status</h2>
        <table class="widefat striped" style="max-width:760px"><tbody>
            <tr><td>Connection</td><td><?php echo $s['enabled'] && $s['token_hash'] ? '<strong style="color:#1a7f37">On</strong>' : '<strong style="color:#b32d2e">Off</strong>'; ?></td></tr>
            <tr><td>Token</td><td><?php echo $s['token_hash'] ? esc_html('…' . $s['token_hint'] . ' · created ' . wp_date('j M Y', $s['created']) . ' · expires ' . wp_date('j M Y', $s['expires'])) : 'None'; ?></td></tr>
            <tr><td>Last used</td><td><?php echo $s['last_used'] ? esc_html(human_time_diff($s['last_used']) . ' ago') : 'Never'; ?></td></tr>
        </tbody></table>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:20px">
            <input type="hidden" name="action" value="xfcc"><?php wp_nonce_field('xfcc'); ?>
            <h2>Settings</h2>
            <table class="form-table"><tbody>
                <tr><th>Connection on</th><td><label><input type="checkbox" name="enabled" value="1" <?php checked($s['enabled']); ?>> Allow Claude to connect</label><p class="description">Untick for an instant kill switch.</p></td></tr>
                <tr><th>Acts as WordPress user</th><td><select name="user_id"><option value="0">Choose…</option>
                    <?php foreach ($users as $u) : ?><option value="<?php echo (int) $u->ID; ?>" <?php selected((int) $s['user_id'], (int) $u->ID); ?>><?php echo esc_html($u->display_name . ' (' . $u->user_login . ')'); ?></option><?php endforeach; ?>
                </select><p class="description">Use a dedicated user (e.g. <code>claude</code>) with the <strong>Author</strong> role. Its role limits what Claude can do on top of the switches below.</p></td></tr>
                <tr><th>Allowed tools</th><td>
                    <?php foreach (xfcc_tool_groups() as $k => $g) : ?>
                        <p><label><input type="checkbox" name="groups[<?php echo esc_attr($k); ?>]" value="1" <?php checked(!empty($s['groups'][$k])); ?>> <strong><?php echo esc_html($g['label']); ?></strong></label><br><span class="description"><?php echo esc_html($g['help']); ?></span></p>
                    <?php endforeach; ?>
                </td></tr>
                <tr><th>IP allowlist (optional)</th><td><textarea name="ips" rows="3" class="large-text code" placeholder="Leave empty to allow any address (the token is still required)"><?php echo esc_textarea($s['ips']); ?></textarea><p class="description">One address or prefix per line. Claude's cloud addresses change, so only use this if you connect from fixed addresses.</p></td></tr>
            </tbody></table>
            <p><button class="button button-primary" name="do" value="save">Save settings</button></p>

            <h2>Token</h2>
            <p>Valid for <input type="number" name="days" value="90" min="1" max="365" style="width:70px"> days.
                <button class="button" name="do" value="rotate" onclick="return confirm('Create a new token? The current one stops working immediately.')"><?php echo $s['token_hash'] ? 'Rotate token' : 'Create token'; ?></button>
                <?php if ($s['token_hash']) : ?><button class="button button-link-delete" name="do" value="revoke" onclick="return confirm('Revoke the token? Claude will be disconnected.')">Revoke</button><?php endif; ?></p>
        </form>

        <h2>Activity (latest 50)</h2>
        <table class="widefat striped"><thead><tr><th>When</th><th>Tool</th><th>Result</th><th>Status</th><th>IP</th></tr></thead><tbody>
            <?php foreach ($log as $e) : ?><tr><td><?php echo esc_html(wp_date('j M H:i', $e['t'])); ?></td><td><?php echo esc_html($e['tool']); ?></td><td><?php echo esc_html($e['result']); ?></td><td><?php echo (int) $e['status']; ?></td><td><code><?php echo esc_html($e['ip']); ?></code></td></tr><?php endforeach; ?>
            <?php if (!$log) : ?><tr><td colspan="5">No activity yet.</td></tr><?php endif; ?>
        </tbody></table>
    </div>
    <?php
}

/* ---- Clean up on uninstall: no secrets left behind ---- */
register_uninstall_hook(__FILE__, 'xfcc_uninstall');
function xfcc_uninstall() {
    delete_option(XFCC_OPTION);
    delete_option(XFCC_LOG);
}
