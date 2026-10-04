<?php
/** Tags, authors and dates. */
get_header();
$title = wp_strip_all_tags(get_the_archive_title());
$args = ['kicker' => 'Archive', 'title' => $title, 'active' => $title];
if (is_tag()) {
    $args['kicker'] = 'Topic';
    $args['title'] = single_tag_title('', false);
    $args['query_args'] = ['tag_id' => get_queried_object_id()];
} elseif (is_author()) {
    $args['kicker'] = 'Author';
    $args['title'] = get_the_author_meta('display_name', get_queried_object_id());
    $args['description'] = wp_strip_all_tags(get_the_author_meta('description', get_queried_object_id()));
    $args['query_args'] = ['author' => get_queried_object_id()];
} elseif (is_date()) {
    $args['query_args'] = ['year' => get_query_var('year'), 'monthnum' => get_query_var('monthnum'), 'day' => get_query_var('day')];
}
$args['active'] = $args['title'];
get_template_part('parts/feed-page', null, $args);
get_footer();
