<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * "Launch on 100xFounder": a free form at /launch/ where founders list a
 * product, or claim and update an existing listing (/launch/?claim={slug}).
 *
 * - A new launch becomes a Pending xf_startup plus an xf_submission (the inbox
 *   record, which holds the review state). Nothing goes live from the form.
 * - A claim never touches the listing until someone approves it: the proposed
 *   details wait on the submission and are copied over on approval.
 * - Founder email, role and social link are private meta (_xf_launch_founder_*),
 *   never rendered; the name and role show only if the founder ticked "show my name".
 * - Optional auto-approve (Settings → Launch submissions): after 10 minutes a
 *   new launch that passes every safeguard is published and marked
 *   "auto-approved"; anything else waits, flagged "needs manual review".
 *   Claims always wait. Founder Q&A answers stay private until approval.
 * - No prices or payment links anywhere: listing is free.
 */

const XF_LAUNCH_AUTO_MINUTES = 10;

function xf_launch_pricing_models() {
    return ['free' => 'Free', 'freemium' => 'Freemium', 'paid' => 'Paid', 'open_source' => 'Open source'];
}

function xf_launch_consent_text() {
    return "I'm the founder or authorised to list this product, and the information is accurate.";
}

function xf_launch_updates_text() {
    return 'Email me about my listing and occasional 100xFounder founder features. I can unsubscribe at any time.';
}

/** The optional Founder Q&A: key => question. Answers are 0–600 characters, in the founder's own words. */
function xf_launch_qa_questions() {
    return [
        'why' => 'Why did you build it?',
        'who' => 'Who is it for, and what problem does it solve for them?',
        'hardest' => 'What was the hardest moment so far, and what did you do?',
        'first_users' => 'How did you get your first users or customers?',
        'advice' => 'One piece of advice for other founders?',
    ];
}

function xf_launch_qa_consent_text() {
    return 'These are my own words; 100xFounder may publish them (lightly edited for length/typos) on my listing and its social channels, credited to me.';
}

/** Plain text with every link and bare address removed. */
function xf_launch_strip_links($text) {
    $text = wp_strip_all_tags((string) $text);
    $text = preg_replace('#\b(?:https?://|www\.)\S+#i', '', $text);
    $text = preg_replace('#\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|io|ai|co|org|net|app|dev|xyz|me|so|ly)(?:/\S*)?\b#i', '', $text);
    return trim(preg_replace('/[ \t]{2,}/', ' ', $text));
}

/**
 * The approved Founder Q&A of a published listing, for the page and the
 * Instagram founder-story template: [] until a person (or auto-approve) has approved it.
 * Shape: {name, role, answered_at, items: [{key, q, a}]}
 */
function xf_startup_founder_qa($startup_id) {
    if (get_post_status($startup_id) !== 'publish' || !get_post_meta($startup_id, '_xf_founder_qa_approved', true)) {
        return [];
    }
    $qa = json_decode((string) get_post_meta($startup_id, '_xf_founder_qa', true), true);
    if (!is_array($qa) || empty($qa['answers'])) {
        return [];
    }
    $items = [];
    foreach (xf_launch_qa_questions() as $k => $q) {
        if (!empty($qa['answers'][$k])) {
            $items[] = ['key' => $k, 'q' => $q, 'a' => (string) $qa['answers'][$k]];
        }
    }
    return $items ? ['name' => (string) ($qa['name'] ?? ''), 'role' => (string) ($qa['role'] ?? ''), 'answered_at' => (string) ($qa['answered_at'] ?? ''), 'items' => $items] : [];
}

function xf_launch_page_url($args = []) {
    return function_exists('xf_page_url') ? xf_page_url('launch', $args) : add_query_arg($args, home_url('/launch/'));
}

function xf_launch_is_page() {
    $pages = get_option('xf_pages', []);
    return !empty($pages['launch']) && is_page((int) $pages['launch']);
}

/* ---- Signed form token (works on cached pages, unlike a nonce) ---- */

function xf_launch_token() {
    $ts = time();
    return $ts . '.' . hash_hmac('sha256', 'launch|' . $ts, wp_salt('auth'));
}

function xf_launch_token_ok($token) {
    [$ts, $mac] = array_pad(explode('.', (string) $token, 2), 2, '');
    if (!ctype_digit($ts) || !hash_equals(hash_hmac('sha256', 'launch|' . $ts, wp_salt('auth')), $mac)) {
        return false;
    }
    $age = time() - (int) $ts;
    return $age >= 3 && $age <= 2 * DAY_IN_SECONDS;
}

/* ---- Domains ---- */

/** "app.acme.com" from "https://www.App.acme.com/x"; '' when there is no host. */
function xf_launch_host($url) {
    $host = strtolower((string) wp_parse_url((string) $url, PHP_URL_HOST));
    return preg_replace('/^www\./', '', $host);
}

/** Startups (other than $exclude) whose website is on $host, in the given statuses. */
function xf_launch_find_by_host($host, $exclude = 0, $statuses = ['publish', 'pending', 'draft', 'future', 'private']) {
    if ($host === '') {
        return [];
    }
    $ids = get_posts([
        'post_type' => 'xf_startup', 'post_status' => $statuses, 'posts_per_page' => 50, 'fields' => 'ids',
        'post__not_in' => $exclude ? [(int) $exclude] : [],
        'meta_query' => [['key' => '_xf_website', 'value' => $host, 'compare' => 'LIKE']],
    ]);
    return array_values(array_filter($ids, function ($id) use ($host) {
        return xf_launch_host(get_post_meta($id, '_xf_website', true)) === $host;
    }));
}

function xf_launch_disposable_domains() {
    return ['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
        'tempmailo.com', 'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com',
        'mintemail.com', 'emailondeck.com', 'mohmal.com', 'burnermail.io', 'moakt.com', 'tempr.email', 'mailnesia.com', 'spamgourmet.com'];
}

function xf_launch_is_disposable($email) {
    $domain = strtolower(substr(strrchr((string) $email, '@'), 1));
    foreach (xf_launch_disposable_domains() as $d) {
        if ($domain === $d || substr($domain, -strlen('.' . $d)) === '.' . $d) {
            return true;
        }
    }
    return false;
}

/** URL shorteners, adult and gambling terms: any match sends a launch to manual review. */
function xf_launch_blocked_terms($text) {
    $hits = [];
    if (preg_match_all('#\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|shorturl\.at|tiny\.cc|rb\.gy|t\.ly)\b#i', $text, $m)) {
        $hits = array_merge($hits, $m[1]);
    }
    if (preg_match_all('/\b(porn\w*|xxx|nsfw|escorts?|onlyfans|camgirls?|sex|sexy|adult content|casinos?|betting|bets?|gambl\w*|poker|satta|matka|lottery|sportsbook|slot machines?)\b/i', $text, $m)) {
        $hits = array_merge($hits, $m[1]);
    }
    return array_values(array_unique(array_map('strtolower', $hits)));
}

/* ---- Validation ---- */

/** Checks one uploaded image. Returns an error message, or '' when it is fine. */
function xf_launch_check_image($f, $label, $max_bytes, $min_w, $min_h) {
    $mb = $max_bytes / MB_IN_BYTES;
    if (in_array((int) $f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || (int) $f['size'] > $max_bytes) {
        return sprintf('%s is too big. The limit is %s MB.', $label, $mb);
    }
    if ((int) $f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        return sprintf('%s did not upload. Please choose it again.', $label);
    }
    $mimes = ['jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    $check = wp_check_filetype_and_ext($f['tmp_name'], $f['name'], $mimes);
    $real = wp_get_image_mime($f['tmp_name']); // read from the file's bytes, not its name
    if (empty($check['type']) || !in_array($real, $mimes, true)) {
        return sprintf('%s must be a PNG, JPG or WebP image.', $label);
    }
    if (preg_match('/<\?php|<script/i', (string) file_get_contents($f['tmp_name']))) {
        return sprintf('%s must be a plain image file.', $label); // image/PHP or image/HTML polyglot: refuse rather than store it
    }
    $size = @getimagesize($f['tmp_name']); // phpcs:ignore WordPress.PHP.NoSilencedErrors
    if (!$size || $size[0] < $min_w || $size[1] < $min_h || $size[0] > 6000 || $size[1] > 6000) {
        return sprintf('%s must be at least %d×%d pixels (and at most 6000 on a side).', $label, $min_w, $min_h);
    }
    return '';
}

/** One entry of a multi-file input as a single $_FILES-style array. */
function xf_launch_file_at(array $files, $i) {
    return ['name' => $files['name'][$i], 'type' => $files['type'][$i], 'tmp_name' => $files['tmp_name'][$i], 'error' => $files['error'][$i], 'size' => $files['size'][$i]];
}

/**
 * Sanitises and checks the posted form. Returns [$data, $errors, $uploads]:
 * $data is safe to re-show in the form even when there are errors.
 */
function xf_launch_validate(array $in, array $files, $claim = null) {
    $text = function ($k) use ($in) {
        return trim(sanitize_text_field(wp_unslash($in['lf_' . $k] ?? '')));
    };
    $url = function ($k) use ($in) {
        $raw = trim((string) wp_unslash($in['lf_' . $k] ?? ''));
        return $raw === '' ? '' : (string) esc_url_raw($raw, ['https']);
    };
    $d = [];
    $e = [];

    $d['name'] = $text('name');
    if (mb_strlen($d['name']) < 2 || mb_strlen($d['name']) > 80) $e['name'] = 'Enter the product name (2 to 80 characters).';

    $d['website'] = $url('website');
    $d['host'] = xf_launch_host($d['website']);
    if (!$d['website'] || strpos($d['host'], '.') === false) $e['website'] = 'Enter the website address, starting with https://';

    $d['tagline'] = $text('tagline');
    if (mb_strlen($d['tagline']) < 5 || mb_strlen($d['tagline']) > 80) $e['tagline'] = 'Write a tagline of 5 to 80 characters.';

    $d['description'] = trim(sanitize_textarea_field(wp_unslash($in['lf_description'] ?? '')));
    $len = mb_strlen($d['description']);
    if ($len < 100 || $len > 1000) $e['description'] = sprintf('Describe what it does in 100 to 1,000 characters (you wrote %s).', number_format_i18n($len));

    $d['industry'] = absint($in['lf_industry'] ?? 0);
    $has_terms = (bool) get_terms(['taxonomy' => 'xf_industry', 'hide_empty' => false, 'number' => 1, 'fields' => 'ids']);
    if ($has_terms && (!$d['industry'] || !term_exists($d['industry'], 'xf_industry'))) $e['industry'] = 'Choose a category.';

    $d['pricing_model'] = sanitize_key(wp_unslash($in['lf_pricing_model'] ?? ''));
    if (!isset(xf_launch_pricing_models()[$d['pricing_model']])) $e['pricing_model'] = 'Choose a pricing model.';
    $d['pricing_details'] = mb_substr($text('pricing_details'), 0, 200);

    $d['launch_date'] = $text('launch_date');
    $dt = DateTime::createFromFormat('!Y-m-d', $d['launch_date']);
    if (!$dt || $dt->format('Y-m-d') !== $d['launch_date'] || $dt->getTimestamp() < strtotime('-10 years') || $dt->getTimestamp() > strtotime('+1 year')) {
        $e['launch_date'] = 'Enter the launch date (within the next year, or when it launched).';
    }

    $d['ph_url'] = $url('ph_url');
    if (trim((string) ($in['lf_ph_url'] ?? '')) !== '' && !preg_match('/^(www\.)?producthunt\.com$/', (string) wp_parse_url($d['ph_url'], PHP_URL_HOST))) {
        $e['ph_url'] = 'Use a https://www.producthunt.com/… link, or leave it empty.';
    }

    $d['founder_name'] = $text('founder_name');
    if (mb_strlen($d['founder_name']) < 2 || mb_strlen($d['founder_name']) > 80) $e['founder_name'] = 'Enter your name.';
    $d['founder_role'] = $text('founder_role');
    if (mb_strlen($d['founder_role']) < 2 || mb_strlen($d['founder_role']) > 80) $e['founder_role'] = 'Enter your role, e.g. Co-founder & CEO.';
    $d['founder_email'] = strtolower(sanitize_email(wp_unslash($in['lf_founder_email'] ?? '')));
    if (!is_email($d['founder_email'])) $e['founder_email'] = 'Enter a valid work email.';
    $email_domain = strtolower(substr(strrchr($d['founder_email'], '@'), 1));
    $d['email_match'] = $email_domain !== '' && $d['host'] !== '' && ($email_domain === $d['host'] || substr($d['host'], -strlen('.' . $email_domain)) === '.' . $email_domain || substr($email_domain, -strlen('.' . $d['host'])) === '.' . $d['host']);

    $d['founder_social'] = $url('founder_social');
    if (trim((string) ($in['lf_founder_social'] ?? '')) !== '' && !preg_match('/^((www|[a-z]{2})\.)?(x\.com|twitter\.com|linkedin\.com)$/', (string) wp_parse_url($d['founder_social'], PHP_URL_HOST))) {
        $e['founder_social'] = 'Use an https:// link to your X or LinkedIn profile, or leave it empty.';
    }

    $d['india'] = sanitize_key(wp_unslash($in['lf_india'] ?? ''));
    if (!in_array($d['india'], ['yes', 'no'], true)) $e['india'] = 'Tell us whether the startup is based in India.';

    $d['show_name'] = empty($in['lf_show_name']) ? 0 : 1;
    $d['consent'] = empty($in['lf_consent']) ? 0 : 1;
    if (!$d['consent']) $e['consent'] = 'Please confirm you are the founder or authorised to list this product.';
    $d['updates'] = empty($in['lf_updates']) ? 0 : 1;

    $d['qa'] = [];
    foreach (array_keys(xf_launch_qa_questions()) as $k) {
        $a = xf_launch_strip_links(sanitize_textarea_field(wp_unslash($in['lf_qa_' . $k] ?? '')));
        if (mb_strlen($a) > 600) {
            $e['qa_' . $k] = sprintf('Keep this answer under 600 characters (it is %s).', number_format_i18n(mb_strlen($a)));
        }
        if ($a !== '') $d['qa'][$k] = $a;
    }
    $d['qa_consent'] = empty($in['lf_qa_consent']) ? 0 : 1;
    if ($d['qa'] && !$d['qa_consent']) $e['qa_consent'] = 'Tick this box so we can publish your answers, or clear them.';
    $d['claim_of'] = $claim ? (int) $claim->ID : 0;

    // Images: checked here, saved only once everything else is valid.
    $uploads = ['logo' => null, 'shots' => []];
    $logo = $files['lf_logo'] ?? null;
    if ($logo && (int) $logo['error'] !== UPLOAD_ERR_NO_FILE) {
        $err = xf_launch_check_image($logo, 'The logo', MB_IN_BYTES, 128, 128);
        if ($err) {
            $e['logo'] = $err;
        } else {
            $uploads['logo'] = $logo;
        }
    } elseif (!$claim) {
        $e['logo'] = 'Add your logo (PNG, JPG or WebP, square, at least 128×128).';
    }
    $shots = $files['lf_shots'] ?? null;
    if ($shots && is_array($shots['name'])) {
        $picked = array_keys(array_filter($shots['error'], function ($err) { return (int) $err !== UPLOAD_ERR_NO_FILE; }));
        if (count($picked) > 3) {
            $e['shots'] = 'Add up to 3 screenshots.';
        } else {
            foreach ($picked as $n => $i) {
                $f = xf_launch_file_at($shots, $i);
                $err = xf_launch_check_image($f, 'Screenshot ' . ($n + 1), 2 * MB_IN_BYTES, 640, 360);
                if ($err) {
                    $e['shots'] = $err;
                    break;
                }
                $uploads['shots'][] = $f;
            }
        }
    }
    if (($uploads['logo'] || $uploads['shots']) && $e) {
        $e['files_again'] = 'Files are not kept after an error: please choose your logo and screenshots again.';
    }
    return [$d, $e, $uploads];
}

/* ---- Handling the form ---- */

/** Posted to /launch/ itself, so errors re-show the form with what was typed. */
add_action('template_redirect', function () {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !xf_launch_is_page()) {
        return;
    }
    $GLOBALS['xf_launch_state'] = xf_launch_handle($_POST, $_FILES); // phpcs:ignore WordPress.Security.NonceVerification -- signed token instead (cached page)
});

function xf_launch_claim_from_request() {
    $slug = isset($_GET['claim']) ? sanitize_title(wp_unslash($_GET['claim'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification
    $post = $slug ? get_page_by_path($slug, OBJECT, 'xf_startup') : null;
    return $post && $post->post_status === 'publish' ? $post : null;
}

function xf_launch_handle(array $in, array $files) {
    if (empty($in['lf_go'])) {
        // PHP drops the whole body when it is bigger than post_max_size.
        return ['errors' => ['form' => 'The upload was too large. The logo can be up to 1 MB and each screenshot up to 2 MB.'], 'data' => []];
    }
    if ((string) ($in['lf_company_fax'] ?? '') !== '') {
        wp_safe_redirect(xf_launch_page_url(['sent' => 'launch'])); // a bot filled the hidden field: pretend it worked
        exit;
    }
    $claim = null;
    if (!empty($in['lf_claim'])) {
        $claim = get_post(absint($in['lf_claim']));
        if (!$claim || $claim->post_type !== 'xf_startup' || $claim->post_status !== 'publish') {
            $claim = null;
        }
    }
    if (!xf_launch_token_ok($in['lf_token'] ?? '')) {
        return ['errors' => ['form' => 'Please wait a few seconds and send the form again (or reload the page if it has been open for days).'], 'data' => xf_launch_validate($in, [], $claim)[0], 'claim' => $claim];
    }
    [$d, $errors, $uploads] = xf_launch_validate($in, $files, $claim);
    $d['ref'] = substr(sanitize_key((string) ($in['lf_ref'] ?? '')), 0, 40); // which share link brought this founder
    if ($errors) {
        return ['errors' => $errors, 'data' => $d, 'claim' => $claim];
    }

    $lock = 'launch_' . md5($d['host']);
    if (!xf_mutex_acquire($lock, 60, 5)) {
        return ['errors' => ['form' => 'We are busy saving another submission for this website. Please try again in a minute.'], 'data' => $d, 'claim' => $claim];
    }
    try {
        $dupes = xf_launch_find_by_host($d['host'], $claim ? $claim->ID : 0);
        if ($dupes) {
            return ['errors' => ['website' => 'This website already has a listing.'], 'dupe' => get_post($dupes[0]), 'data' => $d, 'claim' => $claim];
        }
        if (xf_rate_limited('launch', 3, HOUR_IN_SECONDS)) {
            return ['errors' => ['form' => 'Too many launches from your connection. Please try again in an hour.'], 'data' => $d, 'claim' => $claim];
        }
        $result = xf_launch_create($d, $uploads, $claim);
    } finally {
        xf_mutex_release($lock);
    }
    if (is_wp_error($result)) {
        return ['errors' => ['form' => 'Something went wrong while saving. Please try again.'], 'data' => $d, 'claim' => $claim];
    }
    wp_safe_redirect(xf_launch_page_url(['sent' => $claim ? 'claim' : 'launch']));
    exit;
}

/** Saves a validated submission. Returns the xf_submission ID or a WP_Error. */
function xf_launch_create(array $d, array $uploads, $claim) {
    $startup_id = 0;
    if (!$claim) {
        $startup_id = wp_insert_post(['post_type' => 'xf_startup', 'post_status' => 'pending', 'post_title' => $d['name'], 'meta_input' => ['_xf_source' => 'launch_form']], true);
        if (is_wp_error($startup_id)) {
            return $startup_id;
        }
    }
    $sub_id = wp_insert_post([
        'post_type' => 'xf_submission',
        'post_status' => 'pending',
        'post_title' => ($claim ? '[Listing update] ' : '[Product launch] ') . $d['name'],
        'post_content' => $d['tagline'] . "\n\n" . $d['description'] . "\n\nWebsite: " . $d['website'],
        'meta_input' => [
            '_xf_type' => 'launch',
            '_xf_name' => $d['founder_name'],
            '_xf_email' => $d['founder_email'],
            '_xf_company' => $d['name'],
            '_xf_startup_id' => $claim ? $claim->ID : $startup_id,
            '_xf_claim_of' => $claim ? $claim->ID : 0,
            '_xf_launch_state' => 'pending',
        ] + (!empty($d['ref']) ? ['_xf_ref' => $d['ref']] : []),
    ], true);
    if (is_wp_error($sub_id)) {
        if ($startup_id) wp_delete_post($startup_id, true); // our own empty, just-created row
        return $sub_id;
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $parent = $startup_id ?: $sub_id; // a claim's files wait on the submission until approved
    $mimes = ['jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    $save = function ($f, $suffix) use ($parent, $d, $mimes) {
        $f['name'] = sanitize_file_name(sanitize_title($d['name']) . '-' . $suffix . '.' . strtolower(pathinfo($f['name'], PATHINFO_EXTENSION)));
        $_FILES['xf_launch_one'] = $f;
        $id = media_handle_upload('xf_launch_one', $parent, ['post_title' => $d['name'] . ' ' . $suffix], ['test_form' => false, 'mimes' => $mimes]);
        unset($_FILES['xf_launch_one']);
        return is_wp_error($id) ? 0 : (int) $id;
    };
    $d['logo_id'] = $uploads['logo'] ? $save($uploads['logo'], 'logo') : 0;
    $d['shot_ids'] = [];
    foreach ($uploads['shots'] as $i => $f) {
        if ($id = $save($f, 'screenshot-' . ($i + 1))) $d['shot_ids'][] = $id;
    }
    $d['consent_text'] = xf_launch_consent_text();
    $d['updates_text'] = $d['updates'] ? xf_launch_updates_text() : '';
    $d['consent_at'] = current_time('mysql');
    $d['qa_consent_text'] = $d['qa'] ? xf_launch_qa_consent_text() : '';
    $d['ip_hash'] = substr(hash_hmac('sha256', xf_client_ip(), wp_salt('auth')), 0, 16); // for abuse checks, never the address itself
    update_post_meta($sub_id, '_xf_launch_data', wp_slash(wp_json_encode($d)));

    if ($startup_id) {
        xf_launch_apply($startup_id, $d);
    }

    xf_launch_mail($sub_id, $d['founder_email'],
        $claim ? 'We got your update for ' . $d['name'] : 'We got your launch: ' . $d['name'],
        xf_launch_email_body('received', $d));
    wp_mail(get_option('admin_email'),
        ($claim ? 'Listing update to review: ' : 'New launch to review: ') . $d['name'],
        "{$d['name']} — {$d['tagline']}\n{$d['website']}\nFrom: {$d['founder_name']} ({$d['founder_role']}) <{$d['founder_email']}>\n\nReview it: " . admin_url('admin.php?page=xf-launches'));
    return $sub_id;
}

function xf_launch_data($sub_id) {
    $d = json_decode((string) get_post_meta($sub_id, '_xf_launch_data', true), true);
    return is_array($d) ? $d : [];
}

/** Writes a submission's details onto a startup listing. */
function xf_launch_apply($startup_id, array $d) {
    wp_update_post(['ID' => $startup_id, 'post_title' => $d['name'], 'post_content' => $d['description'], 'post_excerpt' => $d['tagline']]);
    $meta = [
        '_xf_tagline' => $d['tagline'],
        '_xf_website' => $d['website'],
        '_xf_launch_date' => $d['launch_date'],
        '_xf_pricing_model' => $d['pricing_model'],
        '_xf_pricing_details' => $d['pricing_details'],
        '_xf_india' => $d['india'],
        '_xf_founder_show' => (int) $d['show_name'],
        // Private: never rendered (only name and role, and only with _xf_founder_show).
        '_xf_launch_founder_name' => $d['founder_name'],
        '_xf_launch_founder_role' => $d['founder_role'],
        '_xf_launch_founder_email' => $d['founder_email'],
        '_xf_launch_founder_social' => $d['founder_social'],
    ];
    if ($d['ph_url'] !== '') $meta['_xf_ph_url'] = $d['ph_url'];
    if (!empty($d['qa'])) {
        // Stays private (approved = 0) until the launch or update is approved.
        $meta['_xf_founder_qa'] = wp_slash(wp_json_encode([
            'answers' => $d['qa'], 'name' => $d['founder_name'], 'role' => $d['founder_role'],
            'consent_text' => $d['qa_consent_text'], 'consent_at' => $d['consent_at'], 'answered_at' => substr($d['consent_at'], 0, 10),
        ]));
        $meta['_xf_founder_qa_approved'] = 0;
    }
    foreach ($meta as $k => $v) {
        update_post_meta($startup_id, $k, $v);
    }
    if ($d['industry']) {
        wp_set_object_terms($startup_id, [(int) $d['industry']], 'xf_industry');
    }
    if (!empty($d['logo_id'])) {
        wp_update_post(['ID' => $d['logo_id'], 'post_parent' => $startup_id]);
        set_post_thumbnail($startup_id, $d['logo_id']);
    }
    if (!empty($d['shot_ids'])) {
        foreach ($d['shot_ids'] as $sid) wp_update_post(['ID' => $sid, 'post_parent' => $startup_id]);
        update_post_meta($startup_id, '_xf_launch_shots', array_map('intval', $d['shot_ids']));
    }
}

/** Founder-supplied screenshots in the theme's gallery shape. */
function xf_launch_gallery($startup_id) {
    $out = [];
    foreach ((array) get_post_meta($startup_id, '_xf_launch_shots', true) as $aid) {
        $img = $aid ? wp_get_attachment_image_src((int) $aid, 'large') : null;
        if ($img) {
            $out[] = ['url' => $img[0], 'w' => $img[1], 'h' => $img[2], 'alt' => get_the_title($startup_id) . ' screenshot', 'credit' => 'Screenshot supplied by the founder'];
        }
    }
    return $out;
}

/* ---- Email ---- */

/** Sends through the outreach mailbox when it is set up, else wp_mail. Every send is logged on the submission. */
function xf_launch_mail($sub_id, $to, $subject, $body) {
    $ok = false;
    if (function_exists('xf_smtp_configured') && xf_smtp_configured() && function_exists('xf_new_mailer')) {
        try {
            $mail = xf_new_mailer();
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $ok = $mail->send();
            $mail->smtpClose();
        } catch (Exception $e) {
            $ok = false;
        }
    }
    if (!$ok) {
        $s = xf_get_settings();
        $headers = [];
        if (xf_from_email()) $headers[] = 'From: ' . $s['from_name'] . ' <' . xf_from_email() . '>';
        if ($s['reply_to']) $headers[] = 'Reply-To: ' . $s['reply_to'];
        $ok = wp_mail($to, $subject, $body, $headers);
    }
    add_post_meta($sub_id, '_xf_launch_email', wp_slash(wp_json_encode(['at' => current_time('mysql'), 'to' => $to, 'subject' => $subject, 'ok' => (bool) $ok])));
    return $ok;
}

function xf_launch_email_body($kind, array $d, $extra = '') {
    $first = strtok($d['founder_name'], ' ') ?: 'there';
    $sign = [ '', xf_get_setting('from_name') ?: '100xFounder', '100xFounder · ' . home_url('/')];
    $is_claim = !empty($d['claim_of']);
    if ($kind === 'received') {
        $when = xf_get_setting('launch_auto_approve')
            ? 'We check every launch before it goes live. Most are live within a day; some need an editor to look at them, which takes up to 3 days.'
            : 'We review every launch, usually within 3 days.';
        $lines = ["Hi $first,", '',
            $is_claim ? "Thanks for sending an update to the {$d['name']} listing on 100xFounder. An editor checks every update before it changes the page, usually within 3 days."
                      : "Thanks for launching {$d['name']} on 100xFounder. $when",
            '', "We'll email you here when it's done. Listing on 100xFounder is free.",
            '', "Need to change something? Just reply to this email."];
    } elseif ($kind === 'live') {
        $lines = ["Hi $first,", '',
            $is_claim ? "Your update is live: $extra" : "{$d['name']} is live on 100xFounder: $extra", '',
            'Two things that help it get found:',
            '1. Share the link with your audience on X, LinkedIn or your newsletter.',
            "2. Invite your users to leave an honest review on the page ({$extra}#reviews). Reviews come only from real users; please don't offer anything in return for them.",
            '', 'If anything on the page is wrong, reply to this email and we will fix it.'];
    } else {
        $lines = ["Hi $first,", '',
            $is_claim ? "We couldn't apply your update to the {$d['name']} listing this time." : "We couldn't list {$d['name']} on 100xFounder this time."];
        if ($extra !== '') $lines = array_merge($lines, ['', 'The reason: ' . $extra]);
        $lines = array_merge($lines, ['', 'If you can fix it, you are welcome to submit again: ' . xf_launch_page_url(), 'Questions? Reply to this email.']);
    }
    return implode("\n", array_merge($lines, $sign));
}

/* ---- Decisions ---- */

/** Approves or rejects one launch submission. $auto marks an approval by the 10-minute check. */
function xf_launch_decide($sub_id, $decision, array $opts = []) {
    $lock = 'launch_decide_' . (int) $sub_id;
    if (!xf_mutex_acquire($lock, 120)) {
        return new WP_Error('busy', 'This submission is being processed. Reload in a moment.');
    }
    try {
        $state = get_post_meta($sub_id, '_xf_launch_state', true);
        if (!in_array($state, ['pending', 'needs_review'], true)) {
            return new WP_Error('done', 'This submission was already decided.');
        }
        $d = xf_launch_data($sub_id);
        $startup_id = (int) get_post_meta($sub_id, '_xf_startup_id', true);
        if (!$d || !$startup_id || !get_post($startup_id)) {
            return new WP_Error('missing', 'The listing for this submission no longer exists.');
        }
        $by = !empty($opts['auto']) ? 'auto' : (string) get_current_user_id();
        if ($decision === 'approve') {
            if (!empty($d['claim_of'])) {
                if (!empty($opts['auto'])) {
                    return new WP_Error('claim', 'Claims always need manual approval.'); // never by the cron, whatever calls it
                }
                xf_launch_apply($startup_id, $d);
            } elseif (get_post_status($startup_id) !== 'pending') {
                // Someone already trashed, drafted or published the listing by hand: don't override them.
                return new WP_Error('moved', 'The listing is no longer pending (it was edited, trashed or published by hand).');
            } else {
                wp_update_post(['ID' => $startup_id, 'post_status' => 'publish']);
            }
            if (!empty($d['qa'])) update_post_meta($startup_id, '_xf_founder_qa_approved', 1);
            $new_state = !empty($opts['auto']) ? 'auto_approved' : 'approved';
            update_post_meta($startup_id, '_xf_launch_state', $new_state);
            xf_launch_add_contact($d, $startup_id);
            $url = get_permalink($startup_id);
            xf_launch_mail($sub_id, $d['founder_email'], ($d['claim_of'] ? 'Your update is live: ' : "You're live: ") . $d['name'], xf_launch_email_body('live', $d, $url));
        } else {
            $new_state = 'rejected';
            if (empty($d['claim_of'])) {
                wp_trash_post($startup_id); // recoverable from Trash
            }
            $reason = sanitize_textarea_field((string) ($opts['reason'] ?? ''));
            update_post_meta($sub_id, '_xf_launch_reason', $reason);
            if (!empty($opts['email'])) {
                xf_launch_mail($sub_id, $d['founder_email'], 'About your 100xFounder listing: ' . $d['name'], xf_launch_email_body('rejected', $d, $reason));
            }
        }
        update_post_meta($sub_id, '_xf_launch_state', $new_state);
        update_post_meta($sub_id, '_xf_launch_decided', current_time('mysql') . ' by ' . $by);
        wp_update_post(['ID' => $sub_id, 'post_status' => 'private']);
        return $new_state;
    } finally {
        xf_mutex_release($lock);
    }
}

/** Founders who ticked the optional box join the founder contacts as opted in (never the cold sequence). */
function xf_launch_add_contact(array $d, $startup_id) {
    global $wpdb;
    if (empty($d['updates']) || xf_is_suppressed($d['founder_email'])) {
        return;
    }
    $t = xf_table('contacts');
    $inserted = $wpdb->query($wpdb->prepare(
        "INSERT IGNORE INTO $t (startup_id, email, name, twitter_url, linkedin_url, discovered_from, status, step, next_send_at, token, created_at, updated_at)
         VALUES (%d, %s, %s, %s, %s, %s, 'opted_in', 0, NULL, %s, %s, %s)",
        $startup_id, $d['founder_email'], $d['founder_name'],
        strpos($d['founder_social'], 'linkedin.com') === false ? $d['founder_social'] : '',
        strpos($d['founder_social'], 'linkedin.com') !== false ? $d['founder_social'] : '',
        'launch_form', wp_generate_password(40, false), xf_now(), xf_now()
    ));
    if (!$inserted) {
        // Already a cold-outreach contact: they have now opted in, so the cold sequence stops.
        $wpdb->query($wpdb->prepare(
            "UPDATE $t SET status = 'opted_in', next_send_at = NULL, discovered_from = 'launch_form', updated_at = %s WHERE email = %s AND status IN ('queued','contacted','sequence_done')",
            xf_now(), $d['founder_email']
        ));
    }
}

/* ---- Auto-approve after 10 minutes ---- */

/** Reasons a launch must wait for a person. Empty array = safe to publish. */
function xf_launch_auto_blockers(array $d, $startup_id) {
    $r = [];
    if (!empty($d['claim_of'])) {
        return ['Claims and updates of existing listings always need manual approval.'];
    }
    if ($hits = xf_launch_blocked_terms(implode(' ', array_merge([$d['name'], $d['tagline'], $d['description'], $d['website'], $d['pricing_details'], $d['founder_name'], $d['founder_role']], array_values((array) ($d['qa'] ?? [])))))) {
        $r[] = 'Contains blocked terms: ' . implode(', ', $hits) . '.';
    }
    if (xf_launch_is_disposable($d['founder_email'])) {
        $r[] = 'The founder email is on a disposable-mail domain.';
    }
    if (xf_launch_find_by_host($d['host'], $startup_id, ['publish'])) {
        $r[] = 'This domain is already listed.';
    }
    if (!$r && ($why = xf_launch_site_problem($d['website']))) {
        $r[] = $why;
    }
    return $r;
}

/**
 * '' when the site answers 200 over https; otherwise what went wrong. Redirects are followed by
 * hand (at most 3) so every hop is checked by xf_url_is_public().
 * shortcut: DNS is resolved again by cURL after the check (rebinding window); the probe is blind
 * (only the status code is used), so pin the IP with CURLOPT_RESOLVE if responses are ever read.
 */
function xf_launch_site_problem($url) {
    $args = ['timeout' => 10, 'redirection' => 0, 'user-agent' => 'Mozilla/5.0 (compatible; 100xFounderBot/1.0; +' . home_url('/') . ')'];
    for ($hop = 0; $hop <= 3; $hop++) {
        if (strpos($url, 'https://') !== 0) {
            return $hop ? 'The website redirects away from https.' : 'The website is not https.';
        }
        if (!function_exists('xf_url_is_public') || !xf_url_is_public($url)) { // fail closed without security.php
            return 'The website address does not resolve to a public server.';
        }
        $res = wp_safe_remote_head($url, $args);
        $code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
        if (!is_wp_error($res) && $code !== 200 && ($code < 300 || $code > 399)) {
            $res = wp_safe_remote_get($url, $args + ['limit_response_size' => 65536]); // some sites refuse HEAD
            $code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
        }
        if (is_wp_error($res)) {
            return 'The website did not respond: ' . $res->get_error_message();
        }
        if ($code >= 300 && $code <= 399) {
            $loc = wp_remote_retrieve_header($res, 'location');
            $loc = is_array($loc) ? end($loc) : (string) $loc;
            if ($loc === '') {
                return "The website answered HTTP $code without a destination.";
            }
            $url = WP_Http::make_absolute_url($loc, $url);
            continue;
        }
        return $code === 200 ? '' : "The website answered HTTP $code, not 200.";
    }
    return 'The website redirects too many times.';
}

function xf_launch_auto_tick() {
    if (!xf_get_setting('launch_auto_approve') || !xf_mutex_acquire('launch_auto', 300)) {
        return [];
    }
    $done = [];
    try {
        $ids = get_posts([
            'post_type' => 'xf_submission', 'post_status' => 'pending', 'posts_per_page' => 10, 'fields' => 'ids', 'orderby' => 'date', 'order' => 'ASC',
            // Pending posts keep post_date_gmt at 0000-00-00, so compare post_date in site time.
            'date_query' => [['column' => 'post_date', 'before' => wp_date('Y-m-d H:i:s', time() - XF_LAUNCH_AUTO_MINUTES * MINUTE_IN_SECONDS)]],
            'meta_query' => [['key' => '_xf_type', 'value' => 'launch'], ['key' => '_xf_launch_state', 'value' => 'pending']],
        ]);
        foreach ($ids as $sub_id) {
            $blockers = xf_launch_auto_blockers(xf_launch_data($sub_id), (int) get_post_meta($sub_id, '_xf_startup_id', true));
            if ($blockers) {
                update_post_meta($sub_id, '_xf_launch_state', 'needs_review');
                update_post_meta($sub_id, '_xf_launch_flags', $blockers);
                $done[$sub_id] = 'needs_review';
            } else {
                $res = xf_launch_decide($sub_id, 'approve', ['auto' => true]);
                if (is_wp_error($res) && $res->get_error_code() !== 'busy' && $res->get_error_code() !== 'done') {
                    update_post_meta($sub_id, '_xf_launch_state', 'needs_review'); // stop retrying it every 5 minutes
                    update_post_meta($sub_id, '_xf_launch_flags', [$res->get_error_message()]);
                }
                $done[$sub_id] = is_wp_error($res) ? $res->get_error_code() : $res;
            }
        }
    } finally {
        xf_mutex_release('launch_auto');
    }
    return $done;
}
add_action('xf_launch_auto_tick', 'xf_launch_auto_tick');

add_filter('cron_schedules', function ($schedules) {
    $schedules['xf_five_minutes'] = ['interval' => 5 * MINUTE_IN_SECONDS, 'display' => 'Every 5 minutes (100xFounder launches)'];
    return $schedules;
});
add_action('init', function () {
    if (!wp_next_scheduled('xf_launch_auto_tick')) {
        wp_schedule_event(time() + MINUTE_IN_SECONDS, 'xf_five_minutes', 'xf_launch_auto_tick');
    }
});
register_deactivation_hook(XF_FILE, function () {
    wp_clear_scheduled_hook('xf_launch_auto_tick');
});

/* ---- Admin: Launch submissions ---- */

function xf_launch_waiting_count() {
    return count(get_posts([
        'post_type' => 'xf_submission', 'post_status' => 'pending', 'posts_per_page' => 100, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_type', 'value' => 'launch']],
    ]));
}

add_action('admin_menu', function () {
    $n = xf_launch_waiting_count();
    add_submenu_page('xf', 'Launch submissions', 'Launches' . ($n ? ' <span class="awaiting-mod">' . (int) $n . '</span>' : ''), 'manage_options', 'xf-launches', 'xf_launch_admin_page');
}, 20);

add_filter('display_post_states', function ($states, $post) {
    if ($post->post_type === 'xf_startup' && get_post_meta($post->ID, '_xf_launch_state', true) === 'auto_approved') {
        $states['xf_auto'] = 'Auto-approved launch';
    } elseif ($post->post_type === 'xf_startup' && get_post_meta($post->ID, '_xf_source', true) === 'launch_form' && $post->post_status === 'pending') {
        $states['xf_launch'] = 'Launch form';
    }
    return $states;
}, 10, 2);

add_action('admin_post_xf_launch_decide', function () {
    $id = absint($_POST['sub'] ?? 0);
    if (!current_user_can('manage_options') || !check_admin_referer('xf_launch_decide_' . $id)) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $decision = ($_POST['decision'] ?? '') === 'approve' ? 'approve' : 'reject';
    $res = xf_launch_decide($id, $decision, [
        'reason' => wp_unslash($_POST['reason'] ?? ''), // sanitised in xf_launch_decide
        'email' => !empty($_POST['email_founder']),
    ]);
    $msg = is_wp_error($res) ? $res->get_error_message() : ($decision === 'approve' ? 'Approved and published. The founder has been emailed.' : 'Rejected.');
    wp_safe_redirect(add_query_arg('xf_msg', rawurlencode($msg), admin_url('admin.php?page=xf-launches')));
    exit;
});

function xf_launch_admin_page() {
    $msg = isset($_GET['xf_msg']) ? sanitize_text_field(wp_unslash($_GET['xf_msg'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification
    $view = isset($_GET['view']) && $_GET['view'] === 'done' ? 'done' : 'open'; // phpcs:ignore WordPress.Security.NonceVerification
    $ids = get_posts([
        'post_type' => 'xf_submission', 'post_status' => $view === 'open' ? 'pending' : 'private', 'posts_per_page' => 100, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_type', 'value' => 'launch']],
    ]);
    $auto = (bool) xf_get_setting('launch_auto_approve');
    $labels = ['pending' => 'Waiting', 'needs_review' => 'Needs manual review', 'approved' => 'Approved', 'auto_approved' => 'Auto-approved', 'rejected' => 'Rejected'];
    ?>
    <div class="wrap">
        <h1>Launch submissions</h1>
        <p>Free launches from <a href="<?php echo esc_url(xf_launch_page_url()); ?>" target="_blank"><?php echo esc_html(xf_launch_page_url()); ?></a>.
            <?php echo $auto
                ? esc_html('Auto-approve is on: after ' . XF_LAUNCH_AUTO_MINUTES . ' minutes, a new launch that passes every check is published. Claims and anything flagged wait for you.')
                : 'Auto-approve is off: every launch waits for you.'; ?>
            <a href="<?php echo esc_url(admin_url('admin.php?page=xf-settings')); ?>">Settings</a></p>
        <?php if ($msg) : ?><div class="notice notice-info"><p><?php echo esc_html($msg); ?></p></div><?php endif; ?>
        <?php $refs = function_exists('xf_share_launch_ref_counts') ? xf_share_launch_ref_counts() : []; ?>
        <p><strong>Launches from share links:</strong>
            <?php echo $refs ? esc_html(implode(' · ', array_map(function ($r) { return $r->ref . ': ' . (int) $r->n; }, $refs))) : 'none yet. The success page asks founders to share ' . esc_html(function_exists('xf_share_launch_url') ? xf_share_launch_url() : xf_launch_page_url()) . '.'; ?></p>
        <ul class="subsubsub">
            <li><a href="<?php echo esc_url(admin_url('admin.php?page=xf-launches')); ?>" <?php echo $view === 'open' ? 'class="current"' : ''; ?>>To review</a> |</li>
            <li><a href="<?php echo esc_url(admin_url('admin.php?page=xf-launches&view=done')); ?>" <?php echo $view === 'done' ? 'class="current"' : ''; ?>>Decided</a></li>
        </ul>
        <table class="widefat striped" style="clear:both">
            <thead><tr><th>Product</th><th>Founder (private)</th><th>Checks</th><th>Status</th><th style="width:300px">Action</th></tr></thead>
            <tbody>
            <?php if (!$ids) : ?><tr><td colspan="5">Nothing here.</td></tr><?php endif; ?>
            <?php foreach ($ids as $sid) :
                $d = xf_launch_data($sid);
                if (!$d) continue;
                $startup_id = (int) get_post_meta($sid, '_xf_startup_id', true);
                $state = (string) get_post_meta($sid, '_xf_launch_state', true);
                $flags = array_filter((array) get_post_meta($sid, '_xf_launch_flags', true));
                $checks = [];
                if (!empty($d['claim_of'])) $checks[] = 'Claim / update of the live listing';
                if ($ref = get_post_meta($sid, '_xf_ref', true)) $checks[] = 'Came from share link: ' . $ref;
                $checks[] = $d['email_match'] ? 'Email domain matches the website' : 'Email domain does NOT match the website';
                if (xf_launch_is_disposable($d['founder_email'])) $checks[] = 'Disposable email domain';
                if ($hits = xf_launch_blocked_terms($d['name'] . ' ' . $d['tagline'] . ' ' . $d['description'] . ' ' . $d['website'])) $checks[] = 'Blocked terms: ' . implode(', ', $hits);
                $checks[] = 'India-based: ' . $d['india'];
                $checks[] = $d['show_name'] ? 'Wants name shown on the page' : 'Name kept private';
                $checks[] = $d['updates'] ? 'Opted in to emails' : 'No email opt-in';
                if (!empty($d['qa'])) $checks[] = 'Founder Q&A: ' . count($d['qa']) . ' answers (consent ticked)';
                ?>
                <tr>
                    <td><strong><?php echo esc_html($d['name']); ?></strong> <?php echo get_post_status($startup_id) === 'trash' ? '(in Trash)' : ''; ?><br>
                        <?php echo esc_html($d['tagline']); ?><br>
                        <a href="<?php echo esc_url($d['website']); ?>" target="_blank" rel="noopener nofollow"><?php echo esc_html($d['host']); ?></a>
                        <?php if ($d['ph_url']) : ?> · <a href="<?php echo esc_url($d['ph_url']); ?>" target="_blank" rel="noopener nofollow">Product Hunt</a><?php endif; ?><br>
                        <?php echo esc_html(xf_launch_pricing_models()[$d['pricing_model']] ?? '') . ($d['pricing_details'] ? ' — ' . esc_html($d['pricing_details']) : ''); ?> · launch <?php echo esc_html($d['launch_date']); ?><br>
                        <?php if ($startup_id && get_post_status($startup_id) !== 'trash') : ?>
                            <a href="<?php echo esc_url(get_edit_post_link($startup_id)); ?>">Edit listing</a> ·
                            <a href="<?php echo esc_url(get_post_status($startup_id) === 'publish' ? get_permalink($startup_id) : get_preview_post_link($startup_id)); ?>" target="_blank"><?php echo get_post_status($startup_id) === 'publish' ? 'View' : 'Preview'; ?></a>
                        <?php endif; ?>
                        <details><summary>Description</summary><p style="white-space:pre-wrap"><?php echo esc_html($d['description']); ?></p></details>
                        <?php if (!empty($d['qa'])) : ?><details><summary>Founder Q&amp;A</summary><?php foreach ($d['qa'] as $k => $a) : ?><p><strong><?php echo esc_html(xf_launch_qa_questions()[$k] ?? $k); ?></strong><br><span style="white-space:pre-wrap"><?php echo esc_html($a); ?></span></p><?php endforeach; ?></details><?php endif; ?>
                    </td>
                    <td><?php echo esc_html($d['founder_name'] . ', ' . $d['founder_role']); ?><br><a href="mailto:<?php echo esc_attr($d['founder_email']); ?>"><?php echo esc_html($d['founder_email']); ?></a>
                        <?php if ($d['founder_social']) : ?><br><a href="<?php echo esc_url($d['founder_social']); ?>" target="_blank" rel="noopener nofollow">Profile</a><?php endif; ?></td>
                    <td><ul style="margin:0"><?php foreach ($checks as $c) echo '<li>' . esc_html($c) . '</li>'; ?></ul></td>
                    <td><strong><?php echo esc_html($labels[$state] ?? $state); ?></strong><br><?php echo esc_html(get_the_date('j M Y, H:i', $sid)); ?>
                        <?php if ($flags) : ?><ul style="margin:6px 0 0;color:#b32d2e"><?php foreach ($flags as $f) echo '<li>' . esc_html($f) . '</li>'; ?></ul><?php endif; ?>
                        <?php if ($dec = get_post_meta($sid, '_xf_launch_decided', true)) echo '<br>' . esc_html($dec); ?>
                        <?php if ($reason = get_post_meta($sid, '_xf_launch_reason', true)) echo '<br>Reason: ' . esc_html($reason); ?></td>
                    <td>
                        <?php if (in_array($state, ['pending', 'needs_review'], true)) : ?>
                            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-bottom:8px">
                                <input type="hidden" name="action" value="xf_launch_decide"><input type="hidden" name="sub" value="<?php echo (int) $sid; ?>"><input type="hidden" name="decision" value="approve">
                                <?php wp_nonce_field('xf_launch_decide_' . $sid); ?>
                                <button class="button button-primary"><?php echo empty($d['claim_of']) ? 'Approve and publish' : 'Approve and apply update'; ?></button>
                            </form>
                            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                                <input type="hidden" name="action" value="xf_launch_decide"><input type="hidden" name="sub" value="<?php echo (int) $sid; ?>"><input type="hidden" name="decision" value="reject">
                                <?php wp_nonce_field('xf_launch_decide_' . $sid); ?>
                                <textarea name="reason" rows="2" style="width:100%" placeholder="Reason (optional, sent to the founder)"></textarea>
                                <label><input type="checkbox" name="email_founder" value="1" checked> Email the founder</label><br>
                                <button class="button">Reject</button>
                            </form>
                        <?php elseif ($state === 'auto_approved' || $state === 'approved') : ?>
                            To unpublish, <a href="<?php echo esc_url(get_edit_post_link($startup_id)); ?>">edit the listing</a> and switch it to Draft.
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}
