<?php
/**
 * Claude access, the spend ledger and the budget guard.
 *
 * Budget rules (owner: hard total of $90):
 *  - Every call is written to the ledger BEFORE it is sent, as a reservation priced at the
 *    worst case (estimated input + the full max_tokens of output). The call is refused if that
 *    reservation does not fit in what is left of the budget.
 *  - When the reply arrives the reservation is replaced by the real cost from the usage block.
 *    If the provider reports no usage, the worst-case reservation stays as the cost.
 *  - If the request dies mid-call (timeout, PHP killed), the reservation stays on the books
 *    ("orphaned"), so a lost reply can never let spending creep past the budget.
 *  - API errors with an HTTP status (4xx/5xx) are not billed by Anthropic and are recorded at $0.
 *  - Work runs in WP-Cron ticks under a lock, one API call per unit of work, so two workers can
 *    never send the same unit and a timeout costs at most one call.
 *
 * Mock mode (setting "route" = mock, or define('XF_AI_MOCK', true)) never contacts any API. Its
 * spending is kept in the same ledger with route "mock" and is checked against the same budget,
 * so the guard can be tested locally; real spending ignores mock rows.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_AI_DB_VERSION = '1';
const XF_AI_MODELS = ['claude-haiku-5-5' => 'Claude Haiku 5.5 (cheapest, default)', 'claude-sonnet-5-5' => 'Claude Sonnet 5.5 (higher quality, ~20x the price)'];

function xf_ai_setting_defaults() {
    return [
        'route' => 'auto',
        'api_key' => '',
        'model' => 'claude-haiku-5-5',
        'budget_usd' => 90,
        // model|input $ per million tokens|output $ per million tokens (Anthropic list prices, 2026-10).
        // Haiku 5.5's price is for prompts up to 100K tokens; this module never sends prompts that large.
        'prices' => "claude-haiku-5-5|0.10|0.50\nclaude-sonnet-5-5|2.00|10.00\nclaude-opus-5-5|4.00|20.00",
        // A reply from a model not in the list is priced as the most expensive Claude model.
        'unknown_price' => '10|50',
        'languages' => implode("\n", [
            // URL folder | hreflang | native | name | og:locale. Country-style folders (/de-de/) by owner request, 2026-10-12.
            'de-de|de-DE|Deutsch|German|de_DE',
            'fr-fr|fr-FR|Français|French|fr_FR',
            'es-es|es-ES|Español|Spanish (Spain)|es_ES',
            'it-it|it-IT|Italiano|Italian|it_IT',
            'pt-pt|pt-PT|Português|Portuguese (Portugal)|pt_PT',
            'nl-nl|nl-NL|Nederlands|Dutch|nl_NL',
            'ja-jp|ja-JP|日本語|Japanese|ja_JP',
            'ko-kr|ko-KR|한국어|Korean|ko_KR',
            'sv-se|sv-SE|Svenska|Swedish|sv_SE',
            'nb-no|nb-NO|Norsk|Norwegian Bokmål|nb_NO',
        ]),
        'brand_terms' => "100xFounder\nIshaan Vardhan\nProduct Hunt\nY Combinator\nGoogle\nOpenAI\nAnthropic\nClaude\nChatGPT",
        'key_pages' => "about\neditorial-policy\ntools\nhome",
        'translate_types' => ['post', 'xf_guide'],
        'calls_per_tick' => 2,
        'chunk_chars' => 7000,
        'max_tokens' => 8000,
        'thin_words' => 400,
        'thin_types' => ['post', 'page', 'xf_guide'],
        'switcher' => 1,
        'paused' => 0,
    ];
}

function xf_ai_settings() {
    $saved = get_option('xf_ai_settings', []);
    $s = array_merge(xf_ai_setting_defaults(), is_array($saved) ? $saved : []);
    if (defined('XF_ANTHROPIC_API_KEY') && XF_ANTHROPIC_API_KEY !== '') {
        $s['api_key'] = XF_ANTHROPIC_API_KEY;
    }
    return $s;
}

function xf_ai_setting($key) {
    $s = xf_ai_settings();
    return $s[$key] ?? null;
}

function xf_ai_update_settings(array $values) {
    $saved = get_option('xf_ai_settings', []);
    update_option('xf_ai_settings', array_merge(is_array($saved) ? $saved : [], $values), false);
}

function xf_ai_is_mock() {
    return (defined('XF_AI_MOCK') && XF_AI_MOCK) || xf_ai_setting('route') === 'mock';
}

/* ---------------------------------------------------------------- Tables */

function xf_ai_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE " . xf_table('ai_ledger') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  item_id bigint(20) unsigned NOT NULL DEFAULT 0,
  purpose varchar(40) NOT NULL DEFAULT '',
  route varchar(20) NOT NULL DEFAULT '',
  model varchar(80) NOT NULL DEFAULT '',
  input_tokens int(10) unsigned NOT NULL DEFAULT 0,
  output_tokens int(10) unsigned NOT NULL DEFAULT 0,
  cost decimal(12,6) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'reserved',
  note varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY  (id),
  KEY status (status),
  KEY route (route)
) $charset;");
    dbDelta("CREATE TABLE " . xf_table('ai_items') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  kind varchar(20) NOT NULL,
  lang varchar(12) NOT NULL DEFAULT '',
  source_id bigint(20) unsigned NOT NULL,
  target_id bigint(20) unsigned NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'queued',
  step int(10) unsigned NOT NULL DEFAULT 0,
  steps int(10) unsigned NOT NULL DEFAULT 0,
  attempts int(10) unsigned NOT NULL DEFAULT 0,
  est_cost decimal(12,6) NOT NULL DEFAULT 0,
  cost decimal(12,6) NOT NULL DEFAULT 0,
  data longtext NULL,
  error text NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY status (status),
  KEY kind_lang (kind,lang),
  KEY source_id (source_id)
) $charset;");
    update_option('xf_ai_db_version', XF_AI_DB_VERSION);
}

add_action('plugins_loaded', function () {
    if (get_option('xf_ai_db_version') !== XF_AI_DB_VERSION) {
        xf_ai_install();
    }
}, 20);

/* ---------------------------------------------------------------- Prices and estimates */

/** [input $/MTok, output $/MTok] for a model id. Unknown models get the most expensive price. */
function xf_ai_price($model) {
    $model = strtolower((string) $model);
    $table = [];
    foreach (preg_split('/\R/', (string) xf_ai_setting('prices')) as $line) {
        $p = array_map('trim', explode('|', $line));
        // A zero or negative price would book calls as free (or as refunds) and defeat the budget.
        if (count($p) === 3 && $p[0] !== '' && is_numeric($p[1]) && is_numeric($p[2]) && (float) $p[1] > 0 && (float) $p[2] > 0) {
            $table[strtolower($p[0])] = [(float) $p[1], (float) $p[2]];
        }
    }
    if (isset($table[$model])) {
        return $table[$model];
    }
    foreach ($table as $id => $price) {
        // Dated or provider-prefixed ids, e.g. "anthropic/claude-haiku-5-5".
        if ($id !== '' && strpos($model, $id) !== false) {
            return $price;
        }
    }
    $u = array_map('floatval', explode('|', (string) xf_ai_setting('unknown_price') . '|'));
    return [max(10.0, $u[0]), max(50.0, $u[1])];
}

function xf_ai_cost($model, $input_tokens, $output_tokens) {
    [$in, $out] = xf_ai_price($model);
    return round(($input_tokens * $in + $output_tokens * $out) / 1000000, 6);
}

/**
 * Rough token count, deliberately on the high side: about 3 characters per token for
 * English/HTML, 1 per character for Japanese, Korean and Chinese.
 */
function xf_ai_tokens_est($text) {
    $text = (string) $text;
    $cjk = preg_match_all('/[\x{3040}-\x{30ff}\x{3400}-\x{9fff}\x{ac00}-\x{d7af}]/u', $text);
    $len = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
    return (int) ceil(($len - $cjk) / 3 + $cjk * 1.1);
}

/**
 * Output multiplier for estimates. The WP AI Client's Anthropic provider sends no thinking
 * setting, so Claude may think (billed as output) on that route: estimate 50% more output.
 */
function xf_ai_out_factor() {
    return xf_ai_route() === 'wp_ai_client' ? 1.5 : 1.0;
}

function xf_ai_money($usd) {
    return '$' . number_format((float) $usd, $usd > 0 && $usd < 0.1 ? 4 : 2);
}

/* ---------------------------------------------------------------- Ledger and budget */

function xf_ai_budget() {
    return max(0, (float) xf_ai_setting('budget_usd'));
}

/** Everything booked so far: final costs plus open and orphaned reservations. Mock and real are separate. */
function xf_ai_spent($mock = null) {
    global $wpdb;
    $mock = $mock === null ? xf_ai_is_mock() : $mock;
    $t = xf_table('ai_ledger');
    $sql = $mock ? "SELECT SUM(cost) FROM $t WHERE route = %s" : "SELECT SUM(cost) FROM $t WHERE route <> %s";
    return (float) $wpdb->get_var($wpdb->prepare($sql, 'mock')); // phpcs:ignore
}

function xf_ai_reserved($mock = null) {
    global $wpdb;
    $mock = $mock === null ? xf_ai_is_mock() : $mock;
    $t = xf_table('ai_ledger');
    $sql = $mock ? "SELECT SUM(cost) FROM $t WHERE status = 'reserved' AND route = %s" : "SELECT SUM(cost) FROM $t WHERE status = 'reserved' AND route <> %s";
    return (float) $wpdb->get_var($wpdb->prepare($sql, 'mock')); // phpcs:ignore
}

function xf_ai_remaining($mock = null) {
    return max(0, xf_ai_budget() - xf_ai_spent($mock));
}

/** Estimated cost still to come from queued and running work. */
function xf_ai_committed() {
    global $wpdb;
    $rows = $wpdb->get_results("SELECT est_cost, cost FROM " . xf_table('ai_items') . " WHERE status IN ('queued','running')"); // phpcs:ignore
    $sum = 0;
    foreach ($rows as $r) {
        $sum += max(0, (float) $r->est_cost - (float) $r->cost);
    }
    return $sum;
}

/** Can a new job of this estimated cost start? Leaves room for the work already queued. */
function xf_ai_can_afford($est) {
    return $est <= xf_ai_remaining() - xf_ai_committed();
}

/** Reservations left open by a request that died mid-call stay booked as "orphaned". */
function xf_ai_mark_orphans() {
    global $wpdb;
    $wpdb->query($wpdb->prepare("UPDATE " . xf_table('ai_ledger') . " SET status = 'orphaned', note = 'no reply recorded; worst-case cost kept' WHERE status = 'reserved' AND created_at < %s", gmdate('Y-m-d H:i:s', time() - 15 * MINUTE_IN_SECONDS))); // phpcs:ignore
}

/* ---------------------------------------------------------------- Routes */

function xf_ai_wp_client_available() {
    return function_exists('wp_ai_client_prompt') || class_exists('WordPress\\AI_Client\\AI_Client');
}

/** The route the next call will take: mock, wp_ai_client, direct, or '' when nothing is configured. */
function xf_ai_route() {
    if (xf_ai_is_mock()) {
        return 'mock';
    }
    $route = xf_ai_setting('route');
    $wp = xf_ai_wp_client_available();
    $key = (string) xf_ai_setting('api_key') !== '';
    if ($route === 'wp_ai_client') {
        return $wp ? 'wp_ai_client' : '';
    }
    if ($route === 'direct') {
        return $key ? 'direct' : '';
    }
    return $wp ? 'wp_ai_client' : ($key ? 'direct' : '');
}

/**
 * One Claude call, guarded by the budget.
 *
 * @param array $a system, user, max_tokens, item_id, purpose, mock (callable(string $user): string)
 * @return array|WP_Error ['text', 'model', 'input_tokens', 'output_tokens', 'cost', 'stop_reason', 'usage_known']
 */
function xf_ai_call(array $a) {
    global $wpdb;
    $route = xf_ai_route();
    if ($route === '') {
        return new WP_Error('xf_ai_config', 'Claude is not connected: activate the WordPress AI plugin with the Anthropic provider, or save an API key.');
    }
    if (xf_ai_setting('paused')) {
        return new WP_Error('xf_ai_paused', 'AI jobs are paused (AI content → Settings).');
    }
    $model = (string) xf_ai_setting('model');
    $system = (string) ($a['system'] ?? '');
    $user = (string) ($a['user'] ?? '');
    $max = max(256, min(16000, (int) ($a['max_tokens'] ?? xf_ai_setting('max_tokens'))));
    $est_in = (int) ceil((xf_ai_tokens_est($system) + xf_ai_tokens_est($user)) * 1.1) + 20;
    $reserve = xf_ai_cost($model, $est_in, $max);

    // Check and reserve under one lock: two workers (cron, the dashboard button, a connection
    // test) must never both see the same "remaining" and together book past the budget.
    if (!xf_mutex_acquire('ai_budget', 30, 10)) {
        return new WP_Error('xf_ai_budget', 'Budget check is busy with another call; try again in a moment.');
    }
    xf_ai_mark_orphans();
    $remaining = xf_ai_remaining($route === 'mock');
    if ($reserve <= 0 || $reserve > $remaining) {
        xf_mutex_release('ai_budget');
        return new WP_Error('xf_ai_budget', sprintf('Budget stop: this call could cost up to %s and only %s of the %s budget is left.', xf_ai_money($reserve), xf_ai_money($remaining), xf_ai_money(xf_ai_budget())));
    }

    $ledger = xf_table('ai_ledger');
    $wpdb->insert($ledger, [
        'created_at' => gmdate('Y-m-d H:i:s'), 'updated_at' => gmdate('Y-m-d H:i:s'),
        'item_id' => (int) ($a['item_id'] ?? 0), 'purpose' => substr((string) ($a['purpose'] ?? ''), 0, 40),
        'route' => $route, 'model' => $model, 'input_tokens' => $est_in, 'output_tokens' => $max,
        'cost' => $reserve, 'status' => 'reserved', 'note' => 'worst-case reservation',
    ]);
    $row = (int) $wpdb->insert_id;
    xf_mutex_release('ai_budget');
    if (!$row) {
        return new WP_Error('xf_ai_budget', 'Could not book the reservation in the ledger, so nothing was sent.');
    }

    if (function_exists('set_time_limit')) {
        @set_time_limit(300); // phpcs:ignore
    }
    if ($route === 'mock') {
        $res = xf_ai_call_mock($model, $system, $user, $a['mock'] ?? null);
    } elseif ($route === 'wp_ai_client') {
        $res = xf_ai_call_wp_client($model, $system, $user, $max);
    } else {
        $res = xf_ai_call_direct($model, $system, $user, $max);
    }

    if (is_wp_error($res)) {
        $billed = $res->get_error_data() === 'unknown'; // no HTTP reply: Anthropic may have run it
        $wpdb->update($ledger, [
            'updated_at' => gmdate('Y-m-d H:i:s'),
            'status' => $billed ? 'orphaned' : 'failed',
            'cost' => $billed ? $reserve : 0,
            'input_tokens' => $billed ? $est_in : 0, 'output_tokens' => $billed ? $max : 0,
            'note' => substr($res->get_error_message(), 0, 250),
        ], ['id' => $row]);
        return $res;
    }

    $used_model = $res['model'] ?: $model;
    if ($res['usage_known']) {
        $cost = max(0, xf_ai_cost($used_model, $res['input_tokens'], $res['output_tokens']));
        $status = 'final';
        $note = $res['stop_reason'];
    } else {
        $cost = max($reserve, xf_ai_cost($used_model, $est_in, $max));
        $res['input_tokens'] = $est_in;
        $res['output_tokens'] = $max;
        $status = 'estimated';
        $note = 'provider reported no usage; worst case booked';
    }
    $res['cost'] = $cost;
    $wpdb->update($ledger, [
        'updated_at' => gmdate('Y-m-d H:i:s'), 'model' => substr($used_model, 0, 80),
        'input_tokens' => (int) $res['input_tokens'], 'output_tokens' => (int) $res['output_tokens'],
        'cost' => $cost, 'status' => $status, 'note' => substr((string) $note, 0, 250),
    ], ['id' => $row]);

    if ($res['stop_reason'] === 'max_tokens') {
        return new WP_Error('xf_ai_truncated', 'The reply hit the output limit and was cut off; the unit will be retried.');
    }
    if ($res['stop_reason'] === 'refusal') {
        return new WP_Error('xf_ai_refusal', 'Claude declined this request.');
    }
    return $res;
}

/** Direct Messages API call with a key stored in the plugin settings. */
function xf_ai_call_direct($model, $system, $user, $max) {
    $body = [
        'model' => $model,
        'max_tokens' => $max,
        'system' => $system,
        'messages' => [['role' => 'user', 'content' => $user]],
        'output_config' => ['effort' => 'high'],
    ];
    // No extended thinking for translation and rewriting: it only adds billed output tokens.
    if (strpos($model, 'haiku-5-5') !== false) {
        $body['thinking'] = ['type' => 'disabled'];
    } elseif (strpos($model, 'sonnet-5-5') !== false) {
        $body['thinking'] = ['type' => 'between_tools'];
    }
    $r = wp_remote_post('https://api.anthropic.com/v1/messages', [
        'timeout' => 150,
        'headers' => [
            'x-api-key' => (string) xf_ai_setting('api_key'),
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ],
        'body' => wp_json_encode($body),
    ]);
    if (is_wp_error($r)) {
        return new WP_Error('xf_ai_http', 'No reply from the Anthropic API: ' . $r->get_error_message(), 'unknown');
    }
    $code = (int) wp_remote_retrieve_response_code($r);
    $json = json_decode((string) wp_remote_retrieve_body($r), true);
    if ($code !== 200 || !is_array($json)) {
        $msg = is_array($json) && isset($json['error']['message']) ? $json['error']['message'] : 'HTTP ' . $code;
        return new WP_Error('xf_ai_api', 'Anthropic API error (' . $code . '): ' . $msg, 'not_billed');
    }
    $text = '';
    foreach ((array) ($json['content'] ?? []) as $block) {
        if (($block['type'] ?? '') === 'text') {
            $text .= $block['text'];
        }
    }
    $u = (array) ($json['usage'] ?? []);
    return [
        'text' => $text,
        'model' => (string) ($json['model'] ?? $model),
        'input_tokens' => (int) ($u['input_tokens'] ?? 0) + (int) ($u['cache_creation_input_tokens'] ?? 0) + (int) ($u['cache_read_input_tokens'] ?? 0),
        'output_tokens' => (int) ($u['output_tokens'] ?? 0),
        'usage_known' => isset($u['input_tokens'], $u['output_tokens']),
        'stop_reason' => (string) ($json['stop_reason'] ?? ''),
    ];
}

/**
 * Call through the WordPress AI Client (WordPress "AI" plugin + "AI Provider for Anthropic"),
 * so the key stays in that plugin. The builder API is probed defensively: methods that a given
 * version lacks are skipped, and a reply without token usage is booked at the worst case.
 */
function xf_ai_call_wp_client($model, $system, $user, $max) {
    try {
        if (function_exists('wp_ai_client_prompt')) {
            $b = wp_ai_client_prompt($user);
        } else {
            $b = call_user_func(['WordPress\\AI_Client\\AI_Client', 'prompt'], $user);
        }
        foreach ([
            'using_system_instruction' => [$system],
            'using_max_tokens' => [$max],
            'using_model_preference' => [['anthropic', $model]],
        ] as $method => $args) {
            if (is_callable([$b, $method])) {
                $next = call_user_func_array([$b, $method], $args);
                $b = is_object($next) ? $next : $b;
            }
        }
        if (is_callable([$b, 'generate_text_result'])) {
            $result = $b->generate_text_result();
        } elseif (is_callable([$b, 'generateTextResult'])) {
            $result = $b->generateTextResult();
        } else {
            $result = is_callable([$b, 'generate_text']) ? $b->generate_text() : new WP_Error('xf_ai_wp', 'The WP AI Client has no text generation method.');
        }
    } catch (Throwable $e) {
        return new WP_Error('xf_ai_wp', 'WP AI Client error: ' . $e->getMessage(), 'unknown');
    }
    if (is_wp_error($result)) {
        return new WP_Error('xf_ai_wp', 'WP AI Client error: ' . $result->get_error_message(), 'unknown');
    }
    return xf_ai_parse_wp_result($result);
}

/** Text, usage, model and finish reason from a WP AI Client result (or a plain string). */
function xf_ai_parse_wp_result($result) {
    $out = ['text' => '', 'model' => '', 'input_tokens' => 0, 'output_tokens' => 0, 'usage_known' => false, 'stop_reason' => ''];
    if (is_string($result)) {
        $out['text'] = $result;
        return $out;
    }
    $call = function ($obj, array $names) {
        foreach ($names as $n) {
            if (is_object($obj) && is_callable([$obj, $n])) {
                try {
                    return $obj->$n();
                } catch (Throwable $e) {
                    return null;
                }
            }
        }
        return null;
    };
    $out['text'] = (string) $call($result, ['toText', 'to_text', 'get_text']);
    $usage = $call($result, ['getTokenUsage', 'get_token_usage']);
    $in = $call($usage, ['getPromptTokens', 'get_prompt_tokens']);
    $o = $call($usage, ['getCompletionTokens', 'get_completion_tokens']);
    if (is_numeric($in) && is_numeric($o)) {
        $out['input_tokens'] = (int) $in;
        $out['output_tokens'] = (int) $o;
        $out['usage_known'] = true;
    }
    $meta = $call($result, ['getModelMetadata', 'get_model_metadata']);
    $out['model'] = (string) $call($meta, ['getId', 'get_id']);
    $cand = $call($result, ['getCandidates', 'get_candidates']);
    if (is_array($cand) && $cand) {
        $finish = $call($cand[0], ['getFinishReason', 'get_finish_reason']);
        $value = '';
        if (is_object($finish)) {
            try {
                $value = (string) $finish->value; // AbstractEnum exposes ->value through __get.
            } catch (Throwable $e) {
                $value = '';
            }
        } elseif (is_scalar($finish)) {
            $value = (string) $finish;
        }
        $map = ['length' => 'max_tokens', 'max_tokens' => 'max_tokens', 'content_filter' => 'refusal'];
        $out['stop_reason'] = $map[$value] ?? $value;
    }
    return $out;
}

/** Local testing: no network, deterministic text, plausible usage numbers. */
function xf_ai_call_mock($model, $system, $user, $mock) {
    $text = is_callable($mock) ? (string) call_user_func($mock, $user) : 'OK';
    return [
        'text' => $text,
        'model' => $model,
        'input_tokens' => xf_ai_tokens_est($system) + xf_ai_tokens_est($user),
        'output_tokens' => xf_ai_tokens_est($text),
        'usage_known' => true,
        'stop_reason' => 'end_turn',
    ];
}

/* ---------------------------------------------------------------- Placeholders (links, sources, markup) */

/**
 * Swaps everything that must survive word for word (link targets, image sources, block
 * comments, shortcodes, scripts) for {{Xn}} tokens before text goes to Claude. Restoring them
 * afterwards guarantees every source link and URL is byte-identical to the original.
 */
function xf_ai_protect($html) {
    $map = [];
    $n = 0;
    $swap = function ($m) use (&$map, &$n) {
        $key = '{{X' . (++$n) . '}}';
        $map[$key] = $m[0];
        return $key;
    };
    $html = preg_replace_callback('#<(script|style|pre|code)\b.*?</\1>#is', $swap, (string) $html);
    $html = preg_replace_callback('#<!--.*?-->#s', $swap, $html);
    $html = preg_replace_callback('#\[/?[a-z_][a-z0-9_-]*(?:\s[^\]]*)?\]#i', $swap, $html);
    $html = preg_replace_callback('#\s(?:href|src|srcset|data-[a-z-]+|class|id|style|rel|target|width|height)\s*=\s*("[^"]*"|\'[^\']*\')#i', $swap, $html);
    $html = preg_replace_callback('#https?://[^\s<>"\']+#i', $swap, $html);
    return [$html, $map];
}

/** Puts the protected pieces back. Returns WP_Error when Claude dropped or duplicated one. */
function xf_ai_restore($text, array $map) {
    foreach ($map as $key => $original) {
        if (substr_count($text, $key) !== 1) {
            return new WP_Error('xf_ai_placeholder', 'A protected link or markup token (' . $key . ') was lost or duplicated.');
        }
    }
    return strtr($text, $map);
}

/** Strips code fences and stray prose around a reply. */
function xf_ai_clean_reply($text) {
    $text = trim((string) $text);
    if (preg_match('/^```[a-z]*\s*\n(.*)\n```$/s', $text, $m)) {
        $text = trim($m[1]);
    }
    return $text;
}

/**
 * Makes Claude's HTML safe to save, before the protected pieces go back in.
 *
 * The page text it was given can carry instructions ("add a link to …", a fake
 * <script>), so the reply is treated as untrusted. Every link target, image
 * source and script of the original travels as a {{Xn}} token and is restored
 * untouched afterwards, so the reply itself never needs a URL, an href/src or
 * active markup. If it has more of those than the text it was given, it is
 * rejected; then it goes through wp_kses_post (with attribute tokens carried
 * through as data-xfph-N so they survive), which drops anything else unsafe even
 * when the worker runs as an administrator with unfiltered_html.
 *
 * @param string $reply  Claude's reply, tokens still in place.
 * @param string $source The protected text that was sent.
 * @return string|WP_Error
 */
function xf_ai_safe_html($reply, $source) {
    $risky = [
        'markup' => '#<\s*/?\s*(?:script|style|iframe|frame|frameset|object|embed|applet|form|input|button|textarea|select|option|link|meta|base|svg|math|template|noscript)\b#i',
        'link or source attribute' => '#[\s"\'/](?:href|src|srcset|action|formaction|poster|background|xlink:href|data|ping|style)\s*=#i',
        'event handler' => '#[\s"\'/]on[a-z]+\s*=#i',
        'script URL' => '#(?:java|vb)script\s*:|data\s*:\s*[a-z]+/#i',
        'URL' => '#(?:https?:)?//[a-z0-9.-]+\.[a-z]{2,}|\bwww\.[a-z0-9-]+\.[a-z]{2,}#i',
    ];
    foreach ($risky as $what => $re) {
        if (preg_match_all($re, $reply) > preg_match_all($re, $source)) {
            return new WP_Error('xf_ai_unsafe', 'The reply added a ' . $what . ' that was not in the original, so it was not saved.');
        }
    }
    // Attribute tokens (<a{{X3}}>) would be dropped by kses as unknown attributes: carry them as data-xfph-N.
    $html = preg_replace_callback('#<[a-z][a-z0-9]*\b[^<>]*>#i', function ($m) {
        return preg_replace('/\{\{X(\d+)\}\}/', ' data-xfph-$1="1"', $m[0]);
    }, (string) $reply);
    $html = wp_kses_post($html);
    return preg_replace('/\s?data-xfph-(\d+)="1"/', '{{X$1}}', $html);
}

/* ---------------------------------------------------------------- Work queue */

function xf_ai_item($id) {
    global $wpdb;
    return $wpdb->get_row($wpdb->prepare("SELECT * FROM " . xf_table('ai_items') . " WHERE id = %d", $id)); // phpcs:ignore
}

function xf_ai_item_update($id, array $fields) {
    global $wpdb;
    $fields['updated_at'] = gmdate('Y-m-d H:i:s');
    if (isset($fields['data']) && is_array($fields['data'])) {
        $fields['data'] = wp_json_encode($fields['data']);
    }
    $wpdb->update(xf_table('ai_items'), $fields, ['id' => (int) $id]);
}

function xf_ai_item_add($kind, $source_id, $lang, $est_cost) {
    global $wpdb;
    $wpdb->insert(xf_table('ai_items'), [
        'kind' => $kind, 'lang' => $lang, 'source_id' => (int) $source_id, 'status' => 'queued',
        'est_cost' => round((float) $est_cost, 6), 'data' => '', 'error' => '',
        'created_at' => gmdate('Y-m-d H:i:s'), 'updated_at' => gmdate('Y-m-d H:i:s'),
    ]);
    xf_ai_schedule();
    return (int) $wpdb->insert_id;
}

/** Adds the cost of a finished call to its item. */
function xf_ai_item_charge($item_id, $cost) {
    global $wpdb;
    $wpdb->query($wpdb->prepare("UPDATE " . xf_table('ai_items') . " SET cost = cost + %f WHERE id = %d", (float) $cost, (int) $item_id)); // phpcs:ignore
}

/**
 * Records a failed unit. Three failures in a row stop the item; a budget stop or a pause
 * leaves it queued and ends the tick.
 */
function xf_ai_item_fail($item, WP_Error $err) {
    if (in_array($err->get_error_code(), ['xf_ai_budget', 'xf_ai_paused', 'xf_ai_config'], true)) {
        xf_ai_item_update($item->id, ['error' => $err->get_error_message()]);
        return 'stop';
    }
    $attempts = (int) $item->attempts + 1;
    xf_ai_item_update($item->id, ['attempts' => $attempts, 'error' => $err->get_error_message(), 'status' => $attempts >= 3 ? 'error' : 'running']);
    return 'next';
}

/** Whether a failed call actually reached the API (a budget stop, pause or missing setup sends nothing). */
function xf_ai_was_sent(WP_Error $err) {
    return !in_array($err->get_error_code(), ['xf_ai_budget', 'xf_ai_paused', 'xf_ai_config'], true);
}

function xf_ai_pending_count() {
    global $wpdb;
    return (int) $wpdb->get_var("SELECT COUNT(*) FROM " . xf_table('ai_items') . " WHERE status IN ('queued','running')"); // phpcs:ignore
}

add_filter('cron_schedules', function ($s) {
    $s['xf_ai_5min'] = ['interval' => 5 * MINUTE_IN_SECONDS, 'display' => 'Every 5 minutes (100xFounder AI)'];
    return $s;
});

function xf_ai_schedule() {
    if (!wp_next_scheduled('xf_ai_tick')) {
        wp_schedule_event(time() + 30, 'xf_ai_5min', 'xf_ai_tick');
    }
}

add_action('xf_ai_tick', function () {
    xf_ai_run_tick();
    if (!xf_ai_pending_count()) {
        wp_clear_scheduled_hook('xf_ai_tick');
    }
});

/**
 * One small batch: at most `calls_per_tick` API calls and about 25 seconds, under a lock so
 * two ticks (WP-Cron, the dashboard button) never work on the same unit at once.
 *
 * @return array ['calls' => int, 'message' => string]
 */
function xf_ai_run_tick($max_calls = null) {
    if (xf_ai_setting('paused')) {
        return ['calls' => 0, 'message' => 'AI jobs are paused.'];
    }
    if (!xf_mutex_acquire('ai_tick', 10 * MINUTE_IN_SECONDS)) {
        return ['calls' => 0, 'message' => 'Another batch is running; try again in a minute.'];
    }
    global $wpdb;
    $max_calls = $max_calls ?: max(1, (int) xf_ai_setting('calls_per_tick'));
    $start = microtime(true);
    $calls = 0;
    $message = '';
    try {
        while ($calls < $max_calls && microtime(true) - $start < 25) {
            $item = $wpdb->get_row("SELECT * FROM " . xf_table('ai_items') . " WHERE status IN ('queued','running') ORDER BY (status = 'running') DESC, id ASC LIMIT 1"); // phpcs:ignore
            if (!$item) {
                $message = $message ?: 'Queue is empty.';
                break;
            }
            $fn = 'xf_ai_step_' . $item->kind;
            if (!function_exists($fn)) {
                xf_ai_item_update($item->id, ['status' => 'error', 'error' => 'Unknown job type.']);
                continue;
            }
            $r = call_user_func($fn, $item);
            $calls += (int) ($r['calls'] ?? 0);
            if (($r['result'] ?? '') === 'stop') {
                $message = $r['message'] ?? 'Stopped.';
                break;
            }
            if (empty($r['calls']) && ($r['result'] ?? '') !== 'continue') {
                // Nothing was sent and nothing changed: avoid spinning.
                break;
            }
        }
    } finally {
        xf_mutex_release('ai_tick');
    }
    return ['calls' => $calls, 'message' => $message ?: sprintf('%d call(s) sent.', $calls)];
}

/** Runs one specific item right away (dashboard button), under the same lock as the ticks. */
function xf_ai_run_item($id) {
    if (!xf_mutex_acquire('ai_tick', 10 * MINUTE_IN_SECONDS)) {
        return false;
    }
    try {
        $item = xf_ai_item($id);
        if ($item && in_array($item->status, ['queued', 'running'], true) && function_exists('xf_ai_step_' . $item->kind)) {
            call_user_func('xf_ai_step_' . $item->kind, $item);
        }
    } finally {
        xf_mutex_release('ai_tick');
    }
    return true;
}

/** Marks a unit as in flight before its call; finding the mark later means the call died. */
function xf_ai_begin_unit($item, array &$data, $unit) {
    if (isset($data['inflight']) && $data['inflight'] !== null) {
        // The previous worker died during a call. Count it as a failed attempt.
        $attempts = (int) $item->attempts + 1;
        $data['inflight'] = null;
        if ($attempts >= 3) {
            xf_ai_item_update($item->id, ['status' => 'error', 'attempts' => $attempts, 'data' => $data, 'error' => 'A call died mid-request three times.']);
            return false;
        }
        $item->attempts = $attempts;
        xf_ai_item_update($item->id, ['attempts' => $attempts]);
    }
    $data['inflight'] = $unit;
    xf_ai_item_update($item->id, ['status' => 'running', 'data' => $data]);
    return true;
}

/** Connection test: one tiny call (a fraction of a cent), still through the budget guard. */
function xf_ai_test_connection() {
    $r = xf_ai_call([
        'system' => 'You are a connectivity check.',
        'user' => 'Reply with the single word OK.',
        'max_tokens' => 256,
        'purpose' => 'test',
        'mock' => function () {
            return 'OK';
        },
    ]);
    if (is_wp_error($r)) {
        return $r->get_error_message();
    }
    return sprintf('Connected through %s. Model %s replied "%s" for %s.', xf_ai_route(), $r['model'], wp_html_excerpt($r['text'], 40), xf_ai_money($r['cost']));
}
