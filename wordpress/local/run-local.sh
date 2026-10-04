#!/usr/bin/env bash
# Runs 100xFounder on http://localhost:8080 with WordPress + SQLite (no MySQL needed).
# Requirements: PHP 8.1+ with the sqlite3, gd and zip extensions, plus curl and unzip.
#   macOS:   brew install php
#   Windows: use WSL (Ubuntu), then: sudo apt install php-cli php-sqlite3 php-gd php-zip php-curl php-xml php-mbstring unzip curl
#   Ubuntu:  sudo apt install php-cli php-sqlite3 php-gd php-zip php-curl php-xml php-mbstring unzip curl
#
# Usage:  bash wordpress/local/run-local.sh            (set up on first run, then start)
#         bash wordpress/local/run-local.sh --reset    (wipe the local site and start fresh)
set -euo pipefail

PORT="${PORT:-8080}"
URL="http://localhost:${PORT}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$HERE/../100xfounder" && pwd)"
SITE="$HERE/.site"
WP_DIR="$SITE/wordpress"
WPCLI="$SITE/wp-cli.phar"
ROOT_FLAG=""
[[ "$(id -u)" == "0" ]] && ROOT_FLAG="--allow-root"
wp() { php -d memory_limit=512M "$WPCLI" --path="$WP_DIR" $ROOT_FLAG "$@"; }

for cmd in php curl unzip; do
  command -v "$cmd" >/dev/null || { echo "Missing '$cmd'. See the requirements at the top of this script."; exit 1; }
done
for ext in sqlite3 pdo_sqlite gd; do
  php -m | grep -qi "^$ext$" || { echo "PHP extension '$ext' is missing. See the requirements at the top of this script."; exit 1; }
done

if [[ "${1:-}" == "--reset" ]]; then
  rm -rf "$SITE"
fi

if [[ ! -f "$WP_DIR/wp-config.php" ]]; then
  echo "→ Downloading WordPress, the SQLite driver and WP-CLI…"
  mkdir -p "$SITE"
  curl -fsSL https://wordpress.org/latest.tar.gz | tar xz -C "$SITE"
  curl -fsSL -o "$SITE/sqlite.zip" https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip
  unzip -q -o "$SITE/sqlite.zip" -d "$WP_DIR/wp-content/plugins"
  sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$WP_DIR/wp-content/plugins/sqlite-database-integration#" \
      -e "s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" \
      "$WP_DIR/wp-content/plugins/sqlite-database-integration/db.copy" > "$WP_DIR/wp-content/db.php"
  curl -fsSL -o "$WPCLI" https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar

  echo "→ Installing WordPress…"
  wp config create --dbname=wp --dbuser=wp --dbpass=wp --skip-check --quiet
  wp config set WP_DEBUG true --raw --quiet
  wp config set WP_DEBUG_DISPLAY false --raw --quiet
  wp core install --url="$URL" --title="100xFounder" --admin_user=admin --admin_password=admin \
    --admin_email=admin@example.com --skip-email --quiet

  echo "→ Installing the 100xFounder plugin (linked to your repo, so code edits show up live)…"
  ln -sfn "$PLUGIN_DIR" "$WP_DIR/wp-content/plugins/100xfounder"
  wp plugin activate 100xfounder --quiet

  echo "→ Setting the home page and importing the old site's data…"
  wp eval '
    $p = get_option("xf_pages");
    update_option("show_on_front", "page");
    update_option("page_on_front", $p["home"]);
    do { $r = xf_import_startups_batch(); } while ($r["done"] < $r["total"]);
    echo "Imported {$r["done"]} startups\n";
    $b = xf_import_blog_posts();
    echo "Imported {$b["created"]} blog posts\n";
    // Publish the imported posts locally so the news layout has content to show.
    foreach (get_posts(["post_type" => "post", "post_status" => "draft", "numberposts" => -1, "fields" => "ids"]) as $id) {
      wp_update_post(["ID" => $id, "post_status" => "publish"]);
    }
  '
fi

# Keep the site URL in sync if PORT changed.
wp option update home "$URL" --quiet
wp option update siteurl "$URL" --quiet

cat <<INFO

  100xFounder is running at:  $URL
  Dashboard:                  $URL/wp-admin   (username: admin, password: admin)

  Press Ctrl+C to stop. Run this script again to restart.

INFO
cd "$WP_DIR"
exec php -d memory_limit=512M -d upload_max_filesize=10M -d post_max_size=12M -S "localhost:$PORT" "$HERE/router.php"
