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

    // Held as a private draft until the email address is verified with a one-time code.
    $post_id = wp_insert_post([
        'post_type' => 'xf_submission',
        'post_status' => 'draft',
        'post_title' => '[' . $types[$type]['label'] . '] ' . $title,
        'post_content' => $body,
        'meta_input' => [
            '_xf_type' => $type,
            '_xf_name' => $name,
            '_xf_email' => $email,
            '_xf_company' => $company,
            '_xf_instagram_optin' => empty($_POST['instagram']) ? 0 : 1,
            '_xf_verified' => 0,
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

    // Nothing reaches the editors until the submitter proves they own the email address.
    $token = xf_otp_start($post_id);
    if (!$token) {
        wp_delete_post($post_id, true);
        $fail('We could not send the verification code to that email. Please check the address and try again.');
    }
    wp_safe_redirect(xf_otp_url($token));
    exit;
}

/* -------------------------------------------------------------------------
 * Email OTP for submissions. A 6-digit code (valid 15 minutes, 5 attempts,
 * 3 resends) is emailed to the submitter. Only after the right code does the
 * submission become "Pending" for the editors, and only then are they
 * notified. Unverified submissions are deleted after 24 hours.
 * ---------------------------------------------------------------------- */

const XF_OTP_TTL = 15 * MINUTE_IN_SECONDS;
const XF_OTP_MAX_TRIES = 5;
const XF_OTP_MAX_SENDS = 3;

function xf_otp_url($token, array $args = []) {
    return add_query_arg(array_merge(['xf_verify' => $token], $args), xf_page_url('submit') ?: home_url('/submit/'));
}

function xf_otp_post_by_token($token) {
    $token = preg_replace('/[^a-zA-Z0-9]/', '', (string) $token);
    if (strlen($token) !== 32) {
        return null;
    }
    $ids = get_posts(['post_type' => 'xf_submission', 'post_status' => 'draft', 'posts_per_page' => 1, 'fields' => 'ids', 'meta_key' => '_xf_otp_token', 'meta_value' => $token]);
    return $ids ? get_post($ids[0]) : null;
}

/** Creates (or re-sends) a code for a submission. Returns the page token, or '' if mail failed. */
function xf_otp_start($post_id) {
    $token = get_post_meta($post_id, '_xf_otp_token', true) ?: wp_generate_password(32, false);
    $code = (string) random_int(100000, 999999);
    update_post_meta($post_id, '_xf_otp_token', $token);
    update_post_meta($post_id, '_xf_otp_hash', wp_hash_password($code));
    update_post_meta($post_id, '_xf_otp_expires', time() + XF_OTP_TTL);
    update_post_meta($post_id, '_xf_otp_tries', 0);
    update_post_meta($post_id, '_xf_otp_sends', (int) get_post_meta($post_id, '_xf_otp_sends', true) + 1);
    $email = get_post_meta($post_id, '_xf_email', true);
    $name = get_post_meta($post_id, '_xf_name', true);
    $site = get_bloginfo('name');
    $sent = wp_mail(
        $email,
        "$code is your $site verification code",
        "Hi $name,\n\nYour code to confirm your submission to $site is:\n\n    $code\n\nIt expires in 15 minutes. Enter it on the page you were sent to, or open:\n" . xf_otp_url($token) . "\n\nIf you didn't submit anything, ignore this email and nothing will be published.\n\n— $site"
    );
    return $sent ? $token : '';
}

function xf_handle_submission_verify() {
    $token = sanitize_text_field(wp_unslash($_POST['xf_verify'] ?? ''));
    if (!isset($_POST['xf_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_nonce'])), 'xf_verify_' . $token)) {
        wp_die('Your session expired. Please open the link in your email again.', 'Expired', ['response' => 403]);
    }
    $post = xf_otp_post_by_token($token);
    if (!$post) {
        wp_safe_redirect(add_query_arg('xf_error', rawurlencode('This verification link has expired. Please submit again.'), xf_page_url('submit') ?: home_url('/submit/')));
        exit;
    }
    if (xf_rate_limited('otp', 20, HOUR_IN_SECONDS)) {
        wp_safe_redirect(xf_otp_url($token, ['xf_error' => rawurlencode('Too many attempts. Please try again later.')]));
        exit;
    }
    if (!empty($_POST['resend'])) {
        if ((int) get_post_meta($post->ID, '_xf_otp_sends', true) >= XF_OTP_MAX_SENDS) {
            wp_safe_redirect(xf_otp_url($token, ['xf_error' => rawurlencode('We have already sent 3 codes. Please submit again later.')]));
            exit;
        }
        xf_otp_start($post->ID);
        wp_safe_redirect(xf_otp_url($token, ['resent' => 1]));
        exit;
    }
    $code = preg_replace('/\D/', '', (string) wp_unslash($_POST['code'] ?? ''));
    $tries = (int) get_post_meta($post->ID, '_xf_otp_tries', true) + 1;
    update_post_meta($post->ID, '_xf_otp_tries', $tries);
    $expired = time() > (int) get_post_meta($post->ID, '_xf_otp_expires', true);
    if ($expired || $tries > XF_OTP_MAX_TRIES || strlen($code) !== 6 || !wp_check_password($code, (string) get_post_meta($post->ID, '_xf_otp_hash', true))) {
        $msg = $expired ? 'That code has expired. Send a new one below.' : ($tries >= XF_OTP_MAX_TRIES ? 'Too many wrong codes. Send a new one below.' : 'That code is not right. Check the email and try again.');
        wp_safe_redirect(xf_otp_url($token, ['xf_error' => rawurlencode($msg)]));
        exit;
    }

    // Verified: hand it to the editors.
    wp_update_post(['ID' => $post->ID, 'post_status' => 'pending']);
    update_post_meta($post->ID, '_xf_verified', 1);
    update_post_meta($post->ID, '_xf_verified_at', time());
    delete_post_meta($post->ID, '_xf_otp_hash');
    delete_post_meta($post->ID, '_xf_otp_token');
    $types = xf_submission_types();
    $type = get_post_meta($post->ID, '_xf_type', true);
    wp_mail(get_option('admin_email'), 'New ' . ($types[$type]['label'] ?? 'submission') . ' (email verified): ' . get_the_title($post),
        'From: ' . get_post_meta($post->ID, '_xf_name', true) . ' <' . get_post_meta($post->ID, '_xf_email', true) . ">\nCompany: " . get_post_meta($post->ID, '_xf_company', true) . "\nEmail verified with a one-time code.\n\nReview it: " . admin_url('post.php?post=' . $post->ID . '&action=edit'));
    wp_safe_redirect(add_query_arg('sent', 1, xf_page_url('submit') ?: home_url('/submit/')) . '#submit-form');
    exit;
}
add_action('admin_post_nopriv_xf_submit_verify', 'xf_handle_submission_verify');
add_action('admin_post_xf_submit_verify', 'xf_handle_submission_verify');

/** The code-entry page: the submit page with ?xf_verify=<token>, rendered by the plugin. */
add_filter('template_include', function ($template) {
    if (!empty($_GET['xf_verify'])) {
        return XF_DIR . 'templates/submission-verify.php';
    }
    return $template;
}, 99);

/** Unverified submissions are removed after 24 hours (with their uploads). */
add_action('xf_cleanup_unverified', function () {
    $old = get_posts(['post_type' => 'xf_submission', 'post_status' => 'draft', 'posts_per_page' => 200, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_verified', 'value' => '0']], 'date_query' => [['before' => '24 hours ago']]]);
    foreach ($old as $id) {
        foreach (get_attached_media('', $id) as $att) {
            wp_delete_attachment($att->ID, true);
        }
        wp_delete_post($id, true);
    }
});
add_action('init', function () {
    if (!wp_next_scheduled('xf_cleanup_unverified')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'hourly', 'xf_cleanup_unverified');
    }
});

/** Admin: unverified submissions are clearly marked, so nobody reviews them by mistake. */
add_filter('display_post_states', function ($states, $post) {
    if ($post->post_type === 'xf_submission' && $post->post_status === 'draft' && !get_post_meta($post->ID, '_xf_verified', true)) {
        $states['xf_unverified'] = 'Email not verified';
    }
    return $states;
}, 10, 2);
add_action('admin_post_nopriv_xf_submit', 'xf_handle_submission');
add_action('admin_post_xf_submit', 'xf_handle_submission');
