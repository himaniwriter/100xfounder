<?php
/** "How to apply at {company}" (design: ApplyGuide.dc.html): facts, sourced process and tips, live roles. */
get_header();
while (have_posts()) :
    the_post();
    $id = get_the_ID();
    $company = function_exists('xf_guide_company') ? xf_guide_company($id) : null;
    $careers = get_post_meta($id, '_xf_careers_url', true) ?: ($company ? get_term_meta($company->term_id, 'xf_careers_url', true) : '');
    [$content, $toc] = xft_toc(apply_filters('the_content', get_the_content()));
    $roles = $company ? get_posts(['post_type' => 'xf_job', 'posts_per_page' => 8, 'tax_query' => [['taxonomy' => 'xf_company', 'terms' => $company->term_id]]]) : [];
    $facts = array_filter([
        'Hiring for' => get_post_meta($id, '_xf_hiring_for', true),
        'Process' => get_post_meta($id, '_xf_process_length', true),
        'Interview rounds' => get_post_meta($id, '_xf_rounds', true),
        'Open roles' => $company ? (string) $company->count : '',
    ]);
    ?>
    <section class="wrap" style="padding-top:48px;padding-bottom:40px">
        <nav class="crumbs k in" aria-label="Breadcrumb"><a href="<?php echo esc_url(home_url('/jobs/')); ?>">Jobs</a><span>/</span><a href="<?php echo esc_url(xft_page_url('guides', 'how-to-apply')); ?>">How to apply</a><span>/</span><span style="color:var(--tx)"><?php echo esc_html($company ? $company->name : wp_trim_words(get_the_title(), 6)); ?></span></nav>
        <div class="k in" style="margin-top:36px"><span class="ac">Apply guide</span> · Updated <?php echo esc_html(get_the_modified_date('j M Y')); ?> · <?php echo esc_html(xft_read_time($id)); ?></div>
        <h1 class="page-title in" style="animation-delay:.06s;max-width:900px"><?php the_title(); ?></h1>
        <?php if (has_excerpt()) : ?><p class="in" style="max-width:720px;margin-top:18px;font-size:19px;line-height:1.55;color:var(--t2);animation-delay:.1s"><?php echo esc_html(get_the_excerpt()); ?></p><?php endif; ?>
        <?php if ($facts) : ?>
            <div class="facts in" style="margin-top:36px;animation-delay:.16s">
                <?php foreach ($facts as $label => $v) : ?><div><div class="k" style="font-size:10px"><?php echo esc_html($label); ?></div><div class="v"><?php echo esc_html($v); ?></div></div><?php endforeach; ?>
            </div>
        <?php endif; ?>
    </section>
    <div class="hl"></div>
    <section class="wrap" style="padding-top:48px;display:flex;flex-wrap:wrap;gap:48px;align-items:flex-start">
        <article class="job-body entry" style="flex:999 1 560px;min-width:0">
            <?php echo $content; // phpcs:ignore -- filtered post content ?>
            <?php if ($careers) : ?><p style="margin-top:32px"><a class="btn btn-w" href="<?php echo esc_url($careers); ?>" target="_blank" rel="noopener nofollow">Official careers page ↗</a></p><?php endif; ?>
            <p class="k" style="font-size:10.5px;margin-top:24px;line-height:1.7">Independent guide written from public sources listed above. We're not affiliated with <?php echo esc_html($company ? $company->name : 'this company'); ?>, and hiring processes change: always follow the instructions in the official job post. Spot something wrong? <a class="u" href="<?php echo esc_url(home_url('/corrections/')); ?>">Send a correction</a>.</p>
        </article>
        <aside style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:32px;position:sticky;top:96px">
            <?php if ($toc) : ?>
                <nav aria-label="On this page"><div class="k" style="padding-bottom:8px;border-bottom:1px solid var(--ln)">On this page</div>
                    <?php foreach ($toc as $t) : ?><a class="opt" href="#<?php echo esc_attr($t['id']); ?>"><span><?php echo esc_html($t['text']); ?></span></a><?php endforeach; ?>
                </nav>
            <?php endif; ?>
            <?php if ($roles) : ?>
                <div><div class="sh"><h2 style="font-size:18px">Open roles</h2><?php if ($company) : ?><a class="k u" href="<?php echo esc_url(get_term_link($company)); ?>">All <?php echo (int) $company->count; ?> →</a><?php endif; ?></div>
                    <?php foreach ($roles as $r) : ?><a href="<?php echo esc_url(get_permalink($r)); ?>" style="display:block;padding:14px 0;border-bottom:1px solid var(--ln)"><span style="display:block;font-weight:600;font-size:15px"><span class="u"><?php echo esc_html(get_the_title($r)); ?></span></span><span style="display:block;font-size:13px;color:var(--t2);margin-top:2px"><?php echo esc_html(implode(' · ', array_filter([get_post_meta($r->ID, '_xf_function', true), get_post_meta($r->ID, '_xf_city', true)]))); ?></span></a><?php endforeach; ?>
                </div>
            <?php endif; ?>
            <a class="card" style="min-height:0" href="<?php echo esc_url(home_url('/tools/in-hand-salary-calculator/')); ?>"><span class="k">Free tool</span><span style="font-size:19px;font-weight:600;letter-spacing:-.02em">Got an offer?</span><span class="muted" style="font-size:14px">See what the CTC pays in hand each month.</span></a>
        </aside>
    </section>
<?php endwhile;
get_footer();
