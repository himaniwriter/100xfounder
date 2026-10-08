<?php
if (!defined('ABSPATH')) {
    exit;
}

/* -------------------------------------------------------------------------
 * MCP server for the site: https://100xfounder.com/wp-json/xf/v1/mcp
 *
 * Speaks the Model Context Protocol (Streamable HTTP transport, JSON
 * responses) so Claude Code / Claude Desktop can read the content queue,
 * write and edit drafts, attach images, look at jobs and launches, and run
 * the import routines. Authentication is a WordPress Application Password
 * (HTTP Basic), so every call runs as a real WordPress user with that
 * user's role and capabilities.
 *
 * Publishing stays a human decision: drafts always land as Pending review.
 * The publish tool only exists when the owner turns on "Allow publishing
 * through MCP" in Settings, and even then it refuses posts without sources.
 * ---------------------------------------------------------------------- */

const XF_MCP_PROTOCOL = '2025-06-18';

add_action('rest_api_init', function () {
    register_rest_route('xf/v1', '/mcp', [
        [
            'methods' => 'POST',
            'callback' => 'xf_mcp_handle',
            'permission_callback' => function () {
                return is_user_logged_in() && current_user_can('edit_posts')
                    ? true
                    : new WP_Error('xf_mcp_auth', 'Use a WordPress Application Password (HTTP Basic) for a user who can edit posts.', ['status' => 401]);
            },
        ],
        [
            // Streamable HTTP lets servers refuse the optional GET event stream.
            'methods' => 'GET',
            'callback' => function () {
                return new WP_REST_Response(null, 405);
            },
            'permission_callback' => '__return_true',
        ],
    ]);
});

function xf_mcp_handle(WP_REST_Request $request) {
    $msg = json_decode($request->get_body(), true);
    if (!is_array($msg)) {
        return new WP_REST_Response(xf_mcp_error(null, -32700, 'Parse error'), 400);
    }
    if (isset($msg[0])) {
        // JSON-RPC batch.
        $out = array_values(array_filter(array_map('xf_mcp_dispatch', $msg)));
        return $out ? new WP_REST_Response($out, 200) : new WP_REST_Response(null, 202);
    }
    $reply = xf_mcp_dispatch($msg);
    return $reply === null ? new WP_REST_Response(null, 202) : new WP_REST_Response($reply, 200);
}

function xf_mcp_error($id, $code, $message) {
    return ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]];
}

/** Returns the JSON-RPC reply, or null for notifications. */
function xf_mcp_dispatch($msg) {
    if (!is_array($msg) || ($msg['jsonrpc'] ?? '') !== '2.0' || empty($msg['method'])) {
        return xf_mcp_error($msg['id'] ?? null, -32600, 'Invalid request');
    }
    $id = $msg['id'] ?? null;
    $params = is_array($msg['params'] ?? null) ? $msg['params'] : [];
    if (!array_key_exists('id', $msg)) {
        return null; // notifications/initialized, notifications/cancelled, …
    }
    switch ($msg['method']) {
        case 'initialize':
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => [
                'protocolVersion' => is_string($params['protocolVersion'] ?? null) ? $params['protocolVersion'] : XF_MCP_PROTOCOL,
                'capabilities' => ['tools' => ['listChanged' => false]],
                'serverInfo' => ['name' => '100xfounder', 'title' => '100xFounder WordPress', 'version' => '1.0.0'],
                'instructions' => xf_mcp_instructions(),
            ]];
        case 'ping':
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => new stdClass()];
        case 'tools/list':
            $tools = [];
            foreach (xf_mcp_tools() as $name => $t) {
                $tools[] = ['name' => $name, 'description' => $t['description'], 'inputSchema' => $t['schema']];
            }
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['tools' => $tools]];
        case 'tools/call':
            $name = (string) ($params['name'] ?? '');
            $tools = xf_mcp_tools();
            if (!isset($tools[$name])) {
                return xf_mcp_error($id, -32602, 'Unknown tool: ' . $name);
            }
            try {
                $result = call_user_func($tools[$name]['run'], is_array($params['arguments'] ?? null) ? $params['arguments'] : []);
            } catch (Throwable $e) {
                $result = new WP_Error('xf_mcp', $e->getMessage());
            }
            if (is_wp_error($result)) {
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['isError' => true, 'content' => [['type' => 'text', 'text' => $result->get_error_message()]]]];
            }
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => [
                'content' => [['type' => 'text', 'text' => wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]],
                'structuredContent' => is_array($result) && !isset($result[0]) ? $result : ['items' => $result],
            ]];
        default:
            return xf_mcp_error($id, -32601, 'Method not found: ' . $msg['method']);
    }
}

function xf_mcp_instructions() {
    return "You are connected to 100xfounder.com (WordPress). Rules from the owner:\n"
        . "- Every fact about a real person or company needs a source (url, publisher, date, claim). Never invent net worth, funding, revenue or quotes.\n"
        . "- create_draft and update_draft always leave posts as Pending review. A human reviews before anything is published.\n"
        . "- Call publish_post only after the owner approves that post in the conversation, or inside the owner's scheduled daily-content routine (owner decision 2026-10-04), and only once review_checklist passes.\n"
        . "- French (Canada) and German articles: pass fields.lang ('fr-CA' or 'de-DE'); a translation also passes fields.translation_of (the English post ID).\n"
        . "- Write in our own words; credit sources; label sponsored content.\n"
        . "- Check recent_posts first so you don't duplicate a story.\n"
        . "See docs/STYLE_GUIDE.md and CLAUDE.md in the repo for the full rules.";
}

/* ---- Tool helpers ---- */

function xf_mcp_post_summary(WP_Post $p) {
    $cats = $p->post_type === 'post' ? wp_get_post_categories($p->ID, ['fields' => 'slugs']) : [];
    return [
        'id' => $p->ID,
        'type' => $p->post_type,
        'status' => $p->post_status,
        'title' => get_the_title($p),
        'date' => $p->post_date,
        'modified' => $p->post_modified,
        'url' => $p->post_status === 'publish' ? get_permalink($p) : get_preview_post_link($p),
        'edit_url' => admin_url('post.php?post=' . $p->ID . '&action=edit'),
        'categories' => $cats,
        'sources' => count(xf_get_sources($p->ID)),
    ];
}

function xf_mcp_require($cap) {
    if (!current_user_can($cap)) {
        return new WP_Error('xf_mcp_forbidden', 'This WordPress user is not allowed to do that (needs ' . $cap . ').');
    }
    return true;
}

function xf_mcp_editable_post($id) {
    $post = get_post((int) $id);
    if (!$post) {
        return new WP_Error('xf_mcp_missing', 'No post with id ' . (int) $id);
    }
    if (!current_user_can('edit_post', $post->ID)) {
        return new WP_Error('xf_mcp_forbidden', 'This user cannot edit post ' . $post->ID);
    }
    return $post;
}

const XF_MCP_TYPES = ['post', 'xf_round', 'xf_event', 'xf_guide', 'xf_startup', 'xf_spotlight', 'xf_job'];

function xf_mcp_tools() {
    $str = ['type' => 'string'];
    $int = ['type' => 'integer'];
    $sources = ['type' => 'array', 'description' => 'One row per source.', 'items' => ['type' => 'object', 'properties' => [
        'url' => $str, 'publisher' => $str, 'date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'], 'claim' => ['type' => 'string', 'description' => 'The fact this source supports'],
    ], 'required' => ['url']]];

    $tools = [
        'site_overview' => [
            'description' => 'Counts of posts by status, queue size, jobs, launches and events, plus the last daily routine run. Start here.',
            'schema' => ['type' => 'object', 'properties' => new stdClass()],
            'run' => function () {
                global $wpdb;
                $counts = [];
                foreach (['post', 'xf_round', 'xf_event', 'xf_guide', 'xf_startup', 'xf_job'] as $t) {
                    $c = wp_count_posts($t);
                    $counts[$t] = ['publish' => (int) ($c->publish ?? 0), 'pending' => (int) ($c->pending ?? 0), 'draft' => (int) ($c->draft ?? 0)];
                }
                $queued = (int) $wpdb->get_var("SELECT COUNT(*) FROM " . xf_table('queue') . " WHERE status = 'queued'"); // phpcs:ignore
                $last = get_option('xf_last_run');
                return [
                    'site' => home_url('/'),
                    'you' => wp_get_current_user()->user_login,
                    'can_publish_via_mcp' => xf_mcp_publish_enabled(),
                    'counts' => $counts,
                    'queue_waiting' => $queued,
                    'last_routine_run' => is_array($last) ? ['at' => isset($last['at']) ? wp_date('Y-m-d H:i', (int) $last['at']) : null, 'results' => $last['results'] ?? null] : null,
                ];
            },
        ],
        'list_queue' => [
            'description' => 'Topics waiting to be written, highest priority first. Types: ' . implode(', ', array_keys(xf_queue_types())) . '.',
            'schema' => ['type' => 'object', 'properties' => ['type' => $str, 'limit' => $int]],
            'run' => function ($a) {
                global $wpdb;
                $type = sanitize_key((string) ($a['type'] ?? ''));
                $limit = max(1, min(30, (int) ($a['limit'] ?? 10)));
                $sql = 'SELECT * FROM ' . xf_table('queue') . " WHERE status = 'queued'" . ($type ? $wpdb->prepare(' AND type = %s', $type) : '') . ' ORDER BY priority ASC, created_at ASC LIMIT ' . $limit;
                return array_map('xf_queue_item_to_array', $wpdb->get_results($sql)); // phpcs:ignore
            },
        ],
        'add_to_queue' => [
            'description' => 'Add a story idea to the content queue for later.',
            'schema' => ['type' => 'object', 'properties' => [
                'type' => ['type' => 'string', 'enum' => array_keys(xf_queue_types())], 'title' => $str, 'notes' => $str,
                'source_urls' => ['type' => 'array', 'items' => $str], 'priority' => ['type' => 'integer', 'description' => '1 (urgent) to 9'],
            ], 'required' => ['type', 'title']],
            'run' => function ($a) {
                return ['id' => xf_queue_add((string) $a['type'], (string) $a['title'], (string) ($a['notes'] ?? ''), (array) ($a['source_urls'] ?? []), (int) ($a['priority'] ?? 5))];
            },
        ],
        'skip_queue_item' => [
            'description' => 'Mark a queue item as skipped (not worth writing, duplicate, or no reliable source).',
            'schema' => ['type' => 'object', 'properties' => ['id' => $int, 'reason' => $str], 'required' => ['id']],
            'run' => function ($a) {
                global $wpdb;
                $wpdb->update(xf_table('queue'), ['status' => 'skipped', 'notes' => sanitize_textarea_field('Skipped via MCP: ' . ($a['reason'] ?? '')), 'updated_at' => xf_now()], ['id' => (int) $a['id']]);
                return ['id' => (int) $a['id'], 'status' => 'skipped'];
            },
        ],
        'list_categories' => [
            'description' => 'News categories (slug and name) a post can be filed under.',
            'schema' => ['type' => 'object', 'properties' => new stdClass()],
            'run' => function () {
                return array_map(function ($t) { return ['slug' => $t->slug, 'name' => $t->name, 'count' => $t->count]; }, get_terms(['taxonomy' => 'category', 'hide_empty' => false]));
            },
        ],
        'recent_posts' => [
            'description' => 'Posts from the last N days in any status, to avoid duplicates.',
            'schema' => ['type' => 'object', 'properties' => ['days' => $int, 'type' => ['type' => 'string', 'enum' => XF_MCP_TYPES]]],
            'run' => function ($a) {
                $days = max(1, min(60, (int) ($a['days'] ?? 3)));
                $type = in_array($a['type'] ?? '', XF_MCP_TYPES, true) ? $a['type'] : ['post', 'xf_round', 'xf_event', 'xf_guide'];
                $posts = get_posts(['post_type' => $type, 'post_status' => ['publish', 'pending', 'draft', 'future'], 'posts_per_page' => 200, 'date_query' => [['after' => $days . ' days ago']]]);
                return array_map('xf_mcp_post_summary', $posts);
            },
        ],
        'search_content' => [
            'description' => 'Search posts, guides, rounds, events, startups or jobs by keyword.',
            'schema' => ['type' => 'object', 'properties' => ['query' => $str, 'type' => ['type' => 'string', 'enum' => XF_MCP_TYPES], 'status' => ['type' => 'string', 'enum' => ['any', 'publish', 'pending', 'draft']], 'limit' => $int], 'required' => ['query']],
            'run' => function ($a) {
                $posts = get_posts([
                    's' => sanitize_text_field((string) $a['query']),
                    'post_type' => in_array($a['type'] ?? '', XF_MCP_TYPES, true) ? $a['type'] : XF_MCP_TYPES,
                    'post_status' => in_array($a['status'] ?? '', ['publish', 'pending', 'draft'], true) ? $a['status'] : ['publish', 'pending', 'draft', 'future'],
                    'posts_per_page' => max(1, min(50, (int) ($a['limit'] ?? 10))),
                ]);
                return array_map('xf_mcp_post_summary', $posts);
            },
        ],
        'get_post' => [
            'description' => 'Full post: title, content (HTML), excerpt, status, categories, tags, sources, structured fields and featured image.',
            'schema' => ['type' => 'object', 'properties' => ['id' => $int], 'required' => ['id']],
            'run' => function ($a) {
                $p = xf_mcp_editable_post($a['id'] ?? 0);
                if (is_wp_error($p)) {
                    return $p;
                }
                $fields = [];
                foreach (get_post_meta($p->ID) as $k => $v) {
                    if (strpos($k, '_xf_') === 0 && !in_array($k, ['_xf_sources', '_xf_checklist'], true)) {
                        $fields[substr($k, 4)] = maybe_unserialize($v[0]);
                    }
                }
                return xf_mcp_post_summary($p) + [
                    'excerpt' => $p->post_excerpt,
                    'content' => $p->post_content,
                    'tags' => wp_get_post_tags($p->ID, ['fields' => 'names']),
                    'sources_list' => xf_get_sources($p->ID),
                    'fields' => $fields,
                    'featured_image' => get_the_post_thumbnail_url($p, 'full') ?: null,
                ];
            },
        ],
        'create_draft' => [
            'description' => 'Create a draft that lands as Pending review (never published). type: post (news/blog), xf_round (funding tracker row), xf_event, xf_guide (how-to-apply). Posts and guides need 150+ words and at least one source. Use fields for structured data (rounds: company, sector, round, lead_investor, amount_display, amount_usd, country, announced, source_url; guides: company_slug, hiring_for, process_length, rounds, careers_url; events: start, end, city, venue, url, organiser).',
            'schema' => ['type' => 'object', 'properties' => [
                'type' => ['type' => 'string', 'enum' => ['post', 'xf_round', 'xf_event', 'xf_guide']],
                'title' => $str, 'excerpt' => $str, 'content' => ['type' => 'string', 'description' => 'HTML: p, h2, h3, ul, ol, blockquote (real sourced quotes only)'],
                'category' => ['type' => 'string', 'description' => 'Category slug (see list_categories)'], 'tags' => ['type' => 'array', 'items' => $str],
                'sources' => $sources, 'fields' => ['type' => 'object'],
                'original_url' => $str, 'image_url' => ['type' => 'string', 'description' => 'Only images we have the right to use (press kit, Unsplash)'], 'image_credit' => $str,
                'queue_id' => $int,
            ], 'required' => ['type', 'title', 'content']],
            'run' => function ($a) {
                $id = xf_create_draft($a, get_current_user_id());
                if (is_wp_error($id)) {
                    return $id;
                }
                update_post_meta($id, '_xf_drafted_by', 'claude-mcp');
                return xf_mcp_post_summary(get_post($id));
            },
        ],
        'update_draft' => [
            'description' => 'Edit an existing post: any of title, content, excerpt, category, tags, sources (replaces the list), fields (merged). A published post edited here stays published only if this user may publish; otherwise edits wait as Pending review.',
            'schema' => ['type' => 'object', 'properties' => [
                'id' => $int, 'title' => $str, 'content' => $str, 'excerpt' => $str, 'category' => $str,
                'tags' => ['type' => 'array', 'items' => $str], 'sources' => $sources, 'fields' => ['type' => 'object'],
            ], 'required' => ['id']],
            'run' => function ($a) {
                $p = xf_mcp_editable_post($a['id'] ?? 0);
                if (is_wp_error($p)) {
                    return $p;
                }
                $arr = ['ID' => $p->ID];
                if (isset($a['title'])) $arr['post_title'] = sanitize_text_field((string) $a['title']);
                if (isset($a['content'])) $arr['post_content'] = wp_kses_post((string) $a['content']);
                if (isset($a['excerpt'])) $arr['post_excerpt'] = sanitize_text_field((string) $a['excerpt']);
                if ($p->post_status === 'publish' && !current_user_can('publish_post', $p->ID)) {
                    $arr['post_status'] = 'pending';
                }
                $r = wp_update_post($arr, true);
                if (is_wp_error($r)) {
                    return $r;
                }
                if ($p->post_type === 'post' && !empty($a['category'])) {
                    $cat = get_term_by('slug', sanitize_title((string) $a['category']), 'category');
                    if ($cat) wp_set_post_categories($p->ID, [$cat->term_id]);
                }
                if ($p->post_type === 'post' && isset($a['tags'])) {
                    wp_set_post_tags($p->ID, array_map('sanitize_text_field', array_slice((array) $a['tags'], 0, 8)));
                }
                if (isset($a['sources']) && is_array($a['sources'])) {
                    xf_save_sources($p->ID, $a['sources']);
                }
                foreach ((array) ($a['fields'] ?? []) as $k => $v) {
                    update_post_meta($p->ID, '_xf_' . sanitize_key($k), sanitize_text_field((string) $v));
                }
                return xf_mcp_post_summary(get_post($p->ID));
            },
        ],
        'set_featured_image' => [
            'description' => 'Download an image from a URL into the media library and make it the featured image. Only use images we have the right to use, and give the credit.',
            'schema' => ['type' => 'object', 'properties' => ['id' => $int, 'image_url' => $str, 'credit' => $str, 'alt' => $str], 'required' => ['id', 'image_url', 'credit']],
            'run' => function ($a) {
                $p = xf_mcp_editable_post($a['id'] ?? 0);
                if (is_wp_error($p)) {
                    return $p;
                }
                if (!current_user_can('upload_files')) {
                    return new WP_Error('xf_mcp_forbidden', 'This user cannot upload files.');
                }
                if (!wp_http_validate_url((string) $a['image_url'])) {
                    return new WP_Error('xf_mcp_url', 'Not a valid public image URL.');
                }
                require_once ABSPATH . 'wp-admin/includes/media.php';
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';
                $att = xf_sideload_image((string) $a['image_url'], $p->ID, sanitize_text_field((string) ($a['alt'] ?? get_the_title($p))));
                if (!$att) {
                    return new WP_Error('xf_mcp_image', 'Could not download that image.');
                }
                set_post_thumbnail($p->ID, $att);
                update_post_meta($p->ID, '_xf_image_credit', sanitize_text_field((string) $a['credit']));
                if (!empty($a['alt'])) update_post_meta($att, '_wp_attachment_image_alt', sanitize_text_field((string) $a['alt']));
                return ['id' => $p->ID, 'attachment_id' => $att, 'image' => wp_get_attachment_url($att)];
            },
        ],
        'review_checklist' => [
            'description' => 'Show which review checks a post passes (sources, images, category, length) so the owner knows what is left before publishing.',
            'schema' => ['type' => 'object', 'properties' => ['id' => $int], 'required' => ['id']],
            'run' => function ($a) {
                $p = xf_mcp_editable_post($a['id'] ?? 0);
                if (is_wp_error($p)) {
                    return $p;
                }
                $words = str_word_count(wp_strip_all_tags($p->post_content));
                return [
                    'id' => $p->ID,
                    'status' => $p->post_status,
                    'checks' => [
                        'has_sources' => (bool) xf_get_sources($p->ID),
                        'has_featured_image' => has_post_thumbnail($p->ID),
                        'has_image_credit' => !has_post_thumbnail($p->ID) || (bool) get_post_meta($p->ID, '_xf_image_credit', true),
                        'has_category' => $p->post_type !== 'post' || (bool) array_diff(wp_get_post_categories($p->ID), [(int) get_option('default_category')]),
                        'title_length_ok' => mb_strlen(get_the_title($p)) >= 30 && mb_strlen(get_the_title($p)) <= 75,
                        'excerpt_ok' => mb_strlen($p->post_excerpt) >= 100,
                        'words' => $words,
                    ],
                    'human_checklist_ticked' => array_values(array_filter((array) get_post_meta($p->ID, '_xf_checklist', true))),
                    'edit_url' => admin_url('post.php?post=' . $p->ID . '&action=edit'),
                ];
            },
        ],
        'list_launches' => [
            'description' => 'Recent Product Hunt launches imported into the startup directory.',
            'schema' => ['type' => 'object', 'properties' => ['days' => $int, 'limit' => $int]],
            'run' => function ($a) {
                $posts = get_posts(['post_type' => 'xf_startup', 'post_status' => 'publish', 'posts_per_page' => max(1, min(50, (int) ($a['limit'] ?? 15))), 'meta_key' => '_xf_source', 'meta_value' => 'producthunt', 'date_query' => [['after' => max(1, (int) ($a['days'] ?? 7)) . ' days ago']]]);
                return array_map(function ($p) {
                    return ['id' => $p->ID, 'name' => get_the_title($p), 'tagline' => get_post_meta($p->ID, '_xf_tagline', true), 'votes' => (int) get_post_meta($p->ID, '_xf_votes', true) ?: null, 'product_hunt' => get_post_meta($p->ID, '_xf_ph_url', true), 'website' => get_post_meta($p->ID, '_xf_website', true), 'url' => get_permalink($p), 'launched' => get_post_meta($p->ID, '_xf_launch_day', true)];
                }, $posts);
            },
        ],
        'list_jobs' => [
            'description' => 'Open jobs on the board, filterable by function (' . implode(', ', XF_JOB_FUNCTIONS) . '), city (' . implode(', ', XF_JOB_CITIES) . ') or company slug. Also returns totals.',
            'schema' => ['type' => 'object', 'properties' => ['function' => $str, 'city' => $str, 'company' => $str, 'limit' => $int]],
            'run' => function ($a) {
                $f = ['q' => '', 'where' => '', 'workplace' => '', 'function' => in_array($a['function'] ?? '', XF_JOB_FUNCTIONS, true) ? $a['function'] : '', 'city' => in_array($a['city'] ?? '', XF_JOB_CITIES, true) ? $a['city'] : ''];
                $args = xf_job_query_args($f, max(1, min(50, (int) ($a['limit'] ?? 20))), 1);
                if (!empty($a['company'])) {
                    $args['tax_query'] = [['taxonomy' => 'xf_company', 'field' => 'slug', 'terms' => sanitize_title((string) $a['company'])]];
                }
                $q = new WP_Query($args);
                return [
                    'total' => (int) $q->found_posts,
                    'jobs' => array_map(function ($p) {
                        return ['id' => $p->ID, 'title' => get_the_title($p), 'company' => get_post_meta($p->ID, '_xf_company_name', true), 'function' => get_post_meta($p->ID, '_xf_function', true), 'city' => get_post_meta($p->ID, '_xf_city', true), 'url' => get_permalink($p), 'apply' => get_post_meta($p->ID, '_xf_apply_url', true)];
                    }, $q->posts),
                ];
            },
        ],
        'list_companies' => [
            'description' => 'Companies whose official careers feeds we sync, with open-role counts and whether a how-to-apply guide exists.',
            'schema' => ['type' => 'object', 'properties' => new stdClass()],
            'run' => function () {
                $terms = get_terms(['taxonomy' => 'xf_company', 'hide_empty' => false, 'orderby' => 'count', 'order' => 'DESC']);
                return array_map(function ($t) {
                    return ['slug' => $t->slug, 'name' => $t->name, 'open_roles' => (int) $t->count, 'ats' => get_term_meta($t->term_id, 'xf_ats', true), 'careers_url' => get_term_meta($t->term_id, 'xf_careers_url', true), 'has_guide' => (bool) xf_guide_for_company($t)];
                }, is_wp_error($terms) ? [] : $terms);
            },
        ],
        'run_routine' => [
            'description' => 'Run part of the daily routine now (admins only): import (Product Hunt launches), jobs (sync careers feeds), indexing (Google Indexing API for job pages + IndexNow), events (calendar feeds), contacts, digest. Outreach sending is not available here.',
            'schema' => ['type' => 'object', 'properties' => ['stage' => ['type' => 'string', 'enum' => ['import', 'jobs', 'indexing', 'events', 'contacts', 'digest']]], 'required' => ['stage']],
            'run' => function ($a) {
                $ok = xf_mcp_require('manage_options');
                if (is_wp_error($ok)) {
                    return $ok;
                }
                $stage = (string) $a['stage'];
                if (!in_array($stage, ['import', 'jobs', 'indexing', 'events', 'contacts', 'digest'], true)) {
                    return new WP_Error('xf_mcp_stage', 'Unknown stage.');
                }
                return xf_run_pipeline([$stage]);
            },
        ],
    ];

    $tools['submit_all_for_indexing'] = [
        'description' => 'Admins only. Send every public URL (articles, jobs, guides, tool and job landing pages) to IndexNow (Bing, Yandex…) in one batch, and send job pages Google has not seen to the Google Indexing API (within today\'s quota). Indexing speeds up discovery; it never guarantees rankings.',
        'schema' => ['type' => 'object', 'properties' => new stdClass()],
        'run' => function () {
            $ok = xf_mcp_require('manage_options');
            if (is_wp_error($ok)) {
                return $ok;
            }
            $urls = xf_all_public_urls();
            return ['indexnow' => ['urls' => count($urls), 'http_status' => xf_indexnow_submit($urls)], 'google_jobs' => xf_indexing_backfill(190)];
        },
    ];

    if (xf_mcp_publish_enabled()) {
        $tools['publish_post'] = [
            'description' => 'Publish a pending post. ONLY call this after the owner has explicitly approved this exact post in the conversation. Refuses posts without sources (news, guides).',
            'schema' => ['type' => 'object', 'properties' => ['id' => $int, 'approved_by_owner' => ['type' => 'boolean', 'description' => 'Must be true: the owner approved this post in the conversation.']], 'required' => ['id', 'approved_by_owner']],
            'run' => function ($a) {
                $p = xf_mcp_editable_post($a['id'] ?? 0);
                if (is_wp_error($p)) {
                    return $p;
                }
                if (empty($a['approved_by_owner'])) {
                    return new WP_Error('xf_mcp_review', 'Ask the owner to approve this post first.');
                }
                if (!current_user_can('publish_post', $p->ID)) {
                    return new WP_Error('xf_mcp_forbidden', 'This WordPress user cannot publish. Give it the Editor role or publish from wp-admin.');
                }
                if (in_array($p->post_type, ['post', 'xf_guide'], true) && !xf_get_sources($p->ID)) {
                    return new WP_Error('xf_mcp_sources', 'This post has no sources. Add them before publishing.');
                }
                $r = wp_update_post(['ID' => $p->ID, 'post_status' => 'publish', 'xf_skip_source_check' => true], true);
                if (is_wp_error($r)) {
                    return $r;
                }
                update_post_meta($p->ID, '_xf_published_via', 'mcp:' . wp_get_current_user()->user_login);
                return xf_mcp_post_summary(get_post($p->ID));
            },
        ];
    }
    return $tools;
}

function xf_mcp_publish_enabled() {
    return (bool) xf_get_setting('mcp_allow_publish');
}
