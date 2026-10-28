<?php
/**
 * Pages and other single items (startups, spotlights, events, funding rounds):
 * the design's page head over the content, which the plugin enriches.
 */
get_header();
while (have_posts()) :
    the_post();
    $type = get_post_type();
    $kickers = ['xf_startup' => 'Startup', 'xf_spotlight' => 'Founder spotlight', 'xf_event' => 'Event', 'xf_round' => 'Funding round'];
    $kicker = $kickers[$type] ?? '';
    $wide = $type === 'page' && preg_match('/\[xf_(directory|launches|spotlights|home|news)/', get_post_field('post_content'));
    ?>
    <article <?php post_class(); ?>>
        <header class="wrap page-head">
            <?php if ($kicker) : ?><div class="k in"><?php echo esc_html($kicker); ?></div><?php endif; ?>
            <h1 class="page-title in" style="animation-delay:.06s"><?php the_title(); ?></h1>
            <?php if ($type === 'xf_startup' && has_excerpt()) : ?><p class="muted" style="font-size:18px;margin:16px 0 0;max-width:760px"><?php echo esc_html(get_the_excerpt()); ?></p><?php endif; ?>
        </header>
        <div class="hl"></div>
        <div class="wrap" style="padding-top:40px">
            <div class="prose<?php echo $wide ? ' prose-wide' : ''; ?>"><?php the_content(); ?></div>
        </div>
    </article>
<?php endwhile;
get_footer();
