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

/* -------------------------------------------------------------------------
 * No-token fallback: Product Hunt's public Atom feed (www.producthunt.com/feed).
 * It's an official syndication feed, so this is not page scraping. It has the
 * name, tagline, product page and outbound link, but no vote counts, so feed
 * imports never show votes. Once a developer token is set, the API importer
 * takes over and fills in votes for the same launches (same ph:<id> key).
 * ---------------------------------------------------------------------- */

const XF_PH_FEED = 'https://www.producthunt.com/feed';

/** Parsed feed entries published within the last $hours. */
function xf_ph_feed_entries($hours = 48) {
    $response = wp_remote_get(XF_PH_FEED, ['timeout' => 20, 'user-agent' => 'Mozilla/5.0 (compatible; 100xFounder/1.0; +' . home_url('/') . ')']);
    if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
        return is_wp_error($response) ? $response : new WP_Error('xf_ph_feed', 'Product Hunt feed returned HTTP ' . wp_remote_retrieve_response_code($response));
    }
    $prev = libxml_use_internal_errors(true);
    $xml = simplexml_load_string(wp_remote_retrieve_body($response));
    libxml_use_internal_errors($prev);
    if (!$xml) {
        return new WP_Error('xf_ph_feed', 'Could not read the Product Hunt feed.');
    }
    $cutoff = time() - $hours * HOUR_IN_SECONDS;
    $entries = [];
    foreach ($xml->entry as $e) {
        $published = strtotime((string) $e->published);
        if (!$published || $published < $cutoff || !preg_match('/Post\/(\d+)/', (string) $e->id, $m)) {
            continue;
        }
        $html = html_entity_decode((string) $e->content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $tagline = '';
        if (preg_match('/<p>\s*(.*?)\s*<\/p>/s', $html, $tm)) {
            $tagline = trim(wp_strip_all_tags($tm[1]));
        }
        $outbound = preg_match('/href="(https:\/\/www\.producthunt\.com\/r\/p\/\d+[^"]*)"/', $html, $lm) ? html_entity_decode($lm[1]) : '';
        $entries[] = [
            'id' => $m[1],
            'name' => trim((string) $e->title),
            'tagline' => $tagline,
            'url' => strtok((string) $e->link['href'], '?'),
            'outbound' => $outbound,
            'published' => gmdate('Y-m-d H:i:s', $published),
        ];
    }
    return $entries;
}

/** Imports recent launches from the feed. Used when no API token is set. */
function xf_ph_import_feed($hours = 48, $limit = 15) {
    $entries = xf_ph_feed_entries($hours);
    if (is_wp_error($entries)) {
        return ['error' => $entries->get_error_message()];
    }
    $created = 0;
    $skipped = 0;
    foreach (array_slice($entries, 0, $limit) as $launch) {
        if (xf_find_startup_by_external_id('ph:' . $launch['id'])) {
            $skipped++;
            continue;
        }
        $post_id = wp_insert_post([
            'post_type' => 'xf_startup',
            'post_status' => 'publish',
            'post_title' => $launch['name'],
            'post_name' => sanitize_title($launch['name']),
            'post_excerpt' => $launch['tagline'],
            'post_content' => $launch['tagline'] ? wpautop(esc_html($launch['tagline'])) : '',
            'post_date_gmt' => $launch['published'],
            'meta_input' => [
                '_xf_source' => 'producthunt',
                '_xf_import_method' => 'feed',
                '_xf_external_id' => 'ph:' . $launch['id'],
                '_xf_tagline' => $launch['tagline'],
                '_xf_ph_url' => $launch['url'],
                '_xf_launched_at' => $launch['published'],
                '_xf_launch_day' => get_date_from_gmt($launch['published'], 'Y-m-d'),
                '_xf_website' => $launch['outbound'] ? xf_resolve_website($launch['outbound']) : '',
            ],
        ], true);
        if (is_wp_error($post_id)) {
            continue;
        }
        wp_set_object_terms($post_id, 'Just launched', 'xf_stage');
        $created++;
    }
    return ['source' => 'feed', 'in_window' => count($entries), 'created' => $created, 'already_had' => $skipped];
}

/** The daily import: the API when a token is set, the public feed otherwise. */
function xf_ph_import_daily() {
    return xf_get_setting('ph_token') ? xf_ph_import_day(1) : xf_ph_import_feed(48, 15);
}
