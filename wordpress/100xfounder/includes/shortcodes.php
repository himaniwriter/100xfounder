<?php
if (!defined('ABSPATH')) {
    exit;
}

function xf_startup_card($post_id) {
    $tagline = get_post_meta($post_id, '_xf_tagline', true) ?: get_the_excerpt($post_id);
    $votes = (int) get_post_meta($post_id, '_xf_votes', true);
    $reasons = (array) get_post_meta($post_id, '_xf_reasons', true);
    $labels = xf_reason_labels();
    $badge = '';
    foreach ($reasons as $reason) {
        if (isset($labels[$reason])) {
            $badge = '<span class="xf-badge xf-badge--accent">' . esc_html($labels[$reason]) . '</span>';
            break;
        }
    }
    if (!$badge) {
        $terms = wp_get_post_terms($post_id, 'xf_industry', ['fields' => 'names']);
        $badge = $terms ? '<span class="xf-badge">' . esc_html($terms[0]) . '</span>' : '';
    }
    $spot = xf_published_spotlight_for($post_id) ? '<span class="xf-badge xf-badge--success">Founder spotlight</span>' : '';

    return sprintf(
        '<a class="xf-card xf-startup-card" href="%s">%s<span class="xf-startup-card__body"><strong>%s</strong><span class="xf-muted">%s</span><span class="xf-badges">%s%s%s</span></span></a>',
        esc_url(get_permalink($post_id)),
        xf_startup_logo_html($post_id, 56),
        esc_html(get_the_title($post_id)),
        esc_html(wp_trim_words($tagline, 18)),
        $votes ? '<span class="xf-badge">' . $votes . ' upvotes</span>' : '',
        $badge,
        $spot
    );
}

function xf_spotlight_card($post_id) {
    $startup_id = (int) get_post_meta($post_id, '_xf_startup_id', true);
    $photo = has_post_thumbnail($post_id)
        ? get_the_post_thumbnail($post_id, 'thumbnail', ['class' => 'xf-avatar', 'loading' => 'lazy'])
        : '<span class="xf-avatar xf-logo--initial">' . esc_html(mb_substr((string) get_post_meta($post_id, '_xf_founder_name', true), 0, 1)) . '</span>';
    return sprintf(
        '<a class="xf-card xf-spotlight-card" href="%s"><span class="xf-spotlight-card__head">%s<span><strong>%s</strong><span class="xf-muted">%s</span></span></span><span>%s</span></a>',
        esc_url(get_permalink($post_id)),
        $photo,
        esc_html((string) get_post_meta($post_id, '_xf_founder_name', true)),
        esc_html(trim(get_post_meta($post_id, '_xf_role', true) . ($startup_id ? ', ' . get_the_title($startup_id) : ''), ', ')),
        esc_html(wp_trim_words((string) get_post_meta($post_id, '_xf_story_origin', true), 28))
    );
}

/** Home page: launches strip, then the news portal, then a short explainer. */
add_shortcode('xf_home', function () {
    $launches = get_posts(['post_type' => 'xf_startup', 'posts_per_page' => 4, 'fields' => 'ids', 'meta_key' => '_xf_source', 'meta_value' => 'producthunt']);
    ob_start();
    ?>
    <div class="xf xf-home alignwide">
        <section class="xf-hero">
            <p class="xf-eyebrow">Startup news · Daily launches · Founder stories</p>
            <h1>Discover the best new startups, every day.</h1>
            <p class="xf-actions">
                <a class="xf-button" href="<?php echo esc_url(xf_page_url('launches')); ?>">Today's launches</a>
                <a class="xf-button xf-button--ghost" href="<?php echo esc_url(xf_page_url('spotlights')); ?>">Founder stories</a>
            </p>
        </section>
        <?php if ($launches) : ?>
            <section class="xf-news-section">
                <h2 class="xf-section-title">Today's top launches <a href="<?php echo esc_url(xf_page_url('launches')); ?>">View all →</a></h2>
                <div class="xf-grid xf-grid--4"><?php foreach ($launches as $id) echo xf_startup_card($id); // phpcs:ignore ?></div>
            </section>
        <?php endif; ?>
        <?php echo do_shortcode('[xf_news]'); ?>
        <section class="xf-card xf-about-strip">
            <h2>About 100xFounder</h2>
            <p>Every day we review the most upvoted and featured launches on Product Hunt, add the best to our <a href="<?php echo esc_url(xf_page_url('directory')); ?>">startup directory</a>, and invite their founders to share the story behind what they built. Alongside, we cover funding, founder stories and the trends shaping new startups.</p>
        </section>
    </div>
    <?php
    return ob_get_clean();
});

/** Searchable, filterable directory of all startups. */
add_shortcode('xf_directory', function () {
    $search = isset($_GET['q']) ? sanitize_text_field(wp_unslash($_GET['q'])) : '';
    $industry = isset($_GET['industry']) ? sanitize_title(wp_unslash($_GET['industry'])) : '';
    $paged = max(1, isset($_GET['pg']) ? absint($_GET['pg']) : 1);
    $args = [
        'post_type' => 'xf_startup',
        'post_status' => 'publish',
        'posts_per_page' => 24,
        'paged' => $paged,
        's' => $search,
        'fields' => 'ids',
        // Newest launches first, then alphabetical (imported listings share a date).
        'orderby' => ['date' => 'DESC', 'title' => 'ASC'],
    ];
    if ($industry) {
        $args['tax_query'] = [['taxonomy' => 'xf_industry', 'field' => 'slug', 'terms' => $industry]];
    }
    $query = new WP_Query($args);
    $industries = get_terms(['taxonomy' => 'xf_industry', 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC', 'number' => 40]);

    ob_start();
    ?>
    <div class="xf xf-directory alignwide">
        <form class="xf-filters" method="get">
            <input type="search" name="q" value="<?php echo esc_attr($search); ?>" placeholder="Search startups">
            <select name="industry">
                <option value="">All categories</option>
                <?php foreach ($industries as $term) : ?>
                    <option value="<?php echo esc_attr($term->slug); ?>" <?php selected($industry, $term->slug); ?>><?php echo esc_html($term->name); ?></option>
                <?php endforeach; ?>
            </select>
            <button class="xf-button" type="submit">Filter</button>
        </form>
        <p class="xf-muted"><?php echo esc_html(number_format_i18n($query->found_posts)); ?> startups</p>
        <div class="xf-grid">
            <?php foreach ($query->posts as $i => $id) {
                echo xf_startup_card($id); // phpcs:ignore
                if ($i === 11) echo xf_ad_unit('xf-grid__full'); // phpcs:ignore
            } ?>
        </div>
        <?php if ($query->max_num_pages > 1) : ?>
            <nav class="xf-pagination">
                <?php echo paginate_links([ // phpcs:ignore
                    'base' => add_query_arg('pg', '%#%'),
                    'format' => '',
                    'current' => $paged,
                    'total' => $query->max_num_pages,
                ]); ?>
            </nav>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
});

/** Product Hunt launches grouped by day, newest first. */
add_shortcode('xf_launches', function () {
    $ids = get_posts([
        'post_type' => 'xf_startup',
        'posts_per_page' => 70,
        'fields' => 'ids',
        'meta_key' => '_xf_launch_day',
        'orderby' => ['meta_value' => 'DESC', 'date' => 'DESC'],
        'meta_query' => [['key' => '_xf_source', 'value' => 'producthunt']],
    ]);
    if (!$ids) {
        return '<div class="xf xf-card"><p>New launches are being added. Check back soon.</p></div>';
    }
    $days = [];
    foreach ($ids as $id) {
        $days[get_post_meta($id, '_xf_launch_day', true)][] = $id;
    }
    ob_start();
    echo '<div class="xf xf-launches alignwide"><p class="xf-lead">Each day we pick the top launches from Product Hunt: the most upvoted, the top featured, and anything with 100+ upvotes.</p>';
    $n = 0;
    foreach ($days as $day => $day_ids) {
        usort($day_ids, function ($a, $b) {
            return (int) get_post_meta($b, '_xf_votes', true) <=> (int) get_post_meta($a, '_xf_votes', true);
        });
        echo '<section><h2>' . esc_html(mysql2date('l, F j, Y', $day)) . '</h2><div class="xf-grid">';
        foreach ($day_ids as $id) {
            echo xf_startup_card($id); // phpcs:ignore
        }
        echo '</div></section>';
        if (++$n === 1) {
            echo xf_ad_unit(); // phpcs:ignore
        }
    }
    echo '</div>';
    return ob_get_clean();
});

add_shortcode('xf_spotlights', function () {
    $ids = get_posts(['post_type' => 'xf_spotlight', 'posts_per_page' => 48, 'fields' => 'ids']);
    if (!$ids) {
        return '<div class="xf xf-card"><p>The first founder spotlights are on their way.</p></div>';
    }
    $out = '<div class="xf alignwide"><p class="xf-lead">Founders of the best new startups tell us why they built what they built.</p><div class="xf-grid xf-grid--3">';
    foreach ($ids as $id) {
        $out .= xf_spotlight_card($id);
    }
    return $out . '</div></div>';
});
