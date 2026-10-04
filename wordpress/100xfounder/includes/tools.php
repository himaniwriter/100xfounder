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
            'group' => 'Salary',
            'seo_title' => 'In-hand Salary Calculator India FY 2025-26 (New & Old Regime)',
        ],
        'salary-hike-calculator' => [
            'title' => 'Salary hike calculator',
            'short' => 'Salary hike',
            'desc' => 'See your new CTC and how much more lands in your account each month after a hike or a job switch.',
            'group' => 'Salary',
            'seo_title' => 'Salary Hike Calculator: New CTC and In-hand Increase (India)',
        ],
        'notice-period-buyout-calculator' => [
            'title' => 'Notice period buyout calculator',
            'short' => 'Notice buyout',
            'desc' => 'Work out what it costs to buy out the rest of your notice period, and what a new employer would need to cover.',
            'group' => 'Careers',
            'seo_title' => 'Notice Period Buyout Calculator (India)',
        ],
    ];
}

add_action('init', function () {
    add_rewrite_rule('^tools/([a-z0-9-]+)/?$', 'index.php?pagename=tools&xf_tool=$matches[1]', 'top');
});

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
