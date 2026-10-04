# Going live on WordPress (Hostinger)

The whole site now runs on WordPress using the **100xFounder** plugin (`wordpress/100xfounder/`, packaged as `wordpress/dist/100xfounder.zip`). The Next.js app in this repo is no longer needed for the live site.

## 0. Try it on your own computer first

**Option A, one command (Mac, Linux, or Windows with WSL).** You need PHP 8.1+:
- **Mac:** `brew install php`
- **Ubuntu or WSL:** `sudo apt install php-cli php-sqlite3 php-gd php-zip php-curl php-xml php-mbstring unzip curl`

Then, from the repo folder:

```bash
bash wordpress/local/run-local.sh
```

The script:
- downloads WordPress, using SQLite so you don't need MySQL
- installs the plugin, imports the 1,258 startups and the old blog posts, and sets the home page
- starts the site at **http://localhost:8080**

| | |
|---|---|
| Dashboard | http://localhost:8080/wp-admin |
| Username | `admin` |
| Password | `admin` |

Other things to know:
- Press **Ctrl+C** to stop. Run the script again to restart.
- Add `--reset` to start from scratch.
- Plugin code changes show up as soon as you refresh.

**Option B, no command line.** Install the free [Local](https://localwp.com) app and create a new WordPress site. Open its admin and go to **Plugins → Add New → Upload Plugin**, upload `wordpress/dist/100xfounder.zip` and activate it. Then use **100xFounder → Import data**.

**Locally, emails won't actually send** unless you enter a real mailbox in Settings, and the Product Hunt import needs your token. Everything else works offline.

## 1. Install WordPress on 100xfounder.com (hPanel)

1. **Back up the current site.** In hPanel → **Files → File Manager → public_html**, download or rename the existing files (the old static site) so WordPress can take over.
2. Go to hPanel → **Websites → 100xfounder.com → Auto Installer → WordPress**.
3. Choose an admin **username**, a strong **password** and your **email**. These are your dashboard login.
4. When it finishes, log in at **https://100xfounder.com/wp-admin**.

## 2. Install the plugin

1. Go to WordPress → **Plugins → Add New → Upload Plugin**, choose `100xfounder.zip`, then **Install** and **Activate**.
2. Activation creates the following:
   - **Pages:** Home, News, Startups, Launches, Founder Spotlights, About, Contact, Privacy Policy, Terms and Disclaimer.
   - **News categories:** Funding, Startup News, Founder Stories, AI & Deeptech, Fintech, SaaS, eCommerce, EV & Mobility, Web3, In Depth, Next Wave and Reports.
   - **The main menu.**
   - **Pretty permalinks.**
3. Open **100xFounder → Dashboard**, then in the Setup list click **use the 100xFounder home page**.
4. Optionally, open **100xFounder → Import data**:
   - **Import startups** brings in the 1,258 startups. These stay hidden from Google until they have real content.
   - **Import blog posts** brings in the 15 old posts as drafts.

Then go to **Appearance → Themes → Add New → Upload Theme**, choose `100xfounder-theme.zip`, and **Activate** it. This is the site design (the canvas).

### Or deploy both in one command (from your computer)

Once WordPress is installed, `wordpress/deploy/deploy-hostinger.sh` backs up the database, uploads both zips over SSH, activates them and sets permalinks. Run it from a terminal on your machine; it asks for the SSH password, which is never stored:

```
XF_SSH_HOST=145.79.213.114 XF_SSH_PORT=65002 XF_SSH_USER=u840917216 bash wordpress/deploy/deploy-hostinger.sh
```

Turn on **SSH access** first in hPanel → **Advanced → SSH Access**. Using an SSH key instead of the password is safer.

## 3. Settings (100xFounder → Settings)

| Setting | What to enter |
|---|---|
| Product Hunt developer token | From producthunt.com/v2/oauth/applications. Product Hunt's API terms restrict commercial use, so email them about your use case. |
| Mailbox address and password | Create the mailbox in hPanel → **Emails** (e.g. `hello@100xfounder.com`). SMTP and IMAP default to Hostinger's servers. |
| Postal address | Required by CAN-SPAM. Sending stays off until it's set. |
| Daily sending limit | Start at **10**, then raise it over 2–3 weeks to 30–50. Hostinger limits sending per mailbox and forbids bulk spam. |
| Send outreach emails | Tick it once everything above is set. |
| AdSense publisher ID | Prefilled with `ca-pub-4106130565884060`. |
| Job sources (Jobs section) | Pre-filled with 23 official company careers feeds (Greenhouse, Lever, Ashby). Add a company as `ats:board`, e.g. `greenhouse:groww`. Jobs sync daily; closed roles are taken down automatically. |
| Google service account JSON (Jobs section) | Optional. Lets new and closed job pages be sent to Google's Indexing API (job pages only, up to 190 a day). Create it in Google Cloud, enable the Indexing API, and add the service account email as an **Owner** in Search Console. You can put it in `wp-config.php` as `XF_GOOGLE_SERVICE_ACCOUNT` instead. |

- **Secrets in `wp-config.php` (optional):** you can keep secrets out of the database with `define('XF_SMTP_PASS', '…'); define('XF_PH_TOKEN', '…');`
- **Reply and bounce detection:** this needs PHP's **imap** extension. Turn it on in hPanel → **Advanced → PHP Configuration → PHP extensions → imap**.
- **Email records (SPF, DKIM, DMARC):** in hPanel → **Emails**, use "Connect domain" or the DNS records it suggests, so outreach lands in the inbox.

## 4. Daily schedule

WordPress runs the routine daily at 14:00 UTC, but WP-Cron only fires when someone visits the site. For reliability, add the cron job shown at the bottom of **100xFounder → Settings** in hPanel → **Advanced → Cron Jobs**, set to once a day:

```
wget -q -O /dev/null "https://100xfounder.com/wp-json/xf/v1/run?key=YOUR_KEY"
```

## 5. Daily workflow

- **100xFounder → Dashboard** shows:
  - setup status and the last run's results
  - every outreach contact and its status
  - the Instagram queue, where you download the slides, copy the caption, post, and click **Mark posted**
- **Founder Spotlights → Pending:** read each submission, edit it if needed, then **Publish**. Publishing queues its Instagram carousel.
- **Posts → Add New:** write news.
  - Pick a **category**, which decides the homepage section.
  - Set a **featured image**, which the card layouts need.
  - Mark a post **sticky** to make it the lead story.

## 6. AdSense approval checklist

**Already handled by the plugin:**
- The AdSense script is in the `<head>` of content pages and is left off thin listings and the outreach forms.
- `https://100xfounder.com/ads.txt` is served automatically.
- The About, Contact (with a working form), Privacy Policy (with AdSense cookie wording), Terms and Disclaimer pages exist, and the footer links to them.
- Thin startup listings are hidden from Google and kept out of the sitemap.
- The layout is mobile-friendly, and ad slots reserve their space so pages don't jump.

**Still up to you:**
- Publish **20–30 original, useful articles** before applying. Thin or copied content is the most common reason AdSense rejects a site.
- In AdSense → **Privacy & messaging**, turn on Google's consent message for EEA/UK visitors.
- After approval, turn on **Auto ads**. Optionally create a Display ad unit and paste its slot ID in Settings for fixed placements.

## Old URLs

Old Next.js URLs redirect permanently (301) to their new equivalents:

| Old URL | Redirects to |
|---|---|
| `/company/<slug>` | `/startup/<slug>` |
| `/blog/<slug>` | the WordPress post |
| `/founders` | `/startups` |
| `/pricing` | `/contact` |
