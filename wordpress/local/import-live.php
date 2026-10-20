<?php
/**
 * Load a live backup dump (backup.php's db.sql.gz) into the local SQLite site, then make the copy
 * safe: no scheduled jobs, no mail, no Instagram, no AI or indexing calls.
 *
 *   php wp-cli.phar --path=.site/wordpress eval-file import-live.php <path/to/db.sql.gz>
 */
global $wpdb;
$dump = $args[0] ?? '';
if (!is_readable($dump)) {
    WP_CLI::error('Pass the path to db.sql.gz');
}
$gz = gzopen($dump, 'rb');
$buf = '';
$n = 0;
$fail = 0;
$wpdb->suppress_errors(true);
// backup.php escapes newlines inside values, so ";\n" only ever ends a statement.
while (!gzeof($gz)) {
    $buf .= gzread($gz, 1 << 20);
    while (($p = strpos($buf, ";\n")) !== false) {
        $sql = trim(substr($buf, 0, $p));
        $buf = substr($buf, $p + 2);
        if ($sql === '' || strpos($sql, '--') === 0 || stripos($sql, 'SET ') === 0) {
            continue;
        }
        if ($wpdb->query($sql) === false) {
            $fail++;
            if ($fail <= 5) {
                WP_CLI::warning(substr($sql, 0, 120) . ' … ' . $wpdb->last_error);
            }
        }
        if (++$n % 200 === 0) {
            WP_CLI::log("$n statements…");
        }
    }
}
gzclose($gz);
WP_CLI::log("Imported $n statements, $fail failed.");
