<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * "Send us your story": five submission types, all reviewed by an editor.
 * Submissions are private posts so they can be read, commented and turned
 * into real articles, launches, events or jobs from the admin.
 * ---------------------------------------------------------------------- */

function xf_submission_types() {
    return [
        'article' => ['label' => 'Article', 'sub' => 'Analysis, opinion, founder lessons', 'title' => 'Headline', 'title_ph' => 'A clear, specific headline', 'body' => 'Your article', 'body_ph' => 'Paste your draft or a link to it'],
        'press' => ['label' => 'Press release', 'sub' => 'Funding, launches, partnerships', 'title' => 'Announcement', 'title_ph' => 'e.g. Acme raises $5M seed led by…', 'body' => 'Release text', 'body_ph' => 'Paste the full release with contact details'],
        'event' => ['label' => 'Event news', 'sub' => 'Recaps, photos, announcements', 'title' => 'Event name and date', 'title_ph' => 'e.g. Demo Day, Bengaluru, 18 Oct', 'body' => 'What happened', 'body_ph' => 'Key moments, speakers, announcements, registration link'],
        'launch' => ['label' => 'Product launch', 'sub' => 'Get considered for founder of the day', 'title' => 'Product name and Product Hunt link', 'title_ph' => 'Product name · producthunt.com/products/…', 'body' => 'The founder story', 'body_ph' => 'Why you built it, who it is for, launch date'],
        'job' => ['label' => 'Job post', 'sub' => 'Reach founders and operators', 'title' => 'Role title', 'title_ph' => 'e.g. Founding Engineer', 'body' => 'Role description', 'body_ph' => 'Responsibilities, location, salary range, official apply link'],
    ];
}

add_action('init', function () {
    register_post_type('xf_submission', [
        'labels' => ['name' => 'Submissions', 'singular_name' => 'Submission', 'edit_item' => 'Review submission'],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'xf',
        'supports' => ['title', 'editor', 'comments'],
        'capability_type' => 'post',
        'map_meta_cap' => true,
    ]);
});

add_filter('manage_xf_submission_posts_columns', function ($cols) {
    return array_merge(array_slice($cols, 0, 2), ['xf_type' => 'Type', 'xf_from' => 'From'], array_slice($cols, 2));
});
add_action('manage_xf_submission_posts_custom_column', function ($col, $id) {
    if ($col === 'xf_type') echo esc_html(xf_submission_types()[get_post_meta($id, '_xf_type', true)]['label'] ?? '');
    if ($col === 'xf_from') echo esc_html(get_post_meta($id, '_xf_name', true) . ' <' . get_post_meta($id, '_xf_email', true) . '>');
}, 10, 2);

function xf_handle_submission() {
    if (!isset($_POST['xf_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_nonce'])), 'xf_submit')) {
        wp_die('Your session expired. Please go back and try again.', 'Expired', ['response' => 403]);
    }
    $back = wp_get_referer() ?: home_url('/submit/');
    $fail = function ($msg) use ($back) {
        wp_safe_redirect(add_query_arg('xf_error', rawurlencode($msg), remove_query_arg(['sent', 'xf_error'], $back)) . '#submit-form');
        exit;
    };
    if (!empty($_POST['website'])) {
        wp_safe_redirect(add_query_arg('sent', 1, $back));
        exit;
    }
    if (xf_rate_limited('submit', 5, HOUR_IN_SECONDS)) {
        $fail('Too many submissions from your connection. Please try again later.');
    }
    $types = xf_submission_types();
    $type = sanitize_key(wp_unslash($_POST['type'] ?? 'article'));
    if (!isset($types[$type])) {
        $type = 'article';
    }
    $name = sanitize_text_field(wp_unslash($_POST['name'] ?? ''));
    $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    $title = sanitize_text_field(wp_unslash($_POST['title'] ?? ''));
    $company = sanitize_text_field(wp_unslash($_POST['company'] ?? ''));
    $body = sanitize_textarea_field(wp_unslash($_POST['body'] ?? ''));
    if (mb_strlen($name) < 2 || !is_email($email) || mb_strlen($title) < 4 || mb_strlen($body) < 20) {
        $fail('Please fill in your name, a valid work email, a headline and a few lines of detail.');
    }

    $post_id = wp_insert_post([
        'post_type' => 'xf_submission',
        'post_status' => 'pending',
        'post_title' => '[' . $types[$type]['label'] . '] ' . $title,
        'post_content' => $body,
        'meta_input' => [
            '_xf_type' => $type,
            '_xf_name' => $name,
            '_xf_email' => $email,
            '_xf_company' => $company,
            '_xf_instagram_optin' => empty($_POST['instagram']) ? 0 : 1,
        ],
    ], true);
    if (is_wp_error($post_id)) {
        $fail('Something went wrong. Please try again.');
    }

    if (!empty($_FILES['files']['name'][0])) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        $allowed = ['jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'pdf' => 'application/pdf'];
        $files = $_FILES['files']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
        for ($i = 0; $i < min(5, count($files['name'])); $i++) {
            if (empty($files['name'][$i]) || $files['size'][$i] > 8 * MB_IN_BYTES) {
                continue;
            }
            $_FILES['xf_one'] = ['name' => $files['name'][$i], 'type' => $files['type'][$i], 'tmp_name' => $files['tmp_name'][$i], 'error' => $files['error'][$i], 'size' => $files['size'][$i]];
            $check = wp_check_filetype_and_ext($files['tmp_name'][$i], $files['name'][$i], $allowed);
            if (!empty($check['type'])) {
                media_handle_upload('xf_one', $post_id, [], ['test_form' => false, 'mimes' => $allowed]);
            }
        }
    }

    wp_mail(get_option('admin_email'), "New {$types[$type]['label']} submission: $title",
        "From: $name <$email>\nCompany: $company\n\nReview it: " . admin_url('post.php?post=' . $post_id . '&action=edit'));
    wp_safe_redirect(add_query_arg('sent', 1, remove_query_arg('xf_error', $back)) . '#submit-form');
    exit;
}
add_action('admin_post_nopriv_xf_submit', 'xf_handle_submission');
add_action('admin_post_xf_submit', 'xf_handle_submission');
