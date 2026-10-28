<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sharing without third-party scripts: plain intent URLs plus the Web Share API.
 *  - xf_share_bar_html(): Share (native, shown only where supported), WhatsApp, X,
 *    LinkedIn, Telegram and Copy link. Every link carries utm_source=<network>,
 *    utm_medium=share, utm_campaign=<context>. theme.js rebuilds the links from the
 *    bar's data-* at click time (so a bar's text can change) and sends a GA4 `share`
 *    event through the consent-gated gtag only.
 *  - The founder share kit (?kit=1 on a listing), the end-of-article repeat and the
 *    quote-share popover live here too. No counts are shown anywhere.
 */

const XF_SHARE_NETS = ['whatsapp' => 'WhatsApp', 'x' => 'X', 'linkedin' => 'LinkedIn', 'telegram' => 'Telegram'];

/** $url with the share UTM tags, kept before any #fragment. */
function xf_share_utm($url, $source, $context) {
    [$base, $hash] = array_pad(explode('#', (string) $url, 2), 2, null);
    $base = add_query_arg(['utm_source' => rawurlencode($source), 'utm_medium' => 'share', 'utm_campaign' => rawurlencode(sanitize_key($context))], $base);
    return $hash === null ? $base : $base . '#' . $hash;
}

/** The network's intent URL for an already-tagged link. Mirrors share() in theme.js. */
function xf_share_intent($net, $url, $text) {
    $u = rawurlencode($url);
    $t = rawurlencode($text);
    switch ($net) {
        case 'whatsapp': return 'https://wa.me/?text=' . rawurlencode(trim($text . ' ' . $url));
        case 'x': return 'https://x.com/intent/post?text=' . $t . '&url=' . $u;
        case 'linkedin': return 'https://www.linkedin.com/sharing/share-offsite/?url=' . $u;
        case 'telegram': return 'https://t.me/share/url?url=' . $u . '&text=' . $t;
    }
    return $url;
}

function xf_share_icon($net) {
    $p = [
        'native' => '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
        'whatsapp' => '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
        'x' => '<path d="M4 4l16 16M20 4 4 20"/>',
        'linkedin' => '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
        'telegram' => '<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 12-9"/>',
        'copy' => '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    ];
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $p[$net] . '</svg>';
}

/**
 * The share bar. $title is what the shared message says (prefilled text); $context
 * becomes utm_campaign and the GA4 content_type. $args: compact (bool), label (string, '' hides it).
 */
function xf_share_bar_html($url, $title, $context, array $args = []) {
    $url = (string) $url;
    $text = html_entity_decode(wp_strip_all_tags((string) $title), ENT_QUOTES, 'UTF-8');
    $ctx = sanitize_key($context);
    $label = $args['label'] ?? 'Share';
    $html = '<div class="xf-share' . (!empty($args['compact']) ? ' xf-share--compact' : '') . '" role="group" aria-label="' . esc_attr($label !== '' ? $label : 'Share') . '" data-share data-url="' . esc_url($url) . '" data-text="' . esc_attr($text) . '" data-ctx="' . esc_attr($ctx) . '">';
    if ($label !== '') {
        $html .= '<span class="xf-share__l k">' . esc_html($label) . '</span>';
    }
    $html .= '<button type="button" class="xf-share__b xf-share__b--native" data-net="native" hidden>' . xf_share_icon('native') . '<span>Share</span></button>';
    foreach (XF_SHARE_NETS as $net => $name) {
        $html .= '<a class="xf-share__b" data-net="' . esc_attr($net) . '" href="' . esc_url(xf_share_intent($net, xf_share_utm($url, $net, $ctx), $text)) . '" target="_blank" rel="noopener" aria-label="' . esc_attr('Share on ' . $name . ' (opens in a new tab)') . '">' . xf_share_icon($net) . '</a>';
    }
    $html .= '<button type="button" class="xf-share__b" data-net="copy" data-copy-link="' . esc_attr(xf_share_utm($url, 'copy', $ctx)) . '" aria-label="Copy link">' . xf_share_icon('copy') . '<span class="xf-share__c">Copy link</span></button>';
    return $html . '</div>';
}

/* ---- Articles and guides: a compact repeat at the end, just above Sources (sources.php runs at 30) ---- */

add_filter('the_content', function ($content) {
    $post = get_post();
    if (!$post || !in_array($post->post_type, ['post', 'xf_guide'], true) || !is_singular() || is_feed() || $post->ID !== get_queried_object_id()) {
        return $content;
    }
    return $content . '<div class="xf-share-end">' . xf_share_bar_html(get_permalink($post), get_the_title($post), $post->post_type === 'post' ? 'article-end' : 'guide-end', ['compact' => true, 'label' => 'Share this']) . '</div>';
}, 29);

/** Quote sharing on articles and guides: theme.js shows the button on an 8–40 word selection inside [data-quote-root]. */
add_action('wp_footer', function () {
    if (!is_singular(['post', 'xf_guide'])) {
        return;
    }
    echo '<div class="xf-qs" data-qs hidden><button type="button" class="xf-qs__btn" data-qs-btn>' . xf_share_icon('native') . 'Share quote</button>'
        . '<div class="xf-qs__pop" data-qs-pop hidden>' . xf_share_bar_html(get_permalink(), get_the_title(), 'quote', ['label' => 'Share quote', 'compact' => true]) . '</div></div>'; // phpcs:ignore -- escaped inside
});

/* ---- Startup pages ---- */

/** "Used {Name}? Add your take": one of three wordings, fixed per listing so cached pages stay consistent. */
function xf_share_take_cta($id) {
    $name = get_the_title($id);
    $copy = [
        'Used %s? Add your take',
        'Tried %s? Tell other readers how it went',
        'Know %s well? Leave a quick review',
    ];
    return '<a class="xf-meter__link xf-take" href="#write-review" data-open-review>' . esc_html(sprintf($copy[(int) $id % 3], $name)) . ' →</a>';
}

/** Post-tap prompt (hidden until a tap succeeds; theme.js fills the level). */
function xf_share_tap_moment($id) {
    $name = get_the_title($id);
    return '<div class="xf-moment" data-moment hidden><button type="button" class="xf-moment__x" data-moment-x aria-label="Dismiss">×</button>'
        . '<p class="xf-moment__t">Tell your network you backed ' . esc_html($name) . ' early</p>'
        . xf_share_bar_html(get_permalink($id), 'I just backed ' . $name . ' on 100xFounder ⚡', 'meter-tap', ['label' => '', 'compact' => true])
        . '<a class="xf-meter__link" href="' . esc_url(xf_meter_share_url($id)) . '" download>Download share card</a></div>';
}

function xf_share_kit_url($id) {
    return add_query_arg('kit', '1', get_permalink($id)) . '#share-kit';
}

function xf_share_kit_requested() {
    return is_singular('xf_startup') && !empty($_GET['kit']); // phpcs:ignore WordPress.Security.NonceVerification -- read-only view toggle
}

/** Ready-to-post captions, each with its own tagged link. */
function xf_share_kit_captions($id) {
    $name = html_entity_decode(get_the_title($id), ENT_QUOTES, 'UTF-8');
    $url = get_permalink($id);
    $link = function ($net) use ($url) { return xf_share_utm($url, $net, 'founder-kit'); };
    return [
        'LinkedIn' => "We're listed on 100xFounder. {$name} now has a page on the 100X Meter, where readers back the startups they believe in with one tap a day.\n\nIf you've used {$name}, a tap or a short review there would mean a lot to the team: " . $link('linkedin'),
        'X' => "{$name} is on the 100xFounder 100X Meter ⚡ Think we could go 100X? One tap a day helps: " . $link('x'),
        'WhatsApp' => "Hi! {$name} is listed on 100xFounder. If you like what we're building, tap \"100X it\" on our page (takes two seconds, once a day): " . $link('whatsapp'),
    ];
}

function xf_share_kit_html($id) {
    $name = get_the_title($id);
    $badge = function_exists('xf_meter_badge_code') ? xf_meter_badge_code($id) : '';
    ob_start();
    ?>
    <section class="xf-kit" id="share-kit" aria-labelledby="share-kit-h">
        <p class="k xf-kit__eyebrow">For founders</p>
        <h2 id="share-kit-h" class="xf-kit__h">Share your listing</h2>
        <p class="muted xf-kit__lede">Everything you need to send people to <?php echo esc_html($name); ?> on 100xFounder. Links carry share tags so you can see the visits in your own analytics.</p>
        <div class="xf-kit__grid">
            <div class="xf-kit__card">
                <h3>Badge for your site</h3>
                <p class="hint">Shows your live 100X Meter level and links to this page.</p>
                <img src="<?php echo esc_url(rest_url('xf/v1/meter-badge/' . (int) $id . '.svg')); ?>" alt="<?php echo esc_attr($name); ?> 100X Meter badge" width="168" height="28" loading="lazy">
                <textarea class="xf-kit__code" readonly rows="3" aria-label="Badge embed code"><?php echo esc_textarea($badge); ?></textarea>
                <button type="button" class="btn btn-sm" data-copy-link="<?php echo esc_attr($badge); ?>">Copy badge code</button>
            </div>
            <div class="xf-kit__card">
                <h3>Share card</h3>
                <p class="hint">A 1080×1350 image with your current level, sized for Instagram and LinkedIn.</p>
                <a class="btn btn-w btn-sm" href="<?php echo esc_url(xf_meter_share_url($id)); ?>" download>Download share card</a>
            </div>
        </div>
        <h3 class="xf-kit__sub">Ready-to-post captions</h3>
        <div class="xf-kit__grid">
            <?php foreach (xf_share_kit_captions($id) as $net => $caption) : ?>
                <div class="xf-kit__card">
                    <h3><?php echo esc_html($net); ?></h3>
                    <p class="xf-kit__cap"><?php echo nl2br(esc_html($caption)); // phpcs:ignore -- escaped ?></p>
                    <button type="button" class="btn btn-sm" data-copy-link="<?php echo esc_attr($caption); ?>" aria-label="<?php echo esc_attr('Copy the ' . $net . ' caption'); ?>">Copy caption</button>
                </div>
            <?php endforeach; ?>
        </div>
        <h3 class="xf-kit__sub">Invite your users to back you on the 100X Meter</h3>
        <p class="muted xf-kit__lede">Each reader can tap once a day. Send this to your users, community or newsletter.</p>
        <?php echo xf_share_bar_html(get_permalink($id), 'We are on the 100xFounder 100X Meter. If you like ' . $name . ', give us a tap (once a day):', 'founder-invite', ['label' => 'Invite']); // phpcs:ignore -- escaped inside ?>
    </section>
    <?php
    return ob_get_clean();
}

/** The kit view is for founders, not search: same page, noindex (canonical already points at the listing). */
add_action('wp', function () {
    if (!xf_share_kit_requested()) {
        return;
    }
    add_filter('wp_robots', function ($robots) {
        unset($robots['index'], $robots['max-image-preview']);
        $robots['noindex'] = true;
        $robots['follow'] = true;
        return $robots;
    }, PHP_INT_MAX);
});
add_filter('xf_page_allows_ads', function ($ok) {
    return xf_share_kit_requested() ? false : $ok;
});

/* ---- Launch referral loop ---- */

/** The free-launch link founders share with each other; ?ref= rides along to the submission (_xf_ref). */
function xf_share_launch_url() {
    return xf_launch_page_url(['ref' => 'launch-share']);
}

/** Submissions per ref, newest refs first, for the Launches admin page. */
function xf_share_launch_ref_counts() {
    global $wpdb;
    return $wpdb->get_results($wpdb->prepare(
        "SELECT m.meta_value AS ref, COUNT(*) AS n FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id
         WHERE m.meta_key = %s AND p.post_type = %s GROUP BY m.meta_value ORDER BY n DESC LIMIT 20",
        '_xf_ref', 'xf_submission'
    ));
}

/* Self-check (WP_DEBUG only): tags go before the fragment, intent links carry the tagged URL. */
if (defined('WP_DEBUG') && WP_DEBUG) {
    assert(xf_share_utm('https://a.b/p/#:~:text=x', 'x', 'quote') === 'https://a.b/p/?utm_source=x&utm_medium=share&utm_campaign=quote#:~:text=x');
    assert(strpos(xf_share_intent('telegram', 'https://a.b/?q=1', 'Hi'), 'https://t.me/share/url?url=https%3A%2F%2Fa.b%2F%3Fq%3D1&text=Hi') === 0);
}
