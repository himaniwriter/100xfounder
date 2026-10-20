<?php
/** Calculator for /tools/cap-table-calculator/ (maths and wiring in assets/js/tools.js, data-tool="captable"). */
?>
<section class="wrap tool-grid" data-tool="captable">
    <div class="tool-in">
        <label class="k" for="ct-founders">Founder shares</label>
        <div class="fld"><input id="ct-founders" inputmode="decimal" value="9000000"></div>
        <label class="k" for="ct-pool">Existing option pool (shares)</label>
        <div class="fld"><input id="ct-pool" inputmode="decimal" value="1000000"></div>
        <label class="k" for="ct-pre">Round pre-money valuation</label>
        <div class="fld"><input id="ct-pre" inputmode="decimal" value="20000000"></div>
        <label class="k" for="ct-inv">New money raised in the round</label>
        <div class="fld"><input id="ct-inv" inputmode="decimal" value="5000000"></div>
        <label class="k" for="ct-target">Option pool after the round (% of post-money)</label>
        <div class="fld"><input id="ct-target" inputmode="decimal" value="10"></div>
        <details style="margin-top:12px" open>
            <summary class="k" style="cursor:pointer">SAFEs converting in this round (leave blank if none)</summary>
            <div style="display:flex;flex-direction:column;gap:10px;padding-top:12px">
        <label class="k" for="ct-s1-amt">SAFE 1 amount</label>
        <div class="fld"><input id="ct-s1-amt" inputmode="decimal" value="1000000"></div>
        <label class="k" for="ct-s1-cap">SAFE 1 post-money cap</label>
        <div class="fld"><input id="ct-s1-cap" inputmode="decimal" value="10000000"></div>
        <label class="k" for="ct-s1-disc">SAFE 1 discount (%)</label>
        <div class="fld"><input id="ct-s1-disc" inputmode="decimal" value="0"></div>
        <label class="k" for="ct-s2-amt">SAFE 2 amount</label>
        <div class="fld"><input id="ct-s2-amt" inputmode="decimal" value="" placeholder="optional"></div>
        <label class="k" for="ct-s2-cap">SAFE 2 post-money cap</label>
        <div class="fld"><input id="ct-s2-cap" inputmode="decimal" value="" placeholder="optional"></div>
        <label class="k" for="ct-s2-disc">SAFE 2 discount (%)</label>
        <div class="fld"><input id="ct-s2-disc" inputmode="decimal" value="" placeholder="optional"></div>
            </div>
        </details>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Founders after the round</div><div class="big" id="ct-founders-after" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Price per share</span><span class="mono" id="ct-price" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Post-money valuation</span><span class="mono" id="ct-post" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Pool top-up (new shares)</span><span class="mono" id="ct-topup" data-out></span></div>
        </div>
        <div><div class="br k" style="font-size:10px"><span>Holder</span><span style="display:flex;gap:18px"><span style="width:70px;text-align:right">Before</span><span style="width:70px;text-align:right">After</span><span class="hs" style="width:110px;text-align:right">Shares after</span></span></div><div id="ct-rows"></div></div>
        <p style="font-size:14px;color:var(--t3)">Post-money SAFEs; the pool top-up comes out of the pre-money. A model for planning, not legal advice.</p>
    </div>
</section>
