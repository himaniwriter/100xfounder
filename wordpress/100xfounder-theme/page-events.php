<?php
/**
 * Startup events by city, with the communities that run them.
 *
 * Attendee counts are our own RSVPs only — we never show numbers from a platform
 * we cannot see. Community join links sit behind a consent gate (communities.php).
 */
get_header();

$cities = defined('XF_EVENT_CITIES') ? XF_EVENT_CITIES : ['Delhi NCR', 'Mumbai', 'Bengaluru'];
$city = isset($_GET['city']) ? sanitize_text_field(wp_unslash($_GET['city'])) : '';
if ($city && !in_array($city, $cities, true)) {
    $city = '';
}
$all = function_exists('xf_upcoming_events') ? xf_upcoming_events(100) : [];

// Group by the city buckets so Gurugram and Noida sit under Delhi NCR.
$by_city = [];
foreach ($all as $e) {
    $bucket = function_exists('xf_event_city_bucket')
        ? (xf_event_city_bucket(get_post_meta($e->ID, '_xf_city', true)) ?: xf_event_city_bucket(get_post_meta($e->ID, '_xf_venue', true)))
        : '';
    $by_city[$bucket ?: 'Elsewhere'][] = $e;
}
$events = $city ? ($by_city[$city] ?? []) : $all;
$communities = function_exists('xf_communities') ? xf_communities($city) : [];
$submit = add_query_arg('type', 'event', xft_page_url('submit', 'submit'));
$base = get_permalink();
?>
<section class="wrap" style="padding-top:56px">
    <div class="k in">Calendar · <?php echo esc_html(wp_date('F Y')); ?></div>
    <h1 class="page-title in" style="animation-delay:.06s"><?php echo $city ? esc_html('Startup events in ' . $city) : 'Startup events in India'; ?></h1>
    <p class="muted" style="max-width:760px;font-size:17px;line-height:1.6;margin:16px 0 0">Demo days, meetups and conferences across Delhi NCR, Mumbai, Bengaluru and the other big startup cities. Every event links to the organiser's own page to register, and we list the communities behind them so you can keep showing up after the event ends.</p>
</section>

<section class="wrap" style="padding-top:28px">
    <div class="city-tabs" role="navigation" aria-label="Cities">
        <a class="tab<?php echo $city === '' ? ' on' : ''; ?>" href="<?php echo esc_url($base); ?>">All cities <span class="k"><?php echo (int) count($all); ?></span></a>
        <?php foreach ($cities as $c) :
            $n = isset($by_city[$c]) ? count($by_city[$c]) : 0; ?>
            <a class="tab<?php echo $city === $c ? ' on' : ''; ?>" href="<?php echo esc_url(add_query_arg('city', rawurlencode($c), $base)); ?>"><?php echo esc_html($c); ?> <span class="k"><?php echo (int) $n; ?></span></a>
        <?php endforeach; ?>
    </div>
</section>

<section class="wrap" style="padding-top:40px;display:flex;flex-wrap:wrap;gap:48px">
    <div style="flex:999 1 620px;min-width:0">
        <div class="sh"><h2>Upcoming</h2><span class="k"><?php echo (int) count($events); ?> <?php echo count($events) === 1 ? 'event' : 'events'; ?><?php echo $city ? ' in ' . esc_html($city) : ''; ?></span></div>
        <?php if ($events) : foreach ($events as $e) :
            $id = $e->ID;
            $going = function_exists('xf_event_rsvp_count') ? xf_event_rsvp_count($id) : 0;
            $start = get_post_meta($id, '_xf_start', true);
            $venue = get_post_meta($id, '_xf_venue', true);
            $url = get_post_meta($id, '_xf_url', true) ?: get_permalink($e);
            $mine = !empty($_COOKIE['xf_rsvp_' . $id]);
            ?>
            <?php $pic = function_exists('xf_event_image') ? xf_event_image($id) : ['url' => '', 'credit' => '', 'theirs' => false]; ?>
            <article class="xf-event<?php echo $pic['url'] ? ' has-pic' : ''; ?>" id="rsvp">
                <?php if ($pic['url']) : ?>
                    <a class="xf-event__pic" href="<?php echo esc_url(get_permalink($e)); ?>">
                        <img src="<?php echo esc_url($pic['url']); ?>" alt="<?php echo esc_attr(get_the_title($e)); ?>" loading="lazy" referrerpolicy="no-referrer">
                        <?php if ($pic['credit']) : ?><span class="ph-credit"><?php echo esc_html(($pic['theirs'] ? 'Image: ' : '') . $pic['credit']); ?></span><?php endif; ?>
                    </a>
                <?php endif; ?>
                <div class="xf-event__date">
                    <span class="k"><?php echo esc_html($start ? wp_date('M', strtotime($start)) : ''); ?></span>
                    <span class="d"><?php echo esc_html($start ? wp_date('j', strtotime($start)) : '—'); ?></span>
                </div>
                <div class="xf-event__body">
                    <h3><a href="<?php echo esc_url(get_permalink($e)); ?>"><span class="u"><?php echo esc_html(get_the_title($e)); ?></span></a></h3>
                    <p class="k"><?php echo esc_html(implode(' · ', array_filter([
                        $start ? wp_date('D j M, g:i a', strtotime($start)) : '',
                        $venue ?: get_post_meta($id, '_xf_city', true),
                    ]))); ?></p>
                    <?php if (has_excerpt($e) || $e->post_content) : ?>
                        <p class="muted" style="font-size:15px;line-height:1.55;margin:8px 0 0"><?php echo esc_html(wp_trim_words(wp_strip_all_tags($e->post_excerpt ?: $e->post_content), 26)); ?></p>
                    <?php endif; ?>
                    <div class="xf-event__actions">
                        <a class="btn btn-w" href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener nofollow">Register on the organiser's page ↗</a>
                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline">
                            <input type="hidden" name="action" value="xf_rsvp">
                            <input type="hidden" name="event" value="<?php echo (int) $id; ?>">
                            <?php wp_nonce_field('xf_rsvp_' . $id, 'xf_rsvp_nonce'); ?>
                            <button class="btn" type="submit" <?php disabled($mine); ?>><?php echo $mine ? "You're going" : "I'm going"; ?></button>
                        </form>
                        <span class="k"><?php echo $going ? esc_html(sprintf(_n('%d person going from 100xFounder', '%d going from 100xFounder', $going), $going)) : 'Be the first to say you’re going'; ?></span>
                    </div>
                </div>
            </article>
        <?php endforeach; else : ?>
            <div style="padding:40px 0;color:var(--t2)">
                <p>No events listed <?php echo $city ? 'in ' . esc_html($city) : 'yet'; ?> right now. We add them from public calendars every day.</p>
                <p style="margin-top:12px"><a class="btn btn-w" href="<?php echo esc_url($submit); ?>">Submit an event</a></p>
            </div>
        <?php endif; ?>
    </div>

    <aside style="flex:1 1 320px;min-width:0">
        <div class="xf-subscribe" style="margin-top:0"><div class="k">Organising something?</div><div class="xf-subscribe__title">Get your event in front of founders and operators.</div><a class="btn btn-w" href="<?php echo esc_url($submit); ?>" style="margin-top:14px;width:100%">Submit an event</a></div>
        <div id="newsletter"><?php echo xft_newsletter('The week’s events, funding and launches in one email.'); // phpcs:ignore ?></div>
    </aside>
</section>

<?php if ($communities || !$city) : ?>
<div class="hl" style="margin-top:72px"></div>
<section class="wrap" style="padding-top:56px" id="communities">
    <div class="sh"><h2>Communities<?php echo $city ? esc_html(' in ' . $city) : ''; ?></h2><span class="k"><?php echo (int) count($communities); ?> listed</span></div>
    <p class="muted" style="max-width:760px;font-size:16px;line-height:1.6;margin:18px 0 0">The groups behind these events: where founders and operators actually talk between meetups. We list what the organiser has made public, and we check each link before it goes up.</p>

    <?php if ($communities) : ?>
        <?php if (isset($_GET['unlock']) && $_GET['unlock'] === 'done') : ?>
            <p class="xf-quote-ok" style="margin-top:20px">Thanks. The join links are below, and they'll stay visible on this browser.</p>
        <?php endif; ?>
        <?php echo function_exists('xf_community_gate_html') ? xf_community_gate_html($city) : ''; // phpcs:ignore ?>
        <div class="xf-communities">
            <?php foreach ($communities as $c) echo xf_community_card_html($c); // phpcs:ignore ?>
        </div>
    <?php else : ?>
        <p class="muted" style="margin-top:20px">We're building this list city by city. Run a community? <a class="u" href="<?php echo esc_url($submit); ?>">Tell us about it</a> and we'll check it and add it.</p>
    <?php endif; ?>
</section>
<?php endif; ?>

<?php get_footer();
