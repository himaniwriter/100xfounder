<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Monthly Indian startup funding report: /funding-report/ and /funding-report/YYYY-MM/.
 * Built only from published xf_round posts with country India and a source URL,
 * dated by their "Announced" field (post date when empty). Nothing is estimated:
 * undisclosed amounts are counted as rounds but never given a value. Computed
 * data is cached in one option and rebuilt after any round changes. On the 2nd of
 * each month a cron run finalises last month and drafts a Pending summary post.
 * The page itself is the theme template funding-report.php.
 * ---------------------------------------------------------------------- */

const XF_FR_INDEX_MIN = 10; // Sourced rounds a month needs before its report is indexable.

function xf_fr_url($ym = '') {
    return home_url('/funding-report/' . ($ym ? $ym . '/' : ''));
}

function xf_fr_label($ym) {
    return gmdate('F Y', strtotime($ym . '-01 00:00:00 UTC'));
}

function xf_fr_prev_month($ym) {
    return gmdate('Y-m', strtotime($ym . '-01 00:00:00 UTC -1 month'));
}

/** "₹1,234 crore" from rupees. */
function xf_fr_format_inr($inr) {
    $cr = $inr / 1e7;
    return '₹' . number_format($cr, $cr < 100 ? 1 : 0) . ' crore';
}

/** Every sourced Indian round, normalised. */
function xf_fr_rows() {
    $rows = [];
    $posts = get_posts(['post_type' => 'xf_round', 'post_status' => 'publish', 'posts_per_page' => -1, 'no_found_rows' => true]);
    foreach ($posts as $p) {
        $m = function ($k) use ($p) { return trim((string) get_post_meta($p->ID, '_xf_' . $k, true)); };
        $source = $m('source_url');
        if ($m('country') !== 'India' || !preg_match('#^https?://[^/\s]+\.[^/\s]+#i', $source)) {
            continue;
        }
        $date = preg_match('/^\d{4}-\d{2}-\d{2}$/', $m('announced')) ? $m('announced') : get_the_date('Y-m-d', $p);
        $names = preg_split('/\s*(?:,|;|\band\b)\s*/i', $m('lead_investor') . ',' . $m('investors'));
        $investors = [];
        foreach ($names as $n) {
            if ($n !== '' && !isset($investors[strtolower($n)])) $investors[strtolower($n)] = $n;
        }
        $usd = (float) $m('amount_usd');
        $rows[] = [
            'id' => $p->ID,
            'url' => get_permalink($p),
            'company' => $m('company') ?: get_the_title($p),
            'stage' => $m('round') ?: 'Not stated',
            'sector' => $m('sector') ?: 'Not stated',
            'city' => $m('city') ?: 'Not stated',
            'lead' => $m('lead_investor'),
            'investors' => array_values($investors),
            'usd' => $usd > 0 ? $usd : 0,
            'display' => $usd > 0 ? ($m('amount_display') ?: xf_format_usd_short($usd)) : 'Undisclosed',
            'source' => $source,
            'date' => $date,
            'month' => substr($date, 0, 7),
            'modified' => $p->post_modified_gmt,
        ];
    }
    return $rows;
}

/**
 * USD→INR reference rate for the last business day of the month: the European Central Bank's
 * published rate, fetched once through the free Frankfurter API and kept. Null when unavailable
 * (the report then shows USD only; we never guess a rate).
 */
function xf_fr_rate($ym) {
    $rates = (array) get_option('xf_fr_rates', []);
    if (!empty($rates[$ym]['rate'])) {
        return $rates[$ym];
    }
    // A failed lookup waits 6 hours: the cache rebuilds on page views, and each miss would otherwise cost a visitor up to 8 s per month.
    if (!preg_match('/^\d{4}-\d{2}$/', (string) $ym) || get_transient('xf_fr_rate_miss_' . $ym)) {
        return null;
    }
    $day = gmdate('Y-m-t', strtotime($ym . '-01 00:00:00 UTC'));
    $r = wp_safe_remote_get('https://api.frankfurter.dev/v1/' . $day . '?base=USD&symbols=INR', ['timeout' => 8, 'redirection' => 0, 'limit_response_size' => 8192]);
    $body = is_wp_error($r) || (int) wp_remote_retrieve_response_code($r) !== 200 ? null : json_decode((string) wp_remote_retrieve_body($r), true);
    $rate = is_array($body) && is_numeric($body['rates']['INR'] ?? null) ? (float) $body['rates']['INR'] : 0;
    $date = is_array($body) ? (string) ($body['date'] ?? '') : '';
    if ($rate < 10 || $rate > 1000 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) { // sanity bounds for USD→INR
        set_transient('xf_fr_rate_miss_' . $ym, 1, 6 * HOUR_IN_SECONDS);
        return null;
    }
    $rates[$ym] = ['rate' => $rate, 'date' => $date];
    update_option('xf_fr_rates', $rates, false);
    return $rates[$ym];
}

/** Count and disclosed USD per label, biggest first; ids trace each bucket back to its rounds. */
function xf_fr_group(array $rows, $field) {
    $g = [];
    foreach ($rows as $r) {
        $k = $r[$field];
        $g[$k] = $g[$k] ?? ['n' => 0, 'usd' => 0, 'ids' => []];
        $g[$k]['n']++;
        $g[$k]['usd'] += $r['usd'];
        $g[$k]['ids'][] = $r['id'];
    }
    uksort($g, function ($a, $b) use ($g) {
        return [$a === 'Not stated', $g[$b]['usd'], $g[$b]['n'], $a] <=> [$b === 'Not stated', $g[$a]['usd'], $g[$a]['n'], $b];
    });
    return $g;
}

function xf_fr_compute($ym, array $rows) {
    usort($rows, function ($a, $b) { return [$b['usd'], $a['date'], $a['company']] <=> [$a['usd'], $b['date'], $b['company']]; });
    $investors = [];
    foreach ($rows as $r) {
        foreach ($r['investors'] as $name) {
            $k = strtolower($name);
            $investors[$k] = $investors[$k] ?? ['name' => $name, 'n' => 0, 'ids' => []];
            $investors[$k]['n']++;
            $investors[$k]['ids'][] = $r['id'];
        }
    }
    uasort($investors, function ($a, $b) { return [$b['n'], $a['name']] <=> [$a['n'], $b['name']]; });
    $total = array_sum(array_column($rows, 'usd'));
    $disclosed = count(array_filter($rows, function ($r) { return $r['usd'] > 0; }));
    $rate = $total > 0 ? xf_fr_rate($ym) : null;
    return [
        'month' => $ym,
        'count' => count($rows),
        'disclosed' => $disclosed,
        'undisclosed' => count($rows) - $disclosed,
        'total_usd' => $total,
        'rate' => $rate,
        'total_inr' => $rate ? $total * $rate['rate'] : null,
        'rows' => $rows, // Largest disclosed first, then undisclosed by date.
        'stage' => xf_fr_group($rows, 'stage'),
        'sector' => xf_fr_group($rows, 'sector'),
        'city' => xf_fr_group($rows, 'city'),
        'investors' => array_slice(array_values(array_filter($investors, function ($i) { return $i['n'] > 0; })), 0, 10),
        'modified' => max(array_column($rows, 'modified')),
        'indexable' => count($rows) >= XF_FR_INDEX_MIN,
    ];
}

/** [YYYY-MM => report] for every completed month with at least one sourced round, newest first. Cached. */
function xf_fr_reports() {
    $cache = get_option('xf_fr_cache');
    $current = wp_date('Y-m');
    if (is_array($cache) && ($cache['current'] ?? '') === $current) {
        return $cache['months'];
    }
    $by_month = [];
    foreach (xf_fr_rows() as $r) {
        if ($r['month'] < $current) $by_month[$r['month']][] = $r;
    }
    krsort($by_month);
    $months = [];
    foreach ($by_month as $ym => $rows) {
        $months[$ym] = xf_fr_compute($ym, $rows);
    }
    update_option('xf_fr_cache', ['current' => $current, 'months' => $months], false);
    return $months;
}

function xf_fr_report($ym) {
    return xf_fr_reports()[$ym] ?? null;
}

/** Any change to a round (save, trash, delete, meta written by MCP/REST) rebuilds the cache on next view. */
function xf_fr_flush($post_id = 0) {
    if (!$post_id || get_post_type($post_id) === 'xf_round') delete_option('xf_fr_cache');
}
add_action('save_post_xf_round', 'xf_fr_flush');
add_action('deleted_post', 'xf_fr_flush');
foreach (['added_post_meta', 'updated_post_meta', 'deleted_post_meta'] as $hook) {
    add_action($hook, function ($mid, $post_id, $key) {
        if (strpos((string) $key, '_xf_') === 0) xf_fr_flush($post_id);
    }, 10, 3);
}

/* ---- Routing: a virtual page rendered by the theme's funding-report.php ---- */

add_action('init', function () {
    add_rewrite_rule('^funding-report/?$', 'index.php?xf_fr=index', 'top');
    add_rewrite_rule('^funding-report/(\d{4}-\d{2})/?$', 'index.php?xf_fr=$matches[1]', 'top');
});

/** A deploy can miss the one-time flush: add our rules if the stored set lacks them. */
add_action('init', function () {
    $stored = get_option('rewrite_rules');
    if (is_array($stored) && $stored && !isset($stored['^funding-report/?$'])) {
        flush_rewrite_rules(false);
    }
}, 999);

add_filter('query_vars', function ($vars) {
    $vars[] = 'xf_fr';
    return $vars;
});

/** ['index'] or [YYYY-MM, report] for the request, null when this is not a report URL. */
function xf_fr_request() {
    $v = (string) get_query_var('xf_fr');
    if ($v === '') return null;
    if ($v === 'index') return ['index', null];
    return [$v, preg_match('/^\d{4}-\d{2}$/', $v) ? xf_fr_report($v) : null];
}

function xf_fr_is_indexable() {
    $req = xf_fr_request();
    if (!$req) return false;
    if ($req[0] === 'index') {
        return (bool) array_filter(array_column(xf_fr_reports(), 'indexable'));
    }
    return !empty($req[1]['indexable']);
}

// Not the blog home: no posts query, no 404 handling by core, our own template.
add_action('parse_query', function ($q) {
    if ($q->is_main_query() && $q->get('xf_fr')) {
        $q->is_home = false;
    }
});
add_filter('posts_pre_query', function ($posts, $q) {
    return $q->is_main_query() && $q->get('xf_fr') ? [] : $posts;
}, 10, 2);
add_filter('pre_handle_404', function ($skip, $q) {
    return $q->get('xf_fr') ? true : $skip;
}, 10, 2);
add_action('template_redirect', function () {
    $req = xf_fr_request();
    if ($req && $req[0] !== 'index' && !$req[1]) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        nocache_headers();
    }
});
add_filter('template_include', function ($template) {
    if (xf_fr_request() && !is_404() && ($t = locate_template('funding-report.php'))) {
        return $t;
    }
    return $template;
});

add_filter('xf_page_allows_ads', function ($ok) {
    return xf_fr_request() ? $ok && xf_fr_is_indexable() : $ok; // No ads on thin (noindexed) reports.
});

/* ---- Head: title, description, canonical, robots, JSON-LD ---- */

function xf_fr_title() {
    $req = xf_fr_request();
    if (!$req) return '';
    return $req[0] === 'index' ? 'Indian Startup Funding Reports, Month by Month' : 'Indian Startup Funding Report: ' . xf_fr_label($req[0]);
}

function xf_fr_description() {
    $req = xf_fr_request();
    if (!$req) return '';
    if ($req[0] === 'index') {
        return 'Monthly reports on Indian startup funding rounds tracked by 100xFounder: totals, biggest rounds, stages, sectors, cities and investors, with a source for every round.';
    }
    $r = $req[1];
    $text = sprintf('%s: %d sourced funding rounds by Indian startups tracked by 100xFounder', xf_fr_label($r['month']), $r['count']);
    if ($r['total_usd'] > 0) {
        $text .= sprintf(', %s disclosed across %d of them', xf_format_usd_short($r['total_usd']), $r['disclosed']);
        $top = $r['rows'][0];
        $text .= sprintf('. Largest: %s (%s, %s)', $top['company'], $top['stage'], $top['display']);
    }
    return $text . '. Breakdown by stage, sector, city and investor.';
}

add_filter('pre_get_document_title', function ($title) {
    $t = xf_fr_request() && !is_404() ? xf_fr_title() : '';
    return $t ? $t . ' | ' . get_bloginfo('name') : $title;
}, 20);

// seo.php prints the meta description at wp_head:2 and falls back to the tagline on virtual pages.
$xf_fr_desc_filter = function ($v) { return xf_fr_description() ?: $v; };
add_action('wp_head', function () use ($xf_fr_desc_filter) {
    if (xf_fr_request() && !is_404()) add_filter('option_blogdescription', $xf_fr_desc_filter);
}, 1);
add_action('wp_head', function () use ($xf_fr_desc_filter) {
    remove_filter('option_blogdescription', $xf_fr_desc_filter);
}, 3);

add_filter('wp_robots', function ($robots) {
    if (xf_fr_request() && !is_404() && !xf_fr_is_indexable()) {
        unset($robots['index'], $robots['max-image-preview']);
        $robots['noindex'] = true;
        $robots['follow'] = true;
    }
    return $robots;
}, 30);

add_action('wp_head', function () {
    $req = xf_fr_request();
    if (!$req || is_404()) return;
    $url = xf_fr_url($req[0] === 'index' ? '' : $req[0]);
    printf('<link rel="canonical" href="%s">' . "\n", esc_url($url));
    $crumbs = xf_fr_crumbs();
    $items = [];
    foreach ($crumbs as $i => [$name, $u]) {
        $items[] = array_filter(['@type' => 'ListItem', 'position' => $i + 1, 'name' => $name, 'item' => $i === count($crumbs) - 1 ? null : $u]);
    }
    xf_json_ld(['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $items]);
    if ($req[0] === 'index') return;
    $r = $req[1];
    $final = (array) get_option('xf_fr_final', []);
    $published = gmdate('c', $final[$r['month']] ?? strtotime(gmdate('Y-m-01', strtotime($r['month'] . '-01 +1 month')) . ' UTC'));
    $modified = max($published, gmdate('c', strtotime($r['modified'] . ' UTC')));
    $publisher = function_exists('xf_publisher_schema') ? xf_publisher_schema() : ['@type' => 'Organization', 'name' => get_bloginfo('name')];
    xf_json_ld([
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => xf_fr_title(),
        'description' => xf_fr_description(),
        'datePublished' => $published,
        'dateModified' => $modified,
        'author' => $publisher,
        'publisher' => $publisher,
        'mainEntityOfPage' => $url,
        'articleSection' => 'Funding',
        'inLanguage' => 'en',
    ]);
    xf_json_ld([
        '@context' => 'https://schema.org',
        '@type' => 'Dataset',
        'name' => 'Indian startup funding rounds tracked by 100xFounder, ' . xf_fr_label($r['month']),
        'description' => 'One row per funding round announced by an Indian startup in ' . xf_fr_label($r['month']) . ' and tracked by 100xFounder: company, stage, sector, city, investors, amount (USD where disclosed), announcement date and source link. Covers rounds tracked by 100xFounder, not the whole market.',
        'url' => $url,
        'creator' => $publisher,
        'temporalCoverage' => $r['month'] . '-01/' . gmdate('Y-m-t', strtotime($r['month'] . '-01')),
        'spatialCoverage' => ['@type' => 'Place', 'name' => 'India'],
        'variableMeasured' => ['Company', 'Round stage', 'Sector', 'City', 'Investors', 'Amount (USD)', 'Announcement date', 'Source URL'],
        'isAccessibleForFree' => true,
        'dateModified' => $modified,
    ]);
}, 6);

/** Home › Funding tracker › Funding report › Month. */
function xf_fr_crumbs() {
    $req = xf_fr_request();
    $trail = [['Home', home_url('/')], ['Funding tracker', function_exists('xf_page_url') ? xf_page_url('funding') : home_url('/funding-tracker/')]];
    if ($req && $req[0] !== 'index') {
        $trail[] = ['Funding report', xf_fr_url()];
        $trail[] = [xf_fr_label($req[0]), null];
    } else {
        $trail[] = ['Funding report', null];
    }
    return $trail;
}

/* ---- Sitemap: the index and every indexable month ---- */

function xf_fr_sitemap_urls() {
    $urls = [];
    foreach (xf_fr_reports() as $ym => $r) {
        if ($r['indexable']) $urls[] = ['loc' => xf_fr_url($ym), 'lastmod' => gmdate('c', strtotime($r['modified'] . ' UTC'))];
    }
    return $urls ? array_merge([['loc' => xf_fr_url()]], $urls) : [];
}

add_action('init', function () {
    if (!function_exists('wp_register_sitemap_provider') || !class_exists('WP_Sitemaps_Provider')) {
        return;
    }
    if (!class_exists('XF_Funding_Report_Sitemap')) {
        class XF_Funding_Report_Sitemap extends WP_Sitemaps_Provider {
            public function __construct() {
                $this->name = 'fundingreport';
                $this->object_type = 'fundingreport';
            }
            public function get_url_list($page_num, $object_subtype = '') {
                return xf_fr_sitemap_urls();
            }
            public function get_max_num_pages($object_subtype = '') {
                return xf_fr_sitemap_urls() ? 1 : 0;
            }
        }
    }
    wp_register_sitemap_provider('fundingreport', new XF_Funding_Report_Sitemap());
}, 20);

/* ---- Monthly cron: finalise last month on (or after) the 2nd ---- */

add_action('init', function () {
    if (!wp_next_scheduled('xf_fr_monthly')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'xf_fr_monthly');
    }
});

add_action('xf_fr_monthly', function () {
    $months = xf_fr_reports();
    foreach ($months as $r) {
        if ($r['total_usd'] > 0 && !$r['rate']) {
            delete_option('xf_fr_cache'); // Retry the exchange rate that failed last time.
            break;
        }
    }
    if ((int) wp_date('j') < 2) {
        return;
    }
    $ym = xf_fr_prev_month(wp_date('Y-m'));
    $final = (array) get_option('xf_fr_final', []);
    if (isset($final[$ym])) {
        return;
    }
    xf_fr_finalise($ym);
});

function xf_fr_finalise($ym) {
    delete_option('xf_fr_cache');
    $final = (array) get_option('xf_fr_final', []);
    $final[$ym] = time();
    update_option('xf_fr_final', $final, false);
    $r = xf_fr_report($ym);
    if (!$r) {
        return 0;
    }
    if ($r['indexable'] && function_exists('xf_indexnow_submit')) {
        xf_indexnow_submit([xf_fr_url($ym), xf_fr_url()]);
    }
    return xf_fr_summary_post($r);
}

/**
 * A short Pending post in the funding category, written from the numbers only. Updates our own
 * draft on re-runs; once someone has published it, it is theirs and is left alone.
 */
function xf_fr_summary_post(array $r) {
    $ym = $r['month'];
    $existing = get_posts(['post_type' => 'post', 'post_status' => 'any', 'meta_key' => '_xf_fr_month', 'meta_value' => $ym, 'numberposts' => 1]);
    if ($existing && !in_array($existing[0]->post_status, ['pending', 'draft'], true)) {
        return $existing[0]->ID;
    }
    $month = xf_fr_label($ym);
    $n = $r['count'];
    $title = sprintf('Indian startup funding in %s: %d %s, %s', $month, $n, _n('round', 'rounds', $n), $r['total_usd'] > 0 ? xf_format_usd_short($r['total_usd']) . ' raised' : 'amounts undisclosed');
    $link = function ($row) { return '<a href="' . esc_url($row['url']) . '">' . esc_html($row['company']) . '</a>'; };
    $src = function ($row) { return ' (<a href="' . esc_url($row['source']) . '" rel="nofollow noopener" target="_blank">source</a>)'; };

    $p = [];
    $p[] = sprintf('100xFounder tracked %d funding %s announced by Indian startups in %s, each backed by a published source.', $n, _n('round', 'rounds', $n), $month);
    if ($r['total_usd'] > 0) {
        $s = sprintf('%d of them disclosed an amount, adding up to %s', $r['disclosed'], xf_format_usd_short($r['total_usd']));
        if ($r['rate']) {
            $s .= sprintf(' (about %s at the European Central Bank reference rate of ₹%s per US dollar on %s)', xf_fr_format_inr($r['total_inr']), number_format($r['rate']['rate'], 2), gmdate('j F Y', strtotime($r['rate']['date'])));
        }
        $p[] = $s . '.';
        $top = $r['rows'][0];
        $p[] = sprintf('The largest disclosed round was %s\'s %s of %s%s%s.', $link($top), $top['stage'] === 'Not stated' ? 'round' : esc_html($top['stage']) . ' round', esc_html($top['display']), $top['lead'] ? ', led by ' . esc_html($top['lead']) : '', $src($top));
    }
    if ($r['undisclosed']) {
        $p[] = sprintf('%d %s did not disclose an amount.', $r['undisclosed'], _n('round', 'rounds', $r['undisclosed']));
    }
    foreach (['stage' => 'stage', 'sector' => 'sector', 'city' => 'city'] as $key => $word) {
        $byn = $r[$key];
        unset($byn['Not stated']);
        if (!$byn) continue;
        uasort($byn, function ($a, $b) { return $b['n'] <=> $a['n']; });
        $label = array_key_first($byn);
        $p[] = sprintf('By %s, %s had the most rounds (%d).', $word, esc_html($label), $byn[$label]['n']);
    }
    if ($r['investors'] && $r['investors'][0]['n'] > 1) {
        $p[] = sprintf('%s took part in the most rounds (%d).', esc_html($r['investors'][0]['name']), $r['investors'][0]['n']);
    }
    $prev = xf_fr_report(xf_fr_prev_month($ym));
    if ($prev) {
        $p[] = sprintf('For comparison, 100xFounder tracked %d %s in %s, with %s disclosed.', $prev['count'], _n('round', 'rounds', $prev['count']), xf_fr_label($prev['month']), $prev['total_usd'] > 0 ? xf_format_usd_short($prev['total_usd']) : 'no amounts');
    }
    $html = '';
    foreach ($p as $para) $html .= '<p>' . $para . '</p>' . "\n";
    $top = array_slice(array_filter($r['rows'], function ($row) { return $row['usd'] > 0; }), 0, 5);
    if ($top) {
        $html .= '<h2>Biggest disclosed rounds</h2>' . "\n<ol>\n";
        foreach ($top as $row) {
            $html .= '<li>' . $link($row) . ': ' . esc_html($row['display']) . ', ' . esc_html($row['stage']) . $src($row) . "</li>\n";
        }
        $html .= "</ol>\n";
    }
    $html .= '<p>These figures cover rounds tracked by 100xFounder, not the whole market. <a href="' . esc_url(xf_fr_url($ym)) . '">Read the full ' . esc_html($month) . ' funding report</a>, with breakdowns by stage, sector, city and investor, and the method behind the numbers.</p>';

    $author = get_user_by('slug', 'ishaan-vardhan');
    $cat = get_category_by_slug('funding');
    $post = [
        'post_type' => 'post',
        'post_status' => 'pending',
        'post_title' => $title,
        'post_name' => 'startup-funding-india-' . strtolower(gmdate('F', strtotime($ym . '-01'))),
        'post_content' => $html,
        'post_excerpt' => xf_fr_description_for($r),
        'post_category' => $cat ? [$cat->term_id] : [],
        'meta_input' => ['_xf_fr_month' => $ym],
    ];
    if ($author) $post['post_author'] = $author->ID;
    if ($existing) {
        $post['ID'] = $existing[0]->ID;
        unset($post['post_name']);
    }
    $id = wp_insert_post(wp_slash($post), true);
    if (is_wp_error($id)) {
        return 0;
    }
    if (get_post_field('post_name', $id) === '') {
        // Core blanks the slug of Pending posts saved without publish rights (cron); keep the short, year-free one.
        global $wpdb;
        $wpdb->update($wpdb->posts, ['post_name' => wp_unique_post_slug('startup-funding-india-' . strtolower(gmdate('F', strtotime($ym . '-01'))), $id, 'publish', 'post', 0)], ['ID' => $id]);
        clean_post_cache($id);
    }
    if (function_exists('xf_save_sources')) {
        xf_save_sources($id, array_map(function ($row) {
            return ['url' => $row['source'], 'date' => $row['date'], 'claim' => $row['company'] . ' ' . $row['stage'] . ': ' . $row['display']];
        }, $r['rows']));
    }
    return $id;
}

/** The month's meta description, outside a request (for the summary post's excerpt). */
function xf_fr_description_for(array $r) {
    $text = sprintf('%d sourced funding rounds by Indian startups in %s', $r['count'], xf_fr_label($r['month']));
    if ($r['total_usd'] > 0) $text .= sprintf(', %s disclosed across %d of them', xf_format_usd_short($r['total_usd']), $r['disclosed']);
    return $text . '.';
}

/* ---- Output helpers used by the theme ---- */

/**
 * Horizontal bar chart as inline SVG: label and value on one line, the bar under it, so the text
 * stays readable when the chart shrinks to a phone. Bars show disclosed USD when the group has
 * any, otherwise round counts. Top 8 rows, the rest folded into "Other".
 */
function xf_fr_bar_chart($id, $title, array $groups) {
    $by_usd = array_sum(array_column($groups, 'usd')) > 0;
    $rows = array_slice($groups, 0, count($groups) > 9 ? 8 : 9, true);
    if (count($groups) > 9) {
        $rest = array_slice($groups, 8, null, true);
        $rows['Other (' . count($rest) . ')'] = ['n' => array_sum(array_column($rest, 'n')), 'usd' => array_sum(array_column($rest, 'usd'))];
    }
    $max = max(array_map(function ($g) use ($by_usd) { return $by_usd ? $g['usd'] : $g['n']; }, $rows)) ?: 1;
    $w = 400;
    $rh = 44;
    $h = count($rows) * $rh;
    $desc = [];
    $out = '';
    $i = 0;
    foreach ($rows as $label => $g) {
        $val = $by_usd ? $g['usd'] : $g['n'];
        $text = ($by_usd ? ($g['usd'] > 0 ? xf_format_usd_short($g['usd']) : '—') . ' · ' : '') . $g['n'] . ' ' . _n('round', 'rounds', $g['n']);
        $desc[] = $label . ': ' . $text;
        $y = $i * $rh;
        $out .= '<text class="fr-l" x="0" y="' . ($y + 16) . '">' . esc_html(mb_strimwidth((string) $label, 0, 26, '…')) . '</text>';
        $out .= '<text class="fr-v" x="' . $w . '" y="' . ($y + 16) . '" text-anchor="end">' . esc_html($text) . '</text>';
        $out .= '<rect class="fr-track" x="0" y="' . ($y + 24) . '" width="' . $w . '" height="8" rx="4"/>';
        $out .= '<rect class="fr-bar" x="0" y="' . ($y + 24) . '" width="' . max(3, round($val / $max * $w, 1)) . '" height="8" rx="4"/>';
        $i++;
    }
    $measure = $by_usd ? 'Bars show disclosed amount in US dollars.' : 'Bars show number of rounds.';
    return '<svg class="fr-svg" viewBox="0 0 ' . $w . ' ' . $h . '" width="100%" role="img" aria-labelledby="' . esc_attr($id) . '-t ' . esc_attr($id) . '-d">'
        . '<title id="' . esc_attr($id) . '-t">' . esc_html($title) . '</title>'
        . '<desc id="' . esc_attr($id) . '-d">' . esc_html($measure . ' ' . implode('; ', $desc) . '.') . '</desc>'
        . $out . '</svg>';
}

/** "Monthly reports" block for the funding tracker and the funding category. */
function xf_fr_links_html($limit = 6) {
    $months = array_slice(xf_fr_reports(), 0, $limit, true);
    if (!$months) {
        return '';
    }
    $out = '<section class="wrap fr-links" style="padding-top:48px"><div class="sh"><h2>Monthly funding reports</h2><a class="k u" href="' . esc_url(xf_fr_url()) . '">All reports →</a></div>'
        . '<p class="muted" style="margin:14px 0 18px;max-width:720px">Each month in numbers: total disclosed, biggest rounds, stages, sectors, cities and investors, with a source for every round.</p><div class="pillars">';
    foreach ($months as $ym => $r) {
        $out .= '<a class="pc" href="' . esc_url(xf_fr_url($ym)) . '"><span class="pw">' . esc_html($r['total_usd'] > 0 ? xf_format_usd_short($r['total_usd']) : $r['count'] . ' rounds') . '</span>'
            . '<span class="meta" style="display:block;margin-top:6px">' . esc_html(xf_fr_label($ym) . ' · ' . $r['count'] . ' ' . _n('round', 'rounds', $r['count'])) . '</span></a>';
    }
    return $out . '</div></section>';
}
