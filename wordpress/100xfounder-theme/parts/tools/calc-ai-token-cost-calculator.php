<?php
/** Calculator for /tools/ai-token-cost-calculator/ (maths and wiring in assets/js/tools.js, data-tool="token"). */
?>
<section class="wrap tool-grid" data-tool="token">
    <div class="tool-in">
        <label class="k" for="tk-model">Model</label>
        <select id="tk-model" class="fld" style="font-size:16px;color:var(--tx)"><?php $p = include locate_template('parts/tools/prices.php'); foreach ($p['llm'] as $i => $m) : ?><option value="<?php echo (int) $i; ?>" data-in="<?php echo esc_attr($m[2]); ?>" data-cache="<?php echo esc_attr($m[3]); ?>" data-outp="<?php echo esc_attr($m[4]); ?>"<?php selected($m[1], 'Claude Sonnet 5.5'); ?>><?php echo esc_html($m[0] . ' · ' . $m[1]); ?></option><?php endforeach; ?></select>
        <label class="k" for="tk-in">Input tokens per call</label>
        <div class="fld"><input id="tk-in" inputmode="decimal" value="2000"></div>
        <label class="k" for="tk-out">Output tokens per call</label>
        <div class="fld"><input id="tk-out" inputmode="decimal" value="500"></div>
        <label class="k" for="tk-calls">Calls per day</label>
        <div class="fld"><input id="tk-calls" inputmode="decimal" value="1000"></div>
        <label class="k" for="tk-cache">Input served from cache (%)</label>
        <div class="fld"><input id="tk-cache" inputmode="decimal" value="0"></div>
        <label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--t2);margin-top:6px"><input id="tk-batch" type="checkbox"> Batch API (50% off, results within 24 hours)</label>
        <p class="k" style="text-transform:none;letter-spacing:0">Prices as of <?php echo esc_html(wp_date('j F Y', strtotime($p['checked']))); ?> from the official Anthropic, OpenAI and Google pricing pages.</p>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Cost per month (30 days)</div><div class="big" id="tk-month" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Cost per call</span><span class="mono" id="tk-call" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Cost per day</span><span class="mono" id="tk-day" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Cost per year</span><span class="mono" id="tk-year" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Rates used (per million tokens)</span><span class="mono" id="tk-rates" data-out></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">US dollars, before tax. Cache writes and tool fees aren't included.</p>
    </div>
</section>
