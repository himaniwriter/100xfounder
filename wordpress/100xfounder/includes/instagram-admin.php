<?php
/**
 * 100xFounder → Instagram: one admin section with tabs (Queue, Posted, Skipped, Create, Settings).
 * The queue tab has bulk actions, caption editing and "Improve…" requests (instagram-improve.php);
 * the dashboard only shows a one-line summary.
 */
if (!defined('ABSPATH')) {
    exit;
}

function xf_ig_tab_url($tab = 'queue', array $args = []) {
    return add_query_arg(array_merge(['page' => 'xf-instagram', 'tab' => $tab], $args), admin_url('admin.php'));
}

add_action('admin_menu', function () {
    add_submenu_page('xf', 'Instagram', 'Instagram', 'manage_options', 'xf-instagram', 'xf_ig_admin_page');
    // The old "Instagram posted" page slug keeps working: it redirects to its tab.
    $hook = add_submenu_page('', 'Instagram posted', 'Instagram posted', 'manage_options', 'xf-ig-posted', '__return_null');
    add_action('load-' . $hook, function () {
        wp_safe_redirect(xf_ig_tab_url(isset($_GET['view']) && $_GET['view'] === 'skipped' ? 'skipped' : 'posted'));
        exit;
    });
}, 20);

/** The next IST posting slot: "19:30" today or "tomorrow 09:30". */
function xf_ig_next_slot_label($now = null) {
    $now = (new DateTimeImmutable('@' . ($now ?? time())))->setTimezone(new DateTimeZone('Asia/Kolkata'));
    $slots = xf_ig_parse_slots(xf_ig_opt('ig_slots'));
    foreach ($slots as $hm) {
        if ($hm > $now->format('H:i')) {
            return $hm;
        }
    }
    return $slots ? 'tomorrow ' . $slots[0] : 'none';
}

/** Founder-feature items can't post until the founder's consent is recorded on the item. */
function xf_ig_needs_consent($item, array $payload) {
    return (in_array($item->kind, XF_IG_FOUNDER_KINDS, true) || !empty($payload['needs_founder_ok'])) && empty($payload['ig_consent']);
}

/** Daily digests more than 2 days old. */
function xf_ig_is_stale($item, array $payload) {
    if ($item->kind !== 'daily_digest') {
        return false;
    }
    $day = !empty($payload['day']) ? strtotime($payload['day'] . ' 12:00:00 UTC') : strtotime($item->created_at . ' UTC');
    return $day && $day < time() - 2 * DAY_IN_SECONDS;
}

/** The one-line dashboard summary that replaced the queue card. */
function xf_ig_dashboard_summary() {
    global $wpdb;
    $payloads = $wpdb->get_col('SELECT payload FROM ' . xf_table('ig_queue') . " WHERE status = 'ready'");
    $approved = count(array_filter($payloads, function ($p) { return !empty((json_decode($p, true) ?: [])['ig_approved']); }));
    printf(
        '<div class="card" style="max-width:none"><p style="margin:0"><strong>Instagram:</strong> %d waiting, %d approved, next slot %s <a href="%s">→ Open</a></p></div>',
        count($payloads),
        (int) $approved,
        esc_html(xf_ig_next_slot_label()),
        esc_url(xf_ig_tab_url('queue'))
    );
}

function xf_ig_admin_page() {
    global $wpdb;
    if (!current_user_can('manage_options')) {
        return;
    }
    $counts = $wpdb->get_results('SELECT status, COUNT(*) n FROM ' . xf_table('ig_queue') . ' GROUP BY status', OBJECT_K);
    $n = function ($s) use ($counts) { return (int) ($counts[$s]->n ?? 0); };
    $tabs = [
        'queue' => 'Queue (' . ($n('ready') + $n('posting')) . ')',
        'posted' => 'Posted (' . $n('posted') . ')',
        'skipped' => 'Skipped (' . $n('skipped') . ')',
        'create' => 'Create',
        'dms' => 'DMs',
        'settings' => 'Settings',
    ];
    $tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'queue';
    $tab = isset($tabs[$tab]) ? $tab : 'queue';
    ?>
    <div class="wrap xf-ig">
        <h1>Instagram</h1>
        <nav class="nav-tab-wrapper">
            <?php foreach ($tabs as $key => $label) : ?>
                <a href="<?php echo esc_url(xf_ig_tab_url($key)); ?>" class="nav-tab<?php echo $key === $tab ? ' nav-tab-active' : ''; ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </nav>
        <style>
            .xf-ig .xf-chip{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;line-height:18px;background:#f0f0f1;color:#3c434a;margin-right:4px}
            .xf-ig .xf-chip-ok{background:#e7f6ec;color:#116329}.xf-ig .xf-chip-warn{background:#fcf3e3;color:#8a5300}.xf-ig .xf-chip-err{background:#fcebeb;color:#a00}
            .xf-ig .xf-ig-thumb{padding:0;border:0;background:none;cursor:zoom-in}.xf-ig .xf-ig-thumb img{border-radius:4px;border:1px solid #dcdcde;display:block}
            .xf-ig details{margin-top:6px}.xf-ig summary{cursor:pointer;color:#2271b1}
            .xf-ig dialog{max-width:92vw;border:1px solid #dcdcde;border-radius:6px;padding:16px}.xf-ig dialog::backdrop{background:rgba(0,0,0,.6)}
            .xf-ig .xf-ig-imp{margin:6px 0;padding:6px 8px;border-left:3px solid #dcdcde;background:#fff}.xf-ig .xf-ig-imp-done{border-color:#7c5cff}.xf-ig .xf-ig-imp-failed{border-color:#d63638}
            .xf-ig .xf-ig-diff{margin:6px 0}.xf-ig .xf-ig-diff td{vertical-align:top;font-size:12px}
            .xf-ig .xf-ig-count.is-over{color:#d63638;font-weight:600}
        </style>
        <?php
        if ($tab === 'queue') {
            xf_ig_queue_tab();
        } elseif ($tab === 'posted' || $tab === 'skipped') {
            echo '<div style="margin-top:12px">';
            xf_ig_posted_page($tab);
            echo '</div>';
        } elseif ($tab === 'create') {
            xf_ig_create_tab();
        } elseif ($tab === 'dms' && function_exists('xf_ig_dm_tab')) {
            xf_ig_dm_tab();
        } else {
            xf_ig_settings_card();
        }
        ?>
    </div>
    <?php
}

/* ---- Queue tab ---- */

function xf_ig_queue_tab() {
    global $wpdb;
    $table = xf_table('ig_queue');
    $rows = $wpdb->get_results("SELECT * FROM $table WHERE status IN ('ready','posting') ORDER BY planned_at IS NULL, planned_at ASC, created_at DESC LIMIT 100");
    $improve = function_exists('xf_ig_improve_by_item') ? xf_ig_improve_by_item(wp_list_pluck($rows, 'id')) : [];
    $last = get_option('xf_ig_last_calendar');
    $zip = class_exists('ZipArchive');
    $post = admin_url('admin-post.php');
    $confirm = isset($_GET['confirm_delete']) ? array_filter(array_map('absint', explode(',', sanitize_text_field(wp_unslash($_GET['confirm_delete']))))) : [];
    ?>
    <p>Calendar (IST): Mon roundup + AI tip · Tue founder story + launch · Wed news + founder story · Thu founder story + launch · Fri news + AI tip · Sat roundup · Sun best founder story. Queued daily at 00:05 IST<?php echo $last ? ' (last: ' . esc_html($last['day'] . ' → ' . implode('; ', $last['slots'])) . ')' : ''; ?>.
        <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=xf_ig_calendar_now'), 'xf_ig_calendar_now')); ?>">Queue today's slots now</a></p>
    <?php if (function_exists('xf_ig_autopost_status')) { xf_ig_autopost_status(); } ?>

    <?php if ($confirm) : $del = xf_ig_deletable($confirm); ?>
        <div class="notice notice-warning inline"><p><strong>Delete <?php echo count($del); ?> item(s) for good?</strong> Only items that were never posted can be deleted<?php echo count($del) < count($confirm) ? ' (' . (count($confirm) - count($del)) . ' of your selection can\'t be and are left alone)' : ''; ?>:
            <?php echo esc_html(implode(' · ', wp_list_pluck($del, 'title'))); ?></p>
            <form method="post" action="<?php echo esc_url($post); ?>" style="margin-bottom:8px">
                <input type="hidden" name="action" value="xf_ig_bulk"><input type="hidden" name="bulk_action" value="delete_confirm">
                <?php foreach ($del as $d) : ?><input type="hidden" name="ids[]" value="<?php echo (int) $d->id; ?>"><?php endforeach; ?>
                <?php wp_nonce_field('xf_ig_bulk'); ?>
                <button class="button button-primary" <?php disabled(!$del); ?>>Yes, delete <?php echo count($del); ?></button>
                <a class="button" href="<?php echo esc_url(xf_ig_tab_url('queue')); ?>">Cancel</a>
            </form></div>
    <?php endif; ?>

    <form id="xf-ig-bulk" method="post" action="<?php echo esc_url($post); ?>" style="margin:10px 0">
        <input type="hidden" name="action" value="xf_ig_bulk">
        <?php wp_nonce_field('xf_ig_bulk'); ?>
        <label class="screen-reader-text" for="xf-ig-bulk-action">Bulk action</label>
        <select name="bulk_action" id="xf-ig-bulk-action">
            <option value="">Bulk actions</option>
            <option value="approve">Approve</option>
            <option value="unapprove">Unapprove</option>
            <option value="skip">Skip</option>
            <option value="post_now">Post now (max 2 per run)</option>
            <option value="delete">Delete (never-posted only)</option>
        </select>
        <button class="button">Apply</button>
        <span class="description">Bulk Approve doesn't record founder consent: founder stories stay blocked until you tick "Founder consent received" on each one.</span>
    </form>

    <table class="wp-list-table widefat striped">
        <thead><tr>
            <td class="manage-column check-column"><input type="checkbox" id="xf-ig-all" aria-label="Select all"></td>
            <th style="width:80px">Slide 1</th><th>Item</th><th style="width:150px">Planned</th><th style="width:70px">Age</th><th style="width:34%">Approval and actions</th>
        </tr></thead>
        <tbody>
        <?php foreach ($rows as $item) : $payload = json_decode($item->payload, true) ?: []; $id = (int) $item->id; ?>
            <tr id="xf-ig-row-<?php echo $id; ?>">
                <th scope="row" class="check-column"><input type="checkbox" class="xf-ig-cb" name="ids[]" value="<?php echo $id; ?>" form="xf-ig-bulk" aria-label="Select <?php echo esc_attr($item->title); ?>"></th>
                <td>
                    <button type="button" class="xf-ig-thumb" data-dialog="xf-ig-prev-<?php echo $id; ?>" title="Preview all slides">
                        <img src="<?php echo esc_url(xf_slide_url($id, 0)); ?>" width="64" height="80" loading="lazy" alt="Slide 1 of <?php echo esc_attr($item->title); ?>">
                    </button>
                    <dialog id="xf-ig-prev-<?php echo $id; ?>">
                        <p><strong><?php echo esc_html($item->title); ?></strong></p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <?php for ($n = 0; $n < (int) $item->slide_count; $n++) : ?>
                                <img src="<?php echo esc_url(xf_slide_url($id, $n)); ?>" width="216" height="270" loading="lazy" alt="Slide <?php echo (int) $n + 1; ?>" style="border-radius:4px;border:1px solid #dcdcde">
                            <?php endfor; ?>
                        </div>
                        <form method="dialog" style="margin-top:10px"><button class="button">Close</button></form>
                    </dialog>
                </td>
                <td>
                    <strong><?php echo esc_html($item->title); ?></strong> <code><?php echo esc_html($item->kind); ?></code><br>
                    <?php if (!empty($payload['ig_approved'])) : ?><span class="xf-chip xf-chip-ok">Approved</span><?php endif; ?>
                    <?php if (xf_ig_needs_consent($item, $payload)) : ?><span class="xf-chip xf-chip-warn">Needs founder consent</span><?php endif; ?>
                    <?php if (!empty($payload['ig_error'])) : ?><span class="xf-chip xf-chip-err">Error</span><?php endif; ?>
                    <?php if ($item->status === 'posting') : ?><span class="xf-chip xf-chip-err">Stuck posting</span><?php endif; ?>
                    <?php if (xf_ig_is_stale($item, $payload)) : ?><span class="xf-chip xf-chip-warn">Stale</span><?php endif; ?>
                    <?php if (!empty($payload['ig_caption_manual'])) : ?><span class="xf-chip">Caption edited</span><?php endif; ?>
                    <?php if (!empty($payload['url'])) : ?><a href="<?php echo esc_url($payload['url']); ?>" target="_blank" rel="noopener">Source page</a><?php endif; ?>
                    <details>
                        <summary>Caption</summary>
                        <form method="post" action="<?php echo esc_url($post); ?>">
                            <input type="hidden" name="action" value="xf_ig_caption"><input type="hidden" name="id" value="<?php echo $id; ?>">
                            <?php wp_nonce_field('xf_ig_caption_' . $id); ?>
                            <textarea name="caption" rows="8" class="large-text xf-ig-caption" <?php disabled($item->status !== 'ready'); ?>><?php echo esc_textarea($item->caption); ?></textarea>
                            <span class="xf-ig-count" data-for="chars"></span> · <span class="xf-ig-count" data-for="tags"></span>
                            <?php if ($item->status === 'ready') : ?><button class="button button-small">Save caption</button><?php endif; ?>
                            <button type="button" class="button button-small xf-ig-copy">Copy</button>
                        </form>
                    </details>
                    <?php if ($item->status === 'ready' && function_exists('xf_ig_improve_box')) : ?>
                        <details <?php echo !empty($improve[$id]) ? 'open' : ''; ?>>
                            <summary>Improve…</summary>
                            <?php xf_ig_improve_box($item, $improve[$id] ?? []); ?>
                        </details>
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html(xf_ig_planned_label($item->planned_at ?? null)); ?></td>
                <td><?php echo esc_html(human_time_diff(strtotime($item->created_at . ' UTC'))); ?></td>
                <td>
                    <?php if (function_exists('xf_ig_item_controls')) { xf_ig_item_controls($item, $payload); } ?>
                    <a class="button button-small" href="<?php echo esc_url(xf_admin_action_url('ig_posted', ['id' => $id])); ?>">Mark posted</a>
                    <a class="button button-small" href="<?php echo esc_url(xf_admin_action_url('ig_skipped', ['id' => $id])); ?>">Skip</a>
                    <?php if ($zip) : ?><a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=xf_ig_zip&id=' . $id), 'xf_ig_zip_' . $id)); ?>">Zip</a><?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$rows) : ?><tr><td colspan="6">Nothing left to post. Make more on the <a href="<?php echo esc_url(xf_ig_tab_url('create')); ?>">Create</a> tab.</td></tr><?php endif; ?>
        </tbody>
    </table>
    <script>
    (function () {
        var all = document.getElementById('xf-ig-all');
        var boxes = function () { return document.querySelectorAll('.xf-ig-cb'); };
        if (all) {
            all.addEventListener('change', function () { boxes().forEach(function (b) { b.checked = all.checked; }); });
        }
        document.querySelectorAll('.xf-ig-thumb').forEach(function (b) {
            b.addEventListener('click', function () { var d = document.getElementById(b.dataset.dialog); if (d && d.showModal) { d.showModal(); } });
        });
        var count = function (ta) {
            var f = ta.form, v = ta.value, chars = Array.from(v).length, tags = (v.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;
            var c = f.querySelector('[data-for=chars]'), t = f.querySelector('[data-for=tags]');
            c.textContent = chars + ' / 2,200 characters'; c.classList.toggle('is-over', chars > 2200);
            t.textContent = tags + ' / 30 hashtags'; t.classList.toggle('is-over', tags > 30);
        };
        document.querySelectorAll('.xf-ig-caption').forEach(function (ta) { count(ta); ta.addEventListener('input', function () { count(ta); }); });
        document.querySelectorAll('.xf-ig-copy').forEach(function (b) {
            b.addEventListener('click', function () { navigator.clipboard.writeText(b.form.querySelector('textarea').value).then(function () { b.textContent = 'Copied'; }); });
        });
    })();
    </script>
    <?php
}

/** Selected rows that may be deleted: still in the queue and never posted. */
function xf_ig_deletable(array $ids) {
    global $wpdb;
    $ids = array_values(array_filter(array_map('intval', $ids)));
    if (!$ids) {
        return [];
    }
    return $wpdb->get_results($wpdb->prepare('SELECT id, title FROM ' . xf_table('ig_queue') . ' WHERE id IN (' . implode(',', array_fill(0, count($ids), '%d')) . ") AND status = 'ready' AND posted_at IS NULL AND ig_media_id = ''", ...$ids));
}

add_action('admin_post_xf_ig_bulk', function () {
    global $wpdb;
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_bulk')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $do = isset($_POST['bulk_action']) ? sanitize_key(wp_unslash($_POST['bulk_action'])) : '';
    $ids = array_values(array_unique(array_filter(array_map('absint', (array) ($_POST['ids'] ?? [])))));
    $back = xf_ig_tab_url('queue');
    if (!$ids || !in_array($do, ['approve', 'unapprove', 'skip', 'post_now', 'delete', 'delete_confirm'], true)) {
        xf_ig_redirect(!$ids ? 'Select at least one item.' : 'Choose a bulk action.', $back);
    }
    if ($do === 'delete') {
        wp_safe_redirect(add_query_arg('confirm_delete', implode(',', $ids), $back));
        exit;
    }
    $table = xf_table('ig_queue');
    if ($do === 'delete_confirm') {
        $del = array_map('intval', wp_list_pluck(xf_ig_deletable($ids), 'id'));
        foreach ($del as $id) {
            $wpdb->delete($table, ['id' => $id, 'status' => 'ready']);
            $wpdb->delete(xf_table('ig_improve'), ['item_id' => $id]);
        }
        xf_ig_redirect(sprintf('Deleted %d item(s).', count($del)), $back);
    }
    $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE id IN (" . implode(',', array_fill(0, count($ids), '%d')) . ") AND status = 'ready' ORDER BY planned_at IS NULL, planned_at ASC, id ASC", ...$ids));
    if ($do === 'post_now') {
        xf_ig_redirect(xf_ig_bulk_post($rows), $back);
    }
    $stamp = ['by' => wp_get_current_user()->user_login, 'at' => time()];
    $changed = 0;
    $consent = 0;
    foreach ($rows as $row) {
        $payload = json_decode($row->payload, true) ?: [];
        if ($do === 'skip') {
            $changed += (int) $wpdb->update($table, ['status' => 'skipped', 'updated_at' => xf_now()], ['id' => $row->id, 'status' => 'ready']);
            continue;
        }
        if ($do === 'approve') {
            $payload['ig_approved'] = $payload['ig_approved'] ?? $stamp;
            $consent += (int) xf_ig_needs_consent($row, $payload);
        } else {
            unset($payload['ig_approved']);
        }
        $changed += (int) $wpdb->update($table, ['payload' => wp_json_encode($payload)], ['id' => $row->id]);
    }
    $verb = ['approve' => 'Approved', 'unapprove' => 'Unapproved', 'skip' => 'Skipped'][$do];
    xf_ig_redirect("$verb $changed item(s)." . ($consent ? " $consent founder item(s) still need the founder's consent ticked one by one before they can post." : ''), $back);
});

/** Posts selected approved items one after another: at most 2 per run and never past the daily maximum. */
function xf_ig_bulk_post(array $rows) {
    if (!xf_ig_token() || trim((string) xf_ig_opt('ig_user_id')) === '') {
        return 'Not posted: Instagram is not connected (Settings tab).';
    }
    $room = min(2, max(1, (int) xf_ig_opt('ig_max_per_day')) - xf_ig_posted_today());
    if ($room <= 0) {
        return 'Not posted: the daily maximum (' . (int) xf_ig_opt('ig_max_per_day') . ') is already reached.';
    }
    if (!xf_mutex_acquire('ig_post', 10 * MINUTE_IN_SECONDS)) {
        return 'Not posted: another run is posting right now. Try again in a few minutes.';
    }
    $done = 0;
    $notes = [];
    foreach ($rows as $row) {
        if ($done >= $room) {
            $notes[] = 'stopped after ' . $done . ' (limit for this run)';
            break;
        }
        $blocker = xf_ig_blocker($row, json_decode($row->payload, true) ?: [], true);
        if ($blocker !== '') {
            $notes[] = '"' . $row->title . '": ' . $blocker;
            continue;
        }
        $r = xf_ig_post_item($row, 'post_now');
        if (is_wp_error($r)) {
            $notes[] = '"' . $row->title . '" failed: ' . $r->get_error_message();
            continue;
        }
        $done++;
    }
    xf_mutex_release('ig_post');
    return "Posted $done item(s)." . ($notes ? ' ' . implode('; ', $notes) . '.' : '');
}

/* ---- Caption editing ---- */

add_action('admin_post_xf_ig_caption', function () {
    global $wpdb;
    $id = isset($_POST['id']) ? absint($_POST['id']) : 0;
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_caption_' . $id)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $back = xf_ig_tab_url('queue') . '#xf-ig-row-' . $id;
    $item = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('ig_queue') . ' WHERE id = %d', $id));
    if (!$item || $item->status !== 'ready') {
        xf_ig_redirect('That Instagram item is no longer in the queue.', $back);
    }
    $caption = trim(str_replace("\r\n", "\n", sanitize_textarea_field(wp_unslash($_POST['caption'] ?? ''))));
    $problem = xf_ig_caption_problem($caption);
    if ($problem !== '') {
        xf_ig_redirect('Caption not saved: ' . $problem, $back);
    }
    // Approval stays as it was; the flag keeps this caption when the daily rebuild refreshes the item.
    $payload = json_decode($item->payload, true) ?: [];
    $payload['ig_caption_manual'] = ['by' => wp_get_current_user()->user_login, 'at' => time()];
    $wpdb->update(xf_table('ig_queue'), ['caption' => $caption, 'payload' => wp_json_encode($payload), 'updated_at' => xf_now()], ['id' => $id]);
    xf_ig_redirect('Caption saved.', $back);
});

/* ---- Create tab: new items now, from real site data only (the same builders the calendar uses) ---- */

function xf_ig_create_tab() {
    $post = admin_url('admin-post.php');
    $news = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 40, 'category_name' => implode(',', xf_ig_news_category_slugs()), 'no_found_rows' => true]);
    $tips = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 40, 's' => 'best AI', 'orderby' => 'date', 'order' => 'DESC', 'no_found_rows' => true]);
    $startups = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 80, 'meta_key' => '_xf_profile', 'orderby' => 'modified', 'order' => 'DESC', 'no_found_rows' => true]);
    $yesterday = (new DateTimeImmutable('now', new DateTimeZone(XF_PH_TIMEZONE)))->modify('-1 day')->format('Y-m-d');
    $form = function ($do, $label, $fields = '') use ($post) {
        echo '<form method="post" action="' . esc_url($post) . '" style="margin:0 0 14px">'
            . '<input type="hidden" name="action" value="xf_ig_create"><input type="hidden" name="do" value="' . esc_attr($do) . '">'
            . wp_nonce_field('xf_ig_create', '_wpnonce', true, false)
            . $fields . ' <button class="button">' . esc_html($label) . '</button></form>';
    };
    $select = function ($name, array $posts) {
        $o = '<select name="' . esc_attr($name) . '" style="max-width:520px">';
        foreach ($posts as $p) {
            $o .= '<option value="' . (int) $p->ID . '">' . esc_html(wp_trim_words(get_the_title($p), 14, '…') . ' (' . get_the_date('j M', $p) . ')') . '</option>';
        }
        return $o . '</select>';
    };
    ?>
    <div class="card" style="max-width:none">
        <p>Builds new queue items right now from real site content, with the same builders the daily calendar uses. A builder that finds too little real data makes nothing. If the item already exists it is refreshed: approval resets, but your caption edits and improvements are kept. New items are unscheduled until you post them.</p>
        <h3>Daily digest (top Product Hunt launches of a day)</h3>
        <?php $form('digest', 'Create digest', '<input type="date" name="day" value="' . esc_attr($yesterday) . '" max="' . esc_attr($yesterday) . '" required>'); ?>
        <h3>Weekly roundup</h3>
        <?php $form('roundup', 'Create roundup', '<select name="variant"><option value="week">This week in startups (mix)</option><option value="funding">Funding rounds first</option></select>'); ?>
        <h3>News card from an article</h3>
        <?php $news ? $form('news', 'Create news card', $select('post_id', $news)) : print('<p class="description">No published news articles yet.</p>'); ?>
        <h3>AI tip from an article</h3>
        <?php $tips ? $form('ai_tip', 'Create AI tip', $select('post_id', $tips)) : print('<p class="description">No "best AI for…" articles yet.</p>'); ?>
        <h3>Founder story from a startup</h3>
        <?php $startups ? $form('founder', 'Create founder story', $select('startup_id', $startups)) : print('<p class="description">No researched startup profiles yet.</p>'); ?>
        <p class="description">Founder stories can't post until you tick "Founder consent received" on the item.</p>
        <h3>100X Meter weekly climbers</h3>
        <?php $form('meter', 'Create meter weekly'); ?>
        <h3>Upload a finished post</h3>
        <form method="post" action="<?php echo esc_url($post); ?>" enctype="multipart/form-data" style="margin:0 0 14px;display:grid;gap:8px;max-width:640px">
            <input type="hidden" name="action" value="xf_ig_upload">
            <?php wp_nonce_field('xf_ig_upload'); ?>
            <label>Title (for the queue) <input type="text" name="title" class="regular-text" required maxlength="120"></label>
            <label>Slides, in order (1–10 JPEG or PNG, 1080×1350 recommended) <input type="file" name="slides[]" accept="image/jpeg,image/png" multiple required></label>
            <label>Caption <textarea name="caption" rows="6" class="large-text" maxlength="2200" required></textarea></label>
            <label>Collaborators (optional, up to 3 Instagram usernames, comma separated) <input type="text" name="collaborators" class="regular-text" placeholder="founder_handle, startup_handle"></label>
            <span><button class="button">Queue upload</button></span>
        </form>
        <p class="description">For posts designed outside the site (content/instagram/render.py). Files are sorted by name, so slide-1, slide-2 … keep their order. The item still needs approval before it can post.</p>
    </div>
    <?php
}

add_action('admin_post_xf_ig_create', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_create')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $do = isset($_POST['do']) ? sanitize_key(wp_unslash($_POST['do'])) : '';
    $id = null;
    switch ($do) {
        case 'digest':
            $day = DateTimeImmutable::createFromFormat('!Y-m-d', sanitize_text_field(wp_unslash($_POST['day'] ?? '')), new DateTimeZone(XF_PH_TIMEZONE));
            $today = new DateTimeImmutable('today', new DateTimeZone(XF_PH_TIMEZONE));
            $ago = $day ? (int) $day->diff($today)->format('%r%a') : -1;
            if ($ago < 1 || $ago > 90) {
                xf_ig_redirect('Pick a day between yesterday and 90 days ago.', xf_ig_tab_url('create'));
            }
            $d = xf_queue_daily_digest($ago);
            $id = $d ? $d['item'] : null;
            break;
        case 'roundup':
            $id = xf_ig_roundup(($_POST['variant'] ?? '') === 'funding' ? 'funding' : 'week');
            break;
        case 'news':
            $id = xf_ig_news_card(absint($_POST['post_id'] ?? 0));
            break;
        case 'ai_tip':
            $id = xf_ig_ai_tip(absint($_POST['post_id'] ?? 0));
            break;
        case 'founder':
            $id = xf_ig_founder_story_startup(absint($_POST['startup_id'] ?? 0));
            break;
        case 'meter':
            $id = function_exists('xf_meter_weekly_ig') ? xf_meter_weekly_ig() : null;
            break;
    }
    if (!$id) {
        $why = $do === 'meter' ? ' (needs at least 3 startups with taps this week, and this week\'s item must not be approved or posted already)' : '';
        xf_ig_redirect('Nothing created: there isn\'t enough real data for this item' . $why . '.', xf_ig_tab_url('create'));
    }
    xf_ig_redirect('Queued item #' . (int) $id . '.', xf_ig_tab_url('queue') . '#xf-ig-row-' . (int) $id);
});

/* ---- Create tab: queue a finished post uploaded by the owner ---- */

add_action('admin_post_xf_ig_upload', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_upload')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $back = xf_ig_tab_url('create');
    $f = $_FILES['slides'] ?? null; // phpcs:ignore -- each file is validated below
    $title = sanitize_text_field(wp_unslash($_POST['title'] ?? ''));
    $caption = sanitize_textarea_field(wp_unslash($_POST['caption'] ?? ''));
    if (!$f || !is_array($f['name']) || $title === '' || $caption === '') {
        xf_ig_redirect('Add a title, a caption and at least one slide.', $back);
    }
    $order = $f['name'];
    natcasesort($order); // slide-1, slide-2 … slide-10
    if (count($order) > 10) {
        xf_ig_redirect('Instagram allows at most 10 slides.', $back);
    }
    $up = wp_upload_dir();
    $dir = 'xf-ig-uploads/';
    if (!wp_mkdir_p($up['basedir'] . '/' . $dir)) {
        xf_ig_redirect('Could not create uploads/xf-ig-uploads/.', $back);
    }
    if (!file_exists($up['basedir'] . '/' . $dir . 'index.php')) {
        file_put_contents($up['basedir'] . '/' . $dir . 'index.php', "<?php\n// Silence is golden.\n");
    }
    $files = [];
    foreach (array_keys($order) as $i) {
        $tmp = (string) $f['tmp_name'][$i];
        if ((int) $f['error'][$i] !== UPLOAD_ERR_OK || !is_uploaded_file($tmp) || (int) $f['size'][$i] > 12 * MB_IN_BYTES) {
            xf_ig_redirect('A slide failed to upload or is over 12 MB.', $back);
        }
        $info = @getimagesize($tmp);
        $type = $info[2] ?? 0;
        $img = $type === IMAGETYPE_JPEG ? @imagecreatefromjpeg($tmp) : ($type === IMAGETYPE_PNG ? @imagecreatefrompng($tmp) : null);
        if (!$img) {
            xf_ig_redirect('Slides must be JPEG or PNG images.', $back);
        }
        // Instagram takes JPEG only: flatten onto the brand background and re-encode.
        $out = imagecreatetruecolor(imagesx($img), imagesy($img));
        imagefill($out, 0, 0, imagecolorallocate($out, 11, 11, 12));
        imagecopy($out, $img, 0, 0, 0, 0, imagesx($img), imagesy($img));
        $name = $dir . bin2hex(random_bytes(12)) . '.jpg';
        $ok = imagejpeg($out, $up['basedir'] . '/' . $name, 92);
        imagedestroy($img);
        imagedestroy($out);
        if (!$ok) {
            xf_ig_redirect('Could not save a slide.', $back);
        }
        $files[] = $name;
    }
    $collab = array_slice(array_values(array_filter(array_map(function ($h) { return preg_replace('/[^A-Za-z0-9._]/', '', ltrim(trim($h), '@')); }, explode(',', (string) wp_unslash($_POST['collaborators'] ?? '')) ))), 0, 3);
    $id = xf_ig_upsert('upload', 'upload:' . bin2hex(random_bytes(6)), $title, $caption, count($files), ['files' => $files, 'collaborators' => $collab, 'uploaded_by' => wp_get_current_user()->user_login]);
    xf_ig_redirect('Queued upload #' . (int) $id . ' (' . count($files) . ' slides). Approve it, then post.', xf_ig_tab_url('queue') . '#xf-ig-row-' . (int) $id);
});
