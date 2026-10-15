<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Tool reviews: posts about one product (usually a Product Hunt launch).
 * A post becomes a review when it has `_xf_review` meta (sent as "review" in
 * a draft, or filled in the editor box). It then shows an at-a-glance box,
 * a coupons box once the owner adds a code, and Product + Review schema
 * built only from what that box shows on the page.
 * ---------------------------------------------------------------------- */

const XF_REVIEW_TEXT_FIELDS = ['name', 'url', 'ph_url', 'category', 'os', 'pricing_url', 'price', 'currency', 'billing', 'free_plan', 'checked', 'rating', 'verdict'];

/** Clean review data from a draft or the editor box. Empty when there's no product name. */
function xf_clean_review($in) {
    $in = is_array($in) ? $in : [];
    $out = [];
    foreach (XF_REVIEW_TEXT_FIELDS as $k) {
        $v = trim(sanitize_text_field((string) ($in[$k] ?? '')));
        if (in_array($k, ['url', 'ph_url', 'pricing_url'], true)) {
            $v = esc_url_raw($v);
        }
        $out[$k] = $v;
    }
    $out['price'] = is_numeric($out['price']) && $out['price'] >= 0 ? (string) (0 + $out['price']) : '';
    $out['currency'] = strtoupper(preg_replace('/[^A-Za-z]/', '', $out['currency'])) ?: 'USD';
    $out['free_plan'] = in_array($out['free_plan'], ['yes', 'no', 'trial'], true) ? $out['free_plan'] : '';
    $out['checked'] = preg_match('/^\d{4}-\d{2}-\d{2}$/', $out['checked']) ? $out['checked'] : '';
    $out['rating'] = is_numeric($out['rating']) ? (string) round(max(1, min(5, (float) $out['rating'])), 1) : '';
    foreach (['pros', 'cons'] as $k) {
        $list = is_array($in[$k] ?? null) ? $in[$k] : preg_split('/\R/', (string) ($in[$k] ?? ''));
        $out[$k] = array_values(array_filter(array_map(function ($s) { return trim(sanitize_text_field((string) $s)); }, $list)));
        $out[$k] = array_slice($out[$k], 0, 6);
    }
    return $out['name'] ? $out : [];
}

function xf_get_review($post_id) {
    $r = get_post_meta($post_id, '_xf_review', true);
    return is_array($r) && !empty($r['name']) ? $r : [];
}

function xf_save_review($post_id, $data) {
    $clean = xf_clean_review($data);
    $clean ? update_post_meta($post_id, '_xf_review', $clean) : delete_post_meta($post_id, '_xf_review');
}

/** Coupons the owner added that haven't expired. */
function xf_active_coupons($post_id) {
    $today = current_time('Y-m-d');
    return array_values(array_filter((array) get_post_meta($post_id, '_xf_coupons', true), function ($c) use ($today) {
        return is_array($c) && (!empty($c['code']) || !empty($c['url'])) && (empty($c['expires']) || $c['expires'] >= $today);
    }));
}

/* ---- On the page: at-a-glance box after the opening paragraph, coupons right after it ---- */

function xf_review_price_label(array $r) {
    $free = ['yes' => 'Free plan available', 'trial' => 'Free trial', 'no' => 'No free plan'][$r['free_plan']] ?? '';
    $paid = '';
    if ($r['price'] !== '') {
        $paid = (float) $r['price'] === 0.0 ? 'Free' : 'Paid from ' . $r['currency'] . ' ' . $r['price'] . ($r['billing'] ? ' ' . $r['billing'] : '');
    }
    return implode('; ', array_filter([$paid, $free]));
}

function xf_review_box_html($post_id) {
    $r = xf_get_review($post_id);
    if (!$r) {
        return '';
    }
    $rows = array_filter([
        'Product' => $r['url'] ? '<a href="' . esc_url($r['url']) . '" rel="noopener" target="_blank">' . esc_html($r['name']) . '</a>' : esc_html($r['name']),
        'Category' => esc_html(trim(preg_replace('/(?<=[a-z])(?=[A-Z])/', ' ', preg_replace('/Application$/', '', $r['category'])))),
        'Platforms' => esc_html($r['os']),
        'Pricing' => esc_html(xf_review_price_label($r)) . ($r['pricing_url'] ? ' (<a href="' . esc_url($r['pricing_url']) . '" rel="noopener" target="_blank">vendor pricing</a>' . ($r['checked'] ? ', checked ' . esc_html(mysql2date('j M Y', $r['checked'])) : '') . ')' : ''),
        'Product Hunt' => $r['ph_url'] ? '<a href="' . esc_url($r['ph_url']) . '" rel="noopener" target="_blank">Launch page</a>' : '',
        'Our score' => $r['rating'] !== '' ? '<strong>' . esc_html($r['rating']) . '/5</strong> <span class="xf-review-note">research score; see "How we scored it"</span>' : '',
    ]);
    $html = '<aside class="xf-review-box" aria-label="' . esc_attr($r['name'] . ' at a glance') . '"><p class="xf-review-kicker">At a glance</p><dl>';
    foreach ($rows as $label => $value) {
        $html .= '<div><dt>' . esc_html($label) . '</dt><dd>' . $value . '</dd></div>';
    }
    $html .= '</dl>';
    if ($r['verdict']) {
        $html .= '<p class="xf-review-verdict"><strong>Verdict:</strong> ' . esc_html($r['verdict']) . '</p>';
    }
    if ($r['pros'] || $r['cons']) {
        $html .= '<div class="xf-review-pc">';
        foreach (['pros' => 'Pros', 'cons' => 'Cons'] as $k => $label) {
            if ($r[$k]) {
                $html .= '<div><p class="xf-review-kicker">' . $label . '</p><ul>' . implode('', array_map(function ($s) { return '<li>' . esc_html($s) . '</li>'; }, $r[$k])) . '</ul></div>';
            }
        }
        $html .= '</div>';
    }
    return $html . '</aside>' . xf_coupons_box_html($post_id, $r['name']);
}

function xf_coupons_box_html($post_id, $name) {
    $coupons = xf_active_coupons($post_id);
    if (!$coupons) {
        return ''; // Nothing to show until the owner adds a real code or deal.
    }
    $html = '<aside class="xf-coupons" aria-label="' . esc_attr($name . ' coupons') . '"><p class="xf-review-kicker">' . esc_html($name) . ' coupons and deals</p><ul>';
    foreach ($coupons as $c) {
        $html .= '<li><span class="xf-coupon-desc">' . esc_html($c['description'] ?: 'Discount') . '</span>';
        if (!empty($c['code'])) {
            $html .= ' <code class="xf-coupon-code">' . esc_html($c['code']) . '</code>';
        }
        if (!empty($c['url'])) {
            $html .= ' <a class="xf-coupon-link" href="' . esc_url($c['url']) . '" rel="sponsored nofollow noopener" target="_blank">Get the deal</a>';
        }
        if (!empty($c['expires'])) {
            $html .= ' <span class="xf-coupon-exp">Valid until ' . esc_html(mysql2date('j M Y', $c['expires'])) . '</span>';
        }
        $html .= '</li>';
    }
    return $html . '</ul><p class="xf-coupon-disclosure">Disclosure: some deal links are affiliate links, and we may earn a commission if you buy. That never changes our review or score.</p></aside>';
}

add_filter('the_content', function ($content) {
    if (!is_singular('post') || !in_the_loop() || !is_main_query()) {
        return $content;
    }
    $box = xf_review_box_html(get_the_ID());
    if (!$box) {
        return $content;
    }
    $pos = stripos($content, '</p>');
    return $pos === false ? $box . $content : substr_replace($content, $box, $pos + 4, 0);
}, 12);

/* ---- Schema: the product, with our editorial review nested (Google's product-review format) ---- */

add_action('wp_head', function () {
    if (!is_singular('post')) {
        return;
    }
    $post = get_post();
    $r = xf_get_review($post->ID);
    if (!$r) {
        return;
    }
    $notes = function ($list) {
        return ['@type' => 'ItemList', 'itemListElement' => array_map(function ($s, $i) { return ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $s]; }, $list, array_keys($list))];
    };
    $review = array_filter([
        '@type' => 'Review',
        'name' => xf_schema_text(get_the_title($post)),
        'url' => get_permalink($post),
        'datePublished' => get_the_date('c', $post),
        'author' => ['@type' => 'Person', 'name' => get_the_author_meta('display_name', (int) $post->post_author), 'url' => get_author_posts_url((int) $post->post_author)],
        'publisher' => xf_publisher_schema(),
        'reviewBody' => $r['verdict'] ?: null,
        'reviewRating' => $r['rating'] !== '' ? ['@type' => 'Rating', 'ratingValue' => $r['rating'], 'bestRating' => '5', 'worstRating' => '1'] : null,
        'positiveNotes' => $r['pros'] ? $notes($r['pros']) : null,
        'negativeNotes' => $r['cons'] ? $notes($r['cons']) : null,
    ]);
    $offers = null;
    if ($r['price'] !== '') {
        $offers = array_filter(['@type' => 'Offer', 'price' => $r['price'], 'priceCurrency' => $r['currency'], 'url' => $r['pricing_url'] ?: ($r['url'] ?: null), 'availability' => 'https://schema.org/InStock']);
    }
    xf_json_ld(array_filter([
        '@context' => 'https://schema.org',
        '@type' => ['Product', 'SoftwareApplication'],
        'name' => $r['name'],
        'url' => $r['url'] ?: null,
        'description' => xf_meta_description(),
        'image' => has_post_thumbnail($post) ? [get_the_post_thumbnail_url($post, 'full')] : null,
        'brand' => ['@type' => 'Brand', 'name' => $r['name']],
        'applicationCategory' => $r['category'] ?: null,
        'operatingSystem' => $r['os'] ?: null,
        'sameAs' => $r['ph_url'] ? [$r['ph_url']] : null,
        'offers' => $offers,
        'review' => $review,
    ]));
}, 5);

/* ---- Editor box: review facts and coupons (the owner adds coupons later) ---- */

add_action('add_meta_boxes_post', function () {
    add_meta_box('xf-review', 'Tool review and coupons', 'xf_review_metabox', 'post', 'normal', 'default');
});

function xf_review_metabox($post) {
    $r = xf_get_review($post->ID) + array_fill_keys(XF_REVIEW_TEXT_FIELDS, '') + ['pros' => [], 'cons' => []];
    $coupons = array_values((array) get_post_meta($post->ID, '_xf_coupons', true));
    $coupons[] = [];
    $coupons[] = [];
    wp_nonce_field('xf_review_save', 'xf_review_nonce');
    $labels = ['name' => 'Product name (blank = not a review)', 'url' => 'Product website', 'ph_url' => 'Product Hunt URL', 'category' => 'Category (e.g. BusinessApplication)', 'os' => 'Platforms (e.g. Web, macOS)', 'pricing_url' => 'Pricing page URL', 'price' => 'Lowest paid price (number)', 'currency' => 'Currency (USD, INR…)', 'billing' => 'Billing (e.g. per month)', 'free_plan' => 'Free plan: yes / no / trial', 'checked' => 'Pricing checked on (YYYY-MM-DD)', 'rating' => 'Our score 1–5 (must match the article)', 'verdict' => 'One-sentence verdict'];
    echo '<table class="form-table" role="presentation">';
    foreach ($labels as $k => $label) {
        printf('<tr><th><label for="xf-r-%1$s">%2$s</label></th><td><input class="widefat" id="xf-r-%1$s" name="xf_review[%1$s]" value="%3$s"></td></tr>', esc_attr($k), esc_html($label), esc_attr($r[$k]));
    }
    foreach (['pros' => 'Pros (one per line)', 'cons' => 'Cons (one per line)'] as $k => $label) {
        printf('<tr><th><label for="xf-r-%1$s">%2$s</label></th><td><textarea class="widefat" rows="4" id="xf-r-%1$s" name="xf_review[%1$s]">%3$s</textarea></td></tr>', esc_attr($k), esc_html($label), esc_textarea(implode("\n", $r[$k])));
    }
    echo '</table><h4>Coupons and deals</h4><p class="description">Shown on the article only while a row has a code or link and hasn\'t expired. Deal links get rel="sponsored" and a disclosure automatically. Leave a row blank to remove it.</p>';
    echo '<table class="widefat striped"><thead><tr><th>Code</th><th>What it gives (e.g. 20% off annual plans)</th><th>Deal or affiliate link</th><th>Expires (YYYY-MM-DD)</th></tr></thead><tbody>';
    foreach ($coupons as $i => $c) {
        echo '<tr>';
        foreach (['code', 'description', 'url', 'expires'] as $k) {
            printf('<td><input class="widefat" name="xf_coupons[%d][%s]" value="%s"></td>', (int) $i, esc_attr($k), esc_attr($c[$k] ?? ''));
        }
        echo '</tr>';
    }
    echo '</tbody></table>';
}

add_action('save_post_post', function ($post_id) {
    if (!isset($_POST['xf_review_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_review_nonce'])), 'xf_review_save')) {
        return;
    }
    if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $post_id)) {
        return;
    }
    xf_save_review($post_id, wp_unslash($_POST['xf_review'] ?? []));
    $coupons = [];
    foreach ((array) wp_unslash($_POST['xf_coupons'] ?? []) as $c) {
        $row = [
            'code' => sanitize_text_field((string) ($c['code'] ?? '')),
            'description' => sanitize_text_field((string) ($c['description'] ?? '')),
            'url' => esc_url_raw((string) ($c['url'] ?? '')),
            'expires' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($c['expires'] ?? '')) ? $c['expires'] : '',
        ];
        if ($row['code'] || $row['url']) {
            $coupons[] = $row;
        }
    }
    $coupons ? update_post_meta($post_id, '_xf_coupons', $coupons) : delete_post_meta($post_id, '_xf_coupons');
});
