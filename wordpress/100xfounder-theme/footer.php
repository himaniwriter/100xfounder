</main>
<?php
$submit = xft_page_url('submit', 'submit');
$sector_links = array_slice(xft_sector_links(), 0, 3);
$company = [
    ['About', xft_page_url('about', 'about')],
    ['Editorial policy', xft_page_url('editorial', 'editorial-policy')],
    ['Advertise', xft_page_url('advertise', 'advertise')],
    ['Contact', xft_page_url('contact', 'contact')],
];
?>
<footer class="site-footer">
    <div class="wrap footer-cols">
        <div><span class="k" style="font-size:11px">News</span>
            <?php foreach ($sector_links as $s) : ?><a class="nl" href="<?php echo esc_url($s['url']); ?>"><?php echo esc_html($s['label']); ?></a><?php endforeach; ?>
            <a class="nl" href="<?php echo esc_url(xft_page_url('funding', 'funding-tracker')); ?>">Funding tracker</a>
        </div>
        <div><span class="k" style="font-size:11px">Discover</span>
            <a class="nl" href="<?php echo esc_url(xft_page_url('launches', 'launches')); ?>">Launches</a>
            <a class="nl" href="<?php echo esc_url(xft_page_url('spotlights', 'spotlights')); ?>">Founder stories</a>
            <a class="nl" href="<?php echo esc_url(xft_page_url('events', 'events')); ?>">Events</a>
            <a class="nl" href="<?php echo esc_url(xft_page_url('directory', 'startups')); ?>">Startups</a>
        </div>
        <div><span class="k" style="font-size:11px">Contribute</span>
            <a class="nl" href="<?php echo esc_url(add_query_arg('type', 'article', $submit)); ?>">Submit article</a>
            <a class="nl" href="<?php echo esc_url(add_query_arg('type', 'press', $submit)); ?>">Press release</a>
            <a class="nl" href="<?php echo esc_url(add_query_arg('type', 'launch', $submit)); ?>">Submit launch</a>
            <a class="nl" href="<?php echo esc_url(add_query_arg('type', 'job', $submit)); ?>">Post a job</a>
        </div>
        <div><span class="k" style="font-size:11px">Company</span>
            <?php foreach ($company as [$label, $url]) : ?><a class="nl" href="<?php echo esc_url($url); ?>"><?php echo esc_html($label); ?></a><?php endforeach; ?>
        </div>
    </div>
    <div class="wrap" style="overflow:hidden"><div class="wordmark" aria-hidden="true"><?php echo esc_html(get_bloginfo('name') ?: '100Xfounder'); ?></div></div>
    <div class="wrap k footer-bottom">
        <span>© <?php echo esc_html(wp_date('Y') . ' ' . get_bloginfo('name')); ?>. Startup news, launches and founder stories from India &amp; the US.</span>
        <span><a href="<?php echo esc_url(xft_page_url('privacy', 'privacy-policy')); ?>">Privacy</a> · <a href="<?php echo esc_url(xft_page_url('terms', 'terms')); ?>">Terms</a> · <a href="<?php echo esc_url(xft_page_url('corrections', 'corrections-policy')); ?>">Corrections</a> · <a href="<?php echo esc_url(home_url('/wp-sitemap.xml')); ?>">Sitemap</a></span>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
