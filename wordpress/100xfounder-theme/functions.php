<?php
/**
 * 100Xfounder theme. Presentation only: data comes from the 100xFounder plugin
 * when it's active, and every section hides itself when it has nothing real to show.
 */

if (!defined('ABSPATH')) {
    exit;
}

define('XFT_VERSION', '1.5.0');

require_once __DIR__ . '/inc-tabs.php';

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets']);
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
    add_theme_support('editor-styles');
    register_nav_menus(['primary' => 'Main menu', 'footer' => 'Footer: Company']);
    add_image_size('xft-card', 720, 480, true);
    add_image_size('xft-lead', 1280, 800, true);
});

add_action('wp_enqueue_scripts', function () {
    $uri = get_template_directory_uri();
    wp_enqueue_style('xft', $uri . '/assets/css/theme.css', [], XFT_VERSION);
    wp_enqueue_script('xft', $uri . '/assets/js/theme.js', [], XFT_VERSION, ['strategy' => 'defer', 'in_footer' => true]);
    if (get_query_var('xf_tool')) {
        wp_enqueue_script('xft-tools', $uri . '/assets/js/tools.js', [], XFT_VERSION, ['strategy' => 'defer', 'in_footer' => true]);
    }
    // The theme supplies its own fonts and footer links.
    wp_dequeue_style('wp-block-library-theme');
});

add_action('wp_head', function () {
    $uri = get_template_directory_uri();
    echo '<link rel="preload" href="' . esc_url($uri . '/assets/fonts/inter-400.woff2') . '" as="font" type="font/woff2" crossorigin>' . "\n";
    echo '<link rel="preload" href="' . esc_url($uri . '/assets/fonts/inter-600.woff2') . '" as="font" type="font/woff2" crossorigin>' . "\n";
    echo '<meta name="theme-color" content="#0b0b0c">' . "\n";
}, 1);

// The plugin's generic footer links bar isn't needed: this footer has them.
add_filter('xf_show_footer_links', '__return_false');

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */

function xft_plugin() {
    return function_exists('xf_get_setting');
}

function xft_page_url($key, $fallback_slug) {
    if (function_exists('xf_page_url')) {
        $pages = get_option('xf_pages', []);
        if (!empty($pages[$key]) && get_post_status($pages[$key]) === 'publish') {
            return get_permalink($pages[$key]);
        }
    }
    $page = get_page_by_path($fallback_slug);
    return $page ? get_permalink($page) : home_url('/' . $fallback_slug . '/');
}

function xft_page_exists($slug) {
    $page = get_page_by_path($slug);
    return $page && $page->post_status === 'publish';
}

function xft_age($post) {
    $ts = get_post_time('U', true, $post);
    return function_exists('xf_short_age') ? xf_short_age($ts) : human_time_diff($ts);
}

function xft_read_time($post) {
    $words = str_word_count(wp_strip_all_tags((string) get_post_field('post_content', $post)));
    return max(1, (int) ceil($words / 220)) . ' min read';
}

function xft_category($post) {
    foreach (get_the_category(is_object($post) ? $post->ID : $post) as $cat) {
        if ($cat->slug !== 'uncategorized') {
            return $cat;
        }
    }
    return null;
}

function xft_cat_name($post) {
    $cat = xft_category($post);
    return $cat ? $cat->name : 'News';
}

function xft_author_name($post) {
    return get_the_author_meta('display_name', (int) get_post_field('post_author', $post)) ?: get_bloginfo('name');
}

function xft_initials($name) {
    if (preg_match('/^(\d{1,3})/', trim((string) $name), $m)) {
        return $m[1];
    }
    $parts = preg_split('/\s+/', trim(preg_replace('/[^\p{L}\p{N}\s]/u', '', (string) $name)));
    $letters = mb_substr($parts[0] ?? '', 0, 1) . mb_substr($parts[1] ?? '', 0, 1);
    return mb_strtoupper($letters ?: '100');
}

/** Image in the design's frame; a dotted placeholder when the post has none. */
function xft_image($post, $ratio = '16x10', $size = 'xft-card', $eager = false) {
    if (has_post_thumbnail($post)) {
        $img = get_the_post_thumbnail($post, $size, ['loading' => $eager ? 'eager' : 'lazy', 'alt' => esc_attr(wp_strip_all_tags(get_the_title($post)))]);
        return '<span class="ph ph-' . esc_attr($ratio) . '">' . $img . '</span>';
    }
    // No featured image: use the shared, credited photo for this section rather than an empty frame.
    if (function_exists('xf_brand_photo_html')) {
        return xf_brand_photo_html(xft_photo_slot($post), $ratio, $eager);
    }
    return '<span class="ph ph-' . esc_attr($ratio) . '"></span>';
}

/** Which shared photograph suits a post, from its category. */
function xft_photo_slot($post) {
    $map = ['funding' => 'funding', 'startup-news' => 'news', 'ai-news' => 'news', 'in-depth' => 'news',
            'careers-salary' => 'guides', 'global' => 'guides', 'reports' => 'tools', 'manufacturers' => 'funding',
            'founder-stories' => 'launches', 'saas' => 'launches'];
    foreach ((array) get_the_category(is_object($post) ? $post->ID : (int) $post) as $cat) {
        if (isset($map[$cat->slug])) {
            return $map[$cat->slug];
        }
    }
    return 'default';
}

function xft_query_posts(array $args) {
    return get_posts(array_merge(['post_type' => 'post', 'post_status' => 'publish', 'ignore_sticky_posts' => true, 'no_found_rows' => true], $args));
}

/** The lead story: newest sticky post, else the newest post with an image. */
function xft_lead_post() {
    $sticky = array_filter((array) get_option('sticky_posts'));
    if ($sticky) {
        $p = xft_query_posts(['posts_per_page' => 1, 'post__in' => $sticky]);
        if ($p) return $p[0];
    }
    $p = xft_query_posts(['posts_per_page' => 1, 'meta_key' => '_thumbnail_id']);
    if ($p) return $p[0];
    $p = xft_query_posts(['posts_per_page' => 1]);
    return $p[0] ?? null;
}

function xft_popular($count, $exclude = []) {
    $ids = xft_query_posts(['posts_per_page' => $count, 'post__not_in' => $exclude, 'meta_key' => '_xf_views', 'orderby' => 'meta_value_num', 'order' => 'DESC']);
    return $ids ?: xft_query_posts(['posts_per_page' => $count, 'post__not_in' => $exclude, 'orderby' => 'comment_count']);
}

function xft_ad($class = 'xf-ad--leaderboard') {
    return function_exists('xf_ad_unit') ? xf_ad_unit($class) : '';
}

function xft_newsletter($heading = null) {
    if (!function_exists('xf_newsletter_form')) {
        return '';
    }
    return $heading ? xf_newsletter_form($heading) : xf_newsletter_form();
}

/** Main navigation: the "Main menu" location if set, else the design's default items. */
function xft_nav_items() {
    $locations = get_nav_menu_locations();
    if (!empty($locations['primary'])) {
        $items = wp_get_nav_menu_items($locations['primary']);
        if ($items) {
            return array_map(function ($i) { return ['label' => $i->title, 'url' => $i->url]; }, array_filter($items, function ($i) { return !$i->menu_item_parent; }));
        }
    }
    $items = [
        ['label' => 'News', 'url' => xft_page_url('news', 'news')],
        ['label' => 'Launches', 'url' => xft_page_url('launches', 'launches')],
        ['label' => 'Funding Tracker', 'url' => xft_page_url('funding', 'funding-tracker')],
        ['label' => 'Events', 'url' => xft_page_url('events', 'events')],
    ];
    if (xft_page_exists('jobs')) {
        $items[] = ['label' => 'Jobs', 'url' => home_url('/jobs/')];
    }
    $items[] = ['label' => 'Startups', 'url' => xft_page_url('directory', 'startups')];
    $items[] = ['label' => 'Blog', 'url' => xft_page_url('blog', 'blog')];
    return $items;
}

function xft_is_current($url) {
    $here = trailingslashit(strtok((string) ($_SERVER['REQUEST_URI'] ?? '/'), '?'));
    $path = trailingslashit((string) wp_parse_url($url, PHP_URL_PATH));
    return $path !== '/' && strpos($here, $path) === 0;
}

function xft_sector_links() {
    $sectors = function_exists('xf_sector_categories') ? xf_sector_categories() : [];
    $links = [];
    foreach ($sectors as $slug => $name) {
        $term = get_term_by('slug', $slug, 'category');
        if ($term) {
            $links[] = ['label' => $term->name, 'url' => get_category_link($term), 'slug' => $slug];
        }
    }
    return $links;
}

/** Breaking ticker: flagged posts from the last 24h, else the newest stories of the day. */
function xft_ticker_posts() {
    $flagged = xft_query_posts(['posts_per_page' => 8, 'meta_key' => '_xf_breaking', 'meta_value' => '1', 'date_query' => [['after' => '24 hours ago']]]);
    return $flagged ?: xft_query_posts(['posts_per_page' => 6, 'date_query' => [['after' => '24 hours ago']]]);
}

/** Adds ids to <h2>s and returns [content, toc items] for the article sidebar. */
function xft_toc($content) {
    $items = [];
    $used = [];
    $content = preg_replace_callback('/<h2([^>]*)>(.*?)<\/h2>/is', function ($m) use (&$items, &$used) {
        $text = trim(wp_strip_all_tags($m[2]));
        if ($text === '') {
            return $m[0];
        }
        if (preg_match('/\sid="([^"]+)"/', $m[1], $idm)) {
            $id = $idm[1];
            $attrs = $m[1];
        } else {
            $id = sanitize_title($text) ?: 'section';
            while (isset($used[$id])) {
                $id .= '-2';
            }
            $attrs = $m[1] . ' id="' . esc_attr($id) . '"';
        }
        $used[$id] = true;
        $items[] = ['id' => $id, 'text' => $text];
        return '<h2' . $attrs . '>' . $m[2] . '</h2>';
    }, $content);
    return [$content, $items];
}

function xft_share_links($url, $title) {
    $u = rawurlencode($url);
    $t = rawurlencode($title);
    return [
        ['label' => 'Share on LinkedIn', 'href' => 'https://www.linkedin.com/sharing/share-offsite/?url=' . $u, 'icon' => '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>'],
        ['label' => 'Share on X', 'href' => 'https://x.com/intent/post?url=' . $u . '&text=' . $t, 'icon' => '<path d="M4 4l16 16M20 4 4 20"/>'],
        ['label' => 'Share on WhatsApp', 'href' => 'https://wa.me/?text=' . $t . '%20' . $u, 'icon' => '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>'],
    ];
}

function xft_icon($path, $size = 16) {
    return '<svg width="' . (int) $size . '" height="' . (int) $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $path . '</svg>';
}

function xft_logo_svg() {
    return '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect width="22" height="22" rx="6" fill="#f2f2ef"/><path d="M6 15.5 11 6.5l5 9" stroke="#0b0b0c" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/** Paged listing helper for feeds (?pg=2) that doesn't fight WordPress page routing. */
function xft_paged() {
    return max(1, isset($_GET['pg']) ? absint($_GET['pg']) : (int) get_query_var('paged'));
}

/** One row in a news feed (title, dek, byline, thumbnail). */
function xft_feed_item($post) {
    ob_start();
    ?>
    <a href="<?php echo esc_url(get_permalink($post)); ?>" class="row feed-item">
        <span style="flex:1;min-width:0;display:block">
            <span style="display:flex;gap:12px;align-items:baseline"><span class="tag"><?php echo esc_html(xft_cat_name($post)); ?></span><span class="k" style="font-size:10.5px"><?php echo esc_html(get_the_date('j M Y', $post)); ?></span></span>
            <span class="t"><span class="u"><?php echo esc_html(get_the_title($post)); ?></span></span>
            <?php if (has_excerpt($post) || $post->post_content) : ?><span class="d"><?php echo esc_html(wp_trim_words(get_the_excerpt($post), 24)); ?></span><?php endif; ?>
            <span class="k" style="display:block;margin-top:10px;font-size:10.5px"><?php echo esc_html(xft_author_name($post) . ' · ' . xft_read_time($post)); ?></span>
        </span>
        <?php if (has_post_thumbnail($post)) : ?><span class="thm"><?php echo xft_image($post, '3x2'); // phpcs:ignore ?></span><?php endif; ?>
    </a>
    <?php
    return ob_get_clean();
}

function xft_event_row($event, $compact = false) {
    $start = get_post_meta($event->ID, '_xf_start', true);
    $ts = $start ? strtotime(get_date_from_gmt($start)) : 0;
    $where = get_post_meta($event->ID, '_xf_city', true) ?: get_post_meta($event->ID, '_xf_venue', true);
    $kind = get_post_meta($event->ID, '_xf_kind', true);
    ob_start();
    ?>
    <a href="<?php echo esc_url(get_permalink($event)); ?>" class="row ev-row"<?php echo $compact ? ' style="gap:16px;padding:16px 0"' : ''; ?>>
        <span class="ev-date"><span class="k m"><?php echo esc_html($ts ? date_i18n('M', $ts) : ''); ?></span><span class="d"><?php echo esc_html($ts ? date_i18n('d', $ts) : ''); ?></span></span>
        <span style="flex:1;min-width:0"><span class="ev-title"><span class="u"><?php echo esc_html(get_the_title($event)); ?></span></span><span class="ev-where"><?php echo esc_html($where); ?></span></span>
        <?php if ($kind && !$compact) : ?><span class="k hs" style="font-size:10.5px"><?php echo esc_html($kind); ?></span><?php endif; ?>
    </a>
    <?php
    return ob_get_clean();
}
