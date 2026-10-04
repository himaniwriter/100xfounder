<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * "How to apply at {company}" guides: evergreen pages with the hiring
 * process, interview rounds and tips, every claim sourced, plus the
 * company's live roles. URL: /how-to-apply/{company}/
 * ---------------------------------------------------------------------- */

add_action('init', function () {
    register_post_type('xf_guide', [
        'labels' => ['name' => 'Apply guides', 'singular_name' => 'Apply guide', 'add_new_item' => 'Add apply guide', 'edit_item' => 'Edit apply guide'],
        'public' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'how-to-apply', 'with_front' => false],
        'menu_icon' => 'dashicons-welcome-learn-more',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
        'show_in_rest' => true,
    ]);
});

xf_register_fields('xf_guide', 'Guide facts', [
    'company_slug' => ['Company (slug in Jobs → Companies)', 'text', null, 'Links the guide to the company\'s live roles, e.g. "razorpay".'],
    'hiring_for' => ['Hiring for', 'text', null, 'e.g. Engineering, Product, Sales'],
    'process_length' => ['Process length', 'text', null, 'e.g. 3–5 weeks (sourced)'],
    'rounds' => ['Interview rounds', 'text', null, 'e.g. 4–5 rounds (sourced)'],
    'careers_url' => ['Official careers page', 'url'],
]);

function xf_guide_company($guide_id) {
    $slug = get_post_meta($guide_id, '_xf_company_slug', true);
    return $slug ? get_term_by('slug', sanitize_title($slug), 'xf_company') : null;
}

/** The guide for a company, if one is published. */
function xf_guide_for_company($term) {
    $g = get_posts(['post_type' => 'xf_guide', 'post_status' => 'publish', 'posts_per_page' => 1, 'meta_key' => '_xf_company_slug', 'meta_value' => $term->slug]);
    return $g[0] ?? null;
}
