<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Getting new pages found fast, by search engines and by AI tools.
 *
 *  - Sitemaps carry <lastmod>, so a crawler knows which pages changed.
 *  - IndexNow and the WebSub hub are told about a new or changed page in the
 *    same request that published it, not on the next WP-Cron tick (which on a
 *    quiet site can be hours away).
 *  - Startup events are published as open data: /events.json, an iCalendar
 *    feed at /events.ics, an RSS feed whose items carry the event details, and
 *    /llms.txt, which points AI assistants at all of it.
 *
 * None of this guarantees indexing or rankings. It removes the delay between
 * publishing and being asked for.
 */

/* ---- Sitemaps: tell crawlers when each page last changed ---- */

add_filter('wp_sitemaps_posts_entry', function ($entry, $post) {
    $entry['lastmod'] = wp_date('c', strtotime($post->post_modified_gmt . ' UTC'));
    return $entry;
}, 10, 2);

/* ---- Announce changes at the end of the request that made them ---- */

/** The feeds a change to this post appears in. */
function xf_feeds_for($post) {
    $feeds = [get_feed_link()];
    if ($post->post_type === 'xf_event') {
        $feeds[] = xf_event_feed_url();
    }
    return $feeds;
}

add_action('transition_post_status', function ($new, $old, $post) {
    if ($new !== 'publish' || !in_array($post->post_type, ['post', 'xf_event', 'xf_guide'], true)) {
        return;
    }
    $GLOBALS['xf_websub_feeds'] = array_unique(array_merge($GLOBALS['xf_websub_feeds'] ?? [], xf_feeds_for($post)));
}, 20, 3);

add_action('shutdown', function () {
    // IndexNow: send what this request queued instead of waiting for WP-Cron.
    if (function_exists('xf_indexnow_submit') && wp_next_scheduled('xf_indexnow_flush')) {
        $pending = (array) get_option('xf_indexnow_pending', []);
        if ($pending) {
            delete_option('xf_indexnow_pending');
            wp_clear_scheduled_hook('xf_indexnow_flush');
            xf_indexnow_submit($pending);
        }
    }
    // WebSub: Google and feed readers subscribed to our feeds hear about it at once.
    $feeds = $GLOBALS['xf_websub_feeds'] ?? [];
    if ($feeds && wp_get_environment_type() !== 'local' && !preg_match('/localhost|127\.0\.0\.1/', home_url())) {
        $body = 'hub.mode=publish';
        foreach ($feeds as $feed) {
            $body .= '&hub.url=' . rawurlencode($feed);
        }
        wp_remote_post('https://pubsubhubbub.appspot.com/', [
            'timeout' => 8,
            'blocking' => false,
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body' => $body,
        ]);
    }
}, 5);

// Every feed names its hub, so subscribers know where updates are pushed from.
add_action('rss2_head', function () {
    echo '<atom:link rel="hub" href="https://pubsubhubbub.appspot.com/" />' . "\n";
});

/* ---- Events as open data ---- */

function xf_event_feed_url() {
    return add_query_arg('post_type', 'xf_event', get_feed_link());
}

/** One event as a plain array: what a calendar, a feed or an AI tool needs. */
function xf_event_record($e) {
    $m = function ($k) use ($e) { return (string) get_post_meta($e->ID, '_xf_' . $k, true); };
    $iso = function ($utc) { return $utc ? gmdate('c', strtotime($utc . ' UTC')) : null; };
    $pic = function_exists('xf_event_image') ? xf_event_image($e->ID) : [];
    $venue = trim(preg_replace('/\s*\([^)]*\)\s*/', ' ', $m('venue')));
    return [
        'id' => $e->ID,
        'name' => xf_schema_text(get_the_title($e)),
        'summary' => xf_schema_text($e->post_excerpt ?: wp_trim_words($e->post_content, 40)),
        'start' => $iso($m('start')),
        'end' => $iso($m('end')),
        'city' => $m('city') ?: null,
        'venue' => $venue ?: null,
        'organiser' => $m('organizer') ?: null,
        'type' => $m('kind') ?: null,
        'price' => $m('price') ?: null,
        'register_url' => $m('url') ?: null,
        'page_url' => get_permalink($e),
        'image' => !empty($pic['theirs']) ? $pic['url'] : null,
        'updated' => gmdate('c', strtotime($e->post_modified_gmt . ' UTC')),
    ];
}

/** Upcoming events, soonest first. */
function xf_event_records($limit = 200) {
    $events = function_exists('xf_upcoming_events') ? xf_upcoming_events($limit) : [];
    return array_map('xf_event_record', $events);
}

/** iCalendar text escaping (RFC 5545 §3.3.11). */
function xf_ics_text($s) {
    return str_replace(["\\", ';', ',', "\r\n", "\n"], ['\\\\', '\;', '\,', '\n', '\n'], (string) $s);
}

/** Folds an iCalendar line at 75 octets. */
function xf_ics_line($line) {
    $out = '';
    while (strlen($line) > 75) {
        $cut = 75;
        while ($cut > 0 && (ord($line[$cut]) & 0xC0) === 0x80) {
            $cut--; // never split a UTF-8 character
        }
        $out .= substr($line, 0, $cut) . "\r\n ";
        $line = substr($line, $cut);
    }
    return $out . $line . "\r\n";
}

add_action('init', function () {
    $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    if (!in_array($path, ['events.json', 'events.ics', 'llms.txt'], true)) {
        return;
    }
    $events = $path === 'llms.txt' ? [] : xf_event_records();
    $updated = $events ? max(array_map(function ($e) { return strtotime($e['updated']); }, $events)) : time();
    header('Cache-Control: public, max-age=900');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $updated) . ' GMT');
    header('Access-Control-Allow-Origin: *');
    header('X-Robots-Tag: noindex'); // data, not a page to rank

    if ($path === 'events.json') {
        header('Content-Type: application/json; charset=utf-8');
        echo wp_json_encode([
            'title' => 'Upcoming startup events in India',
            'description' => 'Startup meetups, demo days and conferences in Indian cities, from the organisers\' own public listings. Register on each organiser\'s page.',
            'source' => home_url('/events/'),
            'licence' => 'Facts from public listings; link to the event page when you reuse them.',
            'generated' => gmdate('c'),
            'count' => count($events),
            'events' => $events,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($path === 'events.ics') {
        header('Content-Type: text/calendar; charset=utf-8');
        header('Content-Disposition: inline; filename="100xfounder-startup-events.ics"');
        $host = wp_parse_url(home_url(), PHP_URL_HOST);
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//100xFounder//Startup events//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
        $ics .= xf_ics_line('X-WR-CALNAME:Startup events in India (100xFounder)');
        $ics .= "X-WR-TIMEZONE:Asia/Kolkata\r\nREFRESH-INTERVAL;VALUE=DURATION:PT6H\r\nX-PUBLISHED-TTL:PT6H\r\n";
        $utc = function ($iso) { return $iso ? gmdate('Ymd\THis\Z', strtotime($iso)) : ''; };
        foreach ($events as $e) {
            if (!$e['start']) {
                continue;
            }
            $ics .= "BEGIN:VEVENT\r\n";
            $ics .= 'UID:event-' . (int) $e['id'] . '@' . $host . "\r\n";
            $ics .= 'DTSTAMP:' . $utc($e['updated']) . "\r\n";
            $ics .= 'LAST-MODIFIED:' . $utc($e['updated']) . "\r\n";
            $ics .= 'DTSTART:' . $utc($e['start']) . "\r\n";
            $ics .= 'DTEND:' . $utc($e['end'] ?: gmdate('c', strtotime($e['start']) + 2 * HOUR_IN_SECONDS)) . "\r\n";
            $ics .= xf_ics_line('SUMMARY:' . xf_ics_text($e['name']));
            $ics .= xf_ics_line('LOCATION:' . xf_ics_text(implode(', ', array_filter([$e['venue'], $e['city']]))));
            $ics .= xf_ics_line('DESCRIPTION:' . xf_ics_text(trim($e['summary'] . "\n\n" . 'Register: ' . ($e['register_url'] ?: $e['page_url']) . "\n" . 'Details: ' . $e['page_url'])));
            $ics .= xf_ics_line('URL:' . $e['page_url']);
            if ($e['organiser']) {
                $ics .= xf_ics_line('ORGANIZER;CN=' . xf_ics_text($e['organiser']) . ':' . ($e['register_url'] ?: $e['page_url']));
            }
            $ics .= "END:VEVENT\r\n";
        }
        echo $ics . "END:VCALENDAR\r\n"; // phpcs:ignore WordPress.Security.EscapeOutput -- calendar data
        exit;
    }

    // llms.txt: a plain map of the site for AI assistants (Google Search ignores it).
    header('Content-Type: text/plain; charset=utf-8');
    $u = function ($p) { return home_url($p); };
    $lines = [
        '# 100xFounder',
        '',
        '> Startup and AI news, funding rounds, jobs from official careers pages, startup events and free salary tools, mainly for India with global coverage. Every factual claim in an article carries its source.',
        '',
        '## Startup events (updated daily)',
        '- [Events page](' . $u('/events/') . '): upcoming startup events by city (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Pune, Chennai and more)',
        '- [Events as JSON](' . $u('/events.json') . '): every upcoming event with date, city, venue, organiser, price and registration link',
        '- [Events calendar (iCalendar)](' . $u('/events.ics') . '): subscribe in Google Calendar, Apple Calendar or Outlook',
        '- [Events RSS](' . xf_event_feed_url() . '): newly listed events',
        '',
        '## News and analysis',
        '- [Latest news](' . $u('/news/') . ')',
        '- [Funding tracker](' . $u('/funding-tracker/') . '): startup funding rounds with sources',
        '- [All articles RSS](' . get_feed_link() . ')',
        '',
        '## Articles and guides',
    ];
    foreach (get_posts(['post_type' => ['post', 'xf_guide'], 'post_status' => 'publish', 'posts_per_page' => 60, 'orderby' => 'date', 'order' => 'DESC']) as $a) {
        $lines[] = '- [' . wp_strip_all_tags(get_the_title($a)) . '](' . get_permalink($a) . ')' . ($a->post_excerpt ? ': ' . wp_strip_all_tags($a->post_excerpt) : '');
    }
    $lines = array_merge($lines, [
        '',
        '## Startups',
        '- [Startup directory](' . $u('/startups/') . '): new startups and products, with researched profiles',
        '- [Launches](' . $u('/launches/') . ')',
        '',
        '## Jobs',
        '- [Jobs board](' . $u('/jobs/') . '): roles in India from company careers pages and public applicant-tracking feeds, removed when they close',
        '',
        '## Tools',
        '- [Salary and career calculators](' . $u('/tools/') . ')',
        '',
        '## About',
        '- [About 100xFounder](' . $u('/about/') . ')',
        '- [Author: Ishaan Vardhan](' . $u('/author/ishaan-vardhan/') . '): the editorial desk\'s pen name',
        '- [Contact](' . $u('/contact/') . ')',
        '',
        '## Policies',
        '- [Editorial policy](' . $u('/editorial-policy/') . ')',
        '- [Corrections policy](' . $u('/corrections-policy/') . ')',
        '',
        '## Sitemaps',
        '- ' . $u('/wp-sitemap.xml'),
        '- ' . $u('/news-sitemap.xml'),
    ]);
    echo implode("\n", $lines) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput -- plain text built from our own URLs
    exit;
}, 0);

/* ---- The event feed carries the facts, not just a title ---- */

$xf_event_feed_body = function ($content) {
    $post = get_post();
    if (!$post || $post->post_type !== 'xf_event') {
        return $content;
    }
    $e = xf_event_record($post);
    $when = $e['start'] ? wp_date('l j F Y, g:i a', strtotime($e['start'])) . ' IST' : 'Date to be confirmed';
    $facts = array_filter([
        'When' => $when,
        'Where' => implode(', ', array_filter([$e['venue'], $e['city']])),
        'Organiser' => $e['organiser'],
        'Cost' => $e['price'],
    ]);
    $html = '<ul>';
    foreach ($facts as $k => $v) {
        $html .= '<li><strong>' . esc_html($k) . ':</strong> ' . esc_html($v) . '</li>';
    }
    $html .= '</ul>';
    if ($e['register_url']) {
        $html .= '<p><a href="' . esc_url($e['register_url']) . '">Register on the organiser\'s page</a></p>';
    }
    return $html . $content;
};
add_filter('the_content_feed', $xf_event_feed_body);
add_filter('the_excerpt_rss', $xf_event_feed_body);

/* ---- Point browsers, feed readers and AI tools at the event data ---- */

add_action('wp_head', function () {
    if (!(is_page('events') || is_singular('xf_event') || is_front_page())) {
        return;
    }
    printf('<link rel="alternate" type="application/rss+xml" title="Startup events (RSS)" href="%s">' . "\n", esc_url(xf_event_feed_url()));
    printf('<link rel="alternate" type="application/json" title="Startup events (JSON)" href="%s">' . "\n", esc_url(home_url('/events.json')));
    printf('<link rel="alternate" type="text/calendar" title="Startup events (calendar)" href="%s">' . "\n", esc_url(home_url('/events.ics')));
}, 6);
