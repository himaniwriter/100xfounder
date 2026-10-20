<?php
/** Calculator for /tools/runway-calculator/ (maths and wiring in assets/js/tools.js, data-tool="runway"). */
?>
<section class="wrap tool-grid" data-tool="runway">
    <div class="tool-in">
        <label class="k" for="rw-cash">Cash in the bank (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="rw-cash" inputmode="decimal" value="5000000"></div>
        <label class="k" for="rw-burn">Monthly gross burn (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="rw-burn" inputmode="decimal" value="1000000"></div>
        <label class="k" for="rw-rev">Monthly revenue (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="rw-rev" inputmode="decimal" value="400000"></div>
        <label class="k" for="rw-growth">Monthly revenue growth (%)</label>
        <div class="fld"><input id="rw-growth" inputmode="decimal" value="0"></div>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Runway</div><div class="big" id="rw-months" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Cash runs out around</span><span class="mono" id="rw-date" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Net burn per month</span><span class="mono" id="rw-net" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Runway with flat revenue</span><span class="mono" id="rw-simple" data-out></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">Burn is held flat; revenue grows at the rate you enter. Months are counted from today.</p>
    </div>
</section>
