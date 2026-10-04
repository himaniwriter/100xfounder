<?php
/**
 * Plugin Name: 100xFounder Headless
 * Description: Uses this WordPress install as the editor for 100xfounder.com. Refreshes the live site when posts or pages change and redirects front-end visitors to the main site.
 * Version: 1.0.0
 * Requires PHP: 7.4
 * Author: 100xFounder
 */

if (!defined('ABSPATH')) {
    exit;
}

const XF_HEADLESS_OPTION = 'xf_headless_settings';

function xf_headless_settings(): array {
    $defaults = [
        'site_url' => 'https://100xfounder.com',
        'secret' => '',
        'redirect_frontend' => '1',
    ];
    $saved = get_option(XF_HEADLESS_OPTION, []);
    return array_merge($defaults, is_array($saved) ? $saved : []);
}

function xf_headless_site_url(): string {
    return untrailingslashit(xf_headless_settings()['site_url']);
}

/** Front-end URL for a post on the Next.js site. */
function xf_headless_frontend_url(WP_Post $post): string {
    $base = xf_headless_site_url();
    if ($post->post_type === 'page') {
        return $base . '/pages/' . $post->post_name;
    }
    if ($post->post_type === 'post') {
        return $base . '/blog/' . $post->post_name;
    }
    return $base;
}

/* -------------------------------------------------------------------------
 * Revalidate the live site whenever content is published, updated or removed
 * ---------------------------------------------------------------------- */

function xf_headless_notify(WP_Post $post): void {
    if (!in_array($post->post_type, ['post', 'page'], true) || wp_is_post_revision($post) || wp_is_post_autosave($post)) {
        return;
    }
    $settings = xf_headless_settings();
    if ($settings['secret'] === '') {
        return;
    }
    wp_remote_post(xf_headless_site_url() . '/api/wordpress/revalidate', [
        'timeout' => 5,
        'blocking' => false,
        'headers' => [
            'Content-Type' => 'application/json',
            'x-revalidate-secret' => $settings['secret'],
        ],
        'body' => wp_json_encode([
            'type' => $post->post_type,
            'slug' => $post->post_name,
        ]),
    ]);
}

add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($new_status === 'publish' || $old_status === 'publish') {
        xf_headless_notify($post);
    }
}, 10, 3);

/* -------------------------------------------------------------------------
 * Point "View post" links and front-end visitors at the main site
 * ---------------------------------------------------------------------- */

add_filter('post_link', function ($url, $post) {
    return $post instanceof WP_Post && $post->post_status === 'publish' ? xf_headless_frontend_url($post) : $url;
}, 10, 2);

add_filter('page_link', function ($url, $post_id) {
    $post = get_post($post_id);
    return $post instanceof WP_Post && $post->post_status === 'publish' ? xf_headless_frontend_url($post) : $url;
}, 10, 2);

add_action('template_redirect', function () {
    if (xf_headless_settings()['redirect_frontend'] !== '1' || is_preview() || current_user_can('edit_posts')) {
        return;
    }
    $post = is_singular() ? get_queried_object() : null;
    $target = $post instanceof WP_Post ? xf_headless_frontend_url($post) : xf_headless_site_url();
    wp_redirect($target, 301);
    exit;
});

/* -------------------------------------------------------------------------
 * Settings page: Settings → 100xFounder Headless
 * ---------------------------------------------------------------------- */

add_action('admin_init', function () {
    register_setting('xf_headless', XF_HEADLESS_OPTION, [
        'type' => 'array',
        'sanitize_callback' => function ($input) {
            $input = is_array($input) ? $input : [];
            return [
                'site_url' => esc_url_raw($input['site_url'] ?? 'https://100xfounder.com'),
                'secret' => sanitize_text_field($input['secret'] ?? ''),
                'redirect_frontend' => empty($input['redirect_frontend']) ? '0' : '1',
            ];
        },
    ]);
});

add_action('admin_menu', function () {
    add_options_page('100xFounder Headless', '100xFounder Headless', 'manage_options', 'xf-headless', function () {
        if (!current_user_can('manage_options')) {
            return;
        }
        $settings = xf_headless_settings();
        ?>
        <div class="wrap">
            <h1>100xFounder Headless</h1>
            <p>This WordPress site is the editor for <?php echo esc_html(xf_headless_site_url()); ?>. Posts appear at <code>/blog/&lt;slug&gt;</code> and pages at <code>/pages/&lt;slug&gt;</code>.</p>
            <form method="post" action="options.php">
                <?php settings_fields('xf_headless'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="xf_site_url">Live site URL</label></th>
                        <td><input id="xf_site_url" class="regular-text" type="url" name="<?php echo esc_attr(XF_HEADLESS_OPTION); ?>[site_url]" value="<?php echo esc_attr($settings['site_url']); ?>"></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="xf_secret">Revalidate secret</label></th>
                        <td>
                            <input id="xf_secret" class="regular-text" type="password" name="<?php echo esc_attr(XF_HEADLESS_OPTION); ?>[secret]" value="<?php echo esc_attr($settings['secret']); ?>" autocomplete="off">
                            <p class="description">Must match <code>WORDPRESS_REVALIDATE_SECRET</code> on the live site.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Redirect visitors</th>
                        <td><label><input type="checkbox" name="<?php echo esc_attr(XF_HEADLESS_OPTION); ?>[redirect_frontend]" value="1" <?php checked($settings['redirect_frontend'], '1'); ?>> Send logged-out visitors of this WordPress site to the live site</label></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    });
});
