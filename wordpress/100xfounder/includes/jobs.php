<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * Jobs from official sources only: each company is a term in "xf_company"
 * with its public applicant-tracking feed (Greenhouse, Lever or Ashby).
 * A daily sync imports roles in India (and India-friendly remote roles),
 * updates them, and expires the ones the company has taken down.
 * ---------------------------------------------------------------------- */

const XF_JOB_FUNCTIONS = ['Engineering', 'AI & ML', 'Data', 'Product', 'Design', 'Marketing', 'Sales', 'Operations'];
const XF_JOB_CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Remote'];

add_action('init', function () {
    register_post_type('xf_job', [
        'labels' => ['name' => 'Jobs', 'singular_name' => 'Job', 'add_new_item' => 'Add job', 'edit_item' => 'Edit job'],
        'public' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'job', 'with_front' => false],
        'menu_icon' => 'dashicons-businessman',
        'supports' => ['title', 'editor'],
        'show_in_rest' => true,
    ]);
    register_taxonomy('xf_company', ['xf_job'], [
        'labels' => ['name' => 'Companies', 'singular_name' => 'Company', 'add_new_item' => 'Add company', 'edit_item' => 'Edit company'],
        'public' => true,
        'hierarchical' => false,
        'show_admin_column' => true,
        'rewrite' => ['slug' => 'jobs/company', 'with_front' => false],
        'show_in_rest' => true,
    ]);
    // /jobs/ai-ml-jobs-in-bengaluru/, /jobs/marketing-jobs/, /jobs/jobs-in-pune/
    add_rewrite_rule('^jobs/([a-z0-9-]+)/?$', 'index.php?pagename=jobs&xf_jobs_slug=$matches[1]', 'top');
});

add_filter('query_vars', function ($vars) {
    $vars[] = 'xf_jobs_slug';
    return $vars;
});

xf_register_fields('xf_job', 'Job details', [
    'company_name' => ['Company', 'text'],
    'location' => ['Location (as listed)', 'text'],
    'city' => ['City', 'select', array_merge([''], XF_JOB_CITIES, ['Other'])],
    'workplace' => ['Workplace', 'select', ['On-site', 'Hybrid', 'Remote']],
    'type' => ['Employment type', 'select', ['Full-time', 'Part-time', 'Contract', 'Internship']],
    'function' => ['Function', 'select', XF_JOB_FUNCTIONS],
    'level' => ['Level', 'select', ['', 'Intern', 'Entry', 'Mid', 'Senior', 'Lead']],
    'salary_min' => ['Salary minimum (yearly)', 'number'],
    'salary_max' => ['Salary maximum (yearly)', 'number'],
    'salary_currency' => ['Currency', 'select', ['INR', 'USD', 'EUR', 'GBP']],
    'apply_url' => ['Official apply link (required)', 'url'],
    'valid_through' => ['Open until', 'date', null, 'Defaults to 45 days after posting. Expired jobs are unpublished automatically.'],
    'hot' => ['"Founder replies fast" tag', 'select', ['', 'yes']],
]);

/* ---- Company job sources (term meta) ---- */

function xf_company_fields() {
    return [
        'ats' => ['Job feed type', ['', 'greenhouse', 'lever', 'ashby']],
        'board' => ['Job board ID', null, 'The name in the feed URL, e.g. "razorpay" in jobs.lever.co/razorpay.'],
        'careers_url' => ['Official careers page', null, ''],
        'website' => ['Website', null, ''],
        'stage' => ['Stage', ['', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Public', 'Bootstrapped']],
    ];
}

foreach (['xf_company_add_form_fields', 'xf_company_edit_form_fields'] as $hook) {
    add_action($hook, function ($term = null) use ($hook) {
        foreach (xf_company_fields() as $key => [$label, $options, $help]) {
            $value = is_object($term) ? (string) get_term_meta($term->term_id, 'xf_' . $key, true) : '';
            $field = is_array($options)
                ? '<select name="xf_' . esc_attr($key) . '">' . implode('', array_map(function ($o) use ($value) { return '<option value="' . esc_attr($o) . '"' . selected($value, $o, false) . '>' . esc_html($o ?: '—') . '</option>'; }, $options)) . '</select>'
                : '<input name="xf_' . esc_attr($key) . '" value="' . esc_attr($value) . '" class="regular-text">';
            $help_html = $help ? '<p class="description">' . esc_html($help) . '</p>' : '';
            if ($hook === 'xf_company_edit_form_fields') {
                echo '<tr class="form-field"><th scope="row"><label>' . esc_html($label) . '</label></th><td>' . $field . $help_html . '</td></tr>'; // phpcs:ignore
            } else {
                echo '<div class="form-field"><label>' . esc_html($label) . '</label>' . $field . $help_html . '</div>'; // phpcs:ignore
            }
        }
        wp_nonce_field('xf_company_meta', 'xf_company_nonce');
    });
}

foreach (['created_xf_company', 'edited_xf_company'] as $hook) {
    add_action($hook, function ($term_id) {
        if (!isset($_POST['xf_company_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_company_nonce'])), 'xf_company_meta') || !current_user_can('manage_categories')) {
            return;
        }
        foreach (array_keys(xf_company_fields()) as $key) {
            $raw = sanitize_text_field(wp_unslash($_POST['xf_' . $key] ?? ''));
            update_term_meta($term_id, 'xf_' . $key, in_array($key, ['careers_url', 'website'], true) ? esc_url_raw($raw) : $raw);
        }
    });
}

/** The verified official feeds the site starts with (checked 2026-10-04). */
function xf_default_job_sources() {
    return [
        ['Paytm', 'lever', 'paytm', 'https://paytm.com/careers'],
        ['Meesho', 'lever', 'meesho', 'https://www.meesho.io/careers'],
        ['CRED', 'lever', 'cred', 'https://careers.cred.club'],
        ['FamPay', 'lever', 'fampay', 'https://fampay.in/careers'],
        ['Mindtickle', 'lever', 'mindtickle', 'https://www.mindtickle.com/about-us/careers/'],
        ['Groww', 'greenhouse', 'groww', 'https://groww.in/careers'],
        ['Databricks', 'greenhouse', 'databricks', 'https://www.databricks.com/company/careers'],
        ['HighRadius', 'greenhouse', 'highradius', 'https://www.highradius.com/careers/'],
        ['Stripe', 'greenhouse', 'stripe', 'https://stripe.com/jobs'],
        ['Druva', 'greenhouse', 'druva', 'https://www.druva.com/about/careers'],
        ['Coinbase', 'greenhouse', 'coinbase', 'https://www.coinbase.com/careers'],
        ['Agoda', 'greenhouse', 'agoda', 'https://careersatagoda.com'],
        ['Airbnb', 'greenhouse', 'airbnb', 'https://careers.airbnb.com'],
        ['Anthropic', 'greenhouse', 'anthropic', 'https://www.anthropic.com/careers'],
        ['Observe.AI', 'greenhouse', 'observeai', 'https://www.observe.ai/careers'],
        ['Vercel', 'greenhouse', 'vercel', 'https://vercel.com/careers'],
        ['Figma', 'greenhouse', 'figma', 'https://www.figma.com/careers/'],
        ['Tekion', 'ashby', 'tekion', 'https://tekion.com/careers'],
        ['Sarvam AI', 'ashby', 'sarvam', 'https://www.sarvam.ai/careers'],
        ['ElevenLabs', 'ashby', 'elevenlabs', 'https://elevenlabs.io/careers'],
        ['OpenAI', 'ashby', 'openai', 'https://openai.com/careers'],
        ['Notion', 'ashby', 'notion', 'https://www.notion.com/careers'],
        ['Atlan', 'ashby', 'atlan', 'https://atlan.com/careers/'],
    ];
}

function xf_seed_job_sources() {
    foreach (xf_default_job_sources() as [$name, $ats, $board, $careers]) {
        $term = term_exists(sanitize_title($name), 'xf_company') ?: wp_insert_term($name, 'xf_company', ['slug' => sanitize_title($name)]);
        if (is_wp_error($term)) {
            continue;
        }
        $id = (int) (is_array($term) ? $term['term_id'] : $term);
        if (!get_term_meta($id, 'xf_ats', true)) {
            update_term_meta($id, 'xf_ats', $ats);
            update_term_meta($id, 'xf_board', $board);
            update_term_meta($id, 'xf_careers_url', $careers);
        }
    }
}

/* ---- Classification ---- */

function xf_job_city($location) {
    $l = strtolower((string) $location);
    $map = [
        'Bengaluru' => ['bengaluru', 'bangalore'],
        'Mumbai' => ['mumbai', 'navi mumbai', 'thane'],
        'Delhi NCR' => ['delhi', 'gurugram', 'gurgaon', 'noida', 'ncr', 'faridabad', 'ghaziabad'],
        'Hyderabad' => ['hyderabad'],
        'Pune' => ['pune'],
        'Chennai' => ['chennai'],
        'Kolkata' => ['kolkata'],
        'Ahmedabad' => ['ahmedabad'],
    ];
    foreach ($map as $city => $needles) {
        foreach ($needles as $n) {
            if (strpos($l, $n) !== false) {
                return $city;
            }
        }
    }
    return strpos($l, 'remote') !== false ? 'Remote' : '';
}

/** India roles, plus remote roles open to India/APAC/anywhere. */
function xf_job_is_relevant($location, $remote) {
    $l = strtolower((string) $location);
    if (xf_job_city($l) && xf_job_city($l) !== 'Remote') return true;
    if (strpos($l, 'india') !== false) return true;
    if ($remote && preg_match('/india|apac|asia|anywhere|worldwide|global/', $l)) return true;
    return false;
}

function xf_job_function($title, $department = '') {
    $t = ' ' . strtolower($title . ' ' . $department) . ' ';
    $rules = [
        'AI & ML' => '/machine learning|\bml\b|\bai\b|artificial intelligence|llm|deep learning|research scientist|applied scientist|computer vision|nlp/',
        'Data' => '/data (analyst|engineer|scien)|analytics|business intelligence|\bbi\b/',
        'Design' => '/design|\bux\b|\bui\b|illustrat/',
        'Product' => '/product manager|product owner|\bpm\b|product lead|head of product|program manager/',
        'Marketing' => '/marketing|growth|\bseo\b|content|brand|community|social media|communications|\bpr\b/',
        'Sales' => '/sales|account (executive|manager)|business development|\bbdr\b|\bsdr\b|partnership|customer success|solutions engineer|presales/',
        'Engineering' => '/engineer|developer|\bsre\b|devops|backend|frontend|full[ -]?stack|android|\bios\b|\bqa\b|test|security|architect|infrastructure|platform/',
    ];
    foreach ($rules as $fn => $re) {
        if (preg_match($re, $t)) return $fn;
    }
    return 'Operations';
}

function xf_job_level($title) {
    $t = strtolower($title);
    if (preg_match('/intern\b|internship|trainee/', $t)) return 'Intern';
    if (preg_match('/\b(head|director|vp|vice president|principal|staff|lead|manager)\b/', $t)) return 'Lead';
    if (preg_match('/\b(senior|sr\.?|iii)\b/', $t)) return 'Senior';
    if (preg_match('/\b(junior|jr\.?|associate|entry|graduate|fresher|i)\b/', $t)) return 'Entry';
    return 'Mid';
}

function xf_job_type($text) {
    $t = strtolower((string) $text);
    if (strpos($t, 'intern') !== false) return 'Internship';
    if (strpos($t, 'contract') !== false || strpos($t, 'temporary') !== false) return 'Contract';
    if (strpos($t, 'part') !== false) return 'Part-time';
    return 'Full-time';
}

/* ---- Feed readers: each returns a list of normalised jobs ---- */

function xf_fetch_json($url) {
    $r = wp_remote_get($url, ['timeout' => 25, 'limit_response_size' => 20000000, 'user-agent' => '100xFounderBot/1.0 (+' . home_url('/') . ')']);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) {
        throw new RuntimeException('Feed request failed: ' . $url);
    }
    return json_decode(wp_remote_retrieve_body($r), true);
}

function xf_read_feed($ats, $board) {
    $board = rawurlencode($board);
    $jobs = [];
    if ($ats === 'greenhouse') {
        $data = xf_fetch_json("https://boards-api.greenhouse.io/v1/boards/$board/jobs?content=true");
        foreach ($data['jobs'] ?? [] as $j) {
            $loc = $j['location']['name'] ?? '';
            $jobs[] = [
                'id' => 'gh:' . $j['id'], 'title' => $j['title'], 'location' => $loc,
                'remote' => stripos($loc, 'remote') !== false,
                'department' => $j['departments'][0]['name'] ?? '',
                'type' => '', 'url' => $j['absolute_url'],
                'posted' => $j['first_published'] ?? $j['updated_at'] ?? '',
                'html' => html_entity_decode((string) ($j['content'] ?? ''), ENT_QUOTES | ENT_HTML5),
                'salary' => null,
            ];
        }
    } elseif ($ats === 'lever') {
        $data = xf_fetch_json("https://api.lever.co/v0/postings/$board?mode=json");
        foreach ((array) $data as $j) {
            $cats = $j['categories'] ?? [];
            $loc = implode(' / ', array_filter(array_merge([$cats['location'] ?? ''], (array) ($cats['allLocations'] ?? []))));
            $lists = '';
            foreach ($j['lists'] ?? [] as $list) {
                $lists .= '<h3>' . esc_html($list['text'] ?? '') . '</h3><ul>' . ($list['content'] ?? '') . '</ul>';
            }
            $sal = $j['salaryRange'] ?? null;
            $jobs[] = [
                'id' => 'lever:' . $j['id'], 'title' => $j['text'], 'location' => $loc,
                'remote' => ($j['workplaceType'] ?? '') === 'remote' || stripos($loc, 'remote') !== false,
                'hybrid' => ($j['workplaceType'] ?? '') === 'hybrid',
                'department' => $cats['team'] ?? ($cats['department'] ?? ''),
                'type' => $cats['commitment'] ?? '', 'url' => $j['hostedUrl'],
                'posted' => isset($j['createdAt']) ? gmdate('c', (int) ($j['createdAt'] / 1000)) : '',
                'html' => ($j['description'] ?? '') . $lists . ($j['additional'] ?? ''),
                'salary' => $sal && !empty($sal['min']) ? ['min' => $sal['min'], 'max' => $sal['max'] ?? $sal['min'], 'currency' => $sal['currency'] ?? '', 'interval' => $sal['interval'] ?? ''] : null,
            ];
        }
    } elseif ($ats === 'ashby') {
        $data = xf_fetch_json("https://api.ashbyhq.com/posting-api/job-board/$board?includeCompensation=true");
        foreach ($data['jobs'] ?? [] as $j) {
            if (isset($j['isListed']) && !$j['isListed']) continue;
            $loc = implode(' / ', array_filter(array_merge([$j['location'] ?? ''], array_map(function ($s) { return $s['location'] ?? ''; }, (array) ($j['secondaryLocations'] ?? [])))));
            $jobs[] = [
                'id' => 'ashby:' . $j['id'], 'title' => $j['title'], 'location' => $loc,
                'remote' => !empty($j['isRemote']) || ($j['workplaceType'] ?? '') === 'Remote',
                'hybrid' => ($j['workplaceType'] ?? '') === 'Hybrid',
                'department' => $j['department'] ?? ($j['team'] ?? ''),
                'type' => $j['employmentType'] ?? '', 'url' => $j['jobUrl'],
                'posted' => $j['publishedAt'] ?? '',
                'html' => $j['descriptionHtml'] ?? '',
                'salary' => null,
                'salary_text' => $j['compensation']['compensationTierSummary'] ?? '',
            ];
        }
    } else {
        throw new RuntimeException('Unknown feed type ' . $ats);
    }
    return $jobs;
}

function xf_find_job($external_id) {
    $ids = get_posts(['post_type' => 'xf_job', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids', 'meta_key' => '_xf_external_id', 'meta_value' => $external_id]);
    return $ids ? (int) $ids[0] : 0;
}

/** Syncs one company. Returns counts. */
function xf_sync_company_jobs(WP_Term $company) {
    $ats = get_term_meta($company->term_id, 'xf_ats', true);
    $board = get_term_meta($company->term_id, 'xf_board', true);
    if (!$ats || !$board) {
        return ['skipped' => 'no feed'];
    }
    $created = $updated = $expired = 0;
    $seen = [];
    foreach (xf_read_feed($ats, $board) as $job) {
        if (!xf_job_is_relevant($job['location'], $job['remote'])) {
            continue;
        }
        $seen[] = $job['id'];
        $posted = $job['posted'] ? strtotime($job['posted']) : time();
        $city = xf_job_city($job['location']) ?: ($job['remote'] ? 'Remote' : 'Other');
        $meta = [
            '_xf_external_id' => $job['id'],
            '_xf_source' => $ats,
            '_xf_company_name' => $company->name,
            '_xf_location' => mb_substr($job['location'], 0, 200),
            '_xf_city' => $city,
            '_xf_workplace' => $job['remote'] ? 'Remote' : (!empty($job['hybrid']) ? 'Hybrid' : 'On-site'),
            '_xf_type' => xf_job_type($job['type'] . ' ' . $job['title']),
            '_xf_function' => xf_job_function($job['title'], $job['department']),
            '_xf_level' => xf_job_level($job['title']),
            '_xf_apply_url' => esc_url_raw($job['url']),
            '_xf_valid_through' => gmdate('Y-m-d', max($posted, time()) + 45 * DAY_IN_SECONDS),
            '_xf_last_seen' => time(),
        ];
        if (!empty($job['salary'])) {
            $mult = stripos((string) $job['salary']['interval'], 'month') !== false ? 12 : 1;
            $meta['_xf_salary_min'] = (float) $job['salary']['min'] * $mult;
            $meta['_xf_salary_max'] = (float) $job['salary']['max'] * $mult;
            $meta['_xf_salary_currency'] = strtoupper((string) $job['salary']['currency']);
        }
        if (!empty($job['salary_text'])) {
            $meta['_xf_salary_text'] = sanitize_text_field($job['salary_text']);
        }
        $existing = xf_find_job($job['id']);
        if ($existing) {
            foreach ($meta as $k => $v) update_post_meta($existing, $k, $v);
            if (get_post_status($existing) !== 'publish' && get_post_meta($existing, '_xf_expired', true)) {
                delete_post_meta($existing, '_xf_expired');
                wp_update_post(['ID' => $existing, 'post_status' => 'publish']);
            }
            $updated++;
            continue;
        }
        $post_id = wp_insert_post([
            'post_type' => 'xf_job',
            'post_status' => 'publish',
            'post_title' => wp_strip_all_tags($job['title']),
            'post_name' => sanitize_title($company->name . ' ' . $job['title'] . ' ' . substr(md5($job['id']), 0, 6)),
            'post_content' => wp_kses_post($job['html']),
            'post_date_gmt' => gmdate('Y-m-d H:i:s', min($posted, time())),
            'meta_input' => $meta,
        ], true);
        if (!is_wp_error($post_id)) {
            wp_set_object_terms($post_id, $company->term_id, 'xf_company');
            $created++;
        }
    }
    // Roles the company took down are unpublished (and Google is told).
    foreach (get_posts(['post_type' => 'xf_job', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'tax_query' => [['taxonomy' => 'xf_company', 'terms' => $company->term_id]], 'meta_query' => [['key' => '_xf_source', 'value' => $ats]]]) as $id) {
        if (!in_array(get_post_meta($id, '_xf_external_id', true), $seen, true)) {
            xf_expire_job($id);
            $expired++;
        }
    }
    update_term_meta($company->term_id, 'xf_last_sync', time());
    return compact('created', 'updated', 'expired');
}

function xf_expire_job($id) {
    update_post_meta($id, '_xf_expired', '1');
    wp_update_post(['ID' => $id, 'post_status' => 'draft']);
    xf_indexing_notify(get_permalink($id) ?: home_url('/?p=' . $id), 'URL_DELETED');
}

/** Syncs companies, least recently synced first, within a time budget. */
function xf_sync_jobs($budget_seconds = 120) {
    $start = time();
    $results = [];
    $terms = get_terms(['taxonomy' => 'xf_company', 'hide_empty' => false, 'meta_key' => 'xf_ats', 'meta_compare' => '!=', 'meta_value' => '']);
    usort($terms, function ($a, $b) {
        return (int) get_term_meta($a->term_id, 'xf_last_sync', true) <=> (int) get_term_meta($b->term_id, 'xf_last_sync', true);
    });
    foreach ($terms as $term) {
        if (time() - $start > $budget_seconds) {
            $results['_note'] = 'Time budget reached; remaining companies sync next run.';
            break;
        }
        try {
            $results[$term->name] = xf_sync_company_jobs($term);
        } catch (Throwable $e) {
            $results[$term->name] = ['error' => $e->getMessage()];
        }
    }
    // Manually added jobs past their "open until" date.
    foreach (get_posts(['post_type' => 'xf_job', 'post_status' => 'publish', 'posts_per_page' => 200, 'fields' => 'ids', 'meta_query' => [['key' => '_xf_valid_through', 'value' => gmdate('Y-m-d'), 'compare' => '<', 'type' => 'DATE']]]) as $id) {
        xf_expire_job($id);
    }
    return $results;
}

/* ---- Google Indexing API (allowed for job postings) ---- */

function xf_google_access_token() {
    $cached = get_transient('xf_google_token');
    if ($cached) {
        return $cached;
    }
    $sa = json_decode((string) xf_get_setting('google_service_account'), true);
    if (empty($sa['client_email']) || empty($sa['private_key'])) {
        return null;
    }
    $b64 = function ($data) { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); };
    $now = time();
    $unsigned = $b64(wp_json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . $b64(wp_json_encode([
        'iss' => $sa['client_email'], 'scope' => 'https://www.googleapis.com/auth/indexing',
        'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600,
    ]));
    if (!openssl_sign($unsigned, $signature, $sa['private_key'], 'sha256WithRSAEncryption')) {
        return null;
    }
    $r = wp_remote_post('https://oauth2.googleapis.com/token', ['timeout' => 15, 'body' => [
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $unsigned . '.' . $b64($signature),
    ]]);
    $token = is_wp_error($r) ? null : (json_decode(wp_remote_retrieve_body($r), true)['access_token'] ?? null);
    if ($token) {
        set_transient('xf_google_token', $token, 50 * MINUTE_IN_SECONDS);
    }
    return $token;
}

/** Tells Google a job URL was added/updated or removed. Capped under the default 200/day quota. */
function xf_indexing_notify($url, $type = 'URL_UPDATED') {
    if (!xf_get_setting('google_service_account') || preg_match('/localhost|127\.0\.0\.1/', $url)) {
        return;
    }
    $key = 'xf_indexing_count_' . gmdate('Ymd');
    $count = (int) get_transient($key);
    if ($count >= 190) {
        return;
    }
    $token = xf_google_access_token();
    if (!$token) {
        return;
    }
    set_transient($key, $count + 1, DAY_IN_SECONDS);
    wp_remote_post('https://indexing.googleapis.com/v3/urlNotifications:publish', [
        'timeout' => 10, 'blocking' => false,
        'headers' => ['Authorization' => 'Bearer ' . $token, 'Content-Type' => 'application/json'],
        'body' => wp_json_encode(['url' => $url, 'type' => $type]),
    ]);
}

add_action('transition_post_status', function ($new, $old, $post) {
    if ($post->post_type === 'xf_job' && $new === 'publish') {
        wp_schedule_single_event(time() + 15, 'xf_indexing_job', [$post->ID]);
    }
}, 10, 3);
add_action('xf_indexing_job', function ($id) {
    xf_indexing_notify(get_permalink($id), 'URL_UPDATED');
});

/* ---- Queries used by the theme ---- */

function xf_job_filters_from_request() {
    $f = [
        'q' => isset($_GET['q']) ? sanitize_text_field(wp_unslash($_GET['q'])) : '',
        'where' => isset($_GET['where']) ? sanitize_text_field(wp_unslash($_GET['where'])) : '',
        'function' => isset($_GET['fn']) ? sanitize_text_field(wp_unslash($_GET['fn'])) : '',
        'workplace' => isset($_GET['wp']) ? sanitize_text_field(wp_unslash($_GET['wp'])) : '',
        'city' => '',
    ];
    // Clean URLs: /jobs/ai-ml-jobs-in-bengaluru/, /jobs/marketing-jobs/, /jobs/jobs-in-pune/
    $slug = (string) get_query_var('xf_jobs_slug');
    if ($slug && preg_match('/^(?:([a-z-]+?)-)?jobs(?:-in-([a-z-]+))?$/', $slug, $m)) {
        foreach (XF_JOB_FUNCTIONS as $fn) {
            if (!empty($m[1]) && sanitize_title($fn) === $m[1]) $f['function'] = $fn;
        }
        foreach (XF_JOB_CITIES as $city) {
            if (!empty($m[2]) && sanitize_title($city) === $m[2]) $f['city'] = $city;
        }
        if (!empty($m[1]) && !$f['function'] && $m[1] === 'remote') $f['workplace'] = 'Remote';
    }
    return $f;
}

function xf_job_query_args(array $f, $per_page = 30, $paged = 1) {
    $meta = [];
    if ($f['function']) $meta[] = ['key' => '_xf_function', 'value' => $f['function']];
    if ($f['city']) $meta[] = ['key' => '_xf_city', 'value' => $f['city']];
    if ($f['workplace'] && $f['workplace'] !== 'All') {
        $meta[] = $f['workplace'] === 'Full-time' ? ['key' => '_xf_type', 'value' => 'Full-time'] : ['key' => '_xf_workplace', 'value' => $f['workplace']];
    }
    if ($f['where']) {
        $city = xf_job_city($f['where']);
        $meta[] = $city ? ['key' => '_xf_city', 'value' => $city] : ['key' => '_xf_location', 'value' => $f['where'], 'compare' => 'LIKE'];
    }
    $args = ['post_type' => 'xf_job', 'post_status' => 'publish', 'posts_per_page' => $per_page, 'paged' => $paged, 'orderby' => 'date', 'order' => 'DESC'];
    if ($meta) $args['meta_query'] = array_merge(['relation' => 'AND'], $meta);
    if ($f['q']) $args['s'] = $f['q'];
    return $args;
}

function xf_job_counts_by_function(array $f) {
    $counts = [];
    foreach (XF_JOB_FUNCTIONS as $fn) {
        $q = new WP_Query(array_merge(xf_job_query_args(array_merge($f, ['function' => $fn]), 1), ['fields' => 'ids']));
        $counts[$fn] = (int) $q->found_posts;
    }
    return $counts;
}

/** "₹40–60 LPA" / "$160–200K" / feed text, or '' when the company didn't publish pay. */
function xf_job_salary_label($id) {
    $min = (float) get_post_meta($id, '_xf_salary_min', true);
    $max = (float) get_post_meta($id, '_xf_salary_max', true);
    $cur = get_post_meta($id, '_xf_salary_currency', true);
    if ($min && $cur === 'INR') {
        $f = function ($v) { return rtrim(rtrim(number_format($v / 100000, 1), '0'), '.'); };
        return '₹' . $f($min) . ($max > $min ? '–' . $f($max) : '') . ' LPA';
    }
    if ($min) {
        $sym = ['USD' => '$', 'EUR' => '€', 'GBP' => '£'][$cur] ?? ($cur . ' ');
        $f = function ($v) { return round($v / 1000) . 'K'; };
        return $sym . $f($min) . ($max > $min ? '–' . $f($max) : '');
    }
    return (string) get_post_meta($id, '_xf_salary_text', true);
}

add_action('wp_head', function () {
    if (!is_singular('xf_job')) {
        return;
    }
    $id = get_the_ID();
    if (get_post_status($id) !== 'publish' || get_post_meta($id, '_xf_expired', true)) {
        return;
    }
    $company = get_the_terms($id, 'xf_company');
    $company = $company ? $company[0] : null;
    $remote = get_post_meta($id, '_xf_workplace', true) === 'Remote';
    $city = get_post_meta($id, '_xf_city', true);
    $types = ['Full-time' => 'FULL_TIME', 'Part-time' => 'PART_TIME', 'Contract' => 'CONTRACTOR', 'Internship' => 'INTERN'];
    $min = (float) get_post_meta($id, '_xf_salary_min', true);
    $data = array_filter([
        '@context' => 'https://schema.org',
        '@type' => 'JobPosting',
        'title' => wp_strip_all_tags(get_the_title()),
        'description' => wp_kses_post(get_post_field('post_content', $id)) ?: wp_strip_all_tags(get_the_title()),
        'datePosted' => get_the_date('c'),
        'validThrough' => ($v = get_post_meta($id, '_xf_valid_through', true)) ? $v . 'T23:59:59+05:30' : null,
        'employmentType' => $types[get_post_meta($id, '_xf_type', true)] ?? 'FULL_TIME',
        'hiringOrganization' => array_filter(['@type' => 'Organization', 'name' => $company ? $company->name : get_post_meta($id, '_xf_company_name', true), 'sameAs' => $company ? (get_term_meta($company->term_id, 'xf_website', true) ?: get_term_meta($company->term_id, 'xf_careers_url', true)) : null]),
        'jobLocation' => $remote ? null : ['@type' => 'Place', 'address' => ['@type' => 'PostalAddress', 'addressLocality' => $city && $city !== 'Other' ? $city : get_post_meta($id, '_xf_location', true), 'addressCountry' => 'IN']],
        'jobLocationType' => $remote ? 'TELECOMMUTE' : null,
        'applicantLocationRequirements' => $remote ? ['@type' => 'Country', 'name' => 'India'] : null,
        'baseSalary' => $min ? ['@type' => 'MonetaryAmount', 'currency' => get_post_meta($id, '_xf_salary_currency', true) ?: 'INR', 'value' => ['@type' => 'QuantitativeValue', 'minValue' => $min, 'maxValue' => (float) get_post_meta($id, '_xf_salary_max', true) ?: $min, 'unitText' => 'YEAR']] : null,
        'directApply' => false,
    ]);
    echo '<script type="application/ld+json">' . wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . "</script>\n";
}, 5);

/** Expired jobs: noindex while they still resolve (e.g. via a cached link). */
add_filter('wp_robots', function ($robots) {
    if (is_singular('xf_job') && get_post_meta(get_the_ID(), '_xf_expired', true)) {
        $robots['noindex'] = true;
    }
    return $robots;
});

/* ---- Job alerts (stored; sending comes when a newsletter sender is chosen) ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/job-alert', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $r) {
            global $wpdb;
            if (!empty($r['website'])) return ['success' => true];
            $email = sanitize_email((string) $r['email']);
            if (!is_email($email)) return new WP_Error('invalid_email', 'Please enter a valid email.', ['status' => 400]);
            if (xf_rate_limited('job-alert', 5, HOUR_IN_SECONDS)) return new WP_Error('rate_limited', 'Too many attempts.', ['status' => 429]);
            $filters = sanitize_text_field((string) $r['filters']);
            $wpdb->query($wpdb->prepare(
                'INSERT INTO ' . xf_table('subscribers') . ' (email, source, status, created_at) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE source = VALUES(source)',
                strtolower($email), mb_substr('jobs:' . $filters, 0, 50), 'active', xf_now()
            ));
            return ['success' => true, 'message' => "Done. We'll email new roles matching these filters."];
        },
    ]);
});
