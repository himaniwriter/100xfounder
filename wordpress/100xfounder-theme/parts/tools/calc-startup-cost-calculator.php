<?php
/** Calculator for /tools/startup-cost-calculator/ (maths and wiring in assets/js/tools.js, data-tool="startup"). */
?>
<section class="wrap tool-grid" data-tool="startup">
    <div class="tool-in">
        <p style="font-size:14px;color:var(--t2)">Enter your own quotes. Leave a line blank if it doesn't apply.</p>
        <div class="k">One-time costs (₹)</div>
        <label class="k" for="sc-o1">Company incorporation</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o1" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o2">Trademark</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o2" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o3">GST and other registrations</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o3" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o4">Laptops and equipment</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o4" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o5">Office deposit and setup</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o5" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o6">Website and branding</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o6" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o7">Legal and agreements</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o7" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-o8">Other one-time</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-o8" inputmode="decimal" value="" placeholder="0"></div>
        <div class="k" style="margin-top:12px">Monthly costs (₹)</div>
        <label class="k" for="sc-m1">Salaries</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m1" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-m2">Office rent</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m2" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-m3">Software tools</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m3" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-m4">Cloud hosting</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m4" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-m5">Marketing</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m5" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-m6">Accounting and compliance</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m6" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-m7">Other monthly</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sc-m7" inputmode="decimal" value="" placeholder="0"></div>
        <label class="k" for="sc-months">Months until revenue covers costs</label>
        <div class="fld"><input id="sc-months" inputmode="decimal" value="12"></div>
        <label class="k" for="sc-buffer">Contingency buffer (%)</label>
        <div class="fld"><input id="sc-buffer" inputmode="decimal" value="20"></div>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Cash you need</div><div class="big" id="sc-total" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">One-time costs</span><span class="mono" id="sc-one" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Monthly costs</span><span class="mono" id="sc-mon" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Running costs until revenue</span><span class="mono" id="sc-run" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Contingency buffer</span><span class="mono" id="sc-buf" data-out></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">No default prices: every amount is yours. Get quotes from your CA, landlord and vendors.</p>
    </div>
</section>
