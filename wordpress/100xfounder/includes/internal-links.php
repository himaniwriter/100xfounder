<?php
/**
 * Internal linking, done at render time (post content in the database is never edited):
 *
 *  - the first mention of a listed startup in an article or guide links to its /startup/ page
 *    (max XF_AUTOLINK_MAX per article, never inside links, headings or code);
 *  - startup pages list the articles that mention them and their industry neighbours;
 *  - two topic hubs (funding, AI tools) collect their articles, and each article links back.
 *
 * Every lookup is cached: the name map and the mention index live in transients that are
 * dropped whenever a startup, article or guide is saved, and rebuilt on the next view.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_AUTOLINK_MAX = 5;
const XF_AUTOLINK_MIN_LEN = 4;

/*
 * Listing names that are everyday words or first names: a capitalised "Shift" or "Albert" in an
 * article is rarely that company. Brand-first names (Stripe, Notion, Zoom...) stay linkable.
 */
const XF_AUTOLINK_AMBIGUOUS = 'abridge accolade affirm albert alchemy allium alloy ambience amino anchorage aperture apex apollo armory atmos attentive aura autograph basis behalf belong bird blameless blend blossom blues bolt bounce branch bulletin bunch bungalow cadre calibrate camber cameo candid capital carbon castle catch causal cedar census chief chunk circle claim clerk clio clockwise close coast coco coda coder codex cognition coiled color compass contact cortex courier cover creator current deed density deserve ditto dover earthly eden empower emulate envoy extrovert fabric faraway feather folk fond forage forward fountain future gadget goat gobble golden goodly graphite handshake harmonic harvey helium helix here homebound honor hooked imply improbable island jerry jetty juno karma kernel landed lattice lessen level lime loft loyal lula lune lydia medal medallion medium medley merit metronome mira monad motherly mutiny namely narrator olio ophelia origin overtime papaya paragon passport patch pave persona phantom pixie plaid playbook plum podium porch prefect prepared primer prodigal promise quince radiant remote review ripcord ritual royal rune scape searchlight shepherd shift shipper silk silo simplified skiff skylark sleeper socket sorted sound spate speak splash sprig squint squire stacker stainless station subject sundae superhuman supernova syndicate tackle teller tempo terminal thatch thematic thesis titan toast toby together toss unbound unit universe upstart wander watershed whatnot whimsical startup startups software platform company review news';

/* ------------------------------------------------------------------ Startup name map */

/**
 * [name => ['id' => int, 'url' => string]] for every published, indexable startup that can be
 * linked safely. Thin listings are noindexed (post-types.php), so articles don't link to them.
 */
function xf_startup_link_map() {
    $map = get_transient('xf_startup_links');
    if (is_array($map)) {
        return $map;
    }
    global $wpdb;
    $rows = $wpdb->get_results("SELECT p.ID, p.post_title, p.post_name, p.post_type, p.post_status, p.post_date, p.post_date_gmt, p.post_parent FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} i ON i.post_id = p.ID AND i.meta_key = '_xf_indexable' AND i.meta_value = '1'
        WHERE p.post_type = 'xf_startup' AND p.post_status = 'publish'");
    $ambiguous = array_flip(explode(' ', XF_AUTOLINK_AMBIGUOUS));
    $seen = [];
    foreach ($rows as $r) {
        $name = trim(html_entity_decode($r->post_title, ENT_QUOTES, 'UTF-8'));
        $seen[$name] = isset($seen[$name]) ? false : $r; // two listings with one name: link neither
    }
    $map = [];
    foreach ($seen as $name => $r) {
        if (!$r || mb_strlen($name) < XF_AUTOLINK_MIN_LEN || isset($ambiguous[mb_strtolower($name)])
            || preg_match('/[&<>"\'’]/u', $name) || !preg_match('/\p{L}/u', $name)) {
            continue;
        }
        $map[(string) $name] = ['id' => (int) $r->ID, 'url' => get_permalink(new WP_Post($r))];
    }
    set_transient('xf_startup_links', $map, DAY_IN_SECONDS); // with an expiry, so it is not autoloaded
    return $map;
}

/** Names from $map that appear in $text as whole words (case-sensitive). */
function xf_startup_names_in($text, array $map) {
    $found = [];
    foreach ($map as $name => $_) {
        $name = (string) $name;
        if (strpos($text, $name) !== false && preg_match('/(?<![\p{L}\p{N}_])' . preg_quote($name, '/') . '(?![\p{L}\p{N}_])/u', $text)) {
            $found[] = $name;
        }
    }
    return $found;
}

/** Drop the caches built from startups and articles. */
function xf_internal_links_flush() {
    delete_transient('xf_startup_links');
    delete_transient('xf_startup_mentions');
    delete_transient('xf_hub_index');
    update_option('xf_industry_ver', (int) get_option('xf_industry_ver') + 1, false);
}

add_action('transition_post_status', function ($new, $old, $post) {
    if (($new === 'publish' || $old === 'publish') && in_array($post->post_type, ['xf_startup', 'post', 'xf_guide'], true)) {
        xf_internal_links_flush();
    }
}, 10, 3);
add_action('post_updated', function ($id, $after, $before) {
    if ($after->post_status === 'publish' && in_array($after->post_type, ['xf_startup', 'post', 'xf_guide'], true)
        && ($after->post_title !== $before->post_title || $after->post_name !== $before->post_name || $after->post_content !== $before->post_content)) {
        xf_internal_links_flush();
    }
}, 10, 3);
// A startup becoming (or ceasing to be) a researched profile changes what is linkable and which neighbours are preferred.
foreach (['added_post_meta', 'updated_post_meta'] as $hook) {
    add_action($hook, function ($mid, $post_id, $key) {
        if ($key === '_xf_indexable') {
            xf_internal_links_flush();
        }
    }, 10, 3);
}

/* ------------------------------------------------------------------ Auto-links in articles */

add_filter('the_content', 'xf_autolink_startups', 12); // after do_shortcode (11)

function xf_autolink_startups($html) {
    if (is_admin() || is_feed() || !is_singular(['post', 'xf_guide']) || !in_the_loop() || get_the_ID() !== get_queried_object_id()) {
        return $html;
    }
    $map = xf_startup_link_map();
    if (!$map || $html === '') {
        return $html;
    }
    $names = [];
    foreach (xf_startup_names_in(wp_strip_all_tags($html), $map) as $name) {
        // Already linked by the writer: that counts as its link.
        if (stripos($html, untrailingslashit($map[$name]['url'])) === false) {
            $names[] = $name;
        }
    }
    if (!$names) {
        return $html;
    }
    usort($names, function ($a, $b) { return mb_strlen($b) - mb_strlen($a); }); // "Notion AI" before "Notion"
    $re = '/(?<![\p{L}\p{N}_])(' . implode('|', array_map(function ($n) { return preg_quote($n, '/'); }, $names)) . ')(?![\p{L}\p{N}_])/u';
    $self = untrailingslashit(get_permalink());
    $linked = [];
    $skip = 0;
    $parts = wp_html_split($html); // core's tokenizer: comments and CDATA stay whole, so no link lands inside them
    foreach ($parts as $i => $part) {
        if ($part === '') {
            continue;
        }
        if ($part[0] === '<') {
            if (preg_match('#^<(/?)(a|h[1-6]|code|pre|kbd|script|style|button|label|textarea|select|svg|figcaption)\b#i', $part, $m)) {
                $skip = $m[1] ? max(0, $skip - 1) : (substr($part, -2) === '/>' ? $skip : $skip + 1);
            }
            continue;
        }
        // A straight quote in text that wptexturize already ran over means a '>' inside an attribute split the tag: never link into it.
        if ($skip || count($linked) >= XF_AUTOLINK_MAX || strpos($part, '"') !== false) {
            continue;
        }
        $parts[$i] = preg_replace_callback($re, function ($m) use (&$linked, $map, $self) {
            $name = $m[1];
            if (isset($linked[$name]) || count($linked) >= XF_AUTOLINK_MAX || untrailingslashit($map[$name]['url']) === $self) {
                return $m[0];
            }
            $linked[$name] = true;
            return '<a class="xf-autolink" href="' . esc_url($map[$name]['url']) . '">' . $m[0] . '</a>';
        }, $part);
    }
    return implode('', $parts);
}

/* ------------------------------------------------------------------ Mentions index */

/** [startup_id => [post_id, ...]] newest first: English articles and guides that name or link each startup. */
function xf_startup_mentions_index() {
    $index = get_transient('xf_startup_mentions');
    if (is_array($index)) {
        return $index;
    }
    global $wpdb;
    $map = xf_startup_link_map();
    $by_slug = [];
    foreach ($map as $s) {
        $by_slug[basename(untrailingslashit($s['url']))] = $s['id'];
    }
    $rows = $wpdb->get_results("SELECT p.ID, p.post_content FROM {$wpdb->posts} p
        LEFT JOIN {$wpdb->postmeta} l ON l.post_id = p.ID AND l.meta_key = '_xf_ai_lang'
        WHERE p.post_type IN ('post','xf_guide') AND p.post_status = 'publish' AND l.post_id IS NULL
        ORDER BY p.post_date DESC");
    $index = [];
    foreach ($rows as $r) {
        $ids = [];
        foreach (xf_startup_names_in(wp_strip_all_tags($r->post_content), $map) as $name) {
            $ids[] = $map[$name]['id'];
        }
        if (preg_match_all('#/startup/([a-z0-9-]+)/?#', $r->post_content, $m)) {
            foreach ($m[1] as $slug) {
                if (isset($by_slug[$slug])) $ids[] = $by_slug[$slug];
            }
        }
        foreach (array_unique($ids) as $sid) {
            $index[$sid][] = (int) $r->ID;
        }
    }
    set_transient('xf_startup_mentions', $index, DAY_IN_SECONDS);
    return $index;
}

/** Published articles/guides that mention a startup, newest first. */
function xf_startup_mentioned_in($startup_id, $limit = 6) {
    $ids = array_slice(xf_startup_mentions_index()[(int) $startup_id] ?? [], 0, $limit);
    return $ids ? get_posts(['post_type' => ['post', 'xf_guide'], 'post__in' => $ids, 'orderby' => 'post__in', 'posts_per_page' => $limit, 'no_found_rows' => true]) : [];
}

/* ------------------------------------------------------------------ Industry neighbours */

/**
 * Up to $n other startups in the same industry: researched profiles first, then the listings
 * that follow this one. Taking neighbours (not "newest") means every listing in an industry is
 * linked from the ones before it, so none is left without an internal link.
 */
function xf_startup_industry_neighbours($startup_id, WP_Term $term, $n = 6) {
    $key = 'xf_ind_' . $term->term_id . '_' . (int) get_option('xf_industry_ver');
    $lists = get_transient($key);
    if (!is_array($lists)) {
        $base = ['post_type' => 'xf_startup', 'post_status' => 'publish', 'fields' => 'ids', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC', 'no_found_rows' => true,
            'tax_query' => [['taxonomy' => 'xf_industry', 'terms' => $term->term_id]]];
        $lists = [
            'all' => array_map('intval', get_posts($base)),
            'rich' => array_map('intval', get_posts($base + ['meta_query' => [['key' => '_xf_indexable', 'value' => '1']]])),
        ];
        set_transient($key, $lists, 12 * HOUR_IN_SECONDS);
    }
    $after = function (array $ids) use ($startup_id) {
        $ids = array_values(array_diff($ids, [(int) $startup_id]));
        $pos = 0;
        while ($pos < count($ids) && $ids[$pos] < $startup_id) $pos++;
        return array_merge(array_slice($ids, $pos), array_slice($ids, 0, $pos)); // wrap around
    };
    $pick = array_slice($after($lists['rich']), 0, (int) ceil($n / 2));
    foreach ($after($lists['all']) as $id) {
        if (count($pick) >= $n) break;
        if (!in_array($id, $pick, true)) $pick[] = $id;
    }
    if (!$pick) {
        return [];
    }
    $q = new WP_Query(['post_type' => 'xf_startup', 'post__in' => $pick, 'orderby' => 'post__in', 'posts_per_page' => $n, 'no_found_rows' => true, 'ignore_sticky_posts' => true]);
    update_post_thumbnail_cache($q);
    return $q->posts;
}

/* ------------------------------------------------------------------ Topic hubs */

/** Hub key => title, page key, intro. Membership is decided from each article's title and category. */
function xf_hubs() {
    return [
        'funding' => [
            'title' => 'Indian startup funding',
            'page' => 'funding',
            'match' => function (WP_Post $p, $title) {
                return has_category('funding', $p) || preg_match('/\b(raises?|raised|funding|series [a-h]|pre-seed|seed round|valuation|ipos?|safe notes?|cap table|first close)\b/i', $title);
            },
        ],
        'ai_tools' => [
            'title' => 'Best AI tools',
            'page' => 'ai_tools',
            'match' => function (WP_Post $p, $title) {
                $slugs = ['chatgpt-vs-claude-vs-gemini-business', 'what-are-ai-agents-guide', 'model-context-protocol-mcp-explained'];
                return in_array($p->post_name, $slugs, true)
                    || preg_match('/(^|-)ai-|-ai($|-)/', $p->post_name)
                    || (preg_match('/\bAI\b/', $title) && preg_match('/\b(best|tools?|vs|review|builders?|generators?|makers?|assistants?|browsers?|note takers?)\b/i', $title));
            },
        ],
    ];
}

/** [post_id => hub key] for every published English article that belongs to a hub. */
function xf_hub_index() {
    $index = get_transient('xf_hub_index');
    if (is_array($index)) {
        return $index;
    }
    $index = [];
    $posts = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'date', 'order' => 'DESC', 'update_post_meta_cache' => false]);
    foreach ($posts as $p) {
        $title = html_entity_decode(get_the_title($p), ENT_QUOTES, 'UTF-8');
        foreach (xf_hubs() as $key => $hub) {
            if ($hub['match']($p, $title)) {
                $index[$p->ID] = $key;
                break;
            }
        }
    }
    set_transient('xf_hub_index', $index, DAY_IN_SECONDS);
    return $index;
}

function xf_post_hub($post_id) {
    return xf_hub_index()[(int) $post_id] ?? '';
}

function xf_hub_url($key) {
    $hub = xf_hubs()[$key] ?? null;
    return $hub ? xf_page_url($hub['page']) : '';
}

/** The hub's articles, newest first. */
function xf_hub_posts($key) {
    $ids = array_keys(array_filter(xf_hub_index(), function ($k) use ($key) { return $k === $key; }));
    if (!$ids) {
        return [];
    }
    $q = new WP_Query(['post_type' => 'post', 'post__in' => $ids, 'orderby' => 'post__in', 'posts_per_page' => count($ids), 'no_found_rows' => true, 'ignore_sticky_posts' => true]);
    update_post_thumbnail_cache($q);
    return $q->posts;
}

/** Startups named in a hub's articles (for the funding hub), most-mentioned first. */
function xf_hub_startups_mentioned($key, $limit = 12) {
    $posts = array_keys(array_filter(xf_hub_index(), function ($k) use ($key) { return $k === $key; }));
    $counts = [];
    foreach (xf_startup_mentions_index() as $sid => $pids) {
        $n = count(array_intersect($pids, $posts));
        if ($n) $counts[$sid] = $n;
    }
    arsort($counts);
    $ids = array_slice(array_keys($counts), 0, $limit);
    if (!$ids) {
        return [];
    }
    $q = new WP_Query(['post_type' => 'xf_startup', 'post__in' => $ids, 'orderby' => 'post__in', 'posts_per_page' => $limit, 'no_found_rows' => true]);
    update_post_thumbnail_cache($q);
    return $q->posts;
}

/** Researched AI startup profiles, most Product Hunt votes first. */
function xf_hub_ai_startups($limit = 12) {
    $terms = get_terms(['taxonomy' => 'xf_industry', 'slug' => ['artificial-intelligence', 'ai', 'generative-ai', 'machine-learning'], 'fields' => 'ids', 'hide_empty' => true]);
    if (!$terms || is_wp_error($terms)) {
        return [];
    }
    $q = new WP_Query(['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => 60, 'no_found_rows' => true,
        'tax_query' => [['taxonomy' => 'xf_industry', 'terms' => $terms]],
        'meta_query' => [['key' => '_xf_indexable', 'value' => '1']]]);
    $posts = $q->posts; // meta is primed, so sorting by votes costs no queries
    usort($posts, function ($a, $b) { return (int) get_post_meta($b->ID, '_xf_votes', true) - (int) get_post_meta($a->ID, '_xf_votes', true); });
    $q->posts = array_slice($posts, 0, $limit);
    update_post_thumbnail_cache($q);
    return $q->posts;
}

/* ------------------------------------------------------------------ Hub and sitemap pages */

/** Creates the hub and sitemap pages once, on sites that were set up before they existed. */
add_action('init', function () {
    $pages = (array) get_option('xf_pages', []);
    if (empty($pages['ai_tools']) || empty($pages['sitemap'])) {
        xf_create_pages();
    }
}, 99);
