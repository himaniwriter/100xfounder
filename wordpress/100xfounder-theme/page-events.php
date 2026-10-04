<?php
/** Startup events: upcoming events from our calendar and public feeds (reviewed). */
get_header();
$events = function_exists('xf_upcoming_events') ? xf_upcoming_events(40) : [];
$submit = add_query_arg('type', 'event', xft_page_url('submit', 'submit'));
?>
<section class="wrap" style="padding-top:56px">
    <div class="k in">Calendar</div>
    <h1 class="page-title in" style="animation-delay:.06s">Startup events</h1>
    <p class="muted" style="max-width:720px;font-size:17px;line-height:1.6;margin:16px 0 0">Demo days, meetups and conferences worth your time across India and beyond. Each event links to the organiser's own page to register.</p>
    <?php if (function_exists('xft_news_tabs')) : ?><nav class="tabs" aria-label="Sections" style="margin-top:28px"><?php foreach (xft_news_tabs() as $label => $url) : ?><a class="tab<?php echo $label === 'Events' ? ' on' : ''; ?>" href="<?php echo esc_url($url); ?>"><?php echo esc_html($label); ?></a><?php endforeach; ?></nav><?php endif; ?>
</section>
<section class="wrap" style="padding-top:48px;display:flex;flex-wrap:wrap;gap:48px">
    <div style="flex:999 1 600px;min-width:0">
        <div class="sh"><h2>Upcoming</h2><span class="k"><?php echo (int) count($events); ?> events</span></div>
        <?php if ($events) : foreach ($events as $e) echo xft_event_row($e); // phpcs:ignore
        else : ?><div style="padding:48px 0;color:var(--t2)">New events are added every day. Check back soon.</div><?php endif; ?>
    </div>
    <aside style="flex:1 1 300px;min-width:0">
        <div class="xf-subscribe" style="margin-top:0"><div class="k">Organising something?</div><div class="xf-subscribe__title">Get your event in front of founders and operators.</div><a class="btn btn-w" href="<?php echo esc_url($submit); ?>" style="margin-top:14px;width:100%">Submit an event</a></div>
        <div id="newsletter"><?php echo xft_newsletter('The week’s events, funding and launches in one email.'); // phpcs:ignore ?></div>
    </aside>
</section>
<?php get_footer();
