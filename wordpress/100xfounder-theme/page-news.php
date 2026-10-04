<?php
/** The newsroom: all stories. */
get_header();
get_template_part('parts/feed-page', null, ['tabs' => xft_news_tabs(), 'active' => 'All', 'show_lead' => true]);
get_footer();
