<?php
/** "Launch your startup on 100xFounder — free": the form lives in the plugin (includes/launch.php); this is its layout. */
get_header();
if (!function_exists('xf_launch_validate')) : ?>
    <section class="wrap" style="padding:64px 0"><div class="notice">Launches open soon.</div></section>
<?php get_footer(); return; endif;

$state = $GLOBALS['xf_launch_state'] ?? [];
$claim = $state['claim'] ?? xf_launch_claim_from_request();
$errors = $state['errors'] ?? [];
$v = $state['data'] ?? [];
if (!$v && $claim) {
    $terms = wp_get_post_terms($claim->ID, 'xf_industry', ['fields' => 'ids']);
    $v = [
        'name' => $claim->post_title,
        'website' => get_post_meta($claim->ID, '_xf_website', true),
        'tagline' => get_post_meta($claim->ID, '_xf_tagline', true),
        'description' => mb_substr(trim(wp_strip_all_tags($claim->post_content)), 0, 1000),
        'industry' => $terms[0] ?? 0,
        'pricing_model' => get_post_meta($claim->ID, '_xf_pricing_model', true),
        'pricing_details' => get_post_meta($claim->ID, '_xf_pricing_details', true),
        'launch_date' => get_post_meta($claim->ID, '_xf_launch_date', true) ?: get_post_meta($claim->ID, '_xf_launch_day', true),
        'ph_url' => get_post_meta($claim->ID, '_xf_ph_url', true),
    ];
    $qa = json_decode((string) get_post_meta($claim->ID, '_xf_founder_qa', true), true);
    $v['qa'] = is_array($qa) && get_post_meta($claim->ID, '_xf_founder_qa_approved', true) ? (array) ($qa['answers'] ?? []) : [];
}
$val = function ($k) use ($v) { return (string) ($v[$k] ?? ''); };
$sent = isset($_GET['sent']) ? sanitize_key($_GET['sent']) : ''; // phpcs:ignore WordPress.Security.NonceVerification
$industries = get_terms(['taxonomy' => 'xf_industry', 'hide_empty' => false, 'orderby' => 'name']);
$dupe = $state['dupe'] ?? null;
$privacy = xft_page_url('privacy', 'privacy-policy');

/** The error under one field, and the attributes that tie it to its input. */
$err = function ($k) use ($errors) {
    return isset($errors[$k]) ? '<span class="lf-err" id="lf-err-' . esc_attr($k) . '">' . esc_html($errors[$k]) . '</span>' : '';
};
$aria = function ($k) use ($errors) {
    return isset($errors[$k]) ? ' aria-invalid="true" aria-describedby="lf-err-' . esc_attr($k) . '"' : '';
};
?>
<section class="wrap" style="padding-top:64px;padding-bottom:40px;display:flex;flex-wrap:wrap;gap:24px 64px;align-items:flex-end">
    <div style="flex:999 1 560px"><div class="k in">Launch · free</div><h1 class="page-title in" style="animation-delay:.06s"><?php echo $claim ? 'Update your listing.' : 'Launch your startup on 100xFounder.'; ?></h1></div>
    <p class="in" style="flex:1 1 300px;margin:0;font-size:16px;line-height:1.6;color:var(--t2);animation-delay:.12s">A free listing with your logo, screenshots and a link to your site, in front of founders and operators in India and beyond. We check every launch before it goes live.</p>
</section>
<div class="hl"></div>

<section class="wrap" id="launch-form" style="padding-top:48px;padding-bottom:56px">
<?php if ($sent) : ?>
    <div class="notice notice-ok" role="status"><strong>Thank you.</strong>
        <?php echo $sent === 'claim'
            ? 'We have your update. An editor checks every change before it reaches the page, usually within 3 days, and we will email you when it is done.'
            : 'We have your launch and sent a confirmation to your email. We check every launch before it goes live and will email you the link.'; ?>
        <a class="u" href="<?php echo esc_url(xft_page_url('directory', 'startups')); ?>">Browse startups →</a></div>
<?php else : ?>
    <form method="post" action="<?php echo esc_url($claim ? xf_launch_page_url(['claim' => $claim->post_name]) : xf_launch_page_url()); ?>#launch-form" enctype="multipart/form-data" class="lf">
        <input type="hidden" name="lf_go" value="1">
        <input type="hidden" name="lf_token" value="<?php echo esc_attr(xf_launch_token()); ?>">
        <?php if ($claim) : ?><input type="hidden" name="lf_claim" value="<?php echo (int) $claim->ID; ?>"><?php endif; ?>

        <div class="lf-side">
            <div class="k" style="font-size:10.5px;margin-bottom:12px">How it works</div>
            <ol class="lf-steps">
                <li><strong>Send your launch.</strong> Takes about five minutes.</li>
                <li><strong>We check it.</strong> Every launch is checked before it goes live, usually within 3 days.</li>
                <li><strong>You're live.</strong> We email you the link to share, and your users can leave reviews on the page.</li>
            </ol>
            <p class="hint" style="margin-top:20px;line-height:1.6">Listing is free. Your email, role and profile link stay private; your name appears only if you tick the box. Details you give are shown on the page as supplied by you. See our <a class="u" href="<?php echo esc_url($privacy); ?>">privacy policy</a>.</p>
        </div>

        <div class="sform lf-main">
            <?php if ($claim) : ?><div class="notice" role="note">You're updating <strong><?php echo esc_html($claim->post_title); ?></strong>. The live page stays as it is until an editor approves your changes. The logo and screenshots are optional here: add them only to replace what is there.</div><?php endif; ?>
            <?php if ($errors) : ?>
                <div class="notice notice-err" role="alert" tabindex="-1" id="lf-errors">
                    <?php if (isset($errors['form'])) : ?><?php echo esc_html($errors['form']); ?>
                    <?php elseif ($dupe) : ?>
                        <?php if ($dupe->post_status === 'publish') : ?>
                            <strong><?php echo esc_html($dupe->post_title); ?></strong> is already listed: <a class="u" href="<?php echo esc_url(get_permalink($dupe)); ?>"><?php echo esc_html(get_permalink($dupe)); ?></a>. If it's yours, <a class="u" href="<?php echo esc_url(xf_launch_page_url(['claim' => $dupe->post_name])); ?>">claim or update that listing</a> instead.
                        <?php else : ?>
                            A launch for this website is already waiting for review. We'll email the person who sent it. Questions? <a class="u" href="<?php echo esc_url(xft_page_url('contact', 'contact')); ?>">Contact us</a>.
                        <?php endif; ?>
                    <?php else : ?>Please fix the <?php echo count(array_diff_key($errors, ['files_again' => 1])) === 1 ? 'field' : 'fields'; ?> marked below.<?php endif; ?>
                    <?php if (isset($errors['files_again'])) : ?><br><?php echo esc_html($errors['files_again']); ?><?php endif; ?>
                </div>
            <?php endif; ?>

            <fieldset class="lf-set"><legend class="k">Your product</legend>
                <div class="lf-grid">
                    <div class="f"><label for="lf-name">Product name</label><input id="lf-name" name="lf_name" required minlength="2" maxlength="80" value="<?php echo esc_attr($val('name')); ?>"<?php echo $aria('name'); // phpcs:ignore ?>><?php echo $err('name'); // phpcs:ignore ?></div>
                    <div class="f"><label for="lf-website">Website</label><input id="lf-website" name="lf_website" type="url" required pattern="https://.*" placeholder="https://" value="<?php echo esc_attr($val('website')); ?>"<?php echo $aria('website'); // phpcs:ignore ?>><?php echo $err('website'); // phpcs:ignore ?></div>
                </div>
                <div class="f"><label for="lf-tagline">Tagline</label><input id="lf-tagline" name="lf_tagline" required minlength="5" maxlength="80" placeholder="What it does, in one line" value="<?php echo esc_attr($val('tagline')); ?>"<?php echo $aria('tagline'); // phpcs:ignore ?>><span class="hint">Up to 80 characters.</span><?php echo $err('tagline'); // phpcs:ignore ?></div>
                <div class="f"><label for="lf-description">What it does</label><textarea id="lf-description" name="lf_description" required minlength="100" maxlength="1000" placeholder="Who it is for, the problem it solves and how it works. Plain facts read best."<?php echo $aria('description'); // phpcs:ignore ?>><?php echo esc_textarea($val('description')); ?></textarea><span class="hint">100 to 1,000 characters.</span><?php echo $err('description'); // phpcs:ignore ?></div>
                <div class="lf-grid">
                    <?php if ($industries && !is_wp_error($industries)) : ?>
                        <div class="f"><label for="lf-industry">Category</label><select id="lf-industry" name="lf_industry" required<?php echo $aria('industry'); // phpcs:ignore ?>><option value="">Choose…</option>
                            <?php foreach ($industries as $t) : ?><option value="<?php echo (int) $t->term_id; ?>" <?php selected((int) $val('industry'), $t->term_id); ?>><?php echo esc_html($t->name); ?></option><?php endforeach; ?>
                        </select><?php echo $err('industry'); // phpcs:ignore ?></div>
                    <?php endif; ?>
                    <div class="f"><label for="lf-launch-date">Launch date</label><input id="lf-launch-date" name="lf_launch_date" type="date" required value="<?php echo esc_attr($val('launch_date')); ?>"<?php echo $aria('launch_date'); // phpcs:ignore ?>><?php echo $err('launch_date'); // phpcs:ignore ?></div>
                </div>
                <div class="lf-grid">
                    <div class="f"><label for="lf-pricing">Pricing model</label><select id="lf-pricing" name="lf_pricing_model" required<?php echo $aria('pricing_model'); // phpcs:ignore ?>><option value="">Choose…</option>
                        <?php foreach (xf_launch_pricing_models() as $k => $label) : ?><option value="<?php echo esc_attr($k); ?>" <?php selected($val('pricing_model'), $k); ?>><?php echo esc_html($label); ?></option><?php endforeach; ?>
                    </select><?php echo $err('pricing_model'); // phpcs:ignore ?></div>
                    <div class="f"><label for="lf-pricing-details">Pricing details <span class="hint">(optional)</span></label><input id="lf-pricing-details" name="lf_pricing_details" maxlength="200" placeholder="e.g. Free plan for small teams, paid plans per user" value="<?php echo esc_attr($val('pricing_details')); ?>"></div>
                </div>
                <div class="f"><label for="lf-ph">Product Hunt link <span class="hint">(optional)</span></label><input id="lf-ph" name="lf_ph_url" type="url" placeholder="https://www.producthunt.com/products/…" value="<?php echo esc_attr($val('ph_url')); ?>"<?php echo $aria('ph_url'); // phpcs:ignore ?>><?php echo $err('ph_url'); // phpcs:ignore ?></div>
                <div class="lf-grid">
                    <div class="f"><label for="lf-logo">Logo<?php echo $claim ? ' <span class="hint">(optional)</span>' : ''; ?></label><input id="lf-logo" class="lf-file" name="lf_logo" type="file" accept="image/png,image/jpeg,image/webp"<?php echo $claim ? '' : ' required'; ?><?php echo $aria('logo'); // phpcs:ignore ?>><span class="hint">PNG, JPG or WebP, square, at least 128×128, up to 1 MB.</span><?php echo $err('logo'); // phpcs:ignore ?></div>
                    <div class="f"><label for="lf-shots">Screenshots <span class="hint">(optional)</span></label><input id="lf-shots" class="lf-file" name="lf_shots[]" type="file" multiple accept="image/png,image/jpeg,image/webp"<?php echo $aria('shots'); // phpcs:ignore ?>><span class="hint">Up to 3, at least 640×360, up to 2 MB each.</span><?php echo $err('shots'); // phpcs:ignore ?></div>
                </div>
            </fieldset>

            <fieldset class="lf-set"><legend class="k">About you</legend>
                <div class="lf-grid">
                    <div class="f"><label for="lf-fname">Your name</label><input id="lf-fname" name="lf_founder_name" required minlength="2" maxlength="80" autocomplete="name" value="<?php echo esc_attr($val('founder_name')); ?>"<?php echo $aria('founder_name'); // phpcs:ignore ?>><?php echo $err('founder_name'); // phpcs:ignore ?></div>
                    <div class="f"><label for="lf-role">Your role</label><input id="lf-role" name="lf_founder_role" required minlength="2" maxlength="80" placeholder="e.g. Co-founder & CEO" autocomplete="organization-title" value="<?php echo esc_attr($val('founder_role')); ?>"<?php echo $aria('founder_role'); // phpcs:ignore ?>><?php echo $err('founder_role'); // phpcs:ignore ?></div>
                </div>
                <div class="lf-grid">
                    <div class="f"><label for="lf-email">Work email</label><input id="lf-email" name="lf_founder_email" type="email" required placeholder="you@yourstartup.com" autocomplete="email" value="<?php echo esc_attr($val('founder_email')); ?>"<?php echo $aria('founder_email'); // phpcs:ignore ?>><span class="hint">An address on your product's domain gets checked fastest.</span><?php echo $err('founder_email'); // phpcs:ignore ?></div>
                    <div class="f"><label for="lf-social">X or LinkedIn profile <span class="hint">(optional)</span></label><input id="lf-social" name="lf_founder_social" type="url" placeholder="https://www.linkedin.com/in/…" value="<?php echo esc_attr($val('founder_social')); ?>"<?php echo $aria('founder_social'); // phpcs:ignore ?>><?php echo $err('founder_social'); // phpcs:ignore ?></div>
                </div>
                <div class="f" role="radiogroup" aria-labelledby="lf-india-l"<?php echo $aria('india'); // phpcs:ignore ?>><span id="lf-india-l" style="font-size:14px;font-weight:500">Is the startup based in India?</span>
                    <div style="display:flex;gap:20px">
                        <label class="lf-check"><input type="radio" name="lf_india" value="yes" required <?php checked($val('india'), 'yes'); ?>> Yes</label>
                        <label class="lf-check"><input type="radio" name="lf_india" value="no" <?php checked($val('india'), 'no'); ?>> No</label>
                    </div><?php echo $err('india'); // phpcs:ignore ?></div>
                <label class="lf-check"><input type="checkbox" name="lf_show_name" value="1" <?php checked($val('show_name'), '1'); ?>> <span>Show my name and role on the listing as its founder.</span></label>
            </fieldset>

            <fieldset class="lf-set"><legend class="k">Founder Q&amp;A (optional)</legend>
                <p class="hint" style="margin:-6px 0 0;line-height:1.6">Answer any of these in your own words and we'll publish them on your listing as a short founder interview, credited to you. Up to 600 characters each. Links are removed.</p>
                <?php foreach (xf_launch_qa_questions() as $k => $q) : ?>
                    <div class="f"><label for="lf-qa-<?php echo esc_attr($k); ?>"><?php echo esc_html($q); ?></label><textarea id="lf-qa-<?php echo esc_attr($k); ?>" name="lf_qa_<?php echo esc_attr($k); ?>" maxlength="600" style="height:110px"<?php echo $aria('qa_' . $k); // phpcs:ignore ?>><?php echo esc_textarea((string) ($v['qa'][$k] ?? '')); ?></textarea><?php echo $err('qa_' . $k); // phpcs:ignore ?></div>
                <?php endforeach; ?>
                <label class="lf-check"><input type="checkbox" name="lf_qa_consent" value="1" <?php checked($val('qa_consent'), '1'); ?><?php echo $aria('qa_consent'); // phpcs:ignore ?>> <span><?php echo esc_html(xf_launch_qa_consent_text()); ?> <span class="hint">(needed if you answer any question)</span></span></label><?php echo $err('qa_consent'); // phpcs:ignore ?>
            </fieldset>

            <fieldset class="lf-set"><legend class="k">Confirm</legend>
                <label class="lf-check"><input type="checkbox" name="lf_consent" value="1" required <?php checked($val('consent'), '1'); ?><?php echo $aria('consent'); // phpcs:ignore ?>> <span><?php echo esc_html(xf_launch_consent_text()); ?></span></label><?php echo $err('consent'); // phpcs:ignore ?>
                <label class="lf-check"><input type="checkbox" name="lf_updates" value="1" <?php checked($val('updates'), '1'); ?>> <span><?php echo esc_html(xf_launch_updates_text()); ?> <span class="hint">(optional)</span></span></label>
            </fieldset>
            <input type="text" name="lf_company_fax" tabindex="-1" autocomplete="off" class="xf-hp" aria-hidden="true">

            <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--ln)">
                <span class="hint">Free. We'll email you when it's live.</span>
                <button type="submit" class="btn btn-w" style="height:48px;padding:0 26px"><?php echo $claim ? 'Send my update' : 'Launch for free'; ?></button>
            </div>
        </div>
    </form>
    <?php if ($errors) : ?><script>(function(){var e=document.getElementById('lf-errors');if(e)e.focus();})();</script><?php endif; ?>
<?php endif; ?>
</section>
<?php get_footer();
