<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Instagram templates from docs/instagram-playbook.md: founder story, news
 * card, AI tip and weekly roundup. Builders read only site content and freeze
 * the slide text into the queue payload (`slides`), so what the owner reviews
 * is what gets posted. One renderer draws every kind in the site's visual
 * system; a daily cron fills the playbook's weekly calendar.
 * ---------------------------------------------------------------------- */

const XF_IG_KINDS = ['founder_story', 'news_card', 'ai_tip', 'roundup'];
const XF_IG_MARGIN = 80;
const XF_IG_SPLIT_H = 742; // split layout: image on the top 55%, under the header band
const XF_IG_SPLIT_TOP = 170;
const XF_IG_LOGO = 150;

function xf_ig_series($kind) {
    $map = [
        'founder_story' => ['FOUNDER STORY', '#FounderStory100x'],
        'news_card' => ['NEWS', '#NewsCard100x'],
        'ai_tip' => ['AI TIP', '#AITip100x'],
        'roundup' => ['WEEKLY ROUNDUP', '#WeeklyRoundup100x'],
    ];
    return $map[$kind] ?? ['100XFOUNDER', '#100xfounder'];
}

/* ---- Text helpers ---- */

/** HTML or meta text to one plain line. */
function xf_ig_plain($html) {
    $text = html_entity_decode(wp_strip_all_tags(strip_shortcodes((string) $html)), ENT_QUOTES, 'UTF-8');
    return trim(preg_replace('/\s+/u', ' ', $text));
}

/** Sentences of a text or HTML; headings are dropped and paragraphs, list items and cells never merge. */
function xf_ig_sentences($text) {
    $text = preg_replace('#<h[1-6][^>]*>.*?</h[1-6]>#is', ' ', (string) $text);
    $text = preg_replace('#</(p|li|td|th|div|blockquote)>|<br\s*/?>#i', "\n", $text);
    $out = [];
    foreach (preg_split('/\n+/', $text) as $block) {
        foreach ((array) preg_split('/(?<=[.!?])\s+(?=[A-Z0-9"“‘(₹$])/u', xf_ig_plain($block)) as $s) {
            if (trim($s) !== '') {
                $out[] = trim($s);
            }
        }
    }
    return $out;
}

/** Caps text at $max words, ending with an ellipsis when cut. */
function xf_ig_words($text, $max = 25) {
    $text = xf_ig_plain($text);
    return str_word_count($text) <= $max ? $text : wp_trim_words($text, $max, '…');
}

/** The opening sentence(s) of a paragraph that fit in $max words. */
function xf_ig_lead($text, $max = 25) {
    $out = '';
    foreach (xf_ig_sentences($text) as $s) {
        $try = trim("$out $s");
        if (str_word_count($try) > $max) {
            break;
        }
        $out = $try;
    }
    return $out !== '' ? $out : xf_ig_words($text, $max);
}

/** A money, percentage or quantity figure (not a bare year) in the text, or ''. */
function xf_ig_figure($text) {
    $re = '/(?:₹|\$|€|£|Rs\.?\s?)\s?\d[\d,.]*\s?(?:crore|cr|lakh|million|billion|mn|bn|[kKMB]\b)?|\d[\d,.]*\s?(?:%|per cent|crore|lakh|million|billion)|\b\d{1,3}(?:,\d{2,3})+\b/u';
    return preg_match($re, (string) $text, $m) ? trim($m[0]) : '';
}

function xf_ig_tag($phrase) {
    $t = preg_replace('/[^a-z0-9]/', '', strtolower(remove_accents((string) $phrase)));
    return $t !== '' ? '#' . $t : '';
}

/** "100xfounder.com/startup/foo" from a permalink. */
function xf_ig_short_url($url) {
    return preg_replace('#^https?://(www\.)?#', '', untrailingslashit((string) $url));
}

function xf_ig_host_name($url) {
    return preg_replace('/^www\./', '', (string) wp_parse_url((string) $url, PHP_URL_HOST));
}

/**
 * The caption formula: hook, 2–3 short lines, the lesson, link line, a
 * question and 5–8 hashtags (series tag last).
 */
function xf_ig_caption($hook, array $lines, $lesson, $link_label, $url, $question, array $tags) {
    $tags = array_slice(array_values(array_unique(array_filter($tags))), 0, 8);
    $parts = [$hook, '', implode("\n", array_slice(array_filter($lines), 0, 3))];
    if ($lesson !== '') {
        array_push($parts, '', $lesson);
    }
    array_push($parts, '', '👉 ' . $link_label . ': link in bio (' . xf_ig_short_url($url) . ')', '💬 ' . $question, '', implode(' ', $tags));
    return implode("\n", $parts);
}

/** Queues (or refreshes) an item and stores what an auto-poster will need. */
function xf_ig_queue($kind, $ref_key, $title, $caption, array $slides, array $extra = []) {
    global $wpdb;
    $payload = ['slides' => $slides] + $extra;
    // Fetch and cache every image now, so the public slide route only reads cached copies.
    foreach ($slides as $sl) {
        foreach (['bg' => [XF_SLIDE_W, XF_SLIDE_H], 'split' => [XF_SLIDE_W, XF_IG_SPLIT_H - XF_IG_SPLIT_TOP], 'logo' => [XF_IG_LOGO, XF_IG_LOGO]] as $k => [$w, $h]) {
            if (!empty($sl[$k]['src']) && ($im = xf_ig_cached_image($sl[$k]['src'], $w, $h))) {
                imagedestroy($im);
            }
        }
    }
    $id = xf_ig_upsert($kind, $ref_key, $title, $caption, count($slides), $payload);
    if ($id) {
        // Re-read: the upsert may have re-applied the owner's improvements to the payload.
        $payload = json_decode((string) $wpdb->get_var($wpdb->prepare('SELECT payload FROM ' . xf_table('ig_queue') . ' WHERE id = %d', $id)), true) ?: $payload;
        $payload['slide_urls'] = array_map(function ($n) use ($id) { return xf_slide_url($id, $n); }, array_keys($slides));
        $wpdb->update(xf_table('ig_queue'), ['payload' => wp_json_encode($payload)], ['id' => $id]);
    }
    return $id;
}

/** Content ids already queued under a ref_key prefix (any status), so nothing is featured twice. */
function xf_ig_featured_ids($prefix) {
    global $wpdb;
    $keys = $wpdb->get_col($wpdb->prepare('SELECT ref_key FROM ' . xf_table('ig_queue') . ' WHERE ref_key LIKE %s', $wpdb->esc_like($prefix) . '%'));
    return array_map(function ($k) use ($prefix) { return (int) substr($k, strlen($prefix)); }, $keys);
}

/* ---- Images: only owner-provided, credited or the startup's own; never stock or AI faces ---- */

const XF_IG_IMG_MAX = 5242880; // 5 MB

/** "Product Hunt" for ph-files.imgix.net, else the bare host. */
function xf_ig_source_label($url) {
    $host = xf_ig_host_name($url);
    return preg_match('/(^|\.)(producthunt\.com|imgix\.net)$/', $host) ? 'Product Hunt' : $host;
}

/** Raw bytes of an attachment id or a remote URL (server-side, SSRF-safe, capped at 5 MB), or ''. */
function xf_ig_image_bytes($source) {
    if (is_numeric($source)) {
        $path = get_attached_file((int) $source);
        return $path && is_readable($path) && filesize($path) <= XF_IG_IMG_MAX ? (string) file_get_contents($path) : '';
    }
    $url = (string) $source;
    if (!preg_match('#^https?://#i', $url)) {
        return '';
    }
    if (strpos((string) wp_parse_url($url, PHP_URL_HOST), 'imgix.net') !== false) {
        $url = add_query_arg(['fm' => 'jpg', 'auto' => false, 'w' => 1400], $url); // GD may lack WebP/AVIF
    }
    if (!function_exists('xf_public_remote_get')) {
        return '';
    }
    // Every hop is checked for private/metadata hosts, and redirects must stay on the same host, so an
    // allowlisted photo URL can't bounce to a denied (news, stock, social) host after the rights check.
    $r = xf_public_remote_get($url, ['timeout' => 10, 'limit_response_size' => XF_IG_IMG_MAX], 3, ['https', 'http'], true);
    if (is_wp_error($r) || (int) wp_remote_retrieve_response_code($r) !== 200) {
        return '';
    }
    $body = (string) wp_remote_retrieve_body($r);
    return strlen($body) < XF_IG_IMG_MAX ? $body : ''; // a body at the cap was cut off
}

/**
 * The image cover-cropped to $w×$h as a GD image, or null. Resized copies are cached in
 * uploads/xf-ig-cache so the public slide route never refetches; failures are remembered for a day.
 */
function xf_ig_cached_image($source, $w, $h) {
    if (!$source) {
        return null;
    }
    $dir = trailingslashit(wp_upload_dir()['basedir']) . 'xf-ig-cache/';
    $file = $dir . md5((string) $source . "|$w|$h") . '.jpg';
    if (is_readable($file)) {
        return @imagecreatefromjpeg($file) ?: null;
    }
    if (is_readable("$file.fail") && filemtime("$file.fail") > time() - DAY_IN_SECONDS) {
        return null;
    }
    wp_mkdir_p($dir);
    $data = xf_ig_image_bytes($source);
    $info = $data !== '' ? @getimagesizefromstring($data) : false;
    // A 5 MB PNG can declare 30000×30000 pixels: GD would need gigabytes, so cap the decoded size (25 MP).
    $ok = $info && in_array($info['mime'] ?? '', ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true) && $info[0] > 0 && $info[1] > 0 && $info[0] * $info[1] <= 25000000;
    $src = $ok ? @imagecreatefromstring($data) : false;
    if (!$src) {
        @touch("$file.fail");
        return null;
    }
    [$sw, $sh] = [imagesx($src), imagesy($src)];
    $scale = max($w / $sw, $h / $sh);
    [$cw, $ch] = [(int) round($w / $scale), (int) round($h / $scale)];
    $dst = imagecreatetruecolor($w, $h);
    imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255)); // transparent logos sit on white
    imagecopyresampled($dst, $src, 0, 0, (int) (($sw - $cw) / 2), (int) (($sh - $ch) / 2), $w, $h, $cw, $ch);
    imagedestroy($src);
    imagejpeg($dst, $file, 86);
    return $dst;
}

/* ---- Founder photos: who we may show ---- */

/** Hosts we never take people photos from: news agencies and papers, social profiles, stock libraries. */
function xf_ig_photo_denied_host($host) {
    return (bool) preg_match('/(^|\.)(ptinews\.com|aninews\.in|gettyimages\.[a-z.]+|gettyimages\.com|reuters\.com|reutersmedia\.net|apnews\.com|afp\.com|economictimes\.(com|indiatimes\.com)|indiatimes\.com|etimg\.com|timesofindia\.com|moneycontrol\.com|mint\.com|livemint\.com|hindustantimes\.com|ndtv(img)?\.com|thehindu\.com|business-standard\.com|yourstory\.com|inc42\.com|entrackr\.com|licdn\.com|linkedin\.com|instagram\.com|cdninstagram\.com|fbcdn\.net|facebook\.com|twimg\.com|x\.com|twitter\.com|shutterstock\.com|istockphoto\.com|adobestock\.com|stock\.adobe\.com|ftcdn\.net|alamy\.com|dreamstime\.com|depositphotos\.com|123rf\.com|unsplash\.com|pexels\.com|pixabay\.com|freepik\.com)$/i', (string) $host);
}

/** Hosts that count as the startup's own: its website domain (from the listing) plus CDN hosts the profile lists. */
function xf_ig_official_hosts($startup_id) {
    $hosts = [];
    $site = (string) get_post_meta((int) $startup_id, '_xf_website', true);
    $host = preg_replace('/^www\./', '', strtolower(rtrim((string) wp_parse_url($site, PHP_URL_HOST), '.')));
    if ($host && !preg_match('/(^|\.)producthunt\.com$/', $host)) {
        $hosts[] = $host;
    }
    $p = xf_startup_profile($startup_id);
    foreach ([$p['website'] ?? '', $p['maker']['url'] ?? ''] as $u) {
        $h = preg_replace('/^www\./', '', strtolower(rtrim((string) wp_parse_url((string) $u, PHP_URL_HOST), '.')));
        if ($h && !xf_ig_photo_denied_host($h) && !preg_match('/(^|\.)(producthunt\.com|github\.com)$/', $h)) {
            $hosts[] = $h;
        }
    }
    // CDN hosts the official site itself serves images from, recorded by research (e.g. "cdn.prod.website-files.com").
    foreach ((array) ($p['official_image_hosts'] ?? []) as $h) {
        $hosts[] = preg_replace('/^www\./', '', rtrim(strtolower(trim((string) $h)), '.'));
    }
    return array_values(array_unique(array_filter($hosts)));
}

/** True when the licence string allows commercial reuse (CC0, public domain, CC BY, CC BY-SA; no NC/ND). */
function xf_ig_license_ok($license) {
    $l = strtolower(trim((string) $license));
    return $l !== '' && !preg_match('/\b(nc|nd|non-?commercial|no-?deriv)/', $l)
        && (bool) preg_match('/^(cc0|cc-?0|public domain|pd\b|pdm|cc[ -]by(-sa)?\b)/', $l);
}

/**
 * Whether a founder photo may be used, for the research routines and the slide builder.
 * $source_type: 'official' (the startup's site, About/Team page or press kit), 'wikimedia'
 * (Wikimedia Commons / Creative Commons) or 'founder' (supplied by the founder).
 * Returns ['ok' => bool, 'reason' => string, 'credit' => credit line for the slide].
 */
function xf_ig_founder_photo_check($url, $startup_id, $source_type, $credit = '', $license = '') {
    $no = function ($why) { return ['ok' => false, 'reason' => $why, 'credit' => '']; };
    $company = get_the_title((int) $startup_id);
    if (is_numeric($url)) {
        // Our own media library: only founder-supplied files.
        return $source_type === 'founder' && get_post_type((int) $url) === 'attachment'
            ? ['ok' => true, 'reason' => 'founder upload', 'credit' => 'Photo: ' . ($credit ?: 'supplied by the founder')]
            : $no('a media-library photo must be founder-supplied');
    }
    $parts = wp_parse_url((string) $url);
    // userinfo ("allowed.com@evil.com"), ports, backslashes/controls and non-ASCII hosts (fullwidth dots that
    // cURL's IDNA folds into real dots) could make the host we check differ from the host we fetch.
    if (!$parts || isset($parts['user']) || isset($parts['pass']) || isset($parts['port']) || preg_match('/[\\\\\s\x00-\x1f\x7f]/', (string) $url)) {
        return $no('URL has credentials, a port or unsafe characters');
    }
    $host = strtolower(rtrim((string) ($parts['host'] ?? ''), '.')); // "example.com." is example.com
    if (!preg_match('/^[a-z0-9.-]+$/', $host)) {
        return $no('host must be plain ASCII (use the punycode form)');
    }
    $host = preg_replace('/^www\./', '', $host);
    $uploads = set_url_scheme(wp_upload_dir()['baseurl'], 'https');
    $own = strpos(set_url_scheme((string) $url, 'https'), $uploads . '/') === 0;
    if (!$host || (!$own && !preg_match('#^https://#i', (string) $url))) {
        return $no('not an https URL');
    }
    if (xf_ig_photo_denied_host($host)) {
        return $no("$host is a news, social or stock host");
    }
    switch ($source_type) {
        case 'founder':
            return $own ? ['ok' => true, 'reason' => 'founder upload', 'credit' => 'Photo: ' . ($credit ?: 'supplied by the founder')] : $no('founder photos must be uploaded to our media library');
        case 'official':
            foreach (xf_ig_official_hosts($startup_id) as $h) {
                if ($host === $h || substr($host, -strlen(".$h")) === ".$h") {
                    return ['ok' => true, 'reason' => "official host $h", 'credit' => "Photo: $company"];
                }
            }
            return $no("$host is not the startup's own website or a CDN its profile lists");
        case 'wikimedia':
            if ($host !== 'upload.wikimedia.org') {
                return $no('Wikimedia photos must be served from upload.wikimedia.org');
            }
            if (!xf_ig_license_ok($license)) {
                return $no('licence missing or not open for commercial reuse');
            }
            if (trim((string) $credit) === '') {
                return $no('Wikimedia photos need the author as the credit');
            }
            return ['ok' => true, 'reason' => 'Wikimedia Commons, ' . $license, 'credit' => 'Photo: ' . $credit . (stripos($credit, $license) === false ? " / Wikimedia Commons, $license" : '')];
    }
    return $no('unknown source type');
}

/** Slide image spec for a profile team entry's photo, or null when it fails the rights check. */
function xf_ig_team_photo_spec(array $t, $startup_id) {
    $r = xf_ig_founder_photo_check($t['photo'] ?? '', $startup_id, $t['photo_source_type'] ?? '', $t['photo_credit'] ?? '', $t['photo_license'] ?? '');
    return $r['ok'] ? ['src' => $t['photo'], 'credit' => $r['credit']] : null;
}

/**
 * For research routines: checks a founder photo and, when allowed, stores it on the matching
 * team entry of the startup's profile (photo, photo_credit, photo_source_type, photo_license).
 * Returns true or a WP_Error explaining the refusal.
 */
function xf_ig_set_founder_photo($startup_id, $member_name, $url, $source_type, $credit = '', $license = '') {
    $r = xf_ig_founder_photo_check($url, $startup_id, $source_type, $credit, $license);
    if (!$r['ok']) {
        return new WP_Error('xf_photo_rejected', $r['reason']);
    }
    $p = xf_startup_profile($startup_id);
    foreach ((array) ($p['team'] ?? []) as $i => $t) {
        if (strcasecmp(trim($t['name'] ?? ''), trim((string) $member_name)) === 0) {
            $p['team'][$i] = array_merge($t, ['photo' => is_numeric($url) ? (int) $url : esc_url_raw($url), 'photo_credit' => sanitize_text_field($credit), 'photo_source_type' => $source_type, 'photo_license' => sanitize_text_field($license)]);
            update_post_meta((int) $startup_id, '_xf_profile', wp_slash(wp_json_encode($p)));
            return true;
        }
    }
    return new WP_Error('xf_photo_no_member', 'No team member with that name on the profile.');
}

/** The startup's logo (its featured image, else the Product Hunt thumbnail) as a slide image spec, or null. */
function xf_ig_logo_spec($startup_id) {
    $startup_id = (int) $startup_id;
    $src = $startup_id ? (get_post_thumbnail_id($startup_id) ?: get_post_meta($startup_id, '_xf_thumbnail', true)) : '';
    return $src ? ['src' => $src, 'credit' => 'Logo: ' . get_the_title($startup_id)] : null;
}

/** Published startup listing whose name matches $name, or 0. */
function xf_ig_startup_by_name($name) {
    $ids = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'title' => (string) $name, 'posts_per_page' => 1, 'fields' => 'ids']);
    return (int) ($ids[0] ?? 0);
}

/** Profile gallery images as specs, credited to their stored credit or to where they came from. */
function xf_ig_gallery_specs($startup_id) {
    $name = get_the_title($startup_id);
    return array_map(function ($g) use ($name) {
        return ['src' => $g['url'], 'credit' => !empty($g['credit']) ? $g['credit'] : "$name via " . xf_ig_source_label($g['url'])];
    }, xf_profile_gallery(xf_startup_profile($startup_id)));
}

/** The post's featured image with its stored credit; uncredited images are not used. */
function xf_ig_featured_spec($post_id) {
    $att = (int) get_post_thumbnail_id($post_id);
    $credit = $att ? (get_post_meta($post_id, '_xf_image_credit', true) ?: get_post_meta($att, '_xf_image_credit', true) ?: wp_get_attachment_caption($att)) : '';
    return $att && $credit ? ['src' => $att, 'credit' => xf_ig_plain($credit)] : null;
}

/**
 * Founder-story images: a full-bleed hook (founder photo when we have one we may use, else a
 * product screenshot), the logo on the hook and CTA, and 1–2 split slides from the gallery.
 */
function xf_ig_story_images(array $slides, $startup_id, $photo = null) {
    $gallery = $startup_id ? xf_ig_gallery_specs($startup_id) : [];
    $logo = xf_ig_logo_spec($startup_id);
    $last = count($slides) - 1;
    $slides[0]['bg'] = $photo ?: ($gallery[0] ?? null);
    $slides[0]['logo'] = $logo;
    $slides[$last]['logo'] = $logo;
    // Gallery images left after the hook (reuse the only one rather than show none).
    $rest = $photo ? $gallery : array_slice($gallery, 1);
    $rest = $rest ?: array_slice($gallery, 0, 1);
    $ideas = array_keys(array_filter($slides, function ($s) { return $s['type'] === 'idea'; }));
    foreach ([1, 3] as $k => $i) {
        if (isset($ideas[$i], $rest[$k])) {
            $slides[$ideas[$i]]['split'] = $rest[$k];
        }
    }
    return $slides;
}

/* ---- Builders: each returns the queue id, or null when the content is too thin ---- */

function xf_ig_founder_story_startup($startup_id) {
    $startup_id = (int) $startup_id;
    $p = xf_startup_profile($startup_id);
    if (!$p || get_post_status($startup_id) !== 'publish') {
        return null;
    }
    $name = get_the_title($startup_id);
    $team = array_values(array_filter((array) ($p['team'] ?? []), function ($t) { return !empty($t['name']); }));
    $maker = $p['maker']['name'] ?? ($team[0]['name'] ?? '');
    $story = array_values(array_filter(array_map('xf_ig_plain', (array) ($p['launch_story']['paragraphs'] ?? []))));
    $liked = (array) ($p['opinions']['themes']['liked'] ?? []);

    $ideas = [];
    if (isset($story[0])) {
        $ideas[] = ['THE PROBLEM', xf_ig_lead($story[0])];
    }
    if (isset($story[1])) {
        $ideas[] = ['THE TURN', xf_ig_lead($story[1])];
    }
    if (!empty($p['use_cases'][0]) || !empty($p['summary_short'])) {
        $ideas[] = ['WHAT IT DOES', xf_ig_words($p['use_cases'][0] ?? $p['summary_short'])];
    }
    if (!empty($p['audience']['fit'][0])) {
        $ideas[] = ["WHO IT'S FOR", xf_ig_words('Made for you if you ' . $p['audience']['fit'][0])];
    }
    if (!empty($p['starts_at'])) {
        $ideas[] = ['PRICING', xf_ig_words($p['starts_at'])];
    }
    if ($liked) {
        $ideas[] = ['WHAT USERS LIKED', xf_ig_words($liked[0])];
    } elseif ($team) {
        $ideas[] = ['THE TEAM', xf_ig_words(implode(', ', array_map(function ($t) { return trim($t['name'] . (!empty($t['role']) ? " ({$t['role']})" : '')); }, array_slice($team, 0, 3))))];
    }
    $ideas = array_slice($ideas, 0, 5);
    if (count($ideas) < 3) {
        return null;
    }

    // Hook: a real number from the profile, else a contrast from the facts.
    $votes = (int) ($p['ph']['votes'] ?? 0);
    $solo = count($team) === 1 || ($maker && !$team);
    $by = $maker ? ($solo ? "Built by one founder, $maker." : "Built by $maker and team.") : '';
    if ($votes > 0) {
        $hook = ['stat' => number_format($votes), 'headline' => "upvotes for $name on Product Hunt", 'accent' => $name, 'sub' => $by];
        $hook_line = number_format($votes) . " upvotes on Product Hunt for $name." . ($by ? " $by" : '');
    } else {
        $hook = ['stat' => '', 'headline' => "Meet the founder behind $name", 'accent' => $name, 'sub' => $by ?: xf_ig_words($p['category'] ?? '', 12)];
        $hook_line = "Meet the founder behind $name." . ($by ? " $by" : '');
    }

    $free = stripos((string) ($p['starts_at'] ?? ''), 'free') === 0;
    $asked = !empty($p['opinions']['themes']['asked']) || preg_match('/\basked\b|feedback|criticism/i', implode(' ', $story));
    // Editorial lesson (an opinion, not a claim about the company), picked from what the facts show.
    $lesson = $asked ? 'Launch early, then ask people what breaks.' : ($free ? 'Make the first try free, then earn the upgrade.' : 'Solve one clear problem, then ship it.');

    $url = get_permalink($startup_id);
    $src_url = $p['launch_story']['url'] ?? ($p['sources'][0]['url'] ?? '');
    $source = $src_url ? xf_ig_host_name($src_url) : '100xfounder.com';
    $labels = array_slice(array_filter(array_map(function ($s) { return $s['label'] ?? ''; }, (array) ($p['sources'] ?? []))), 0, 2);

    $slides = [['type' => 'hook'] + $hook];
    foreach ($ideas as [$kicker, $body]) {
        $slides[] = ['type' => 'idea', 'kicker' => $kicker, 'body' => $body];
    }
    $slides[] = ['type' => 'quote', 'kicker' => 'THE LESSON', 'body' => $lesson, 'by' => ''];
    $slides[] = ['type' => 'cta', 'headline' => "Read the full $name story", 'accent' => $name, 'url' => xf_ig_short_url($url), 'note' => 'Sources: ' . ($labels ? implode('; ', $labels) : $source)];
    foreach ($slides as &$s) {
        $s['source'] = $source;
    }
    unset($s);
    // A founder photo only from a team entry whose source passes the rights check; else the product image.
    $photo = null;
    foreach ($team as $t) {
        if (!empty($t['photo']) && ($photo = xf_ig_team_photo_spec($t, $startup_id))) {
            break;
        }
    }
    $slides = xf_ig_story_images($slides, $startup_id, $photo);

    $category = (string) ($p['category'] ?? '');
    $caption = xf_ig_caption(
        $hook_line,
        array_map(function ($i) { return $i[1]; }, array_slice($ideas, 0, 3)),
        $lesson,
        'Full story + sources',
        $url,
        "Would you try $name, or do you use something else?",
        ['#100xfounder', '#founderstory', '#startups', '#buildinpublic', xf_ig_tag($category), '#producthunt', '#FounderStory100x']
    );
    return xf_ig_queue('founder_story', 'founder_story:startup:' . $startup_id, "Founder story: $name", $caption, $slides, [
        'startup' => $startup_id, 'url' => $url, 'needs_founder_ok' => true, 'votes' => $votes,
    ]);
}

function xf_ig_founder_story_spotlight($spotlight_id) {
    $spotlight_id = (int) $spotlight_id;
    if (get_post_status($spotlight_id) !== 'publish' || !get_post_meta($spotlight_id, '_xf_consent_instagram', true)) {
        return null;
    }
    $name = (string) get_post_meta($spotlight_id, '_xf_founder_name', true);
    $product = get_the_title((int) get_post_meta($spotlight_id, '_xf_startup_id', true));
    $field = function ($k) use ($spotlight_id) { return xf_ig_plain(get_post_meta($spotlight_id, '_xf_' . $k, true)); };
    $ideas = [];
    foreach (['story_origin' => "WHY $product", 'story_problem' => 'THE PROBLEM', 'story_traction' => 'TRACTION', 'story_next' => "WHAT'S NEXT"] as $k => $kicker) {
        if ($field($k) !== '') {
            $ideas[] = [mb_strtoupper($kicker), xf_ig_lead($field($k))];
        }
    }
    if (count($ideas) < 3 || $name === '') {
        return null;
    }
    $first = strtok($name, ' ');
    $figure = '';
    $figure_line = '';
    foreach (['story_traction', 'story_origin', 'story_problem', 'story_next'] as $k) {
        foreach (xf_ig_sentences($field($k)) as $s) {
            if (($f = xf_ig_figure($s)) !== '') {
                [$figure, $figure_line] = [$f, xf_ig_words($s)];
                break 2;
            }
        }
    }
    $hook = $figure !== ''
        ? ['stat' => $figure, 'headline' => "$name on building $product", 'accent' => $product, 'sub' => $figure_line]
        : ['stat' => '', 'headline' => "Meet the founder behind $product", 'accent' => $product, 'sub' => $name];
    $photo_id = (int) get_post_thumbnail_id($spotlight_id); // founder-submitted with the spotlight form

    $advice = $field('story_advice');
    $lesson = $advice !== '' ? xf_ig_lead($advice, 20) : 'Solve one clear problem, then ship it.';
    $url = get_permalink($spotlight_id);
    $slides = [['type' => 'hook'] + $hook];
    foreach (array_slice($ideas, 0, 5) as [$kicker, $body]) {
        $slides[] = ['type' => 'idea', 'kicker' => $kicker, 'body' => $body];
    }
    $slides[] = ['type' => 'quote', 'kicker' => 'THE LESSON', 'body' => $lesson, 'by' => $advice !== '' ? $name : ''];
    $slides[] = ['type' => 'cta', 'headline' => "Read $first's full story", 'accent' => $first, 'url' => xf_ig_short_url($url), 'note' => "Source: interview with $name, founder of $product"];
    foreach ($slides as &$s) {
        $s['source'] = 'Founder interview';
    }
    unset($s);
    $slides = xf_ig_story_images($slides, (int) get_post_meta($spotlight_id, '_xf_startup_id', true), $photo_id ? ['src' => $photo_id, 'credit' => "Photo: $name (founder)"] : null);
    $handle = get_post_meta($spotlight_id, '_xf_instagram', true);
    $caption = xf_ig_caption(
        ($figure_line ?: "Meet $name, the founder behind $product.") . ($handle ? " (@$handle)" : ''),
        array_map(function ($i) { return $i[1]; }, array_slice($ideas, 0, 3)),
        $lesson,
        'Full story + sources',
        $url,
        "What would you ask $first about building $product?",
        ['#100xfounder', '#founderstory', '#startups', '#founders', '#buildinpublic', '#FounderStory100x']
    );
    return xf_ig_queue('founder_story', 'founder_story:spotlight:' . $spotlight_id, "Founder story: $name ($product)", $caption, $slides, [
        'spotlight' => $spotlight_id, 'url' => $url, 'needs_founder_ok' => false,
    ]);
}

/** Categories whose posts can become news cards. */
function xf_ig_news_category_slugs() {
    return array_merge(['funding', 'startup-news', 'ai-news', 'global'], array_keys(array_slice(xf_news_categories(), 0, 10, true)));
}

/** Article body without the FAQ and Sources tail. */
function xf_ig_article_body($post_id) {
    $html = (string) get_post_field('post_content', $post_id);
    $cut = preg_match('#<h2[^>]*>\s*(FAQ|Sources|Frequently asked)#i', $html, $m, PREG_OFFSET_CAPTURE) ? $m[0][1] : strlen($html);
    return substr($html, 0, $cut);
}

/** Shortens a headline to ≤9 words at a natural break, else with an ellipsis. */
function xf_ig_headline($title) {
    $title = xf_ig_plain($title);
    if (str_word_count($title) <= 9) {
        return $title;
    }
    foreach (preg_split('/:\s|\s[—–-]\s|\s(?:as|after|with|for|ahead of|amid|despite|while)\s|,\s/u', $title) as $part) {
        $n = str_word_count($part);
        if ($n >= 3 && $n <= 9) {
            return trim($part);
        }
    }
    return wp_trim_words($title, 9, '…');
}

function xf_ig_news_card($post_id) {
    $post_id = (int) $post_id;
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish' || get_post_meta($post_id, '_xf_sponsored', true)
        || !has_category(xf_ig_news_category_slugs(), $post) || xf_ig_ai_task($post_id)) { // "Best AI for X" guides are AI tips, not news
        return null;
    }
    $sources = function_exists('xf_get_sources') ? xf_get_sources($post_id) : [];
    if (!$sources) {
        return null; // News cards always name their source.
    }
    $source = $sources[0]['publisher'] ?: xf_ig_host_name($sources[0]['url']);
    $sentences = xf_ig_sentences(xf_ig_article_body($post_id));
    // Facts: sentences with a figure, whole ones (≤25 words) first, in article order.
    $facts = [];
    foreach ([25, 40] as $limit) {
        foreach ($sentences as $s) {
            if (count($facts) < 3 && xf_ig_figure($s) !== '' && str_word_count($s) <= $limit && !preg_match('/^[(\[]/', $s) && !in_array(xf_ig_words($s), $facts, true)) {
                $facts[] = xf_ig_words($s);
            }
        }
    }
    if (count($facts) < 3) {
        return null;
    }
    // Why it matters: the section under a "why it matters / what it means" heading, else a sentence about India or founders.
    $body = xf_ig_article_body($post_id);
    $why = '';
    if (preg_match('#<h[23][^>]*>[^<]*(why|matters|means for|india)[^<]*</h[23]>\s*(.*?)(?=<h[23]|$)#is', $body, $wm)) {
        $first = xf_ig_sentences($wm[2])[0] ?? '';
        $why = $first !== '' ? xf_ig_words($first, 30) : '';
    }
    foreach ($why === '' ? $sentences : [] as $s) {
        if (preg_match('/Indian (founders|startups)|for founders|for India|this means/i', $s) && !in_array(xf_ig_words($s), $facts, true)) {
            $why = xf_ig_words($s, 30);
            break;
        }
    }
    $why = $why !== '' ? $why : xf_ig_words(get_the_excerpt($post), 30);
    $headline = xf_ig_headline(get_the_title($post));
    $figure = xf_ig_figure($headline) ?: xf_ig_figure($facts[0]);
    $cat = xf_primary_category($post_id);
    $cat_name = $cat ? html_entity_decode($cat->name, ENT_QUOTES, 'UTF-8') : 'Startup news';
    $url = get_permalink($post_id);
    $date = get_the_date('j M Y', $post);
    $slides = [
        ['type' => 'headline', 'kicker' => mb_strtoupper($cat_name), 'headline' => $headline, 'accent' => $figure, 'sub' => "$date · 3 facts, swipe", 'bg' => xf_ig_featured_spec($post_id)],
        ['type' => 'bullets', 'kicker' => '3 FACTS', 'items' => $facts],
        ['type' => 'why', 'kicker' => 'WHY IT MATTERS FOR INDIAN FOUNDERS', 'body' => $why, 'url' => xf_ig_short_url($url)],
    ];
    foreach ($slides as &$s) {
        $s['source'] = $source;
    }
    unset($s);
    $tags = ['#100xfounder', '#indianstartups', '#startupnews', xf_ig_tag($cat_name), has_category('funding', $post) ? '#startupfunding' : '#founders', '#NewsCard100x'];
    $caption = xf_ig_caption(
        $headline . ($figure && stripos($headline, $figure) === false ? " ($figure)" : ''),
        $facts,
        'Why it matters: ' . $why,
        'Full story + sources',
        $url,
        'Good move or risky bet? Tell us below.',
        $tags
    ) . "\n\nSource: $source";
    return xf_ig_queue('news_card', 'news_card:post:' . $post_id, 'News card: ' . $headline, $caption, $slides, ['post' => $post_id, 'url' => $url]);
}

/** "Best AI for X" articles: returns [headline, accent word, comment question] or null. */
function xf_ig_ai_task($post_id) {
    $title = xf_ig_plain(get_the_title($post_id));
    $override = trim((string) get_post_meta($post_id, '_xf_ig_task', true));
    if ($override !== '') {
        return ["Stop doing $override manually", $override, "Which AI do you use for $override?"];
    }
    if (preg_match('/^best (?:free )?ai (?:tools? )?for ([^:(]+?)(?:\s+in\s+\d{4}|\s+\d{4})?\s*(?:[:(]|$)/i', $title, $m)) {
        $x = strtolower(trim($m[1]));
        if (preg_match('/ing$/', $x)) {
            return ["Stop $x manually", $x, "Which AI do you use for $x?"];
        }
        if (preg_match('/^(sales|marketing|customer support|seo|research|design|accounting|bookkeeping|recruiting|hiring)$/', $x)) {
            return ["Stop doing $x manually", $x, "Which AI do you use for $x?"];
        }
    }
    if (preg_match('/^best (?:free )?(ai [^:(]+?)(?:\s+in\s+\d{4}|\s+\d{4})?\s*(?:[:(]|$)/i', $title, $m)) {
        $y = trim($m[1]);
        return ["Stop guessing: the best $y", $y, "Which $y do you use, and why?"];
    }
    return null;
}

function xf_ig_ai_tip($post_id) {
    $post_id = (int) $post_id;
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish' || get_post_meta($post_id, '_xf_sponsored', true) || !($task = xf_ig_ai_task($post_id))) {
        return null;
    }
    [$headline, $accent, $question] = $task;
    $html = xf_ig_article_body($post_id);
    preg_match_all('#<h2[^>]*>(.*?)</h2>#is', $html, $m, PREG_OFFSET_CAPTURE);
    $tags = array_map('strtolower', wp_get_post_tags($post_id, ['fields' => 'names']));
    $tools = [];
    foreach ($m[1] as $i => $h) {
        $text = xf_ig_plain($h[0]);
        if (strpos($text, ':') === false) {
            continue;
        }
        [$left, $right] = array_map('trim', explode(':', $text, 2));
        if (preg_match('/takeaways|comparison|how we|which|bottom line|assistant or agent|what happened|privacy/i', $left)) {
            continue;
        }
        $tagged = (bool) array_filter($tags, function ($t) use ($left) { return stripos($left, $t) !== false || stripos($t, strtolower($left)) !== false; });
        if ($tagged || preg_match('/^(best|the)\b/i', $right)) {
            $start = $h[1] + strlen($h[0]);
            $end = isset($m[0][$i + 1]) ? $m[0][$i + 1][1] : strlen($html);
            $tools[] = ['name' => $left, 'why' => $right, 'section' => substr($html, $start, $end - $start)];
        }
    }
    if (!$tools) {
        return null;
    }
    $top = $tools[0];
    $plain = xf_ig_plain($top['section']);
    $steps = [];
    $steps[] = preg_match('/Best for:\s*([^.]+)/i', $plain, $bf) ? 'Check it fits. Best for ' . xf_ig_words(trim($bf[1]), 20) : 'Check it fits: ' . xf_ig_words($top['why'], 20);
    $prices = array_values(array_filter(xf_ig_sentences($top['section']), function ($s) { return preg_match('/(?:₹|\$|€|£)\s?\d|\bfree\b|per month|\/month/i', $s); }));
    if ($prices) {
        $steps[] = 'Pick a plan. ' . xf_ig_words($prices[0], 22);
    }
    $others = array_slice(array_map(function ($t) { return $t['name']; }, array_slice($tools, 1)), 0, 3);
    if ($others) {
        $steps[] = 'Compare it with ' . (count($others) > 1 ? implode(', ', array_slice($others, 0, -1)) . ' and ' . end($others) : $others[0]) . ' in our full guide.';
    }
    if (count($steps) < 3) {
        return null;
    }
    $sources = function_exists('xf_get_sources') ? xf_get_sources($post_id) : [];
    $source = $sources ? ($sources[0]['publisher'] ?: xf_ig_host_name($sources[0]['url'])) : '100xfounder.com guide';
    $url = get_permalink($post_id);
    $tool_id = xf_ig_startup_by_name($top['name']); // the tool's own listing, for its logo and screenshots
    $slides = [
        ['type' => 'hook', 'stat' => '', 'headline' => $headline, 'accent' => $accent, 'sub' => 'One tool, three steps. Swipe for the top pick from our guide.'],
        ['type' => 'tool', 'kicker' => 'TOP PICK', 'name' => $top['name'], 'body' => ucfirst($top['why']), 'logo' => $tool_id ? xf_ig_logo_spec($tool_id) : null, 'split' => ($tool_id ? (xf_ig_gallery_specs($tool_id)[0] ?? null) : null) ?: xf_ig_featured_spec($post_id)],
        ['type' => 'bullets', 'kicker' => '3 STEPS', 'items' => $steps],
        ['type' => 'cta', 'headline' => 'More tools: link in bio', 'accent' => 'More tools', 'url' => xf_ig_short_url($url), 'note' => 'Prices and sources in the guide' . ($sources ? ' · ' . $source : '')],
    ];
    foreach ($slides as &$s) {
        $s['source'] = $source;
    }
    unset($s);
    $caption = xf_ig_caption(
        $headline . '. Start with ' . $top['name'] . '.',
        array_merge([$top['name'] . ': ' . $top['why'] . '.'], array_slice($steps, 1, 2)),
        '',
        'More tools + sources',
        $url,
        $question,
        ['#100xfounder', '#aitools', '#productivity', xf_ig_tag($accent), xf_ig_tag($top['name']), '#AITip100x']
    );
    return xf_ig_queue('ai_tip', 'ai_tip:post:' . $post_id, 'AI tip: ' . $top['name'] . " ($accent)", $caption, $slides, ['post' => $post_id, 'url' => $url]);
}

/**
 * Weekly roundup. $variant 'funding' (Monday: rounds first) or 'week'
 * (Saturday: a mix of rounds, launches and upcoming events).
 */
function xf_ig_roundup($variant = 'week', $now = 'now') {
    $variant = $variant === 'funding' ? 'funding' : 'week';
    $since = gmdate('Y-m-d H:i:s', strtotime($now) - 7 * DAY_IN_SECONDS);
    $rounds = get_posts(['post_type' => 'xf_round', 'post_status' => 'publish', 'posts_per_page' => 4, 'date_query' => [['after' => $since, 'column' => 'post_date_gmt']]]);
    $launches = get_posts([
        'post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 4,
        'meta_key' => '_xf_votes', 'orderby' => 'meta_value_num', 'order' => 'DESC',
        'meta_query' => [['key' => '_xf_launch_day', 'value' => gmdate('Y-m-d', strtotime($now) - 7 * DAY_IN_SECONDS), 'compare' => '>=']],
    ]);
    $events = function_exists('xf_upcoming_events') ? xf_upcoming_events(3) : [];
    $week = wp_date('o-\WW', strtotime($now));
    if ($variant === 'week') {
        // Saturday's roundup leaves out rounds Monday's already featured.
        global $wpdb;
        $monday = json_decode((string) $wpdb->get_var($wpdb->prepare('SELECT payload FROM ' . xf_table('ig_queue') . ' WHERE ref_key = %s', "roundup:funding:$week")), true);
        $seen = (array) ($monday['rounds'] ?? []);
        $rounds = array_values(array_filter($rounds, function ($r) use ($seen) { return !in_array($r->ID, $seen, true); }));
    }
    $items = [];
    $add = function ($kind, $post) use (&$items) {
        if ($kind === 'round') {
            $amount = get_post_meta($post->ID, '_xf_amount_display', true) ?: 'Undisclosed amount';
            $round = get_post_meta($post->ID, '_xf_round', true);
            $lead = get_post_meta($post->ID, '_xf_lead_investor', true);
            $items[] = ['id' => $post->ID, 'kicker' => 'FUNDING', 'title' => get_post_meta($post->ID, '_xf_company', true) ?: get_the_title($post), 'lines' => array_values(array_filter([$round ? "$amount · $round" : $amount, $lead ? "Led by $lead" : '', get_post_meta($post->ID, '_xf_sector', true)])), 'accent' => $amount, 'source' => xf_ig_host_name(get_post_meta($post->ID, '_xf_source_url', true)) ?: 'Funding tracker'];
        } elseif ($kind === 'launch') {
            $votes = (int) get_post_meta($post->ID, '_xf_votes', true);
            $items[] = ['kicker' => 'LAUNCH', 'title' => get_the_title($post), 'lines' => array_values(array_filter([xf_ig_words(get_post_meta($post->ID, '_xf_tagline', true), 16), $votes ? number_format($votes) . ' upvotes on Product Hunt' : ''])), 'accent' => $votes ? number_format($votes) : '', 'source' => 'producthunt.com'];
        } else {
            $start = get_post_meta($post->ID, '_xf_start', true);
            $where = get_post_meta($post->ID, '_xf_venue', true) ?: get_post_meta($post->ID, '_xf_city', true);
            $items[] = ['kicker' => 'UPCOMING EVENT', 'title' => get_the_title($post), 'lines' => array_values(array_filter([$start ? get_date_from_gmt($start, 'D, j M Y') : '', $where])), 'accent' => '', 'source' => xf_ig_host_name(get_post_meta($post->ID, '_xf_url', true)) ?: 'Event listing'];
        }
        // Logo tile: the startup's own logo (rounds: the listing with the company's name), else a credited featured image.
        $sid = $kind === 'launch' ? $post->ID : ($kind === 'round' ? xf_ig_startup_by_name($items[count($items) - 1]['title']) : 0);
        $items[count($items) - 1]['logo'] = ($sid ? xf_ig_logo_spec($sid) : null) ?: xf_ig_featured_spec($post->ID);
    };
    $plan = $variant === 'funding'
        ? [['round', $rounds, 4], ['launch', $launches, 4]]
        : [['round', $rounds, 2], ['launch', $launches, 1], ['event', $events, 2], ['launch', array_slice($launches, 1), 4], ['round', array_slice($rounds, 2), 4]];
    foreach ($plan as [$kind, $posts, $cap]) {
        $taken = 0;
        foreach ($posts as $post) {
            if (count($items) >= 4 || $taken >= $cap) {
                break;
            }
            $add($kind, $post);
            $taken++;
        }
    }
    if (count($items) < 3) {
        return null;
    }
    $only_rounds = !array_filter($items, function ($i) { return $i['kicker'] !== 'FUNDING'; });
    $n = count($items);
    $headline = $only_rounds ? "$n funding rounds this week" : "This week in startups: $n picks";
    $url = home_url($only_rounds ? '/funding-tracker/' : '/');
    $slides = [['type' => 'hook', 'stat' => (string) $n, 'headline' => $only_rounds ? 'funding rounds this week' : 'startup stories this week', 'accent' => '', 'sub' => 'Week of ' . wp_date('j M', strtotime($now) - 6 * DAY_IN_SECONDS) . '. One per slide, swipe.', 'source' => '100xfounder.com']];
    foreach ($items as $i => $item) {
        $slides[] = ['type' => 'item', 'num' => $i + 1] + $item;
    }
    $slides[] = ['type' => 'cta', 'headline' => 'Every round, launch and event: link in bio', 'accent' => 'link in bio', 'url' => xf_ig_short_url($url), 'note' => 'Each item links to its source on our site.', 'source' => '100xfounder.com'];
    $numbered = [];
    foreach ($items as $k => $i) {
        $numbered[] = ($k + 1) . '. ' . $i['title'] . ($i['lines'] ? ': ' . $i['lines'][0] : '');
    }
    $caption = xf_ig_caption(
        $headline . '.',
        [implode("\n", $numbered)],
        '',
        'Sources for every item',
        $url,
        'Which of these would you back?',
        ['#100xfounder', '#indianstartups', '#startupfunding', '#startups', '#weeklyroundup', '#WeeklyRoundup100x']
    );
    return xf_ig_queue('roundup', "roundup:$variant:$week", "Weekly roundup ($variant), $week", $caption, $slides, ['variant' => $variant, 'week' => $week, 'url' => $url, 'rounds' => array_values(array_filter(array_map(function ($i) { return $i['kicker'] === 'FUNDING' ? $i['id'] : 0; }, $items)))]);
}

/* ---- Calendar ---- */

/** The playbook's weekly calendar (IST): ISO weekday => [time => slot]. */
function xf_ig_calendar() {
    return [
        1 => ['09:30' => 'roundup_funding', '19:30' => 'ai_tip'],
        2 => ['09:30' => 'founder_story', '19:30' => 'launch'],
        3 => ['09:30' => 'news_card', '19:30' => 'founder_story'],
        4 => ['09:30' => 'founder_story', '19:30' => 'launch'],
        5 => ['09:30' => 'news_card', '19:30' => 'ai_tip'],
        6 => ['09:30' => 'roundup_week'],
        7 => ['09:30' => 'founder_story_best'],
    ];
}

/** Picks and queues new content for one slot; returns the queue id or null. */
function xf_ig_fill_slot($slot, $now = 'now') {
    global $wpdb;
    switch ($slot) {
        case 'roundup_funding':
        case 'roundup_week':
            return xf_ig_roundup(substr($slot, 8), $now);
        case 'launch':
            $id = (int) $wpdb->get_var('SELECT id FROM ' . xf_table('ig_queue') . " WHERE kind = 'daily_digest' AND status = 'ready' AND planned_at IS NULL ORDER BY created_at DESC LIMIT 1");
            if (!$id && ($d = xf_queue_daily_digest(1))) {
                $id = (int) $d['item'];
            }
            return $id ?: null;
        case 'news_card':
            $done = xf_ig_featured_ids('news_card:post:');
            $ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 30, 'fields' => 'ids', 'post__not_in' => $done ?: [0], 'category_name' => implode(',', xf_ig_news_category_slugs()), 'date_query' => [['after' => '21 days ago']]]);
            foreach ($ids as $id) {
                if ($q = xf_ig_news_card($id)) {
                    return $q;
                }
            }
            return null;
        case 'ai_tip':
            $done = xf_ig_featured_ids('ai_tip:post:');
            $ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 40, 'fields' => 'ids', 'post__not_in' => $done ?: [0], 's' => 'best AI', 'orderby' => 'date', 'order' => 'DESC']);
            foreach ($ids as $id) {
                if ($q = xf_ig_ai_tip($id)) {
                    return $q;
                }
            }
            return null;
        case 'founder_story':
        case 'founder_story_best':
            $done_sp = xf_ig_featured_ids('founder_story:spotlight:');
            if ($slot === 'founder_story') {
                foreach (get_posts(['post_type' => 'xf_spotlight', 'post_status' => 'publish', 'posts_per_page' => 10, 'fields' => 'ids', 'post__not_in' => $done_sp ?: [0]]) as $id) {
                    if ($q = xf_ig_founder_story_spotlight($id)) {
                        return $q;
                    }
                }
            }
            $done = xf_ig_featured_ids('founder_story:startup:');
            $ids = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 50, 'fields' => 'ids', 'post__not_in' => $done ?: [0], 'meta_key' => '_xf_profile', 'orderby' => 'modified', 'order' => 'DESC']);
            if ($slot === 'founder_story_best') {
                // Best of the week: the profile with the most Product Hunt votes.
                usort($ids, function ($a, $b) { return ((int) (xf_startup_profile($b)['ph']['votes'] ?? 0)) <=> ((int) (xf_startup_profile($a)['ph']['votes'] ?? 0)); });
            }
            foreach ($ids as $id) {
                if ($q = xf_ig_founder_story_startup($id)) {
                    return $q;
                }
            }
            return null;
    }
    return null;
}

/** Queues the IST day's calendar slots. Safe to re-run: a filled slot is skipped. */
function xf_ig_run_calendar($date = null) {
    global $wpdb;
    $tz = new DateTimeZone('Asia/Kolkata');
    $day = new DateTimeImmutable($date ?: 'now', $tz);
    $table = xf_table('ig_queue');
    $out = [];
    foreach (xf_ig_calendar()[(int) $day->format('N')] ?? [] as $time => $slot) {
        [$h, $i] = array_map('intval', explode(':', $time));
        $when = $day->setTime($h, $i)->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        if ($wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE planned_at = %s", $when))) {
            $out[$time] = 'already filled';
            continue;
        }
        $id = xf_ig_fill_slot($slot, $day->setTime($h, $i)->format('c'));
        if ($id) {
            $wpdb->update($table, ['planned_at' => $when], ['id' => $id]);
        }
        $out[$time] = $slot . ': ' . ($id ? "item $id" : 'nothing new to feature');
    }
    update_option('xf_ig_last_calendar', ['at' => time(), 'day' => $day->format('Y-m-d'), 'slots' => $out], false);
    return $out;
}

/** Daily at 00:05 IST, so both of the day's slots are queued before 09:30. */
add_action('init', function () {
    if (!wp_next_scheduled('xf_ig_calendar')) {
        $next = strtotime('today 18:35 UTC');
        wp_schedule_event($next < time() ? $next + DAY_IN_SECONDS : $next, 'daily', 'xf_ig_calendar');
    }
});
add_action('xf_ig_calendar', function () {
    xf_ig_run_calendar();
});

/* ---- Rendering ---- */

function xf_ig_font($style, $text = '') {
    // The bundled Inter and Geist Mono are Latin subsets; anything outside falls back to Noto Sans.
    if ($text !== '' && preg_match('/[^\x{0000}-\x{00FF}\x{2000}-\x{206F}\x{20AC}\x{2122}\x{0152}\x{0153}]/u', $text)) {
        return xf_font($style === 'bold');
    }
    $file = ['bold' => 'Inter-Bold', 'regular' => 'Inter-Regular', 'mono' => 'GeistMono-Medium'][$style] ?? 'Inter-Regular';
    return XF_DIR . "assets/fonts/$file.ttf";
}

/** Slide-safe text: the rupee sign isn't in the bundled subset. */
function xf_ig_slide_text($text) {
    return trim(preg_replace('/\s+/u', ' ', str_replace(['₹', '→'], ['Rs ', '->'], (string) $text)));
}

function xf_ig_width($size, $font, $text) {
    $b = imagettfbbox($size, 0, $font, $text);
    return $b[2] - $b[0];
}

/** Largest size between $max and $min at which $text wraps into $max_lines; returns [size, lines]. */
function xf_ig_fit($text, $style, $max, $min, $width, $max_lines) {
    $width -= 8; // glyph overhang beyond the measured box
    $text = xf_ig_slide_text($text);
    $font = xf_ig_font($style, $text);
    for ($size = $max; $size >= $min; $size -= 2) {
        $lines = xf_wrap_text($text, $size, $font, $width, 99);
        $widest = max(array_map(function ($l) use ($size, $font) { return xf_ig_width($size, $font, $l); }, $lines ?: ['']));
        if (count($lines) <= $max_lines && $widest <= $width) {
            return [$size, $lines, $font];
        }
    }
    $lines = xf_wrap_text($text, $min, $font, $width, $max_lines);
    foreach ($lines as &$line) {
        // A single unbreakable word (a long URL) is cut by characters.
        while (mb_strlen($line) > 4 && xf_ig_width($min, $font, $line) > $width) {
            $line = mb_substr(rtrim($line, '…'), 0, -2) . '…';
        }
    }
    unset($line);
    return [$min, $lines, $font];
}

/** Draws fitted text word by word, colouring words of $accent; returns the y below it. */
function xf_ig_draw($img, $text, $style, $max, $min, $x, $y, $width, $max_lines, $color, $accent = '', $accent_color = null, $lh = 1.22) {
    [$size, $lines, $font] = xf_ig_fit($text, $style, $max, $min, $width, $max_lines);
    $norm = function ($w) { return mb_strtolower(trim($w, " \t.,:;!?()\"'“”‘’…")); };
    $marks = $accent !== '' ? array_filter(array_map($norm, preg_split('/\s+/u', xf_ig_slide_text($accent)))) : [];
    foreach ($lines as $line) {
        $y += (int) ($size * $lh);
        $words = explode(' ', $line);
        $prefix = '';
        foreach ($words as $w) {
            $prefix = $prefix === '' ? $w : "$prefix $w";
            $wx = $x + xf_ig_width($size, $font, $prefix) - xf_ig_width($size, $font, $w);
            $c = ($marks && $accent_color !== null && in_array($norm($w), $marks, true)) ? $accent_color : $color;
            imagettftext($img, $size, 0, $wx, $y, $c, $font, $w);
        }
    }
    return $y + (int) ($size * ($lh - 1) * 2);
}

/** Horizontal hairline in the brand gradient (#7c5cff → #b07cff → #7c8cff → #6a7bff). */
function xf_ig_gradient_line($img, $x1, $x2, $y, $h = 4) {
    $stops = [[124, 92, 255], [176, 124, 255], [124, 140, 255], [106, 123, 255]];
    $span = max(1, $x2 - $x1);
    for ($x = $x1; $x <= $x2; $x++) {
        $t = ($x - $x1) / $span * 3;
        $k = min(2, (int) floor($t));
        $f = $t - $k;
        $c = imagecolorallocate($img, ...array_map(function ($a, $b) use ($f) { return (int) round($a + ($b - $a) * $f); }, $stops[$k], $stops[$k + 1]));
        imagefilledrectangle($img, $x, $y, $x, $y + $h - 1, $c);
    }
}

/** Darkens rows $y1..$y2 of the slide with the background colour, opacity easing from $from to $to. */
function xf_ig_shade($img, $y1, $y2, $from, $to) {
    for ($y = $y1; $y < $y2; $y += 6) {
        $t = ($y - $y1) / max(1, $y2 - $y1);
        $alpha = (int) round(127 * (1 - ($from + ($to - $from) * $t)));
        imagefilledrectangle($img, 0, $y, XF_SLIDE_W, min($y2, $y + 5), imagecolorallocatealpha($img, 11, 11, 12, max(0, min(127, $alpha))));
    }
}

/**
 * The 1080×1350 slide: background (flat, a full-bleed image under a dark overlay, or a split
 * image on the top 55%), then the fixed frame: series label, slide number, site, source and image credit.
 */
function xf_ig_canvas($kind, $n, $total, array $s) {
    $img = imagecreatetruecolor(XF_SLIDE_W, XF_SLIDE_H);
    imagealphablending($img, true);
    $c = [
        'bg' => imagecolorallocate($img, 11, 11, 12),
        'text' => imagecolorallocate($img, 242, 242, 239),
        'accent' => imagecolorallocate($img, 176, 124, 255),
        'muted' => imagecolorallocate($img, 140, 140, 134),
        'panel' => imagecolorallocate($img, 24, 24, 27),
        'credit' => imagecolorallocate($img, 196, 196, 190),
    ];
    imagefilledrectangle($img, 0, 0, XF_SLIDE_W, XF_SLIDE_H, $c['bg']);
    $credits = [];
    $layout = 'flat';
    if (!empty($s['bg']['src']) && ($bg = xf_ig_cached_image($s['bg']['src'], XF_SLIDE_W, XF_SLIDE_H))) {
        imagecopy($img, $bg, 0, 0, 0, 0, XF_SLIDE_W, XF_SLIDE_H);
        imagedestroy($bg);
        xf_ig_shade($img, 0, XF_SLIDE_H, 0.68, 0.92);
        $credits[] = 'Image: ' . $s['bg']['credit'];
        $layout = 'bg';
    } elseif (!empty($s['split']['src']) && ($sp = xf_ig_cached_image($s['split']['src'], XF_SLIDE_W, XF_IG_SPLIT_H - XF_IG_SPLIT_TOP))) {
        imagecopy($img, $sp, 0, XF_IG_SPLIT_TOP, 0, 0, XF_SLIDE_W, XF_IG_SPLIT_H - XF_IG_SPLIT_TOP);
        imagedestroy($sp);
        xf_ig_shade($img, XF_IG_SPLIT_TOP, XF_IG_SPLIT_TOP + 50, 1, 0);
        xf_ig_shade($img, XF_IG_SPLIT_H - 140, XF_IG_SPLIT_H, 0, 1);
        $credits[] = 'Image: ' . $s['split']['credit'];
        $layout = 'split';
    }
    $m = XF_IG_MARGIN;
    $mono = xf_ig_font('mono');
    imagettftext($img, 24, 0, $m, 112, $c['accent'], $mono, xf_ig_series($kind)[0]);
    $counter = sprintf('%02d/%02d', $n + 1, $total);
    imagettftext($img, 24, 0, XF_SLIDE_W - $m - xf_ig_width(24, $mono, $counter), 112, $c['text'], $mono, $counter);
    xf_ig_gradient_line($img, $m, XF_SLIDE_W - $m, 146, 3);
    imagettftext($img, 22, 0, $m, XF_SLIDE_H - 76, $c['text'], $mono, '100xfounder.com');
    $right = function ($text, $size, $y, $max, $color) use ($img, $m) {
        $text = xf_ig_slide_text($text);
        $font = xf_ig_font('mono', $text);
        while (mb_strlen($text) > 12 && xf_ig_width($size, $font, $text) > $max) {
            $text = rtrim(mb_substr(rtrim($text, '…'), 0, -1)) . '…';
        }
        imagettftext($img, $size, 0, XF_SLIDE_W - $m - xf_ig_width($size, $font, $text), $y, $color, $font, $text);
    };
    if (($s['source'] ?? '') !== '') {
        $right('Source: ' . $s['source'], 22, XF_SLIDE_H - 76, 520, $c['muted']);
    }
    $logo = null;
    if (!empty($s['logo']['src']) && ($logo = xf_ig_cached_image($s['logo']['src'], XF_IG_LOGO, XF_IG_LOGO))) {
        $credits[] = $s['logo']['credit'];
    }
    if ($credits) {
        $right(implode(' · ', $credits), 18, XF_SLIDE_H - 118, XF_SLIDE_W - 2 * $m, $c['credit']);
    }
    return [$img, $c, $layout, $logo];
}

/** Draws one slide of a template item; the content block is centred in the space the images leave. */
function xf_ig_render_slide($kind, array $payload, $n) {
    $slides = (array) ($payload['slides'] ?? []);
    if (!$slides) {
        return null;
    }
    $total = count($slides);
    $n = min(max(0, (int) $n), $total - 1);
    $s = $slides[$n];
    [$img, $c, $layout, $logo] = xf_ig_canvas($kind, $n, $total, $s);
    $type = $s['type'] ?? '';
    [$top, $bottom] = [180, $layout === 'bg' ? 1150 : 1190];
    if ($layout === 'split') {
        $top = XF_IG_SPLIT_H + ($logo ? 100 : 20);
    }
    if ($logo) {
        // Rounded logo tile: top-left on hook/CTA/tool, over the image edge on split slides, top-right on roundup items.
        [$lx, $ly] = $type === 'item' ? [XF_SLIDE_W - XF_IG_MARGIN - XF_IG_LOGO, 230] : [XF_IG_MARGIN, $layout === 'split' ? XF_IG_SPLIT_H - 70 : 200];
        imagefilledrectangle($img, $lx - 3, $ly - 3, $lx + XF_IG_LOGO + 2, $ly + XF_IG_LOGO + 2, $c['bg']);
        xf_paste_rounded($img, $logo, $lx, $ly, XF_IG_LOGO, 0.22);
        imagedestroy($logo);
        if ($type !== 'item' && $layout !== 'split') {
            $top = 380;
        }
    }
    $compact = $layout === 'split';
    // Measure on a scratch canvas first (block starts near y = 250), then draw for real, centred.
    $scratch = imagecreatetruecolor(XF_SLIDE_W, XF_SLIDE_H);
    $end = xf_ig_draw_body($scratch, $c, $s, 0, $compact);
    imagedestroy($scratch);
    $offset = max($top - 230, (int) (($top + $bottom) / 2 - ($end - 250) / 2) - 250);
    xf_ig_draw_body($img, $c, $s, $offset, $compact);
    return $img;
}

/** Draws a slide's content with every y shifted by $o; returns the bottom y. */
function xf_ig_draw_body($img, array $c, array $s, $o, $compact = false) {
    $m = XF_IG_MARGIN;
    $w = XF_SLIDE_W - 2 * $m;
    $mono = xf_ig_font('mono');
    $kicker = function ($text, $y) use ($img, $c, $m) {
        [$size, $lines, $font] = xf_ig_fit(mb_strtoupper((string) $text), 'mono', 30, 22, XF_SLIDE_W - 2 * $m, 1);
        imagettftext($img, $size, 0, $m, $y, $c['accent'], $font, $lines[0] ?? '');
        return $y;
    };
    $y = 250 + $o;
    switch ($s['type'] ?? '') {
        case 'hook':
            $y = 300 + $o;
            if (($s['stat'] ?? '') !== '') {
                $y = xf_ig_draw($img, $s['stat'], 'bold', 220, 80, $m - 6, $y - 40, $w, 1, $c['accent'], '', null, 1.0);
                xf_ig_gradient_line($img, $m, $m + 160, $y + 34, 4);
                $y += 60;
            }
            $y = xf_ig_draw($img, $s['headline'], 'bold', 84, 52, $m, $y, $w, 2, $c['text'], (string) ($s['accent'] ?? ''), $c['accent'], 1.18);
            if (($s['sub'] ?? '') !== '') {
                $y = xf_ig_draw($img, $s['sub'], 'regular', 40, 30, $m, $y + 20, $w, 4, $c['muted'], '', null, 1.35);
            }
            break;

        case 'headline':
            $kicker($s['kicker'], 300 + $o);
            $y = xf_ig_draw($img, $s['headline'], 'bold', 96, 56, $m, 350 + $o, $w, 3, $c['text'], (string) ($s['accent'] ?? ''), $c['accent'], 1.16);
            xf_ig_gradient_line($img, $m, $m + 160, $y + 30, 4);
            $y = xf_ig_draw($img, $s['sub'], 'mono', 30, 24, $m, $y + 50, $w, 1, $c['muted']);
            break;

        case 'idea':
            $kicker($s['kicker'], 300 + $o);
            $y = $compact
                ? xf_ig_draw($img, $s['body'], 'bold', 50, 30, $m, 330 + $o, $w, 5, $c['text'], '', null, 1.22)
                : xf_ig_draw($img, $s['body'], 'bold', 64, 40, $m, 360 + $o, $w, 8, $c['text'], '', null, 1.25);
            break;

        case 'quote':
            $kicker($s['kicker'], 300 + $o);
            $y = xf_ig_draw($img, '“' . $s['body'] . '”', 'bold', 84, 48, $m, 370 + $o, $w, 6, $c['text'], '', null, 1.18);
            if (!empty($s['by'])) {
                $y = xf_ig_draw($img, '— ' . $s['by'], 'regular', 36, 28, $m, $y + 20, $w, 1, $c['muted']);
            }
            break;

        case 'tool':
            $kicker($s['kicker'], 300 + $o);
            $y = xf_ig_draw($img, $s['name'], 'bold', $compact ? 84 : 120, 48, $m, 340 + $o, $w, $compact ? 1 : 2, $c['accent'], '', null, 1.1);
            xf_ig_gradient_line($img, $m, $m + 160, $y + 20, 4);
            $y = xf_ig_draw($img, $s['body'], 'regular', $compact ? 40 : 52, 28, $m, $y + 50, $w, $compact ? 3 : 5, $c['text'], '', null, 1.3);
            break;

        case 'bullets':
            $kicker($s['kicker'], 280 + $o);
            $items = array_values((array) $s['items']);
            // Shrink all items together until they fit between the kicker and the footer.
            for ($size = 46; $size >= 28; $size -= 2) {
                $h = 0;
                foreach ($items as $it) {
                    [, $lines] = xf_ig_fit($it, 'regular', $size, $size, $w - 90, 99);
                    $h += count($lines) * (int) ($size * 1.32) + 56;
                }
                if ($h <= 860) {
                    break;
                }
            }
            $y = 330 + $o;
            foreach ($items as $i => $it) {
                imagettftext($img, 30, 0, $m, $y + (int) ($size * 1.1), $c['accent'], $mono, sprintf('%02d', $i + 1));
                $y = xf_ig_draw($img, $it, 'regular', $size, $size, $m + 90, $y, $w - 90, 7, $c['text'], '', null, 1.32) + 56;
            }
            $y -= 56;
            break;

        case 'why':
            $kicker($s['kicker'], 300 + $o);
            $y = xf_ig_draw($img, $s['body'], 'bold', 64, 38, $m, 360 + $o, $w, 8, $c['text'], '', null, 1.25);
            xf_ig_gradient_line($img, $m, $m + 160, $y + 30, 4);
            $y = xf_ig_draw($img, 'Full story: link in bio · ' . $s['url'], 'mono', 28, 18, $m, $y + 50, $w, 2, $c['muted']);
            break;

        case 'item':
            imagettftext($img, 120, 0, $m - 6, 380 + $o, $c['accent'], xf_ig_font('bold'), '#' . (int) $s['num']);
            $kicker($s['kicker'], 470 + $o);
            $y = xf_ig_draw($img, $s['title'], 'bold', 88, 52, $m, 500 + $o, $w, 2, $c['text'], '', null, 1.16);
            foreach ((array) $s['lines'] as $i => $line) {
                $y = xf_ig_draw($img, $line, 'regular', 44, 30, $m, $y + 16, $w, 3, $i === 0 ? $c['text'] : $c['muted'], (string) ($s['accent'] ?? ''), $c['accent'], 1.3);
            }
            break;

        case 'cta':
            $y = xf_ig_draw($img, $s['headline'], 'bold', 92, 56, $m, 260 + $o, $w, 3, $c['text'], (string) ($s['accent'] ?? ''), $c['accent'], 1.16);
            [$size, $lines, $font] = xf_ig_fit($s['url'], 'mono', 32, 18, $w - 60, 1);
            $bw = min($w, xf_ig_width($size, $font, $lines[0] ?? '') + 60);
            imagefilledrectangle($img, $m, $y + 50, $m + $bw, $y + 140, $c['panel']);
            imagerectangle($img, $m, $y + 50, $m + $bw, $y + 140, $c['accent']);
            imagettftext($img, $size, 0, $m + 30, $y + 95 + (int) ($size / 2.6), $c['text'], $font, $lines[0] ?? '');
            $y = xf_ig_draw($img, $s['note'] ?? '', 'regular', 34, 24, $m, $y + 180, $w, 4, $c['muted'], '', null, 1.35);
            break;
    }
    return $y;
}

/* ---- Admin: zip download, run-now (the queue itself is in instagram-admin.php) ---- */

function xf_ig_planned_label($utc) {
    if (!$utc) {
        return 'not scheduled';
    }
    return (new DateTimeImmutable($utc, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('Asia/Kolkata'))->format('D j M, H:i') . ' IST';
}

add_action('admin_post_xf_ig_calendar_now', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_calendar_now')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $out = xf_ig_run_calendar();
    set_transient('xf_notice_' . get_current_user_id(), 'Instagram calendar: ' . ($out ? implode('; ', array_map(function ($k, $v) { return "$k $v"; }, array_keys($out), $out)) : 'no slots today'), 60);
    wp_safe_redirect(xf_ig_tab_url('queue'));
    exit;
});

add_action('admin_post_xf_ig_zip', function () {
    global $wpdb;
    $id = isset($_GET['id']) ? absint($_GET['id']) : 0;
    if (!current_user_can('manage_options') || !check_admin_referer('xf_ig_zip_' . $id) || !class_exists('ZipArchive')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    $item = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('ig_queue') . ' WHERE id = %d', $id));
    if (!$item) {
        wp_die('Not found', '', ['response' => 404]);
    }
    $file = wp_tempnam('xf-ig-' . $id . '.zip');
    $zip = new ZipArchive();
    $zip->open($file, ZipArchive::OVERWRITE);
    for ($n = 0; $n < (int) $item->slide_count; $n++) {
        $img = xf_ig_item_image($item, $n);
        if ($img) {
            ob_start();
            imagepng($img);
            $zip->addFromString(sprintf('100xfounder-%d-%02d.png', $id, $n + 1), ob_get_clean());
            imagedestroy($img);
        }
    }
    $zip->addFromString('caption.txt', $item->caption);
    $zip->close();
    nocache_headers();
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="100xfounder-instagram-' . $id . '.zip"');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    @unlink($file);
    exit;
});
