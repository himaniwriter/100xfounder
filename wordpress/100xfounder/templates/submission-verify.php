<?php
/** Enter the 6-digit code emailed after a submission. Rendered by the plugin (submissions.php). */
if (!defined('ABSPATH')) {
    exit;
}
$token = preg_replace('/[^a-zA-Z0-9]/', '', (string) wp_unslash($_GET['xf_verify'] ?? ''));
$post = function_exists('xf_otp_post_by_token') ? xf_otp_post_by_token($token) : null;
$error = isset($_GET['xf_error']) ? sanitize_text_field(wp_unslash($_GET['xf_error'])) : '';
add_filter('wp_robots', function ($r) { $r['noindex'] = true; $r['nofollow'] = true; return $r; }, PHP_INT_MAX);
add_filter('pre_get_document_title', function () { return 'Verify your email | ' . get_bloginfo('name'); });

$email = $post ? (string) get_post_meta($post->ID, '_xf_email', true) : '';
// Show "a•••@domain.com" so the right inbox is obvious without printing the full address.
$masked = $email ? preg_replace('/^(.).*(@.*)$/', '$1•••$2', $email) : '';
get_header();
?>
<section class="wrap" style="padding-top:64px;padding-bottom:80px;max-width:560px">
    <div class="k"><span class="ac">Submit</span> · Step 2 of 2</div>
    <h1 class="display" style="margin-top:16px;font-size:clamp(32px,6vw,52px)">Check your email.</h1>
    <?php if (!$post) : ?>
        <p style="margin-top:16px;font-size:17px;line-height:1.6;color:var(--t2)">This verification link has expired or was already used. <a class="u" href="<?php echo esc_url(xf_page_url('submit') ?: home_url('/submit/')); ?>">Send your submission again</a>.</p>
    <?php else : ?>
        <p style="margin-top:16px;font-size:17px;line-height:1.6;color:var(--t2)">We sent a 6-digit code to <strong style="color:var(--tx)"><?php echo esc_html($masked); ?></strong>. Enter it below to send your submission to our editors. Nothing is reviewed or published until you do.</p>
        <?php if ($error) : ?><p class="notice" role="alert" style="margin-top:18px"><?php echo esc_html($error); ?></p><?php endif; ?>
        <?php if (!empty($_GET['resent'])) : ?><p class="notice" role="status" style="margin-top:18px">A new code is on its way.</p><?php endif; ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:24px;display:flex;flex-direction:column;gap:12px">
            <input type="hidden" name="action" value="xf_submit_verify">
            <input type="hidden" name="xf_verify" value="<?php echo esc_attr($token); ?>">
            <?php wp_nonce_field('xf_verify_' . $token, 'xf_nonce'); ?>
            <label class="k" for="xf-code">Verification code</label>
            <div class="fld"><input id="xf-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="123456" style="letter-spacing:.3em"></div>
            <button class="btn btn-w" type="submit" style="height:48px">Verify and send</button>
        </form>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:14px">
            <input type="hidden" name="action" value="xf_submit_verify">
            <input type="hidden" name="xf_verify" value="<?php echo esc_attr($token); ?>">
            <input type="hidden" name="resend" value="1">
            <?php wp_nonce_field('xf_verify_' . $token, 'xf_nonce'); ?>
            <button type="submit" class="k u" style="background:none;border:0;padding:8px 0;cursor:pointer;color:var(--t2)">Didn't get it? Send a new code</button>
        </form>
        <p class="k" style="margin-top:24px;font-size:10.5px;line-height:1.7">The code expires in 15 minutes. Check your spam folder. Unverified submissions are deleted after 24 hours.</p>
    <?php endif; ?>
</section>
<?php get_footer();
