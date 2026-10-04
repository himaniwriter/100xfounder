<?php
/** Article page, as designed: centred head, hero, sticky contents + share, body, tags, sources, keep reading. */
get_header();
while (have_posts()) :
    the_post();
    $post = get_post();
    $cat = xft_category($post);
    $is_lead = is_sticky($post->ID);
    [$content, $toc] = xft_toc(apply_filters('the_content', get_the_content()));
    $share = xft_share_links(get_permalink(), get_the_title());
    $credit = get_post_meta($post->ID, '_xf_image_credit', true) ?: wp_get_attachment_caption(get_post_thumbnail_id());
    $original = get_post_meta($post->ID, '_xf_original_url', true);
    $author_id = (int) $post->post_author;
    ?>
    <div class="prog" aria-hidden="true"></div>
    <article <?php post_class(); ?>>
        <header class="wrap art-head">
            <div class="in" style="display:flex;justify-content:center;gap:14px">
                <?php if ($cat) : ?><a href="<?php echo esc_url(get_category_link($cat)); ?>" class="tag"><?php echo esc_html($cat->name); ?></a><?php endif; ?>
                <?php if ($is_lead) : ?><span class="k" style="font-size:10.5px">Lead story</span><?php endif; ?>
            </div>
            <h1 class="in" style="animation-delay:.06s"><?php the_title(); ?></h1>
            <?php if (has_excerpt()) : ?><p class="dek in" style="animation-delay:.12s"><?php echo esc_html(get_the_excerpt()); ?></p><?php endif; ?>
            <div class="byline in" style="animation-delay:.18s">
                <span class="avatar"><?php echo get_avatar($author_id, 72, '', '', ['force_display' => false]) ?: esc_html(xft_initials(xft_author_name($post))); // phpcs:ignore ?></span>
                <span><a href="<?php echo esc_url(get_author_posts_url($author_id)); ?>"><?php echo esc_html(xft_author_name($post)); ?></a><span class="k" style="display:block;font-size:10.5px;margin-top:2px"><?php echo esc_html(get_the_date('j M Y') . ' · ' . xft_read_time($post)); ?><?php if (get_the_modified_time('U') > get_the_time('U') + DAY_IN_SECONDS) echo esc_html(' · Updated ' . get_the_modified_date('j M Y')); ?></span></span>
            </div>
        </header>

        <?php if (has_post_thumbnail()) : ?>
            <figure class="wrap in" style="max-width:1120px;margin:48px auto 0;animation-delay:.24s">
                <?php echo xft_image($post, '21x10', 'full', true); // phpcs:ignore ?>
                <?php if ($credit) : ?><figcaption class="k" style="margin-top:10px;font-size:10.5px"><?php echo esc_html($credit); ?></figcaption><?php endif; ?>
            </figure>
        <?php endif; ?>

        <div class="wrap art-layout">
            <aside class="art-side">
                <?php if (count($toc) > 1) : ?>
                    <div class="k" style="font-size:10.5px;margin-bottom:12px">In this story</div>
                    <nav class="toc" aria-label="In this story"><?php foreach ($toc as $t) : ?><a href="#<?php echo esc_attr($t['id']); ?>"><?php echo esc_html($t['text']); ?></a><?php endforeach; ?></nav>
                <?php endif; ?>
                <div class="k" style="font-size:10.5px;margin:32px 0 12px">Share</div>
                <div class="share-row">
                    <?php foreach ($share as $s) : ?><a class="share" href="<?php echo esc_url($s['href']); ?>" target="_blank" rel="noopener" aria-label="<?php echo esc_attr($s['label']); ?>"><?php echo xft_icon($s['icon'], 15); // phpcs:ignore ?></a><?php endforeach; ?>
                    <button class="share" type="button" data-copy-link="<?php echo esc_url(get_permalink()); ?>" aria-label="Copy link"><?php echo xft_icon('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', 15); // phpcs:ignore ?></button>
                </div>
            </aside>

            <div class="body">
                <div class="only-m" style="gap:8px;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid var(--ln);align-items:center">
                    <span class="k" style="font-size:10.5px;flex:1">Share</span>
                    <?php foreach ($share as $s) : ?><a class="share" href="<?php echo esc_url($s['href']); ?>" target="_blank" rel="noopener" aria-label="<?php echo esc_attr($s['label']); ?>"><?php echo xft_icon($s['icon'], 15); // phpcs:ignore ?></a><?php endforeach; ?>
                </div>
                <?php echo $content; // phpcs:ignore — the_content output, already filtered ?>
                <?php $tags = get_the_tags(); $cats = get_the_category(); if ($tags || $cats) : ?>
                    <div class="art-tags">
                        <?php foreach ((array) $cats as $c) if ($c->slug !== 'uncategorized') echo '<a class="btn btn-sm" href="' . esc_url(get_category_link($c)) . '">' . esc_html($c->name) . '</a>'; ?>
                        <?php foreach ((array) $tags as $t) echo '<a class="btn btn-sm" href="' . esc_url(get_tag_link($t)) . '">' . esc_html($t->name) . '</a>'; ?>
                    </div>
                <?php endif; ?>
                <?php if ($original) : ?><a href="<?php echo esc_url($original); ?>" class="k orig-link" target="_blank" rel="noopener nofollow">Original reporting ↗</a><?php endif; ?>
            </div>
        </div>
    </article>

    <?php
    $related = xft_query_posts(['posts_per_page' => 3, 'post__not_in' => [$post->ID], 'cat' => $cat ? $cat->term_id : 0]);
    if (count($related) < 3) {
        $related = xft_query_posts(['posts_per_page' => 3, 'post__not_in' => [$post->ID]]);
    }
    if ($related) : ?>
        <section class="wrap" style="max-width:1120px;padding-top:88px">
            <div class="sh"><h2>Keep reading</h2><a href="<?php echo esc_url(xft_page_url('news', 'news')); ?>" class="k">All stories →</a></div>
            <div class="grid-cards" style="padding-top:24px;gap:28px 24px">
                <?php foreach ($related as $p) : ?>
                    <a href="<?php echo esc_url(get_permalink($p)); ?>" style="display:block"><?php echo xft_image($p, '3x2'); // phpcs:ignore ?><span class="tag" style="display:block;margin-top:12px"><?php echo esc_html(xft_cat_name($p)); ?></span><span class="card-title"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></span></a>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endif; ?>
<?php endwhile;
get_footer();
