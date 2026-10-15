<?php
/** Newsroom tabs shared by the News page and category archives. */
function xft_news_tabs() {
    $tabs = ['All' => xft_page_url('news', 'news')];
    foreach (['startup-news' => 'News', 'funding' => 'Funding'] as $slug => $label) {
        $t = get_term_by('slug', $slug, 'category');
        if ($t) $tabs[$label] = get_category_link($t);
    }
    $tabs['Events'] = xft_page_url('events', 'events');
    $t = get_term_by('slug', 'founder-stories', 'category');
    if ($t) $tabs['Founder stories'] = get_category_link($t);
    $tabs['Blog'] = xft_page_url('blog', 'blog');
    return $tabs;
}
