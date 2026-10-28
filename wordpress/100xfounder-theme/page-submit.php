<?php
/** "Send us your story": five submission types, reviewed by an editor. */
get_header();
$types = function_exists('xf_submission_types') ? xf_submission_types() : [];
$current = isset($_GET['type'], $types[$_GET['type']]) ? sanitize_key($_GET['type']) : 'article';
$cur = $types[$current] ?? ['label' => 'Article', 'title' => 'Headline', 'title_ph' => '', 'body' => 'Your article', 'body_ph' => ''];
$sent = isset($_GET['sent']);
$error = isset($_GET['xf_error']) ? sanitize_text_field(wp_unslash($_GET['xf_error'])) : '';
$ig = xft_plugin() ? xf_get_setting('instagram_handle') : '';
?>
<section class="wrap" style="padding-top:64px;padding-bottom:40px;display:flex;flex-wrap:wrap;gap:24px 64px;align-items:flex-end">
    <div style="flex:999 1 560px"><div class="k in">Contribute</div><h1 class="page-title in" style="animation-delay:.06s">Send us your story.</h1></div>
    <p class="in" style="flex:1 1 300px;margin:0;font-size:16px;line-height:1.6;color:var(--t2);animation-delay:.12s">Every submission is read by an editor. Accepted pieces go on <?php echo esc_html(get_bloginfo('name')); ?><?php echo $ig ? ', and standout founders get featured on @' . esc_html($ig) : ''; ?>.</p>
</section>
<div class="hl"></div>

<section class="wrap" id="submit-form" style="padding-top:48px;padding-bottom:40px">
<?php if (!$types) : ?>
    <div class="notice">Submissions open soon. Meanwhile, email us at <?php echo esc_html(get_option('admin_email')); ?>.</div>
<?php elseif ($sent) : ?>
    <div class="notice notice-ok" role="status"><strong>Thank you!</strong> An editor will read your submission and reply within 48 hours.</div>
<?php else : ?>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data" style="display:flex;flex-wrap:wrap;gap:48px;align-items:flex-start">
        <input type="hidden" name="action" value="xf_submit">
        <?php wp_nonce_field('xf_submit', 'xf_nonce'); ?>
        <div style="flex:1 1 300px;min-width:0">
            <fieldset style="border:0;padding:0;margin:0">
                <legend class="k" style="margin-bottom:14px">What are you sending?</legend>
                <div class="tys" style="display:flex;flex-direction:column;gap:10px">
                    <?php foreach ($types as $key => $t) : ?>
                        <label class="ty<?php echo $key === $current ? ' on' : ''; ?>">
                            <input type="radio" name="type" value="<?php echo esc_attr($key); ?>" <?php checked($key, $current); ?> data-sub-type data-label="<?php echo esc_attr($t['label']); ?>" data-title="<?php echo esc_attr($t['title']); ?>" data-title-ph="<?php echo esc_attr($t['title_ph']); ?>" data-body="<?php echo esc_attr($t['body']); ?>" data-body-ph="<?php echo esc_attr($t['body_ph']); ?>">
                            <span class="lbl"><?php echo esc_html($t['label']); ?></span><span class="sub"><?php echo esc_html($t['sub']); ?></span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </fieldset>
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid var(--ln)">
                <div class="k" style="font-size:10.5px;margin-bottom:10px">Editorial guidelines</div>
                <p style="margin:0;font-size:14px;line-height:1.65;color:var(--t2)">Original work only. No paid placements disguised as news. Claims about funding or revenue need a source. We reply within 48 hours. Paid listings and sponsored articles are always labelled; see <a href="<?php echo esc_url(xft_page_url('advertise', 'advertise')); ?>" style="border-bottom:1px solid var(--ln2)">Advertise</a>.</p>
            </div>
        </div>

        <div class="sform" style="flex:2 1 520px;min-width:0;display:flex;flex-direction:column;gap:22px;padding:32px;border:1px solid var(--ln);border-radius:12px">
            <div class="k" style="font-size:10.5px" data-f="form-title">New <?php echo esc_html(strtolower($cur['label'])); ?></div>
            <?php if ($error) : ?><div class="notice notice-err" role="alert"><?php echo esc_html($error); ?></div><?php endif; ?>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:18px">
                <div class="f"><label for="sub-name">Your name</label><input id="sub-name" name="name" required minlength="2" maxlength="120" placeholder="Full name" autocomplete="name"></div>
                <div class="f"><label for="sub-email">Work email</label><input id="sub-email" name="email" type="email" required placeholder="you@startup.com" autocomplete="email"></div>
            </div>
            <div class="f"><label for="sub-title"><?php echo esc_html($cur['title']); ?></label><input id="sub-title" name="title" required minlength="4" maxlength="200" placeholder="<?php echo esc_attr($cur['title_ph']); ?>"></div>
            <div class="f"><label for="sub-company">Company or startup</label><input id="sub-company" name="company" maxlength="200" placeholder="Name and website"></div>
            <div class="f"><label for="sub-body"><?php echo esc_html($cur['body']); ?></label><textarea id="sub-body" name="body" required minlength="20" maxlength="20000" placeholder="<?php echo esc_attr($cur['body_ph']); ?>"></textarea><span class="hint">Markdown supported. Links to sources help us publish faster.</span></div>
            <div class="f"><label for="sub-files">Images or documents</label><div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;min-height:96px;padding:12px;border:1px dashed var(--ln2);border-radius:8px;color:var(--t2);font-size:14px"><?php echo xft_icon('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>', 18); // phpcs:ignore ?>JPG, PNG, WebP or PDF, up to 5 files <input id="sub-files" type="file" name="files[]" multiple accept="image/jpeg,image/png,image/webp,application/pdf" style="width:auto;height:auto;padding:0;border:0;background:none;font-size:14px"></div></div>
            <?php if ($ig) : ?><label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--t2);line-height:1.5"><input type="checkbox" name="instagram" value="1" style="margin-top:3px;width:16px;height:16px;accent-color:#ff6a3d">Consider this for an Instagram feature on @<?php echo esc_html($ig); ?></label><?php endif; ?>
            <input type="text" name="website" tabindex="-1" autocomplete="off" class="xf-hp" aria-hidden="true">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--ln)">
                <span class="hint">Reviewed by an editor within 48 hours.</span>
                <button type="submit" class="btn btn-w" style="height:48px;padding:0 26px">Submit for review</button>
            </div>
        </div>
    </form>
<?php endif; ?>
</section>
<?php get_footer();
