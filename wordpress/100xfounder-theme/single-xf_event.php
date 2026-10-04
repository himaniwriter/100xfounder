<?php
/**
 * One event: the practical details someone needs before deciding to go, the
 * organiser's own image, an RSVP, a city alert signup, and what else is on
 * nearby. Everything factual comes from the organiser's own listing.
 */
get_header();
while (have_posts()) :
    the_post();
    $id = get_the_ID();
    $m = function ($k) use ($id) { return (string) get_post_meta($id, '_xf_' . $k, true); };
    $start = $m('start');
    $end = $m('end');
    $ts = $start ? strtotime(get_date_from_gmt($start)) : 0;
    $te = $end ? strtotime(get_date_from_gmt($end)) : 0;
    $city = $m('city');
    $venue = $m('venue');
    $url = $m('url');
    $organiser = $m('organizer');
    $price = $m('price');
    $kind = $m('kind');
    $past = $ts && $ts < current_time('timestamp');
    $pic = function_exists('xf_event_image') ? xf_event_image($id) : ['url' => '', 'credit' => '', 'theirs' => false];
    $going = function_exists('xf_event_rsvp_count') ? xf_event_rsvp_count($id) : 0;
    $mine = !empty($_COOKIE['xf_rsvp_' . $id]);
    $events_url = xft_page_url('events', 'events');
    $city_url = $city ? add_query_arg('city', rawurlencode($city), $events_url) : $events_url;
    ?>
    <section class="wrap" style="padding-top:48px">
        <nav class="crumbs k in" aria-label="Breadcrumb">
            <a href="<?php echo esc_url($events_url); ?>">Events</a><span>/</span>
            <?php if ($city) : ?><a href="<?php echo esc_url($city_url); ?>"><?php echo esc_html($city); ?></a><span>/</span><?php endif; ?>
            <span style="color:var(--tx)"><?php echo esc_html(wp_trim_words(get_the_title(), 7)); ?></span>
        </nav>
        <div style="margin-top:32px;display:flex;flex-wrap:wrap;gap:36px 48px;align-items:flex-start">
            <div style="flex:999 1 560px;min-width:0">
                <div class="k in" style="display:flex;gap:12px;flex-wrap:wrap">
                    <?php if ($kind) : ?><span class="ac"><?php echo esc_html(ucfirst($kind)); ?></span><?php endif; ?>
                    <?php if ($city) : ?><span><?php echo esc_html($city); ?></span><?php endif; ?>
                    <?php if ($past) : ?><span style="color:var(--t3)">This event has passed</span><?php endif; ?>
                </div>
                <h1 class="page-title in" style="animation-delay:.06s"><?php the_title(); ?></h1>
                <?php if ($ts) : ?>
                    <p class="in" style="margin:14px 0 0;font-size:18px;color:var(--t2);animation-delay:.1s">
                        <?php
                        echo esc_html(wp_date('l, j F Y', $ts) . ' · ' . wp_date('g:i a', $ts));
                        if ($te && wp_date('Y-m-d', $te) !== wp_date('Y-m-d', $ts)) {
                            echo esc_html(' – ' . wp_date('j F Y', $te));
                        } elseif ($te) {
                            echo esc_html(' – ' . wp_date('g:i a', $te));
                        }
                        ?>
                    </p>
                <?php endif; ?>
            </div>
            <?php if ($pic['url']) : ?>
                <div class="in" style="flex:1 1 340px;animation-delay:.14s">
                    <span class="ph ph-16x10" style="display:block">
                        <img src="<?php echo esc_url($pic['url']); ?>" alt="<?php echo esc_attr(get_the_title()); ?>" referrerpolicy="no-referrer">
                        <?php if ($pic['credit']) : ?><span class="ph-credit"><?php echo esc_html(($pic['theirs'] ? 'Image: ' : '') . $pic['credit']); ?></span><?php endif; ?>
                    </span>
                </div>
            <?php endif; ?>
        </div>

        <div class="facts in" style="margin-top:36px;animation-delay:.18s">
            <div><div class="k" style="font-size:10px">When</div><div class="v"><?php echo esc_html($ts ? wp_date('j M Y, g:i a', $ts) : 'To be confirmed'); ?></div></div>
            <div><div class="k" style="font-size:10px">Where</div><div class="v"><?php echo esc_html($venue ?: ($city ?: 'To be confirmed')); ?></div></div>
            <div><div class="k" style="font-size:10px">City</div><div class="v"><?php echo esc_html($city ?: '—'); ?></div></div>
            <div><div class="k" style="font-size:10px">Cost</div><div class="v"><?php echo esc_html($price ?: 'See the organiser'); ?></div></div>
            <?php if ($organiser) : ?><div><div class="k" style="font-size:10px">Organiser</div><div class="v"><?php echo esc_html($organiser); ?></div></div><?php endif; ?>
        </div>

        <div id="rsvp" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:28px">
            <?php if ($url && !$past) : ?>
                <a class="btn btn-w" style="height:48px" href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener nofollow">Register on the organiser's page ↗</a>
            <?php elseif ($url) : ?>
                <a class="btn" href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener nofollow">See the organiser's page ↗</a>
            <?php endif; ?>
            <?php if (!$past) : ?>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline">
                    <input type="hidden" name="action" value="xf_rsvp">
                    <input type="hidden" name="event" value="<?php echo (int) $id; ?>">
                    <?php wp_nonce_field('xf_rsvp_' . $id, 'xf_rsvp_nonce'); ?>
                    <button class="btn" type="submit" style="height:48px" <?php disabled($mine); ?>><?php echo $mine ? "You're going" : "I'm going"; ?></button>
                </form>
            <?php endif; ?>
            <span class="k"><?php echo $going ? esc_html(sprintf(_n('%d person going from 100xFounder', '%d going from 100xFounder', $going), $going)) : 'Be the first to say you’re going'; ?></span>
        </div>
    </section>

    <div class="hl" style="margin-top:48px"></div>

    <section class="wrap" style="padding-top:48px;display:flex;flex-wrap:wrap;gap:48px;align-items:flex-start">
        <div class="prose" style="flex:999 1 580px;min-width:0">
            <h2>About this event</h2>
            <?php the_content(); ?>

            <h2>Before you go</h2>
            <ul>
                <li><strong>Register on the organiser's page.</strong> We list events but we don't sell tickets, and places at the popular ones go quickly.<?php echo $price ? ' This one is listed as ' . esc_html($price) . '.' : ''; ?></li>
                <li><strong>Check the venue on the day.</strong> Organisers move rooms, and some share the exact address only with people who have registered.</li>
                <li><strong>Bring something to say.</strong> A one-line description of what you're building opens more conversations at these than a pitch deck does.</li>
                <li><strong>Follow up within 48 hours.</strong> The value of a mixer is almost entirely in the messages you send afterwards.</li>
            </ul>

            <p class="k" style="font-size:10.5px">Details come from <?php echo $organiser ? esc_html($organiser) . '’s' : 'the organiser’s'; ?> own listing, checked <?php echo esc_html(get_the_modified_date('j M Y')); ?>. We're not the organiser and we don't take bookings — confirm the time and venue on their page before travelling.</p>
        </div>

        <aside style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:28px">
            <?php echo function_exists('xf_city_alert_form') ? xf_city_alert_form($city, get_the_title()) : ''; // phpcs:ignore ?>

            <?php
            $same_city = $city ? get_posts([
                'post_type' => 'xf_event',
                'posts_per_page' => 5,
                'post__not_in' => [$id],
                'meta_key' => '_xf_start',
                'orderby' => 'meta_value',
                'order' => 'ASC',
                'meta_query' => [
                    ['key' => '_xf_city', 'value' => $city],
                    ['key' => '_xf_start', 'value' => current_time('mysql', true), 'compare' => '>=', 'type' => 'DATETIME'],
                ],
            ]) : [];
            if ($same_city) : ?>
                <div>
                    <div class="sh"><h2 style="font-size:18px">More in <?php echo esc_html($city); ?></h2><a class="k u" href="<?php echo esc_url($city_url); ?>">All →</a></div>
                    <?php foreach ($same_city as $s) echo xft_event_row($s, true); // phpcs:ignore ?>
                </div>
            <?php endif; ?>

            <?php
            $comms = $city && function_exists('xf_communities') ? xf_communities($city, 3) : [];
            if ($comms) : ?>
                <div>
                    <div class="sh"><h2 style="font-size:18px">Communities in <?php echo esc_html($city); ?></h2></div>
                    <?php foreach ($comms as $c) echo xf_community_card_html($c); // phpcs:ignore ?>
                </div>
            <?php endif; ?>
        </aside>
    </section>
<?php endwhile;
get_footer();
