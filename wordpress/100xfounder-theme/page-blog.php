<?php
/** Blog: every article, newest first, paginated at /blog/page/N/. */
get_header();
get_template_part('parts/feed-page', null, [
    'kicker' => 'Long reads',
    'title' => 'The blog',
    'description' => 'Deep dives, founder stories and reports on how startups in India and the US are built.',
    'tabs' => xft_news_tabs(),
    'active' => 'Blog',
    'show_lead' => false,
    'paginate' => true, // numbered /blog/page/N/ links instead of ?pg=
    'query_args' => xft_blog_query_args(),
]);
get_footer();
