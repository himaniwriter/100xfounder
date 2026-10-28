<?php
/** Calculator for /tools/cofounder-equity-split-calculator/ (maths and wiring in assets/js/tools.js, data-tool="equity"). */
?>
<section class="wrap tool-grid" data-tool="equity">
    <div class="tool-in">
        <div class="k">Founders</div>
        <div class="seg" role="group" aria-label="Number of founders"><button type="button" data-n="2" aria-pressed="true">2</button><button type="button" data-n="3" aria-pressed="false">3</button><button type="button" data-n="4" aria-pressed="false">4</button></div>
        <p style="font-size:14px;color:var(--t2)">Score each founder 0–10 on each factor. Change a weight to say how much that factor matters to your team.</p>
        <div class="tl-eq" id="eq-grid"></div>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Founder A</div><div class="big" id="eq-a" data-out style="margin-top:12px">–</div></div>
        <div id="eq-rows"></div>
        <p style="font-size:14px;color:var(--t3)">A starting point for the conversation, not a verdict or legal advice. Put whatever you agree on a vesting schedule.</p>
    </div>
</section>
