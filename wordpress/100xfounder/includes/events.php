<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Events: our own entries plus events imported from public iCal (ICS) feeds
 * such as Luma calendars or Meetup groups. Imported events wait as pending
 * for review and always link back to the organiser's page.
 * ---------------------------------------------------------------------- */

add_action('init', function () {
    register_post_type('xf_event', [
        'labels' => ['name' => 'Events', 'singular_name' => 'Event', 'add_new_item' => 'Add event', 'edit_item' => 'Edit event'],
        'public' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'event', 'with_front' => false],
        'menu_icon' => 'dashicons-calendar-alt',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
        'show_in_rest' => true,
    ]);
});

xf_register_fields('xf_event', 'Event details', [
    'start' => ['Starts', 'datetime', null, 'Local time of the event.'],
    'end' => ['Ends', 'datetime'],
    'city' => ['City', 'text', null, 'e.g. Bengaluru, Delhi NCR, Online'],
    'venue' => ['Venue', 'text'],
    'url' => ['Registration / official page', 'url'],
    'organizer' => ['Organiser', 'text'],
    'kind' => ['Our coverage', 'select', ['', 'Live coverage', 'Recap', 'Delegation', 'Meetup', 'Conference', 'Hackathon', 'Demo day']],
]);

/** Upcoming published events, soonest first. */
function xf_upcoming_events($limit = 4) {
    return get_posts([
        'post_type' => 'xf_event',
        'post_status' => 'publish',
        'posts_per_page' => $limit,
        'meta_key' => '_xf_start',
        'orderby' => 'meta_value',
        'order' => 'ASC',
        'meta_query' => [['key' => '_xf_start', 'value' => current_time('mysql', true), 'compare' => '>=', 'type' => 'DATETIME']],
    ]);
}

/* ---- ICS import ---- */

/** Unfolds and parses VEVENTs from an ICS document into arrays. */
function xf_parse_ics($ics) {
    $ics = preg_replace("/\r\n[ \t]|\n[ \t]/", '', str_replace("\r\n", "\n", (string) $ics));
    $events = [];
    if (!preg_match_all('/BEGIN:VEVENT(.*?)END:VEVENT/s', $ics, $blocks)) {
        return $events;
    }
    foreach ($blocks[1] as $block) {
        $event = [];
        foreach (explode("\n", trim($block)) as $line) {
            if (!preg_match('/^([A-Z-]+)((?:;[^:]*)?):(.*)$/', $line, $m)) {
                continue;
            }
            $name = $m[1];
            $params = $m[2];
            $value = str_replace(['\\n', '\\N', '\\,', '\\;', '\\\\'], ["\n", "\n", ',', ';', '\\'], $m[3]);
            if (in_array($name, ['DTSTART', 'DTEND'], true)) {
                $tz = preg_match('/TZID=([^;:]+)/', $params, $t) ? $t[1] : null;
                $event[$name] = xf_ics_time($value, $tz);
            } elseif ($name === 'ORGANIZER') {
                // Prefer the display name (CN=…) over the mailto: address.
                $event['ORGANIZER'] = preg_match('/CN="?([^";:]+)"?/', $params, $cn) ? trim($cn[1]) : preg_replace('/^mailto:.*$/i', '', trim($value));
            } elseif (in_array($name, ['UID', 'SUMMARY', 'LOCATION', 'URL', 'DESCRIPTION', 'STATUS'], true)) {
                $event[$name] = trim($value);
            }
        }
        if (!empty($event['UID']) && !empty($event['SUMMARY']) && !empty($event['DTSTART'])) {
            $events[] = $event;
        }
    }
    return $events;
}

/** Converts an ICS date/time to a UTC "Y-m-d H:i:s" string. */
function xf_ics_time($value, $tz = null) {
    try {
        if (preg_match('/^\d{8}$/', $value)) {
            return (new DateTime($value . ' 00:00:00', new DateTimeZone($tz ?: 'UTC')))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        }
        if (substr($value, -1) === 'Z') {
            return (new DateTime($value, new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        }
        return (new DateTime($value, new DateTimeZone($tz ?: wp_timezone_string())))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return '';
    }
}

function xf_event_feeds() {
    $raw = (string) xf_get_setting('event_feeds');
    return array_values(array_filter(array_map('trim', preg_split('/\R/', $raw)), function ($url) {
        return (bool) wp_http_validate_url($url);
    }));
}

/** Imports upcoming events from every configured ICS feed as pending posts. */
/**
 * The organiser's own share image for an event, from the Open Graph tag on its
 * public page. og:image exists so other sites can show it when they link, which
 * is exactly what we do: their picture, their credit, a link back to them. We
 * store the URL, never a copy, and any organiser can ask us to drop it.
 */
function xf_fetch_event_image($url) {
    if (!$url || !wp_http_validate_url($url)) {
        return '';
    }
    $r = wp_remote_get($url, [
        'timeout' => 15,
        'limit_response_size' => 600000,
        'user-agent' => '100xFounderBot/1.0 (+' . home_url('/') . ')',
    ]);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) {
        return '';
    }
    $html = wp_remote_retrieve_body($r);
    foreach (['og:image:secure_url', 'og:image', 'twitter:image'] as $prop) {
        if (preg_match('#<meta[^>]+(?:property|name)=["\']' . preg_quote($prop, '#') . '["\'][^>]+content=["\']([^"\']+)#i', $html, $m)
            || preg_match('#<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' . preg_quote($prop, '#') . '["\']#i', $html, $m)) {
            $img = html_entity_decode($m[1], ENT_QUOTES);
            if (strpos($img, '//') === 0) {
                $img = 'https:' . $img;
            }
            if (preg_match('#^https?://#i', $img)) {
                return esc_url_raw($img);
            }
        }
    }
    return '';
}

/** Who published the image, for the credit line under it. */
function xf_event_image_credit($event_id) {
    $url = (string) get_post_meta($event_id, '_xf_url', true);
    $host = $url ? wp_parse_url($url, PHP_URL_HOST) : '';
    $organiser = (string) get_post_meta($event_id, '_xf_organizer', true);
    return trim($organiser ?: ($host ? preg_replace('/^www\./', '', $host) : ''));
}

function xf_import_events() {
    $created = 0;
    $feeds = xf_event_feeds();
    $horizon = time() + 120 * DAY_IN_SECONDS;
    foreach ($feeds as $feed) {
        $response = wp_remote_get($feed, ['timeout' => 15, 'limit_response_size' => 2000000]);
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            continue;
        }
        foreach (xf_parse_ics(wp_remote_retrieve_body($response)) as $e) {
            $start = strtotime($e['DTSTART'] . ' UTC');
            if (!$start || $start < time() || $start > $horizon || (isset($e['STATUS']) && strtoupper($e['STATUS']) === 'CANCELLED')) {
                continue;
            }
            $uid = 'ics:' . md5($e['UID']);
            $exists = get_posts(['post_type' => 'xf_event', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids', 'meta_key' => '_xf_uid', 'meta_value' => $uid]);
            if ($exists) {
                continue;
            }
            $location = $e['LOCATION'] ?? '';
            // Most public calendars are worldwide. Keep only events in the cities we
            // cover, so the page stays "what's on near me" rather than a global dump.
            $bucket = function_exists('xf_event_city_bucket') ? xf_event_city_bucket($location) : '';
            if (!$bucket || $bucket === 'Online') {
                $bucket = function_exists('xf_event_city_bucket') ? xf_event_city_bucket($e['SUMMARY'] ?? '') : '';
            }
            if (!$bucket || $bucket === 'Online') {
                continue;
            }
            $url = $e['URL'] ?? '';
            if (!$url && preg_match('#https?://\S+#', $e['DESCRIPTION'] ?? '', $m)) {
                $url = $m[0];
            }
            wp_insert_post([
                'post_type' => 'xf_event',
                'post_status' => 'pending',
                'post_title' => wp_strip_all_tags($e['SUMMARY']),
                'post_excerpt' => wp_trim_words(xf_event_clean_text($e['DESCRIPTION'] ?? ''), 40),
                'post_content' => wpautop(esc_html(wp_trim_words(xf_event_clean_text($e['DESCRIPTION'] ?? ''), 160))),
                'meta_input' => [
                    '_xf_uid' => $uid,
                    '_xf_start' => $e['DTSTART'],
                    '_xf_end' => $e['DTEND'] ?? '',
                    '_xf_venue' => xf_event_clean_venue($location),
                    '_xf_city' => $bucket,
                    '_xf_url' => esc_url_raw($url),
                    '_xf_organizer' => sanitize_text_field($e['ORGANIZER'] ?? ''),
                    '_xf_source_feed' => esc_url_raw($feed),
                    // The organiser's own share image, fetched from their page.
                    '_xf_image' => $url ? xf_fetch_event_image($url) : '',
                ],
            ]);
            $created++;
        }
    }
    return ['feeds' => count($feeds), 'imported_for_review' => $created];
}

function xf_guess_city($location) {
    $cities = ['Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'Gurugram', 'Gurgaon', 'Noida', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi', 'Dubai', 'Singapore', 'San Francisco', 'New York', 'London'];
    foreach ($cities as $city) {
        if (stripos($location, $city) !== false) {
            return $city === 'Bangalore' ? 'Bengaluru' : ($city === 'Gurgaon' ? 'Gurugram' : $city);
        }
    }
    if (preg_match('/zoom|google meet|online|virtual/i', $location)) {
        return 'Online';
    }
    return '';
}

/** Event pages: date, place, organiser and a clear link to register at the source. */
add_filter('the_content', function ($content) {
    $post = get_post();
    if (!$post || $post->post_type !== 'xf_event' || !is_singular('xf_event') || $post->ID !== get_queried_object_id()) {
        return $content;
    }
    $start = get_post_meta($post->ID, '_xf_start', true);
    $url = get_post_meta($post->ID, '_xf_url', true);
    $facts = array_filter([
        $start ? get_date_from_gmt($start, 'l, j F Y · g:i a') : '',
        get_post_meta($post->ID, '_xf_venue', true) ?: get_post_meta($post->ID, '_xf_city', true),
        ($org = get_post_meta($post->ID, '_xf_organizer', true)) ? 'Organised by ' . $org : '',
    ]);
    $head = '<div class="xf xf-event-facts">' . implode('', array_map(function ($f) { return '<p>' . esc_html($f) . '</p>'; }, $facts)) . '</div>';
    $cta = $url ? '<p class="xf-actions"><a class="xf-button" href="' . esc_url($url) . '" target="_blank" rel="noopener">Register on the organiser\'s page</a></p>' : '';
    return $head . $content . $cta;
});

/* -------------------------------------------------------------------------
 * Calendar feeds (Luma especially) put a link where the venue should be and
 * pad descriptions with "Get up-to-date information at: <url>" and
 * "Address: Check event page for more details." Clean both on import, and
 * once for events already imported.
 * ---------------------------------------------------------------------- */

/** The venue, or '' when the feed only gave a link (the page then shows the city). */
function xf_event_clean_venue($location) {
    $v = trim(preg_replace('#https?://\S+#i', '', (string) $location), " \t\n\r\0\x0B,·-");
    if ($v === '' || preg_match('#^(www\.|[a-z0-9.-]+\.(com|io|co|in|org|net)/)#i', $v) || preg_match('#^(online|tbd|tba|see event page)$#i', $v)) {
        return '';
    }
    return mb_substr($v, 0, 160);
}

/** Description text without the feed's boilerplate lines and bare links. */
function xf_event_clean_text($text) {
    $t = wp_strip_all_tags((string) $text);
    $t = preg_replace('#Get up-to-date information at:?\s*\S*#i', '', $t);
    $t = preg_replace('#Address:?\s*Check (the )?event page for more details\.?#i', '', $t);
    $t = preg_replace('#\b(Register|RSVP|Tickets?|Link|Sign ?up|Apply)( here)?\s*:?\s*https?://\S+#i', '', $t);
    $t = preg_replace('#https?://\S+#i', '', $t);
    $t = preg_replace('#\s{2,}#', ' ', $t);
    return trim($t, " \t\n\r\0\x0B.-:");
}

add_action('admin_init', 'xf_event_cleanup_once');
add_action('xf_daily_growth', 'xf_event_cleanup_once');
function xf_event_cleanup_once() {
    if (get_option('xf_event_cleanup') === '1') {
        return;
    }
    foreach (get_posts(['post_type' => 'xf_event', 'post_status' => 'any', 'posts_per_page' => -1]) as $p) {
        $venue = (string) get_post_meta($p->ID, '_xf_venue', true);
        $clean = xf_event_clean_venue($venue);
        if ($clean !== $venue) {
            update_post_meta($p->ID, '_xf_venue', $clean);
        }
        $ex = xf_event_clean_text($p->post_excerpt);
        $body = xf_event_clean_text($p->post_content);
        if ($ex !== $p->post_excerpt || $body !== trim(wp_strip_all_tags($p->post_content))) {
            wp_update_post(['ID' => $p->ID, 'post_excerpt' => $ex, 'post_content' => wpautop(esc_html($body))]);
        }
    }
    update_option('xf_event_cleanup', '1', false);
}
