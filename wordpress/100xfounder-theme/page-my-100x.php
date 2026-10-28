<?php
/**
 * /my-100x/: the startups this browser backed on the 100X Meter. The list lives
 * only in localStorage and is drawn by theme.js ([data-my100x]); the page is
 * noindex, out of the sitemap and ad-free (includes/meter.php).
 */
get_header();
?>
<article class="page">
    <header class="wrap page-head">
        <div class="k in"><span class="ac">100X Meter</span> · Saved in this browser only</div>
        <h1 class="page-title in" style="animation-delay:.06s">Your 100X list</h1>
        <p class="muted in" data-my100x-sum style="font-size:18px;margin:16px 0 0;max-width:760px;animation-delay:.12s">The startups you backed, with their level today.</p>
    </header>
    <div class="hl"></div>
    <div class="wrap" style="padding-top:32px">
        <div class="xf-my" data-my100x data-endpoint="<?php echo esc_url(rest_url('xf/v1/meter-levels')); ?>">
            <div class="xf-lb__empty" data-my100x-empty hidden>
                <p class="xf-meter__eyebrow">Nothing here yet</p>
                <h2>Back a startup you believe in</h2>
                <p class="muted">Tap “100X it” on any startup page and it shows up here, with a note when it crosses a milestone after you backed it.</p>
                <p><a class="btn btn-w" href="<?php echo esc_url(home_url('/leaderboard/')); ?>">See the leaderboard</a> <a class="btn" href="<?php echo esc_url(home_url('/launches/')); ?>">Today's launches</a></p>
            </div>
            <ul class="xf-my__notes" data-my100x-notes></ul>
            <ol class="xf-lb__list" data-my100x-list></ol>
        </div>
        <p class="k" style="margin-top:32px;font-size:10.5px;line-height:1.7;max-width:720px;text-transform:none;letter-spacing:.02em">This list is kept only in your browser’s local storage. To show today’s levels the page asks our server for those startups by ID only; nothing ties the list to you, and clearing your browser data clears it. <a class="u" href="<?php echo esc_url(home_url('/100x-meter/')); ?>">How the 100X Meter works</a></p>
    </div>
</article>
<?php
get_footer();
