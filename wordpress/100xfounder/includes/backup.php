<?php
/**
 * Server backups before every deploy (owner, 2026-10-15): a database dump (all tables with this
 * site's prefix) and a zip of the 100xFounder plugin and theme, kept in wp-content/xf-backups/
 * (web access denied), newest 7 kept. Admins only, through an Application Password:
 *   POST /xf/v1/backup                   creates one, returns {id, files}
 *   GET  /xf/v1/backups                  lists them
 *   GET  /xf/v1/backup/{id}/{db|code}    downloads a file (the local copy)
 * wordpress/deploy/backup-live.py calls these; push.py runs it before uploading anything.
 */
if (!defined('ABSPATH')) {
    exit;
}

const XF_BACKUP_KEEP = 7;

function xf_backup_root() {
    $dir = WP_CONTENT_DIR . '/xf-backups';
    if (!is_dir($dir)) {
        wp_mkdir_p($dir);
    }
    if (!file_exists($dir . '/.htaccess')) {
        file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
        file_put_contents($dir . '/index.php', "<?php\n// Silence.\n");
    }
    return $dir;
}

/** Folder of one backup, or '' when the id is malformed or missing. */
function xf_backup_dir($id) {
    if (!is_string($id) || !preg_match('/^\d{8}-\d{6}-[A-Za-z0-9]{12}$/', $id)) {
        return '';
    }
    $dir = xf_backup_root() . '/' . $id;
    return is_dir($dir) ? $dir : '';
}

/** gzip SQL dump of every table with this site's prefix; returns bytes written or WP_Error. */
function xf_backup_dump_db($path) {
    global $wpdb;
    $gz = gzopen($path, 'wb6');
    if (!$gz) {
        return new WP_Error('xf_backup', 'Could not write the database dump.');
    }
    gzwrite($gz, "-- 100xFounder backup " . gmdate('c') . "\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n");
    $tables = $wpdb->get_col($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($wpdb->prefix) . '%'));
    foreach ($tables as $table) {
        $create = $wpdb->get_row("SHOW CREATE TABLE `$table`", ARRAY_N); // phpcs:ignore -- table names come from SHOW TABLES
        gzwrite($gz, "\nDROP TABLE IF EXISTS `$table`;\n" . $create[1] . ";\n");
        for ($offset = 0; ; $offset += 500) {
            $rows = $wpdb->get_results("SELECT * FROM `$table` LIMIT $offset, 500", ARRAY_N); // phpcs:ignore
            if (!$rows) {
                break;
            }
            $values = [];
            foreach ($rows as $row) {
                $values[] = '(' . implode(',', array_map(function ($v) use ($wpdb) {
                    return $v === null ? 'NULL' : "'" . $wpdb->_real_escape($v) . "'";
                }, $row)) . ')';
            }
            gzwrite($gz, "INSERT INTO `$table` VALUES\n" . implode(",\n", $values) . ";\n");
        }
    }
    gzwrite($gz, "SET FOREIGN_KEY_CHECKS=1;\n");
    gzclose($gz);
    return filesize($path);
}

function xf_backup_zip_code($path) {
    if (!class_exists('ZipArchive')) {
        return new WP_Error('xf_backup', 'PHP zip extension missing; code not zipped.');
    }
    $zip = new ZipArchive();
    if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        return new WP_Error('xf_backup', 'Could not create the code zip.');
    }
    foreach (['plugins/100xfounder' => XF_DIR, 'themes/' . get_stylesheet() => get_stylesheet_directory()] as $prefix => $dir) {
        $dir = rtrim($dir, '/');
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            $zip->addFile($file->getPathname(), $prefix . substr($file->getPathname(), strlen($dir)));
        }
    }
    $zip->close();
    return filesize($path);
}

function xf_backup_delete_dir($dir) {
    foreach (glob($dir . '/*') ?: [] as $f) {
        is_dir($f) ? xf_backup_delete_dir($f) : unlink($f);
    }
    rmdir($dir);
}

function xf_backup_list() {
    $out = [];
    foreach (glob(xf_backup_root() . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        $id = basename($dir);
        if (xf_backup_dir($id)) {
            $out[] = ['id' => $id, 'db' => (int) @filesize("$dir/db.sql.gz"), 'code' => (int) @filesize("$dir/code.zip")];
        }
    }
    usort($out, function ($a, $b) { return strcmp($b['id'], $a['id']); });
    return $out;
}

function xf_backup_create() {
    if (!xf_mutex_acquire('backup', 900)) {
        return new WP_Error('xf_backup_busy', 'A backup is already running.', ['status' => 409]);
    }
    @set_time_limit(0);
    ignore_user_abort(true);
    $id = gmdate('Ymd-His') . '-' . wp_generate_password(12, false);
    $dir = xf_backup_root() . '/' . $id;
    wp_mkdir_p($dir);
    $db = xf_backup_dump_db("$dir/db.sql.gz");
    $code = xf_backup_zip_code("$dir/code.zip");
    xf_mutex_release('backup');
    if (is_wp_error($db)) {
        xf_backup_delete_dir($dir);
        return $db;
    }
    foreach (array_slice(xf_backup_list(), XF_BACKUP_KEEP) as $old) {
        xf_backup_delete_dir(xf_backup_root() . '/' . $old['id']);
    }
    return ['id' => $id, 'files' => ['db' => $db, 'code' => is_wp_error($code) ? $code->get_error_message() : $code]];
}

add_action('rest_api_init', function () {
    $admin = function () { return current_user_can('manage_options'); };
    register_rest_route('xf/v1', '/backup', ['methods' => 'POST', 'permission_callback' => $admin, 'callback' => 'xf_backup_create']);
    register_rest_route('xf/v1', '/backups', ['methods' => 'GET', 'permission_callback' => $admin, 'callback' => 'xf_backup_list']);
    register_rest_route('xf/v1', '/backup/(?P<id>[A-Za-z0-9-]+)/(?P<file>db|code)', [
        'methods' => 'GET',
        'permission_callback' => $admin,
        'callback' => function (WP_REST_Request $r) {
            $dir = xf_backup_dir($r['id']);
            $path = $dir ? $dir . ($r['file'] === 'db' ? '/db.sql.gz' : '/code.zip') : '';
            if (!$path || !is_file($path)) {
                return new WP_Error('xf_backup_missing', 'No such backup file.', ['status' => 404]);
            }
            nocache_headers();
            header('Content-Type: application/octet-stream');
            header('Content-Length: ' . filesize($path));
            header('Content-Disposition: attachment; filename="' . $r['id'] . '-' . basename($path) . '"');
            readfile($path);
            exit;
        },
    ]);
});
