<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Gated lists: part of an article that the reader unlocks by filling a short
 * form, for example the rest of a "best agencies" list.
 *
 *   [xf_reveal niche="education-agencies" count="6" start="2" label="agency"
 *      partner="Digihandler" partner_note="the agency behind 100xFounder"]
 *     ...the hidden part, written as normal post content...
 *   [/xf_reveal]
 *
 * The hidden part never reaches the page HTML, the feed or the public REST
 * API: the shortcode prints numbered placeholders and the form, and the
 * content is sent only after a valid request to /xf/v1/reveal. Google sees
 * exactly what a reader sees, so it isn't cloaking.
 *
 * Consent is split, never bundled: one required box covers this request only
 * (save my details and show the list); contact from the partner agency and the
 * newsletter are separate optional boxes, and the wording of each box ticked
 * is stored on the lead.
 */

function xf_reveal_consent_request() {
    return 'Save my details with 100xFounder for this request and show me the full list.';
}

function xf_reveal_consent_partner($partner, $note) {
    return sprintf('%s (%s) may contact me by email, phone or WhatsApp about marketing for my institution. I can ask it to stop at any time.', $partner, $note);
}

function xf_reveal_consent_news() {
    return xf_join_consent_email();
}

/** Signed key that lets this browser fetch the unlocked list again later. */
function xf_reveal_key($post_id) {
    return hash_hmac('sha256', 'reveal|' . (int) $post_id, wp_salt('auth'));
}

/** The attributes and hidden content of the first [xf_reveal] in a post, or null. */
function xf_reveal_block($post) {
    $post = get_post($post);
    if (!$post || !has_shortcode($post->post_content, 'xf_reveal')) {
        return null;
    }
    if (!preg_match('/' . get_shortcode_regex(['xf_reveal']) . '/s', $post->post_content, $m)) {
        return null;
    }
    return ['atts' => shortcode_parse_atts($m[3]) ?: [], 'inner' => (string) $m[5]];
}

function xf_reveal_atts($atts) {
    return shortcode_atts([
        'niche' => 'gated-list',
        'count' => 5,
        'start' => 2,
        'label' => 'entry',
        'title' => 'See the full list',
        'partner' => '',
        'partner_note' => '',
    ], (array) $atts, 'xf_reveal');
}

/* ---- The placeholder and form, printed where the shortcode sits ---- */

add_shortcode('xf_reveal', function ($atts) {
    $a = xf_reveal_atts($atts);
    $post_id = get_the_ID();
    if (!$post_id || is_feed()) {
        return '<p><em>Open the article on 100xFounder to see the full list.</em></p>';
    }
    $n = max(1, min(30, (int) $a['count']));
    $start = max(1, (int) $a['start']);
    $uid = 'xfrv-' . (int) $post_id;
    ob_start();
    ?>
<div class="xf-reveal" id="<?php echo esc_attr($uid); ?>" data-post="<?php echo (int) $post_id; ?>" data-endpoint="<?php echo esc_url(rest_url('xf/v1/reveal')); ?>" data-token="<?php echo esc_attr(xf_join_token()); ?>">
  <ol class="xf-reveal__ghosts" start="<?php echo (int) $start; ?>" aria-hidden="true">
    <?php for ($i = 0; $i < $n; $i++) : ?>
      <li><span class="xf-reveal__no">#<?php echo (int) ($start + $i); ?></span><span class="xf-reveal__bar"></span><span class="xf-reveal__bar xf-reveal__bar--short"></span></li>
    <?php endfor; ?>
  </ol>
  <form class="xf-reveal__form" novalidate>
    <h3 class="xf-reveal__title"><?php echo esc_html($a['title']); ?></h3>
    <p class="xf-reveal__lead"><?php echo esc_html(sprintf('Names, websites, specialisms and what each %s says it has done. Free, shown here as soon as you submit.', $a['label'])); ?></p>
    <div class="xf-reveal__grid">
      <label>Your name<input name="name" autocomplete="name" required maxlength="80"></label>
      <label>Work email<input name="email" type="email" autocomplete="email" required maxlength="120"></label>
      <label>Phone / WhatsApp <span class="xf-reveal__opt">optional</span><input name="phone" type="tel" autocomplete="tel" maxlength="20"></label>
      <label>Your institution
        <select name="org">
          <option value="">Choose one</option>
          <option>School (K-12)</option><option>College</option><option>University</option>
          <option>Coaching institute</option><option>EdTech company</option><option>Other</option>
        </select>
      </label>
    </div>
    <input class="xf-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="xf-reveal__check"><input type="checkbox" name="consent_request" required> <span><?php echo esc_html(xf_reveal_consent_request()); ?></span></label>
    <?php if ($a['partner']) : ?>
      <label class="xf-reveal__check"><input type="checkbox" name="consent_partner"> <span><?php echo esc_html(xf_reveal_consent_partner($a['partner'], $a['partner_note'])); ?> <span class="xf-reveal__opt">optional</span></span></label>
    <?php endif; ?>
    <label class="xf-reveal__check"><input type="checkbox" name="consent_news"> <span><?php echo esc_html(xf_reveal_consent_news()); ?> <span class="xf-reveal__opt">optional</span></span></label>
    <button class="btn btn-w xf-reveal__btn" type="submit">Show the full list</button>
    <p class="xf-reveal__msg" role="status" aria-live="polite"></p>
    <p class="xf-reveal__fine">We don't sell your details. See the <a href="<?php echo esc_url(get_privacy_policy_url() ?: home_url('/privacy-policy/')); ?>">privacy policy</a>.</p>
  </form>
</div>
    <?php
    return ob_get_clean();
});

/* ---- Unlocking ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/reveal', [
        ['methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'xf_handle_reveal'],
        ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => 'xf_reveal_again'],
    ]);
});

function xf_reveal_render($post_id) {
    $block = xf_reveal_block($post_id);
    if (!$block) {
        return '';
    }
    $html = do_shortcode(wpautop(trim($block['inner'])));
    if (get_post_meta($post_id, '_xf_sponsored', true)) {
        $html = preg_replace('/<a\s([^>]*?)\srel="[^"]*"/i', '<a $1', $html);
        $html = preg_replace('/<a\s(?![^>]*\srel=)([^>]*href="https?:[^"]*"[^>]*)>/i', '<a $1 rel="sponsored noopener">', $html);
    }
    return wp_kses_post($html);
}

/** A browser that unlocked the list before gets it again without the form. */
function xf_reveal_again(WP_REST_Request $r) {
    $post_id = (int) $r->get_param('post');
    $post = get_post($post_id);
    if (!$post || $post->post_status !== 'publish' || post_password_required($post) || !hash_equals(xf_reveal_key($post_id), (string) $r->get_param('key'))) {
        return new WP_Error('locked', 'Please fill the form to see the list.', ['status' => 403]);
    }
    return ['html' => xf_reveal_render($post_id)];
}

function xf_handle_reveal(WP_REST_Request $r) {
    if ((string) $r->get_param('website') !== '') {
        return new WP_Error('locked', 'Please try again.', ['status' => 400]); // honeypot: no list for bots
    }
    if (!xf_join_token_ok($r->get_param('token'))) {
        return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 400]);
    }
    if (function_exists('xf_rate_limited') && xf_rate_limited('reveal', 8, HOUR_IN_SECONDS)) {
        return new WP_Error('rate_limited', 'Too many attempts from your connection. Please try again later.', ['status' => 429]);
    }
    $post_id = (int) $r->get_param('post');
    $post = get_post($post_id);
    $block = $post && $post->post_status === 'publish' && !post_password_required($post) ? xf_reveal_block($post) : null;
    if (!$block) {
        return new WP_Error('not_found', 'That list is no longer available.', ['status' => 404]);
    }
    $a = xf_reveal_atts($block['atts']);

    $name = sanitize_text_field(mb_substr((string) $r->get_param('name'), 0, 80));
    if (mb_strlen($name) < 2) {
        return new WP_Error('bad_name', 'Please enter your name.', ['status' => 400]);
    }
    $email = strtolower(sanitize_email((string) $r->get_param('email')));
    if (!is_email($email)) {
        return new WP_Error('bad_email', 'Please enter a valid email address.', ['status' => 400]);
    }
    $phone = '';
    if (trim((string) $r->get_param('phone')) !== '') {
        $phone = xf_normalize_phone($r->get_param('phone'));
        if (!$phone) {
            return new WP_Error('bad_phone', 'That number does not look right. Include the country code, for example +91 98765 43210.', ['status' => 400]);
        }
    }
    if (!$r->get_param('consent_request')) {
        return new WP_Error('no_consent', 'Please tick the first box so we can save your request.', ['status' => 400]);
    }
    $org = sanitize_text_field(mb_substr((string) $r->get_param('org'), 0, 40));
    $partner_ok = $a['partner'] && $r->get_param('consent_partner');
    $news_ok = (bool) $r->get_param('consent_news');
    $now = current_time('mysql');
    $page = get_permalink($post_id);

    if ($news_ok) {
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            'INSERT IGNORE INTO ' . xf_table('subscribers') . ' (email, source, status, created_at) VALUES (%s, %s, %s, %s)',
            $email, 'reveal', 'active', xf_now()
        ));
    }

    $existing = get_posts([
        'post_type' => 'xf_lead', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_lead_email', 'value' => $email], ['key' => '_xf_lead_niche', 'value' => $a['niche']]],
    ]);
    $meta = array_filter([
        '_xf_lead_email' => $email,
        '_xf_lead_name' => $name,
        '_xf_lead_phone' => $phone ?: null,
        '_xf_lead_org' => $org ?: null,
        '_xf_lead_niche' => $a['niche'],
        '_xf_lead_sub' => 'reveal',
        '_xf_lead_source' => $page,
        '_xf_lead_consent' => $now,
        '_xf_lead_consent_text' => xf_reveal_consent_request(),
        '_xf_lead_partner' => $partner_ok ? $a['partner'] : null,
        '_xf_lead_consent_partner' => $partner_ok ? $now : null,
        '_xf_lead_consent_partner_text' => $partner_ok ? xf_reveal_consent_partner($a['partner'], $a['partner_note']) : null,
        '_xf_lead_consent_news' => $news_ok ? $now : null,
        '_xf_lead_consent_news_text' => $news_ok ? xf_reveal_consent_news() : null,
    ]);
    if ($existing) {
        foreach ($meta as $k => $v) {
            update_post_meta($existing[0], $k, $v);
        }
    } else {
        wp_insert_post([
            'post_type' => 'xf_lead',
            'post_status' => 'private',
            'post_title' => sprintf('%s (%s) — %s', $name, $email, $a['niche']),
            'post_content' => sprintf("Unlocked the list on %s.\nInstitution: %s\nPartner contact: %s", $page, $org ?: 'not given', $partner_ok ? 'yes (' . $a['partner'] . ')' : 'no'),
            'meta_input' => $meta,
        ]);
    }

    xf_reveal_to_sheet([
        'time' => $now,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'institution' => $org,
        'list' => $a['niche'],
        'page' => $page,
        'partner_contact' => $partner_ok ? 'yes' : 'no',
        'newsletter' => $news_ok ? 'yes' : 'no',
        'consent' => xf_reveal_consent_request(),
        'partner_consent' => $partner_ok ? xf_reveal_consent_partner($a['partner'], $a['partner_note']) : '',
    ]);

    return ['html' => xf_reveal_render($post_id), 'key' => xf_reveal_key($post_id)];
}

/**
 * Copies a lead to the owner's Google Sheet through its Apps Script web app
 * (100xFounder → Settings → Google Sheet for form leads). Fire-and-forget: the
 * reader never waits for Google, and WordPress keeps the record either way.
 */
function xf_reveal_to_sheet(array $row) {
    $url = trim((string) xf_get_setting('leads_sheet_url'));
    if (!preg_match('#^https://script\.google\.com/macros/s/[\w-]+/exec$#', $url)) {
        return;
    }
    wp_remote_post($url, [
        'blocking' => false,
        'timeout' => 5,
        'headers' => ['Content-Type' => 'application/json'],
        'body' => wp_json_encode($row),
    ]);
}

/* ---- Script, printed only on pages that carry a gated list ---- */

add_action('wp_footer', function () {
    if (!is_singular() || !has_shortcode((string) get_post_field('post_content', get_queried_object_id()), 'xf_reveal')) {
        return;
    }
    ?>
<script>
(function(){document.querySelectorAll('.xf-reveal').forEach(function(box){
var form=box.querySelector('form'),msg=box.querySelector('.xf-reveal__msg'),btn=box.querySelector('button'),K='xfrv:'+box.dataset.post;
function show(html){var d=document.createElement('div');d.className='xf-reveal__open';d.innerHTML=html;box.replaceWith(d);}
var key=null;try{key=localStorage.getItem(K)}catch(e){}
if(key){fetch(box.dataset.endpoint+'?post='+box.dataset.post+'&key='+encodeURIComponent(key)).then(function(r){return r.ok?r.json():null}).then(function(d){if(d&&d.html)show(d.html)}).catch(function(){});}
form.addEventListener('submit',function(e){e.preventDefault();
 var f=new FormData(form),body={post:+box.dataset.post,token:box.dataset.token};
 f.forEach(function(v,k){body[k]=v});['consent_request','consent_partner','consent_news'].forEach(function(k){var i=form.querySelector('[name='+k+']');body[k]=i?i.checked:false});
 if(!body.consent_request){msg.textContent='Please tick the first box so we can save your request.';return;}
 btn.disabled=true;msg.textContent='Unlocking…';
 fetch(box.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()}).then(function(d){
  if(d&&d.html){try{localStorage.setItem(K,d.key)}catch(e){}show(d.html);}
  else{btn.disabled=false;msg.textContent=(d&&d.message)||'Could not unlock the list. Please try again.';}
 }).catch(function(){btn.disabled=false;msg.textContent='Could not unlock the list. Please try again.';});
});});})();
</script>
    <?php
}, 20);
