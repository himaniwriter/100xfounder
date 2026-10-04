<?php
/** Category archive in the newsroom layout. */
get_header();
$term = get_queried_object();
$tabs = xft_news_tabs();
$active = array_search(get_category_link($term), $tabs, true) ?: '';
get_template_part('parts/feed-page', null, [
    'kicker' => $active ? 'The newsroom' : 'Sector',
    'title' => single_cat_title('', false),
    'description' => wp_strip_all_tags(category_description()),
    'tabs' => $active ? $tabs : [],
    'active' => $active ?: single_cat_title('', false),
    'show_lead' => true,
    'query_args' => ['cat' => $term->term_id],
]);
get_footer();
