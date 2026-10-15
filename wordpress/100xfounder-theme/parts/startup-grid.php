<?php
/** A grid of startup links (logo, name, tagline). Expects $args['startups'] (WP_Post[]). */
?>
<div class="hub-startups">
    <?php foreach ($args['startups'] ?? [] as $s) : ?>
        <a class="sp-sim" href="<?php echo esc_url(get_permalink($s)); ?>"><?php echo xf_startup_logo_html($s->ID, 40); // phpcs:ignore ?>
            <span><strong><?php echo esc_html(get_the_title($s)); ?></strong><br><span class="muted" style="font-size:13px"><?php echo esc_html(wp_trim_words(get_post_meta($s->ID, '_xf_tagline', true), 10)); ?></span></span></a>
    <?php endforeach; ?>
</div>
