<?php
/**
 * /100x-meter/: what the 100X Meter on startup pages is, how taps count, the
 * stages, the badge and the anti-abuse rules. Static explainer; numbers on it
 * come from the meter's own formula (includes/meter.php), not from any startup.
 */
$img = function ($file) { return function_exists('xf_brand_asset') ? xf_brand_asset($file) : ''; };
get_header();
?>
<article class="page">
    <header class="wrap page-head">
        <div class="k in"><span class="ac">100X Meter</span> · How it works</div>
        <h1 class="page-title in" style="animation-delay:.06s">What is the 100X Meter?</h1>
        <p class="muted in" style="font-size:18px;margin:16px 0 0;max-width:760px;animation-delay:.12s">A small gauge on every startup page that readers push with one tap a day. It shows which launches people here are excited about right now. It is a buzz meter, not a review.</p>
        <?php if (function_exists('xf_share_bar_html')) echo '<div class="in" style="margin-top:20px;animation-delay:.16s">' . xf_share_bar_html(get_permalink(), get_the_title(), 'meter-explainer') . '</div>'; // phpcs:ignore -- escaped inside ?>
    </header>
    <div class="hl"></div>
    <div class="wrap" style="padding-top:40px">
        <div class="prose">
            <p>Every startup listed on 100xFounder has a 100X Meter near the top of its page. It runs from 0X to 100X. When a reader thinks a startup could go a hundred times bigger, they tap <b>100X it</b>, and the needle moves. That’s the whole idea: a quick, friendly way to cheer on the products you like and to see which ones other readers are backing.</p>

            <h2>How a tap works</h2>
            <p>You get one tap per startup per day. Tap a startup today and the button changes to “Counted today”; come back tomorrow and you can push it again. You can back as many different startups as you like. There’s no account and no sign-up. We don’t ask for your name or email to tap.</p>
            <p>The meter counts taps from the last 30 days, so it always reflects what is happening now. A launch that was busy three months ago and has gone quiet will drift back down, and a new product that readers love can climb quickly. The scale is gentle at the top: the first few taps move the needle a lot, and the last stretch to 100X needs real, steady support. One tap puts a startup at about 11X, ten taps at about 39X, and it takes 500 taps in 30 days to reach 100X.</p>

            <figure class="xf-figure">
                <img src="<?php echo esc_url($img('meter-one-tap.jpg')); ?>" alt="Seven day circles from Monday to Sunday, five lit with a lightning bolt and two empty, under the words one tap, one reader, one day" width="1600" height="1000" loading="lazy" decoding="async">
                <figcaption>One tap per reader per startup each day. A second tap on the same day is not counted. Graphic: 100xFounder.</figcaption>
            </figure>

            <figure class="xf-figure">
                <img src="<?php echo esc_url($img('meter-taps.jpg')); ?>" alt="A curve rising steeply then flattening: 1 tap is 11X, 10 taps 39X, 50 taps 63X, 100 taps 74X and 500 taps 100X" width="1600" height="1000" loading="lazy" decoding="async">
                <figcaption>How taps in the last 30 days turn into the meter level. These points come from the meter’s formula, not from any startup. Graphic: 100xFounder.</figcaption>
            </figure>

            <h2>The four stages</h2>
            <p>Next to the number, each meter shows a stage. The stages use the same bands as our <a href="<?php echo esc_url(home_url('/tools/startup-100x-score/')); ?>">startup 100X score quiz</a>, so a founder’s own score and a listing’s buzz speak the same language:</p>
            <ul>
                <li><b>Early</b> (0–29X): a few readers have noticed it. First believers matter most here.</li>
                <li><b>Traction</b> (30–59X): steady taps from different readers over the month.</li>
                <li><b>Scaling</b> (60–84X): one of the more backed startups on the site right now.</li>
                <li><b>Breakout</b> (85X and up): a lot of readers are pushing it, day after day.</li>
            </ul>

            <figure class="xf-figure">
                <img src="<?php echo esc_url($img('meter-gauge.jpg')); ?>" alt="A semicircle meter from 0X to 100X with the four bands labelled early, traction, scaling and breakout" width="1600" height="1000" loading="lazy" decoding="async">
                <figcaption>The meter and its four stages. Graphic: 100xFounder.</figcaption>
            </figure>

            <h2>It measures buzz, not quality</h2>
            <p>The meter tells you how many of our readers backed a startup in the past month. It doesn’t tell you whether the product is good, whether the company is healthy or whether you should buy, use or invest in it. A small team with a loyal community can outscore a bigger company that nobody here has heard of. Read the profile, the sources and the reviews before deciding anything.</p>
            <p>That’s also why the meter is not a rating. The star rating on a startup page comes only from visitors’ own 1–5 votes, and that is the only score we put in search-engine data. Meter taps never go into ratings or structured data.</p>

            <h2>Your 100X list and streaks</h2>
            <p>Your browser remembers the startups you backed, so you can see them again on <a href="<?php echo esc_url(home_url('/my-100x/')); ?>">your 100X list</a> along with their current level and a note when one crosses a milestone after you backed it. It also counts your streak: the number of days in a row you backed at least one startup. All of this stays in your browser’s local storage. To show today’s levels, the page asks our server for those startups by ID only, with nothing that ties the list to you. Clearing your browser data clears it.</p>

            <h2>For founders: the badge</h2>
            <p>If your startup is listed, you can show its live meter on your own site. Open your listing, find the meter, and click <b>Copy badge code</b>. Paste the snippet into your site’s HTML. The badge shows your current level and links back to your listing, so your visitors can tap too. It updates on its own about once an hour. You can’t buy taps or set the number yourself, and team members signed in to 100xFounder are not counted.</p>

            <h2>How we keep it fair</h2>
            <p>A meter is only fun if it’s honest, so a few rules run behind every tap:</p>
            <ul>
                <li>One tap per reader per startup per day, checked on our server, not just in your browser.</li>
                <li>Each tap button carries a signed token from the page we served, so a script can’t tap a page it never loaded. Taps sent within a few seconds of a page load are rejected.</li>
                <li>Search engine crawlers, bots and automated tools are ignored, and so are our own editors.</li>
                <li>A single connection can only send a limited number of taps an hour.</li>
                <li>We never add, seed or edit taps by hand. If we find a pattern of fake taps, we remove them.</li>
            </ul>
            <p>Want to see who readers are backing right now? Open the <a href="<?php echo esc_url(home_url('/leaderboard/')); ?>">startup leaderboard</a>.</p>

            <h2>FAQ</h2>
            <h3>Is the 100X Meter a rating or a review?</h3>
            <p>No. It counts reader taps in the last 30 days. It shows interest, not quality. Star ratings on startup pages come only from visitors’ own votes.</p>
            <h3>How many times can I tap?</h3>
            <p>Once per startup per day. You can back as many different startups as you like.</p>
            <h3>Do I need an account?</h3>
            <p>No. Tapping is anonymous. To stop repeat taps we keep a salted, one-way hash of your connection for the day, not your name or email.</p>
            <h3>Why did a startup’s level go down?</h3>
            <p>The meter only counts the last 30 days. When older taps pass the 30-day mark, they drop out and the level eases down unless new readers keep backing it.</p>
            <h3>Can founders pay to raise their meter?</h3>
            <p>No. Taps can’t be bought, and paid or sponsored listings get no extra taps. A sponsored listing is always labelled “Sponsored”.</p>
            <h3>How is this different from the 100X score quiz?</h3>
            <p>The <a href="<?php echo esc_url(home_url('/tools/startup-100x-score/')); ?>">100X score</a> is a self-assessment founders take about their own startup. The meter is what readers think of a listing this month. They share the same four stage names.</p>
            <h3>Where is my 100X list stored?</h3>
            <p>Only in your browser. It isn’t linked to you on our side, and it won’t follow you to another phone or browser.</p>
        </div>
    </div>
</article>
<?php
get_footer();
