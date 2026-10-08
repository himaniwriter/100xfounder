<?php
if (!defined('ABSPATH')) {
    exit;
}

/** Google AdSense publisher ID, e.g. ca-pub-4106130565884060. */
function xf_adsense_client() {
    $client = trim((string) xf_get_setting('adsense_client'));
    return preg_match('/^ca-pub-\d{10,20}$/', $client) ? $client : '';
}

/**
 * AdSense policy: no ads on pages without publisher content. That covers the
 * outreach form, unsubscribe page and thin (noindexed) startup listings.
 */
function xf_page_allows_ads() {
    if (is_admin() || is_404() || is_search() || is_preview()) {
        return false;
    }
    $pages = get_option('xf_pages', []);
    foreach (['feature', 'unsubscribe'] as $key) {
        if (!empty($pages[$key]) && is_page($pages[$key])) {
            return false;
        }
    }
    if (is_singular('xf_startup') && get_post_meta(get_queried_object_id(), '_xf_indexable', true) !== '1') {
        return false;
    }
    return true;
}

add_action('wp_head', function () {
    $client = xf_adsense_client();
    if (!$client || !xf_page_allows_ads()) {
        return;
    }
    printf(
        '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>' . "\n",
        esc_attr($client)
    );
}, 1);

/**
 * A manual in-content ad unit. Renders only when an ad slot ID is configured;
 * otherwise Auto ads (enabled in the AdSense dashboard) decide placement.
 */
function xf_ad_unit($extra_class = '') {
    $client = xf_adsense_client();
    $slot = preg_replace('/\D/', '', (string) xf_get_setting('adsense_slot'));
    if (!$client || !$slot || !xf_page_allows_ads()) {
        return '';
    }
    return sprintf(
        '<div class="xf-ad %s"><span class="xf-ad__label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="%s" data-ad-slot="%s" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>',
        esc_attr($extra_class),
        esc_attr($client),
        esc_attr($slot)
    );
}

add_shortcode('xf_ad', function () {
    return xf_ad_unit();
});

/** Serves /ads.txt from WordPress (a physical ads.txt file in public_html takes priority). */
add_action('init', function () {
    $path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if ($path !== '/ads.txt') {
        return;
    }
    $client = xf_adsense_client();
    if (!$client) {
        return;
    }
    header('Content-Type: text/plain; charset=utf-8');
    echo 'google.com, ' . esc_html(str_replace('ca-', '', $client)) . ", DIRECT, f08c47fec0942fa0\n";
    exit;
}, 0);

/* -------------------------------------------------------------------------
 * Site trust pages AdSense reviewers look for, plus a footer that links them
 * ---------------------------------------------------------------------- */

function xf_legal_page_definitions() {
    $site = get_bloginfo('name') ?: '100xFounder';
    $host = wp_parse_url(home_url(), PHP_URL_HOST);
    $email = get_option('admin_email');
    $date = wp_date('F j, Y');

    return [
        'about' => ['About', 'about', <<<HTML
<!-- wp:paragraph --><p>{$site} is a startup launch directory. Every day we review the most upvoted and featured launches on Product Hunt, add the best of them to our directory, and invite their founders to share the story behind what they built.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">What we publish</h2><!-- /wp:heading -->
<!-- wp:list --><ul><li><strong>Daily launches:</strong> a curated list of the day's most notable new products, with links to try them.</li><li><strong>Founder spotlights:</strong> first-hand stories from founders about why they started, what problem they solve and what they've learned.</li><li><strong>Guides and analysis:</strong> articles for founders and early adopters on launching, growing and discovering new products.</li></ul><!-- /wp:list -->
<!-- wp:heading --><h2 class="wp-block-heading">How we choose launches</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>We include the day's top launches by upvotes, the top featured products, and any launch above 100 upvotes. Listings link back to their Product Hunt page. Founder spotlights are written by the founders themselves and reviewed by our team before publishing.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>Questions or corrections? <a href="/contact/">Contact us</a>.</p><!-- /wp:paragraph -->
HTML
        ],
        'contact' => ['Contact', 'contact', "<!-- wp:paragraph --><p>Have a question, a correction, or want your startup featured? Send us a message and we'll get back to you within two business days. You can also email us at <a href=\"mailto:{$email}\">{$email}</a>.</p><!-- /wp:paragraph -->\n<!-- wp:shortcode -->[xf_contact_form]<!-- /wp:shortcode -->"],
        'privacy' => ['Privacy Policy', 'privacy-policy', <<<HTML
<!-- wp:paragraph --><p><em>Last updated: {$date}</em></p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>This Privacy Policy explains how {$site} ("we", "us") collects, uses and protects information when you visit {$host}.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Information we collect</h2><!-- /wp:heading -->
<!-- wp:list --><ul><li><strong>Information you give us:</strong> details you submit through our contact form or founder spotlight form, such as your name, email, photo and answers.</li><li><strong>Usage data:</strong> standard server logs and analytics such as pages visited, browser type and approximate location.</li><li><strong>Cookies:</strong> small files stored by your browser, used by us and by third parties as described below.</li></ul><!-- /wp:list -->
<!-- wp:heading --><h2 class="wp-block-heading">Advertising and Google AdSense</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>We use Google AdSense to show ads. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this and other sites on the Internet.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">Google Ads Settings</a>, or opt out of third-party vendors' use of cookies for personalised advertising at <a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">www.aboutads.info</a>. Learn more in <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">how Google uses information from sites that use its services</a>.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>Visitors in the European Economic Area, the UK and Switzerland are asked for consent before personalised ads or non-essential cookies are used.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">How we use information</h2><!-- /wp:heading -->
<!-- wp:list --><ul><li>To publish content you ask us to publish, such as a founder spotlight.</li><li>To reply to messages and send emails you can unsubscribe from at any time.</li><li>To operate, secure and improve the website, and to show advertising.</li></ul><!-- /wp:list -->
<!-- wp:paragraph --><p>We do not sell your personal information.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Emails we send</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>We may email founders whose products launched publicly, using contact addresses those companies publish on their own websites, to offer a free listing and spotlight. Every email includes a one-click unsubscribe link, and we honour unsubscribe requests immediately.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Your rights</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>You can ask us to access, correct or delete your personal information, or to remove a spotlight, by emailing <a href="mailto:{$email}">{$email}</a>. Depending on where you live (for example under the GDPR or CCPA), you may have additional rights, which we will honour.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Children</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>This website is not directed at children under 13, and we do not knowingly collect their information.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Changes</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>We may update this policy and will change the date above when we do.</p><!-- /wp:paragraph -->
HTML
        ],
        'terms' => ['Terms of Use', 'terms', <<<HTML
<!-- wp:paragraph --><p><em>Last updated: {$date}</em></p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>By using {$host} you agree to these terms.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Content</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Startup listings summarise publicly available information about products and link to their official websites and Product Hunt pages. Founder spotlights are written by the founders and published with their consent. Trademarks and logos belong to their owners.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Submissions</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>When you submit a spotlight, you confirm you have the right to share it and grant us a non-exclusive licence to publish it on our website and social media. You can ask us to remove it at any time.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">No warranties</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>The website is provided "as is". We do our best to keep information accurate but cannot guarantee it. We are not responsible for third-party websites we link to.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Contact</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Questions about these terms: <a href="mailto:{$email}">{$email}</a>.</p><!-- /wp:paragraph -->
HTML
        ],
        'editorial' => ['Editorial Policy', 'editorial-policy', <<<HTML
<!-- wp:paragraph --><p>{$site} covers startups, funding, launches, jobs and AI with one rule: <strong>every fact has a source</strong>. Each article lists its sources at the end, with the publisher, date and the claim each one supports.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">How we report</h2><!-- /wp:heading -->
<!-- wp:list --><ul><li>We prefer primary sources: company announcements, regulatory filings, official data and on-the-record interviews.</li><li>We write in our own words and link to original reporting when we build on it.</li><li>Figures about people, such as net worth or compensation, are published only when a reliable source reports them, with the date.</li><li>Software may help us find and organise stories, and every article is reviewed and edited by a person before it is published.</li></ul><!-- /wp:list -->
<!-- wp:heading --><h2 class="wp-block-heading">Founder verification</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>When we publish about a founder or company we invite them to check the facts and sources. Pages they confirm show a "Verified" mark; corrections they send are reviewed and applied openly.</p><!-- /wp:paragraph -->
<!-- wp:heading --><h2 class="wp-block-heading">Independence</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Sponsored content is always labelled "Sponsored" and its links are marked as such. Advertisers and sponsors never decide what we cover or what we say.</p><!-- /wp:paragraph -->
HTML
        ],
        'corrections' => ['Corrections Policy', 'corrections-policy', <<<HTML
<!-- wp:paragraph --><p>We correct errors quickly and openly. If something we published is wrong, email <a href="mailto:{$email}">{$email}</a> with the page link, what is wrong, and a source for the correct information.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>Corrected articles carry an "Updated" note describing the change and the date. Minor fixes such as typos are corrected without a note.</p><!-- /wp:paragraph -->
HTML
        ],
        'advertise' => ['Advertise', 'advertise', <<<HTML
<!-- wp:paragraph --><p>Reach founders, operators, investors and job seekers across India and the US.</p><!-- /wp:paragraph -->
<!-- wp:list --><ul><li><strong>Fast-track or featured startup listing:</strong> priority review and placement in the directory and on the homepage.</li><li><strong>Sponsored article:</strong> your story, reviewed by our editors and clearly labelled "Sponsored".</li><li><strong>Featured job:</strong> pin a role at the top of the jobs board.</li></ul><!-- /wp:list -->
<!-- wp:paragraph --><p>Tell us what you'd like to promote on the <a href="/contact/">contact page</a> and we'll send prices and an invoice.</p><!-- /wp:paragraph -->
HTML
        ],
        'disclaimer' => ['Disclaimer', 'disclaimer', <<<HTML
<!-- wp:paragraph --><p>Information on {$site} is for general information only and is not investment, legal or financial advice. Listings and spotlights are not endorsements. We are not affiliated with Product Hunt. This website displays advertising, and we may earn money from ads shown on our pages; advertising never influences which products we list.</p><!-- /wp:paragraph -->
HTML
        ],
    ];
}

function xf_create_legal_pages() {
    $pages = get_option('xf_pages', []);
    foreach (xf_legal_page_definitions() as $key => [$title, $slug, $content]) {
        if (!empty($pages[$key]) && get_post($pages[$key])) {
            continue;
        }
        $existing = get_page_by_path($slug);
        // WordPress ships an empty draft "Privacy Policy"; reuse and fill it.
        if ($existing && $existing->post_status === 'draft' && $key === 'privacy') {
            wp_update_post(['ID' => $existing->ID, 'post_status' => 'publish', 'post_content' => $content]);
        }
        $pages[$key] = $existing ? $existing->ID : wp_insert_post([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_title' => $title,
            'post_name' => $slug,
            'post_content' => $content,
        ]);
        if ($key === 'privacy') {
            update_option('wp_page_for_privacy_policy', $pages[$key]);
        }
    }
    update_option('xf_pages', $pages);
}

/** Footer links to the trust pages, for themes without a configured footer menu. */
add_action('wp_footer', function () {
    if (!apply_filters('xf_show_footer_links', (bool) xf_get_setting('footer_links'))) {
        return;
    }
    $links = [
        'about' => 'About', 'contact' => 'Contact', 'privacy' => 'Privacy Policy',
        'terms' => 'Terms', 'disclaimer' => 'Disclaimer',
    ];
    echo '<nav class="xf-footer-links" aria-label="Site information">';
    foreach ($links as $key => $label) {
        echo '<a href="' . esc_url(xf_page_url($key)) . '">' . esc_html($label) . '</a>';
    }
    echo '<span>© ' . esc_html(wp_date('Y') . ' ' . get_bloginfo('name')) . '</span></nav>';
});

/* -------------------------------------------------------------------------
 * Contact form
 * ---------------------------------------------------------------------- */

add_shortcode('xf_contact_form', function () {
    if (isset($_GET['sent'])) {
        return '<div class="xf xf-card xf-card--highlight"><p>Thanks! Your message has been sent.</p></div>';
    }
    ob_start();
    ?>
    <form class="xf xf-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <input type="hidden" name="action" value="xf_contact">
        <?php wp_nonce_field('xf_contact', 'xf_nonce'); ?>
        <div class="xf-hp" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="xf-grid-2">
            <label>Name *<input name="name" required maxlength="120"></label>
            <label>Email *<input name="email" type="email" required maxlength="190"></label>
        </div>
        <label>Message *<textarea name="message" rows="6" required maxlength="5000"></textarea></label>
        <button class="xf-button" type="submit">Send message</button>
    </form>
    <?php
    return ob_get_clean();
});

function xf_handle_contact() {
    if (!isset($_POST['xf_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_nonce'])), 'xf_contact')) {
        wp_die('Your session expired. Please go back and try again.', 'Expired', ['response' => 403]);
    }
    $back = xf_page_url('contact');
    // Honeypot: bots fill every field.
    if (!empty($_POST['website'])) {
        wp_safe_redirect(add_query_arg('sent', 1, $back));
        exit;
    }
    // Same answer when throttled, so bots learn nothing; at most 5 messages an hour per visitor.
    if (xf_rate_limited('contact', 5, HOUR_IN_SECONDS)) {
        wp_safe_redirect(add_query_arg('sent', 1, $back));
        exit;
    }
    $name = sanitize_text_field(wp_unslash($_POST['name'] ?? ''));
    $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    $message = mb_substr(sanitize_textarea_field(wp_unslash($_POST['message'] ?? '')), 0, 5000);
    if ($name && is_email($email) && $message) {
        wp_mail(get_option('admin_email'), "Contact form: $name", "$message\n\nFrom: $name <$email>", ['Reply-To: ' . $name . ' <' . $email . '>']);
    }
    wp_safe_redirect(add_query_arg('sent', 1, $back));
    exit;
}
add_action('admin_post_nopriv_xf_contact', 'xf_handle_contact');
add_action('admin_post_xf_contact', 'xf_handle_contact');
