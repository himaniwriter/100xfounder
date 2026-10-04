<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Funding tracker: one post per funding round with structured fields. Every
 * round needs a source link; the tracker table links each row to it.
 * ---------------------------------------------------------------------- */

add_action('init', function () {
    register_post_type('xf_round', [
        'labels' => ['name' => 'Funding rounds', 'singular_name' => 'Funding round', 'add_new_item' => 'Add funding round', 'edit_item' => 'Edit funding round'],
        'public' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'funding', 'with_front' => false],
        'menu_icon' => 'dashicons-chart-line',
        'supports' => ['title', 'editor', 'excerpt'],
        'show_in_rest' => true,
    ]);
});

xf_register_fields('xf_round', 'Round details', [
    'company' => ['Company', 'text'],
    'sector' => ['Sector', 'text', null, 'e.g. AI search, Fintech, Quick commerce'],
    'round' => ['Round', 'select', ['', 'Pre-seed', 'Seed', 'Pre-Series A', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E+', 'Growth', 'Debt', 'Strategic', 'Bridge', 'IPO', 'Acquisition']],
    'lead_investor' => ['Lead investor', 'text'],
    'amount_display' => ['Amount (as shown)', 'text', null, 'e.g. $41M or ₹120 Cr'],
    'amount_usd' => ['Amount in USD (number, for totals)', 'number', null, 'e.g. 41000000. Leave empty if undisclosed.'],
    'country' => ['Country', 'select', ['', 'India', 'United States', 'Other']],
    'announced' => ['Announced', 'date'],
    'source_url' => ['Source (required)', 'url', null, 'Press release, filing or reputable report.'],
]);

/** Rounds need a source before they can be published. */
add_filter('wp_insert_post_data', function ($data, $postarr) {
    if ($data['post_type'] !== 'xf_round' || $data['post_status'] !== 'publish') {
        return $data;
    }
    // Sources can arrive from the edit screen, from code (meta_input), or already be saved.
    $source = isset($_POST['xf_source_url']) ? esc_url_raw(wp_unslash($_POST['xf_source_url']))
        : ($postarr['meta_input']['_xf_source_url'] ?? get_post_meta((int) ($postarr['ID'] ?? 0), '_xf_source_url', true));
    if (!$source) {
        $data['post_status'] = 'pending';
        set_transient('xf_notice_' . get_current_user_id(), 'Funding round saved as Pending: add a source link before publishing.', 60);
    }
    return $data;
}, 10, 2);

function xf_recent_rounds($limit = 6) {
    return get_posts(['post_type' => 'xf_round', 'post_status' => 'publish', 'posts_per_page' => $limit]);
}

/** Sum of disclosed USD amounts published in the last $days days. */
function xf_rounds_total_usd($days = 7) {
    $ids = get_posts([
        'post_type' => 'xf_round', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids',
        'date_query' => [['after' => $days . ' days ago']],
    ]);
    $total = 0;
    foreach ($ids as $id) {
        $total += (float) get_post_meta($id, '_xf_amount_usd', true);
    }
    return $total;
}

function xf_format_usd_short($amount) {
    if ($amount >= 1e9) return '$' . rtrim(rtrim(number_format($amount / 1e9, 1), '0'), '.') . 'B';
    if ($amount >= 1e6) return '$' . rtrim(rtrim(number_format($amount / 1e6, 1), '0'), '.') . 'M';
    if ($amount >= 1e3) return '$' . round($amount / 1e3) . 'K';
    return '$' . (int) $amount;
}

/** Round pages show the facts table and source above the write-up. */
add_filter('the_content', function ($content) {
    $post = get_post();
    if (!$post || $post->post_type !== 'xf_round' || !is_singular('xf_round') || $post->ID !== get_queried_object_id()) {
        return $content;
    }
    $rows = [
        'Company' => get_post_meta($post->ID, '_xf_company', true),
        'Round' => get_post_meta($post->ID, '_xf_round', true),
        'Amount' => get_post_meta($post->ID, '_xf_amount_display', true) ?: 'Undisclosed',
        'Lead investor' => get_post_meta($post->ID, '_xf_lead_investor', true),
        'Sector' => get_post_meta($post->ID, '_xf_sector', true),
        'Announced' => ($d = get_post_meta($post->ID, '_xf_announced', true)) ? mysql2date('j M Y', $d) : '',
    ];
    $html = '<dl class="xf xf-facts">';
    foreach (array_filter($rows) as $label => $value) {
        $html .= '<div><dt>' . esc_html($label) . '</dt><dd>' . esc_html($value) . '</dd></div>';
    }
    $html .= '</dl>';
    $source = get_post_meta($post->ID, '_xf_source_url', true);
    $after = $source ? '<p class="xf-source-link"><a href="' . esc_url($source) . '" target="_blank" rel="noopener nofollow">Source ↗</a></p>' : '';
    return $html . $content . $after;
});
