<?php
/** Calculator for /tools/gpu-cost-calculator/ (maths and wiring in assets/js/tools.js, data-tool="gpu"). */
?>
<section class="wrap tool-grid" data-tool="gpu">
    <div class="tool-in">
        <label class="k" for="gp-inst">Instance</label>
        <select id="gp-inst" class="fld" style="font-size:16px;color:var(--tx)"><?php $p = include locate_template('parts/tools/prices.php'); foreach ($p['gpu'] as $i => $g) : ?><option value="<?php echo (int) $i; ?>" data-price="<?php echo esc_attr($g[4]); ?>" data-gpus="<?php echo (int) $g[2]; ?>"<?php selected($g[1], 'p5.48xlarge'); ?>><?php echo esc_html($g[0] . ' · ' . $g[1] . ' · ' . $g[2] . '× ' . $g[3]); ?></option><?php endforeach; ?><option value="custom">Custom price</option></select>
        <div data-custom hidden style="flex-direction:column;gap:10px">
        <label class="k" for="gp-price">Price per instance-hour (USD)</label>
        <div class="fld"><span class="mono" style="color:var(--t3)">$</span><input id="gp-price" inputmode="decimal" value="" placeholder="e.g. 4.50"></div>
        <label class="k" for="gp-gpus">GPUs per instance</label>
        <div class="fld"><input id="gp-gpus" inputmode="decimal" value="1"></div>
        </div>
        <label class="k" for="gp-n">Instances</label>
        <div class="fld"><input id="gp-n" inputmode="decimal" value="1"></div>
        <label class="k" for="gp-hours">Hours a day</label>
        <div class="fld"><input id="gp-hours" inputmode="decimal" value="24"></div>
        <label class="k" for="gp-days">Days</label>
        <div class="fld"><input id="gp-days" inputmode="decimal" value="30"></div>
        <p class="k" style="text-transform:none;letter-spacing:0">On-demand Linux list prices, US East, as of <?php echo esc_html(wp_date('j F Y', strtotime($p['checked']))); ?>.</p>
    </div>
    <div class="result" aria-live="polite">
        <p class="tl-err" data-err role="alert" hidden></p>
        <div><div class="k">Total cost</div><div class="big" id="gp-total" data-out style="margin-top:12px">–</div></div>
        <div>
            <div class="br"><span style="color:var(--t2)">Price per GPU-hour</span><span class="mono" id="gp-per" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">GPU-hours</span><span class="mono" id="gp-gh" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">Instance-hours</span><span class="mono" id="gp-ih" data-out></span></div>
            <div class="br"><span style="color:var(--t2)">At this daily use, per 30-day month</span><span class="mono" id="gp-month" data-out></span></div>
        </div>
        <p style="font-size:14px;color:var(--t3)">US dollars, before tax. Spot, reserved and savings-plan prices are lower; storage and data transfer are extra.</p>
    </div>
</section>
