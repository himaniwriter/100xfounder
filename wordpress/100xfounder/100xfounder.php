<?php
/**
 * Plugin Name: 100xFounder
 * Description: Startup launch directory for 100xfounder.com: daily Product Hunt launches, founder outreach over SMTP, founder spotlights and Instagram carousels.
 * Version: 1.6.0
 * Requires at least: 6.3
 * Requires PHP: 7.4
 * Author: 100xFounder
 * License: GPL-2.0-or-later
 * Text Domain: xf
 */

if (!defined('ABSPATH')) {
    exit;
}

define('XF_VERSION', '1.9.0');
define('XF_DB_VERSION', '18');
define('XF_FILE', __FILE__);
define('XF_DIR', plugin_dir_path(__FILE__));
define('XF_URL', plugin_dir_url(__FILE__));

// A file the server cannot read (mid-upload, quarantined) is skipped rather than taking the whole site down.
if (is_readable(XF_DIR . 'includes/security.php')) { require_once XF_DIR . 'includes/security.php'; }
if (is_readable(XF_DIR . 'includes/settings.php')) { require_once XF_DIR . 'includes/settings.php'; }
if (is_readable(XF_DIR . 'includes/fields.php')) { require_once XF_DIR . 'includes/fields.php'; }
if (is_readable(XF_DIR . 'includes/schema.php')) { require_once XF_DIR . 'includes/schema.php'; }
if (is_readable(XF_DIR . 'includes/post-types.php')) { require_once XF_DIR . 'includes/post-types.php'; }
if (is_readable(XF_DIR . 'includes/startup-profile.php')) { require_once XF_DIR . 'includes/startup-profile.php'; }
if (is_readable(XF_DIR . 'includes/shark-tank.php')) { require_once XF_DIR . 'includes/shark-tank.php'; }
if (is_readable(XF_DIR . 'includes/producthunt.php')) { require_once XF_DIR . 'includes/producthunt.php'; }
if (is_readable(XF_DIR . 'includes/contacts.php')) { require_once XF_DIR . 'includes/contacts.php'; }
if (is_readable(XF_DIR . 'includes/outreach.php')) { require_once XF_DIR . 'includes/outreach.php'; }
if (is_readable(XF_DIR . 'includes/outreach-dashboard.php')) { require_once XF_DIR . 'includes/outreach-dashboard.php'; }
if (is_readable(XF_DIR . 'includes/outreach-ai.php')) { require_once XF_DIR . 'includes/outreach-ai.php'; }
if (is_readable(XF_DIR . 'includes/outreach-inbox.php')) { require_once XF_DIR . 'includes/outreach-inbox.php'; }
if (is_readable(XF_DIR . 'includes/spotlights.php')) { require_once XF_DIR . 'includes/spotlights.php'; }
if (is_readable(XF_DIR . 'includes/instagram.php')) { require_once XF_DIR . 'includes/instagram.php'; }
if (is_readable(XF_DIR . 'includes/instagram-templates.php')) { require_once XF_DIR . 'includes/instagram-templates.php'; }
if (is_readable(XF_DIR . 'includes/instagram-publish.php')) { require_once XF_DIR . 'includes/instagram-publish.php'; }
if (is_readable(XF_DIR . 'includes/instagram-posted.php')) { require_once XF_DIR . 'includes/instagram-posted.php'; }
if (is_readable(XF_DIR . 'includes/instagram-improve.php')) { require_once XF_DIR . 'includes/instagram-improve.php'; }
if (is_readable(XF_DIR . 'includes/instagram-admin.php')) { require_once XF_DIR . 'includes/instagram-admin.php'; }
if (is_readable(XF_DIR . 'includes/pipeline.php')) { require_once XF_DIR . 'includes/pipeline.php'; }
if (is_readable(XF_DIR . 'includes/shortcodes.php')) { require_once XF_DIR . 'includes/shortcodes.php'; }
if (is_readable(XF_DIR . 'includes/adsense.php')) { require_once XF_DIR . 'includes/adsense.php'; }
if (is_readable(XF_DIR . 'includes/news.php')) { require_once XF_DIR . 'includes/news.php'; }
if (is_readable(XF_DIR . 'includes/languages.php')) { require_once XF_DIR . 'includes/languages.php'; }
if (is_readable(XF_DIR . 'includes/redirects.php')) { require_once XF_DIR . 'includes/redirects.php'; }
if (is_readable(XF_DIR . 'includes/importer.php')) { require_once XF_DIR . 'includes/importer.php'; }
if (is_readable(XF_DIR . 'includes/events.php')) { require_once XF_DIR . 'includes/events.php'; }
if (is_readable(XF_DIR . 'includes/rounds.php')) { require_once XF_DIR . 'includes/rounds.php'; }
if (is_readable(XF_DIR . 'includes/funding-report.php')) { require_once XF_DIR . 'includes/funding-report.php'; }
if (is_readable(XF_DIR . 'includes/engagement.php')) { require_once XF_DIR . 'includes/engagement.php'; }
if (is_readable(XF_DIR . 'includes/submissions.php')) { require_once XF_DIR . 'includes/submissions.php'; }
if (is_readable(XF_DIR . 'includes/launch.php')) { require_once XF_DIR . 'includes/launch.php'; }
if (is_readable(XF_DIR . 'includes/leads.php')) { require_once XF_DIR . 'includes/leads.php'; }
if (is_readable(XF_DIR . 'includes/communities.php')) { require_once XF_DIR . 'includes/communities.php'; }
if (is_readable(XF_DIR . 'includes/sources.php')) { require_once XF_DIR . 'includes/sources.php'; }
if (is_readable(XF_DIR . 'includes/seo.php')) { require_once XF_DIR . 'includes/seo.php'; }
if (is_readable(XF_DIR . 'includes/reviews.php')) { require_once XF_DIR . 'includes/reviews.php'; }
if (is_readable(XF_DIR . 'includes/discovery.php')) { require_once XF_DIR . 'includes/discovery.php'; }
if (is_readable(XF_DIR . 'includes/crawl.php')) { require_once XF_DIR . 'includes/crawl.php'; }
if (is_readable(XF_DIR . 'includes/ratings.php')) { require_once XF_DIR . 'includes/ratings.php'; }
if (is_readable(XF_DIR . 'includes/startup-reviews.php')) { require_once XF_DIR . 'includes/startup-reviews.php'; }
if (is_readable(XF_DIR . 'includes/meter.php')) { require_once XF_DIR . 'includes/meter.php'; }
if (is_readable(XF_DIR . 'includes/meter-growth.php')) { require_once XF_DIR . 'includes/meter-growth.php'; }
if (is_readable(XF_DIR . 'includes/popup.php')) { require_once XF_DIR . 'includes/popup.php'; }
if (is_readable(XF_DIR . 'includes/gated-list.php')) { require_once XF_DIR . 'includes/gated-list.php'; }
if (is_readable(XF_DIR . 'includes/queue.php')) { require_once XF_DIR . 'includes/queue.php'; }
if (is_readable(XF_DIR . 'includes/jobs.php')) { require_once XF_DIR . 'includes/jobs.php'; }
if (is_readable(XF_DIR . 'includes/tools.php')) { require_once XF_DIR . 'includes/tools.php'; }
if (is_readable(XF_DIR . 'includes/guides.php')) { require_once XF_DIR . 'includes/guides.php'; }
if (is_readable(XF_DIR . 'includes/mcp.php')) { require_once XF_DIR . 'includes/mcp.php'; }
if (is_readable(XF_DIR . 'includes/schema-pages.php')) { require_once XF_DIR . 'includes/schema-pages.php'; }
if (is_readable(XF_DIR . 'includes/internal-links.php')) { require_once XF_DIR . 'includes/internal-links.php'; }
if (is_readable(XF_DIR . 'includes/external-links.php')) { require_once XF_DIR . 'includes/external-links.php'; }
if (is_readable(XF_DIR . 'includes/breadcrumbs.php')) { require_once XF_DIR . 'includes/breadcrumbs.php'; }
if (is_readable(XF_DIR . 'includes/ai-content.php')) { require_once XF_DIR . 'includes/ai-content.php'; }
if (function_exists('xf_ai_call') && is_readable(XF_DIR . 'includes/ai-research.php')) { require_once XF_DIR . 'includes/ai-research.php'; }
if (is_readable(XF_DIR . 'includes/indexing.php')) { require_once XF_DIR . 'includes/indexing.php'; }
if (is_readable(XF_DIR . 'includes/index-control.php')) { require_once XF_DIR . 'includes/index-control.php'; }
if (is_readable(XF_DIR . 'includes/perf.php')) { require_once XF_DIR . 'includes/perf.php'; }
if (is_readable(XF_DIR . 'includes/backup.php')) { require_once XF_DIR . 'includes/backup.php'; }
if (is_readable(XF_DIR . 'includes/headless.php')) { require_once XF_DIR . 'includes/headless.php'; }

if (is_admin()) {
    if (is_readable(XF_DIR . 'includes/admin.php')) { require_once XF_DIR . 'includes/admin.php'; }
}

register_activation_hook(__FILE__, 'xf_activate');
register_deactivation_hook(__FILE__, 'xf_deactivate');

function xf_activate() {
    xf_install_schema();
    xf_register_post_types();
    xf_register_job_types();
    xf_create_pages();
    xf_create_legal_pages();
    xf_create_news_categories();
    xf_create_navigation();
    xf_seed_job_sources();
    if (!get_option('permalink_structure')) {
        update_option('permalink_structure', '/%postname%/');
    }
    xf_schedule_daily_event();
    if (!xf_get_setting('cron_key')) {
        xf_update_settings(['cron_key' => wp_generate_password(32, false)]);
    }
    flush_rewrite_rules();
}

function xf_deactivate() {
    wp_clear_scheduled_hook('xf_daily_growth');
    wp_clear_scheduled_hook('xf_ig_calendar');
    flush_rewrite_rules();
}

add_action('plugins_loaded', function () {
    // One request upgrades; concurrent ones right after a deploy skip it (no duplicate pages, templates or ALTERs).
    if (get_option('xf_db_version') !== XF_DB_VERSION && (!function_exists('xf_mutex_acquire') || xf_mutex_acquire('db_upgrade', 300))) {
        xf_install_schema();
        // New pages and categories added in later versions.
        add_action('init', function () {
            xf_create_pages();
            xf_create_legal_pages();
            xf_create_news_categories();
            xf_seed_job_sources();
            flush_rewrite_rules();
            if (function_exists('xf_mutex_release')) xf_mutex_release('db_upgrade');
        }, 99);
    }
});

/** Pages the plugin renders through shortcodes. Created once on activation. */
function xf_page_definitions() {
    return [
        'home' => ['title' => '100xFounder', 'slug' => 'home', 'content' => '[xf_home]'],
        'news' => ['title' => 'Startup News', 'slug' => 'news', 'content' => '[xf_news]'],
        'directory' => ['title' => 'Startups', 'slug' => 'startups', 'content' => '[xf_directory]'],
        'launches' => ['title' => 'Daily Launches', 'slug' => 'launches', 'content' => '[xf_launches]'],
        'spotlights' => ['title' => 'Founder Spotlights', 'slug' => 'spotlights', 'content' => '[xf_spotlights]'],
        'feature' => ['title' => 'Your Founder Spotlight', 'slug' => 'feature', 'content' => '[xf_feature_form]'],
        'submit' => ['title' => 'Send us your story', 'slug' => 'submit', 'content' => '[xf_submit_form]'],
        'launch' => ['title' => 'Launch your startup on 100xFounder — free', 'slug' => 'launch', 'content' => ''],
        'events' => ['title' => 'Startup events', 'slug' => 'events', 'content' => '[xf_events]'],
        'funding' => ['title' => 'Funding tracker', 'slug' => 'funding-tracker', 'content' => '[xf_funding_tracker]'],
        'blog' => ['title' => 'Blog', 'slug' => 'blog', 'content' => ''],
        'jobs' => ['title' => 'Jobs', 'slug' => 'jobs', 'content' => ''],
        'tools' => ['title' => 'Free tools', 'slug' => 'tools', 'content' => ''],
        'guides' => ['title' => 'How to apply', 'slug' => 'how-to-apply', 'content' => ''],
        'unsubscribe' => ['title' => 'Unsubscribe', 'slug' => 'unsubscribe', 'content' => '[xf_unsubscribe]'],
        'ai_tools' => ['title' => 'Best AI tools', 'slug' => 'ai-tools', 'content' => ''],
        'sitemap' => ['title' => 'Sitemap', 'slug' => 'sitemap', 'content' => ''],
    ];
}

function xf_create_pages() {
    $pages = get_option('xf_pages', []);
    foreach (xf_page_definitions() as $key => $page) {
        if (!empty($pages[$key]) && get_post($pages[$key])) {
            continue;
        }
        $existing = get_page_by_path($page['slug']);
        $pages[$key] = $existing ? $existing->ID : wp_insert_post([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_title' => $page['title'],
            'post_name' => $page['slug'],
            'post_content' => $page['content'],
        ]);
    }
    update_option('xf_pages', $pages);
}

function xf_page_url($key, $args = []) {
    $pages = get_option('xf_pages', []);
    $url = !empty($pages[$key]) ? get_permalink($pages[$key]) : home_url('/' . (xf_page_definitions()[$key]['slug'] ?? '') . '/');
    return $args ? add_query_arg($args, $url) : $url;
}

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('xf-style', XF_URL . 'assets/style.css', [], XF_VERSION);
});
