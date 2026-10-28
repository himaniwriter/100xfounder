<?php
/** Calculator for /tools/esop-calculator/ (maths and wiring in assets/js/tools.js, data-tool="esop"). */
?>
<section class="wrap tool-grid" data-tool="esop">
    <div class="tool-in">
        <label class="k" for="es-granted">Options granted</label>
        <div class="fld"><input id="es-granted" inputmode="decimal" value="4800"></div>
        <label class="k" for="es-strike">Exercise price per share (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="es-strike" inputmode="decimal" value="10"></div>
        <label class="k" for="es-years">Vesting period (years)</label>
        <div class="fld"><input id="es-years" inputmode="decimal" value="4"></div>
        <label class="k" for="es-cliff">Cliff (months)</label>
        <div class="fld"><input id="es-cliff" inputmode="decimal" value="12"></div>
        <label class="k" for="es-months">Months you have worked since the grant</label>
        <div class="fld"><input id="es-months" inputmode="decimal" value="18"></div>
        <label class="k" for="es-fmv">Fair market value per share at exercise (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="es-fmv" inputmode="decimal" value="200"></div>
        <label class="k" for="es-exit">Illustrative sale price per share (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="es-exit" inputmode="decimal" value="500"></div>
        <label class="k" for="es-rate">Your income tax slab rate (%)</label>
        <div class="fld"><input id="es-rate" inputmode="decimal" value="30"></div>
        <label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--t2);margin-top:6px"><input id="es-long" type="checkbox" checked> Shares held over 24 months before the sale</label>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Value after exercise cost and tax</div><div class="big" id="es-net" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Vested options</span><span class="mono" id="es-vested" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Cost to exercise</span><span class="mono" id="es-ex" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Perquisite at exercise (taxed as salary)</span><span class="mono" id="es-perq" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Tax on the perquisite</span><span class="mono" id="es-perqtax" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Capital gain at sale</span><span class="mono" id="es-gain" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Tax on the gain</span><span class="mono" id="es-cgtax" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Sale value of vested shares</span><span class="mono" id="es-gross" data-out></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">Illustrative: the sale price is your assumption. 4% cess included, surcharge not. Not tax advice.</p>
    </div>
</section>
