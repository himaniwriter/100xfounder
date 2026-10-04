<?php
if (!defined('ABSPATH')) {
    exit;
}

const XF_PH_ENDPOINT = 'https://api.producthunt.com/v2/api/graphql';
const XF_PH_TIMEZONE = 'America/Los_Angeles';

/**
 * Product Hunt days run midnight to midnight Pacific time. Returns the UTC
 * window for the day `$days_ago` before today (1 = yesterday, final votes).
 */
function xf_ph_day_window($days_ago = 1, $now = 'now') {
    $tz = new DateTimeZone(XF_PH_TIMEZONE);
    $day = (new DateTimeImmutable($now))->setTimezone($tz)->setTime(0, 0)->modify('-' . (int) $days_ago . ' day');
    $next = $day->modify('+1 day');
    $utc = new DateTimeZone('UTC');
    return [
        'start' => $day->setTimezone($utc),
        'end' => $next->setTimezone($utc),
        'label' => $day->format('Y-m-d'),
    ];
}

/** Public product fields only: the Product Hunt API redacts maker names and emails. */
function xf_ph_query() {
    return 'query DailyPosts($postedAfter: DateTime!, $postedBefore: DateTime!, $after: String) {
  posts(order: VOTES, postedAfter: $postedAfter, postedBefore: $postedBefore, first: 20, after: $after) {
    edges { node {
      id name slug tagline description url website votesCount commentsCount createdAt featuredAt
      thumbnail { url }
      topics(first: 5) { edges { node { name } } }
    } }
    pageInfo { hasNextPage endCursor }
  }
}';
}

function xf_ph_fetch_posts(array $window) {
    $token = xf_get_setting('ph_token');
    if (!$token) {
        throw new RuntimeException('Product Hunt token is not set (100xFounder → Settings).');
    }
    $settings = xf_get_settings();
    $posts = [];
    $after = null;

    for ($page = 0; $page < 5; $page++) {
        $response = wp_remote_post(XF_PH_ENDPOINT, [
            'timeout' => 20,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'body' => wp_json_encode([
                'query' => xf_ph_query(),
                'variables' => [
                    'postedAfter' => $window['start']->format('Y-m-d\TH:i:s\Z'),
                    'postedBefore' => $window['end']->format('Y-m-d\TH:i:s\Z'),
                    'after' => $after,
                ],
            ]),
        ]);
        if (is_wp_error($response)) {
            throw new RuntimeException('Product Hunt request failed: ' . $response->get_error_message());
        }
        $code = wp_remote_retrieve_response_code($response);
        $json = json_decode(wp_remote_retrieve_body($response), true);
        if ($code !== 200 || !empty($json['errors'])) {
            $message = !empty($json['errors']) ? implode('; ', wp_list_pluck($json['errors'], 'message')) : 'HTTP ' . $code;
            throw new RuntimeException('Product Hunt API error: ' . $message);
        }

        $connection = $json['data']['posts'] ?? null;
        if (!$connection) {
            break;
        }
        foreach ($connection['edges'] as $edge) {
            $node = $edge['node'];
            $posts[] = [
                'id' => (string) $node['id'],
                'name' => (string) $node['name'],
                'slug' => (string) $node['slug'],
                'tagline' => (string) $node['tagline'],
                'description' => (string) ($node['description'] ?? ''),
                'url' => (string) $node['url'],
                'website' => $node['website'] ?? null,
                'votes' => (int) $node['votesCount'],
                'comments' => (int) $node['commentsCount'],
                'created_at' => (string) $node['createdAt'],
                'featured_at' => $node['featuredAt'] ?? null,
                'thumbnail' => $node['thumbnail']['url'] ?? null,
                'topics' => array_map(function ($t) { return $t['node']['name']; }, $node['topics']['edges'] ?? []),
            ];
        }

        // Ordered by votes: once we have the top N and the page drops below the
        // threshold, later pages can't add selections.
        $last = end($connection['edges']);
        $lowest = $last ? (int) $last['node']['votesCount'] : 0;
        if (empty($connection['pageInfo']['hasNextPage']) || (count($posts) >= (int) $settings['ph_top_n'] && $lowest < (int) $settings['ph_vote_threshold'])) {
            break;
        }
        $after = $connection['pageInfo']['endCursor'];
    }

    return $posts;
}

/**
 * Selection rules: top N by votes, top featured launches (#1 treated as Product
 * of the Day, approximated from vote order), and anything above the vote threshold.
 */
function xf_ph_select(array $posts) {
    $s = xf_get_settings();
    usort($posts, function ($a, $b) { return $b['votes'] <=> $a['votes']; });
    $featured_rank = [];
    $rank = 0;
    foreach ($posts as $post) {
        if (!empty($post['featured_at'])) {
            $featured_rank[$post['id']] = ++$rank;
        }
    }

    $selected = [];
    foreach ($posts as $index => $post) {
        $reasons = [];
        $r = $featured_rank[$post['id']] ?? null;
        if ($index < (int) $s['ph_top_n']) $reasons[] = 'top_votes';
        if ($r === 1) {
            $reasons[] = 'product_of_the_day';
        } elseif ($r !== null && $r <= (int) $s['ph_top_featured_rank']) {
            $reasons[] = 'top_featured';
        }
        if ($post['votes'] >= (int) $s['ph_vote_threshold']) $reasons[] = 'vote_threshold';
        if ($reasons) {
            $post['daily_rank'] = $r;
            $post['reasons'] = $reasons;
            $selected[] = $post;
        }
    }
    return $selected;
}

function xf_find_startup_by_external_id($external_id) {
    $ids = get_posts([
        'post_type' => 'xf_startup',
        'post_status' => 'any',
        'posts_per_page' => 1,
        'fields' => 'ids',
        'meta_key' => '_xf_external_id',
        'meta_value' => $external_id,
    ]);
    return $ids ? (int) $ids[0] : 0;
}

/** Imports the selected launches of one Product Hunt day as startup posts. */
function xf_ph_import_day($days_ago = 1) {
    $window = xf_ph_day_window($days_ago);
    $posts = xf_ph_fetch_posts($window);
    $selected = xf_ph_select($posts);
    $created = 0;
    $updated = 0;

    foreach ($selected as $launch) {
        $existing = xf_find_startup_by_external_id('ph:' . $launch['id']);
        $meta = [
            '_xf_source' => 'producthunt',
            '_xf_external_id' => 'ph:' . $launch['id'],
            '_xf_tagline' => $launch['tagline'],
            '_xf_ph_url' => $launch['url'],
            '_xf_thumbnail' => $launch['thumbnail'],
            '_xf_votes' => $launch['votes'],
            '_xf_comments' => $launch['comments'],
            '_xf_topics' => $launch['topics'],
            '_xf_reasons' => $launch['reasons'],
            '_xf_daily_rank' => $launch['daily_rank'],
            '_xf_launch_day' => $window['label'],
            '_xf_launched_at' => gmdate('Y-m-d H:i:s', strtotime($launch['created_at'])),
        ];

        if ($existing) {
            foreach ($meta as $key => $value) {
                update_post_meta($existing, $key, $value);
            }
            $updated++;
            continue;
        }

        $post_id = wp_insert_post([
            'post_type' => 'xf_startup',
            'post_status' => 'publish',
            'post_title' => $launch['name'],
            'post_name' => sanitize_title($launch['name']),
            'post_excerpt' => $launch['tagline'],
            'post_content' => wpautop(esc_html($launch['description'])),
            'post_date_gmt' => $meta['_xf_launched_at'],
            'meta_input' => $meta + ['_xf_website' => xf_resolve_website($launch['website'])],
        ], true);
        if (is_wp_error($post_id)) {
            continue;
        }
        if ($launch['topics']) {
            wp_set_object_terms($post_id, $launch['topics'], 'xf_industry');
        }
        wp_set_object_terms($post_id, 'Just launched', 'xf_stage');
        $created++;
    }

    return ['day' => $window['label'], 'fetched' => count($posts), 'selected' => count($selected), 'created' => $created, 'updated' => $updated];
}
