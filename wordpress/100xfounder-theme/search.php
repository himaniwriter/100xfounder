<?php
get_header();
get_template_part('parts/feed-page', null, [
    'kicker' => 'Search',
    'title' => get_search_query() ? '“' . get_search_query() . '”' : 'Search',
    'active' => 'Results',
    'query_args' => ['s' => get_search_query(), 'post_type' => ['post', 'xf_startup', 'xf_spotlight', 'xf_event', 'xf_round']],
]);
get_footer();
