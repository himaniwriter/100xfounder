<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Front-end weight and phone scrolling.
 *
 * - Touch devices: no backdrop blur on the sticky header, and the endlessly
 *   repainting gradient/scroll-linked animations are switched off. Those are
 *   what made scrolling stutter on phones. Desktop keeps the full design.
 * - Google Analytics (~530 KB) loads after the visitor's first interaction or
 *   after 4 seconds, instead of competing with the page itself.
 * - WordPress's emoji script and styles are removed (the site doesn't use them).
 * - Brand photos get a 800px version for phones via srcset.
 * ---------------------------------------------------------------------- */

add_action('wp_enqueue_scripts', function () {
    $css = '@media (hover:none),(pointer:coarse),(max-width:860px){'
        . '.site-header{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(11,11,12,.97)!important}'
        . '.ac,.hl,.prog,.ticker .label,.dot{animation:none!important}'
        . '.rv{animation:none!important;opacity:1!important;transform:none!important}'
        . '.mq,.strip-track{will-change:transform}'
        . 'body{background-image:none!important}'
        . '}';
    foreach (['xft', 'xf-style'] as $handle) {
        if (wp_style_is($handle, 'enqueued')) {
            wp_add_inline_style($handle, $css);
            return;
        }
    }
}, 100);

/* ---- Emoji script/styles off ---- */
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('admin_print_styles', 'print_emoji_styles');
add_filter('emoji_svg_url', '__return_false');

/** A smaller copy of a bundled JPEG (made once, on first use), or '' if it can't be made. */
function xf_brand_resized_url($file, $width) {
    $src = XF_DIR . 'assets/brand/' . $file;
    $name = preg_replace('/\.jpg$/', '-' . (int) $width . '.jpg', $file);
    $dir = trailingslashit(wp_upload_dir()['basedir']) . 'xf-brand/';
    $dest = $dir . $name;
    if (!file_exists($dest) && is_readable($src)) {
        wp_mkdir_p($dir);
        $editor = wp_get_image_editor($src);
        if (is_wp_error($editor) || is_wp_error($editor->resize($width, null)) || is_wp_error($editor->save($dest, 'image/jpeg'))) {
            return '';
        }
    }
    return file_exists($dest) ? trailingslashit(wp_upload_dir()['baseurl']) . 'xf-brand/' . $name : '';
}
