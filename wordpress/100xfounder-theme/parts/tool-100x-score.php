<?php
/**
 * /tools/startup-100x-score/: the founder quiz (scoring in assets/js/tools.js),
 * and the optional email report. The explainer and FAQ are in parts/tools/startup-100x-score.php.
 */
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

