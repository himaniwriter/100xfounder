<?php
if (!defined('ABSPATH')) {
    exit;
}

const XF_SLIDE_W = 1080;
const XF_SLIDE_H = 1350;
const XF_DIGEST_SIZE = 5;

function xf_ig_hashtags() {
    return '#startups #producthunt #founders #buildinpublic #indiehackers #saas #100xfounder';
}

function xf_ig_upsert($kind, $ref_key, $title, $caption, $slide_count, array $payload) {
    global $wpdb;
    $table = xf_table('ig_queue');
    $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE ref_key = %s", $ref_key));
    $data = [
        'title' => $title, 'caption' => $caption, 'slide_count' => $slide_count,
        'payload' => wp_json_encode($payload), 'updated_at' => xf_now(),
    ];
    if ($existing) {
        // Refresh content but keep the posted/skipped status.
        $wpdb->update($table, $data, ['id' => $existing]);
        return (int) $existing;
    }
    $wpdb->insert($table, $data + ['kind' => $kind, 'ref_key' => $ref_key, 'status' => 'ready', 'created_at' => xf_now()]);
    return (int) $wpdb->insert_id;
}

/** Queues the "top launches" carousel for one Product Hunt day. */
function xf_queue_daily_digest($days_ago = 1) {
    $window = xf_ph_day_window($days_ago);
    $ids = get_posts([
        'post_type' => 'xf_startup',
        'posts_per_page' => XF_DIGEST_SIZE,
        'fields' => 'ids',
        'meta_key' => '_xf_votes',
        'orderby' => 'meta_value_num',
        'order' => 'DESC',
        'meta_query' => [['key' => '_xf_launch_day', 'value' => $window['label']]],
    ]);
    if (!$ids) {
        return null;
    }
    $date = wp_date('F j', strtotime($window['label'] . ' 12:00:00 UTC'));
    $lines = [];
    foreach ($ids as $i => $id) {
        $lines[] = ($i + 1) . '. ' . get_the_title($id) . ': ' . wp_trim_words((string) get_post_meta($id, '_xf_tagline', true), 14, '…');
    }
    $caption = implode("\n", array_merge(
        ['🚀 Top ' . count($ids) . " startup launches on Product Hunt, $date", ''],
        $lines,
        ['', 'Which one would you try? Tell us below 👇', '', 'Full list and links: ' . wp_parse_url(home_url(), PHP_URL_HOST) . '/launches (link in bio)', '', xf_ig_hashtags()]
    ));
    $item_id = xf_ig_upsert('daily_digest', 'digest:' . $window['label'], "Top launches, $date", $caption, count($ids) + 2, ['ids' => $ids, 'day' => $window['label']]);
    return ['item' => $item_id, 'slides' => count($ids) + 2];
}

function xf_queue_spotlight_instagram($spotlight_id) {
    $name = (string) get_post_meta($spotlight_id, '_xf_founder_name', true);
    $startup_id = (int) get_post_meta($spotlight_id, '_xf_startup_id', true);
    $product = get_the_title($startup_id);
    $handle = get_post_meta($spotlight_id, '_xf_instagram', true);
    $role = get_post_meta($spotlight_id, '_xf_role', true);
    $caption = implode("\n", [
        "✨ Founder spotlight: meet {$name}" . ($handle ? " (@{$handle})" : '') . ($role ? ", {$role}" : '') . " of {$product}.",
        '',
        '“' . wp_trim_words((string) get_post_meta($spotlight_id, '_xf_story_origin', true), 50, '…') . '”',
        '',
        $product . ': ' . get_post_meta($startup_id, '_xf_tagline', true),
        '',
        'Read the full story on ' . wp_parse_url(home_url(), PHP_URL_HOST) . ' (link in bio).',
        'Want to be featured? DM us.',
        '',
        '#founderstory ' . xf_ig_hashtags(),
    ]);
    return xf_ig_upsert('spotlight', 'spotlight:' . $spotlight_id, "Spotlight: $name ($product)", $caption, 4, ['spotlight' => $spotlight_id]);
}

/* -------------------------------------------------------------------------
 * Slide rendering with GD
 * ---------------------------------------------------------------------- */

function xf_font($bold = false) {
    return XF_DIR . 'assets/fonts/NotoSans-' . ($bold ? 'Bold' : 'Regular') . '.ttf';
}

/** Wraps text to a pixel width; returns lines, truncating with an ellipsis past $max_lines. */
function xf_wrap_text($text, $size, $font, $width, $max_lines) {
    $words = preg_split('/\s+/', trim(wp_strip_all_tags((string) $text)));
    $lines = [];
    $line = '';
    foreach ($words as $word) {
        $try = $line === '' ? $word : "$line $word";
        $box = imagettfbbox($size, 0, $font, $try);
        if ($box[2] - $box[0] > $width && $line !== '') {
            $lines[] = $line;
            $line = $word;
        } else {
            $line = $try;
        }
    }
    if ($line !== '') {
        $lines[] = $line;
    }
    if (count($lines) > $max_lines) {
        $lines = array_slice($lines, 0, $max_lines);
        $lines[$max_lines - 1] = rtrim($lines[$max_lines - 1], ' .,;:') . '…';
    }
    return $lines;
}

/** Draws wrapped text and returns the y coordinate below it. */
function xf_draw_text($img, $text, $size, $bold, $color, $x, $y, $width, $max_lines, $line_height = 1.3) {
    $font = xf_font($bold);
    foreach (xf_wrap_text($text, $size, $font, $width, $max_lines) as $line) {
        $y += (int) ($size * $line_height);
        imagettftext($img, $size, 0, $x, $y, $color, $font, $line);
    }
    return $y;
}

function xf_slide_canvas($index, $total) {
    $img = imagecreatetruecolor(XF_SLIDE_W, XF_SLIDE_H);
    imagealphablending($img, true);
    // Vertical gradient from deep indigo to near-black.
    for ($y = 0; $y < XF_SLIDE_H; $y++) {
        $t = min(1, $y / (XF_SLIDE_H * 0.6));
        $c = imagecolorallocate($img, (int) (30 * (1 - $t) + 5 * $t), (int) (27 * (1 - $t) + 5 * $t), (int) (75 * (1 - $t) + 5 * $t));
        imageline($img, 0, $y, XF_SLIDE_W, $y, $c);
    }
    $white = imagecolorallocate($img, 250, 250, 250);
    $muted = imagecolorallocate($img, 161, 161, 170);
    $accent = imagecolorallocate($img, 129, 140, 248);
    imagettftext($img, 28, 0, 80, 115, $white, xf_font(true), '100x');
    $box = imagettfbbox(28, 0, xf_font(true), '100x');
    imagettftext($img, 28, 0, 80 + $box[2] - $box[0], 115, $accent, xf_font(true), 'Founder');
    $counter = ($index + 1) . '/' . $total;
    $box = imagettfbbox(26, 0, xf_font(), $counter);
    imagettftext($img, 26, 0, XF_SLIDE_W - 80 - ($box[2] - $box[0]), 115, $muted, xf_font(), $counter);
    imagettftext($img, 24, 0, 80, XF_SLIDE_H - 80, $muted, xf_font(), wp_parse_url(home_url(), PHP_URL_HOST));
    return [$img, compact('white', 'muted', 'accent')];
}

/** Loads a remote or local image into GD, scaled and cropped to a square. */
function xf_load_square_image($source, $size) {
    if (!$source) {
        return null;
    }
    if (is_numeric($source)) {
        $path = get_attached_file((int) $source);
        $data = $path && file_exists($path) ? file_get_contents($path) : false;
    } else {
        $url = $source;
        if (strpos((string) wp_parse_url($url, PHP_URL_HOST), 'imgix.net') !== false) {
            $url = add_query_arg(['fm' => 'png', 'w' => $size, 'h' => $size, 'fit' => 'crop'], $url);
        }
        $response = wp_remote_get($url, ['timeout' => 10]);
        $data = is_wp_error($response) ? false : wp_remote_retrieve_body($response);
    }
    $src = $data ? @imagecreatefromstring($data) : false;
    if (!$src) {
        return null;
    }
    $w = imagesx($src);
    $h = imagesy($src);
    $side = min($w, $h);
    $dst = imagecreatetruecolor($size, $size);
    imagecopyresampled($dst, $src, 0, 0, (int) (($w - $side) / 2), (int) (($h - $side) / 2), $size, $size, $side, $side);
    imagedestroy($src);
    return $dst;
}

/** Copies $src onto $img with rounded corners (radius as a fraction of size; 0.5 = circle). */
function xf_paste_rounded($img, $src, $x, $y, $size, $radius_ratio) {
    $r = $size * $radius_ratio;
    for ($py = 0; $py < $size; $py++) {
        for ($px = 0; $px < $size; $px++) {
            $cx = $px < $r ? $r : ($px > $size - $r ? $size - $r : $px);
            $cy = $py < $r ? $r : ($py > $size - $r ? $size - $r : $py);
            if (($px - $cx) ** 2 + ($py - $cy) ** 2 <= $r * $r) {
                imagesetpixel($img, $x + $px, $y + $py, imagecolorat($src, $px, $py));
            }
        }
    }
}

function xf_draw_logo($img, $startup_id, $x, $y, $size) {
    $thumb_id = get_post_thumbnail_id($startup_id);
    $logo = xf_load_square_image($thumb_id ?: get_post_meta($startup_id, '_xf_thumbnail', true), $size);
    if ($logo) {
        xf_paste_rounded($img, $logo, $x, $y, $size, 0.2);
        imagedestroy($logo);
        return;
    }
    $bg = imagecolorallocate($img, 39, 39, 42);
    imagefilledrectangle($img, $x, $y, $x + $size, $y + $size, $bg);
    $white = imagecolorallocate($img, 250, 250, 250);
    $letter = mb_strtoupper(mb_substr(get_the_title($startup_id), 0, 1));
    $box = imagettfbbox($size / 2, 0, xf_font(true), $letter);
    imagettftext($img, (int) ($size / 2), 0, (int) ($x + ($size - ($box[2] - $box[0])) / 2), (int) ($y + $size * 0.72), $white, xf_font(true), $letter);
}

function xf_cta_slide($index, $total, $headline) {
    [$img, $c] = xf_slide_canvas($index, $total);
    $y = xf_draw_text($img, $headline, 70, true, $c['white'], 80, 480, 920, 3, 1.25);
    $y = xf_draw_text($img, 'Launching a startup? Get a free listing and founder spotlight.', 36, false, $c['muted'], 80, $y + 30, 920, 3, 1.4);
    $btn = imagecolorallocate($img, 129, 140, 248);
    $dark = imagecolorallocate($img, 5, 5, 5);
    $label = 'Link in bio → ' . wp_parse_url(home_url(), PHP_URL_HOST);
    $box = imagettfbbox(34, 0, xf_font(true), $label);
    imagefilledrectangle($img, 80, $y + 70, 80 + ($box[2] - $box[0]) + 80, $y + 170, $btn);
    imagettftext($img, 34, 0, 120, $y + 135, $dark, xf_font(true), $label);
    return $img;
}

function xf_render_digest_slide(array $payload, $n) {
    $ids = array_values(array_filter(array_map('intval', $payload['ids'] ?? []), function ($id) { return get_post_status($id) === 'publish'; }));
    if (!$ids) {
        return null;
    }
    $total = count($ids) + 2;
    $n = min($n, $total - 1);
    if ($n === 0) {
        [$img, $c] = xf_slide_canvas(0, $total);
        $date = strtoupper(wp_date('F j', strtotime($payload['day'] . ' 12:00:00 UTC')));
        imagettftext($img, 34, 0, 80, 470, $c['accent'], xf_font(true), $date);
        $y = xf_draw_text($img, 'Top ' . count($ids) . ' startup launches of the day', 96, true, $c['white'], 80, 500, 920, 4, 1.15);
        xf_draw_text($img, 'The best of Product Hunt, curated. Swipe →', 38, false, $c['muted'], 80, $y + 30, 920, 2);
        return $img;
    }
    if ($n === $total - 1) {
        return xf_cta_slide($n, $total, 'Follow for daily launches.');
    }
    $id = $ids[$n - 1];
    [$img, $c] = xf_slide_canvas($n, $total);
    imagettftext($img, 40, 0, 80, 330, $c['accent'], xf_font(true), '#' . $n);
    xf_draw_logo($img, $id, 80, 380, 200);
    $y = xf_draw_text($img, get_the_title($id), 84, true, $c['white'], 80, 610, 920, 2, 1.15);
    $y = xf_draw_text($img, (string) get_post_meta($id, '_xf_tagline', true), 46, false, $c['white'], 80, $y + 45, 920, 3, 1.35);
    $topics = (array) get_post_meta($id, '_xf_topics', true);
    $meta = (int) get_post_meta($id, '_xf_votes', true) . ' upvotes' . ($topics ? ' · ' . $topics[0] : '');
    xf_draw_text($img, $meta, 34, false, $c['muted'], 80, $y + 30, 920, 1);
    return $img;
}

function xf_render_spotlight_slide($spotlight_id, $n) {
    if (get_post_status($spotlight_id) !== 'publish') {
        return null;
    }
    $total = 4;
    $n = min($n, $total - 1);
    $name = (string) get_post_meta($spotlight_id, '_xf_founder_name', true);
    $startup_id = (int) get_post_meta($spotlight_id, '_xf_startup_id', true);
    $product = get_the_title($startup_id);
    if ($n === 0) {
        [$img, $c] = xf_slide_canvas(0, $total);
        imagettftext($img, 34, 0, 80, 300, $c['accent'], xf_font(true), 'FOUNDER SPOTLIGHT');
        $photo = xf_load_square_image(get_post_thumbnail_id($spotlight_id), 400);
        $y = 340;
        if ($photo) {
            xf_paste_rounded($img, $photo, 80, 350, 400, 0.5);
            imagedestroy($photo);
            $y = 780;
        }
        $y = xf_draw_text($img, $name, 88, true, $c['white'], 80, $y, 920, 2, 1.15);
        $role = get_post_meta($spotlight_id, '_xf_role', true);
        xf_draw_text($img, trim(($role ? "$role, " : '') . $product, ', '), 42, false, $c['muted'], 80, $y + 35, 920, 2);
        return $img;
    }
    if ($n === 3) {
        return xf_cta_slide($n, $total, 'Read ' . strtok($name, ' ') . "'s full story.");
    }
    $advice = (string) get_post_meta($spotlight_id, '_xf_story_advice', true);
    $heading = $n === 1 ? "Why $product?" : ($advice ? 'Advice for founders' : 'The problem');
    $body = $n === 1 ? get_post_meta($spotlight_id, '_xf_story_origin', true) : ($advice ?: get_post_meta($spotlight_id, '_xf_story_problem', true));
    [$img, $c] = xf_slide_canvas($n, $total);
    imagettftext($img, 40, 0, 80, 330, $c['accent'], xf_font(true), mb_strimwidth($heading, 0, 40, '…'));
    $y = xf_draw_text($img, '“' . $body . '”', 52, false, $c['white'], 80, 380, 920, 11, 1.4);
    xf_draw_text($img, '— ' . $name, 34, false, $c['muted'], 80, $y + 30, 920, 1);
    return $img;
}

/** Public PNG endpoint for queue items: /wp-json/xf/v1/slide?item=ID&n=0 */
add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/slide', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'args' => [
            'item' => ['required' => true, 'sanitize_callback' => 'absint'],
            'n' => ['default' => 0, 'sanitize_callback' => 'absint'],
        ],
        'callback' => function (WP_REST_Request $request) {
            global $wpdb;
            $item = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . xf_table('ig_queue') . ' WHERE id = %d', (int) $request['item']));
            if (!$item) {
                return new WP_Error('not_found', 'Not found', ['status' => 404]);
            }
            $payload = json_decode($item->payload, true) ?: [];
            $n = max(0, (int) $request['n']);
            $img = $item->kind === 'daily_digest'
                ? xf_render_digest_slide($payload, $n)
                : xf_render_spotlight_slide((int) ($payload['spotlight'] ?? 0), $n);
            if (!$img) {
                return new WP_Error('not_found', 'Not found', ['status' => 404]);
            }
            header('Content-Type: image/png');
            header('Cache-Control: public, max-age=3600');
            if (!empty($request['download'])) {
                header('Content-Disposition: attachment; filename="100xfounder-' . (int) $item->id . '-' . ($n + 1) . '.png"');
            }
            imagepng($img);
            imagedestroy($img);
            exit;
        },
    ]);
});

function xf_slide_url($item_id, $n, $download = false) {
    $args = ['item' => $item_id, 'n' => $n];
    if ($download) {
        $args['download'] = 1;
    }
    return add_query_arg($args, rest_url('xf/v1/slide'));
}
