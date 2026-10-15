<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Tiny helper for structured post fields: registers a meta box with the given
 * fields and saves them. $fields: key => [label, type(text|url|date|datetime|number|textarea|select), options?]
 * Values are stored as post meta "_xf_{key}".
 */
function xf_register_fields($post_type, $title, array $fields) {
    add_action('add_meta_boxes', function () use ($post_type, $title, $fields) {
        add_meta_box('xf_fields_' . $post_type, $title, function (WP_Post $post) use ($fields, $post_type) {
            wp_nonce_field('xf_fields_' . $post_type, 'xf_fields_nonce');
            echo '<table class="form-table" role="presentation">';
            foreach ($fields as $key => $def) {
                $label = $def[0];
                $type = $def[1];
                $value = (string) get_post_meta($post->ID, '_xf_' . $key, true);
                $id = 'xf_' . $key;
                echo '<tr><th scope="row"><label for="' . esc_attr($id) . '">' . esc_html($label) . '</label></th><td>';
                if ($type === 'textarea') {
                    echo '<textarea class="large-text" rows="3" id="' . esc_attr($id) . '" name="' . esc_attr($id) . '">' . esc_textarea($value) . '</textarea>';
                } elseif ($type === 'select') {
                    echo '<select id="' . esc_attr($id) . '" name="' . esc_attr($id) . '">';
                    foreach ($def[2] as $option) {
                        echo '<option value="' . esc_attr($option) . '"' . selected($value, $option, false) . '>' . esc_html($option) . '</option>';
                    }
                    echo '</select>';
                } else {
                    $html_type = ['url' => 'url', 'date' => 'date', 'datetime' => 'datetime-local', 'number' => 'number'][$type] ?? 'text';
                    if ($type === 'datetime' && $value) {
                        $value = str_replace(' ', 'T', substr($value, 0, 16));
                    }
                    echo '<input class="regular-text" type="' . esc_attr($html_type) . '" id="' . esc_attr($id) . '" name="' . esc_attr($id) . '" value="' . esc_attr($value) . '"' . ($type === 'number' ? ' step="any"' : '') . '>';
                }
                if (!empty($def[3])) {
                    echo '<p class="description">' . esc_html($def[3]) . '</p>';
                }
                echo '</td></tr>';
            }
            echo '</table>';
        }, $post_type, 'normal', 'high');
    });

    add_action('save_post_' . $post_type, function ($post_id) use ($fields, $post_type) {
        if (!isset($_POST['xf_fields_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['xf_fields_nonce'])), 'xf_fields_' . $post_type)) {
            return;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE || !current_user_can('edit_post', $post_id)) {
            return;
        }
        foreach ($fields as $key => $def) {
            $raw = isset($_POST['xf_' . $key]) ? wp_unslash($_POST['xf_' . $key]) : '';
            switch ($def[1]) {
                case 'url':
                    $value = esc_url_raw($raw);
                    break;
                case 'textarea':
                    $value = sanitize_textarea_field($raw);
                    break;
                case 'number':
                    $value = is_numeric($raw) ? (string) (0 + $raw) : '';
                    break;
                case 'datetime':
                    $value = $raw ? gmdate('Y-m-d H:i:s', strtotime($raw)) : '';
                    break;
                default:
                    $value = sanitize_text_field($raw);
            }
            update_post_meta($post_id, '_xf_' . $key, $value);
        }
    });
}

/** "5h", "2d", "3w" style ages used across the design. */
function xf_short_age($timestamp) {
    $diff = max(0, time() - (int) $timestamp);
    if ($diff < HOUR_IN_SECONDS) return max(1, (int) floor($diff / MINUTE_IN_SECONDS)) . 'm';
    if ($diff < DAY_IN_SECONDS) return (int) floor($diff / HOUR_IN_SECONDS) . 'h';
    if ($diff < WEEK_IN_SECONDS) return (int) floor($diff / DAY_IN_SECONDS) . 'd';
    return (int) floor($diff / WEEK_IN_SECONDS) . 'w';
}
