<?php
/**
 * Human-readable sitemap: sections and hubs, every article, guide and event, then startups
 * A–Z, 200 to a page at /sitemap/page/N/. Plain links only, so crawlers reach every listing
 * within two clicks of the footer.
 */
const XFT_SITEMAP_PER_PAGE = 200;
$paged = xft_paged();
$lean = ['no_found_rows' => true, 'update_post_meta_cache' => false, 'update_post_term_cache' => false, 'ignore_sticky_posts' => true];
$startups = new WP_Query(['post_type' => 'xf_startup', 'post_status' => 'publish', 'orderby' => 'title', 'order' => 'ASC', 'posts_per_page' => XFT_SITEMAP_PER_PAGE, 'paged' => $paged, 'update_post_meta_cache' => false, 'update_post_term_cache' => false]);
$pages = max(1, (int) $startups->max_num_pages);
if ($paged > $pages) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    nocache_headers();
    get_template_part('404');
    return;
}
add_filter('get_canonical_url', function ($url) use ($paged) { return $paged > 1 ? get_pagenum_link($paged) : $url; }, 20);
add_action('wp_head', function () use ($paged, $pages) {
    if ($paged > 1) printf('<link rel="prev" href="%s">' . "\n", esc_url(get_pagenum_link($paged - 1)));
    if ($paged < $pages) printf('<link rel="next" href="%s">' . "\n", esc_url(get_pagenum_link($paged + 1)));
});
get_header();

$link_list = function (array $items) {
    echo '<ul class="sm-list">';
    foreach ($items as [$label, $url]) {
        echo '<li><a href="' . esc_url($url) . '">' . esc_html(html_entity_decode($label, ENT_QUOTES, 'UTF-8')) . '</a></li>';
    }
    echo '</ul>';
};
$from_posts = function (array $posts) {
    return array_map(function ($p) { return [get_the_title($p), get_permalink($p)]; }, $posts);
};
?>
<section class="wrap" style="padding-top:28px">
    <h1 class="page-title in">Sitemap<?php echo $paged > 1 ? esc_html(' · page ' . $paged) : ''; ?></h1>
    <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Every section, article, guide and event on 100xFounder, and every startup in the directory from A to Z.</p>
</section>

<?php if ($paged === 1) :
    $sections = [];
    foreach (function_exists('xf_hubs') ? xf_hubs() : [] as $hub) $sections[] = [$hub['title'], xf_page_url($hub['page'])];
    foreach (['news' => 'News', 'directory' => 'Startups', 'launches' => 'Daily launches', 'spotlights' => 'Founder stories', 'events' => 'Events', 'jobs' => 'Jobs', 'guides' => 'How to apply', 'tools' => 'Free tools', 'about' => 'About', 'editorial' => 'Editorial policy', 'contact' => 'Contact'] as $key => $label) {
        $sections[] = [$label, xf_page_url($key)];
    }
    $articles = (new WP_Query(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 500, 'orderby' => 'date', 'order' => 'DESC'] + $lean))->posts;
    $guides = (new WP_Query(['post_type' => 'xf_guide', 'post_status' => 'publish', 'posts_per_page' => 500, 'orderby' => 'title', 'order' => 'ASC'] + $lean))->posts;
    $events = (new WP_Query(['post_type' => 'xf_event', 'post_status' => 'publish', 'posts_per_page' => 200, 'orderby' => 'date', 'order' => 'DESC'] + $lean))->posts;
    ?>
    <section class="wrap sm-grid" style="padding-top:48px">
        <div><div class="sh"><h2>Sections and hubs</h2></div><?php $link_list($sections); ?></div>
        <?php if ($guides) : ?><div><div class="sh"><h2>How to apply guides</h2><span class="k"><?php echo esc_html(number_format_i18n(count($guides))); ?></span></div><?php $link_list($from_posts($guides)); ?></div><?php endif; ?>
        <?php if ($events) : ?><div><div class="sh"><h2>Events</h2><span class="k"><?php echo esc_html(number_format_i18n(count($events))); ?></span></div><?php $link_list($from_posts($events)); ?></div><?php endif; ?>
    </section>
    <?php if ($articles) : ?>
        <section class="wrap" style="padding-top:48px">
            <div class="sh"><h2>Articles</h2><span class="k"><?php echo esc_html(number_format_i18n(count($articles))); ?></span></div>
            <?php $link_list($from_posts($articles)); ?>
        </section>
    <?php endif; ?>
<?php endif; ?>

<section class="wrap" style="padding-top:48px">
    <div class="sh"><h2>Startups A–Z</h2><span class="k"><?php echo esc_html(sprintf('Page %d of %d', $paged, $pages)); ?></span></div>
    <?php
    $by_letter = [];
    foreach ($startups->posts as $s) {
        $title = html_entity_decode(get_the_title($s), ENT_QUOTES, 'UTF-8');
        $letter = strtoupper(mb_substr($title, 0, 1));
        $by_letter[preg_match('/[A-Z]/', $letter) ? $letter : '#'][] = [$title, get_permalink($s)];
    }
    foreach ($by_letter as $letter => $items) : ?>
        <h3 class="k sm-letter"><?php echo esc_html($letter); ?></h3>
        <?php $link_list($items); ?>
    <?php endforeach; ?>
    <?php if ($pages > 1) : ?>
        <nav class="pager" aria-label="Startup pages" style="flex-wrap:wrap">
            <?php for ($i = 1; $i <= $pages; $i++) : ?>
                <a class="btn btn-sm" href="<?php echo esc_url(get_pagenum_link($i)); ?>"<?php echo $i === $paged ? ' aria-current="page"' : ''; ?>><?php echo (int) $i; ?></a>
            <?php endfor; ?>
        </nav>
    <?php endif; ?>
</section>
<?php get_footer();
