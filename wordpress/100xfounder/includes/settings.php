<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * All plugin settings live in one option. Secrets can instead be defined as
 * constants in wp-config.php (e.g. define('XF_SMTP_PASS', '...')), which win.
 */
function xf_setting_defaults() {
    return [
        'ph_token' => '',
        'ph_top_n' => 10,
        'ph_top_featured_rank' => 5,
        'ph_vote_threshold' => 100,
        'outreach_enabled' => 0,
        'daily_limit' => 10,
        'followup_1_days' => 3,
        'followup_2_days' => 4,
        'from_name' => '100xFounder',
        'from_email' => '',
        'reply_to' => '',
        'postal_address' => '',
        'smtp_host' => 'smtp.hostinger.com',
        'smtp_port' => 465,
        'smtp_user' => '',
        'smtp_pass' => '',
        'imap_host' => 'imap.hostinger.com',
        'imap_port' => 993,
        'auto_publish' => 0,
        'instagram_handle' => '100x.founder',
        'cron_key' => '',
        'adsense_client' => 'ca-pub-4106130565884060',
        'adsense_slot' => '',
        'footer_links' => 1,
        'event_feeds' => '',
        'google_service_account' => '',
        'gsc_verification' => '',
        'bing_verification' => '',
        'ga4_id' => '',
        'indexnow_enabled' => 1,
        'mcp_allow_publish' => 0,
        'instagram_url' => 'https://www.instagram.com/100x.founder/',
        'linkedin_url' => '',
        'x_url' => '',
        'logo_url' => '',
        'default_social_image' => '',
    ];
}

const XF_SECRET_CONSTANTS = [
    'ph_token' => 'XF_PH_TOKEN',
    'smtp_pass' => 'XF_SMTP_PASS',
    'smtp_user' => 'XF_SMTP_USER',
    'google_service_account' => 'XF_GOOGLE_SERVICE_ACCOUNT',
];

function xf_get_settings() {
    $saved = get_option('xf_settings', []);
    $settings = array_merge(xf_setting_defaults(), is_array($saved) ? $saved : []);
    foreach (XF_SECRET_CONSTANTS as $key => $constant) {
        if (defined($constant) && constant($constant) !== '') {
            $settings[$key] = constant($constant);
        }
    }
    return $settings;
}

function xf_get_setting($key) {
    $settings = xf_get_settings();
    return $settings[$key] ?? null;
}

function xf_update_settings(array $values) {
    $saved = get_option('xf_settings', []);
    update_option('xf_settings', array_merge(is_array($saved) ? $saved : [], $values), false);
}

function xf_smtp_configured() {
    $s = xf_get_settings();
    return $s['smtp_host'] !== '' && $s['smtp_user'] !== '' && $s['smtp_pass'] !== '' && xf_from_email() !== '';
}

function xf_imap_available() {
    $s = xf_get_settings();
    return function_exists('imap_open') && $s['imap_host'] !== '' && $s['smtp_user'] !== '' && $s['smtp_pass'] !== '';
}

function xf_from_email() {
    $s = xf_get_settings();
    return $s['from_email'] !== '' ? $s['from_email'] : $s['smtp_user'];
}
