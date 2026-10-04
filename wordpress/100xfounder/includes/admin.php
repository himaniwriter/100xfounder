<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', function () {
    add_menu_page('100xFounder', '100xFounder', 'manage_options', 'xf', 'xf_admin_dashboard', 'dashicons-rocket', 3);
    add_submenu_page('xf', 'Dashboard', 'Dashboard', 'manage_options', 'xf', 'xf_admin_dashboard');
    add_submenu_page('xf', 'Settings', 'Settings', 'manage_options', 'xf-settings', 'xf_admin_settings');
    add_submenu_page('xf', 'Import data', 'Import data', 'manage_options', 'xf-import', 'xf_admin_import');
});

function xf_admin_action_url($action, array $args = []) {
    return wp_nonce_url(add_query_arg(array_merge(['action' => 'xf_admin', 'do' => $action], $args), admin_url('admin-post.php')), 'xf_admin_' . $action);
}

/** All dashboard buttons route through here. */
add_action('admin_post_xf_admin', function () {
    $do = isset($_GET['do']) ? sanitize_key(wp_unslash($_GET['do'])) : '';
    if (!current_user_can('manage_options') || !check_admin_referer('xf_admin_' . $do)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    global $wpdb;
    $id = isset($_GET['id']) ? absint($_GET['id']) : 0;
    $back = admin_url('admin.php?page=xf');
    $notice = '';

    switch ($do) {
        case 'run':
            $stage = isset($_GET['stage']) ? sanitize_key(wp_unslash($_GET['stage'])) : '';
            xf_run_pipeline($stage ? [$stage] : []);
            $notice = 'Routine finished. See "Last run" below.';
            break;
        case 'ig_posted':
        case 'ig_skipped':
        case 'ig_ready':
            $status = substr($do, 3);
            $wpdb->update(xf_table('ig_queue'), ['status' => $status, 'posted_at' => $status === 'posted' ? xf_now() : null, 'updated_at' => xf_now()], ['id' => $id]);
            break;
        case 'stop_contact':
            $wpdb->update(xf_table('contacts'), ['status' => 'paused', 'next_send_at' => null, 'updated_at' => xf_now()], ['id' => $id]);
            break;
        case 'set_home':
            $pages = get_option('xf_pages', []);
            update_option('show_on_front', 'page');
            update_option('page_on_front', $pages['home'] ?? 0);
            $notice = 'The 100xFounder home page is now your front page.';
            break;
        case 'import_startups':
            $progress = xf_import_startups_batch();
            $back = admin_url('admin.php?page=xf-import');
            if ($progress['done'] < $progress['total']) {
                // Continue with the next batch automatically.
                $back = add_query_arg('continue', 1, $back);
            }
            $notice = sprintf('Imported %d of %d startups.', $progress['done'], $progress['total']);
            break;
        case 'import_posts':
            $result = xf_import_blog_posts();
            $back = admin_url('admin.php?page=xf-import');
            $notice = sprintf('Imported %d blog posts as drafts. Review them under Posts.', $result['created']);
            break;
        case 'new_cron_key':
            xf_update_settings(['cron_key' => wp_generate_password(32, false)]);
            $back = admin_url('admin.php?page=xf-settings');
            $notice = 'New cron key generated. Update your hPanel cron job.';
            break;
    }
    if ($notice) {
        set_transient('xf_notice_' . get_current_user_id(), $notice, 60);
    }
    wp_safe_redirect($back);
    exit;
});

add_action('admin_notices', function () {
    $key = 'xf_notice_' . get_current_user_id();
    $notice = get_transient($key);
    if ($notice) {
        delete_transient($key);
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($notice) . '</p></div>';
    }
});

function xf_status_row($ok, $label, $fix = '') {
    printf(
        '<li>%s %s%s</li>',
        $ok ? '<span style="color:#16a34a">✔</span>' : '<span style="color:#d97706">✖</span>',
        esc_html($label),
        !$ok && $fix ? ' <span class="description">(' . wp_kses_post($fix) . ')</span>' : ''
    );
}

function xf_admin_dashboard() {
    global $wpdb;
    $s = xf_get_settings();
    $contacts = xf_table('contacts');
    $by_status = $wpdb->get_results("SELECT status, COUNT(*) n FROM $contacts GROUP BY status", OBJECT_K);
    $sent_24h = (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM ' . xf_table('messages') . " WHERE status = 'sent' AND sent_at >= %s", gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS)));
    $queue = $wpdb->get_results('SELECT * FROM ' . xf_table('ig_queue') . " ORDER BY FIELD(status,'ready','posted','skipped'), created_at DESC LIMIT 12");
    $recent = $wpdb->get_results("SELECT * FROM $contacts ORDER BY updated_at DESC LIMIT 40");
    $pending = (int) wp_count_posts('xf_spotlight')->pending;
    $last_run = get_option('xf_last_run');
    $next = wp_next_scheduled('xf_daily_growth');
    $pages = get_option('xf_pages', []);
    ?>
    <div class="wrap">
        <h1>100xFounder</h1>
        <p>Daily routine: import Product Hunt launches → find founder contacts → check replies → send outreach → queue Instagram posts.</p>

        <div class="card" style="max-width:none">
            <h2>Setup</h2>
            <ul>
                <?php
                xf_status_row((bool) $s['ph_token'], 'Product Hunt token', '<a href="' . esc_url(admin_url('admin.php?page=xf-settings')) . '">add in Settings</a>');
                xf_status_row(xf_smtp_configured(), 'Outreach mailbox (Hostinger SMTP)', 'add in Settings');
                xf_status_row(trim($s['postal_address']) !== '', 'Postal address for emails', 'required by anti-spam law');
                xf_status_row(!empty($s['outreach_enabled']), 'Outreach sending turned on');
                xf_status_row(function_exists('imap_open'), 'PHP imap extension (reply detection)', 'hPanel → Advanced → PHP Configuration → Extensions → imap');
                xf_status_row((bool) xf_adsense_client(), 'Google AdSense');
                xf_status_row((int) get_option('page_on_front') === (int) ($pages['home'] ?? -1), 'Home page set', '<a href="' . esc_url(xf_admin_action_url('set_home')) . '">use the 100xFounder home page</a>');
                ?>
            </ul>
            <p>Next automatic run: <strong><?php echo $next ? esc_html(wp_date('M j, H:i', $next)) : 'not scheduled'; ?></strong>.
                For reliability add an hPanel cron job (see Settings).</p>
            <p>
                <a class="button button-primary" href="<?php echo esc_url(xf_admin_action_url('run')); ?>">Run full routine now</a>
                <?php foreach (array_keys(xf_pipeline_stages()) as $stage) : ?>
                    <a class="button" href="<?php echo esc_url(xf_admin_action_url('run', ['stage' => $stage])); ?>">Run <?php echo esc_html($stage); ?></a>
                <?php endforeach; ?>
            </p>
            <?php if ($last_run) : ?>
                <h3>Last run: <?php echo esc_html(wp_date('M j, H:i', $last_run['at'])); ?></h3>
                <ul>
                    <?php foreach ($last_run['results'] as $stage => $r) : ?>
                        <li><strong><?php echo esc_html($stage); ?>:</strong>
                            <?php echo $r['ok'] ? esc_html(wp_json_encode($r['result'])) : '<span style="color:#dc2626">' . esc_html($r['error']) . '</span>'; ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </div>

        <div class="card" style="max-width:none">
            <h2>Outreach</h2>
            <p>Sent in the last 24h: <strong><?php echo (int) $sent_24h; ?></strong> / <?php echo (int) $s['daily_limit']; ?> daily limit ·
                <?php foreach ($by_status as $status => $row) echo esc_html("$status: {$row->n}") . ' · '; ?>
                <a href="<?php echo esc_url(admin_url('edit.php?post_type=xf_spotlight&post_status=pending')); ?>"><?php echo (int) $pending; ?> spotlight(s) awaiting review</a></p>
            <table class="widefat striped">
                <thead><tr><th>Startup</th><th>Email</th><th>Status</th><th>Emails sent</th><th>Next send</th><th></th></tr></thead>
                <tbody>
                <?php foreach ($recent as $c) : ?>
                    <tr>
                        <td><a href="<?php echo esc_url(get_edit_post_link($c->startup_id)); ?>"><?php echo esc_html(get_the_title($c->startup_id)); ?></a></td>
                        <td><?php echo esc_html($c->email); ?></td>
                        <td><?php echo esc_html($c->status); ?></td>
                        <td><?php echo (int) $c->step; ?></td>
                        <td><?php echo $c->next_send_at ? esc_html(get_date_from_gmt($c->next_send_at, 'M j, H:i')) : '—'; ?></td>
                        <td><?php if (in_array($c->status, ['queued', 'contacted'], true)) : ?><a href="<?php echo esc_url(xf_admin_action_url('stop_contact', ['id' => $c->id])); ?>">Stop</a><?php endif; ?></td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$recent) : ?><tr><td colspan="6">No contacts yet.</td></tr><?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="card" style="max-width:none">
            <h2>Instagram queue</h2>
            <p>Download the slides, copy the caption, post on Instagram, then mark it posted.</p>
            <?php foreach ($queue as $item) : ?>
                <div style="border-top:1px solid #ddd;padding:12px 0">
                    <strong><?php echo esc_html($item->title); ?></strong> <em>(<?php echo esc_html($item->status); ?>)</em>
                    <a class="button button-small" href="<?php echo esc_url(xf_admin_action_url('ig_posted', ['id' => $item->id])); ?>">Mark posted</a>
                    <a class="button button-small" href="<?php echo esc_url(xf_admin_action_url('ig_skipped', ['id' => $item->id])); ?>">Skip</a>
                    <div style="display:flex;gap:8px;overflow-x:auto;margin:8px 0">
                        <?php for ($n = 0; $n < (int) $item->slide_count; $n++) : ?>
                            <a href="<?php echo esc_url(xf_slide_url($item->id, $n, true)); ?>" title="Download slide <?php echo (int) $n + 1; ?>">
                                <img src="<?php echo esc_url(xf_slide_url($item->id, $n)); ?>" width="128" height="160" loading="lazy" style="border-radius:4px;border:1px solid #ddd" alt="">
                            </a>
                        <?php endfor; ?>
                    </div>
                    <textarea readonly rows="6" class="large-text" onclick="this.select()"><?php echo esc_textarea($item->caption); ?></textarea>
                </div>
            <?php endforeach; ?>
            <?php if (!$queue) : ?><p>Nothing queued yet.</p><?php endif; ?>
        </div>
    </div>
    <?php
}

/** Fields shown on the Settings page: key => [label, type, help]. */
function xf_settings_fields() {
    return [
        'Product Hunt' => [
            'ph_token' => ['Developer token', 'secret', 'Create an app at producthunt.com/v2/oauth/applications and copy its Developer Token.'],
            'ph_top_n' => ['Top N by votes', 'number', ''],
            'ph_top_featured_rank' => ['Top featured rank', 'number', ''],
            'ph_vote_threshold' => ['Vote threshold', 'number', 'Also import any launch with at least this many upvotes.'],
        ],
        'Outreach email (Hostinger)' => [
            'outreach_enabled' => ['Send outreach emails', 'checkbox', 'Automatic 3-email sequence. Leave off until the mailbox is set up.'],
            'smtp_user' => ['Mailbox address', 'text', 'e.g. hello@100xfounder.com (hPanel → Emails).'],
            'smtp_pass' => ['Mailbox password', 'secret', 'Leave blank to keep the saved password.'],
            'smtp_host' => ['SMTP host', 'text', ''],
            'smtp_port' => ['SMTP port', 'number', '465 (SSL) for Hostinger.'],
            'imap_host' => ['IMAP host', 'text', 'Used to detect replies and bounces.'],
            'imap_port' => ['IMAP port', 'number', ''],
            'from_name' => ['From name', 'text', 'Your name reads better than a brand in cold email.'],
            'from_email' => ['From address', 'text', 'Defaults to the mailbox address.'],
            'reply_to' => ['Reply-to address', 'text', 'Optional.'],
            'postal_address' => ['Postal address', 'text', 'Required in every email by CAN-SPAM. Sending stays off until set.'],
            'daily_limit' => ['Daily sending limit', 'number', 'Start at 10 and raise slowly to 30–50.'],
            'followup_1_days' => ['Days before follow-up 1', 'number', ''],
            'followup_2_days' => ['Days before follow-up 2', 'number', 'Counted from follow-up 1.'],
        ],
        'Spotlights & Instagram' => [
            'auto_publish' => ['Auto-publish spotlights', 'checkbox', 'Otherwise each submission waits for your review under Founder Spotlights → Pending.'],
            'instagram_handle' => ['Instagram handle', 'text', 'Without the @.'],
        ],
        'Events' => [
            'event_feeds' => ['Public event calendars (ICS)', 'textarea', 'One iCal/ICS URL per line, e.g. a Luma calendar or a Meetup group feed. New events are imported daily as Pending for your review.'],
        ],
        'Jobs' => [
            'google_service_account' => ['Google Indexing API key (JSON)', 'secret_textarea', 'Optional. Paste the JSON key of a Google Cloud service account that is an Owner in Search Console. New and removed jobs are then sent to Google within minutes (job pages only, as Google allows). Leave blank to keep the saved key.'],
        ],
        'Search & social' => [
            'gsc_verification' => ['Google Search Console code', 'text', 'Only the content="…" value of the verification meta tag.'],
            'bing_verification' => ['Bing Webmaster code', 'text', ''],
            'ga4_id' => ['Google Analytics 4 ID', 'text', 'e.g. G-XXXXXXX. Not loaded for logged-in users.'],
            'indexnow_enabled' => ['Ping IndexNow on publish', 'checkbox', 'Tells Bing and other IndexNow engines about new and updated pages within minutes.'],
            'instagram_url' => ['Instagram URL', 'text', ''],
            'linkedin_url' => ['LinkedIn URL', 'text', ''],
            'x_url' => ['X (Twitter) URL', 'text', ''],
            'logo_url' => ['Logo image URL (for Google)', 'text', 'Square PNG, at least 112×112.'],
            'default_social_image' => ['Default share image URL', 'text', 'Used when a page has no image. 1200×630.'],
        ],
        'Google AdSense' => [
            'adsense_client' => ['Publisher ID', 'text', 'ca-pub-… The AdSense script is added to the head of content pages, and /ads.txt is served automatically.'],
            'adsense_slot' => ['In-content ad slot ID', 'text', 'Optional. Create a Display ad unit in AdSense and paste its slot ID for fixed placements. Without it, Auto ads choose placements.'],
            'footer_links' => ['Show footer legal links', 'checkbox', 'About, Contact, Privacy, Terms, Disclaimer. Turn off if your theme footer already links them.'],
        ],
    ];
}

add_action('admin_post_xf_save_settings', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_save_settings')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $values = [];
    foreach (xf_settings_fields() as $fields) {
        foreach ($fields as $key => [$label, $type]) {
            $raw = isset($_POST[$key]) ? wp_unslash($_POST[$key]) : '';
            if ($type === 'checkbox') {
                $values[$key] = $raw ? 1 : 0;
            } elseif ($type === 'textarea') {
                $values[$key] = sanitize_textarea_field($raw);
            } elseif ($type === 'secret_textarea') {
                if (trim($raw) !== '') {
                    $values[$key] = trim($raw);
                }
            } elseif ($type === 'number') {
                $values[$key] = absint($raw);
            } elseif ($type === 'secret') {
                if ($raw !== '') {
                    $values[$key] = trim($raw);
                }
            } else {
                $values[$key] = sanitize_text_field($raw);
            }
        }
    }
    xf_update_settings($values);
    set_transient('xf_notice_' . get_current_user_id(), 'Settings saved.', 60);
    wp_safe_redirect(admin_url('admin.php?page=xf-settings'));
    exit;
});

function xf_admin_settings() {
    $s = xf_get_settings();
    $cron_url = add_query_arg('key', $s['cron_key'], rest_url('xf/v1/run'));
    ?>
    <div class="wrap">
        <h1>100xFounder settings</h1>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="xf_save_settings">
            <?php wp_nonce_field('xf_save_settings'); ?>
            <?php foreach (xf_settings_fields() as $section => $fields) : ?>
                <h2><?php echo esc_html($section); ?></h2>
                <table class="form-table" role="presentation">
                    <?php foreach ($fields as $key => [$label, $type, $help]) : ?>
                        <tr>
                            <th scope="row"><label for="xf_<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></label></th>
                            <td>
                                <?php if ($type === 'checkbox') : ?>
                                    <input type="checkbox" id="xf_<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>" value="1" <?php checked(!empty($s[$key])); ?>>
                                <?php elseif ($type === 'secret_textarea') : ?>
                                    <textarea class="large-text code" rows="3" id="xf_<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>" placeholder="<?php echo $s[$key] ? '(saved; paste a new key to replace it)' : ''; ?>"></textarea>
                                <?php elseif ($type === 'textarea') : ?>
                                    <textarea class="large-text" rows="4" id="xf_<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>"><?php echo esc_textarea($s[$key]); ?></textarea>
                                <?php elseif ($type === 'secret') : ?>
                                    <input type="password" class="regular-text" id="xf_<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>" value="" autocomplete="new-password" placeholder="<?php echo $s[$key] ? '•••••••• (saved)' : ''; ?>">
                                <?php else : ?>
                                    <input type="<?php echo $type === 'number' ? 'number' : 'text'; ?>" class="regular-text" id="xf_<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>" value="<?php echo esc_attr($s[$key]); ?>">
                                <?php endif; ?>
                                <?php if ($help) : ?><p class="description"><?php echo esc_html($help); ?></p><?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php endforeach; ?>
            <?php submit_button(); ?>
        </form>

        <h2>Daily schedule (hPanel cron job)</h2>
        <p>WordPress only runs scheduled tasks when someone visits the site. For a reliable daily run, add this in hPanel → Advanced → Cron Jobs, set to run once a day (e.g. 14:00):</p>
        <p><code>wget -q -O /dev/null "<?php echo esc_html($cron_url); ?>"</code></p>
        <p><a class="button" href="<?php echo esc_url(xf_admin_action_url('new_cron_key')); ?>">Generate a new key</a></p>
    </div>
    <?php
}

function xf_admin_import() {
    $total = count(xf_seed_startups());
    $done = (int) get_option('xf_import_offset', 0);
    $continue = isset($_GET['continue']) && $done < $total;
    ?>
    <div class="wrap">
        <h1>Import data from the old site</h1>
        <div class="card">
            <h2>Startup directory (<?php echo (int) $total; ?> startups)</h2>
            <p>Imported: <strong><?php echo (int) $done; ?></strong> / <?php echo (int) $total; ?>. Imported listings are hidden from Google until they get real content, so they don't count as thin pages.</p>
            <?php if ($continue) : ?>
                <p>Importing next batch…</p>
                <script>setTimeout(function () { window.location.href = <?php echo wp_json_encode(xf_admin_action_url('import_startups')); ?>.replace(/&amp;/g, '&'); }, 500);</script>
            <?php elseif ($done < $total) : ?>
                <a class="button button-primary" href="<?php echo esc_url(xf_admin_action_url('import_startups')); ?>">Import startups</a>
            <?php else : ?>
                <p>✔ All startups imported.</p>
            <?php endif; ?>
        </div>
        <div class="card">
            <h2>Blog posts (15)</h2>
            <p>Imported as <strong>drafts</strong> with their featured images, so you can review and publish the good ones.</p>
            <a class="button" href="<?php echo esc_url(xf_admin_action_url('import_posts')); ?>">Import blog posts</a>
        </div>
    </div>
    <?php
}
