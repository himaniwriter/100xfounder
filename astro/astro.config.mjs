// Static build of the routes moved off WordPress. Output is uploaded to public_html/astro/ and
// served for "/" by an .htaccess rule (see deploy.sh); assets are therefore prefixed with /astro.
import { defineConfig } from 'astro/config';
import { capLinksIntegration } from './src/lib/caplinks.js';
import { WP } from './src/lib/wp.js';

export default defineConfig({
  output: 'static',
  base: '/',
  site: 'https://100xfounder.com',
  build: { assets: '_astro', assetsPrefix: '/astro' },
  devToolbar: { enabled: false },
  integrations: [capLinksIntegration(new URL(WP).hostname)],
});
