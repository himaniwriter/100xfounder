<?php
/** Blog: long reads, founder stories and reports. */
get_header();
$ids = function_exists('xf_blog_categories') ? array_filter(array_map(function ($s) { $t = get_term_by('slug', $s, 'category'); return $t ? $t->term_id : 0; }, xf_blog_categories())) : [];
get_template_part('parts/feed-page', null, [
    'kicker' => 'Long reads',
    'title' => 'The blog',
    'description' => 'Deep dives, founder stories and reports on how startups in India and the US are built.',
    'tabs' => xft_news_tabs(),
    'active' => 'Blog',
    'show_lead' => true,
    'query_args' => $ids ? ['category__in' => $ids] : [],
]);
get_footer();
