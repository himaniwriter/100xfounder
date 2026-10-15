<?php
/**
 * Thin pages out of the index, new pages drip-fed in (owner, 2026-10-15). Replaces the
 * "index everything" rule of 2026-10-09 for these cases:
 *
 *  - Thin: articles, guides and spotlights under XF_MIN_WORDS words (`_xf_thin`), startup
 *    listings that are not rich (`_xf_indexable` != 1), and archives xf_is_thin_archive() calls
 *    thin. They get noindex,follow, leave the sitemap and are never sent to IndexNow.
 *  - Drip: a new startup, guide or spotlight, or a listing that becomes rich later, gets a
 *    release time (`_xf_index_from`) at most XF_DRIP_PER_DAY a day between 08:00 and 22:00 site
 *    time. Until then it is noindex and out of the sitemap; an hourly job pings IndexNow as each
 *    one is released. News articles are not dripped: they are already paced and need to be fast.
 *
 * Pages that existed before this module are marked released once (`_xf_dripped`), so nothing
 * already in Google is held back.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_DRIP_PER_DAY = 20;
const XF_DRIP_TYPES = ['xf_startup', 'xf_guide', 'xf_spotlight'];
const XF_THIN_TYPES = ['post', 'xf_guide', 'xf_spotlight'];

/** Thin, or waiting for its drip slot: either way not for Google yet. */
function xf_index_held($post_id) {
    $post = get_post($post_id);
    if (!$post) {
        return false;
    }
    if ($post->post_type === 'xf_startup' && get_post_meta($post->ID, '_xf_indexable', true) !== '1') {
        return true;
    }
    if (in_array($post->post_type, XF_THIN_TYPES, true)) {
        $thin = get_post_meta($post->ID, '_xf_thin', true);
        if ($thin === '' ? xf_word_count($post->post_content) < XF_MIN_WORDS : $thin === '1') {
            return true;
        }
    }
    return (int) get_post_meta($post->ID, '_xf_index_from', true) > time();
}

add_filter('xf_is_noindexed', function ($noindex, $post_id) {
    return $noindex || xf_index_held($post_id);
}, 20, 2);

// Same priority as indexing.php's "index everything" filter but loaded after it, so this has the last word.
add_filter('wp_robots', function ($robots) {
    $held = (function_exists('xf_is_thin_archive') && xf_is_thin_archive())
        || (is_singular(array_merge(XF_THIN_TYPES, XF_DRIP_TYPES)) && xf_index_held(get_queried_object_id()));
    if ($held) {
        unset($robots['index'], $robots['max-image-preview']);
        $robots['noindex'] = true;
        $robots['follow'] = true;
    }
    return $robots;
}, PHP_INT_MAX);

add_filter('wp_sitemaps_posts_query_args', function ($args, $post_type) {
    if (!in_array($post_type, array_merge(XF_THIN_TYPES, XF_DRIP_TYPES), true)) {
        return $args;
    }
    $mq = isset($args['meta_query']) ? (array) $args['meta_query'] : [];
    $mq[] = ['relation' => 'OR', ['key' => '_xf_index_from', 'compare' => 'NOT EXISTS'], ['key' => '_xf_index_from', 'value' => time(), 'compare' => '<=', 'type' => 'NUMERIC']];
    if ($post_type === 'xf_startup') {
        $mq[] = ['key' => '_xf_indexable', 'value' => '1'];
    } elseif (in_array($post_type, XF_THIN_TYPES, true)) {
        $mq[] = ['relation' => 'OR', ['key' => '_xf_thin', 'compare' => 'NOT EXISTS'], ['key' => '_xf_thin', 'value' => '1', 'compare' => '!=']];
    }
    $args['meta_query'] = $mq;
    return $args;
}, 20, 2);

/* ---- Thin flag ---- */

function xf_refresh_thin_flag($post_id) {
    $post = get_post($post_id);
    if ($post && in_array($post->post_type, XF_THIN_TYPES, true)) {
        update_post_meta($post->ID, '_xf_thin', xf_word_count($post->post_content) < XF_MIN_WORDS ? '1' : '0');
    }
}
add_action('save_post', 'xf_refresh_thin_flag', 20);

/* ---- Drip slots ---- */

/** Next free release time: XF_DRIP_PER_DAY slots a day, spread 08:00–22:00 site time. */
function xf_drip_next_slot() {
    $per_day = max(1, (int) apply_filters('xf_drip_per_day', XF_DRIP_PER_DAY));
    $days = (array) get_option('xf_drip_days', []);
    $tz = wp_timezone();
    $day = new DateTimeImmutable('today', $tz);
    while (($days[$day->format('Y-m-d')] ?? 0) >= $per_day) {
        $day = $day->modify('+1 day');
    }
    $key = $day->format('Y-m-d');
    $n = (int) ($days[$key] ?? 0);
    $days[$key] = $n + 1;
    $today = (new DateTimeImmutable('today', $tz))->format('Y-m-d');
    update_option('xf_drip_days', array_filter($days, function ($k) use ($today) { return $k >= $today; }, ARRAY_FILTER_USE_KEY), false);
    $at = $day->setTime(8, 0)->getTimestamp() + (int) ($n * 14 * HOUR_IN_SECONDS / $per_day) + wp_rand(0, 600);
    return max($at, time());
}

function xf_drip_assign($post_id) {
    if (get_post_meta($post_id, '_xf_dripped', true)) {
        return;
    }
    update_post_meta($post_id, '_xf_index_from', xf_drip_next_slot());
    update_post_meta($post_id, '_xf_dripped', '1');
}

// New pages: before seo.php queues them for IndexNow (priority 10), so the held check applies.
add_action('transition_post_status', function ($new, $old, $post) {
    $rich_startup = $post->post_type === 'xf_startup' && get_post_meta($post->ID, '_xf_indexable', true) === '1';
    if ($new === 'publish' && $old !== 'publish' && ($rich_startup || in_array($post->post_type, ['xf_guide', 'xf_spotlight'], true))) {
        xf_drip_assign($post->ID);
    }
}, 5, 3);

// Startups enter the drip when they first become rich (a new rich listing, or a thin one improved).
foreach (['added_post_meta', 'updated_post_meta'] as $hook) {
    add_action($hook, function ($mid, $post_id, $key, $value) {
        if ($key === '_xf_indexable' && $value === '1' && get_post_status($post_id) === 'publish') {
            xf_drip_assign($post_id);
        }
    }, 10, 4);
}

/* ---- Hourly: release due pages to IndexNow; backfill thin flags ---- */

add_action('init', function () {
    if (!wp_next_scheduled('xf_index_control_hourly')) {
        wp_schedule_event(time() + 120, 'hourly', 'xf_index_control_hourly');
    }
    // One-time: everything already indexable counts as released; thin listings are not, so they drip once improved.
    global $wpdb;
    $types = "'" . implode("','", XF_DRIP_TYPES) . "'";
    if (get_option('xf_drip_baseline') === false) {
        $wpdb->query("INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value)
            SELECT p.ID, '_xf_dripped', '1' FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_xf_dripped'
            LEFT JOIN {$wpdb->postmeta} i ON i.post_id = p.ID AND i.meta_key = '_xf_indexable'
            WHERE p.post_type IN ($types) AND p.post_status IN ('publish','future','pending','draft') AND m.meta_id IS NULL
              AND (p.post_type <> 'xf_startup' OR i.meta_value = '1')"); // phpcs:ignore -- constants only
        update_option('xf_drip_baseline', '2', true);
    }
    // Fix for the first baseline (2026-10-15), which also marked thin listings as released.
    if (get_option('xf_drip_baseline') === '1') {
        $wpdb->query("DELETE m FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id
            LEFT JOIN {$wpdb->postmeta} i ON i.post_id = p.ID AND i.meta_key = '_xf_indexable'
            WHERE m.meta_key = '_xf_dripped' AND p.post_type = 'xf_startup' AND (i.meta_value IS NULL OR i.meta_value <> '1')"); // phpcs:ignore
        // Listings made rich after the drip went live (11:27 UTC) slipped through: give them drip slots now.
        $late = $wpdb->get_col("SELECT p.ID FROM {$wpdb->posts} p
            JOIN {$wpdb->postmeta} i ON i.post_id = p.ID AND i.meta_key = '_xf_indexable' AND i.meta_value = '1'
            LEFT JOIN {$wpdb->postmeta} f ON f.post_id = p.ID AND f.meta_key = '_xf_index_from'
            WHERE p.post_type = 'xf_startup' AND p.post_status = 'publish' AND f.meta_id IS NULL AND p.post_modified_gmt >= '2026-10-15 11:27:00'"); // phpcs:ignore
        foreach ($late as $id) {
            delete_post_meta((int) $id, '_xf_dripped');
            xf_drip_assign((int) $id);
        }
        update_option('xf_drip_baseline', '2', true);
    }
});

add_action('xf_index_control_hourly', function () {
    $due = get_posts(['post_type' => XF_DRIP_TYPES, 'post_status' => 'publish', 'posts_per_page' => 200, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_index_from', 'value' => time(), 'compare' => '<=', 'type' => 'NUMERIC'], ['key' => '_xf_drip_sent', 'compare' => 'NOT EXISTS']]]);
    $urls = [];
    foreach ($due as $id) {
        update_post_meta($id, '_xf_drip_sent', time());
        if (!xf_index_held($id)) {
            $urls[] = get_permalink($id);
        }
    }
    if ($urls && function_exists('xf_indexnow_submit')) {
        xf_indexnow_submit($urls);
    }
    foreach (get_posts(['post_type' => XF_THIN_TYPES, 'post_status' => 'publish', 'posts_per_page' => 300, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_thin', 'compare' => 'NOT EXISTS']]]) as $id) {
        xf_refresh_thin_flag($id);
    }
});
