<?php
/**
 * /join/: the Instagram link-in-bio page (owner, 2026-10-21). Every post's end slide
 * points here: the founders' WhatsApp community, the weekly 8am brief, a free launch,
 * and today's stories. Kept out of search and the sitemap (includes/indexing.php): it is a doorway, not content.
 */
get_header();
$wa = function_exists('xf_join_url') ? xf_join_url() : '';
$launch = function_exists('xft_page_url') ? xft_page_url('launch', 'launch') : home_url('/launch/');
$stories = function_exists('xft_query_posts') ? xft_query_posts(['posts_per_page' => 5]) : [];
?>
<article class="page jn">
    <header class="wrap jn-head">
        <img class="jn-logo" src="<?php echo esc_url(get_template_directory_uri() . '/assets/logo.png'); ?>" alt="100xFounder" width="161" height="24">
        <div class="k" style="color:var(--ac)">For founders only</div>
        <h1 class="page-title">Build <em>with</em> people who are building too</h1>
        <p class="muted">Funding rounds, launches and hiring news, first. And a private group of founders who share what is working. Free.</p>
    </header>

    <div class="wrap jn-list">
        <section class="jn-card">
            <div class="k">Private community</div>
            <h2>Founders' WhatsApp</h2>
            <p>Invite-only. Ask questions, share what worked, hire, and get warm intros.</p>
            <?php if ($wa) : ?>
                <a class="btn btn-w jn-btn" href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener">Join the WhatsApp community</a>
            <?php else : ?>
                <p class="k" style="margin-top:12px">Invites are opening soon. Join the 8am brief below and yours comes by email.</p>
            <?php endif; ?>
        </section>

        <section class="jn-card" id="brief">
            <?php echo xft_newsletter('New launches and funding rounds, once a week. Free, unsubscribe anytime.'); // phpcs:ignore -- escaped in the plugin ?>
        </section>

        <section class="jn-card">
            <div class="k">Building something?</div>
            <h2>Launch it free</h2>
            <p>Get listed on 100xFounder, get a founder spotlight, and get featured on our Instagram.</p>
            <a class="btn jn-btn" href="<?php echo esc_url($launch); ?>">Launch your startup</a>
        </section>

        <?php if ($stories) : ?>
        <section class="jn-card">
            <div class="k">Today on 100xFounder</div>
            <ul class="jn-stories">
                <?php foreach ($stories as $p) : ?>
                    <li><a href="<?php echo esc_url(get_permalink($p)); ?>"><span class="u"><?php echo esc_html(get_the_title($p)); ?></span></a></li>
                <?php endforeach; ?>
            </ul>
        </section>
        <?php endif; ?>
    </div>
</article>
<?php
get_footer();
