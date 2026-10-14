<?php
/**
 * AI content module (owner-approved 2026-10-12): Claude from the WP dashboard,
 * under a hard total budget.
 *
 *   ai-client.php     settings, prices, the spend ledger, the budget guard, the API call
 *                     (WP AI Client first, direct Messages API second, mock for local tests)
 *                     and the small WP-Cron batch worker.
 *   ai-translate.php  translations of articles, guides and key pages into /{lang}/{slug}/,
 *                     hreflang, self-canonicals, language sitemaps, noindex until approved.
 *   ai-thin.php       thin-page list and "Improve with Claude" drafts (never auto-published).
 *   ai-admin.php      100xFounder → AI content.
 */
if (!defined('ABSPATH')) {
    exit;
}

// The modules depend on each other: load all of them or none.
$xf_ai_files = ['ai-client.php', 'ai-translate.php', 'ai-thin.php'];
if (is_admin()) {
    $xf_ai_files[] = 'ai-admin.php';
}
foreach ($xf_ai_files as $xf_ai_file) {
    if (!is_readable(__DIR__ . '/' . $xf_ai_file)) {
        return;
    }
}
foreach ($xf_ai_files as $xf_ai_file) {
    require_once __DIR__ . '/' . $xf_ai_file;
}
unset($xf_ai_files, $xf_ai_file);
