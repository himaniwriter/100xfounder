<?php
/**
 * One startup: what it is, what it costs, who it suits, what it competes with,
 * what reviewers and the community said, and where all of that came from.
 *
 * Every section is drawn from the listing's research profile (_xf_profile) and
 * appears only when it has something real in it. A new launch with no reviews
 * says so plainly instead of showing a rating that does not exist.
 */
get_header();
while (have_posts()) :
    the_post();
    $id = get_the_ID();
    $name = get_the_title();
    $m = xf_startup_meta($id);
    $p = function_exists('xf_startup_profile') ? xf_startup_profile($id) : [];
    $spotlight = xf_published_spotlight_for($id);
    $website = (string) $m['website'];
    $ph = (string) $m['ph_url'];
    $industry = wp_get_post_terms($id, 'xf_industry', ['fields' => 'names']);
    $category = $p['category'] ?? ($industry[0] ?? '');
    $launched = xft_long_date($m['launch_day'] ?: get_post_meta($id, '_xf_launch_date', true));
    $maker = $p['maker'] ?? [];
    $phs = $p['ph'] ?? [];
    $reviews = $p['reviews'] ?? [];
    $has_reviews = !empty($reviews['count']) && (int) $reviews['count'] > 0;
    $x = $p['community']['x'] ?? [];
    $checked = xft_long_date($p['checked'] ?? '');
    $startups_url = xft_page_url('startups', 'startups');
    $shot_credit = 'Screenshot from the Product Hunt gallery, uploaded by the maker';

    $gallery = function_exists('xf_profile_gallery') ? xf_profile_gallery($p) : [];
    if (!$gallery && function_exists('xf_launch_gallery')) $gallery = xf_launch_gallery($id); // founder-supplied, from the launch form
    $from_founder = get_post_meta($id, '_xf_source', true) === 'launch_form';
    $pricing_models = function_exists('xf_launch_pricing_models') ? xf_launch_pricing_models() : [];
    $price = $p['starts_at'] ?? trim(($pricing_models[get_post_meta($id, '_xf_pricing_model', true)] ?? '') . (($pd = get_post_meta($id, '_xf_pricing_details', true)) ? ' · ' . $pd : ''), ' ·');
    // Only the name and role, and only when the founder asked for it on the launch form; email and links stay private.
    $founder_show = get_post_meta($id, '_xf_founder_show', true) ? ['name' => get_post_meta($id, '_xf_launch_founder_name', true), 'role' => get_post_meta($id, '_xf_launch_founder_role', true)] : null;
    if ($founder_show && $founder_show['name'] === '') $founder_show = null;
    $video = function_exists('xf_profile_video') ? xf_profile_video($p['video_url'] ?? '') : null;
    $st = function_exists('xf_shark_tank') ? xf_shark_tank($id) : [];
    if ($st) {
        $video = $video ?: xf_shark_tank_video($st); // official Shark Tank India / Sony LIV / SET India upload only
        $gallery = array_merge($gallery, xf_shark_tank_gallery($st));
    }
    $story = function_exists('xf_profile_story') ? xf_profile_story($p) : ['paragraphs' => [], 'attribution' => '', 'url' => ''];
    $story_paras = $story['paragraphs'];
    $opinions = $p['opinions'] ?? [];
    $themes = array_filter((array) ($opinions['themes'] ?? []));
    $alt_items = (array) ($p['alternatives']['items'] ?? []);
    $alt_of = function_exists('xf_startup_alternative_to') ? xf_startup_alternative_to($id) : [];

    $jump = [];
    if (trim(wp_strip_all_tags(get_the_content()))) $jump['about'] = 'Overview';
    if ($st) $jump['shark-tank'] = 'Shark Tank India';
    $founder_qa = function_exists('xf_startup_founder_qa') ? xf_startup_founder_qa($id) : [];
    if ($founder_qa) $jump['founder-qa'] = 'Founder Q&A';
    if (!empty($p['use_cases'])) $jump['use-cases'] = 'Use cases';
    if ($story_paras) $jump['launch-story'] = 'Launch story';
    if (!empty($p['pricing'])) $jump['pricing'] = 'Pricing';
    if (!empty($p['audience'])) $jump['audience'] = 'Who it’s for';
    if (!empty($p['pros']) || !empty($p['cons'])) $jump['pros-cons'] = 'Pros and cons';
    if (!empty($p['alternatives']['items'])) $jump['alternatives'] = 'Alternatives';
    $jump['reviews'] = 'Reviews';
    if ($themes || !empty($opinions['quotes'])) $jump['opinions'] = 'What users say';
    if (!empty($p['community'])) $jump['community'] = 'Community';
    if (!empty($p['faq'])) $jump['faq'] = 'FAQ';
    ?>
    <section class="wrap" style="padding-top:20px">
        <div class="sp-head in" style="animation-delay:.05s">
            <?php echo xf_startup_logo_html($id, 88); // phpcs:ignore WordPress.Security.EscapeOutput ?>
            <div style="min-width:0">
                <div class="k" style="display:flex;gap:12px;flex-wrap:wrap">
                    <?php if ($category) : ?><span class="ac"><?php echo esc_html($category); ?></span><?php endif; ?>
                    <?php if ($launched) : ?><span>Launched <?php echo esc_html($launched); ?></span><?php endif; ?>
                    <?php if ($st) echo xf_shark_tank_title_badge($st); // phpcs:ignore -- escaped inside ?>
                </div>
                <h1 class="page-title" style="margin-top:8px"><?php echo esc_html($name); ?></h1>
                <?php if ($m['tagline']) : ?><p class="sp-tag"><?php echo esc_html($m['tagline']); ?></p><?php endif; ?>
            </div>
        </div>

        <div class="sp-actions in" style="animation-delay:.1s">
            <?php if ($website) : ?>
                <a class="btn btn-w" style="height:48px" href="<?php echo esc_url($website); ?>" target="_blank" rel="<?php echo $spotlight ? 'sponsored noopener' : 'nofollow noopener'; ?>">Visit <?php echo esc_html($name); ?> ↗</a>
            <?php endif; ?>
            <?php if ($ph) : ?>
                <a class="btn" style="height:48px" href="<?php echo esc_url($ph); ?>" target="_blank" rel="noopener">See it on Product Hunt ↗</a>
            <?php endif; ?>
        </div>
    </section>

    <?php if ($video || $gallery) : ?>
        <section class="wrap sp-media" style="padding-top:32px" aria-label="<?php echo esc_attr($name); ?> video and screenshots">
            <?php if ($video) : ?>
                <div class="sp-video" data-embed="<?php echo esc_url($video['embed']); ?>" data-title="<?php echo esc_attr($video['title'] ?? $p['video_title'] ?? $name . ' video'); ?>">
                    <button type="button" class="sp-video-play" aria-label="<?php echo esc_attr('Play the ' . $name . ' video (loads ' . $video['label'] . ')'); ?>">
                        <span class="sp-video-icon" aria-hidden="true"></span>
                        <span class="sp-video-t"><?php echo esc_html($video['title'] ?? $p['video_title'] ?? 'Watch ' . $name); ?></span>
                        <span class="k">Plays from <?php echo esc_html($video['label']); ?> · nothing loads until you click</span>
                    </button>
                    <a class="k u sp-video-out" href="<?php echo esc_url($video['watch']); ?>" target="_blank" rel="nofollow noopener">Watch on <?php echo esc_html($video['label']); ?> ↗</a>
                </div>
            <?php endif; ?>
            <?php if ($gallery) : ?>
                <div class="sp-gallery" data-gallery data-lenis-prevent>
                    <?php foreach ($gallery as $i => $g) :
                        $alt = $g['alt'] ?? ($name . ' screenshot ' . ($i + 1)); ?>
                        <figure class="sp-shot">
                            <button type="button" class="sp-shot-btn" data-full="<?php echo esc_url($g['url']); ?>" aria-label="<?php echo esc_attr('Enlarge: ' . $alt); ?>">
                                <img src="<?php echo esc_url($g['url']); ?>" alt="<?php echo esc_attr($alt); ?>" width="<?php echo (int) ($g['w'] ?? 1200); ?>" height="<?php echo (int) ($g['h'] ?? 630); ?>" loading="<?php echo $i === 0 && !$video ? 'eager' : 'lazy'; ?>" decoding="async" referrerpolicy="no-referrer">
                            </button>
                            <figcaption><?php echo esc_html($g['credit'] ?? $shot_credit); ?></figcaption>
                        </figure>
                    <?php endforeach; ?>
                </div>
                <dialog class="sp-lightbox" aria-label="<?php echo esc_attr($name); ?> screenshots" data-lenis-prevent>
                    <figure><img alt="" decoding="async" referrerpolicy="no-referrer"><figcaption class="k"></figcaption></figure>
                    <button type="button" class="sp-lb-btn sp-lb-prev" data-lb="-1" aria-label="Previous image">‹</button>
                    <button type="button" class="sp-lb-btn sp-lb-next" data-lb="1" aria-label="Next image">›</button>
                    <button type="button" class="sp-lb-btn sp-lb-close" data-lb-close aria-label="Close">×</button>
                </dialog>
            <?php endif; ?>
        </section>
    <?php endif; ?>

    <section class="wrap" style="padding-top:32px">
        <div class="facts in">
            <?php if ($launched) : ?><div><div class="k" style="font-size:10px">Launched</div><div class="v"><?php echo esc_html($launched); ?></div></div><?php endif; ?>
            <?php if ($category) : ?><div><div class="k" style="font-size:10px">Category</div><div class="v"><?php echo esc_html($category); ?></div></div><?php endif; ?>
            <?php if ($price !== '') : ?><div><div class="k" style="font-size:10px">Price</div><div class="v"><?php echo esc_html($price); ?></div></div><?php endif; ?>
            <?php if (!empty($p['platform'])) : ?><div><div class="k" style="font-size:10px">Works with</div><div class="v"><?php echo esc_html($p['platform']); ?></div></div><?php endif; ?>
            <?php if (!empty($maker['name'])) : ?><div><div class="k" style="font-size:10px">Made by</div><div class="v"><?php echo !empty($maker['url']) ? '<a class="u" href="' . esc_url($maker['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($maker['name']) . '</a>' : esc_html($maker['name']); ?></div></div><?php endif; ?>
            <?php if (!empty($phs['votes'])) : ?><div><div class="k" style="font-size:10px">Launch day</div><div class="v"><?php echo esc_html(trim((!empty($phs['rank']) ? '#' . $phs['rank'] . ' · ' : '') . number_format_i18n((int) $phs['votes']) . ' upvotes')); ?></div></div><?php endif; ?>
        </div>
        <?php if (count($jump) > 1) : ?>
            <nav class="sp-jump k" aria-label="On this page">
                <?php foreach ($jump as $anchor => $label) : ?><a href="#<?php echo esc_attr($anchor); ?>"><?php echo esc_html($label); ?></a><?php endforeach; ?>
            </nav>
        <?php endif; ?>
    </section>

    <div class="hl" style="margin-top:32px"></div>

    <section class="wrap sp-body">
        <div class="prose sp-main">
            <?php if (isset($jump['about'])) : ?>
                <h2 id="about">What <?php echo esc_html($name); ?> does</h2>
                <?php the_content(); ?>
            <?php endif; ?>

            <?php if ($st) echo xf_shark_tank_panel_html($id, $st); // phpcs:ignore -- escaped inside ?>

            <?php if ($founder_qa) : ?>
                <section class="sp-qa" aria-labelledby="founder-qa">
                    <h2 id="founder-qa">Founder Q&amp;A</h2>
                    <p class="k ac" style="margin:0">In the founder's words</p>
                    <?php if ($founder_qa['name']) : ?><p class="sp-qa-by"><strong><?php echo esc_html($founder_qa['name']); ?></strong><?php echo $founder_qa['role'] ? ', ' . esc_html($founder_qa['role']) : ''; ?></p><?php endif; ?>
                    <?php foreach ($founder_qa['items'] as $item) : ?>
                        <h3><?php echo esc_html($item['q']); ?></h3>
                        <?php echo wp_kses(wpautop(esc_html($item['a'])), ['p' => [], 'br' => []]); ?>
                    <?php endforeach; ?>
                    <?php if ($founder_qa['answered_at']) : ?><p class="k" style="font-size:10.5px">Answered on <?php echo esc_html(xft_long_date($founder_qa['answered_at'])); ?> via Launch on 100xFounder</p><?php endif; ?>
                </section>
            <?php endif; ?>

            <?php if (!empty($p['use_cases'])) : ?>
                <h2 id="use-cases">What people use <?php echo esc_html($name); ?> for</h2>
                <ul class="sp-uses"><?php foreach ((array) $p['use_cases'] as $u) echo '<li>' . esc_html($u) . '</li>'; ?></ul>
            <?php endif; ?>

            <?php if ($story_paras) : ?>
                <h2 id="launch-story">The launch story</h2>
                <?php echo wpautop(wp_kses($story_paras ? implode("\n\n", $story_paras) : '', ['a' => ['href' => true], 'em' => [], 'strong' => [], 'br' => []])); // phpcs:ignore -- kses-filtered ?>
                <?php if (!empty($story['attribution'])) : ?>
                    <p class="k sp-src"><?php echo !empty($story['url']) ? '<a class="u" href="' . esc_url($story['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($story['attribution']) . ' ↗</a>' : esc_html($story['attribution']); ?></p>
                <?php endif; ?>
            <?php endif; ?>

            <?php if (!empty($p['pricing'])) : $pr = $p['pricing']; ?>
                <h2 id="pricing"><?php echo esc_html($name); ?> pricing</h2>
                <?php if (!empty($pr['intro'])) : ?><p><?php echo esc_html($pr['intro']); ?></p><?php endif; ?>
                <?php if (!empty($pr['plans'])) :
                    $rows = [];
                    foreach ($pr['plans'] as $pl) {
                        $rows[] = ['<strong>' . esc_html($pl['name'] ?? '') . '</strong>', esc_html($pl['price'] ?? ''), esc_html($pl['detail'] ?? '')];
                    }
                    echo xft_data_table(['Plan', 'Price', 'What you get'], $rows, $name . ' plans'); // phpcs:ignore
                endif; ?>
                <?php foreach ((array) ($pr['notes'] ?? []) as $note) : ?><p class="sp-note"><?php echo esc_html($note); ?></p><?php endforeach; ?>
                <p class="k sp-src">
                    <?php if ($checked) : ?>Checked <?php echo esc_html($checked); ?> · <?php endif; ?>
                    <?php if (!empty($pr['url'])) : ?><a class="u" href="<?php echo esc_url($pr['url']); ?>" target="_blank" rel="nofollow noopener">Official pricing page ↗</a> · <?php endif; ?>
                    Prices change, so confirm before you buy
                </p>
            <?php endif; ?>

            <?php if (!empty($p['audience'])) : $au = $p['audience']; ?>
                <h2 id="audience">Who <?php echo esc_html($name); ?> is for</h2>
                <div class="sp-split">
                    <?php if (!empty($au['fit'])) : ?>
                        <div class="sp-card"><div class="k ac">A good fit if you…</div>
                            <ul><?php foreach ($au['fit'] as $li) echo '<li>' . esc_html($li) . '</li>'; ?></ul></div>
                    <?php endif; ?>
                    <?php if (!empty($au['not_fit'])) : ?>
                        <div class="sp-card"><div class="k">Probably not for you if…</div>
                            <ul><?php foreach ($au['not_fit'] as $li) echo '<li>' . esc_html($li) . '</li>'; ?></ul></div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($p['pros']) || !empty($p['cons'])) : ?>
                <h2 id="pros-cons"><?php echo esc_html($name); ?> pros and cons</h2>
                <div class="sp-split">
                    <?php if (!empty($p['pros'])) : ?>
                        <div class="sp-card sp-pros"><div class="k ac">Pros</div>
                            <ul><?php foreach ((array) $p['pros'] as $li) echo '<li>' . esc_html($li) . '</li>'; ?></ul></div>
                    <?php endif; ?>
                    <?php if (!empty($p['cons'])) : ?>
                        <div class="sp-card sp-cons"><div class="k">Cons</div>
                            <ul><?php foreach ((array) $p['cons'] as $li) echo '<li>' . esc_html($li) . '</li>'; ?></ul></div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($p['alternatives']['items'])) : $alt = $p['alternatives']; ?>
                <h2 id="alternatives"><?php echo esc_html($name); ?> alternatives and how they compare</h2>
                <?php if (!empty($alt['intro'])) : ?><p><?php echo esc_html($alt['intro']); ?></p><?php endif; ?>
                <?php
                $rows = [['<strong>' . esc_html($name) . '</strong> <span class="k" style="font-size:9.5px">this page</span>',
                          esc_html($p['summary_short'] ?? ($m['tagline'] ?: '')),
                          esc_html($p['starts_at'] ?? '—'),
                          $has_reviews ? esc_html(number_format_i18n((float) $reviews['rating'], 1) . ' (' . (int) $reviews['count'] . ')') : 'No reviews yet',
                          '—']];
                foreach ($alt['items'] as $it) {
                    $label = !empty($it['url']) ? '<a class="u" href="' . esc_url($it['url']) . '" target="_blank" rel="nofollow noopener"><strong>' . esc_html($it['name']) . '</strong></a>' : '<strong>' . esc_html($it['name']) . '</strong>';
                    $rev = !empty($it['ph_rating']) ? esc_html(number_format_i18n((float) $it['ph_rating'], 1) . ' (' . (int) ($it['ph_reviews'] ?? 0) . ' on Product Hunt)') : esc_html($it['reviews'] ?? '—');
                    $rows[] = [$label, esc_html($it['what'] ?? ''), esc_html($it['starts_at'] ?? '—'), $rev, esc_html($it['difference'] ?? '')];
                }
                echo xft_data_table(['Product', 'What it is', 'Starts at', 'Reviews', 'How it differs from ' . $name], $rows, 'Alternatives to ' . $name); // phpcs:ignore
                ?>
                <?php if (!empty($alt['more'])) : ?><p class="sp-note"><?php echo esc_html($alt['more']); ?></p><?php endif; ?>
            <?php endif; ?>

            <h2 id="reviews"><?php echo esc_html($name); ?> reviews</h2>
            <?php if (function_exists('xf_startup_reviews_html')) echo xf_startup_reviews_html($id); // phpcs:ignore -- escaped inside ?>
            <?php if ($has_reviews) : ?>
                <p class="k sp-src">On Product Hunt: <?php echo esc_html(number_format_i18n((float) $reviews['rating'], 1) . '/5 from ' . (int) $reviews['count'] . ' reviews' . (!empty($reviews['as_of']) ? ', as of ' . xft_long_date($reviews['as_of']) : '')); ?>. Those are Product Hunt users’ ratings, not ours<?php if (!empty($reviews['url'])) : ?> · <a class="u" href="<?php echo esc_url($reviews['url']); ?>" target="_blank" rel="nofollow noopener">Read them on Product Hunt ↗</a><?php endif; ?></p>
            <?php elseif ($p && !empty($reviews['url'])) : ?>
                <p class="k sp-src">No reviews on Product Hunt yet<?php echo !empty($reviews['as_of']) ? ' as of ' . esc_html(xft_long_date($reviews['as_of'])) : ''; ?> · <a class="u" href="<?php echo esc_url($reviews['url']); ?>" target="_blank" rel="nofollow noopener">Product Hunt reviews ↗</a></p>
            <?php endif; ?>

            <?php if ($themes || !empty($opinions['quotes'])) : ?>
                <h2 id="opinions">What users liked, asked and criticised</h2>
                <?php if ($themes) : ?>
                    <div class="sp-split sp-themes">
                        <?php foreach (['liked' => 'Liked', 'asked' => 'Asked about', 'criticised' => 'Criticised'] as $tk => $tl) :
                            if (empty($themes[$tk])) continue; ?>
                            <div class="sp-card"><div class="k<?php echo $tk === 'liked' ? ' ac' : ''; ?>"><?php echo esc_html($tl); ?></div>
                                <ul><?php foreach ((array) $themes[$tk] as $li) echo '<li>' . esc_html($li) . '</li>'; ?></ul></div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                <?php foreach ((array) ($opinions['quotes'] ?? []) as $q) : if (empty($q['text'])) continue; ?>
                    <blockquote class="sp-quote">
                        <p><?php echo esc_html($q['text']); ?></p>
                        <?php if (!empty($q['author'])) : ?><footer class="k"><?php echo !empty($q['url']) ? '<a class="u" href="' . esc_url($q['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($q['author']) . ' ↗</a>' : esc_html($q['author']); ?></footer><?php endif; ?>
                    </blockquote>
                <?php endforeach; ?>
            <?php endif; ?>

            <?php if (!empty($p['community'])) : $co = $p['community']; ?>
                <h2 id="community">What the community says</h2>
                <?php if (!empty($co['quotes'])) : ?>
                    <p>From the Product Hunt launch discussion<?php echo !empty($phs['comments']) ? ' (' . (int) $phs['comments'] . ' comments)' : ''; ?>:</p>
                    <?php foreach ($co['quotes'] as $q) : ?>
                        <blockquote class="sp-quote">
                            <p><?php echo esc_html($q['text']); ?></p>
                            <?php if (!empty($q['reply'])) : ?><p class="sp-reply"><strong>The maker replied:</strong> <?php echo esc_html($q['reply']); ?></p><?php endif; ?>
                            <footer class="k"><?php echo esc_html($q['author']); ?> on Product Hunt</footer>
                        </blockquote>
                    <?php endforeach; ?>
                    <?php if (!empty($co['ph_url'])) : ?><p class="k sp-src"><a class="u" href="<?php echo esc_url($co['ph_url']); ?>" target="_blank" rel="nofollow noopener">Read the full discussion ↗</a></p><?php endif; ?>
                <?php endif; ?>

                <?php if ($x) : ?>
                    <h3>On X</h3>
                    <?php if (!empty($x['posts'])) : ?>
                        <ul class="sp-links"><?php foreach ($x['posts'] as $xp) : ?>
                            <li><a class="u" href="<?php echo esc_url($xp['url']); ?>" target="_blank" rel="nofollow noopener"><?php echo esc_html($xp['author']); ?></a> — <?php echo esc_html($xp['note'] ?? ''); ?></li>
                        <?php endforeach; ?></ul>
                    <?php else : ?>
                        <p><?php echo esc_html($x['none'] ?? 'We found no posts on X about ' . $name . ' yet.'); ?></p>
                    <?php endif; ?>
                    <?php if (!empty($x['related'])) : ?>
                        <p class="sp-note">Related, but not about <?php echo esc_html($name); ?>: posts showing the wider conversation around this kind of tool.</p>
                        <ul class="sp-links"><?php foreach ($x['related'] as $xp) : ?>
                            <li><a class="u" href="<?php echo esc_url($xp['url']); ?>" target="_blank" rel="nofollow noopener"><?php echo esc_html($xp['author']); ?></a> — <?php echo esc_html($xp['note'] ?? ''); ?></li>
                        <?php endforeach; ?></ul>
                    <?php endif; ?>
                    <p class="k sp-src">
                        <?php if (!empty($x['profile_url'])) : ?><a class="u" href="<?php echo esc_url($x['profile_url']); ?>" target="_blank" rel="nofollow noopener">Follow on X ↗</a> · <?php endif; ?>
                        <?php if (!empty($x['search_url'])) : ?><a class="u" href="<?php echo esc_url($x['search_url']); ?>" target="_blank" rel="nofollow noopener">Search X for <?php echo esc_html($name); ?> ↗</a><?php endif; ?>
                    </p>
                <?php endif; ?>
            <?php endif; ?>

            <?php if (!empty($p['faq'])) : ?>
                <h2 id="faq">Frequently asked questions</h2>
                <div class="sp-faq">
                    <?php foreach ($p['faq'] as $f) : ?>
                        <details><summary><?php echo esc_html($f['q']); ?></summary><p><?php echo esc_html($f['a']); ?></p></details>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($p['sources'])) : ?>
                <details class="xf-sources sp-sources">
                    <summary class="k">Sources (<?php echo count($p['sources']); ?>)<?php echo $checked ? ', checked ' . esc_html($checked) : ''; ?></summary>
                    <ol><?php foreach ($p['sources'] as $s) { echo '<li><a href="' . esc_url($s['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($s['label']) . '</a></li>'; } // phpcs:ignore ?></ol>
                </details>
            <?php endif; ?>
            <p class="k" style="font-size:10.5px;margin-top:20px"><?php if ($from_founder) : ?>The description, pricing and images were supplied by <?php echo esc_html($name); ?>'s team through our free launch form. We are not affiliated with it.<?php else : ?>We list <?php echo esc_html($name); ?> from public sources and are not affiliated with it.<?php endif; ?> Spotted something wrong? <a class="u" href="<?php echo esc_url(home_url('/corrections-policy/')); ?>">Tell us</a>.</p>
        </div>

        <aside class="sp-side">
            <?php if ($spotlight) : ?>
                <div class="sp-card"><div class="k ac">Founder spotlight</div>
                    <h3 style="margin:8px 0"><?php echo esc_html(get_the_title($spotlight)); ?></h3>
                    <p class="muted" style="font-size:14px"><?php echo esc_html(wp_trim_words(get_post_meta($spotlight->ID, '_xf_story_origin', true), 40)); ?></p>
                    <a class="u" href="<?php echo esc_url(get_permalink($spotlight)); ?>">Read the full story →</a></div>
            <?php else : ?>
                <div class="sp-card"><div class="k ac">Founder?</div>
                    <h3 style="margin:8px 0">Are you behind <?php echo esc_html($name); ?>?</h3>
                    <p class="muted" style="font-size:14px">Get a free founder spotlight on 100xFounder and our Instagram. Check your inbox for an invite, or reply to any of our emails to correct anything on this page.</p></div>
            <?php endif; ?>
            <?php if ($founder_show) : ?>
                <div class="sp-card"><div class="k ac">Founder</div>
                    <h3 style="margin:8px 0"><?php echo esc_html($founder_show['name']); ?></h3>
                    <p class="muted" style="font-size:14px;margin:0"><?php echo esc_html($founder_show['role']); ?></p></div>
            <?php endif; ?>
            <div class="sp-card"><div class="k ac">Is this your startup?</div>
                <p class="muted" style="font-size:14px;margin:8px 0">Claim this listing to update the description, logo, screenshots and pricing. Free.</p>
                <a class="u" href="<?php echo esc_url(add_query_arg('claim', get_post_field('post_name', $id), xft_page_url('launch', 'launch'))); ?>">Claim or update it →</a></div>

            <?php $mentions = function_exists('xf_startup_mentioned_in') ? xf_startup_mentioned_in($id, 6) : []; if ($mentions) : ?>
                <div>
                    <div class="sh"><h2 style="font-size:18px">Mentioned in</h2></div>
                    <?php foreach ($mentions as $mp) : ?>
                        <a class="sp-sim" href="<?php echo esc_url(get_permalink($mp)); ?>"><span><strong><?php echo esc_html(get_the_title($mp)); ?></strong><br><span class="muted" style="font-size:13px"><?php echo esc_html(get_the_date('j M Y', $mp)); ?></span></span></a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($p['team'])) : ?>
                <div class="sp-card"><div class="k ac">Team</div>
                    <ul class="sp-team">
                        <?php foreach ((array) $p['team'] as $t) : if (empty($t['name'])) continue; ?>
                            <li><strong><?php echo !empty($t['url']) ? '<a class="u" href="' . esc_url($t['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($t['name']) . '</a>' : esc_html($t['name']); ?></strong><?php if (!empty($t['role'])) : ?><br><span class="muted"><?php echo esc_html($t['role']); ?></span><?php endif; ?></li>
                        <?php endforeach; ?>
                    </ul></div>
            <?php endif; ?>

            <?php if ($alt_items) : ?>
                <div class="sp-alts" id="alternatives-panel">
                    <div class="sh"><h2 style="font-size:18px">Alternatives</h2></div>
                    <?php foreach (array_slice($alt_items, 0, 6) as $it) :
                        if (empty($it['name'])) continue;
                        $own = function_exists('xf_startup_by_name') ? xf_startup_by_name($it['name']) : null;
                        $href = $own ? get_permalink($own) : ($it['url'] ?? '');
                        if ($own) {
                            $logo = xf_startup_logo_html($own->ID, 40);
                        } elseif (!empty($it['logo'])) {
                            $logo = '<img class="xf-logo" src="' . esc_url($it['logo']) . '" alt="' . esc_attr($it['name'] . ' logo') . '" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer">';
                        } else {
                            $logo = xft_company_mark($it['name'], 40);
                        }
                        $tags = array_filter((array) ($it['tags'] ?? (isset($it['category']) ? [$it['category']] : []))); ?>
                        <div class="sp-alt">
                            <?php echo $logo; // phpcs:ignore -- built from escaped parts above ?>
                            <div style="min-width:0">
                                <?php if ($href) : ?>
                                    <a class="sp-alt-name" href="<?php echo esc_url($href); ?>"<?php echo $own ? '' : ' target="_blank" rel="nofollow noopener"'; ?>><?php echo esc_html($it['name']); ?><?php echo $own ? '' : ' ↗'; ?></a>
                                <?php else : ?><strong class="sp-alt-name"><?php echo esc_html($it['name']); ?></strong><?php endif; ?>
                                <?php if (!empty($it['what'])) : ?><p class="sp-alt-tag"><?php echo esc_html($it['what']); ?></p><?php endif; ?>
                                <?php if ($tags) : ?><div class="sp-alt-tags"><?php foreach ($tags as $tg) echo '<span class="k">' . esc_html($tg) . '</span>'; ?></div><?php endif; ?>
                                <?php if (!empty($it['starts_at'])) : ?><div class="sp-alt-meta"><?php echo esc_html($it['starts_at']); ?></div><?php endif; ?>
                                <?php if (!empty($it['ph_rating'])) : $rating_text = number_format_i18n((float) $it['ph_rating'], 1) . ' on Product Hunt' . (!empty($it['ph_reviews']) ? ' · ' . (int) $it['ph_reviews'] . ' reviews' : ''); ?>
                                    <div class="sp-alt-meta"><?php echo !empty($it['ph_url']) ? '<a class="u" href="' . esc_url($it['ph_url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($rating_text) . ' ↗</a>' : esc_html($rating_text); ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                    <?php if (isset($jump['alternatives'])) : ?><a class="k u" href="#alternatives">Full comparison →</a><?php endif; ?>
                </div>
            <?php endif; ?>

            <?php if ($alt_of) : ?>
                <div>
                    <div class="sh"><h2 style="font-size:18px"><?php echo esc_html($name); ?> is an alternative to</h2></div>
                    <?php foreach ($alt_of as $aid) : ?>
                        <a class="sp-sim" href="<?php echo esc_url(get_permalink($aid)); ?>"><?php echo xf_startup_logo_html($aid, 40); // phpcs:ignore ?>
                            <span><strong><?php echo esc_html(get_the_title($aid)); ?></strong><br><span class="muted" style="font-size:13px"><?php echo esc_html(wp_trim_words(get_post_meta($aid, '_xf_tagline', true), 10)); ?></span></span></a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php
            $ind_terms = get_the_terms($id, 'xf_industry');
            $ind_term = $ind_terms && !is_wp_error($ind_terms) ? $ind_terms[0] : null;
            $similar = $ind_term && function_exists('xf_startup_industry_neighbours') ? xf_startup_industry_neighbours($id, $ind_term, 6) : [];
            if ($similar) : ?>
                <div>
                    <div class="sh"><h2 style="font-size:18px">More in <?php echo esc_html($ind_term->name); ?></h2><a class="k u" href="<?php echo esc_url(get_term_link($ind_term)); ?>">All →</a></div>
                    <?php foreach ($similar as $s) : ?>
                        <a class="sp-sim" href="<?php echo esc_url(get_permalink($s)); ?>"><?php echo xf_startup_logo_html($s->ID, 40); // phpcs:ignore ?>
                            <span><strong><?php echo esc_html(get_the_title($s)); ?></strong><br><span class="muted" style="font-size:13px"><?php echo esc_html(wp_trim_words(get_post_meta($s->ID, '_xf_tagline', true), 10)); ?></span></span></a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            <div><?php echo xft_newsletter('New launches and funding rounds, once a week.'); // phpcs:ignore ?></div>
        </aside>
    </section>
<?php endwhile;
get_footer();
