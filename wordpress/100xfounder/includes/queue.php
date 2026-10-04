<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Content queue + draft inbox for the Claude Code writing skills.
 * Skills authenticate with a WordPress Application Password belonging to a
 * user with the Author role, read queued topics, and upload drafts that
 * always land as "Pending review". Nothing here can publish.
 * ---------------------------------------------------------------------- */

function xf_queue_types() {
    return [
        'news' => 'Startup / funding news',
        'ai-news' => 'AI news',
        'round' => 'Funding round (tracker)',
        'founder' => 'Founder profile',
        'apply-guide' => 'How to apply guide',
        'ai-tool' => 'AI tool profile',
        'long-read' => 'Long read / blog',
    ];
}

function xf_queue_add($type, $title, $notes = '', $source_urls = [], $priority = 5) {
    global $wpdb;
    $wpdb->insert(xf_table('queue'), [
        'type' => array_key_exists($type, xf_queue_types()) ? $type : 'news',
        'title' => mb_substr(sanitize_text_field($title), 0, 250),
        'notes' => sanitize_textarea_field($notes),
        'source_urls' => implode("\n", array_filter(array_map('esc_url_raw', (array) $source_urls))),
        'priority' => max(1, min(9, (int) $priority)),
        'status' => 'queued',
        'created_at' => xf_now(),
        'updated_at' => xf_now(),
    ]);
    return (int) $wpdb->insert_id;
}

function xf_queue_item_to_array($row) {
    return [
        'id' => (int) $row->id,
        'type' => $row->type,
        'title' => $row->title,
        'notes' => $row->notes,
        'source_urls' => array_values(array_filter(explode("\n", (string) $row->source_urls))),
        'priority' => (int) $row->priority,
        'status' => $row->status,
        'created_at' => $row->created_at,
    ];
}

/** Creates a pending draft from a skill's payload. Returns the post ID or WP_Error. */
function xf_create_draft(array $d, $author_id) {
    $type = in_array($d['type'] ?? 'post', ['post', 'xf_round', 'xf_event'], true) ? $d['type'] : 'post';
    $title = sanitize_text_field((string) ($d['title'] ?? ''));
    $content = wp_kses_post((string) ($d['content'] ?? ''));
    if (mb_strlen($title) < 8 || ($type === 'post' && str_word_count(wp_strip_all_tags($content)) < 150)) {
        return new WP_Error('too_short', 'A draft needs a real title and at least 150 words.', ['status' => 400]);
    }
    $sources = isset($d['sources']) && is_array($d['sources']) ? $d['sources'] : [];
    if ($type === 'post' && !array_filter($sources, function ($s) { return !empty($s['url']); })) {
        return new WP_Error('no_sources', 'Drafts must include at least one source.', ['status' => 400]);
    }

    $postarr = [
        'post_type' => $type,
        'post_status' => 'pending',
        'post_author' => $author_id,
        'post_title' => $title,
        'post_content' => $content,
        'post_excerpt' => sanitize_text_field((string) ($d['excerpt'] ?? '')),
    ];
    if ($type === 'post') {
        $cat = get_term_by('slug', sanitize_title((string) ($d['category'] ?? 'startup-news')), 'category');
        $postarr['post_category'] = $cat ? [$cat->term_id] : [];
        $postarr['tags_input'] = array_map('sanitize_text_field', array_slice((array) ($d['tags'] ?? []), 0, 8));
    }
    $post_id = wp_insert_post($postarr, true);
    if (is_wp_error($post_id)) {
        return $post_id;
    }

    xf_save_sources($post_id, $sources);
    update_post_meta($post_id, '_xf_drafted_by', 'claude-skill');
    if (!empty($d['original_url'])) update_post_meta($post_id, '_xf_original_url', esc_url_raw($d['original_url']));
    if (!empty($d['image_credit'])) update_post_meta($post_id, '_xf_image_credit', sanitize_text_field($d['image_credit']));
    foreach ((array) ($d['fields'] ?? []) as $key => $value) {
        // Structured fields for rounds and events (company, round, amount_usd, start, city…).
        update_post_meta($post_id, '_xf_' . sanitize_key($key), sanitize_text_field((string) $value));
    }
    if (!empty($d['image_url']) && wp_http_validate_url($d['image_url'])) {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        $attachment = function_exists('xf_sideload_image') ? xf_sideload_image($d['image_url'], $post_id, $title) : 0;
        if ($attachment) {
            set_post_thumbnail($post_id, $attachment);
        }
    }
    if (!empty($d['queue_id'])) {
        global $wpdb;
        $wpdb->update(xf_table('queue'), ['status' => 'drafted', 'post_id' => $post_id, 'updated_at' => xf_now()], ['id' => (int) $d['queue_id']]);
    }
    return $post_id;
}

add_action('rest_api_init', function () {
    $can_write = function () {
        return current_user_can('edit_posts');
    };

    register_rest_route('xf/v1', '/queue', [
        [
            'methods' => 'GET',
            'permission_callback' => $can_write,
            'callback' => function (WP_REST_Request $r) {
                global $wpdb;
                $type = sanitize_key((string) $r['type']);
                $limit = max(1, min(20, (int) ($r['limit'] ?: 5)));
                $sql = 'SELECT * FROM ' . xf_table('queue') . " WHERE status = 'queued'" . ($type ? $wpdb->prepare(' AND type = %s', $type) : '') . ' ORDER BY priority ASC, created_at ASC LIMIT ' . $limit;
                return array_map('xf_queue_item_to_array', $wpdb->get_results($sql)); // phpcs:ignore
            },
        ],
        [
            'methods' => 'POST',
            'permission_callback' => $can_write,
            'callback' => function (WP_REST_Request $r) {
                $id = xf_queue_add((string) $r['type'], (string) $r['title'], (string) $r['notes'], (array) $r['source_urls'], (int) ($r['priority'] ?: 5));
                return ['id' => $id];
            },
        ],
    ]);

    register_rest_route('xf/v1', '/drafts', [
        'methods' => 'POST',
        'permission_callback' => $can_write,
        'callback' => function (WP_REST_Request $r) {
            $post_id = xf_create_draft((array) $r->get_json_params(), get_current_user_id());
            if (is_wp_error($post_id)) {
                return $post_id;
            }
            return ['id' => $post_id, 'status' => 'pending', 'edit_url' => admin_url('post.php?post=' . $post_id . '&action=edit'), 'preview_url' => get_preview_post_link($post_id)];
        },
    ]);

    /** Recent titles so skills don't duplicate stories we already have. */
    register_rest_route('xf/v1', '/recent', [
        'methods' => 'GET',
        'permission_callback' => $can_write,
        'callback' => function (WP_REST_Request $r) {
            $days = max(1, min(30, (int) ($r['days'] ?: 3)));
            $posts = get_posts(['post_type' => ['post', 'xf_round', 'xf_event'], 'post_status' => ['publish', 'pending', 'draft', 'future'], 'posts_per_page' => 200, 'date_query' => [['after' => $days . ' days ago']]]);
            return array_map(function ($p) {
                return ['id' => $p->ID, 'type' => $p->post_type, 'status' => $p->post_status, 'title' => get_the_title($p), 'url' => get_permalink($p), 'date' => $p->post_date_gmt];
            }, $posts);
        },
    ]);

    /** Categories the skills may file under. */
    register_rest_route('xf/v1', '/categories', [
        'methods' => 'GET',
        'permission_callback' => $can_write,
        'callback' => function () {
            return array_map(function ($t) { return ['slug' => $t->slug, 'name' => $t->name]; }, get_terms(['taxonomy' => 'category', 'hide_empty' => false]));
        },
    ]);
});

/* ---- Admin: Content queue page ---- */

add_action('admin_menu', function () {
    add_submenu_page('xf', 'Content queue', 'Content queue', 'edit_posts', 'xf-queue', 'xf_admin_queue_page');
}, 15);

add_action('admin_post_xf_queue_add', function () {
    if (!current_user_can('edit_posts') || !check_admin_referer('xf_queue_add')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    xf_queue_add(
        sanitize_key(wp_unslash($_POST['type'] ?? 'news')),
        wp_unslash($_POST['title'] ?? ''),
        wp_unslash($_POST['notes'] ?? ''),
        preg_split('/\R/', (string) wp_unslash($_POST['source_urls'] ?? '')),
        (int) ($_POST['priority'] ?? 5)
    );
    wp_safe_redirect(admin_url('admin.php?page=xf-queue&added=1'));
    exit;
});

add_action('admin_post_xf_queue_status', function () {
    if (!current_user_can('edit_posts') || !check_admin_referer('xf_queue_status')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    global $wpdb;
    $status = in_array($_GET['status'] ?? '', ['queued', 'skipped'], true) ? sanitize_key($_GET['status']) : 'skipped';
    $wpdb->update(xf_table('queue'), ['status' => $status, 'updated_at' => xf_now()], ['id' => absint($_GET['id'] ?? 0)]);
    wp_safe_redirect(admin_url('admin.php?page=xf-queue'));
    exit;
});

function xf_admin_queue_page() {
    global $wpdb;
    $rows = $wpdb->get_results('SELECT * FROM ' . xf_table('queue') . " ORDER BY FIELD(status,'queued','drafted','skipped'), priority ASC, created_at DESC LIMIT 100");
    ?>
    <div class="wrap">
        <h1>Content queue</h1>
        <p>Topics waiting to be written. The Claude Code skills (e.g. <code>/write-news</code>) take the next items, research them, and upload drafts as <strong>Pending review</strong> for you to edit and publish.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="card" style="max-width:none">
            <input type="hidden" name="action" value="xf_queue_add">
            <?php wp_nonce_field('xf_queue_add'); ?>
            <h2>Add a topic</h2>
            <p><select name="type"><?php foreach (xf_queue_types() as $k => $label) echo '<option value="' . esc_attr($k) . '">' . esc_html($label) . '</option>'; ?></select>
                <input name="title" class="regular-text" required placeholder="e.g. Zepto raises Series G">
                <select name="priority"><?php foreach ([1 => 'Urgent', 3 => 'High', 5 => 'Normal', 8 => 'Low'] as $v => $l) echo '<option value="' . (int) $v . '"' . selected($v, 5, false) . '>' . esc_html($l) . '</option>'; ?></select></p>
            <p><textarea name="notes" class="large-text" rows="2" placeholder="Angle, what to cover, who to mention"></textarea></p>
            <p><textarea name="source_urls" class="large-text" rows="2" placeholder="Source URLs, one per line"></textarea></p>
            <p><button class="button button-primary">Add to queue</button></p>
        </form>
        <table class="widefat striped" style="margin-top:16px">
            <thead><tr><th>Type</th><th>Topic</th><th>Priority</th><th>Status</th><th>Draft</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($rows as $r) : ?>
                <tr>
                    <td><?php echo esc_html(xf_queue_types()[$r->type] ?? $r->type); ?></td>
                    <td><strong><?php echo esc_html($r->title); ?></strong><?php if ($r->notes) echo '<br><span class="description">' . esc_html($r->notes) . '</span>'; ?></td>
                    <td><?php echo (int) $r->priority; ?></td>
                    <td><?php echo esc_html($r->status); ?></td>
                    <td><?php echo $r->post_id ? '<a href="' . esc_url(get_edit_post_link((int) $r->post_id)) . '">Review draft</a>' : '—'; ?></td>
                    <td><?php if ($r->status === 'queued') : ?><a href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=xf_queue_status&status=skipped&id=' . (int) $r->id), 'xf_queue_status')); ?>">Skip</a><?php endif; ?></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$rows) : ?><tr><td colspan="6">The queue is empty.</td></tr><?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}
