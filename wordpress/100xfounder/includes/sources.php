<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Sources: every article stores where its facts come from. They render as a
 * "Sources" block, feed NewsArticle `citation` schema and are reused by the
 * founder verification emails. Posts can't be published without one.
 * ---------------------------------------------------------------------- */

const XF_SOURCE_TYPES = ['post', 'xf_startup', 'xf_spotlight', 'xf_guide'];

function xf_get_sources($post_id) {
    $sources = get_post_meta($post_id, '_xf_sources', true);
    $sources = is_array($sources) ? array_values(array_filter($sources, function ($s) { return !empty($s['url']); })) : [];
    // On public pages, sources that only back a locked [xf_reveal] list stay hidden with it.
    if ($sources && !is_admin() && function_exists('xf_reveal_block') && ($block = xf_reveal_block($post_id))) {
        $hidden = [];
        foreach (wp_extract_urls($block['inner']) as $u) {
            $hidden[] = preg_replace('/^www\./', '', (string) wp_parse_url($u, PHP_URL_HOST));
        }
        $sources = array_values(array_filter($sources, function ($s) use ($hidden) {
            return !in_array(preg_replace('/^www\./', '', (string) wp_parse_url($s['url'], PHP_URL_HOST)), $hidden, true);
        }));
    }
    return $sources;
}

function xf_save_sources($post_id, array $rows) {
    $clean = [];
    foreach ($rows as $row) {
        $url = esc_url_raw(trim((string) ($row['url'] ?? '')));
        if (!$url) {
            continue;
        }
        $clean[] = [
            'url' => $url,
            'publisher' => sanitize_text_field((string) ($row['publisher'] ?? '')) ?: (string) wp_parse_url($url, PHP_URL_HOST),
            'date' => sanitize_text_field((string) ($row['date'] ?? '')),
            'claim' => sanitize_text_field((string) ($row['claim'] ?? '')),
        ];
    }
    update_post_meta($post_id, '_xf_sources', $clean);
    return $clean;
}

add_action('add_meta_boxes', function () {
    foreach (XF_SOURCE_TYPES as $type) {
        add_meta_box('xf_sources', 'Sources (required for news)', 'xf_sources_box', $type, 'normal', 'high');
        add_meta_box('xf_checklist', 'Review checklist', 'xf_checklist_box', $type, 'side', 'high');
    }
    add_meta_box('xf_article_extras', 'Article extras', 'xf_article_extras_box', 'post', 'side');
});

function xf_sources_box(WP_Post $post) {
    wp_nonce_field('xf_sources', 'xf_sources_nonce');
    $rows = xf_get_sources($post->ID);
    $rows = array_merge($rows, array_fill(0, max(3, 6 - count($rows)), []));
    echo '<p class="description">One row per source: the page you took a fact from, who published it, when, and the claim it supports.</p>';
    echo '<table class="widefat"><thead><tr><th style="width:38%">URL</th><th>Publisher</th><th style="width:120px">Date</th><th style="width:30%">Claim it supports</th></tr></thead><tbody>';
    foreach ($rows as $i => $r) {
        printf(
            '<tr><td><input class="widefat" type="url" name="xf_sources[%1$d][url]" value="%2$s"></td><td><input class="widefat" name="xf_sources[%1$d][publisher]" value="%3$s"></td><td><input class="widefat" type="date" name="xf_sources[%1$d][date]" value="%4$s"></td><td><input class="widefat" name="xf_sources[%1$d][claim]" value="%5$s"></td></tr>',
            $i, esc_attr($r['url'] ?? ''), esc_attr($r['publisher'] ?? ''), esc_attr($r['date'] ?? ''), esc_attr($r['claim'] ?? '')
        );
    }
    echo '</tbody></table>';
}

function xf_checklist_items() {
    return [
        'sourced' => 'Every fact and number has a source',
        'checked' => 'Names, dates and figures double-checked',
        'original' => 'Written in our own words (nothing copied)',
        'image' => 'Featured image set, with credit and rights',
        'category' => 'Category and tags chosen',
    ];
}

function xf_checklist_box(WP_Post $post) {
    $done = (array) get_post_meta($post->ID, '_xf_checklist', true);
    foreach (xf_checklist_items() as $key => $label) {
        printf('<p><label><input type="checkbox" name="xf_checklist[]" value="%s" %s> %s</label></p>', esc_attr($key), checked(in_array($key, $done, true), true, false), esc_html($label));
    }
}

function xf_article_extras_box(WP_Post $post) {
    printf('<p><label>Original reporting link<br><input class="widefat" type="url" name="xf_original_url" value="%s"></label></p>', esc_attr(get_post_meta($post->ID, '_xf_original_url', true)));
    printf('<p><label>Image credit<br><input class="widefat" name="xf_image_credit" value="%s" placeholder="e.g. Unsplash / Jane Doe"></label></p>', esc_attr(get_post_meta($post->ID, '_xf_image_credit', true)));
    printf('<p><label><input type="checkbox" name="xf_breaking" value="1" %s> Show in the Breaking ticker (24h)</label></p>', checked((bool) get_post_meta($post->ID, '_xf_breaking', true), true, false));
    printf('<p><label><input type="checkbox" name="xf_sponsored" value="1" %s> Sponsored (labels the article and marks links sponsored)</label></p>', checked((bool) get_post_meta($post->ID, '_xf_sponsored', true), true, false));
}

add_action('save_post', function ($post_id, $post) {
    if (!in_array($post->post_type, XF_SOURCE_TYPES, true) || !isset($_POST['xf_sources_nonce'])
        || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_sources_nonce'])), 'xf_sources')
        || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $post_id)) {
        return;
    }
    xf_save_sources($post_id, isset($_POST['xf_sources']) && is_array($_POST['xf_sources']) ? wp_unslash($_POST['xf_sources']) : []); // phpcs:ignore
    $checks = isset($_POST['xf_checklist']) ? array_map('sanitize_key', (array) wp_unslash($_POST['xf_checklist'])) : [];
    update_post_meta($post_id, '_xf_checklist', array_values(array_intersect($checks, array_keys(xf_checklist_items()))));
    if ($post->post_type === 'post') {
        update_post_meta($post_id, '_xf_original_url', esc_url_raw(wp_unslash($_POST['xf_original_url'] ?? '')));
        update_post_meta($post_id, '_xf_image_credit', sanitize_text_field(wp_unslash($_POST['xf_image_credit'] ?? '')));
        update_post_meta($post_id, '_xf_breaking', empty($_POST['xf_breaking']) ? '' : '1');
        update_post_meta($post_id, '_xf_sponsored', empty($_POST['xf_sponsored']) ? '' : '1');
    }
}, 10, 2);

/** Posts can't go live without at least one source (sponsored posts included). */
add_filter('wp_insert_post_data', function ($data, $postarr) {
    if ($data['post_type'] !== 'post' || $data['post_status'] !== 'publish' || !empty($postarr['xf_skip_source_check'])) {
        return $data;
    }
    $has_source = false;
    if (isset($_POST['xf_sources']) && is_array($_POST['xf_sources'])) {
        foreach ((array) wp_unslash($_POST['xf_sources']) as $row) { // phpcs:ignore
            if (!empty($row['url'])) {
                $has_source = true;
                break;
            }
        }
    } elseif (!empty($postarr['ID'])) {
        $has_source = (bool) xf_get_sources((int) $postarr['ID']);
    }
    if (!$has_source && is_admin()) {
        $data['post_status'] = 'pending';
        set_transient('xf_notice_' . get_current_user_id(), 'Saved as Pending review: add at least one source before publishing.', 60);
    }
    return $data;
}, 10, 2);

const XF_MIN_WORDS = 500;
const XF_MIN_IMAGES = 2;

/** Words in HTML; each CJK character counts as one, since ja/zh have no spaces. */
function xf_word_count($html) {
    return preg_match_all('/[\p{Han}\p{Hiragana}\p{Katakana}]|[^\s\p{Han}\p{Hiragana}\p{Katakana}]+/u', wp_strip_all_tags((string) $html));
}

/** Featured image plus images in the body. */
function xf_image_count($post) {
    return (has_post_thumbnail($post) ? 1 : 0) + preg_match_all('/<img\s/i', (string) $post->post_content);
}

/** Why a post can't go live yet ('' when it can): owner rule 2026-10-15, 500+ words and 2+ images. */
function xf_publish_gate_reason($post) {
    $words = xf_word_count($post->post_content);
    $images = xf_image_count($post);
    $missing = [];
    if ($words < XF_MIN_WORDS) {
        $missing[] = sprintf('%d words (needs %d)', $words, XF_MIN_WORDS);
    }
    if ($images < XF_MIN_IMAGES) {
        $missing[] = sprintf('%d images (needs %d)', $images, XF_MIN_IMAGES);
    }
    return $missing ? 'Saved as Pending review: ' . implode(', ', $missing) . '.' : '';
}

// Runs after REST/editor saves finish (featured image and meta are set by then), on the first move to live or scheduled only.
add_action('wp_after_insert_post', function ($post_id, $post, $update, $post_before) {
    $live = ['publish', 'future'];
    if (!in_array($post->post_type, ['post', 'xf_guide'], true) || !in_array($post->post_status, $live, true)
        || ($post_before && in_array($post_before->post_status, $live, true))) {
        return;
    }
    $reason = xf_publish_gate_reason($post);
    if ($reason === '') {
        return;
    }
    wp_update_post(['ID' => $post_id, 'post_status' => 'pending']);
    update_post_meta($post_id, '_xf_gate', $reason);
    set_transient('xf_notice_' . get_current_user_id(), $reason, 60);
}, 10, 4);

/** The Sources block at the end of articles, profiles and spotlights. */
function xf_sources_html($post_id) {
    $sources = xf_get_sources($post_id);
    if (!$sources) {
        return '';
    }
    $html = '<details class="xf-sources"><summary class="k">Sources (' . count($sources) . ')</summary><ol>';
    foreach ($sources as $s) {
        $html .= '<li><a href="' . esc_url($s['url']) . '" target="_blank" rel="noopener nofollow">' . esc_html($s['publisher']) . '</a>'
            . ($s['date'] ? ' <span class="xf-sources__date">' . esc_html(mysql2date('j M Y', $s['date'])) . '</span>' : '')
            . ($s['claim'] ? '<span class="xf-sources__claim">' . esc_html($s['claim']) . '</span>' : '') . '</li>';
    }
    return $html . '</ol></details>';
}

add_filter('the_content', function ($content) {
    $post = get_post();
    if (!$post || !in_array($post->post_type, XF_SOURCE_TYPES, true) || !is_singular() || $post->ID !== get_queried_object_id()) {
        return $content;
    }
    return $content . xf_sources_html($post->ID);
}, 30);

/** Sponsored articles: label up top and rel="sponsored" on every outbound link. */
add_filter('the_content', function ($content) {
    $post = get_post();
    if (!$post || $post->post_type !== 'post' || !get_post_meta($post->ID, '_xf_sponsored', true)) {
        return $content;
    }
    $host = wp_parse_url(home_url(), PHP_URL_HOST);
    $content = preg_replace_callback('/<a\s([^>]*href="https?:\/\/(?!' . preg_quote($host, '/') . ')[^"]*"[^>]*)>/i', function ($m) {
        $attrs = preg_replace('/\srel="[^"]*"/i', '', $m[1]);
        return '<a ' . $attrs . ' rel="sponsored noopener">';
    }, $content);
    if (is_singular('post') && $post->ID === get_queried_object_id()) {
        $content = '<p class="xf-sponsored-label">Sponsored · Partner content</p>' . $content;
    }
    return $content;
}, 5);
