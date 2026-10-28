<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * The founders-community signup popup.
 *
 * Collects an email (required) and a WhatsApp number (optional, for the
 * community invite), each with its own consent box. Nothing is pre-ticked, and
 * the exact wording the person agreed to is stored with the record, so there is
 * proof of consent under India's DPDP Act and the GDPR.
 *
 * Where the data goes:
 *  - the email joins the newsletter list (Subscribers) so it can be emailed later;
 *  - one lead record (Leads) holds email, number, page, time and consent wording;
 *  - people are never told whether an email was already on the list.
 *
 * How it appears (kept clear of Google's rules on intrusive pop-ups): never in
 * the first seconds, only after the reader has scrolled and stayed a while, or
 * when a desktop visitor moves to leave; once dismissed it stays away for 14
 * days; never on forms or legal pages; a "Join the founders community" link in
 * the footer opens it on demand.
 */

function xf_join_consent_email() {
    return 'I agree that 100xFounder may email me startup news, funding rounds, launches and events. I can unsubscribe at any time.';
}

function xf_join_consent_phone() {
    return 'I agree that 100xFounder may contact me on WhatsApp or by phone about the founders community. I can ask it to stop at any time.';
}

/** The community invite link set in 100xFounder → Settings; '' until the community is open. */
function xf_join_url() {
    $u = trim((string) xf_get_setting('founders_community_url'));
    return preg_match('#^https://#i', $u) ? esc_url_raw($u) : '';
}

/** +919876543210 from "98765 43210", "+91 98765-43210" or "09876543210"; '' when it is not a plausible number. */
function xf_normalize_phone($raw) {
    $compact = preg_replace('/[^\d+]/', '', (string) $raw);
    if (preg_match('/^\+(\d{8,15})$/', $compact, $m)) {
        return '+' . $m[1];
    }
    $digits = preg_replace('/\D/', '', $compact);
    if (preg_match('/^(?:91|0)?([6-9]\d{9})$/', $digits, $m)) {
        return '+91' . $m[1];
    }
    return '';
}

/* ---- Where the popup may appear ---- */

function xf_popup_enabled() {
    if (!xf_get_setting('popup_enabled') || is_admin() || is_404() || is_search() || is_feed() || is_preview() || is_customize_preview()) {
        return false;
    }
    // People who run the site don't need it, but can preview it with ?xf_popup=1.
    if (is_user_logged_in() && empty($_GET['xf_popup'])) { // phpcs:ignore WordPress.Security.NonceVerification
        return false;
    }
    $pages = get_option('xf_pages', []);
    foreach (['privacy', 'terms', 'contact', 'submit', 'launch', 'unsubscribe', 'feature', 'disclaimer', 'corrections'] as $key) {
        if (!empty($pages[$key]) && is_page($pages[$key])) {
            return false;
        }
    }
    $privacy = (int) get_option('wp_page_for_privacy_policy');
    return !($privacy && is_page($privacy));
}

/* ---- Signed token: the server showed this popup a few seconds ago ---- */

function xf_join_token() {
    $ts = time();
    return $ts . '.' . hash_hmac('sha256', 'join|' . $ts, wp_salt('auth'));
}

function xf_join_token_ok($token) {
    [$ts, $mac] = array_pad(explode('.', (string) $token, 2), 2, '');
    if (!ctype_digit($ts) || !hash_equals(hash_hmac('sha256', 'join|' . $ts, wp_salt('auth')), $mac)) {
        return false;
    }
    $age = time() - (int) $ts;
    return $age >= 3 && $age <= 14 * DAY_IN_SECONDS; // cached pages carry older tokens
}

/* ---- The signup ---- */

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/join', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'xf_handle_join',
    ]);
});

function xf_handle_join(WP_REST_Request $r) {
    global $wpdb;
    if ((string) $r->get_param('website') !== '') {
        return ['success' => true]; // a bot filled the hidden field: pretend it worked
    }
    if (!xf_join_token_ok($r->get_param('token'))) {
        return new WP_Error('bad_token', 'Please reload the page and try again.', ['status' => 400]);
    }
    if (function_exists('xf_rate_limited') && xf_rate_limited('join', 6, HOUR_IN_SECONDS)) {
        return new WP_Error('rate_limited', 'Too many attempts from your connection. Please try again later.', ['status' => 429]);
    }
    $email = strtolower(sanitize_email((string) $r->get_param('email')));
    if (!is_email($email)) {
        return new WP_Error('bad_email', 'Please enter a valid email address.', ['status' => 400]);
    }
    if (!$r->get_param('consent_email')) {
        return new WP_Error('no_consent', 'Please tick the box to receive emails from us.', ['status' => 400]);
    }
    $phone = '';
    $phone_raw = trim((string) $r->get_param('phone'));
    if ($phone_raw !== '') {
        $phone = xf_normalize_phone($phone_raw);
        if (!$phone) {
            return new WP_Error('bad_phone', 'That number does not look right. Include the country code, for example +91 98765 43210.', ['status' => 400]);
        }
        if (!$r->get_param('consent_phone')) {
            return new WP_Error('no_phone_consent', 'Please tick the second box to let us contact you on that number, or clear the number.', ['status' => 400]);
        }
    }
    $page = esc_url_raw((string) $r->get_param('page'));
    if (!$page || wp_parse_url($page, PHP_URL_HOST) !== wp_parse_url(home_url(), PHP_URL_HOST)) {
        $page = home_url('/');
    }
    $now = current_time('mysql');

    // 1. The email list, so it can be emailed later.
    $wpdb->query($wpdb->prepare(
        'INSERT IGNORE INTO ' . xf_table('subscribers') . ' (email, source, status, created_at) VALUES (%s, %s, %s, %s)',
        $email, 'popup', 'active', xf_now()
    ));

    // 2. One lead record per email, holding the proof of consent.
    $existing = get_posts([
        'post_type' => 'xf_lead', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
        'meta_query' => [['key' => '_xf_lead_email', 'value' => $email], ['key' => '_xf_lead_niche', 'value' => 'founders-community']],
    ]);
    if ($existing) {
        if ($phone) {
            update_post_meta($existing[0], '_xf_lead_phone', $phone);
            update_post_meta($existing[0], '_xf_lead_consent_phone', $now);
            update_post_meta($existing[0], '_xf_lead_consent_phone_text', xf_join_consent_phone());
        }
    } else {
        wp_insert_post([
            'post_type' => 'xf_lead',
            'post_status' => 'private',
            'post_title' => $email . ' — founders community',
            'post_content' => 'Joined from the signup popup on ' . $page . '.',
            'meta_input' => array_filter([
                '_xf_lead_email' => $email,
                '_xf_lead_phone' => $phone ?: null,
                '_xf_lead_niche' => 'founders-community',
                '_xf_lead_sub' => 'popup',
                '_xf_lead_source' => $page,
                '_xf_lead_consent' => $now,
                '_xf_lead_consent_text' => xf_join_consent_email(),
                '_xf_lead_consent_phone' => $phone ? $now : null,
                '_xf_lead_consent_phone_text' => $phone ? xf_join_consent_phone() : null,
            ]),
        ]);
    }

    $join = xf_join_url();
    return [
        'success' => true,
        'phone' => (bool) $phone,
        'join_url' => $phone && $join ? $join : '',
    ];
}

/* ---- The popup itself ---- */

function xf_popup_html() {
    $open = xf_join_url() !== '';
    $title = $open ? 'Join the 100xFounder founders community' : 'Get early access to the founders community';
    $lead = $open
        ? 'Startup news, funding rounds, launches and events by email, and an invite to the founders community on WhatsApp.'
        : 'We are opening a WhatsApp community for founders. Leave your email and WhatsApp number and we will send your invite, plus startup news by email.';
    $privacy = function_exists('xft_page_url') ? xft_page_url('privacy', 'privacy-policy') : home_url('/privacy-policy/');
    $page = function_exists('xf_rating_page_url') ? (xf_rating_page_url() ?: home_url('/')) : home_url('/');

    ob_start();
    ?>
    <div id="xf-pop" class="xf-pop" hidden data-endpoint="<?php echo esc_url(rest_url('xf/v1/join')); ?>" data-token="<?php echo esc_attr(xf_join_token()); ?>" data-page="<?php echo esc_url($page); ?>">
        <div class="xf-pop__backdrop" data-xf-pop-close></div>
        <div class="xf-pop__card" role="dialog" aria-modal="true" aria-labelledby="xf-pop-t" aria-describedby="xf-pop-d" data-lenis-prevent>
            <button type="button" class="xf-pop__x" data-xf-pop-close aria-label="Close">&times;</button>
            <div class="xf-pop__form">
                <p class="k ac">Founders community</p>
                <h2 id="xf-pop-t"><?php echo esc_html($title); ?></h2>
                <p id="xf-pop-d" class="xf-pop__lead"><?php echo esc_html($lead); ?></p>
                <form novalidate>
                    <label for="xf-pop-email">Email</label>
                    <input id="xf-pop-email" type="email" name="email" autocomplete="email" placeholder="you@startup.com" required>
                    <label for="xf-pop-phone">WhatsApp number <span class="xf-pop__opt">for your community invite (optional)</span></label>
                    <input id="xf-pop-phone" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+91 98765 43210">
                    <label class="xf-pop__check"><input type="checkbox" name="consent_email" value="1" required> <span><?php echo esc_html(xf_join_consent_email()); ?></span></label>
                    <label class="xf-pop__check xf-pop__check--phone" hidden><input type="checkbox" name="consent_phone" value="1"> <span><?php echo esc_html(xf_join_consent_phone()); ?></span></label>
                    <input type="text" name="website" tabindex="-1" autocomplete="off" class="xf-hp" aria-hidden="true">
                    <button type="submit" class="btn btn-w xf-pop__go"><?php echo $open ? 'Join free' : 'Get my invite'; ?></button>
                    <p class="xf-pop__msg" role="alert" aria-live="assertive"></p>
                    <p class="xf-pop__fine">We use your details as described in our <a href="<?php echo esc_url($privacy); ?>">privacy policy</a>. No spam, and you can leave at any time.</p>
                </form>
            </div>
            <div class="xf-pop__done" hidden>
                <p class="k ac">You're in</p>
                <h2 class="xf-pop__done-t">Thanks, you're on the list.</h2>
                <p class="xf-pop__done-d"></p>
                <a class="btn btn-w xf-pop__join" href="#" target="_blank" rel="noopener" hidden>Open the community ↗</a>
                <button type="button" class="btn" data-xf-pop-close>Close</button>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

add_action('wp_footer', function () {
    if (!xf_popup_enabled()) {
        return;
    }
    echo xf_popup_html(); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped above
    ?>
<script>
(function(){
var pop=document.getElementById('xf-pop');if(!pop)return;
var card=pop.querySelector('.xf-pop__card'),form=pop.querySelector('form'),msg=pop.querySelector('.xf-pop__msg');
var phone=form.phone,cp=form.querySelector('.xf-pop__check--phone'),KEY='xfpop',st={},isOpen=false,last=null,t0=Date.now(),maxScroll=0;
try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
var force=/[?&]xf_popup=1/.test(location.search);
function allowed(){return force||(!st.done&&!(st.dismissed&&Date.now()-st.dismissed<14*864e5));}
function focusables(){return [].slice.call(card.querySelectorAll('a[href],button,input:not([type=hidden]):not(.xf-hp),textarea,select')).filter(function(e){return !e.closest('[hidden]')&&e.offsetParent!==null});}
function open(){
 if(isOpen)return;isOpen=true;last=document.activeElement;pop.hidden=false;document.documentElement.classList.add('xf-pop-open');
 if(window.xfLenis&&xfLenis.stop)xfLenis.stop();
 setTimeout(function(){var f=card.querySelector('.xf-pop__form:not([hidden]) input');if(f)f.focus()},60);
}
function close(dismissed){
 if(!isOpen)return;isOpen=false;pop.hidden=true;document.documentElement.classList.remove('xf-pop-open');
 if(window.xfLenis&&xfLenis.start)xfLenis.start();
 if(dismissed&&!st.done){st.dismissed=Date.now();save();}
 if(last&&last.focus)last.focus();
}
pop.addEventListener('click',function(e){if(e.target.closest('[data-xf-pop-close]'))close(true)});
document.addEventListener('keydown',function(e){
 if(!isOpen)return;
 if(e.key==='Escape'){close(true);return}
 if(e.key==='Tab'){var f=focusables();if(!f.length)return;var a=f[0],z=f[f.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
});
// On-demand openers: the footer link and any link or button marked data-xf-join.
document.addEventListener('click',function(e){var o=e.target.closest('[data-xf-join]');if(o&&!st.done){e.preventDefault();open()}else if(o&&st.done){e.preventDefault()}});
// The second consent box appears only when a number is typed.
function syncPhone(){var has=phone.value.trim()!=='';cp.hidden=!has;if(!has)cp.querySelector('input').checked=false;}
phone.addEventListener('input',syncPhone);
form.addEventListener('submit',function(e){
 e.preventDefault();msg.textContent='';
 var btn=form.querySelector('.xf-pop__go');btn.disabled=true;
 var body={email:form.email.value,phone:form.phone.value,consent_email:form.consent_email.checked?1:0,consent_phone:cp.querySelector('input').checked?1:0,website:form.website.value,token:pop.dataset.token,page:pop.dataset.page};
 fetch(pop.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  .then(function(r){return r.json()}).then(function(d){
   btn.disabled=false;
   if(d&&d.success){
    st.done=true;save();
    pop.querySelector('.xf-pop__form').hidden=true;var done=pop.querySelector('.xf-pop__done');done.hidden=false;
    var dd=pop.querySelector('.xf-pop__done-d'),j=pop.querySelector('.xf-pop__join');
    if(d.join_url){dd.textContent='Your invite is below. Welcome to the community.';j.href=d.join_url;j.hidden=false;}
    else if(d.phone){dd.textContent='We will send your community invite on WhatsApp as soon as it opens, and keep you posted by email.';}
    else{dd.textContent='We will email you startup news and updates. Want the community invite too? Reopen this from the footer and add your WhatsApp number.';}
    var b=done.querySelector('a,button');if(b)b.focus();
   }else{msg.textContent=(d&&d.message)||'Something went wrong. Please try again.';}
  }).catch(function(){btn.disabled=false;msg.textContent='Could not reach the server. Please try again.'});
});
// Automatic opening: only after real engagement, once per visit, never while typing elsewhere.
if(!allowed())return;
var shown=false;
function tryAuto(kind){
 if(shown||isOpen||!allowed())return;
 try{if(sessionStorage.getItem('xfpop_seen'))return}catch(e){}
 var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return;
 shown=true;try{sessionStorage.setItem('xfpop_seen','1')}catch(e){}open();
}
addEventListener('scroll',function(){var h=document.documentElement.scrollHeight-innerHeight;if(h>0)maxScroll=Math.max(maxScroll,scrollY/h)},{passive:true});
function depth(){var h=document.documentElement.scrollHeight-innerHeight;if(h>0)maxScroll=Math.max(maxScroll,scrollY/h)}
setInterval(function(){depth();if(Date.now()-t0>25000&&maxScroll>0.5)tryAuto('engaged')},2000);
if(matchMedia('(hover:hover) and (pointer:fine)').matches){
 document.addEventListener('mouseout',function(e){if(!e.relatedTarget&&e.clientY<=0&&Date.now()-t0>15000)tryAuto('exit')});
}
if(force)open();
})();
</script>
    <?php
}, 8);

/* ---- What the Privacy Policy says about it (appended to the page, so wording never drifts from the code) ---- */

function xf_join_privacy_html() {
    $contact = function_exists('xft_page_url') ? xft_page_url('contact', 'contact') : home_url('/contact/');
    ob_start();
    ?>
    <h2 id="xf-join-privacy">Newsletter and founders community sign-ups</h2>
    <p>When you join through our signup form or popup we collect your <strong>email address</strong>, your <strong>WhatsApp or phone number if you choose to give one</strong>, the page you signed up on, the date and time, and the exact wording of the consent you ticked.</p>
    <ul>
        <li><strong>Why:</strong> to email you the startup news, funding rounds, launches and events you asked for, and, if you gave a number, to contact you about the founders community. We do not use these details for anything else.</li>
        <li><strong>Who sees it:</strong> our editorial team. Emails are sent through our email host, Hostinger. If you join the community on WhatsApp, WhatsApp's own privacy policy applies to that chat. We do not sell your details.</li>
        <li><strong>How long:</strong> until you unsubscribe or ask us to delete them. We may keep a record that you consented, and when, as proof.</li>
        <li><strong>Your choices:</strong> every email carries an unsubscribe link. You can withdraw consent, or ask to see, correct or delete your details (your rights under India's Digital Personal Data Protection Act and, where it applies, the GDPR), at any time through our <a href="<?php echo esc_url($contact); ?>">contact page</a>.</li>
    </ul>
    <?php
    return ob_get_clean();
}

add_filter('the_content', function ($content) {
    $pid = (int) get_option('wp_page_for_privacy_policy');
    if (!$pid || !is_page($pid) || !in_the_loop() || !is_main_query() || strpos($content, 'xf-join-privacy') !== false) {
        return $content;
    }
    return $content . xf_join_privacy_html();
}, 30);

/* ---- Leads: CSV download, so signups can be used for email and WhatsApp follow-up ---- */

add_filter('views_edit-xf_lead', function ($views) {
    if (current_user_can('manage_options')) {
        $views['xf_export'] = '<a href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=xf_export_leads'), 'xf_export_leads')) . '"><strong>Download all leads (CSV)</strong></a>';
    }
    return $views;
});

add_action('admin_post_xf_export_leads', function () {
    if (!current_user_can('manage_options') || !check_admin_referer('xf_export_leads')) {
        wp_die('Not allowed', '', ['response' => 403]);
    }
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="100xfounder-leads.csv"');
    $out = fopen('php://output', 'w');
    $cols = ['date' => null, 'kind' => '_xf_lead_niche', 'detail' => '_xf_lead_sub', 'name' => '_xf_lead_name', 'email' => '_xf_lead_email', 'phone' => '_xf_lead_phone',
             'company' => '_xf_lead_company', 'city' => '_xf_lead_city', 'page' => '_xf_lead_source', 'email_consent_at' => '_xf_lead_consent',
             'email_consent_text' => '_xf_lead_consent_text', 'phone_consent_at' => '_xf_lead_consent_phone', 'phone_consent_text' => '_xf_lead_consent_phone_text'];
    fputcsv($out, array_keys($cols));
    foreach (get_posts(['post_type' => 'xf_lead', 'post_status' => 'any', 'posts_per_page' => -1, 'orderby' => 'date', 'order' => 'DESC']) as $p) {
        $row = [];
        foreach ($cols as $label => $key) {
            $v = $key ? (string) get_post_meta($p->ID, $key, true) : get_the_date('Y-m-d H:i', $p);
            // A leading = + - @ in a spreadsheet can run as a formula; neutralise it (a phone's + is kept).
            $row[] = ($label !== 'phone' && preg_match('/^[=+\-@]/', $v)) ? "'" . $v : $v;
        }
        fputcsv($out, $row);
    }
    exit;
});
