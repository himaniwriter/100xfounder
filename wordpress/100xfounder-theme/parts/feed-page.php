<?php
/**
 * The newsroom layout (News page, category archives, Blog, search): title,
 * optional tabs, lead story, feed with paging, and the sidebar.
 * $args: kicker, title, tabs (label => url), active, query_args, show_lead.
 */
$kicker = $args['kicker'] ?? 'The newsroom';
$title = $args['title'] ?? 'News, events & long reads';
$tabs = $args['tabs'] ?? [];
$active = $args['active'] ?? '';
$paged = xft_paged();
$per_page = 10;
$query_args = array_merge(['posts_per_page' => $per_page, 'paged' => $paged, 'no_found_rows' => false], $args['query_args'] ?? []);
$lead = null;
if (!empty($args['show_lead']) && $paged === 1) {
    $lead_q = xft_query_posts(array_merge($args['query_args'] ?? [], ['posts_per_page' => 1, 'meta_key' => '_thumbnail_id']));
    $lead = $lead_q[0] ?? null;
    if ($lead) {
        $query_args['post__not_in'] = array_merge($query_args['post__not_in'] ?? [], [$lead->ID]);
    }
}
$feed = new WP_Query(array_merge(['post_type' => 'post', 'post_status' => 'publish', 'ignore_sticky_posts' => true], $query_args));
$events = function_exists('xf_upcoming_events') ? xf_upcoming_events(4) : [];
$popular = xft_popular(4);
?>
<section class="wrap" style="padding-top:56px">
    <div class="k in"><?php echo esc_html($kicker); ?></div>
    <h1 class="page-title in" style="animation-delay:.06s"><?php echo esc_html($title); ?></h1>
    <?php if (!empty($args['description'])) : ?><p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0"><?php echo esc_html($args['description']); ?></p><?php endif; ?>
    <?php if ($tabs) : ?>
        <nav class="tabs" aria-label="Sections" style="margin-top:28px">
            <?php foreach ($tabs as $label => $url) : ?><a class="tab<?php echo $label === $active ? ' on' : ''; ?>" href="<?php echo esc_url($url); ?>"<?php echo $label === $active ? ' aria-current="page"' : ''; ?>><?php echo esc_html($label); ?></a><?php endforeach; ?>
        </nav>
    <?php endif; ?>
</section>

<?php if ($lead) : ?>
    <section class="wrap" style="padding-top:36px">
        <a href="<?php echo esc_url(get_permalink($lead)); ?>" class="in" style="display:flex;flex-wrap:wrap;gap:28px 40px;align-items:center">
            <span style="flex:1.4 1 480px;min-width:0"><?php echo xft_image($lead, '16x10', 'xft-lead', true); // phpcs:ignore ?></span>
            <span style="flex:1 1 340px;display:block">
                <span class="tag">Lead story · <?php echo esc_html(xft_cat_name($lead)); ?></span>
                <span style="display:block;margin-top:14px;font-size:clamp(30px,3.4vw,46px);line-height:1.06;letter-spacing:-.045em;font-weight:600"><span class="u"><?php echo esc_html(get_the_title($lead)); ?></span></span>
                <span style="display:block;margin-top:16px;font-size:17px;line-height:1.6;color:var(--t2)"><?php echo esc_html(wp_trim_words(get_the_excerpt($lead), 30)); ?></span>
                <span style="display:flex;align-items:center;gap:12px;margin-top:22px"><span class="avatar" style="width:34px;height:34px"><?php echo esc_html(xft_initials(xft_author_name($lead))); ?></span><span style="font-size:14px"><?php echo esc_html(xft_author_name($lead)); ?><span class="k" style="display:block;font-size:10.5px;margin-top:2px"><?php echo esc_html(get_the_date('j M Y', $lead) . ' · ' . xft_read_time($lead)); ?></span></span></span>
            </span>
        </a>
    </section>
<?php endif; ?>

<section class="wrap" style="padding-top:64px;display:flex;flex-wrap:wrap;gap:48px">
    <div style="flex:999 1 600px;min-width:0">
        <div class="sh"><h2><?php echo esc_html($active ?: 'Latest'); ?></h2><span class="k"><?php echo esc_html(number_format_i18n($feed->found_posts + ($lead ? 1 : 0))); ?> stories</span></div>
        <?php if ($feed->have_posts()) : foreach ($feed->posts as $p) echo xft_feed_item($p); // phpcs:ignore
        else : ?>
            <div style="padding:48px 0;color:var(--t2)">No stories in this section yet.</div>
        <?php endif; ?>
        <?php if ($feed->max_num_pages > $paged) : ?>
            <div class="pager"><a class="btn" href="<?php echo esc_url(add_query_arg('pg', $paged + 1)); ?>">Load more stories</a></div>
        <?php elseif ($paged > 1) : ?>
            <div class="pager"><a class="btn" href="<?php echo esc_url(remove_query_arg('pg')); ?>">Back to the latest</a></div>
        <?php endif; ?>
        <?php echo xft_ad(); // phpcs:ignore ?>
    </div>

    <aside style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:48px">
        <?php if ($events) : ?>
            <div><div class="sh"><h2>Upcoming events</h2></div><?php foreach ($events as $e) echo xft_event_row($e, true); // phpcs:ignore ?></div>
        <?php endif; ?>
        <?php if ($popular) : ?>
            <div><div class="sh"><h2>Most read</h2></div>
                <?php foreach ($popular as $i => $p) : ?>
                    <a href="<?php echo esc_url(get_permalink($p)); ?>" class="row pop-item" style="padding:14px 0"><span class="n" style="font-size:28px;width:24px"><?php echo (int) $i + 1; ?></span><span class="t"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></span></a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <div id="newsletter"><?php echo xft_newsletter('The day’s funding, launches and hires in one email.'); // phpcs:ignore ?></div>
    </aside>
</section>
