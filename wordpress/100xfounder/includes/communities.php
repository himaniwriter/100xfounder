<?php
/**
 * Startup communities by city, and the gate in front of their join links.
 *
 * A community is a real group (WhatsApp, Discord, Telegram, Slack, Luma) that
 * someone can join. We only list groups whose join link the organiser has made
 * public or given us. Before we hand over that link we ask for a phone number
 * with explicit consent, and we store the consent text that was on screen.
 *
 * Also: RSVPs on our own events. We never show attendee numbers we cannot see —
 * the count on a page is the number of people who pressed "I'm going" here.
 */
if (!defined('ABSPATH')) {
    exit;
}

/** Cities we group events and communities by, in the order they are shown. */
const XF_EVENT_CITIES = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Online'];

/** Maps whatever a feed calls a place onto one of our cities. */
function xf_event_city_bucket($city) {
    $c = strtolower((string) $city);
    $map = [
        'Delhi NCR' => ['delhi', 'gurugram', 'gurgaon', 'noida', 'ncr', 'faridabad', 'ghaziabad'],
        'Bengaluru' => ['bengaluru', 'bangalore'],
        'Mumbai' => ['mumbai', 'navi mumbai', 'thane'],
        'Hyderabad' => ['hyderabad', 'secunderabad'],
        'Pune' => ['pune'],
        'Chennai' => ['chennai'],
        'Kolkata' => ['kolkata'],
        'Ahmedabad' => ['ahmedabad', 'gandhinagar'],
        'Online' => ['online', 'virtual', 'zoom', 'meet', 'remote'],
    ];
    foreach ($map as $bucket => $needles) {
        foreach ($needles as $n) {
            if (strpos($c, $n) !== false) {
                return $bucket;
            }
        }
    }
    return '';
}

add_action('init', function () {
    register_post_type('xf_community', [
        'label' => 'Communities',
        'labels' => ['name' => 'Communities', 'singular_name' => 'Community', 'add_new_item' => 'Add community'],
        'public' => true,
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-groups',
        'has_archive' => false,
        'supports' => ['title', 'editor', 'custom-fields'],
        'rewrite' => ['slug' => 'communities', 'with_front' => false],
    ]);
});

/** Editable fields on a community. */
function xf_community_fields() {
    return [
        'city' => ['City', 'select', array_merge([''], XF_EVENT_CITIES)],
        'platform' => ['Platform', 'select', ['', 'WhatsApp', 'Telegram', 'Discord', 'Slack', 'Luma', 'Meetup', 'LinkedIn', 'Other']],
        'join_url' => ['Join link (shown after consent)', 'url'],
        'public_url' => ['Public page (shown to everyone)', 'url'],
        'members' => ['Members, as the organiser states', 'text'],
        'organiser' => ['Run by', 'text'],
        'focus' => ['Who it is for', 'text'],
        'verified_on' => ['Link checked on (YYYY-MM-DD)', 'text'],
    ];
}

add_action('add_meta_boxes', function () {
    add_meta_box('xf_community', 'Community details', function ($post) {
        wp_nonce_field('xf_community_meta', 'xf_community_nonce');
        echo '<style>.xf-cf{margin:10px 0}.xf-cf label{display:block;font-weight:600;margin-bottom:4px}.xf-cf input,.xf-cf select{width:100%}</style>';
        foreach (xf_community_fields() as $key => $field) {
            $value = (string) get_post_meta($post->ID, '_xf_' . $key, true);
            echo '<div class="xf-cf"><label for="xf_' . esc_attr($key) . '">' . esc_html($field[0]) . '</label>';
            if ($field[1] === 'select') {
                echo '<select name="xf_' . esc_attr($key) . '" id="xf_' . esc_attr($key) . '">';
                foreach ($field[2] as $opt) {
                    printf('<option value="%s"%s>%s</option>', esc_attr($opt), selected($value, $opt, false), esc_html($opt ?: '—'));
                }
                echo '</select>';
            } else {
                printf('<input type="text" name="xf_%1$s" id="xf_%1$s" value="%2$s">', esc_attr($key), esc_attr($value));
            }
            echo '</div>';
        }
        echo '<p class="description">Only list a join link the organiser has made public or given us permission to share.</p>';
    }, 'xf_community', 'normal', 'high');
});

add_action('save_post_xf_community', function ($post_id) {
    if (!isset($_POST['xf_community_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_community_nonce'])), 'xf_community_meta') || !current_user_can('edit_post', $post_id)) {
        return;
    }
    foreach (xf_community_fields() as $key => $field) {
        $raw = wp_unslash($_POST['xf_' . $key] ?? '');
        update_post_meta($post_id, '_xf_' . $key, $field[1] === 'url' ? esc_url_raw($raw) : sanitize_text_field($raw));
    }
});

/** Communities for a city (or all), newest first. */
function xf_communities($city = '', $limit = 50) {
    $args = ['post_type' => 'xf_community', 'post_status' => 'publish', 'posts_per_page' => $limit, 'orderby' => 'title', 'order' => 'ASC'];
    if ($city) {
        $args['meta_query'] = [['key' => '_xf_city', 'value' => $city]];
    }
    return get_posts($args);
}

/* ---- RSVP: our own attendee count, never anyone else's ---- */

/** How many people pressed "I'm going" on our site. */
function xf_event_rsvp_count($event_id) {
    return (int) get_post_meta((int) $event_id, '_xf_rsvp_count', true);
}

function xf_rsvp_cookie($event_id) {
    return 'xf_rsvp_' . (int) $event_id;
}

add_action('admin_post_nopriv_xf_rsvp', 'xf_handle_rsvp');
add_action('admin_post_xf_rsvp', 'xf_handle_rsvp');
function xf_handle_rsvp() {
    $id = isset($_POST['event']) ? (int) $_POST['event'] : 0;
    $back = wp_get_referer() ?: home_url('/events/');
    if (!isset($_POST['xf_rsvp_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_rsvp_nonce'])), 'xf_rsvp_' . $id) || get_post_type($id) !== 'xf_event') {
        wp_safe_redirect($back);
        exit;
    }
    if (empty($_COOKIE[xf_rsvp_cookie($id)]) && !(function_exists('xf_rate_limited') && xf_rate_limited('rsvp', 30, HOUR_IN_SECONDS))) {
        update_post_meta($id, '_xf_rsvp_count', xf_event_rsvp_count($id) + 1);
        setcookie(xf_rsvp_cookie($id), '1', time() + YEAR_IN_SECONDS, COOKIEPATH ?: '/', COOKIE_DOMAIN, is_ssl(), true);
    }
    wp_safe_redirect(add_query_arg('rsvp', 'done', $back) . '#rsvp');
    exit;
}

/* ---- The gate: a phone number, with consent, before we show a join link ---- */

/** The consent sentence shown next to the tick box. Stored with every lead. */
function xf_community_consent_text() {
    return 'I agree that 100xFounder may contact me on WhatsApp or by phone about this community and about startup events in my city. I can ask to stop at any time.';
}

/** Has this visitor already unlocked the links in this browser? */
function xf_community_unlocked() {
    return !empty($_COOKIE['xf_community_access']);
}

add_action('admin_post_nopriv_xf_community_unlock', 'xf_handle_community_unlock');
add_action('admin_post_xf_community_unlock', 'xf_handle_community_unlock');
function xf_handle_community_unlock() {
    $back = remove_query_arg(['unlock', 'unlock_error'], wp_get_referer() ?: home_url('/events/'));
    $fail = function ($msg) use ($back) {
        wp_safe_redirect(add_query_arg('unlock_error', rawurlencode($msg), $back) . '#communities');
        exit;
    };
    if (!isset($_POST['xf_unlock_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_unlock_nonce'])), 'xf_community_unlock')) {
        $fail('Your session expired. Please try again.');
    }
    if (!empty($_POST['website'])) { // Honeypot.
        wp_safe_redirect(add_query_arg('unlock', 'done', $back) . '#communities');
        exit;
    }
    if (function_exists('xf_rate_limited') && xf_rate_limited('unlock', 8, HOUR_IN_SECONDS)) {
        $fail('Too many requests from your connection. Please try again later.');
    }
    $name = sanitize_text_field(wp_unslash($_POST['name'] ?? ''));
    $phone = sanitize_text_field(wp_unslash($_POST['phone'] ?? ''));
    $city = sanitize_text_field(wp_unslash($_POST['city'] ?? ''));
    $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    $digits = preg_replace('/\D/', '', $phone);
    if (mb_strlen($name) < 2 || strlen($digits) < 10) {
        $fail('Please add your name and a phone number with its country code.');
    }
    if (empty($_POST['consent'])) {
        $fail('Please tick the consent box so we can share the community links.');
    }
    $id = wp_insert_post([
        'post_type' => 'xf_lead',
        'post_status' => 'private',
        'post_title' => $name . ' — communities' . ($city ? ' / ' . $city : ''),
        'post_content' => 'Asked for community links' . ($city ? ' in ' . $city : '') . '.',
        'meta_input' => [
            '_xf_lead_name' => $name,
            '_xf_lead_phone' => $phone,
            '_xf_lead_email' => $email,
            '_xf_lead_city' => $city,
            '_xf_lead_niche' => 'communities',
            '_xf_lead_source' => esc_url_raw($back),
            '_xf_lead_consent' => current_time('mysql'),
            // Store the exact wording the person agreed to (DPDP Act: notice must be demonstrable).
            '_xf_lead_consent_text' => xf_community_consent_text(),
        ],
    ]);
    if (!is_wp_error($id)) {
        wp_mail(get_option('admin_email'), 'Community link request: ' . $name,
            "Name: $name\nPhone: $phone\nEmail: $email\nCity: $city\nPage: $back\n\nLeads: " . admin_url('edit.php?post_type=xf_lead'));
    }
    setcookie('xf_community_access', '1', time() + 180 * DAY_IN_SECONDS, COOKIEPATH ?: '/', COOKIE_DOMAIN, is_ssl(), true);
    wp_safe_redirect(add_query_arg('unlock', 'done', $back) . '#communities');
    exit;
}

/** The gate form, or nothing if this visitor has already given consent. */
function xf_community_gate_html($city = '') {
    if (xf_community_unlocked()) {
        return '';
    }
    $error = isset($_GET['unlock_error']) ? sanitize_text_field(wp_unslash($_GET['unlock_error'])) : '';
    $privacy = function_exists('xft_page_url') ? xft_page_url('privacy', 'privacy-policy') : home_url('/privacy-policy/');
    ob_start(); ?>
    <div class="xf-gate" id="communities-gate">
        <p class="k">One step before you join</p>
        <h3>Get the join links for every community here</h3>
        <p>Add your number and we'll show the join links on this page straight away. We use it to send you the group invites and what's happening in your city — nothing else.</p>
        <?php if ($error) : ?><p class="xf-quote-err" role="alert"><?php echo esc_html($error); ?></p><?php endif; ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="xf_community_unlock">
            <input type="hidden" name="city" value="<?php echo esc_attr($city); ?>">
            <?php wp_nonce_field('xf_community_unlock', 'xf_unlock_nonce'); ?>
            <p class="screen-reader-text"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>
            <div class="xf-gate-grid">
                <label><span>Your name</span><input type="text" name="name" required autocomplete="name"></label>
                <label><span>Phone, with country code</span><input type="tel" name="phone" required placeholder="+91 98XXXXXXXX" autocomplete="tel"></label>
                <label><span>Email (optional)</span><input type="email" name="email" autocomplete="email"></label>
            </div>
            <label class="xf-quote-consent"><input type="checkbox" name="consent" value="1" required> <?php echo esc_html(xf_community_consent_text()); ?> See our <a href="<?php echo esc_url($privacy); ?>">privacy policy</a>.</label>
            <button class="btn btn-w" type="submit">Show the join links</button>
            <p class="k" style="margin-top:12px;font-size:10.5px">We never sell your number. Every community below also has a public page you can open without giving us anything.</p>
        </form>
    </div>
    <?php
    return ob_get_clean();
}

/** One community card: public link always, join link only after consent. */
function xf_community_card_html($post) {
    $id = $post->ID;
    $f = function ($k) use ($id) { return (string) get_post_meta($id, '_xf_' . $k, true); };
    $join = $f('join_url');
    $public = $f('public_url');
    $meta = array_filter([$f('platform'), $f('members') ? $f('members') . ' members, per the organiser' : '', $f('city')]);
    ob_start(); ?>
    <div class="xf-community">
        <div class="xf-community__head">
            <h3><?php echo esc_html(get_the_title($post)); ?></h3>
            <?php if ($f('platform')) : ?><span class="tag"><?php echo esc_html($f('platform')); ?></span><?php endif; ?>
        </div>
        <?php if ($f('focus')) : ?><p class="xf-community__focus"><?php echo esc_html($f('focus')); ?></p><?php endif; ?>
        <?php if ($meta) : ?><p class="k"><?php echo esc_html(implode(' · ', $meta)); ?></p><?php endif; ?>
        <?php if ($f('organiser')) : ?><p class="k">Run by <?php echo esc_html($f('organiser')); ?></p><?php endif; ?>
        <div class="xf-community__actions">
            <?php if ($join && xf_community_unlocked()) : ?>
                <a class="btn btn-w" href="<?php echo esc_url($join); ?>" target="_blank" rel="noopener nofollow">Join on <?php echo esc_html($f('platform') ?: 'their page'); ?> ↗</a>
            <?php elseif ($join) : ?>
                <a class="btn" href="#communities-gate">Get the join link</a>
            <?php endif; ?>
            <?php if ($public) : ?><a class="btn" href="<?php echo esc_url($public); ?>" target="_blank" rel="noopener nofollow">Public page ↗</a><?php endif; ?>
        </div>
        <?php if ($f('verified_on')) : ?><p class="k" style="font-size:10px">Link checked <?php echo esc_html($f('verified_on')); ?></p><?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
