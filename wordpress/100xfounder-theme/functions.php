<?php
/**
 * 100Xfounder theme. Presentation only: data comes from the 100xFounder plugin
 * when it's active, and every section hides itself when it has nothing real to show.
 */

if (!defined('ABSPATH')) {
    exit;
}

define('XFT_VERSION', '2.9.0');

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
    // Lenis (MIT, v1.3.4, self-hosted): smooth wheel and trackpad scrolling. theme.js starts it.
    wp_enqueue_script('xft-lenis', $uri . '/assets/js/lenis.min.js', [], '1.3.4', ['strategy' => 'defer', 'in_footer' => true]);
    wp_enqueue_script('xft', $uri . '/assets/js/theme.js', ['xft-lenis'], XFT_VERSION, ['strategy' => 'defer', 'in_footer' => true]);
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

/**
 * A company's mark in the square tile used across the job pages: its logo when
 * we have one, otherwise its initials. $company is a term, a name or a job ID.
 */
function xft_company_mark($company, $size = 44) {
    $term = null;
    $name = '';
    if (is_object($company)) {
        $term = $company;
    } elseif (is_int($company) && function_exists('xf_job_company')) {
        $term = xf_job_company($company);
        $name = (string) get_post_meta($company, '_xf_company_name', true);
    } else {
        $name = (string) $company;
    }
    $name = $term ? $term->name : $name;
    $src = function_exists('xf_company_logo_url') ? xf_company_logo_url($term ?: $name) : '';
    $box = sprintf('width:%1$dpx;height:%1$dpx', (int) $size);
    if ($src) {
        return sprintf('<span class="av av--logo" style="%s"><img src="%s" alt="%s" width="%d" height="%d" loading="lazy" decoding="async"></span>',
            esc_attr($box), esc_url($src), esc_attr($name . ' logo'), (int) $size, (int) $size);
    }
    return sprintf('<span class="av" style="%s">%s</span>', esc_attr($box), esc_html(xft_initials($name)));
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
    $items[] = ['label' => 'Leaderboard', 'url' => home_url('/leaderboard/')];
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

/** Blog: every published post, ten to a page at /blog/page/N/. */
function xft_blog_query_args() {
    return ['posts_per_page' => 10, 'paged' => xft_paged(), 'no_found_rows' => false];
}

function xft_blog_max_pages() {
    $count = (int) wp_count_posts('post')->publish;
    return max(1, (int) ceil($count / 10));
}

/** Blog pages canonicalise to themselves (/blog/page/2/), not to page one. */
add_filter('get_canonical_url', function ($url) {
    if (is_page('blog') && xft_paged() > 1) {
        return get_pagenum_link(xft_paged());
    }
    return $url;
}, 20);

/** Blog pages past the last one are 404s, not empty copies. */
add_action('template_redirect', function () {
    if (is_page('blog') && xft_paged() > xft_blog_max_pages()) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        nocache_headers();
    }
});

/** rel=prev / rel=next for the paginated blog. */
add_action('wp_head', function () {
    if (!is_page('blog')) {
        return;
    }
    $paged = xft_paged();
    if ($paged > 1) {
        printf('<link rel="prev" href="%s">' . "\n", esc_url(get_pagenum_link($paged - 1)));
    }
    if ($paged < xft_blog_max_pages()) {
        printf('<link rel="next" href="%s">' . "\n", esc_url(get_pagenum_link($paged + 1)));
    }
}, 4);

/**
 * Document titles: a descriptive home title, and no " – 100xFounder" suffix on
 * long post titles (over 50 characters), so the headline itself fits in results.
 */
add_filter('document_title_parts', function ($parts) {
    if (is_front_page()) {
        return ['title' => get_bloginfo('name') . ': Startup News, Funding, Jobs and AI Tools in India'];
    }
    if (is_singular() && !empty($parts['title']) && mb_strlen(wp_strip_all_tags(html_entity_decode($parts['title'], ENT_QUOTES))) > 50) {
        unset($parts['site'], $parts['tagline']);
    }
    if (is_page('blog') && xft_paged() > 1) {
        $parts['page'] = sprintf('Page %d', xft_paged());
    }
    return $parts;
}, 20);

/** Related reading: posts sharing tags, then the category, then the newest, up to $count. */
function xft_related_posts($post, $count = 4) {
    $found = [];
    $skip = [$post->ID];
    $tags = wp_get_post_tags($post->ID, ['fields' => 'ids']);
    if ($tags) {
        $found = xft_query_posts(['posts_per_page' => $count, 'post__not_in' => $skip, 'tag__in' => $tags]);
    }
    $cats = array_diff(wp_get_post_categories($post->ID), [(int) get_option('default_category')]);
    if (count($found) < $count && $cats) {
        $found = array_merge($found, xft_query_posts(['posts_per_page' => $count - count($found), 'post__not_in' => array_merge($skip, wp_list_pluck($found, 'ID')), 'category__in' => $cats]));
    }
    if (count($found) < $count) {
        $found = array_merge($found, xft_query_posts(['posts_per_page' => $count - count($found), 'post__not_in' => array_merge($skip, wp_list_pluck($found, 'ID'))]));
    }
    return $found;
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

/**
 * An organiser's graphic at the size we show it. Luma serves its images through
 * a resizing CDN, so a 120px thumbnail need not download an 800px file.
 */
function xft_sized_image($url, $width) {
    $height = (int) round($width / 1.91);
    return preg_replace('#width=\d+,height=\d+#', 'width=' . (int) $width . ',height=' . $height, (string) $url);
}

/** The organiser's own graphic for an event, or '' when they did not publish one. */
function xft_event_graphic($event) {
    if (!function_exists('xf_event_image')) {
        return '';
    }
    $pic = xf_event_image($event->ID);
    return !empty($pic['theirs']) && $pic['url'] ? $pic['url'] : '';
}

function xft_event_row($event, $compact = false) {
    $start = get_post_meta($event->ID, '_xf_start', true);
    $ts = $start ? strtotime(get_date_from_gmt($start)) : 0;
    $where = get_post_meta($event->ID, '_xf_city', true) ?: get_post_meta($event->ID, '_xf_venue', true);
    $kind = get_post_meta($event->ID, '_xf_kind', true);
    $graphic = xft_event_graphic($event);
    ob_start();
    ?>
    <a href="<?php echo esc_url(get_permalink($event)); ?>" class="row ev-row<?php echo $compact ? ' ev-row--compact' : ''; ?>">
        <span class="ev-date"><span class="k m"><?php echo esc_html($ts ? date_i18n('M', $ts) : ''); ?></span><span class="d"><?php echo esc_html($ts ? date_i18n('d', $ts) : ''); ?></span></span>
        <span style="flex:1;min-width:0"><span class="ev-title"><span class="u"><?php echo esc_html(get_the_title($event)); ?></span></span><span class="ev-where"><?php echo esc_html($where); ?></span></span>
        <?php if ($kind && !$compact) : ?><span class="k hs" style="font-size:10.5px"><?php echo esc_html($kind); ?></span><?php endif; ?>
        <?php if ($graphic) : ?><span class="ev-pic"><img src="<?php echo esc_url(xft_sized_image($graphic, 280)); ?>" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span><?php endif; ?>
    </a>
    <?php
    return ob_get_clean();
}

/**
 * A slow, endless strip of pictures that each lead somewhere: organiser
 * graphics to their event, article photographs to their story. The list is
 * printed twice so the loop has no seam; the copy is hidden from screen
 * readers and the keyboard. It stops under prefers-reduced-motion and on hover.
 *
 * @param array $items each ['url' => link, 'img' => src, 'title' => text, 'meta' => small label]
 */
function xft_photo_strip(array $items, $label, $variant = 'events') {
    if (count($items) < 4) {
        return '';
    }
    $cell = function ($it, $copy) {
        return sprintf(
            '<a class="strip-item" href="%s"%s><span class="strip-pic"><img src="%s" alt="%s" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span><span class="strip-cap"><span class="k">%s</span><span class="strip-title">%s</span></span></a>',
            esc_url($it['url']),
            $copy ? ' tabindex="-1" aria-hidden="true"' : '',
            esc_url($it['img']),
            $copy ? '' : esc_attr($it['title']),
            esc_html($it['meta']),
            esc_html(wp_trim_words($it['title'], 9))
        );
    };
    $one = implode('', array_map(function ($it) use ($cell) { return $cell($it, false); }, $items));
    $two = implode('', array_map(function ($it) use ($cell) { return $cell($it, true); }, $items));
    // Roughly 4.5s per picture, so the strip drifts rather than scrolls.
    $secs = max(40, count($items) * 4.5);
    return '<section class="strip strip--' . esc_attr($variant) . '" aria-label="' . esc_attr($label) . '">'
        . '<div class="strip-track" style="--strip-dur:' . esc_attr($secs) . 's">' . $one . $two . '</div></section>';
}

/** Upcoming events that have the organiser's own graphic. */
function xft_event_strip_items($limit = 14) {
    $events = function_exists('xf_upcoming_events') ? xf_upcoming_events(60) : [];
    $items = [];
    foreach ($events as $e) {
        $g = xft_event_graphic($e);
        if (!$g) {
            continue;
        }
        $start = get_post_meta($e->ID, '_xf_start', true);
        $ts = $start ? strtotime(get_date_from_gmt($start)) : 0;
        $city = get_post_meta($e->ID, '_xf_city', true);
        $items[] = [
            'url' => get_permalink($e),
            'img' => xft_sized_image($g, 520),
            'title' => get_the_title($e),
            'meta' => trim(($ts ? date_i18n('j M', $ts) : '') . ($city ? ' · ' . $city : ''), ' ·'),
        ];
        if (count($items) >= $limit) {
            break;
        }
    }
    return $items;
}

/** Recent stories with a photograph of their own (not the shared section photos). */
function xft_story_strip_items($limit = 14) {
    $items = [];
    foreach (get_posts(['posts_per_page' => $limit * 2, 'post_status' => 'publish', 'meta_key' => '_thumbnail_id', 'ignore_sticky_posts' => true]) as $p) {
        $src = get_the_post_thumbnail_url($p, 'xft-card');
        if (!$src) {
            continue;
        }
        $items[] = ['url' => get_permalink($p), 'img' => $src, 'title' => get_the_title($p), 'meta' => xft_cat_name($p)];
        if (count($items) >= $limit) {
            break;
        }
    }
    return $items;
}

/* -------------------------------------------------------------------------
 * Comparison tables
 *
 * A five-column table is the most useful thing in a listicle and the worst
 * behaved on a phone: every cell wraps to five lines and the page ends up
 * wider than the screen. Each table gets a scroll frame of its own, a column
 * count the stylesheet sizes it from, and real row and column headers — which
 * screen readers announce and which search engines read when they lift a
 * table into a snippet.
 * ---------------------------------------------------------------------- */

/** One table: header scopes, a row header per row, the frame around it. */
function xft_table_markup($m) {
    $table = $m[0];
    if (strpos($table, 'xf-dt') !== false) {
        return $table;
    }
    $cols = 2;
    if (preg_match('#<tr\b[^>]*>(.*?)</tr>#is', $table, $first)) {
        $cols = max(2, substr_count(strtolower($first[1]), '<th'), substr_count(strtolower($first[1]), '<td'));
    }
    $table = preg_replace_callback('#<tr\b[^>]*>.*?</tr>#is', function ($r) {
        // A row of column headings keeps its th cells; a body row promotes its
        // first cell, which is the name of the thing the row describes.
        if (preg_match('#<th\b#i', $r[0])) {
            return preg_replace('#<th\b(?![^>]*\bscope=)#i', '<th scope="col"', $r[0]);
        }
        return preg_replace('#<td\b([^>]*)>(.*?)</td>#is', '<th scope="row"$1>$2</th>', $r[0], 1);
    }, $table);

    preg_match('#^<table\b[^>]*>#i', $table, $o);
    $open = $o[0] ?? '<table>';
    $new = preg_match('#\sclass=(["\'])#i', $open)
        ? preg_replace('#\sclass=(["\'])#i', ' class=$1xf-dt ', $open, 1)
        : preg_replace('#^<table\b#i', '<table class="xf-dt"', $open, 1);
    if (!preg_match('#\sstyle=#i', $new)) {
        $new = preg_replace('#>$#', ' style="--cols:' . (int) $cols . '">', $new, 1);
    }
    $table = substr_replace($table, $new, 0, strlen($open));

    return '<div class="xf-tablewrap" tabindex="0" role="group" aria-label="Table, scrollable sideways">'
        . $table . '</div><p class="xf-tablehint" aria-hidden="true">Scroll the table sideways &rarr;</p>';
}

add_filter('the_content', function ($html) {
    if (is_admin() || strpos($html, '<table') === false) {
        return $html;
    }
    return preg_replace_callback('#<table\b[^>]*>.*?</table>#is', 'xft_table_markup', $html);
}, 20);

/* -------------------------------------------------------------------------
 * Startup profile pages (single-xf_startup.php)
 * ---------------------------------------------------------------------- */

// The theme lays out the whole startup page, so the plugin's plain version stands down.
add_filter('xf_use_default_startup_render', '__return_false');

/**
 * A data table in the same frame the article tables get: scrolls sideways on a
 * phone, first column pinned, real row and column headers.
 *
 * @param string[]   $headers column headings (plain text)
 * @param string[][] $rows    each row's cells; HTML is allowed in a cell (already escaped by the caller)
 */
function xft_data_table(array $headers, array $rows, $label = 'Table') {
    $out = '<div class="xf-tablewrap" tabindex="0" role="group" aria-label="' . esc_attr($label . ', scrollable sideways') . '">';
    $out .= '<table class="xf-dt" style="--cols:' . (int) count($headers) . '"><thead><tr>';
    foreach ($headers as $h) {
        $out .= '<th scope="col">' . esc_html($h) . '</th>';
    }
    $out .= '</tr></thead><tbody>';
    foreach ($rows as $row) {
        $out .= '<tr>';
        foreach (array_values($row) as $i => $cell) {
            $out .= $i === 0 ? '<th scope="row">' . $cell . '</th>' : '<td>' . $cell . '</td>';
        }
        $out .= '</tr>';
    }
    return $out . '</tbody></table></div><p class="xf-tablehint" aria-hidden="true">Scroll the table sideways &rarr;</p>';
}

/** "4 October 2026" from a Y-m-d or MySQL date; '' when it is not a date. */
function xft_long_date($date) {
    $ts = $date ? strtotime((string) $date) : 0;
    return $ts ? wp_date('j F Y', $ts) : '';
}
