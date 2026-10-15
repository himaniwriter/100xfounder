<?php
/**
 * /tools/startup-100x-score/: the founder quiz (scoring in assets/js/tools.js),
 * the optional email report, and the explainer and FAQ under it.
 */
$img = function ($file) { return function_exists('xf_brand_asset') ? xf_brand_asset($file) : ''; };
?>
<section class="wrap tool-grid" data-tool="meter100x">
    <div class="tool-in xf-quiz" data-quiz aria-label="Ten questions about your startup"><p class="muted">Loading the questions…</p></div>
    <div class="result xf-quiz__card" aria-live="polite">
        <div class="k">Your startup score · <span data-q-answered>0</span> of 10 answered</div>
        <div class="xf-meter__gauge" style="max-width:300px">
            <?php echo function_exists('xf_meter_gauge_svg') ? xf_meter_gauge_svg(0) : ''; // phpcs:ignore -- static markup ?>
            <div class="xf-meter__read"><div class="xf-meter__num"><span data-q-score>0</span>X</div><div class="k xf-meter__sub" data-q-band>Answer all 10</div></div>
        </div>
        <div data-q-done hidden>
            <div class="k" style="margin-bottom:8px">Your three biggest levers</div>
            <ol class="xf-quiz__tips" data-q-tips></ol>
            <div class="xf-quiz__share">
                <button type="button" class="btn btn-w btn-sm" data-q-png>Download score card (PNG)</button>
                <?php echo function_exists('xf_share_bar_html') ? xf_share_bar_html(home_url('/tools/startup-100x-score/'), 'How 100X is your startup? Take the free 100X score on 100xFounder.', 'quiz', ['compact' => true]) : ''; // phpcs:ignore -- escaped inside ?>
            </div>
            <details class="xf-quiz__mail">
                <summary class="k">Email me the full report</summary>
                <form data-q-mail data-endpoint="<?php echo esc_url(rest_url('xf/v1/score-report')); ?>" data-token="<?php echo esc_attr(function_exists('xf_join_token') ? xf_join_token() : ''); ?>">
                    <label class="k" for="q-name">Name (optional)</label>
                    <input class="xf-quiz__in" id="q-name" name="name" autocomplete="name" maxlength="80">
                    <label class="k" for="q-email">Email</label>
                    <input class="xf-quiz__in" id="q-email" name="email" type="email" autocomplete="email" required>
                    <input class="xf-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
                    <label class="xf-quiz__ck"><input type="checkbox" name="consent_request" required> <?php echo esc_html(function_exists('xf_score_consent_request') ? xf_score_consent_request() : ''); ?></label>
                    <label class="xf-quiz__ck"><input type="checkbox" name="consent_news"> <?php echo esc_html(function_exists('xf_join_consent_email') ? xf_join_consent_email() : ''); ?> (Optional.)</label>
                    <button type="submit" class="btn btn-w btn-sm">Email my report</button>
                    <p class="k" data-q-mail-msg role="status" style="text-transform:none;letter-spacing:0"></p>
                </form>
            </details>
        </div>
    </div>
</section>

<section class="wrap" style="padding-top:64px">
    <div class="prose">
        <h2>What the 100X score measures</h2>
        <p>The 100X score is a quick, honest check-up for founders. Ten questions cover the things that decide whether an early startup can grow ten or a hundred times: how far along the product is, whether people pay, how fast you are growing, whether users stay, who is on the team, how customers find you, how much runway you have, what protects you from copycats, how big the market is, and how quickly you ship. Each answer adds points, and the total is shown on a meter from 0X to 100X.</p>
        <p>It is not a valuation and it is not what an investor would say. It is a way to see your startup the way a careful outsider might, in about two minutes, and to spot the two or three areas where a little work would move you furthest. Everything runs in your browser. Your answers are not sent anywhere unless you ask us to email the report.</p>

        <figure class="xf-figure">
            <img src="<?php echo esc_url($img('meter-gauge.jpg')); ?>" alt="A semicircle meter from 0X to 100X with its needle in the traction band, and the four bands labelled early, traction, scaling and breakout" width="1600" height="1000" loading="lazy" decoding="async">
            <figcaption>The meter and its four bands. Graphic: 100xFounder.</figcaption>
        </figure>

        <h2>How the score is worked out</h2>
        <p>Each of the ten areas has a maximum number of points, and the maximums add up to 100. Growth carries the most weight (14 points), because steady month-on-month growth is the clearest sign that something is working. Revenue and retention follow with 12 points each: money shows people value the product, and retention shows they keep valuing it. Stage, team and distribution are worth 10 points each. Market size and shipping speed are worth 9, your moat is worth 8 and runway is worth 6. Funding sits lowest on purpose: money buys time, but it doesn't prove demand.</p>
        <p>The bands on the meter are a rough guide. Under 30X usually means the idea is still being tested. From 30X to 60X there is real traction, often with one or two weak spots. From 60X to 85X a startup is scaling, and above 85X it shows most of the signs of a breakout company. Two founders with the same score can be in very different places, so read the three levers under your score, not just the number.</p>

        <figure class="xf-figure">
            <img src="<?php echo esc_url($img('meter-factors.jpg')); ?>" alt="Ten horizontal bars labelled stage, revenue, growth, retention, team, distribution, funding, moat, market and speed" width="1600" height="1000" loading="lazy" decoding="async">
            <figcaption>The ten areas the score weighs. The bar lengths are an illustration, not anyone’s real result. Graphic: 100xFounder.</figcaption>
        </figure>

        <h2>Turning the score into a plan</h2>
        <p>After the tenth answer, the tool picks the three areas where you scored lowest against what was possible and shows one practical next step for each. If retention is weak, for example, it suggests talking to the users who left before building anything new. If distribution is weak, it suggests finding out where your last twenty customers came from and doubling down on that one source. The aim is a short to-do list, not a lecture.</p>
        <p>Take the quiz again every month or so. A rising score is a simple record that the work is paying off, and a falling one is an early warning. You can download your result as a score card sized for Instagram and LinkedIn, or share a link on WhatsApp, X or LinkedIn so co-founders and mentors can take it too.</p>

        <h2>Where the meter on startup pages fits in</h2>
        <p>Every startup listed on 100xFounder also has a 100X Meter on its page. That one works differently: readers push it up with one tap a day, so it shows how much buzz a launch has with our readers this month. It isn’t a rating. Star ratings on those pages come only from visitors’ own votes. Founders can embed their meter on their own site with a small badge that links back to their listing. Read <a href="<?php echo esc_url(home_url('/100x-meter/')); ?>">What is the 100X Meter?</a> for how taps and stages work, or see who readers are backing on the <a href="<?php echo esc_url(home_url('/leaderboard/')); ?>">startup leaderboard</a>.</p>

        <h2>FAQ</h2>
        <h3>Is the 100X score free?</h3>
        <p>Yes. There is nothing to sign up for, and the score appears as soon as you answer the tenth question.</p>
        <h3>Do you store my answers?</h3>
        <p>No. The scoring runs in your browser. If you choose “Email me the full report”, we save your email, your score, the three tips and the consent wording you ticked, so we can send the report and show what you agreed to. The newsletter box is separate and optional.</p>
        <h3>Is a high score a sign that investors will fund me?</h3>
        <p>No. The score is a self-assessment built from your own answers. Investors weigh many things it can’t see, such as the founders’ track record, the round terms and timing. Use it to decide where to focus, not to predict a raise.</p>
        <h3>Why is funding worth so few points?</h3>
        <p>Because raising money doesn’t prove that customers want the product. Runway matters, since it buys time to find growth, but growth, revenue and retention say more about where a startup is heading.</p>
        <h3>How is this different from the 100X Meter on startup pages?</h3>
        <p>This quiz scores your own startup from your answers. The meter on a listing counts reader taps over the last 30 days, one per reader per day. Neither is a star rating.</p>
        <h3>Can I share my result?</h3>
        <p>Yes. Download the PNG score card, or use the WhatsApp, X and LinkedIn buttons. The links point to this tool, not to your answers.</p>
    </div>
</section>
