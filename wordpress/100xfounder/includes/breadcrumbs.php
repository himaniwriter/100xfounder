<?php
/**
 * One breadcrumb trail per page, used twice: the visible nav at the top of <main> (theme
 * header.php) and the page's single BreadcrumbList. Both come from xf_breadcrumb_trail(), so
 * they match item for item; the last item is the page itself and carries no link.
 */
if (!defined('ABSPATH')) {
    exit;
}

/** The language of the page being viewed ('' for English). */
function xf_crumb_lang() {
    if (!is_singular()) {
        return '';
    }
    $id = get_queried_object_id();
    $lang = function_exists('xf_ai_post_lang') ? xf_ai_post_lang($id) : '';
    if (!$lang && function_exists('xf_post_lang') && xf_post_lang($id) !== 'en') {
        $lang = xf_post_lang($id);
    }
    return $lang;
}

/** "Home" in the page's language (primary subtag), English when we have no word for it. */
function xf_crumb_home_label($lang) {
    $words = [
        'de' => 'Startseite', 'fr' => 'Accueil', 'es' => 'Inicio', 'pt' => 'Início', 'it' => 'Home', 'nl' => 'Home',
        'hi' => 'होम', 'bn' => 'হোম', 'ta' => 'முகப்பு', 'te' => 'హోమ్', 'mr' => 'मुख्यपृष्ठ', 'gu' => 'હોમ', 'kn' => 'ಮುಖಪುಟ',
        'ml' => 'ഹോം', 'pa' => 'ਮੁੱਖ ਪੰਨਾ', 'ur' => 'صفحۂ اول', 'ar' => 'الرئيسية', 'ja' => 'ホーム', 'zh' => '首页', 'ko' => '홈',
        'id' => 'Beranda', 'ru' => 'Главная', 'tr' => 'Ana sayfa', 'vi' => 'Trang chủ', 'pl' => 'Strona główna', 'sv' => 'Startsida', 'nb' => 'Hjem', 'no' => 'Hjem', 'da' => 'Forside', 'fi' => 'Etusivu',
    ];
    return $words[strtolower(strtok((string) $lang, '-'))] ?? 'Home';
}

/** A plugin page as a crumb, using its published translation when the page being viewed is in another language. */
function xf_crumb_page($key, $label = null, $lang = '') {
    $pages = (array) get_option('xf_pages', []);
    $id = (int) ($pages[$key] ?? 0);
    $url = xf_page_url($key);
    if ($lang && $id && function_exists('xf_ai_translations_of')) {
        $t = xf_ai_translations_of($id)[$lang] ?? null;
        if ($t && $t->post_status === 'publish') {
            return [get_the_title($t), get_permalink($t)];
        }
    }
    return [$label ?? ($id ? get_the_title($id) : $key), $url];
}

/**
 * [[name, url|null], ...] starting with Home; [] where no trail belongs (home, search, 404).
 * Cached per request: the head and the visible nav both ask for it.
 */
function xf_breadcrumb_trail() {
    static $trail = null;
    if ($trail !== null) {
        return $trail;
    }
    $trail = [];
    if (is_front_page() || is_search() || is_404()) {
        return $trail;
    }
    $lang = xf_crumb_lang();
    $home = [xf_crumb_home_label($lang), home_url('/')];
    if ($lang && function_exists('xf_ai_translations_of')) {
        $t = xf_ai_translations_of((int) get_option('page_on_front'))[$lang] ?? null;
        if ($t && $t->post_status === 'publish') $home[1] = get_permalink($t);
    }
    $here = function ($title) { return [$title, null]; };
    $mid = [];
    $last = null;

    if (is_singular()) {
        $p = get_queried_object();
        $last = $here(get_the_title($p));
        switch ($p->post_type) {
            case 'post':
                $hub = function_exists('xf_post_hub') ? xf_post_hub($lang && function_exists('xf_ai_post_lang') ? (int) get_post_meta($p->ID, '_xf_ai_source', true) : $p->ID) : '';
                if ($hub) {
                    $mid[] = xf_crumb_page(xf_hubs()[$hub]['page'], xf_hubs()[$hub]['title'], $lang);
                } else {
                    foreach (get_the_category($p->ID) as $cat) {
                        if ($cat->slug !== 'uncategorized') {
                            $mid[] = [$cat->name, get_category_link($cat)];
                            break;
                        }
                    }
                }
                break;
            case 'xf_guide':
                $mid[] = xf_crumb_page('guides', null, $lang);
                break;
            case 'xf_startup':
                $mid[] = xf_crumb_page('directory');
                $terms = get_the_terms($p->ID, 'xf_industry');
                if ($terms && !is_wp_error($terms)) $mid[] = [$terms[0]->name, get_term_link($terms[0])];
                break;
            case 'xf_event':
                $mid[] = xf_crumb_page('events');
                $city = (string) get_post_meta($p->ID, '_xf_city', true);
                if ($city) $mid[] = [$city, add_query_arg('city', rawurlencode($city), xf_page_url('events'))];
                break;
            case 'xf_job':
                $mid[] = xf_crumb_page('jobs');
                $terms = get_the_terms($p->ID, 'xf_company');
                $fn = (string) get_post_meta($p->ID, '_xf_function', true);
                if ($terms && !is_wp_error($terms)) {
                    $mid[] = [$terms[0]->name, get_term_link($terms[0])];
                } elseif ($fn) {
                    $mid[] = [$fn . ' jobs', home_url('/jobs/' . sanitize_title($fn) . '-jobs/')];
                }
                break;
            case 'xf_spotlight':
                $mid[] = xf_crumb_page('spotlights');
                break;
            case 'xf_round':
                $mid[] = xf_crumb_page('funding', xf_hubs()['funding']['title'] ?? null);
                break;
            case 'page':
                $key = function_exists('xf_page_key') ? xf_page_key() : '';
                if ($lang) {
                    // A translated page: name its English original's key, so hubs keep their hub label.
                    $src = (int) get_post_meta($p->ID, '_xf_ai_source', true);
                    $key = (string) array_search($src, array_map('intval', (array) get_option('xf_pages', [])), true);
                }
                $hub_titles = function_exists('xf_hubs') ? array_column(xf_hubs(), 'title', 'page') : [];
                if (isset($hub_titles[$key]) && !$lang) {
                    $last = $here($hub_titles[$key]);
                } elseif ($key === 'guides') {
                    $mid[] = xf_crumb_page('jobs', null, $lang);
                } elseif ($key === 'jobs' && get_query_var('xf_jobs_slug') && function_exists('xf_job_landing_heading')) {
                    $mid[] = [get_the_title($p), xf_page_url('jobs')];
                    $last = $here(xf_job_landing_heading(xf_job_filters_from_request()) ?: get_query_var('xf_jobs_slug'));
                } elseif ($key === 'tools' && function_exists('xf_current_tool') && ($tool = xf_current_tool())) {
                    $mid[] = [get_the_title($p), xf_page_url('tools')];
                    $last = $here($tool['short']);
                }
                break;
        }
    } elseif (is_tax('xf_company')) {
        $mid[] = xf_crumb_page('jobs');
        $last = $here(single_term_title('', false));
    } elseif (is_tax('xf_industry')) {
        $mid[] = xf_crumb_page('directory');
        $last = $here(single_term_title('', false));
    } elseif (is_category()) {
        $mid[] = xf_crumb_page('news');
        $last = $here(single_cat_title('', false));
    } elseif (is_author()) {
        $last = $here(get_the_author_meta('display_name', get_queried_object_id()));
    } elseif (is_home()) {
        $last = $here(get_the_title((int) get_option('page_for_posts')) ?: 'Blog');
    } elseif (is_archive()) {
        $last = $here(get_the_archive_title());
    }
    if (!$last) {
        return $trail;
    }
    $trail = array_map(function ($c) { return [wp_strip_all_tags(html_entity_decode((string) $c[0], ENT_QUOTES, 'UTF-8')), $c[1]]; }, array_merge([$home], $mid, [$last]));
    return $trail;
}

/** The visible trail. Long names are cut visually (CSS); the full text stays in the markup. */
function xf_breadcrumbs_html() {
    $trail = xf_breadcrumb_trail();
    if (count($trail) < 2) {
        return '';
    }
    $out = '<nav class="wrap crumbs-bar" aria-label="Breadcrumb"><ol class="crumbs k">';
    $n = count($trail);
    foreach ($trail as $i => [$name, $url]) {
        if ($i === $n - 1) {
            $out .= '<li><span aria-current="page" title="' . esc_attr($name) . '">' . esc_html($name) . '</span></li>';
        } else {
            $out .= '<li>' . ($url ? '<a href="' . esc_url($url) . '">' . esc_html($name) . '</a>' : '<span>' . esc_html($name) . '</span>') . '</li>';
        }
    }
    return $out . '</ol></nav>';
}

add_action('wp_head', function () {
    $trail = xf_breadcrumb_trail();
    if (count($trail) < 2) {
        return;
    }
    $items = [];
    $n = count($trail);
    foreach ($trail as $i => [$name, $url]) {
        $items[] = array_filter(['@type' => 'ListItem', 'position' => $i + 1, 'name' => $name, 'item' => $i === $n - 1 ? null : $url]);
    }
    xf_json_ld(['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $items]);
}, 6);
