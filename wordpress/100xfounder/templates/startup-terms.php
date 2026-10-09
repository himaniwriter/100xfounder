<?php
/** Industry or stage page: the startups filed under it. Rendered by the plugin (indexing.php). */
if (!defined('ABSPATH')) {
    exit;
}
$term = get_queried_object();
$kind = $term->taxonomy === 'xf_stage' ? 'Stage' : 'Industry';
global $wp_query;
$total = (int) $wp_query->found_posts;
get_header();
?>
<section class="wrap" style="padding-top:56px;padding-bottom:28px">
    <nav class="crumbs k" aria-label="Breadcrumb"><a href="<?php echo esc_url(xf_page_url('directory')); ?>">Startups</a><span>/</span><span><?php echo esc_html($term->name); ?></span></nav>
    <h1 class="display" style="margin-top:18px;font-size:clamp(34px,6vw,64px)"><?php echo esc_html($kind === 'Stage' ? $term->name . ' stage startups' : $term->name . ' startups'); ?></h1>
    <p style="max-width:680px;margin-top:14px;font-size:17px;line-height:1.6;color:var(--t2)">
        <?php echo $term->description ? esc_html($term->description) : esc_html(sprintf(
            /* translators: 1: count, 2: term name */
            _n('%1$d startup in our directory is filed under %2$s, with its tagline, launch details and links.', '%1$d startups in our directory are filed under %2$s, with their taglines, launch details and links.', $total),
            $total, $term->name
        )); ?>
    </p>
</section>
<div class="hl"></div>
<section class="wrap" style="padding-top:24px">
    <?php if (have_posts()) : while (have_posts()) : the_post();
        $tagline = get_post_meta(get_the_ID(), '_xf_tagline', true) ?: get_the_excerpt(); ?>
        <a class="row" href="<?php the_permalink(); ?>" style="display:block;padding:16px 0;border-bottom:1px solid var(--ln)">
            <span style="display:block;font-weight:600;font-size:17px;letter-spacing:-.01em"><span class="u"><?php the_title(); ?></span></span>
            <?php if ($tagline) : ?><span style="display:block;margin-top:4px;font-size:14px;color:var(--t2)"><?php echo esc_html(wp_trim_words($tagline, 22)); ?></span><?php endif; ?>
        </a>
    <?php endwhile; else : ?>
        <p style="padding:40px 0;color:var(--t2)">No startups here yet. <a class="u" href="<?php echo esc_url(xf_page_url('directory')); ?>">Browse all startups</a>.</p>
    <?php endif; ?>
    <?php the_posts_pagination(['mid_size' => 1]); ?>
</section>
<?php get_footer();
