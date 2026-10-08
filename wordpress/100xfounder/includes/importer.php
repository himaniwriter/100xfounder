<?php
if (!defined('ABSPATH')) {
    exit;
}

const XF_IMPORT_BATCH = 150;

function xf_seed_startups() {
    $data = json_decode((string) file_get_contents(XF_DIR . 'data/startups.json'), true);
    return is_array($data) ? $data : [];
}

/**
 * Imports the next batch of the bundled startup directory. Returns progress.
 * Imported listings start noindexed (thin) until they gain real content.
 */
function xf_import_startups_batch() {
    $rows = xf_seed_startups();
    $offset = (int) get_option('xf_import_offset', 0);
    $batch = array_slice($rows, $offset, XF_IMPORT_BATCH);
    wp_defer_term_counting(true);
    foreach ($batch as $row) {
        if (xf_find_startup_by_external_id('seed:' . $row['slug'])) {
            continue;
        }
        $post_id = wp_insert_post([
            'post_type' => 'xf_startup',
            'post_status' => 'publish',
            'post_title' => $row['name'],
            'post_name' => $row['slug'],
            'post_excerpt' => $row['summary'] ?? '',
            // A fixed past date keeps real launches first; the directory then sorts A→Z.
            'post_date' => '2024-01-01 00:00:00',
            'post_content' => isset($row['summary']) ? wpautop(esc_html($row['summary'])) : '',
            'meta_input' => [
                '_xf_source' => 'seed',
                '_xf_external_id' => 'seed:' . $row['slug'],
                '_xf_tagline' => $row['summary'] ?? '',
                '_xf_founder_name' => $row['founder'] ?? '',
                '_xf_founded' => $row['founded'] ?? '',
                '_xf_hq' => $row['hq'] ?? '',
                '_xf_funding' => $row['funding'] ?? '',
                '_xf_employees' => $row['employees'] ?? '',
                '_xf_website' => $row['website'] ?? '',
                '_xf_linkedin' => $row['linkedin'] ?? '',
                '_xf_twitter' => $row['twitter'] ?? '',
                '_xf_indexable' => '0',
            ],
        ], true);
        if (is_wp_error($post_id)) {
            continue;
        }
        if (!empty($row['industry'])) wp_set_object_terms($post_id, $row['industry'], 'xf_industry');
        if (!empty($row['stage'])) wp_set_object_terms($post_id, $row['stage'], 'xf_stage');
    }
    wp_defer_term_counting(false);
    $offset = min($offset + XF_IMPORT_BATCH, count($rows));
    update_option('xf_import_offset', $offset, false);
    return ['done' => $offset, 'total' => count($rows)];
}

/** Maps the old site's blog categories onto the new news sections. */
function xf_map_old_category($category) {
    $map = [
        'Funding' => 'funding', 'US Funding' => 'funding', 'VC' => 'funding', 'IPO' => 'funding', 'M&A' => 'funding',
        'Exclusive' => 'in-depth', 'Fintrackr' => 'startup-news', 'US Fintech' => 'startup-news', 'Global GTM' => 'startup-news',
    ];
    return $map[$category] ?? 'startup-news';
}

/** Imports the old blog posts as drafts, so each can be reviewed before publishing. */
function xf_import_blog_posts() {
    $posts = json_decode((string) file_get_contents(XF_DIR . 'data/blog-posts.json'), true) ?: [];
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $created = 0;
    foreach ($posts as $p) {
        if (get_page_by_path($p['slug'], OBJECT, 'post')) {
            continue;
        }
        $cat = get_term_by('slug', xf_map_old_category($p['category'] ?? ''), 'category');
        $post_id = wp_insert_post([
            'post_type' => 'post',
            'post_status' => 'draft',
            'post_title' => $p['title'],
            'post_name' => $p['slug'],
            'post_excerpt' => $p['excerpt'] ?? '',
            'post_content' => wp_kses_post($p['content'] ?? ''),
            'post_date' => !empty($p['publishedAt']) ? gmdate('Y-m-d H:i:s', strtotime($p['publishedAt'])) : current_time('mysql'),
            'post_category' => $cat ? [$cat->term_id] : [],
        ], true);
        if (is_wp_error($post_id)) {
            continue;
        }
        if (!empty($p['thumbnail'])) {
            $attachment = xf_sideload_image(add_query_arg(['w' => 1200, 'fm' => 'jpg', 'q' => 80], $p['thumbnail']), $post_id, $p['title']);
            if ($attachment) {
                set_post_thumbnail($post_id, $attachment);
            }
        }
        $created++;
    }
    return ['created' => $created, 'total' => count($posts)];
}

/**
 * media_sideload_image() rejects URLs without an image extension (e.g. Unsplash),
 * so download first and name the file ourselves.
 */
function xf_sideload_image($url, $post_id, $title) {
    $tmp = download_url($url, 20);
    if (is_wp_error($tmp)) {
        return 0;
    }
    // Keep the source's real extension (Commons thumbnails are often .png); WordPress rejects a mismatch.
    $ext = strtolower(pathinfo((string) wp_parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
    $ext = in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true) ? $ext : 'jpg';
    $file = ['name' => sanitize_file_name(mb_substr(sanitize_title($title) ?: 'image', 0, 80)) . '.' . $ext, 'tmp_name' => $tmp];
    $id = media_handle_sideload($file, $post_id, $title);
    if (is_wp_error($id)) {
        @unlink($tmp);
        return 0;
    }
    return (int) $id;
}
