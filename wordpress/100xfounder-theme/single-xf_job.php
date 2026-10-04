<?php
/** A job: facts, the company's own description, and a clear link to apply on their site. */
get_header();
while (have_posts()) :
    the_post();
    $id = get_the_ID();
    $terms = get_the_terms($id, 'xf_company');
    $company = $terms ? $terms[0] : null;
    $company_name = get_post_meta($id, '_xf_company_name', true) ?: ($company ? $company->name : '');
    $apply = get_post_meta($id, '_xf_apply_url', true);
    $expired = get_post_meta($id, '_xf_expired', true);
    $salary = function_exists('xf_job_salary_label') ? xf_job_salary_label($id) : '';
    $guide = $company && function_exists('xf_guide_for_company') ? xf_guide_for_company($company) : null;
    $fn = get_post_meta($id, '_xf_function', true);
    $city = get_post_meta($id, '_xf_city', true);
    ?>
    <section class="wrap job-head" style="padding-top:48px;padding-bottom:40px">
        <nav class="crumbs k in" aria-label="Breadcrumb"><a href="<?php echo esc_url(home_url('/jobs/')); ?>">Jobs</a><span>/</span><?php if ($company) : ?><a href="<?php echo esc_url(get_term_link($company)); ?>"><?php echo esc_html($company->name); ?></a><span>/</span><?php endif; ?><span style="color:var(--tx)"><?php echo esc_html(wp_trim_words(get_the_title(), 8)); ?></span></nav>
        <div style="margin-top:36px;display:flex;flex-wrap:wrap;gap:24px 48px;align-items:flex-end">
            <div style="flex:999 1 600px">
                <div class="k in" style="display:flex;gap:12px;align-items:center"><span class="av" style="width:36px;height:36px"><?php echo esc_html(xft_initials($company_name)); ?></span><span><span class="ac"><?php echo esc_html($company_name); ?></span> · <?php echo esc_html($fn); ?></span></div>
                <h1 class="page-title in" style="animation-delay:.06s"><?php the_title(); ?></h1>
            </div>
            <div class="in" style="flex:1 1 260px;display:flex;flex-direction:column;gap:10px;animation-delay:.12s">
                <?php if ($expired) : ?>
                    <div class="notice">This role is no longer open.</div>
                    <a class="btn" href="<?php echo esc_url($company ? get_term_link($company) : home_url('/jobs/')); ?>">See open roles</a>
                <?php elseif ($apply) : ?>
                    <a class="btn btn-w" style="height:48px" href="<?php echo esc_url($apply); ?>" target="_blank" rel="noopener nofollow">Apply on <?php echo esc_html($company_name); ?>’s site ↗</a>
                    <button class="btn" type="button" data-save="<?php echo (int) $id; ?>" style="height:44px">Save job</button>
                <?php endif; ?>
            </div>
        </div>
        <div class="facts in" style="margin-top:40px;animation-delay:.18s">
            <div><div class="k" style="font-size:10px">Location</div><div class="v"><?php echo esc_html(get_post_meta($id, '_xf_location', true) ?: $city); ?></div></div>
            <div><div class="k" style="font-size:10px">Workplace</div><div class="v"><?php echo esc_html(get_post_meta($id, '_xf_workplace', true) . ' · ' . get_post_meta($id, '_xf_type', true)); ?></div></div>
            <div><div class="k" style="font-size:10px">Level</div><div class="v"><?php echo esc_html(get_post_meta($id, '_xf_level', true) ?: '—'); ?></div></div>
            <div><div class="k" style="font-size:10px">Pay</div><div class="v mono"><?php echo esc_html($salary ?: 'Not disclosed'); ?></div></div>
            <div><div class="k" style="font-size:10px">Posted</div><div class="v"><?php echo esc_html(get_the_date('j M Y')); ?></div></div>
        </div>
    </section>
    <div class="hl"></div>
    <section class="wrap" style="padding-top:48px;display:flex;flex-wrap:wrap;gap:48px;align-items:flex-start">
        <div class="job-body" style="flex:999 1 560px;min-width:0">
            <?php the_content(); ?>
            <?php if ($apply && !$expired) : ?><p style="margin-top:32px"><a class="btn btn-w" href="<?php echo esc_url($apply); ?>" target="_blank" rel="noopener nofollow">Apply on <?php echo esc_html($company_name); ?>’s site ↗</a></p><?php endif; ?>
            <p class="k" style="font-size:10.5px;margin-top:20px">Listed from <?php echo esc_html($company_name); ?>’s official careers page · checked <?php echo esc_html(human_time_diff((int) get_post_meta($id, '_xf_last_seen', true) ?: get_post_time('U', true))); ?> ago. We're not affiliated with <?php echo esc_html($company_name); ?> and never charge candidates.</p>
        </div>
        <aside style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:32px">
            <?php if ($guide) : ?>
                <a class="card" style="min-height:0" href="<?php echo esc_url(get_permalink($guide)); ?>"><span class="k">Apply guide</span><span style="font-size:19px;font-weight:600;letter-spacing:-.02em">How to get hired at <?php echo esc_html($company_name); ?></span><span class="muted" style="font-size:14px">Process, interview rounds and tips.</span></a>
            <?php endif; ?>
            <a class="card" style="min-height:0" href="<?php echo esc_url(home_url('/tools/in-hand-salary-calculator/')); ?>"><span class="k">Free tool</span><span style="font-size:19px;font-weight:600;letter-spacing:-.02em">What would this pay in hand?</span><span class="muted" style="font-size:14px">Turn a CTC into monthly take-home under either tax regime.</span></a>
            <?php
            $mq = [['key' => '_xf_function', 'value' => $fn]];
            if ($city) $mq[] = ['key' => '_xf_city', 'value' => $city];
            $similar = get_posts(['post_type' => 'xf_job', 'posts_per_page' => 5, 'post__not_in' => [$id], 'meta_query' => $mq]);
            if ($similar) : ?>
                <div><div class="sh"><h2 style="font-size:18px">Similar roles</h2></div>
                    <?php foreach ($similar as $s) : ?><a class="row" href="<?php echo esc_url(get_permalink($s)); ?>" style="display:block;padding:14px 0;border-bottom:1px solid var(--ln)"><span style="display:block;font-weight:600;font-size:15px"><span class="u"><?php echo esc_html(get_the_title($s)); ?></span></span><span style="display:block;font-size:13px;color:var(--t2);margin-top:2px"><?php echo esc_html(get_post_meta($s->ID, '_xf_company_name', true) . ' · ' . get_post_meta($s->ID, '_xf_city', true)); ?></span></a><?php endforeach; ?>
                </div>
            <?php endif; ?>
        </aside>
    </section>
<?php endwhile;
get_footer();
