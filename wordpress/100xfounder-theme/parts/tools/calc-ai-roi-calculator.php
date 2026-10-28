<?php
/** Calculator for /tools/ai-roi-calculator/ (maths and wiring in assets/js/tools.js, data-tool="roi"). */
?>
<section class="wrap tool-grid" data-tool="roi">
    <div class="tool-in">
        <label class="k" for="roi-users">People using the tool</label>
        <div class="fld"><input id="roi-users" inputmode="decimal" value="10"></div>
        <label class="k" for="roi-hours">Hours saved per person per week</label>
        <div class="fld"><input id="roi-hours" inputmode="decimal" value="2"></div>
        <label class="k" for="roi-rate">Cost of an hour of their time (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="roi-rate" inputmode="decimal" value="1000"></div>
        <label class="k" for="roi-adopt">Share who actually use it (%)</label>
        <div class="fld"><input id="roi-adopt" inputmode="decimal" value="100"></div>
        <label class="k" for="roi-cost">Tool cost per person per month (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="roi-cost" inputmode="decimal" value="2000"></div>
        <label class="k" for="roi-setup">One-off setup cost (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="roi-setup" inputmode="decimal" value="50000"></div>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Net gain per month</div><div class="big" id="roi-net" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Value of time saved per month</span><span class="mono" id="roi-value" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Tool cost per month</span><span class="mono" id="roi-costm" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Hours saved per month</span><span class="mono" id="roi-hrs" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Payback on setup</span><span class="mono" id="roi-pay" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Year-one ROI</span><span class="mono" id="roi-year" data-out></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">Saved time is only worth money if it goes to other useful work. A month is 52 ÷ 12 weeks.</p>
    </div>
</section>
