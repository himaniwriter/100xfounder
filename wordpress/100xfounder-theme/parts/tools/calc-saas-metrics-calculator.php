<?php
/** Calculator for /tools/saas-metrics-calculator/ (maths and wiring in assets/js/tools.js, data-tool="saas"). */
?>
<section class="wrap tool-grid" data-tool="saas">
    <div class="tool-in">
        <div class="seg tl-tabs" role="tablist" aria-label="Metric" style="flex-wrap:wrap"><button type="button" data-tab="ltv" aria-pressed="true">LTV:CAC</button><button type="button" data-tab="pay" aria-pressed="false">Payback</button><button type="button" data-tab="mrr" aria-pressed="false">MRR/ARR</button><button type="button" data-tab="churn" aria-pressed="false">Churn</button><button type="button" data-tab="nrr" aria-pressed="false">NRR</button><button type="button" data-tab="r40" aria-pressed="false">Rule of 40</button></div>
        <div data-pane="ltv pay" style="display:flex;flex-direction:column;gap:10px">
        <label class="k" for="sm-arpa">Revenue per customer per month (ARPA, ₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-arpa" inputmode="decimal" value="5000"></div>
        <label class="k" for="sm-gm">Gross margin (%)</label>
        <div class="fld"><input id="sm-gm" inputmode="decimal" value="80"></div>
        </div>
        <div data-pane="ltv" style="display:flex;flex-direction:column;gap:10px">
        <label class="k" for="sm-churn">Monthly customer churn (%)</label>
        <div class="fld"><input id="sm-churn" inputmode="decimal" value="3"></div>
        <label class="k" for="sm-spend">Sales and marketing spend in the period (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-spend" inputmode="decimal" value="400000"></div>
        <label class="k" for="sm-new">New customers won in the period</label>
        <div class="fld"><input id="sm-new" inputmode="decimal" value="10"></div>
        </div>
        <div data-pane="pay" hidden style="flex-direction:column;gap:10px">
        <label class="k" for="sm-cac">CAC per customer (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-cac" inputmode="decimal" value="40000"></div>
        </div>
        <div data-pane="mrr" hidden style="flex-direction:column;gap:10px">
        <label class="k" for="sm-cust">Paying customers</label>
        <div class="fld"><input id="sm-cust" inputmode="decimal" value="200"></div>
        <label class="k" for="sm-arpa2">ARPA per month (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-arpa2" inputmode="decimal" value="5000"></div>
        </div>
        <div data-pane="churn" hidden style="flex-direction:column;gap:10px">
        <label class="k" for="sm-start">Customers at the start of the month</label>
        <div class="fld"><input id="sm-start" inputmode="decimal" value="200"></div>
        <label class="k" for="sm-lost">Customers lost during the month</label>
        <div class="fld"><input id="sm-lost" inputmode="decimal" value="6"></div>
        </div>
        <div data-pane="nrr" hidden style="flex-direction:column;gap:10px">
        <label class="k" for="sm-mrr0">MRR from existing customers at the start (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-mrr0" inputmode="decimal" value="1000000"></div>
        <label class="k" for="sm-exp">Expansion MRR (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-exp" inputmode="decimal" value="150000"></div>
        <label class="k" for="sm-con">Contraction MRR (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-con" inputmode="decimal" value="50000"></div>
        <label class="k" for="sm-chm">Churned MRR (₹)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">₹</span><input id="sm-chm" inputmode="decimal" value="80000"></div>
        </div>
        <div data-pane="r40" hidden style="flex-direction:column;gap:10px">
        <label class="k" for="sm-growth">Revenue growth, year on year (%)</label>
        <div class="fld"><input id="sm-growth" inputmode="decimal" value="30"></div>
        <label class="k" for="sm-margin">Profit margin (%; negative for a loss)</label>
        <div class="fld"><input id="sm-margin" inputmode="decimal" value="15"></div>
        </div>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k" id="sm-label">LTV:CAC</div><div class="big" id="sm-main" data-out style="margin-top:12px">–</div></div>
        <div id="sm-rows"></div>
        <p style="font-size:14px;color:var(--t3)">Simple formulas, the kind most investors use for a first look. Use the same period for spend and new customers.</p>
    </div>
</section>
