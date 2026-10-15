<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Reader ratings: a "rate this page" box in the footer of every page, and the
 * AggregateRating structured data computed from the votes it collects.
 *
 *  - Every number comes from a visitor's click. Nothing is seeded, defaulted or
 *    typed in by hand, and the schema appears only once a page has at least
 *    XF_RATING_MIN_VOTES votes. What the box shows and what the schema says are
 *    always the same figures.
 *  - On a researched startup page the box rates the product, and the rating
 *    goes into that page's SoftwareApplication data. Everywhere else it rates
 *    the page, and a WebPage node carries it. (Google shows stars only for some
 *    types, such as products and software; for the rest the markup is valid but
 *    may not produce a rich result. Ratings other platforms give a product, such
 *    as Product Hunt's, are shown as text with their source, never as ours.)
 *  - A vote is a hashed visitor (IP + site salt, never stored raw),
 *    one per page per 30 days. The form carries a signed token that proves the
 *    server rendered it a few seconds earlier, so a script cannot vote for a
 *    page the server never showed.
 */

const XF_RATING_MIN_VOTES = 3;
const XF_RATING_REVOTE_DAYS = 30;

/** Creates the two small tables. Called from the plugin's schema installer. */
function xf_ratings_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE " . xf_table('ratings') . " (
  path_hash char(32) NOT NULL,
  path varchar(255) NOT NULL,
  votes int(10) unsigned NOT NULL DEFAULT 0,
  total int(10) unsigned NOT NULL DEFAULT 0,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (path_hash)
) $charset;");
    dbDelta("CREATE TABLE " . xf_table('rating_votes') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  path_hash char(32) NOT NULL,
  voter char(32) NOT NULL,
  stars tinyint(3) unsigned NOT NULL,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY page_voter (path_hash,voter)
) $charset;");
}

/** The address a rating belongs to: the page's canonical URL, or '' when the page takes no ratings. */
function xf_rating_page_url() {
    if (is_admin() || is_404() || is_search() || is_feed() || is_preview() || is_customize_preview()) {
        return '';
    }
    $pages = get_option('xf_pages', []);
    foreach (['feature', 'unsubscribe'] as $key) {
        if (!empty($pages[$key]) && is_page($pages[$key])) {
            return '';
        }
    }
    if (is_singular('xf_job') && get_post_meta(get_queried_object_id(), '_xf_expired', true)) {
        return '';
    }
    $url = function_exists('xf_current_canonical') ? xf_current_canonical() : '';
    if (!$url || is_wp_error($url)) {
        if (is_front_page()) {
            $url = home_url('/');
        } elseif (is_singular()) {
            $url = get_permalink(get_queried_object_id());
        } elseif (is_post_type_archive()) {
            $url = get_post_type_archive_link(get_query_var('post_type'));
        } elseif (is_home() && get_option('page_for_posts')) {
            $url = get_permalink((int) get_option('page_for_posts'));
        }
    }
    return $url && !is_wp_error($url) ? strtok((string) $url, '?') : '';
}

function xf_rating_hash($url) {
    return md5(untrailingslashit((string) wp_parse_url($url, PHP_URL_PATH)) ?: '/');
}

/** [votes, average] for a page address; votes is 0 when nobody has rated it. */
function xf_rating_summary($url) {
    global $wpdb;
    $row = $wpdb->get_row($wpdb->prepare('SELECT votes, total FROM ' . xf_table('ratings') . ' WHERE path_hash = %s', xf_rating_hash($url)));
    if (!$row || !(int) $row->votes) {
        return [0, 0.0];
    }
    return [(int) $row->votes, round((int) $row->total / (int) $row->votes, 1)];
}

/** The summary only when there are enough real votes to publish. */
function xf_rating_public($url) {
    [$n, $avg] = xf_rating_summary($url);
    return $n >= XF_RATING_MIN_VOTES ? ['count' => $n, 'value' => $avg] : null;
}

/* ---- What is being rated ---- */

/** 'product' on a startup page, otherwise 'page'. */
function xf_rating_mode() {
    return is_singular('xf_startup') ? 'product' : 'page';
}

/** [count, average] shown for a page: on a startup page its approved reader reviews count too (startup-reviews.php). */
function xf_rating_shown($url, $post_id = 0) {
    if ($post_id && get_post_type($post_id) === 'xf_startup' && function_exists('xf_startup_rating')) {
        $r = xf_startup_rating($post_id);
        return [$r['count'], $r['value']];
    }
    return xf_rating_summary($url);
}

/* ---- Signed token: the server rendered this form just now ---- */

function xf_rating_token($url, $ts = null) {
    $ts = $ts ?: time();
    return $ts . '.' . hash_hmac('sha256', xf_rating_hash($url) . '|' . $ts, wp_salt('auth'));
}

function xf_rating_token_ok($url, $token) {
    [$ts, $mac] = array_pad(explode('.', (string) $token, 2), 2, '');
    if (!ctype_digit($ts) || !hash_equals(hash_hmac('sha256', xf_rating_hash($url) . '|' . $ts, wp_salt('auth')), $mac)) {
        return false;
    }
    $age = time() - (int) $ts;
    // Cached pages carry old tokens, so allow two weeks; under three seconds is a script.
    return $age >= 3 && $age <= 14 * DAY_IN_SECONDS;
}

/**
 * One voter per address. The browser string is deliberately not part of it:
 * a script can send a new User-Agent with every request, which would make each
 * request a "new visitor" and let one machine stuff a page's rating.
 */
function xf_rating_voter() {
    $ip = function_exists('xf_client_ip') ? xf_client_ip() : (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return md5($ip . '|' . wp_salt('nonce'));
}

/* ---- The vote ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/rate', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $r) {
            global $wpdb;
            $url = esc_url_raw((string) $r->get_param('url'));
            $stars = (int) $r->get_param('stars');
            $host = wp_parse_url($url, PHP_URL_HOST);
            if ($stars < 1 || $stars > 5 || !$url || $host !== wp_parse_url(home_url(), PHP_URL_HOST)) {
                return new WP_Error('bad_vote', 'That rating is not valid.', ['status' => 400]);
            }
            if ((string) $r->get_param('website') !== '' || !xf_rating_token_ok($url, $r->get_param('token'))) {
                return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 400]);
            }
            $voter = xf_rating_voter();
            $bucket = 'xf_rate_' . substr($voter, 0, 16);
            $recent = (int) get_transient($bucket);
            if ($recent >= 30) {
                return new WP_Error('slow_down', 'Too many ratings from this connection. Try again later.', ['status' => 429]);
            }
            set_transient($bucket, $recent + 1, HOUR_IN_SECONDS);

            $hash = xf_rating_hash($url);
            // Check and insert under a lock, or parallel requests could all pass the check.
            $lock = 'rate_' . substr(md5($hash . $voter), 0, 20);
            if (function_exists('xf_mutex_acquire') && !xf_mutex_acquire($lock, 10, 3)) {
                return new WP_Error('slow_down', 'Please try again in a moment.', ['status' => 429]);
            }
            $already = (int) $wpdb->get_var($wpdb->prepare(
                'SELECT COUNT(*) FROM ' . xf_table('rating_votes') . ' WHERE path_hash = %s AND voter = %s AND created_at > %s',
                $hash, $voter, gmdate('Y-m-d H:i:s', time() - XF_RATING_REVOTE_DAYS * DAY_IN_SECONDS)
            ));
            if (!$already) {
                $now = gmdate('Y-m-d H:i:s');
                $wpdb->insert(xf_table('rating_votes'), ['path_hash' => $hash, 'voter' => $voter, 'stars' => $stars, 'created_at' => $now]);
                $wpdb->query($wpdb->prepare(
                    'INSERT INTO ' . xf_table('ratings') . ' (path_hash, path, votes, total, updated_at) VALUES (%s, %s, 1, %d, %s)
                     ON DUPLICATE KEY UPDATE votes = votes + 1, total = total + %d, updated_at = %s',
                    $hash, substr((string) wp_parse_url($url, PHP_URL_PATH), 0, 255), $stars, $now, $stars, $now
                ));
            }
            if (function_exists('xf_mutex_release')) {
                xf_mutex_release($lock);
            }
            [$n, $avg] = xf_rating_shown($url, url_to_postid($url));
            return rest_ensure_response(['counted' => !$already, 'votes' => $n, 'average' => $avg, 'public' => $n >= XF_RATING_MIN_VOTES]);
        },
    ]);
});

/* ---- The box in the footer ---- */

/** Markup for the rating box, or '' on pages that take no ratings. */
function xf_rating_box_html() {
    $url = xf_rating_page_url();
    if (!$url) {
        return '';
    }
    $mode = xf_rating_mode();
    $name = $mode === 'product' ? get_the_title(get_queried_object_id()) : '';
    $question = $mode === 'product' ? sprintf('How would you rate %s?', $name) : 'Was this page useful?';
    [$n, $avg] = xf_rating_shown($url, $mode === 'product' ? get_queried_object_id() : 0);
    $public = $n >= XF_RATING_MIN_VOTES;
    $line = $public
        ? sprintf('%s out of 5 from %s ratings by 100xFounder readers', number_format_i18n($avg, 1), number_format_i18n($n))
        : ($n ? 'Ratings from readers appear here once there are a few' : 'Be the first to rate it');

    ob_start();
    ?>
    <section class="xf-rate" aria-label="Rate this page" data-url="<?php echo esc_url($url); ?>" data-token="<?php echo esc_attr(xf_rating_token($url)); ?>" data-endpoint="<?php echo esc_url(rest_url('xf/v1/rate')); ?>">
        <div class="wrap xf-rate__in">
            <div>
                <strong class="xf-rate__q"><?php echo esc_html($question); ?></strong>
                <span class="xf-rate__sum k" aria-live="polite"><?php echo esc_html($line); ?></span>
            </div>
            <div class="xf-rate__stars" role="group" aria-label="<?php echo esc_attr($question); ?>">
                <?php for ($i = 1; $i <= 5; $i++) : ?>
                    <button type="button" class="xf-star" data-stars="<?php echo (int) $i; ?>" aria-label="<?php echo esc_attr(sprintf('%d out of 5 stars', $i)); ?>">★</button>
                <?php endfor; ?>
            </div>
            <input class="xf-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
        </div>
    </section>
    <?php
    return ob_get_clean();
}

/** The theme prints the box inside its footer; other themes get it from wp_footer. */
function xf_rating_box() {
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    echo xf_rating_box_html(); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped above
}
add_action('wp_footer', 'xf_rating_box', 4);

add_action('wp_footer', function () {
    if (!xf_rating_page_url()) {
        return;
    }
    ?>
<script>
(function(){var box=document.querySelector('.xf-rate');if(!box)return;
var stars=[].slice.call(box.querySelectorAll('.xf-star')),sum=box.querySelector('.xf-rate__sum'),key='xfr:'+box.dataset.url,done=false;
function paint(n){stars.forEach(function(s){s.classList.toggle('on',+s.dataset.stars<=n)})}
try{var old=localStorage.getItem(key);if(old){done=true;paint(+old);sum.textContent='Thanks, you rated this '+old+' out of 5.'}}catch(e){}
stars.forEach(function(s){
 s.addEventListener('mouseenter',function(){if(!done)paint(+s.dataset.stars)});
 s.addEventListener('focus',function(){if(!done)paint(+s.dataset.stars)});
 s.addEventListener('mouseleave',function(){if(!done)paint(0)});
 s.addEventListener('click',function(){
  if(done)return;done=true;var n=+s.dataset.stars;paint(n);
  var hp=box.querySelector('.xf-hp');
  fetch(box.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:box.dataset.url,stars:n,token:box.dataset.token,website:hp?hp.value:''})})
   .then(function(r){return r.json()}).then(function(d){
     if(d&&d.votes!==undefined){sum.textContent=d.public?('Thanks. '+d.average.toFixed(1)+' out of 5 from '+d.votes+' ratings by 100xFounder readers'):'Thanks, your rating is counted.';try{localStorage.setItem(key,String(n))}catch(e){}}
     else{done=false;paint(0);sum.textContent=(d&&d.message)||'Could not save that. Please try again.'}
   }).catch(function(){done=false;paint(0);sum.textContent='Could not save that. Please try again.'});
 });
});})();
</script>
    <?php
}, 6);

/* ---- Structured data ---- */

/** Footer JSON-LD for ordinary pages: a WebPage that carries the readers' rating. */
add_action('wp_footer', function () {
    $url = xf_rating_page_url();
    if (!$url || xf_rating_mode() === 'product') {
        return; // product pages carry the rating inside their SoftwareApplication data
    }
    $r = xf_rating_public($url);
    if (!$r) {
        return;
    }
    xf_json_ld([
        '@context' => 'https://schema.org',
        '@type' => 'WebPage',
        '@id' => $url . '#webpage',
        'url' => $url,
        'name' => wp_strip_all_tags(wp_get_document_title()),
        'aggregateRating' => [
            '@type' => 'AggregateRating',
            'ratingValue' => $r['value'],
            'ratingCount' => $r['count'],
            'bestRating' => 5,
            'worstRating' => 1,
        ],
    ]);
}, 7);
