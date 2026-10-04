<?php
if (!defined('ABSPATH')) {
    exit;
}

function xf_table($name) {
    global $wpdb;
    return $wpdb->prefix . 'xf_' . $name;
}

/** Outreach bookkeeping lives in custom tables; startups and spotlights are posts. */
function xf_install_schema() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();

    dbDelta("CREATE TABLE " . xf_table('contacts') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  startup_id bigint(20) unsigned NOT NULL,
  email varchar(190) NOT NULL,
  name varchar(190) DEFAULT NULL,
  twitter_url varchar(255) DEFAULT NULL,
  linkedin_url varchar(255) DEFAULT NULL,
  discovered_from varchar(255) DEFAULT NULL,
  status varchar(30) NOT NULL DEFAULT 'queued',
  step tinyint(3) unsigned NOT NULL DEFAULT 0,
  next_send_at datetime DEFAULT NULL,
  last_sent_at datetime DEFAULT NULL,
  replied_at datetime DEFAULT NULL,
  token varchar(64) NOT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY email (email),
  UNIQUE KEY token (token),
  KEY status_next (status,next_send_at),
  KEY startup_id (startup_id)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('messages') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  contact_id bigint(20) unsigned NOT NULL,
  step tinyint(3) unsigned NOT NULL,
  subject varchar(255) NOT NULL,
  body longtext NOT NULL,
  message_id varchar(255) DEFAULT NULL,
  status varchar(20) NOT NULL DEFAULT 'sent',
  error text,
  sent_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY contact_id (contact_id),
  KEY sent_at (sent_at)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('suppressions') . " (
  email varchar(190) NOT NULL,
  reason varchar(50) NOT NULL,
  created_at datetime NOT NULL,
  PRIMARY KEY  (email)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('ig_queue') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  kind varchar(30) NOT NULL,
  ref_key varchar(100) NOT NULL,
  title varchar(255) NOT NULL,
  caption text NOT NULL,
  slide_count tinyint(3) unsigned NOT NULL,
  payload longtext NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'ready',
  posted_at datetime DEFAULT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY ref_key (ref_key),
  KEY status_created (status,created_at)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('subscribers') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(190) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'site',
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY email (email)
) $charset;");

    dbDelta("CREATE TABLE " . xf_table('queue') . " (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  type varchar(30) NOT NULL DEFAULT 'news',
  title varchar(255) NOT NULL,
  notes text,
  source_urls text,
  status varchar(20) NOT NULL DEFAULT 'queued',
  priority tinyint(3) unsigned NOT NULL DEFAULT 5,
  post_id bigint(20) unsigned DEFAULT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY type_status (type,status,priority)
) $charset;");

    update_option('xf_db_version', XF_DB_VERSION);
}

function xf_now() {
    return gmdate('Y-m-d H:i:s');
}
