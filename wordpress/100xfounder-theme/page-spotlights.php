<?php
/**
 * /spotlights/ (Founder Stories): the Instagram grid as a page (owner, 2026-10-21).
 * One row per day, three columns that never change: news | events & jobs | founders,
 * the same plan as the three daily Instagram posts. Every tile is built from something
 * already published here and links to it. Design: "100xFounder Poster System"
 * (Poppins + one Playfair italic highlight, violet-to-blue gradient, no bold).
 */
get_header();

$rows = 8;
$tile = function ($kind, $url, $title, $kicker, $bg = '', $logo = '', $meta = '') {
    return ['kind' => $kind, 'url' => $url, 'title' => $title, 'kicker' => $kicker, 'bg' => $bg, 'logo' => $logo, 'meta' => $meta];
};

// News: newest articles with a featured image.
$news = [];
foreach (get_posts(['posts_per_page' => $rows, 'post_status' => 'publish', 'meta_key' => '_thumbnail_id', 'ignore_sticky_posts' => true]) as $p) {
    $news[] = $tile('news', get_permalink($p), get_the_title($p), xft_cat_name($p), (string) get_the_post_thumbnail_url($p, 'xft-card'), '', get_the_date('j M', $p));
}

// Events & jobs: upcoming events with the organiser's graphic, alternating with fresh jobs that have a company logo.
$events = [];
foreach (function_exists('xft_event_strip_items') ? xft_event_strip_items($rows) : [] as $e) {
    $events[] = $tile('ej', $e['url'], $e['title'], 'Event · ' . $e['meta'], $e['img']);
}
$jobs = [];
if (post_type_exists('xf_job') && function_exists('xf_job_company')) {
    foreach (get_posts(['post_type' => 'xf_job', 'post_status' => 'publish', 'posts_per_page' => $rows * 4]) as $j) {
        $co = xf_job_company($j->ID);
        $logo = $co ? xf_company_logo_url($co) : '';
        if (!$logo) {
            continue; // a tile needs an image of its own
        }
        $city = (string) get_post_meta($j->ID, '_xf_city', true);
        $jobs[] = $tile('ej', get_permalink($j), get_the_title($j), 'Hiring · ' . $co->name . ($city ? ' · ' . $city : ''), '', $logo, get_the_date('j M', $j));
        if (count($jobs) >= $rows) {
            break;
        }
    }
}
$ej = [];
for ($i = 0; count($ej) < $rows && ($i < count($events) || $i < count($jobs)); $i++) {
    if (isset($jobs[$i])) $ej[] = $jobs[$i];
    if (isset($events[$i]) && count($ej) < $rows) $ej[] = $events[$i];
}

// Founders: published founder spotlights first, then the newest researched startup profiles with a logo.
$founders = [];
foreach (get_posts(['post_type' => 'xf_spotlight', 'post_status' => 'publish', 'posts_per_page' => $rows]) as $s) {
    $name = (string) get_post_meta($s->ID, '_xf_founder_name', true);
    $founders[] = $tile('founder', get_permalink($s), get_the_title($s), 'Founder story' . ($name ? ' · ' . $name : ''), (string) get_the_post_thumbnail_url($s, 'xft-card'));
}
if (count($founders) < $rows && post_type_exists('xf_startup')) {
    $q = ['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => $rows * 4, 'meta_query' => [['key' => '_xf_indexable', 'value' => '1']], 'orderby' => 'modified', 'order' => 'DESC'];
    foreach (get_posts($q) as $s) {
        $logo = (string) (get_the_post_thumbnail_url($s, 'medium') ?: get_post_meta($s->ID, '_xf_thumbnail', true));
        if (!$logo) {
            continue; // researched profiles (_xf_indexable) with their own logo only
        }
        $tag = (string) get_post_meta($s->ID, '_xf_tagline', true);
        $founders[] = $tile('founder', get_permalink($s), get_the_title($s), 'Founder featured', '', $logo, $tag);
        if (count($founders) >= $rows) {
            break;
        }
    }
}

$n = max(count($news), count($ej), count($founders));
$cols = ['news' => $news, 'ej' => $ej, 'founder' => $founders];

/** First money amount, multiple or percentage in a title, set as the Playfair highlight word. */
$highlight = function ($title) {
    $t = esc_html($title);
    $re = '/(₹\s?[\d,.]+\s?(?:crore|cr|lakh)?|\$[\d,.]+\s?(?:billion|million|[BMK])?|\d+(?:\.\d+)?\s?(?:x|%))/u';
    return preg_replace($re, '<span class="hw">$1</span>', $t, 1);
};

add_action('wp_footer', function () {
    echo "<script>document.querySelectorAll('[data-sf-f]').forEach(function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-sf-f'),g=document.querySelector('.sf-grid');document.querySelectorAll('[data-sf-f]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});g.classList.toggle('sf-one',f!=='all');g.querySelectorAll('[data-c]').forEach(function(t){t.hidden=f!=='all'&&t.getAttribute('data-c')!==f})})})</script>";
}, 30);
?>
<article class="page">
    <header class="wrap page-head sf-head">
        <div class="sf-ring"><img src="<?php echo esc_url(get_template_directory_uri() . '/assets/logo.png'); ?>" alt="" width="134" height="20"></div>
        <div style="min-width:0">
            <h1 class="page-title in">Founder <em>Stories</em></h1>
            <p class="muted in" style="font-size:17px;margin:12px 0 0;max-width:640px;animation-delay:.08s">Three stories a day, the same three our Instagram posts: startup and funding news, an event or a job opening, and a founder we are featuring. Every tile opens the full page on 100xFounder, with its sources.</p>
            <?php $ig = function_exists('xf_get_setting') ? xf_get_setting('instagram_url') : ''; if ($ig) : ?>
                <a class="btn sf-follow in" href="<?php echo esc_url($ig); ?>" target="_blank" rel="noopener" style="animation-delay:.12s">Follow on Instagram</a>
            <?php endif; ?>
        </div>
    </header>
    <div class="hl"></div>
    <div class="wrap" style="padding-top:28px">
        <div class="sf-hl" role="group" aria-label="Show one column">
            <?php foreach (['all' => 'All', 'news' => 'News', 'ej' => 'Events & jobs', 'founder' => 'Founders'] as $k => $label) : ?>
                <button type="button" class="sf-hl__b" data-sf-f="<?php echo esc_attr($k); ?>" aria-pressed="<?php echo $k === 'all' ? 'true' : 'false'; ?>"><span class="sf-hl__c"><?php echo esc_html($k === 'ej' ? 'E&J' : mb_strtoupper(mb_substr($label, 0, 4))); ?></span><span class="k"><?php echo esc_html($label); ?></span></button>
            <?php endforeach; ?>
        </div>
        <div class="sf-grid">
            <span class="k sf-colh">News</span><span class="k sf-colh">Events &amp; jobs</span><span class="k sf-colh">Founders</span>
            <?php for ($r = 0; $r < $n; $r++) : foreach ($cols as $key => $list) :
                $t = $list[$r] ?? null;
                if (!$t) { echo '<span class="sf-gap" aria-hidden="true" data-c="' . esc_attr($key) . '"></span>'; continue; } ?>
                <a class="sf-tile<?php echo $t['bg'] ? ' sf-tile--bg' : ''; ?>" href="<?php echo esc_url($t['url']); ?>" data-c="<?php echo esc_attr($key); ?>">
                    <?php if ($t['bg']) : ?><img class="sf-bgimg" src="<?php echo esc_url($t['bg']); ?>" alt="" loading="<?php echo $r < 2 ? 'eager' : 'lazy'; ?>" decoding="async" referrerpolicy="no-referrer"><?php endif; ?>
                    <span class="sf-kick"><?php echo esc_html($t['kicker']); ?></span>
                    <span class="sf-body">
                        <?php if ($t['logo']) : ?><img class="sf-logo" src="<?php echo esc_url($t['logo']); ?>" alt="" width="84" height="84" loading="lazy" decoding="async" referrerpolicy="no-referrer"><?php endif; ?>
                        <span class="sf-title"><?php echo $highlight(wp_strip_all_tags($t['title'])); // phpcs:ignore -- escaped in $highlight ?></span>
                        <?php if ($t['logo'] && $t['meta'] && $key === 'founder') : ?><span class="sf-meta"><?php echo esc_html(wp_trim_words($t['meta'], 12)); ?></span><?php endif; ?>
                    </span>
                    <span class="sf-foot"><span>100xFounder</span><span><?php echo esc_html($key === 'founder' ? '' : ($t['meta'] && !$t['logo'] ? $t['meta'] : '')); ?></span></span>
                </a>
            <?php endforeach; endfor; ?>
        </div>
        <section class="sf-about">
            <h2>How Founder Stories works</h2>
            <p>Each row is one day. The left column carries the day's main startup or funding story, built from an article on 100xFounder with every figure sourced. The middle column is an upcoming founder event or a job opening from a company's own careers page. The right column features a founder or a startup we have profiled. The same three posts go out on our Instagram every day.</p>
            <p>Want your startup featured? <a href="<?php echo esc_url(home_url('/launch/')); ?>">Launch it free</a>, then reply to our email to get a founder spotlight.</p>
        </section>
    </div>
</article>
<?php
get_footer();
