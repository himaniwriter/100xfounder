<?php
/** Funding tracker rows: a table on desktop and stacked rows on mobile. Expects $args['rounds']. */
$rounds = $args['rounds'] ?? [];
$data = array_map(function ($r) {
    return [
        'url' => get_permalink($r),
        'age' => xft_age($r) . ' ago',
        'co' => get_post_meta($r->ID, '_xf_company', true) ?: get_the_title($r),
        'sector' => get_post_meta($r->ID, '_xf_sector', true),
        'round' => get_post_meta($r->ID, '_xf_round', true),
        'lead' => get_post_meta($r->ID, '_xf_lead_investor', true) ?: '—',
        'amt' => get_post_meta($r->ID, '_xf_amount_display', true) ?: 'Undisclosed',
    ];
}, $rounds);
?>
<div class="ft-m">
    <?php foreach ($data as $r) : ?>
        <a href="<?php echo esc_url($r['url']); ?>" class="row"><span style="font-weight:600;font-size:16px"><?php echo esc_html($r['co']); ?></span><span class="mono" style="font-size:16px;text-align:right"><?php echo esc_html($r['amt']); ?></span><span style="font-size:13px;color:var(--t2)"><?php echo esc_html(trim($r['round'] . ' · ' . $r['lead'], ' ·')); ?></span><span class="mono" style="font-size:11px;color:var(--t3);text-align:right"><?php echo esc_html($r['age']); ?></span></a>
    <?php endforeach; ?>
</div>
<div class="ft-table" style="overflow-x:auto">
    <div style="min-width:720px">
        <div class="k ft-head"><span>When</span><span>Company</span><span>Sector</span><span>Round</span><span>Lead investor</span><span style="text-align:right">Amount</span></div>
        <?php foreach ($data as $r) : ?>
            <a href="<?php echo esc_url($r['url']); ?>" class="row ft-row"><span class="mono" style="font-size:12px;color:var(--t3)"><?php echo esc_html($r['age']); ?></span><span class="co"><?php echo esc_html($r['co']); ?></span><span class="sub"><?php echo esc_html($r['sector']); ?></span><span style="font-size:14px"><?php echo esc_html($r['round']); ?></span><span class="sub"><?php echo esc_html($r['lead']); ?></span><span class="mono" style="text-align:right"><?php echo esc_html($r['amt']); ?></span></a>
        <?php endforeach; ?>
    </div>
</div>
