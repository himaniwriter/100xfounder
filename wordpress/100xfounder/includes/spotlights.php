<?php
if (!defined('ABSPATH')) {
    exit;
}

/** Story questions on the founder form: field => [label, hint, required]. */
function xf_story_fields($product) {
    return [
        'story_origin' => ["Why did you start {$product}?", 'The moment or problem that made you build it.', true],
        'story_problem' => ['What problem does it solve, and for whom?', '', true],
        'story_traction' => ['Traction or milestones so far', "Users, revenue, launch results, anything you're proud of.", false],
        'story_advice' => ['One piece of advice for other founders', '', false],
        'story_next' => ["What's next?", '', false],
    ];
}

function xf_story_headings($product) {
    return [
        'story_origin' => "Why {$product}?",
        'story_problem' => 'The problem it solves',
        'story_traction' => 'Traction so far',
        'story_advice' => 'Advice for other founders',
        'story_next' => "What's next",
    ];
}

add_shortcode('xf_feature_form', function () {
    $token = isset($_GET['t']) ? sanitize_text_field(wp_unslash($_GET['t'])) : '';
    $contact = xf_contact_by_token($token);
    if (!$contact || in_array($contact->status, ['unsubscribed', 'bounced'], true)) {
        return '<div class="xf xf-card"><h3>This invite link isn\'t valid</h3><p class="xf-muted">It may have expired. Reply to our email and we\'ll send a fresh link.</p></div>';
    }
    if (in_array($contact->status, ['form_submitted', 'featured'], true) || isset($_GET['submitted'])) {
        return '<div class="xf xf-card xf-card--highlight"><h3>Thank you! 🎉</h3><p>We\'ve got your story. We\'ll review it and email you when your spotlight is live.</p></div>';
    }

    $product = get_the_title($contact->startup_id);
    $error = isset($_GET['xf_error']) ? sanitize_text_field(wp_unslash($_GET['xf_error'])) : '';
    $ig = xf_get_setting('instagram_handle');
    ob_start();
    ?>
    <div class="xf xf-form-wrap">
        <p class="xf-eyebrow">Free founder spotlight</p>
        <h2>Tell us the story behind <?php echo esc_html($product); ?></h2>
        <p>Your answers become a founder spotlight on 100xFounder with a link to <?php echo esc_html($product); ?><?php echo $ig ? ', and (if you opt in) a carousel post on our Instagram @' . esc_html($ig) : ''; ?>. It takes about 5 minutes.</p>
        <?php if ($error) : ?><p class="xf-error"><?php echo esc_html($error); ?></p><?php endif; ?>
        <form class="xf-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
            <input type="hidden" name="action" value="xf_feature_submit">
            <input type="hidden" name="t" value="<?php echo esc_attr($token); ?>">
            <?php wp_nonce_field('xf_feature_' . $token, 'xf_nonce'); ?>
            <div class="xf-grid-2">
                <label>Your name *<input name="founder_name" required minlength="2" maxlength="120"></label>
                <label>Your role<input name="role" maxlength="80" placeholder="Founder & CEO"></label>
            </div>
            <label>Where are you based?<input name="location" maxlength="120" placeholder="City, Country"></label>
            <?php foreach (xf_story_fields($product) as $name => [$label, $hint, $required]) : ?>
                <label><?php echo esc_html($label . ($required ? ' *' : '')); ?>
                    <?php if ($hint) : ?><small><?php echo esc_html($hint); ?></small><?php endif; ?>
                    <textarea name="<?php echo esc_attr($name); ?>" rows="4" maxlength="2000" <?php echo $required ? 'required minlength="40"' : ''; ?>></textarea>
                </label>
            <?php endforeach; ?>
            <label>Your photo <small>JPG, PNG or WebP under 5 MB. Used on your spotlight and Instagram post.</small>
                <input type="file" name="photo" accept="image/jpeg,image/png,image/webp">
            </label>
            <div class="xf-grid-3">
                <label>X / Twitter URL<input name="twitter" type="url" placeholder="https://x.com/…"></label>
                <label>LinkedIn URL<input name="linkedin" type="url" placeholder="https://linkedin.com/in/…"></label>
                <label>Instagram handle<input name="instagram" maxlength="31" placeholder="@yourhandle"></label>
            </div>
            <label class="xf-check"><input type="checkbox" name="consent_website" required> I agree that 100xFounder can publish this spotlight, including my name and photo, on <?php echo esc_html(wp_parse_url(home_url(), PHP_URL_HOST)); ?>. *</label>
            <?php if ($ig) : ?>
                <label class="xf-check"><input type="checkbox" name="consent_instagram" checked> I'm happy for 100xFounder to share it on Instagram (@<?php echo esc_html($ig); ?>) and tag me.</label>
            <?php endif; ?>
            <button class="xf-button" type="submit">Submit my spotlight</button>
        </form>
    </div>
    <?php
    return ob_get_clean();
});

function xf_feature_redirect($token, $args) {
    wp_safe_redirect(xf_page_url('feature', array_merge(['t' => $token], $args)));
    exit;
}

function xf_handle_feature_submit() {
    $token = isset($_POST['t']) ? sanitize_text_field(wp_unslash($_POST['t'])) : '';
    $contact = xf_contact_by_token($token);
    if (!$contact || !isset($_POST['xf_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_nonce'])), 'xf_feature_' . $token)) {
        wp_die('This invite link is not valid.', 'Invalid link', ['response' => 403]);
    }
    if (in_array($contact->status, ['form_submitted', 'featured', 'unsubscribed', 'bounced'], true)) {
        xf_feature_redirect($token, ['submitted' => 1]);
    }

    $text = function ($key, $max) {
        $value = isset($_POST[$key]) ? sanitize_textarea_field(wp_unslash($_POST[$key])) : '';
        return mb_substr(trim($value), 0, $max);
    };
    $name = $text('founder_name', 120);
    $product = get_the_title($contact->startup_id);
    $stories = [];
    foreach (array_keys(xf_story_fields($product)) as $field) {
        $stories[$field] = $text($field, 2000);
    }
    if (mb_strlen($name) < 2 || mb_strlen($stories['story_origin']) < 40 || mb_strlen($stories['story_problem']) < 40) {
        xf_feature_redirect($token, ['xf_error' => 'Please add your name and at least a couple of sentences for the required questions.']);
    }
    if (empty($_POST['consent_website'])) {
        xf_feature_redirect($token, ['xf_error' => 'Consent is required to publish your spotlight.']);
    }
    $url = function ($key) {
        $value = isset($_POST[$key]) ? esc_url_raw(wp_unslash($_POST[$key]), ['https']) : '';
        return $value;
    };
    $instagram = preg_replace('/[^A-Za-z0-9._]/', '', ltrim($text('instagram', 31), '@'));

    // Build the article body so it's editable in the normal WordPress editor.
    $html = '';
    foreach (xf_story_headings($product) as $field => $heading) {
        if ($stories[$field] !== '') {
            $html .= '<!-- wp:heading --><h2 class="wp-block-heading">' . esc_html($heading) . "</h2><!-- /wp:heading -->\n";
            $html .= '<!-- wp:paragraph --><p>' . nl2br(esc_html($stories[$field])) . "</p><!-- /wp:paragraph -->\n";
        }
    }

    $auto_publish = (bool) xf_get_setting('auto_publish');
    $post_id = wp_insert_post([
        'post_type' => 'xf_spotlight',
        'post_status' => 'pending',
        'post_title' => sprintf('%s on building %s', $name, $product),
        'post_excerpt' => wp_trim_words($stories['story_origin'], 30),
        'post_content' => $html,
        'meta_input' => [
            '_xf_startup_id' => (int) $contact->startup_id,
            '_xf_contact_id' => (int) $contact->id,
            '_xf_founder_name' => $name,
            '_xf_role' => $text('role', 80),
            '_xf_location' => $text('location', 120),
            '_xf_email' => $contact->email,
            '_xf_twitter' => $url('twitter'),
            '_xf_linkedin' => $url('linkedin'),
            '_xf_instagram' => $instagram,
            '_xf_consent_website' => 1,
            '_xf_consent_instagram' => empty($_POST['consent_instagram']) ? 0 : 1,
        ] + array_combine(array_map(function ($k) { return '_xf_' . $k; }, array_keys($stories)), array_values($stories)),
    ], true);
    if (is_wp_error($post_id)) {
        xf_feature_redirect($token, ['xf_error' => 'Something went wrong. Please try again.']);
    }

    if (!empty($_FILES['photo']['name'])) {
        $file = $_FILES['photo']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
        $allowed = ['jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        $check = wp_check_filetype_and_ext($file['tmp_name'], $file['name'], $allowed);
        if ($file['size'] <= 5 * MB_IN_BYTES && !empty($check['type'])) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
            $attachment_id = media_handle_upload('photo', $post_id, [], ['test_form' => false, 'mimes' => $allowed]);
            if (!is_wp_error($attachment_id)) {
                set_post_thumbnail($post_id, $attachment_id);
            }
        }
    }

    global $wpdb;
    $wpdb->update(xf_table('contacts'), [
        'status' => 'form_submitted', 'name' => $name, 'next_send_at' => null, 'updated_at' => xf_now(),
    ], ['id' => $contact->id]);

    if ($auto_publish) {
        wp_update_post(['ID' => $post_id, 'post_status' => 'publish']);
    } else {
        wp_mail(get_option('admin_email'), "New founder spotlight: $name ($product)",
            "Review and publish it here:\n" . admin_url('post.php?post=' . $post_id . '&action=edit'));
    }
    xf_feature_redirect($token, ['submitted' => 1]);
}
add_action('admin_post_nopriv_xf_feature_submit', 'xf_handle_feature_submit');
add_action('admin_post_xf_feature_submit', 'xf_handle_feature_submit');

/** When a spotlight goes live: mark the contact featured and queue Instagram. */
add_action('transition_post_status', function ($new, $old, $post) {
    if ($post->post_type !== 'xf_spotlight' || $new !== 'publish' || $old === 'publish') {
        return;
    }
    global $wpdb;
    $contact_id = (int) get_post_meta($post->ID, '_xf_contact_id', true);
    if ($contact_id) {
        $wpdb->update(xf_table('contacts'), ['status' => 'featured', 'updated_at' => xf_now()], ['id' => $contact_id]);
    }
    $startup_id = (int) get_post_meta($post->ID, '_xf_startup_id', true);
    if ($startup_id) {
        xf_refresh_indexable_flag($startup_id);
    }
    if (get_post_meta($post->ID, '_xf_consent_instagram', true)) {
        xf_queue_spotlight_instagram($post->ID);
    }
}, 10, 3);

/* -------------------------------------------------------------------------
 * Unsubscribe: confirmation page plus RFC 8058 one-click POST from mail apps
 * ---------------------------------------------------------------------- */

add_action('template_redirect', function () {
    $pages = get_option('xf_pages', []);
    if (empty($pages['unsubscribe']) || !is_page($pages['unsubscribe'])) {
        return;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    $token = isset($_REQUEST['t']) ? sanitize_text_field(wp_unslash($_REQUEST['t'])) : '';
    $contact = xf_contact_by_token($token);
    if ($contact) {
        xf_suppress_email($contact->email, 'unsubscribed');
    }
    $one_click = isset($_POST['List-Unsubscribe']) && $_POST['List-Unsubscribe'] === 'One-Click';
    if ($one_click) {
        status_header($contact ? 200 : 404);
        exit;
    }
    wp_safe_redirect(xf_page_url('unsubscribe', ['done' => $contact ? 1 : 0]));
    exit;
});

add_shortcode('xf_unsubscribe', function () {
    if (isset($_GET['done'])) {
        return $_GET['done'] === '1'
            ? '<div class="xf xf-card"><h3>You\'re unsubscribed</h3><p class="xf-muted">We won\'t email you again. Sorry for the bother!</p></div>'
            : '<div class="xf xf-card"><h3>This link has expired</h3><p class="xf-muted">Reply to our email with "unsubscribe" and we\'ll remove you.</p></div>';
    }
    $token = isset($_GET['t']) ? sanitize_text_field(wp_unslash($_GET['t'])) : '';
    return '<div class="xf xf-card"><p>Click below and we won\'t email you again.</p><form method="post" action="' . esc_url(xf_page_url('unsubscribe', ['t' => $token])) . '"><button class="xf-button" type="submit">Unsubscribe</button></form></div>';
});
