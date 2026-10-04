<?php
/**
 * Buyer enquiries ("Get quotes from manufacturers") on B2B listing articles.
 *
 * Place [xf_quote_form niche="perfume" sub="attar"] in an article. Each enquiry is
 * stored as a private xf_lead post (WP admin → Leads), and the owner is emailed.
 * The buyer consents to their enquiry being shared with a few relevant
 * manufacturers (DPDP Act / GDPR); nothing is shared automatically.
 */
if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function () {
    register_post_type('xf_lead', [
        'label' => 'Leads',
        'labels' => ['name' => 'Leads', 'singular_name' => 'Lead', 'menu_name' => 'Leads'],
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => false,
        'menu_icon' => 'dashicons-email-alt',
        'supports' => ['title', 'editor', 'custom-fields'],
        'capability_type' => 'post',
        'capabilities' => ['create_posts' => 'do_not_allow'],
        'map_meta_cap' => true,
    ]);
});

/** Lead fields: key => [label, type, required]. */
function xf_lead_fields() {
    return [
        'name' => ['Your name', 'text', true],
        'company' => ['Company', 'text', false],
        'email' => ['Work email', 'email', true],
        'phone' => ['Phone (with country code)', 'tel', true],
        'city' => ['City / country', 'text', false],
        'quantity' => ['Quantity or budget', 'text', false],
        'details' => ['What do you need?', 'textarea', true],
    ];
}

add_shortcode('xf_quote_form', function ($atts) {
    $a = shortcode_atts(['niche' => '', 'sub' => '', 'title' => 'Get quotes from verified manufacturers'], $atts);
    $sent = isset($_GET['xf_lead']) && $_GET['xf_lead'] === 'sent';
    $error = isset($_GET['xf_lead_error']) ? sanitize_text_field(wp_unslash($_GET['xf_lead_error'])) : '';
    $privacy = function_exists('xft_page_url') ? xft_page_url('privacy', 'privacy-policy') : home_url('/privacy-policy/');
    ob_start(); ?>
    <div class="xf-quote" id="get-quotes">
        <p class="k">Free · No obligation</p>
        <h2><?php echo esc_html($a['title']); ?></h2>
        <?php if ($sent) : ?>
            <p class="xf-quote-ok">Thanks. We've received your requirement and will connect you with suitable manufacturers within 2 working days.</p>
        <?php else : ?>
            <p>Tell us what you need. We'll pass your requirement to up to five suitable manufacturers, who contact you with quotes.</p>
            <?php if ($error) : ?><p class="xf-quote-err" role="alert"><?php echo esc_html($error); ?></p><?php endif; ?>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                <input type="hidden" name="action" value="xf_lead">
                <input type="hidden" name="niche" value="<?php echo esc_attr($a['niche']); ?>">
                <input type="hidden" name="sub" value="<?php echo esc_attr($a['sub']); ?>">
                <?php wp_nonce_field('xf_lead', 'xf_lead_nonce'); ?>
                <p class="screen-reader-text"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>
                <div class="xf-quote-grid">
                    <?php foreach (xf_lead_fields() as $key => [$label, $type, $req]) : ?>
                        <label class="<?php echo $type === 'textarea' ? 'wide' : ''; ?>"><span><?php echo esc_html($label . ($req ? '' : ' (optional)')); ?></span>
                            <?php if ($type === 'textarea') : ?>
                                <textarea name="<?php echo esc_attr($key); ?>" rows="4" <?php echo $req ? 'required' : ''; ?>></textarea>
                            <?php else : ?>
                                <input type="<?php echo esc_attr($type); ?>" name="<?php echo esc_attr($key); ?>" <?php echo $req ? 'required' : ''; ?>>
                            <?php endif; ?>
                        </label>
                    <?php endforeach; ?>
                </div>
                <label class="xf-quote-consent"><input type="checkbox" name="consent" value="1" required> I agree that 100xFounder may share this enquiry with up to five relevant manufacturers so they can send me quotes. See our <a href="<?php echo esc_url($privacy); ?>">privacy policy</a>.</label>
                <button class="btn btn-w" type="submit">Get quotes</button>
            </form>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
});

function xf_handle_lead() {
    if (!isset($_POST['xf_lead_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_lead_nonce'])), 'xf_lead')) {
        wp_die('Your session expired. Please go back and try again.', 'Expired', ['response' => 403]);
    }
    $back = remove_query_arg(['xf_lead', 'xf_lead_error'], wp_get_referer() ?: home_url('/'));
    $fail = function ($msg) use ($back) {
        wp_safe_redirect(add_query_arg('xf_lead_error', rawurlencode($msg), $back) . '#get-quotes');
        exit;
    };
    if (!empty($_POST['website'])) { // Honeypot: pretend it worked.
        wp_safe_redirect(add_query_arg('xf_lead', 'sent', $back) . '#get-quotes');
        exit;
    }
    if (function_exists('xf_rate_limited') && xf_rate_limited('lead', 5, HOUR_IN_SECONDS)) {
        $fail('Too many enquiries from your connection. Please try again later.');
    }
    $v = [];
    foreach (xf_lead_fields() as $key => [, $type]) {
        $raw = wp_unslash($_POST[$key] ?? '');
        $v[$key] = $type === 'textarea' ? sanitize_textarea_field($raw) : ($type === 'email' ? sanitize_email($raw) : sanitize_text_field($raw));
    }
    $digits = preg_replace('/\D/', '', $v['phone']);
    if (mb_strlen($v['name']) < 2 || !is_email($v['email']) || strlen($digits) < 8 || mb_strlen($v['details']) < 10) {
        $fail('Please add your name, a valid email, a phone number and a line about what you need.');
    }
    if (empty($_POST['consent'])) {
        $fail('Please tick the box so we can share your enquiry with manufacturers.');
    }
    $niche = sanitize_key(wp_unslash($_POST['niche'] ?? ''));
    $sub = sanitize_text_field(wp_unslash($_POST['sub'] ?? ''));
    $source = esc_url_raw($back);
    $title = sprintf('%s: %s%s', $v['name'], $niche ?: 'general', $sub ? ' / ' . $sub : '');
    $id = wp_insert_post([
        'post_type' => 'xf_lead',
        'post_status' => 'private',
        'post_title' => $title,
        'post_content' => $v['details'],
        'meta_input' => array_merge(
            array_combine(array_map(function ($k) { return '_xf_lead_' . $k; }, array_keys($v)), array_values($v)),
            ['_xf_lead_niche' => $niche, '_xf_lead_sub' => $sub, '_xf_lead_source' => $source, '_xf_lead_consent' => current_time('mysql')]
        ),
    ]);
    if (is_wp_error($id) || !$id) {
        $fail('Something went wrong saving your enquiry. Please try again.');
    }
    $lines = [];
    foreach (xf_lead_fields() as $key => [$label]) {
        $lines[] = $label . ': ' . $v[$key];
    }
    wp_mail(get_option('admin_email'), 'New buyer enquiry: ' . $title,
        implode("\n", $lines) . "\n\nNiche: $niche / $sub\nPage: $source\nLeads: " . admin_url('edit.php?post_type=xf_lead'));
    wp_safe_redirect(add_query_arg('xf_lead', 'sent', $back) . '#get-quotes');
    exit;
}
add_action('admin_post_nopriv_xf_lead', 'xf_handle_lead');
add_action('admin_post_xf_lead', 'xf_handle_lead');

/** Leads list: show the buyer's contact and niche at a glance. */
add_filter('manage_xf_lead_posts_columns', function ($cols) {
    return ['cb' => $cols['cb'], 'title' => 'Enquiry', 'xf_contact' => 'Contact', 'xf_niche' => 'Niche', 'date' => 'Received'];
});
add_action('manage_xf_lead_posts_custom_column', function ($col, $id) {
    if ($col === 'xf_contact') {
        echo esc_html(implode(' · ', array_filter([get_post_meta($id, '_xf_lead_company', true), get_post_meta($id, '_xf_lead_email', true), get_post_meta($id, '_xf_lead_phone', true), get_post_meta($id, '_xf_lead_city', true)])));
    } elseif ($col === 'xf_niche') {
        echo esc_html(trim(get_post_meta($id, '_xf_lead_niche', true) . ' / ' . get_post_meta($id, '_xf_lead_sub', true), ' /'));
    }
}, 10, 2);
