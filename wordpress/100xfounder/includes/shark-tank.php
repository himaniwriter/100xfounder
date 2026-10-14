<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shark Tank India on ordinary startup listings: a badge, an "at the pitch vs now" panel
 * and the extras from content/shark-tank/SCHEMA.md. The brand file (minus content, excerpt
 * and the internal notes) is stored as JSON in `_xf_shark_tank`, written only through the
 * authenticated route POST /xf/v1/shark-tank (content/upload-shark-tank.py).
 *
 * Nothing shows to visitors until the owner's go-live date (filter `xf_shark_tank_live`, or
 * define XF_SHARK_TANK_LIVE), and then only on published listings. Editors always see it.
 * Every figure is shown only with a source; otherwise the cell says "Not publicly disclosed".
 */

const XF_ST_NONE = 'Not publicly disclosed';

function xf_shark_tank_live() {
    $live = defined('XF_SHARK_TANK_LIVE') ? (bool) XF_SHARK_TANK_LIVE : time() >= strtotime('2026-11-01 00:00:00 Asia/Kolkata');
    return (bool) apply_filters('xf_shark_tank_live', $live);
}

/** The listing's Shark Tank data, or [] when there is none or the viewer may not see it yet. */
function xf_shark_tank($post_id) {
    $post_id = (int) $post_id;
    $raw = get_post_meta($post_id, '_xf_shark_tank', true);
    $st = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($st) || empty($st['shark_tank']['season'])) {
        return [];
    }
    $visible = current_user_can('edit_post', $post_id) || (xf_shark_tank_live() && get_post_status($post_id) === 'publish');
    return $visible ? $st : [];
}

/** Recursive sanitiser for the stored brand data. URL-ish keys keep only http(s) URLs. */
function xf_shark_tank_clean($v, $key = '') {
    if (is_array($v)) {
        $out = [];
        foreach ($v as $k => $x) {
            $out[is_int($k) ? $k : sanitize_key($k)] = xf_shark_tank_clean($x, (string) $k);
        }
        return $out;
    }
    if (is_bool($v) || is_int($v) || is_float($v) || $v === null) {
        return $v;
    }
    $v = (string) $v;
    $urlish = in_array($key, ['url', 'website', 'source', 'status_source'], true) || substr($key, -4) === '_url';
    if ($urlish && preg_match('#^https?://#i', $v)) {
        return esc_url_raw($v, ['http', 'https']);
    }
    return $urlish && $key !== 'source' && $key !== 'status_source' ? '' : sanitize_textarea_field($v);
}

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/shark-tank', [
        'methods' => 'POST',
        'permission_callback' => function (WP_REST_Request $r) {
            $id = (int) $r['id'];
            return $id && get_post_type($id) === 'xf_startup' && current_user_can('edit_post', $id);
        },
        'args' => ['id' => ['required' => true, 'type' => 'integer'], 'data' => ['required' => true, 'type' => 'object']],
        'callback' => function (WP_REST_Request $r) {
            $data = (array) $r['data'];
            if (empty($data['shark_tank']['season']) || !is_numeric($data['shark_tank']['season'])) {
                return new WP_Error('xf_bad_data', 'shark_tank.season is required.', ['status' => 400]);
            }
            unset($data['notes'], $data['content'], $data['excerpt']); // notes are internal; content/excerpt live on the post
            $json = wp_json_encode(xf_shark_tank_clean($data), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if (!$json || strlen($json) > 200000) {
                return new WP_Error('xf_bad_data', 'Data too large or not encodable.', ['status' => 400]);
            }
            update_post_meta((int) $r['id'], '_xf_shark_tank', wp_slash($json));
            return ['id' => (int) $r['id'], 'saved' => true];
        },
    ]);
});

/** ₹ in lakh/crore: 5000000 → "₹50 lakh", 15000000 → "₹1.5 crore". */
function xf_st_inr($n) {
    $n = (float) $n;
    $fmt = function ($x) { return rtrim(rtrim(number_format($x, 2, '.', ','), '0'), '.'); };
    if ($n >= 1e7) {
        return '₹' . $fmt($n / 1e7) . ' crore';
    }
    if ($n >= 1e5) {
        return '₹' . $fmt($n / 1e5) . ' lakh';
    }
    return '₹' . number_format($n);
}

/** A source as {label, url}, or null when it has no http(s) URL. Accepts a bare URL string. */
function xf_st_source($s) {
    if (is_string($s)) {
        $s = ['url' => $s];
    }
    $url = is_array($s) ? (string) ($s['url'] ?? '') : '';
    if (!preg_match('#^https?://#i', $url)) {
        return null;
    }
    $label = trim((string) ($s['label'] ?? ''));
    return ['label' => $label !== '' ? $label : (string) wp_parse_url($url, PHP_URL_HOST), 'url' => $url];
}

function xf_st_link(array $src, $text = null) {
    return '<a class="u" href="' . esc_url($src['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($text ?? $src['label']) . ' ↗</a>';
}

/** Pitch facts are covered by shark_tank.sources: the first one with a URL, or null. */
function xf_st_pitch_sources(array $st) {
    return array_values(array_filter(array_map('xf_st_source', (array) ($st['shark_tank']['sources'] ?? []))));
}

/** Official uploads only (Shark Tank India / Sony LIV / SET India), as xf_profile_video() data plus a title. */
function xf_shark_tank_video(array $st) {
    $pv = $st['pitch_video'] ?? [];
    $official = ['shark tank india', 'sony liv', 'sonyliv', 'set india'];
    if (!is_array($pv) || !in_array(strtolower(trim((string) ($pv['channel'] ?? ''))), $official, true)
        || !preg_match('/^[A-Za-z0-9_-]{11}$/', (string) ($pv['youtube_id'] ?? ''))) {
        return null;
    }
    $v = xf_profile_video('https://www.youtube.com/watch?v=' . $pv['youtube_id']);
    if ($v) {
        $v['title'] = (string) ($pv['title'] ?? '') ?: 'Shark Tank India pitch';
        $v['upload_date'] = (string) ($pv['upload_date'] ?? '');
    }
    return $v;
}

/** media.gallery in the shape the profile gallery markup expects. */
function xf_shark_tank_gallery(array $st) {
    $out = [];
    foreach ((array) ($st['media']['gallery'] ?? []) as $g) {
        if (is_array($g) && preg_match('#^https?://#i', (string) ($g['url'] ?? '')) && !empty($g['credit'])) {
            $out[] = ['url' => $g['url'], 'alt' => (string) ($g['alt'] ?? ''), 'credit' => (string) $g['credit']];
        }
    }
    return $out;
}

/** "Featured on Shark Tank India (Season N)" next to the title. */
function xf_shark_tank_title_badge(array $st) {
    return '<span class="ac">Featured on Shark Tank India (Season ' . (int) $st['shark_tank']['season'] . ')</span>';
}

/** Small badge for directory cards. */
function xf_shark_tank_badge($post_id) {
    $st = xf_shark_tank($post_id);
    return $st ? '<span class="xf-badge xf-badge--accent">Shark Tank India · S' . (int) $st['shark_tank']['season'] . '</span>' : '';
}

/** Annual figures only: FY labels or plain years, never monthly, run-rate or GMV. */
function xf_st_comparable_revenue(array $pitch, array $now) {
    $annual = '/^(?:FY\s?\'?\d{2}(?:\d{2})?(?:-\d{2})?|\d{4})$/i';
    $bad = '/month|mrr|arr|run.?rate|gmv/i';
    return preg_match($annual, trim((string) ($pitch['period'] ?? ''))) && preg_match($annual, trim((string) ($now['fiscal_year'] ?? '')))
        && !preg_match($bad, ($pitch['label'] ?? '') . ' ' . ($pitch['period'] ?? '') . ' ' . ($now['label'] ?? ''))
        && (float) ($pitch['value'] ?? 0) > 0 && (float) ($now['value'] ?? 0) > 0;
}

/** Rows of [label, value html] for the at-the-pitch vs now table. */
function xf_shark_tank_rows(array $st) {
    $s = $st['shark_tank'];
    $now = (array) ($st['now'] ?? []);
    $pitch_ok = (bool) xf_st_pitch_sources($st);
    $none = esc_html(XF_ST_NONE);
    $rows = [];

    $ask = $pitch_ok && isset($s['ask_amount'], $s['ask_equity']) ? esc_html(xf_st_inr($s['ask_amount']) . ' for ' . $s['ask_equity'] . '% equity') : $none;
    $rows[] = ['Ask', $ask];
    $val = $s['ask_valuation'] ?? (isset($s['ask_amount'], $s['ask_equity']) && (float) $s['ask_equity'] > 0 ? $s['ask_amount'] / $s['ask_equity'] * 100 : null);
    $rows[] = ['Valuation at the pitch', $pitch_ok && $val ? esc_html(xf_st_inr($val)) : $none];

    $d = (array) ($s['deal'] ?? []);
    if (!$pitch_ok || !isset($d['made'])) {
        $deal = $none;
    } elseif (!$d['made']) {
        $deal = 'No deal';
    } else {
        $deal = isset($d['amount'], $d['equity']) ? xf_st_inr($d['amount']) . ' for ' . $d['equity'] . '%' : 'Deal made';
        if (!empty($d['implied_valuation'])) $deal .= ' (valuation ' . xf_st_inr($d['implied_valuation']) . ')';
        if (!empty($d['sharks'])) $deal .= ' from ' . implode(', ', array_map('strval', (array) $d['sharks']));
        if (!empty($d['terms'])) $deal .= '. ' . $d['terms'];
        $deal = esc_html($deal);
    }
    $rows[] = ['Deal on the show', $deal];

    $pr = (array) ($s['pitch_revenue'] ?? []);
    $rows[] = ['Revenue at the pitch', $pitch_ok && !empty($pr['value']) ? esc_html(xf_st_inr($pr['value']) . ' (' . trim(($pr['label'] ?? 'Revenue') . ', ' . ($pr['period'] ?? ''), ', ') . ')') : $none];

    $dated = function ($o, $text) use ($none) {
        $src = is_array($o) ? xf_st_source($o['source'] ?? null) : null;
        if (!$src || $text === '') return $none;
        $date = (string) ($o['date'] ?? '');
        return esc_html($text) . ' <span class="k sp-st-src">' . xf_st_link($src) . ($date !== '' ? ' · ' . esc_html($date) : '') . '</span>';
    };
    $lr = (array) ($now['latest_revenue'] ?? []);
    $rows[] = ['Latest revenue', $dated($lr, !empty($lr['value']) ? xf_st_inr($lr['value']) . ' (' . trim(($lr['label'] ?? 'Revenue') . ', ' . ($lr['fiscal_year'] ?? ''), ', ') . ')' : '')];
    if ($pitch_ok && xf_st_source($lr['source'] ?? null) && xf_st_comparable_revenue($pr, $lr)) {
        $rows[] = ['Revenue growth since the pitch', esc_html(number_format($lr['value'] / $pr['value'], 1) . '× (' . ($pr['period'] ?? '') . ' to ' . ($lr['fiscal_year'] ?? '') . ')')];
    }
    $lf = (array) ($now['latest_funding'] ?? []);
    $rows[] = ['Latest funding', $dated($lf, !empty($lf['amount']) ? trim(($lf['round'] ?? '') . ' ' . xf_st_inr($lf['amount'])) : '')];
    $lv = (array) ($now['latest_valuation'] ?? []);
    $rows[] = ['Valuation now', $dated($lv, !empty($lv['value']) ? xf_st_inr($lv['value']) : '')];

    $status = strtolower((string) ($now['status'] ?? ''));
    $ss = xf_st_source($now['status_source'] ?? null);
    $rows[] = ['Status now', $ss && in_array($status, ['operating', 'acquired', 'shut down'], true)
        ? esc_html(ucfirst($status)) . ' <span class="k sp-st-src">' . xf_st_link($ss) . '</span>' : $none];
    return $rows;
}

/** Every source on the panel, de-duplicated by URL. */
function xf_shark_tank_sources(array $st) {
    $now = (array) ($st['now'] ?? []);
    $all = xf_st_pitch_sources($st);
    $all[] = xf_st_source($now['status_source'] ?? null);
    foreach (['latest_revenue', 'latest_funding', 'latest_valuation'] as $k) $all[] = xf_st_source($now[$k]['source'] ?? null);
    foreach ((array) ($now['notable_since_show'] ?? []) as $e) $all[] = xf_st_source($e['source'] ?? null);
    $all[] = xf_st_source($st['deal_closed']['source'] ?? null);
    foreach ((array) ($st['shark_quotes'] ?? []) as $q) $all[] = xf_st_source($q['source'] ?? null);
    $out = [];
    foreach (array_filter($all) as $s) $out[$s['url']] = $s;
    return array_values($out);
}

/** The whole Shark Tank section for single-xf_startup.php. All output escaped here. */
function xf_shark_tank_panel_html($post_id, array $st) {
    $s = $st['shark_tank'];
    $name = get_the_title($post_id);
    $pitch_src = xf_st_pitch_sources($st);
    $when = trim((!empty($s['episode']) ? 'Episode ' . (int) $s['episode'] : '') . (!empty($s['air_date']) ? ', aired ' . $s['air_date'] : ''), ', ');
    ob_start();
    ?>
    <section class="sp-st" aria-labelledby="shark-tank">
        <h2 id="shark-tank">Shark Tank India: at the pitch vs now</h2>
        <p class="k" style="margin:0">Season <?php echo (int) $s['season']; ?><?php echo $when ? ' · ' . esc_html($when) : ''; ?><?php echo !empty($s['city']) ? ' · ' . esc_html($s['city']) : ''; ?><?php echo !empty($s['category']) ? ' · ' . esc_html($s['category']) : ''; ?></p>
        <?php if (!empty($s['pitch_summary'])) : ?><p><?php echo esc_html($s['pitch_summary']); ?></p><?php endif; ?>
        <?php if (!empty($s['founders']) && $pitch_src) : ?><p class="sp-note">Founders: <?php echo esc_html(implode(', ', array_map('strval', (array) $s['founders']))); ?></p><?php endif; ?>

        <div class="xf-tablewrap" tabindex="0" role="group" aria-label="<?php echo esc_attr($name . ' on Shark Tank India, scrollable sideways'); ?>">
            <table class="xf-dt" style="--cols:2"><tbody>
                <?php foreach (xf_shark_tank_rows($st) as $row) : ?>
                    <tr><th scope="row"><?php echo esc_html($row[0]); ?></th><td><?php echo $row[1]; // phpcs:ignore -- escaped in xf_shark_tank_rows ?></td></tr>
                <?php endforeach; ?>
            </tbody></table>
        </div>
        <p class="k sp-src">Pitch figures: <?php echo $pitch_src ? implode(' · ', array_map('xf_st_link', $pitch_src)) : esc_html(XF_ST_NONE); // phpcs:ignore ?><?php echo !empty($st['now']['checked_date']) ? ' · Now figures checked ' . esc_html($st['now']['checked_date']) : ''; ?></p>

        <?php $dc = (array) ($st['deal_closed'] ?? []); if ($dc || !empty($s['deal']['made'])) :
            $dc_src = xf_st_source($dc['source'] ?? null);
            $dc_ok = $dc_src && in_array($dc['status'] ?? '', ['closed', 'not closed', 'partly closed'], true); ?>
            <div class="sp-card sp-st-callout">
                <div class="k ac">Did the deal close?</div>
                <p style="margin:8px 0 0"><strong><?php echo esc_html($dc_ok ? ucfirst($dc['status']) : XF_ST_NONE); ?></strong><?php echo $dc_ok && !empty($dc['detail']) ? '. ' . esc_html($dc['detail']) : ''; ?></p>
                <?php if ($dc_ok) : ?><p class="k sp-src"><?php echo xf_st_link($dc_src); // phpcs:ignore ?></p><?php endif; ?>
            </div>
        <?php endif; ?>

        <?php $since = array_filter((array) ($st['now']['notable_since_show'] ?? []), function ($e) { return is_array($e) && xf_st_source($e['source'] ?? null) && ($e['event'] ?? $e['text'] ?? '') !== ''; });
        if ($since) : ?>
            <h3>Since the show</h3>
            <ul class="sp-links"><?php foreach ($since as $e) : ?>
                <li><?php echo !empty($e['date']) ? '<span class="k">' . esc_html($e['date']) . '</span> ' : ''; ?><?php echo esc_html($e['event'] ?? $e['text']); ?> <span class="k sp-st-src"><?php echo xf_st_link(xf_st_source($e['source'])); // phpcs:ignore ?></span></li>
            <?php endforeach; ?></ul>
        <?php endif; ?>

        <?php $watch = [];
        $v = xf_shark_tank_video($st);
        if ($v) $watch[] = xf_st_link(['url' => $v['watch']], 'The pitch on ' . $st['pitch_video']['channel'] . '’s YouTube channel');
        if (preg_match('#^https://(www\.)?sonyliv\.com/#i', (string) ($st['sonyliv_url'] ?? ''))) $watch[] = xf_st_link(['url' => $st['sonyliv_url']], 'Watch on Sony LIV');
        if ($watch) : ?><p class="k sp-src"><?php echo implode(' · ', $watch); // phpcs:ignore -- escaped in xf_st_link ?></p><?php endif; ?>

        <?php $quotes = array_filter((array) ($st['shark_quotes'] ?? []), function ($q) { return is_array($q) && !empty($q['quote']) && xf_st_source($q['source'] ?? null); });
        if ($quotes) : ?>
            <h3>What the Sharks said</h3>
            <?php foreach ($quotes as $q) : ?>
                <blockquote class="sp-quote"><p><?php echo esc_html($q['quote']); ?></p>
                    <footer class="k"><?php echo esc_html($q['shark'] ?? ''); ?> · <?php echo xf_st_link(xf_st_source($q['source'])); // phpcs:ignore ?></footer></blockquote>
            <?php endforeach; ?>
        <?php endif; ?>

        <?php $buy = array_filter((array) ($st['where_to_buy'] ?? []), function ($b) { return is_array($b) && preg_match('#^https?://#i', (string) ($b['url'] ?? '')); });
        $prices = array_filter((array) ($st['prices'] ?? []), function ($p) { return is_array($p) && isset($p['price'], $p['date']) && preg_match('#^https?://#i', (string) ($p['source_url'] ?? '')); });
        if ($buy || $prices) : ?>
            <h3>Where to buy</h3>
            <?php if ($buy) : ?><ul class="sp-links"><?php foreach ($buy as $b) : ?>
                <li><a class="u" href="<?php echo esc_url($b['url']); ?>" target="_blank" rel="nofollow noopener"><?php echo esc_html($b['label'] ?? wp_parse_url($b['url'], PHP_URL_HOST)); ?> ↗</a></li>
            <?php endforeach; ?></ul><?php endif; ?>
            <?php if ($prices) : ?><ul class="sp-links"><?php foreach ($prices as $p) :
                $amt = strtoupper($p['currency'] ?? 'INR') === 'INR' ? '₹' . number_format((float) $p['price']) : strtoupper($p['currency']) . ' ' . number_format((float) $p['price'], 2); ?>
                <li><?php echo esc_html(($p['product'] ?? '') . ': ' . $amt); ?> <span class="k sp-st-src"><a class="u" href="<?php echo esc_url($p['source_url']); ?>" target="_blank" rel="nofollow noopener">price on <?php echo esc_html($p['date']); ?> ↗</a></span></li>
            <?php endforeach; ?></ul><p class="sp-note">Prices change, so confirm before you buy.</p><?php endif; ?>
        <?php endif; ?>

        <?php $faq = array_filter((array) ($st['faq'] ?? []), function ($f) { return is_array($f) && !empty($f['q']) && !empty($f['a']); });
        if ($faq) : ?>
            <h3><?php echo esc_html($name); ?> on Shark Tank: questions</h3>
            <div class="sp-faq"><?php foreach ($faq as $f) : ?>
                <details><summary><?php echo esc_html($f['q']); ?></summary><p><?php echo esc_html($f['a']); ?></p></details>
            <?php endforeach; ?></div>
        <?php endif; ?>

        <?php $lessons = array_filter(array_map('strval', (array) ($st['lessons'] ?? []))); if ($lessons) : ?>
            <h3>Lessons for founders</h3>
            <p class="k ac" style="margin:0">Our analysis</p>
            <ul class="sp-uses"><?php foreach ($lessons as $l) echo '<li>' . esc_html($l) . '</li>'; ?></ul>
        <?php endif; ?>

        <?php $related = [];
        foreach (array_slice((array) ($st['related_pitches'] ?? []), 0, 8) as $slug) {
            $rp = get_page_by_path(sanitize_title((string) $slug), OBJECT, 'xf_startup');
            if ($rp && $rp->post_status === 'publish' && $rp->ID !== (int) $post_id) $related[] = $rp;
        }
        if ($related) : ?>
            <h3>Related pitches</h3>
            <ul class="sp-links"><?php foreach ($related as $rp) : ?><li><a class="u" href="<?php echo esc_url(get_permalink($rp)); ?>"><?php echo esc_html(get_the_title($rp)); ?></a></li><?php endforeach; ?></ul>
        <?php endif; ?>

        <?php $srcs = xf_shark_tank_sources($st); if ($srcs) : ?>
            <p class="k sp-sources">Shark Tank sources: <?php echo implode(' · ', array_map(function ($x) { return '<a class="u" href="' . esc_url($x['url']) . '" target="_blank" rel="nofollow noopener">' . esc_html($x['label']) . '</a>'; }, $srcs)); // phpcs:ignore ?></p>
        <?php endif; ?>
    </section>
    <?php
    return ob_get_clean();
}

/** VideoObject for the official pitch video, only when the page shows it (no profile video) and its upload date is known. */
add_action('wp_head', function () {
    if (!is_singular('xf_startup') || !function_exists('xf_json_ld')) {
        return;
    }
    $id = get_queried_object_id();
    $st = xf_shark_tank($id);
    $v = $st ? xf_shark_tank_video($st) : null;
    if (!$v || $v['upload_date'] === '' || xf_profile_video(xf_startup_profile($id)['video_url'] ?? '')) {
        return;
    }
    xf_json_ld([
        '@context' => 'https://schema.org',
        '@type' => 'VideoObject',
        'name' => xf_schema_text($v['title']),
        'description' => xf_schema_text(get_the_title($id) . ' pitches on Shark Tank India, Season ' . (int) $st['shark_tank']['season'] . '.'),
        'thumbnailUrl' => $v['thumb'],
        'uploadDate' => $v['upload_date'],
        'embedUrl' => strtok($v['embed'], '?'),
        'url' => $v['watch'],
    ]);
}, 7);
