<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Free tools hosted on the site (pillar 4). They run entirely in the
 * visitor's browser, so they have no running cost and can't "go down".
 * Pages: /tools/ and /tools/{slug}/ (rendered by the theme).
 * ---------------------------------------------------------------------- */

function xf_tools() {
    return [
        'in-hand-salary-calculator' => [
            'title' => 'In-hand salary calculator (India)',
            'short' => 'In-hand salary',
            'desc' => 'Turn your CTC into monthly take-home pay under the new or old tax regime, with PF, professional tax and HRA.',
            'group' => 'Salary & jobs',
            'seo_title' => 'In-hand Salary Calculator India 2026-27 (New & Old Regime)',
        ],
        'salary-hike-calculator' => [
            'title' => 'Salary hike calculator',
            'short' => 'Salary hike',
            'desc' => 'See your new CTC and how much more lands in your account each month after a hike or a job switch.',
            'group' => 'Salary & jobs',
            'seo_title' => 'Salary Hike Calculator: New CTC and In-hand Increase (India)',
        ],
        'notice-period-buyout-calculator' => [
            'title' => 'Notice period buyout calculator',
            'short' => 'Notice buyout',
            'desc' => 'Work out what it costs to buy out the rest of your notice period, and what a new employer would need to cover.',
            'group' => 'Salary & jobs',
            'seo_title' => 'Notice Period Buyout Calculator (India)',
        ],
        'startup-100x-score' => [
            'title' => 'How 100X is your startup?',
            'short' => '100X score',
            'desc' => 'Answer 10 quick questions on traction, team and market and get a 0–100X startup score, your three biggest levers and a card to share.',
            'group' => 'Founders',
            'seo_title' => 'How 100X is your startup? Free startup score',
            'app_category' => 'BusinessApplication',
        ],
        'runway-calculator' => [
            'title' => 'Runway calculator',
            'short' => 'Runway',
            'desc' => 'Find how many months of cash your startup has left, your net burn and the date cash hits zero, with revenue growth built in.',
            'group' => 'Founders',
            'seo_title' => 'Runway Calculator: Burn Rate and Zero-Cash Date for Startups',
            'app_category' => 'FinanceApplication',
        ],
        'cap-table-calculator' => [
            'title' => 'Cap table calculator',
            'short' => 'Cap table',
            'desc' => 'Model a priced round with SAFEs and an option pool top-up, and see each holder\'s shares and ownership before and after.',
            'group' => 'Founders',
            'seo_title' => 'Cap Table Calculator: Dilution, SAFE and Option Pool',
            'app_category' => 'FinanceApplication',
        ],
        'cofounder-equity-split-calculator' => [
            'title' => 'Co-founder equity split calculator',
            'short' => 'Equity split',
            'desc' => 'Weigh commitment, role, skills, capital and risk to get a starting point for splitting equity between two to four co-founders.',
            'group' => 'Founders',
            'seo_title' => 'Co-founder Equity Split Calculator (Weighted Factors)',
            'app_category' => 'BusinessApplication',
        ],
        'saas-metrics-calculator' => [
            'title' => 'SaaS metrics calculator',
            'short' => 'SaaS metrics',
            'desc' => 'Work out LTV:CAC, CAC payback, MRR and ARR, churn, net revenue retention and the rule of 40 on one page.',
            'group' => 'Founders',
            'seo_title' => 'LTV CAC Calculator and SaaS Metrics (MRR, Churn, NRR)',
            'app_category' => 'FinanceApplication',
        ],
        'startup-cost-calculator' => [
            'title' => 'Startup cost calculator',
            'short' => 'Startup cost',
            'desc' => 'Add up one-time and monthly costs of starting a company in India and see the cash you need until revenue arrives.',
            'group' => 'Founders',
            'seo_title' => 'Startup Cost Calculator (India): How Much Cash You Need',
            'app_category' => 'FinanceApplication',
        ],
        'esop-calculator' => [
            'title' => 'ESOP calculator',
            'short' => 'ESOP',
            'desc' => 'See how many options have vested, what exercising costs, the tax on exercise and sale in India, and an illustrative exit value.',
            'group' => 'Founders',
            'seo_title' => 'ESOP Calculator India: Vesting, Tax and Value',
            'app_category' => 'FinanceApplication',
        ],
        'ai-token-cost-calculator' => [
            'title' => 'AI token cost calculator',
            'short' => 'Token cost',
            'desc' => 'Estimate LLM API costs per call, day and month for Claude, GPT and Gemini models from official prices, with caching and batch.',
            'group' => 'AI',
            'seo_title' => 'Token Cost Calculator: Claude, OpenAI and Gemini API Costs',
            'app_category' => 'DeveloperApplication',
        ],
        'ai-roi-calculator' => [
            'title' => 'AI ROI calculator',
            'short' => 'AI ROI',
            'desc' => 'Compare the value of hours an AI tool saves with what it costs, and get the monthly net gain, year-one ROI and payback period.',
            'group' => 'AI',
            'seo_title' => 'AI ROI Calculator: Hours Saved, Payback and Return',
            'app_category' => 'BusinessApplication',
        ],
        'gpu-cost-calculator' => [
            'title' => 'GPU cost calculator',
            'short' => 'GPU cost',
            'desc' => 'Price cloud GPU time on AWS and Azure from official on-demand rates: total cost, GPU-hours and cost per GPU-hour.',
            'group' => 'AI',
            'seo_title' => 'GPU Cost Calculator: AWS and Azure H100, A100, B200 Prices',
            'app_category' => 'DeveloperApplication',
        ],
    ];
}

add_action('init', function () {
    add_rewrite_rule('^tools/([a-z0-9-]+)/?$', 'index.php?pagename=tools&xf_tool=$matches[1]', 'top');
});

/**
 * Self-heal the pretty URLs. A deploy that swaps the plugin directory can leave the
 * stored rewrite rules without ours (the one-time flush runs on a single request and
 * can be missed), which 404s /tools/<slug>/ and /jobs/<slug>/ while the pages exist.
 * Check the stored rules late on init and flush once if ours are gone.
 */
add_action('init', function () {
    if (get_transient('xf_rewrite_checked')) {
        return;
    }
    set_transient('xf_rewrite_checked', 1, 10 * MINUTE_IN_SECONDS);
    $stored = get_option('rewrite_rules');
    if (!is_array($stored) || !$stored) {
        return; // Plain permalinks, or WordPress is about to build them anyway.
    }
    foreach (['^tools/([a-z0-9-]+)/?$', '^jobs/([a-z0-9-]+)/?$'] as $rule) {
        if (!isset($stored[$rule])) {
            flush_rewrite_rules(false);
            return;
        }
    }
}, 999);

add_filter('query_vars', function ($vars) {
    $vars[] = 'xf_tool';
    return $vars;
});

function xf_current_tool() {
    $slug = (string) get_query_var('xf_tool');
    $tools = xf_tools();
    return isset($tools[$slug]) ? array_merge(['slug' => $slug], $tools[$slug]) : null;
}

/** Tool pages get their own title and description. */
add_filter('pre_get_document_title', function ($title) {
    $tool = xf_current_tool();
    return $tool ? $tool['seo_title'] . ' | ' . get_bloginfo('name') : $title;
});

/** Unknown /tools/xyz/ addresses are 404s, not a copy of the hub. */
add_action('template_redirect', function () {
    if (get_query_var('xf_tool') && !xf_current_tool()) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
    }
});

/* ---- Soft email ask after 15 calculations (tools.js counts them in the browser; nothing is sent before the form) ---- */

function xf_calc_consent() {
    return 'Email me my results and new 100xFounder tools.';
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/calc-lead', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'xf_calc_lead',
    ]);
});

function xf_calc_lead(WP_REST_Request $r) {
    if ((string) $r->get_param('website') !== '') {
        return new WP_Error('bad_request', 'Please try again.', ['status' => 400]);
    }
    if (!function_exists('xf_join_token_ok') || !xf_join_token_ok($r->get_param('token'))) {
        return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 403]);
    }
    if (function_exists('xf_rate_limited') && xf_rate_limited('calc_lead', 5, HOUR_IN_SECONDS)) {
        return new WP_Error('rate_limited', 'Too many requests from your connection. Please try again later.', ['status' => 429]);
    }
    $slug = sanitize_key((string) $r->get_param('slug'));
    $tools = xf_tools();
    if (!isset($tools[$slug])) {
        return new WP_Error('bad_tool', 'Unknown calculator.', ['status' => 400]);
    }
    $email = strtolower(sanitize_email((string) $r->get_param('email')));
    if (!is_email($email)) {
        return new WP_Error('bad_email', 'Please enter a valid email address.', ['status' => 400]);
    }
    if (!$r->get_param('consent')) {
        return new WP_Error('no_consent', 'Please tick the box so we can email you.', ['status' => 400]);
    }
    $name = sanitize_text_field(mb_substr((string) $r->get_param('name'), 0, 80));
    $count = max(0, min(100000, (int) $r->get_param('count')));
    $summary = sanitize_textarea_field(mb_substr((string) $r->get_param('summary'), 0, 600));
    $page = home_url('/tools/' . $slug . '/');
    $niche = 'calculator:' . $slug;
    $now = current_time('mysql');

    global $wpdb;
    $wpdb->query($wpdb->prepare(
        'INSERT IGNORE INTO ' . xf_table('subscribers') . ' (email, source, status, created_at) VALUES (%s, %s, %s, %s)',
        $email, 'calculator', 'active', xf_now()
    ));
    $meta = array_filter([
        '_xf_lead_email' => $email,
        '_xf_lead_name' => $name ?: null,
        '_xf_lead_niche' => $niche,
        '_xf_lead_sub' => 'calculator',
        '_xf_lead_source' => $page,
        '_xf_lead_calc_count' => (string) $count,
        '_xf_lead_consent' => $now,
        '_xf_lead_consent_text' => xf_calc_consent(),
    ]);
    $existing = get_posts([
        'post_type' => 'xf_lead', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_lead_email', 'value' => $email], ['key' => '_xf_lead_niche', 'value' => $niche]],
    ]);
    if ($existing) {
        foreach ($meta as $k => $v) {
            update_post_meta($existing[0], $k, $v);
        }
    } else {
        wp_insert_post([
            'post_type' => 'xf_lead',
            'post_status' => 'private',
            'post_title' => sprintf('%s (%s) — %s', $name ?: 'Reader', $email, $niche),
            'post_content' => sprintf("Calculator: %s\nCalculations so far: %d\nLast result:\n%s", $tools[$slug]['title'], $count, $summary),
            'meta_input' => $meta,
        ]);
    }
    wp_mail($email, sprintf('Your %s results', $tools[$slug]['title']), sprintf(
        "Hi%s,\n\nHere is your latest result from the 100xFounder %s:\n\n%s\n\nRun it again any time: %s\n\nEstimates only, not financial, tax or legal advice.\n\nUnsubscribe at any time by replying to this email.\n\n100xFounder",
        $name ? ' ' . $name : '', $tools[$slug]['title'], $summary ?: '(no result captured)', $page
    ));
    return ['ok' => true];
}
