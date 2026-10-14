<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * The research behind a startup listing: pricing, who it is for, alternatives,
 * reviews, what the community said, screenshots and FAQs. Stored as one JSON
 * document in `_xf_profile` so the page, its structured data and the sitemap
 * rule all read the same facts.
 *
 * Shape (every key optional; a section with nothing in it is simply not shown):
 *
 *   maker        {name, url}
 *   category     "Video editing"
 *   platform     "Claude Code plugin"
 *   starts_at    "Free trial, then $19/month"
 *   schema_category  schema.org applicationCategory, e.g. "MultimediaApplication"
 *   ph           {rank, votes, comments, followers, launched, as_of}
 *   screenshots  [{url, alt, credit}]
 *   gallery      [{url, alt, credit, w, h}]  (preferred over screenshots; opens in a lightbox)
 *   video_url    YouTube, Vimeo or Loom link, shown as a click-to-load player
 *   video_title / video_date  optional, for the VideoObject structured data
 *   launch_story {paragraphs: [], attribution, url}
 *   use_cases    ["Turn meeting notes into tasks", …]
 *   pros / cons  ["…", …]
 *   opinions     {themes: {liked: [], asked: [], criticised: []}, quotes: [{text, author, url}]}
 *   team         [{name, role, url}]
 *   audience     {fit: [], not_fit: []}
 *   pricing      {intro, plans: [{name, price, amount, currency, detail}], notes: [], url, checked}
 *   alternatives {intro, items: [{name, url, logo, what, tags: [], starts_at, ph_rating, ph_reviews, ph_url, difference}], more}
 *   reviews      {count, rating, url, as_of}
 *   community    {ph_url, quotes: [{author, url, text, reply}], x: {search_url, profile_url, posts: [...], related: [...]}}
 *   faq          [{q, a}]
 *   sources      [{label, url}]
 *   checked      "2026-10-07"
 *
 * Ratings: `reviews` is Product Hunt's rating, shown on the page as text with its
 * source. The structured data's aggregateRating and review come only from visitors'
 * votes and approved reviews on this site (ratings.php, startup-reviews.php), once
 * there are enough of them.
 */

function xf_startup_profile($post_id) {
    $raw = get_post_meta((int) $post_id, '_xf_profile', true);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    return is_array($data) ? $data : [];
}

/** How many of the substantial sections a profile has filled in. */
function xf_profile_depth(array $p) {
    $n = 0;
    foreach (['audience', 'pricing', 'alternatives', 'community', 'faq'] as $k) {
        if (!empty($p[$k])) {
            $n++;
        }
    }
    return $n;
}

/** A listing is worth indexing with a real description, a spotlight, or a researched profile. */
function xf_startup_is_rich($post) {
    return strlen(wp_strip_all_tags($post->post_content)) >= 600
        || xf_published_spotlight_for($post->ID)
        || xf_profile_depth(xf_startup_profile($post->ID)) >= 3;
}

foreach (['added_post_meta', 'updated_post_meta'] as $hook) {
    add_action($hook, function ($mid, $post_id, $key) {
        if ($key === '_xf_profile') {
            xf_refresh_indexable_flag($post_id);
            update_option('xf_alt_ver', (int) get_option('xf_alt_ver') + 1, false); // invalidates every "is an alternative to" cache
        }
    }, 10, 3);
}

/** The profile's gallery: `gallery` when set, else the older `screenshots`. Items without a URL are dropped. */
function xf_profile_gallery(array $p) {
    $items = !empty($p['gallery']) ? $p['gallery'] : ($p['screenshots'] ?? []);
    return array_values(array_filter((array) $items, function ($g) {
        // A scheme check, not wp_http_validate_url(): that resolves DNS on every page view.
        return is_array($g) && is_string($g['url'] ?? null) && preg_match('#^https?://[^\s/]+#i', $g['url']);
    }));
}

/**
 * The launch story as {paragraphs: string[], attribution, url}, whether the profile stored
 * it as {paragraphs: [...]}, a bare list, or one plain string (blank lines split paragraphs).
 */
function xf_profile_story(array $p) {
    $s = $p['launch_story'] ?? [];
    $meta = is_array($s) ? $s : [];
    $paras = is_string($s) ? $s : ($s['paragraphs'] ?? (isset($s[0]) ? $s : []));
    $paras = is_string($paras) ? [$paras] : array_filter((array) $paras, 'is_string');
    $out = [];
    foreach ($paras as $para) {
        foreach (preg_split('/\R\s*\R/', trim($para)) as $chunk) {
            if (trim($chunk) !== '') {
                $out[] = trim($chunk);
            }
        }
    }
    return [
        'paragraphs' => $out,
        'attribution' => is_string($meta['attribution'] ?? null) ? $meta['attribution'] : '',
        'url' => is_string($meta['url'] ?? null) ? $meta['url'] : '',
    ];
}

/**
 * A YouTube, Vimeo or Loom link as {provider, label, id, embed, watch, thumb}, or null.
 * Embeds use the providers' no-tracking variants and load only when the visitor clicks.
 */
function xf_profile_video($url) {
    $url = trim((string) $url);
    if (preg_match('#^https?://(?:www\.|m\.)?(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/|live/)|youtu\.be/)([A-Za-z0-9_-]{11})#', $url, $m)) {
        return ['provider' => 'youtube', 'label' => 'YouTube', 'id' => $m[1], 'embed' => 'https://www.youtube-nocookie.com/embed/' . $m[1] . '?autoplay=1&rel=0',
            'watch' => 'https://www.youtube.com/watch?v=' . $m[1], 'thumb' => 'https://i.ytimg.com/vi/' . $m[1] . '/hqdefault.jpg'];
    }
    if (preg_match('#^https?://(?:www\.|player\.)?vimeo\.com/(?:video/)?(\d{5,12})#', $url, $m)) {
        return ['provider' => 'vimeo', 'label' => 'Vimeo', 'id' => $m[1], 'embed' => 'https://player.vimeo.com/video/' . $m[1] . '?autoplay=1&dnt=1',
            'watch' => 'https://vimeo.com/' . $m[1], 'thumb' => ''];
    }
    if (preg_match('#^https?://(?:www\.)?loom\.com/(?:share|embed)/([a-f0-9]{32})#', $url, $m)) {
        return ['provider' => 'loom', 'label' => 'Loom', 'id' => $m[1], 'embed' => 'https://www.loom.com/embed/' . $m[1] . '?autoplay=1',
            'watch' => 'https://www.loom.com/share/' . $m[1], 'thumb' => ''];
    }
    return null;
}

/** Our own published listing for a product name, so an alternative can link internally. */
function xf_startup_by_name($name) {
    $name = trim((string) $name);
    if ($name === '') {
        return null;
    }
    $found = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'title' => $name, 'numberposts' => 1, 'no_found_rows' => true]);
    return $found[0] ?? null;
}

/**
 * Published startups whose profile lists this one as an alternative (by name, or by a link to
 * our page). Cached; any profile save bumps xf_alt_ver, which retires every cached answer.
 *
 * @return int[] post IDs
 */
function xf_startup_alternative_to($post_id) {
    $post = get_post($post_id);
    if (!$post) {
        return [];
    }
    $key = 'xf_alt_of_' . $post->ID . '_' . (int) get_option('xf_alt_ver');
    $ids = get_transient($key);
    if (is_array($ids)) {
        return $ids;
    }
    $name = strtolower(get_the_title($post));
    $link = untrailingslashit(get_permalink($post));
    $ids = [];
    $candidates = get_posts([
        'post_type' => 'xf_startup', 'post_status' => 'publish', 'numberposts' => 50, 'post__not_in' => [$post->ID], 'fields' => 'ids', 'no_found_rows' => true,
        'meta_query' => [['key' => '_xf_profile', 'value' => $post->post_name, 'compare' => 'LIKE'], ['key' => '_xf_profile', 'value' => get_the_title($post), 'compare' => 'LIKE'], 'relation' => 'OR'],
    ]);
    foreach ($candidates as $cid) {
        foreach ((array) (xf_startup_profile($cid)['alternatives']['items'] ?? []) as $it) {
            if (strtolower(trim((string) ($it['name'] ?? ''))) === $name || untrailingslashit((string) ($it['url'] ?? '')) === $link) {
                $ids[] = (int) $cid;
                break;
            }
        }
    }
    set_transient($key, $ids, 12 * HOUR_IN_SECONDS);
    return $ids;
}

/* ---- REST: the one route the research pipeline writes through ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/startup-profile/(?P<id>\d+)', [
        [
            'methods' => 'GET',
            'permission_callback' => function (WP_REST_Request $r) { return current_user_can('edit_post', (int) $r['id']); },
            'callback' => function (WP_REST_Request $r) { return rest_ensure_response(xf_startup_profile((int) $r['id'])); },
        ],
        [
            'methods' => 'POST',
            'permission_callback' => function (WP_REST_Request $r) { return current_user_can('edit_post', (int) $r['id']); },
            'callback' => function (WP_REST_Request $r) {
                $id = (int) $r['id'];
                $post = get_post($id);
                if (!$post || $post->post_type !== 'xf_startup') {
                    return new WP_Error('not_startup', 'No such startup listing.', ['status' => 404]);
                }
                $body = $r->get_json_params();
                $profile = $body['profile'] ?? null;
                // Hostinger's shared-hosting firewall rejects some perfectly ordinary JSON (prices, links, lists)
                // as a false positive, so the research pipeline can send the profile base64-encoded instead.
                if (isset($body['profile_b64'])) {
                    $decoded = base64_decode((string) $body['profile_b64'], true);
                    $profile = $decoded !== false ? json_decode($decoded, true) : null;
                }
                if (!is_array($profile)) {
                    return new WP_Error('no_profile', 'Send {"profile": {...}} or {"profile_b64": "<base64 of the JSON>"}.', ['status' => 400]);
                }
                $json = wp_json_encode($profile, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if (!$json || strlen($json) > 90000) {
                    return new WP_Error('too_big', 'Profile is empty or over 90 KB.', ['status' => 400]);
                }
                $update = ['ID' => $id];
                if (isset($body['content'])) {
                    $update['post_content'] = wp_kses_post((string) $body['content']);
                }
                if (isset($body['excerpt'])) {
                    $update['post_excerpt'] = sanitize_text_field((string) $body['excerpt']);
                }
                if (count($update) > 1) {
                    wp_update_post($update);
                }
                update_post_meta($id, '_xf_profile', wp_slash($json));
                return rest_ensure_response(['id' => $id, 'link' => get_permalink($id), 'sections' => xf_profile_depth($profile), 'indexable' => get_post_meta($id, '_xf_indexable', true)]);
            },
        ],
    ]);
});

/* ---- Structured data ---- */

/** schema.org SoftwareApplication for a startup listing. */
function xf_startup_schema($post_id) {
    $post = get_post($post_id);
    $m = xf_startup_meta($post_id);
    $p = xf_startup_profile($post_id);
    $logo = has_post_thumbnail($post_id) ? get_the_post_thumbnail_url($post_id, 'medium') : ($m['thumbnail'] ?: null);

    $shots = wp_list_pluck(xf_profile_gallery($p), 'url');

    // Offers: one per plan that has a numeric price, summarised as a range when there are several.
    $offers = null;
    $plans = array_values(array_filter((array) ($p['pricing']['plans'] ?? []), function ($pl) {
        return isset($pl['amount']) && is_numeric($pl['amount']);
    }));
    if ($plans) {
        $cur = $plans[0]['currency'] ?? 'USD';
        $amounts = array_map(function ($pl) { return (float) $pl['amount']; }, $plans);
        $offers = [
            '@type' => 'AggregateOffer',
            'priceCurrency' => $cur,
            'lowPrice' => min($amounts),
            'highPrice' => max($amounts),
            'offerCount' => count($plans),
            'url' => $p['pricing']['url'] ?? ($m['website'] ?: null),
            'offers' => array_map(function ($pl) use ($cur) {
                return array_filter([
                    '@type' => 'Offer',
                    'name' => $pl['name'] ?? null,
                    'price' => (float) $pl['amount'],
                    'priceCurrency' => $pl['currency'] ?? $cur,
                    'description' => $pl['detail'] ?? null,
                ], function ($v) { return $v !== null; });
            }, $plans),
        ];
    }

    // Only ratings and reviews from visitors on this site, once there are enough (startup-reviews.php).
    // Another platform's rating (Product Hunt's, say) is shown on the page as text with its source,
    // never as ours: Google requires ratings in structured data to be collected directly by the site.
    $rated = function_exists('xf_startup_rating_schema') ? xf_startup_rating_schema($post_id) : [];

    $maker = $p['maker'] ?? [];
    return array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'SoftwareApplication',
        'name' => xf_schema_text(get_the_title($post)),
        'description' => xf_schema_text($m['tagline'] ?: $post->post_excerpt),
        'url' => get_permalink($post),
        'sameAs' => array_values(array_filter([$m['website'], $m['ph_url'], $p['community']['x']['profile_url'] ?? null])),
        'image' => $logo,
        'screenshot' => $shots ?: null,
        'applicationCategory' => $p['schema_category'] ?? 'BusinessApplication',
        'operatingSystem' => $p['os'] ?? 'Web',
        'offers' => $offers,
        'aggregateRating' => $rated['aggregateRating'] ?? null,
        'review' => $rated['review'] ?? null,
        'author' => !empty($maker['name']) ? array_filter(['@type' => 'Person', 'name' => $maker['name'], 'url' => $maker['url'] ?? null]) : null,
        'datePublished' => $m['launch_day'] ? mysql2date('Y-m-d', $m['launch_day']) : null,
    ], function ($v) { return $v !== null && $v !== '' && $v !== []; });
}

add_action('wp_head', function () {
    if (!is_singular('xf_startup')) {
        return;
    }
    $id = get_queried_object_id();
    // Thin listings carry no schema until readers have rated them enough to publish a figure.
    if (!xf_startup_profile($id) && !(function_exists('xf_startup_rating_public') && xf_startup_rating_public($id))) {
        return;
    }
    xf_json_ld(xf_startup_schema($id));
    if ($video = xf_startup_video_schema($id)) {
        xf_json_ld($video);
    }
}, 6);

/** VideoObject for the profile's video; nothing when there is no video_url. Dates are never guessed. */
function xf_startup_video_schema($post_id) {
    $p = xf_startup_profile($post_id);
    $v = xf_profile_video($p['video_url'] ?? '');
    if (!$v) {
        return null;
    }
    $name = get_the_title($post_id);
    $gallery = xf_profile_gallery($p);
    $thumb = $v['thumb'] ?: ($gallery[0]['url'] ?? (has_post_thumbnail($post_id) ? get_the_post_thumbnail_url($post_id, 'medium') : null));
    $m = xf_startup_meta($post_id);
    return array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'VideoObject',
        'name' => xf_schema_text($p['video_title'] ?? $name . ' demo video'),
        'description' => xf_schema_text($m['tagline'] ?: 'A video about ' . $name . '.'),
        'thumbnailUrl' => $thumb,
        'uploadDate' => !empty($p['video_date']) ? $p['video_date'] : null,
        'embedUrl' => strtok($v['embed'], '?'),
        'url' => $v['watch'],
    ], function ($x) { return $x !== null && $x !== ''; });
}
