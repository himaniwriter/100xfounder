<?php
/**
 * 100xFounder → AI content: API status, budget, language jobs and thin pages.
 * Every action posts to admin-post.php?action=xf_ai with its own nonce and needs manage_options.
 */
if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', function () {
    add_submenu_page('xf', 'AI content', 'AI content', 'manage_options', 'xf-ai', 'xf_ai_admin_page');
}, 20);

function xf_ai_admin_url(array $args = []) {
    return add_query_arg($args, admin_url('admin.php?page=xf-ai'));
}

/** A one-button form for an action. */
function xf_ai_button($do, $label, array $fields = [], $class = 'button', $confirm = '') {
    $html = '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block;margin:0 4px 4px 0"'
        . ($confirm ? ' onsubmit="return confirm(\'' . esc_js($confirm) . '\')"' : '') . '>';
    $html .= '<input type="hidden" name="action" value="xf_ai"><input type="hidden" name="do" value="' . esc_attr($do) . '">';
    $html .= wp_nonce_field('xf_ai_' . $do, '_wpnonce', true, false);
    foreach ($fields as $k => $v) {
        $html .= '<input type="hidden" name="' . esc_attr($k) . '" value="' . esc_attr($v) . '">';
    }
    return $html . '<button type="submit" class="' . esc_attr($class) . '">' . esc_html($label) . '</button></form>';
}

function xf_ai_status_row($ok, $label, $fix = '') {
    printf('<li>%s %s%s</li>', $ok ? '<span style="color:#16a34a">&#10004;</span>' : '<span style="color:#d97706">&#10006;</span>', esc_html($label), !$ok && $fix ? ' <span class="description">(' . esc_html($fix) . ')</span>' : '');
}

function xf_ai_notice($msg, $ok = true) {
    set_transient('xf_ai_notice_' . get_current_user_id(), [$msg, $ok], 120);
}

/* ---------------------------------------------------------------- Actions */

function xf_ai_handle_action() {
    $do = isset($_REQUEST['do']) ? sanitize_key(wp_unslash($_REQUEST['do'])) : '';
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ai_' . $do)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $lang = isset($_POST['lang']) ? sanitize_key(wp_unslash($_POST['lang'])) : '';
    $id = isset($_REQUEST['id']) ? absint($_REQUEST['id']) : 0;
    $back = xf_ai_admin_url();
    global $wpdb;

    switch ($do) {
        case 'save_settings':
            $in = wp_unslash($_POST);
            $vals = [
                'route' => in_array($in['route'] ?? '', ['auto', 'wp_ai_client', 'direct', 'mock'], true) ? $in['route'] : 'auto',
                'model' => isset(XF_AI_MODELS[$in['model'] ?? '']) ? $in['model'] : 'claude-haiku-5-5',
                'budget_usd' => max(0, min(100000, (float) ($in['budget_usd'] ?? 90))),
                'prices' => sanitize_textarea_field($in['prices'] ?? ''),
                'languages' => sanitize_textarea_field($in['languages'] ?? ''),
                'brand_terms' => sanitize_textarea_field($in['brand_terms'] ?? ''),
                'key_pages' => sanitize_textarea_field($in['key_pages'] ?? ''),
                'translate_types' => array_values(array_intersect((array) ($in['translate_types'] ?? []), ['post', 'xf_guide'])),
                'thin_types' => array_values(array_intersect((array) ($in['thin_types'] ?? []), XF_AI_THIN_TYPES)),
                'thin_words' => max(100, min(3000, (int) ($in['thin_words'] ?? 400))),
                'calls_per_tick' => max(1, min(10, (int) ($in['calls_per_tick'] ?? 2))),
                'chunk_chars' => max(2000, min(20000, (int) ($in['chunk_chars'] ?? 7000))),
                'max_tokens' => max(1024, min(16000, (int) ($in['max_tokens'] ?? 8000))),
                'switcher' => empty($in['switcher']) ? 0 : 1,
                'paused' => empty($in['paused']) ? 0 : 1,
            ];
            // The key is write-only: an empty field keeps the saved key.
            $key = trim((string) ($in['api_key'] ?? ''));
            if (!empty($in['remove_key'])) {
                $vals['api_key'] = '';
            } elseif ($key !== '') {
                $vals['api_key'] = sanitize_text_field($key);
            }
            xf_ai_update_settings($vals);
            delete_transient('xf_ai_thin_pages');
            xf_ai_notice('Settings saved.');
            $back = xf_ai_admin_url(['tab' => 'settings']);
            break;
        case 'test':
            xf_ai_notice(xf_ai_test_connection());
            break;
        case 'queue_lang':
            $limit = isset($_POST['limit']) ? absint($_POST['limit']) : 0;
            $r = xf_ai_queue_language($lang, $limit, !empty($_POST['stale']));
            xf_ai_notice(is_wp_error($r) ? $r->get_error_message() : sprintf('Queued %d page(s) for %s, estimated %s. They run in small batches every few minutes.', $r['items'], strtoupper($lang), xf_ai_money($r['estimate'])), !is_wp_error($r));
            break;
        case 'approve':
            xf_ai_set_language_approval($lang, !empty($_POST['on']));
            xf_ai_notice(!empty($_POST['on']) ? strtoupper($lang) . ' approved: its pages are indexable, in hreflang, the switcher and the language sitemap.' : strtoupper($lang) . ' set back to noindex.');
            break;
        case 'unpublish_lang':
            xf_ai_notice(sprintf('%d %s page(s) moved to draft.', xf_ai_unpublish_language($lang), strtoupper($lang)));
            break;
        case 'republish_lang':
            $n = 0;
            foreach (get_posts(['post_type' => XF_AI_TRANSLATABLE_TYPES, 'post_status' => 'draft', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => [['key' => '_xf_ai_lang', 'value' => $lang]]]) as $pid) {
                wp_update_post(['ID' => $pid, 'post_status' => 'publish']);
                $n++;
            }
            xf_ai_notice(sprintf('%d %s page(s) published again (noindex until approved).', $n, strtoupper($lang)));
            break;
        case 'run_tick':
            $r = xf_ai_run_tick();
            xf_ai_notice('Batch: ' . $r['message']);
            if (!empty($_REQUEST['autorun']) && xf_ai_pending_count() && $r['calls'] > 0) {
                $back = xf_ai_admin_url(['autorun' => 1]);
            }
            break;
        case 'cancel_queue':
            $wpdb->query("UPDATE " . xf_table('ai_items') . " SET status = 'cancelled' WHERE status IN ('queued','running')"); // phpcs:ignore
            wp_clear_scheduled_hook('xf_ai_tick');
            xf_ai_notice('Queued work cancelled. Finished translations stay.');
            break;
        case 'retry_errors':
            $wpdb->query("UPDATE " . xf_table('ai_items') . " SET status = 'queued', attempts = 0 WHERE status = 'error'"); // phpcs:ignore
            xf_ai_schedule();
            xf_ai_notice('Failed items queued again.');
            break;
        case 'improve':
            $r = xf_ai_queue_improve($id);
            if (!is_wp_error($r)) {
                xf_ai_run_item($r['item']); // Usually finishes at once; otherwise WP-Cron picks it up.
            }
            xf_ai_notice(is_wp_error($r) ? $r->get_error_message() : sprintf('Improvement requested (estimate %s). The draft appears below as Pending review when it is ready.', xf_ai_money($r['estimate'])), !is_wp_error($r));
            $back = xf_ai_admin_url(['tab' => 'thin']);
            break;
        case 'apply':
            $r = xf_ai_apply_improvement($id);
            xf_ai_notice(is_wp_error($r) ? $r->get_error_message() : 'Applied to the original. The previous text is kept under Revisions.', !is_wp_error($r));
            $back = xf_ai_admin_url(['tab' => 'thin']);
            break;
        case 'discard':
            if (get_post_meta($id, '_xf_ai_improves', true)) {
                wp_trash_post($id);
                delete_transient('xf_ai_thin_pages');
                xf_ai_notice('Draft moved to the trash.');
            }
            $back = xf_ai_admin_url(['tab' => 'thin']);
            break;
        case 'reset_mock':
            $wpdb->query($wpdb->prepare("DELETE FROM " . xf_table('ai_ledger') . " WHERE route = %s", 'mock')); // phpcs:ignore
            xf_ai_notice('Mock (test) spending cleared. Real spending is untouched.');
            break;
    }
    wp_safe_redirect($back);
    exit;
}
add_action('admin_post_xf_ai', 'xf_ai_handle_action');

/* ---------------------------------------------------------------- Page */

function xf_ai_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    global $wpdb;
    $tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'overview';
    $s = xf_ai_settings();
    $notice = get_transient('xf_ai_notice_' . get_current_user_id());
    if ($notice) {
        delete_transient('xf_ai_notice_' . get_current_user_id());
    }
    $tabs = ['overview' => 'Overview', 'languages' => 'Languages', 'thin' => 'Thin pages', 'settings' => 'Settings'];
    ?>
    <div class="wrap">
        <h1>AI content</h1>
        <?php if ($notice) : ?>
            <div class="notice notice-<?php echo $notice[1] ? 'success' : 'error'; ?>"><p><?php echo esc_html($notice[0]); ?></p></div>
        <?php endif; ?>
        <nav class="nav-tab-wrapper">
            <?php foreach ($tabs as $k => $label) : ?>
                <a class="nav-tab<?php echo $tab === $k ? ' nav-tab-active' : ''; ?>" href="<?php echo esc_url(xf_ai_admin_url(['tab' => $k])); ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </nav>
        <?php
        if ($tab === 'languages') {
            xf_ai_admin_languages();
        } elseif ($tab === 'thin') {
            xf_ai_admin_thin();
        } elseif ($tab === 'settings') {
            xf_ai_admin_settings($s);
        } else {
            xf_ai_admin_overview($s);
        }
        ?>
    </div>
    <?php
}

function xf_ai_admin_budget_box() {
    $mock = xf_ai_is_mock();
    $budget = xf_ai_budget();
    $spent = xf_ai_spent();
    $pct = $budget > 0 ? min(100, $spent / $budget * 100) : 100;
    ?>
    <div style="background:#fff;border:1px solid #c3c4c7;padding:12px 16px;max-width:760px;margin:12px 0">
        <h2 style="margin-top:0">Budget<?php echo $mock ? ' <span style="color:#b45309">(mock mode: simulated spending)</span>' : ''; ?></h2>
        <div style="background:#f0f0f1;height:12px;border-radius:6px;overflow:hidden"><div style="width:<?php echo esc_attr(round($pct, 1)); ?>%;height:12px;background:<?php echo $pct > 90 ? '#d63638' : '#7c5cff'; ?>"></div></div>
        <table class="widefat striped" style="margin-top:10px">
            <tr><td>Total budget (hard stop)</td><td><strong><?php echo esc_html(xf_ai_money($budget)); ?></strong></td></tr>
            <tr><td>Spent<?php echo $mock ? ' (mock)' : ''; ?>, incl. open and orphaned reservations</td><td><strong><?php echo esc_html(xf_ai_money($spent)); ?></strong></td></tr>
            <tr><td>Of which still reserved (calls in flight)</td><td><?php echo esc_html(xf_ai_money(xf_ai_reserved())); ?></td></tr>
            <tr><td>Remaining</td><td><strong><?php echo esc_html(xf_ai_money(xf_ai_remaining())); ?></strong></td></tr>
            <tr><td>Estimated cost of queued work</td><td><?php echo esc_html(xf_ai_money(xf_ai_committed())); ?></td></tr>
            <?php if ($mock) : ?>
                <tr><td>Real (non-mock) spending</td><td><?php echo esc_html(xf_ai_money(xf_ai_spent(false))); ?></td></tr>
            <?php endif; ?>
        </table>
        <p class="description">Each call is booked at its worst case before it is sent and refused if that would pass the budget; the real cost from Claude's usage report replaces it afterwards.</p>
    </div>
    <?php
}

function xf_ai_admin_overview($s) {
    global $wpdb;
    $route = xf_ai_route();
    $labels = ['mock' => 'Mock (no API calls)', 'wp_ai_client' => 'WordPress AI Client (key kept in the AI plugin)', 'direct' => 'Direct Anthropic API (key in these settings)', '' => 'Not connected'];
    $pending = xf_ai_pending_count();
    ?>
    <h2>Connection</h2>
    <ul>
        <?php
        xf_ai_status_row(xf_ai_wp_client_available(), 'WordPress AI Client detected', 'activate the WordPress "AI" plugin and "AI Provider for Anthropic"');
        xf_ai_status_row((string) $s['api_key'] !== '', 'Fallback API key saved', 'optional; only used when the AI Client is unavailable or the route is "direct"');
        xf_ai_status_row($route !== '', 'Route in use: ' . $labels[$route]);
        xf_ai_status_row(true, 'Model: ' . $s['model']);
        xf_ai_status_row(!$s['paused'], 'Jobs running', 'paused in Settings');
        ?>
    </ul>
    <?php echo xf_ai_button('test', 'Test connection (one tiny call)'); // phpcs:ignore ?>
    <?php xf_ai_admin_budget_box(); ?>

    <h2>Queue</h2>
    <p><?php echo esc_html(sprintf('%d item(s) waiting or running. WP-Cron runs %d call(s) every 5 minutes; next run: %s.', $pending, (int) $s['calls_per_tick'], wp_next_scheduled('xf_ai_tick') ? human_time_diff(wp_next_scheduled('xf_ai_tick')) . ' from now' : 'not scheduled')); ?></p>
    <?php
    if ($pending) {
        echo xf_ai_button('run_tick', 'Run one batch now', [], 'button button-primary'); // phpcs:ignore
        echo xf_ai_button('run_tick', 'Keep running batches while this page is open', ['autorun' => 1]); // phpcs:ignore
        echo xf_ai_button('cancel_queue', 'Cancel queued work', [], 'button', 'Cancel everything still queued?'); // phpcs:ignore
        if (!empty($_GET['autorun'])) {
            $url = wp_nonce_url(add_query_arg(['action' => 'xf_ai', 'do' => 'run_tick', 'autorun' => 1], admin_url('admin-post.php')), 'xf_ai_run_tick');
            printf('<meta http-equiv="refresh" content="3;url=%s"><p><em>Running the next batch in 3 seconds… leave this tab to stop.</em></p>', esc_url($url));
        }
    }
    $errors = (int) $wpdb->get_var("SELECT COUNT(*) FROM " . xf_table('ai_items') . " WHERE status = 'error'"); // phpcs:ignore
    if ($errors) {
        echo xf_ai_button('retry_errors', sprintf('Retry %d failed item(s)', $errors)); // phpcs:ignore
    }
    $items = $wpdb->get_results("SELECT * FROM " . xf_table('ai_items') . " ORDER BY id DESC LIMIT 15"); // phpcs:ignore
    if ($items) : ?>
        <table class="widefat striped" style="max-width:1100px">
            <thead><tr><th>#</th><th>Job</th><th>Page</th><th>Status</th><th>Progress</th><th>Estimate</th><th>Cost</th><th>Note</th></tr></thead>
            <tbody>
            <?php foreach ($items as $i) : ?>
                <tr>
                    <td><?php echo (int) $i->id; ?></td>
                    <td><?php echo esc_html($i->kind . ($i->lang ? ' → ' . strtoupper($i->lang) : '')); ?></td>
                    <td><?php echo esc_html($i->kind === 'outreach' ? 'Outreach email #' . (int) $i->source_id : wp_html_excerpt(get_the_title((int) $i->source_id), 60, '…')); ?><?php if ($i->target_id) : ?> → <a href="<?php echo esc_url(get_edit_post_link((int) $i->target_id)); ?>">result</a><?php endif; ?></td>
                    <td><?php echo esc_html($i->status); ?></td>
                    <td><?php echo esc_html((int) $i->step . '/' . (int) $i->steps); ?></td>
                    <td><?php echo esc_html(xf_ai_money($i->est_cost)); ?></td>
                    <td><?php echo esc_html(xf_ai_money($i->cost)); ?></td>
                    <td><?php echo esc_html(wp_html_excerpt((string) $i->error, 90, '…')); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif;
    $ledger = $wpdb->get_results("SELECT * FROM " . xf_table('ai_ledger') . " ORDER BY id DESC LIMIT 20"); // phpcs:ignore
    ?>
    <h2>Ledger (last 20 calls)</h2>
    <?php if (!$ledger) : ?><p>No calls yet.</p><?php else : ?>
        <table class="widefat striped" style="max-width:1100px">
            <thead><tr><th>When (UTC)</th><th>Purpose</th><th>Route</th><th>Model</th><th>In</th><th>Out</th><th>Cost</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>
            <?php foreach ($ledger as $l) : ?>
                <tr>
                    <td><?php echo esc_html($l->created_at); ?></td>
                    <td><?php echo esc_html($l->purpose); ?></td>
                    <td><?php echo esc_html($l->route); ?></td>
                    <td><?php echo esc_html($l->model); ?></td>
                    <td><?php echo esc_html(number_format((int) $l->input_tokens)); ?></td>
                    <td><?php echo esc_html(number_format((int) $l->output_tokens)); ?></td>
                    <td><?php echo esc_html(xf_ai_money($l->cost)); ?></td>
                    <td><?php echo esc_html($l->status); ?></td>
                    <td><?php echo esc_html(wp_html_excerpt((string) $l->note, 80, '…')); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif;
    if (xf_ai_is_mock()) {
        echo '<p>' . xf_ai_button('reset_mock', 'Clear mock (test) spending', [], 'button', 'Delete the mock ledger rows? Real rows are kept.') . '</p>'; // phpcs:ignore
    }
}

function xf_ai_admin_languages() {
    $langs = xf_ai_languages();
    $stats = xf_ai_language_stats();
    $sources = xf_ai_translatable_ids();
    $model = xf_ai_setting('model');
    ?>
    <h2>Translations</h2>
    <p><?php echo esc_html(sprintf('%d eligible original(s): key pages with real text, plus published articles and apply guides in English. Job pages are never translated. Model: %s. Estimates include a 10%% margin.', count($sources), $model)); ?></p>
    <p class="description">New translations publish at /{lang}/{slug}/ as <strong>noindex</strong>, outside hreflang, the switcher and the sitemaps, until you approve the language here after reading a sample.</p>
    <?php xf_ai_admin_budget_box(); ?>
    <table class="widefat striped" style="max-width:1200px">
        <thead><tr><th>Language</th><th>Approved (indexable)</th><th>Published</th><th>Stale</th><th>Job progress</th><th>Not yet translated</th><th>Queue</th><th>Other</th></tr></thead>
        <tbody>
        <?php foreach ($langs as $code => $l) :
            $st = $stats[$code];
            $cands = xf_ai_translation_candidates($code);
            $est = array_sum($cands);
            $approved = xf_ai_lang_approved($code);
            $sample = get_posts(['post_type' => XF_AI_TRANSLATABLE_TYPES, 'post_status' => 'publish', 'numberposts' => 1, 'xf_ai_include_translations' => true, 'meta_query' => [['key' => '_xf_ai_lang', 'value' => $code]]]);
            ?>
            <tr>
                <td><strong><?php echo esc_html($l['name']); ?></strong><br><code>/<?php echo esc_html($code); ?>/</code> hreflang <code><?php echo esc_html($l['hreflang']); ?></code></td>
                <td>
                    <?php echo $approved ? '<span style="color:#16a34a">✔ Approved</span><br>' : '<span style="color:#b45309">Noindex</span><br>'; ?>
                    <?php echo xf_ai_button('approve', $approved ? 'Revoke' : 'Approve', ['lang' => $code, 'on' => $approved ? '' : '1'], 'button button-small', $approved ? '' : 'Make every ' . $l['name'] . ' page indexable? Read a few first.'); // phpcs:ignore ?>
                    <?php if ($sample) : ?><br><a href="<?php echo esc_url(get_permalink($sample[0])); ?>" target="_blank" rel="noopener">Read a sample</a><?php endif; ?>
                </td>
                <td><?php echo (int) $st['published']; ?><?php echo $st['draft'] ? ' <span class="description">(+' . (int) $st['draft'] . ' draft)</span>' : ''; ?></td>
                <td><?php echo (int) $st['stale']; ?></td>
                <td>
                    <?php if ($st['queued'] + $st['running']) :
                        $pct = $st['steps'] ? round($st['step'] / $st['steps'] * 100) : 0; ?>
                        <?php echo esc_html(sprintf('%d waiting/running · %d%% of calls', $st['queued'] + $st['running'], $pct)); ?>
                        <div style="background:#f0f0f1;height:6px;width:140px"><div style="background:#7c5cff;height:6px;width:<?php echo (int) $pct; ?>%"></div></div>
                    <?php endif; ?>
                    <span class="description"><?php echo esc_html(sprintf('%d done · %d failed · %s spent', $st['done'], $st['error'], xf_ai_money($st['cost']))); ?></span>
                </td>
                <td><?php echo esc_html(sprintf('%d page(s), est. %s', count($cands), xf_ai_money($est))); ?><?php if ($cands) : ?><br><span class="description"><?php echo esc_html('≈ ' . xf_ai_money($est / count($cands)) . ' each'); ?></span><?php endif; ?></td>
                <td>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                        <input type="hidden" name="action" value="xf_ai"><input type="hidden" name="do" value="queue_lang"><input type="hidden" name="lang" value="<?php echo esc_attr($code); ?>">
                        <?php wp_nonce_field('xf_ai_queue_lang'); ?>
                        <label>Newest <input type="number" name="limit" min="0" value="<?php echo esc_attr(min(40, count($cands))); ?>" style="width:64px"></label>
                        <label title="Also re-translate pages whose original changed"><input type="checkbox" name="stale" value="1"> stale</label>
                        <button class="button" <?php disabled(!$cands && !$st['stale']); ?>>Queue</button>
                        <br><span class="description">0 = all</span>
                    </form>
                </td>
                <td>
                    <?php
                    if ($st['published']) {
                        echo xf_ai_button('unpublish_lang', 'Move all to draft', ['lang' => $code], 'button button-small', 'Take every ' . $l['name'] . ' page offline (to draft)?'); // phpcs:ignore
                    }
                    if ($st['draft']) {
                        echo xf_ai_button('republish_lang', 'Republish drafts', ['lang' => $code], 'button button-small'); // phpcs:ignore
                    }
                    ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <p class="description">Approved languages get a sitemap at <code>/wp-sitemap-xflang-{lang}-1.xml</code> (listed in <code>/wp-sitemap.xml</code>). Theme hook for the switcher: <code>&lt;?php do_action('xf_language_switcher'); ?&gt;</code> or the <code>[xf_language_switcher]</code> shortcode; it is also added above the content automatically (Settings).</p>
    <?php
}

function xf_ai_admin_thin() {
    $pages = xf_ai_thin_pages();
    $drafts = xf_ai_improvement_drafts();
    $words = (int) xf_ai_setting('thin_words');
    ?>
    <h2 id="thin">Thin pages (under <?php echo (int) $words; ?> words)</h2>
    <p class="description">Legal, private and template-rendered pages and translations are excluded. "Improve with Claude" uses only the page's own text, fields, sources and terms, keeps every link, and saves a <strong>Pending review</strong> copy. Nothing goes live until you click "Apply to original".</p>
    <?php if ($drafts) : ?>
        <h3>Waiting for your review</h3>
        <table class="widefat striped" style="max-width:1100px">
            <thead><tr><th>Original</th><th>Words now → draft</th><th>Numbers to check</th><th>Actions</th></tr></thead>
            <tbody>
            <?php foreach ($drafts as $orig => $copy) :
                $flags = (array) get_post_meta($copy, '_xf_ai_number_flags', true); ?>
                <tr>
                    <td><a href="<?php echo esc_url(get_permalink($orig)); ?>" target="_blank" rel="noopener"><?php echo esc_html(get_the_title($orig)); ?></a></td>
                    <td><?php echo esc_html(xf_ai_word_count(get_post_field('post_content', $orig)) . ' → ' . xf_ai_word_count(get_post_field('post_content', $copy))); ?></td>
                    <td><?php echo $flags ? esc_html(implode(', ', $flags)) : '<span class="description">none</span>'; ?></td>
                    <td>
                        <a class="button" href="<?php echo esc_url(get_edit_post_link($copy)); ?>">Review / edit draft</a>
                        <a class="button" href="<?php echo esc_url(get_preview_post_link($copy)); ?>" target="_blank" rel="noopener">Preview</a>
                        <?php echo xf_ai_button('apply', 'Apply to original', ['id' => $copy], 'button button-primary', 'Replace the live page text with this draft? The old text stays in Revisions.'); // phpcs:ignore ?>
                        <?php echo xf_ai_button('discard', 'Discard', ['id' => $copy], 'button', 'Move this draft to the trash?'); // phpcs:ignore ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
    <h3><?php echo esc_html(sprintf('%d thin page(s)', count($pages))); ?></h3>
    <?php if (!$pages) : ?><p>None. Nice.</p><?php else : ?>
        <table class="widefat striped" style="max-width:1100px">
            <thead><tr><th>Page</th><th>Type</th><th>Words</th><th>Estimate</th><th></th></tr></thead>
            <tbody>
            <?php foreach (array_slice($pages, 0, 200) as $p) : ?>
                <tr>
                    <td><a href="<?php echo esc_url(get_permalink($p['id'])); ?>" target="_blank" rel="noopener"><?php echo esc_html($p['title'] ?: '(no title)'); ?></a> · <a href="<?php echo esc_url(get_edit_post_link($p['id'])); ?>">edit</a></td>
                    <td><?php echo esc_html($p['type']); ?></td>
                    <td><?php echo (int) $p['words']; ?></td>
                    <td><?php echo esc_html(xf_ai_money(xf_ai_estimate_improve($p['id']))); ?></td>
                    <td>
                        <?php if ($p['draft_id']) : ?>
                            <span class="description">Draft waiting for review</span>
                        <?php else : ?>
                            <?php echo xf_ai_button('improve', 'Improve with Claude', ['id' => $p['id']], 'button button-primary'); // phpcs:ignore ?>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif;
}

function xf_ai_admin_settings($s) {
    $types = ['post' => 'Articles', 'xf_guide' => 'Apply guides'];
    $thin = ['post' => 'Articles', 'page' => 'Pages', 'xf_guide' => 'Apply guides', 'xf_startup' => 'Startup listings'];
    ?>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <input type="hidden" name="action" value="xf_ai"><input type="hidden" name="do" value="save_settings">
        <?php wp_nonce_field('xf_ai_save_settings'); ?>
        <table class="form-table" role="presentation">
            <tr><th>Route</th><td>
                <select name="route">
                    <?php foreach (['auto' => 'Auto: WordPress AI Client, else the key below', 'wp_ai_client' => 'WordPress AI Client only', 'direct' => 'Direct Anthropic API only', 'mock' => 'Mock (local testing, no API calls)'] as $k => $label) : ?>
                        <option value="<?php echo esc_attr($k); ?>" <?php selected($s['route'], $k); ?>><?php echo esc_html($label); ?></option>
                    <?php endforeach; ?>
                </select>
            </td></tr>
            <tr><th>Anthropic API key (fallback)</th><td>
                <input type="password" name="api_key" value="" autocomplete="new-password" class="regular-text" placeholder="<?php echo $s['api_key'] !== '' ? esc_attr__('A key is saved. Leave empty to keep it.') : 'sk-ant-…'; ?>">
                <?php if ($s['api_key'] !== '' && !defined('XF_ANTHROPIC_API_KEY')) : ?><label><input type="checkbox" name="remove_key" value="1"> Remove saved key</label><?php endif; ?>
                <p class="description">Write-only: the key is never shown again. Or define <code>XF_ANTHROPIC_API_KEY</code> in wp-config.php.</p>
            </td></tr>
            <tr><th>Model</th><td>
                <select name="model">
                    <?php foreach (XF_AI_MODELS as $id => $label) : ?>
                        <option value="<?php echo esc_attr($id); ?>" <?php selected($s['model'], $id); ?>><?php echo esc_html($label); ?></option>
                    <?php endforeach; ?>
                </select>
            </td></tr>
            <tr><th>Total budget (USD)</th><td><input type="number" step="0.01" min="0" name="budget_usd" value="<?php echo esc_attr($s['budget_usd']); ?>"> <span class="description">Hard stop across all AI jobs, ever.</span></td></tr>
            <tr><th>Prices</th><td><textarea name="prices" rows="4" class="large-text code"><?php echo esc_textarea($s['prices']); ?></textarea><p class="description">model|input $ per million tokens|output $ per million tokens. Models not listed are booked at $10/$50.</p></td></tr>
            <tr><th>Languages</th><td><textarea name="languages" rows="11" class="large-text code"><?php echo esc_textarea($s['languages']); ?></textarea><p class="description">url-code|hreflang|native name|English name (used in the prompt)|og locale. Changing codes changes URLs.</p></td></tr>
            <tr><th>Never translate</th><td><textarea name="brand_terms" rows="5" class="large-text"><?php echo esc_textarea($s['brand_terms']); ?></textarea><p class="description">One per line. Company, product and people's names are kept anyway.</p></td></tr>
            <tr><th>Key pages</th><td><textarea name="key_pages" rows="4" class="large-text code"><?php echo esc_textarea($s['key_pages']); ?></textarea><p class="description">Page slugs to translate. Pages whose text comes from the theme (home, tools) have nothing to translate and are skipped.</p></td></tr>
            <tr><th>Translate</th><td>
                <?php foreach ($types as $k => $label) : ?>
                    <label style="margin-right:12px"><input type="checkbox" name="translate_types[]" value="<?php echo esc_attr($k); ?>" <?php checked(in_array($k, (array) $s['translate_types'], true)); ?>> <?php echo esc_html($label); ?></label>
                <?php endforeach; ?>
                <p class="description">Job pages are never translated.</p>
            </td></tr>
            <tr><th>Thin pages</th><td>
                Under <input type="number" name="thin_words" min="100" value="<?php echo esc_attr($s['thin_words']); ?>" style="width:80px"> words, in:
                <?php foreach ($thin as $k => $label) : ?>
                    <label style="margin-left:10px"><input type="checkbox" name="thin_types[]" value="<?php echo esc_attr($k); ?>" <?php checked(in_array($k, (array) $s['thin_types'], true)); ?>> <?php echo esc_html($label); ?></label>
                <?php endforeach; ?>
            </td></tr>
            <tr><th>Batch size</th><td>
                <input type="number" name="calls_per_tick" min="1" max="10" value="<?php echo esc_attr($s['calls_per_tick']); ?>" style="width:60px"> calls per 5-minute run ·
                chunks of <input type="number" name="chunk_chars" min="2000" value="<?php echo esc_attr($s['chunk_chars']); ?>" style="width:80px"> characters ·
                max <input type="number" name="max_tokens" min="1024" max="16000" value="<?php echo esc_attr($s['max_tokens']); ?>" style="width:80px"> output tokens per call
            </td></tr>
            <tr><th>Language switcher</th><td><label><input type="checkbox" name="switcher" value="1" <?php checked($s['switcher']); ?>> Add it above the content of pages that have approved translations</label></td></tr>
            <tr><th>Pause</th><td><label><input type="checkbox" name="paused" value="1" <?php checked($s['paused']); ?>> Pause all AI jobs (no calls are sent)</label></td></tr>
        </table>
        <?php submit_button('Save settings'); ?>
    </form>
    <?php
}
