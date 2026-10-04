<?php
/**
 * Articles in French (for Canada) and German alongside English.
 *
 * A post's language is its `_xf_lang` meta (set by create_draft's `fields.lang`),
 * else its Français / Deutsch category, else English. The language drives the
 * page's lang attribute, og:locale, the schema's inLanguage and the news sitemap.
 * A translation stores the original's ID in `_xf_translation_of`; every post in
 * that group then lists the others with hreflang.
 */
if (!defined('ABSPATH')) {
    exit;
}

/** Supported languages: BCP 47 tag => [og:locale, category slug, label]. */
function xf_languages() {
    return [
        'en' => ['en_US', '', 'English'],
        'fr-CA' => ['fr_CA', 'francais', 'Français'],
        'de-DE' => ['de_DE', 'deutsch', 'Deutsch'],
    ];
}

function xf_post_lang($post_id) {
    $langs = xf_languages();
    $lang = (string) get_post_meta($post_id, '_xf_lang', true);
    if (isset($langs[$lang])) {
        return $lang;
    }
    foreach ($langs as $tag => [, $cat]) {
        if ($cat && has_category($cat, $post_id)) {
            return $tag;
        }
    }
    return 'en';
}

/** The original and its translations, as [lang => post_id], or [] when there are none. */
function xf_translation_group($post_id) {
    $root = (int) get_post_meta($post_id, '_xf_translation_of', true) ?: (int) $post_id;
    $ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'fields' => 'ids', 'posts_per_page' => 10, 'meta_key' => '_xf_translation_of', 'meta_value' => $root]);
    if (!$ids) {
        return [];
    }
    $group = [];
    foreach (array_merge([$root], $ids) as $id) {
        if (get_post_status($id) === 'publish') {
            $group[xf_post_lang($id)] = $id;
        }
    }
    return count($group) > 1 ? $group : [];
}

/** A drafted translation's language also puts it in its language category. */
add_action('added_post_meta', function ($meta_id, $post_id, $key, $value) {
    if ($key !== '_xf_lang') {
        return;
    }
    $cat = xf_languages()[$value][1] ?? '';
    $term = $cat ? get_term_by('slug', $cat, 'category') : null;
    if ($term) {
        wp_set_post_categories($post_id, [$term->term_id], true);
    }
}, 10, 4);

add_filter('language_attributes', function ($output) {
    if (!is_singular('post')) {
        return $output;
    }
    $lang = xf_post_lang(get_queried_object_id());
    return $lang === 'en' ? $output : preg_replace('/lang="[^"]*"/', 'lang="' . esc_attr($lang) . '"', $output);
});

add_action('wp_head', function () {
    if (!is_singular('post')) {
        return;
    }
    $id = get_queried_object_id();
    printf('<meta property="og:locale" content="%s">' . "\n", esc_attr(xf_languages()[xf_post_lang($id)][0]));
    $group = xf_translation_group($id);
    foreach ($group as $lang => $pid) {
        printf('<link rel="alternate" hreflang="%s" href="%s">' . "\n", esc_attr($lang), esc_url(get_permalink($pid)));
    }
    if ($group) {
        $root = (int) get_post_meta($id, '_xf_translation_of', true) ?: $id;
        printf('<link rel="alternate" hreflang="x-default" href="%s">' . "\n", esc_url(get_permalink($root)));
    }
}, 3);
