// Port of xf_cap_external_links() (wordpress/100xfounder/includes/external-links.php): WordPress caps
// clickable external links inside <main> per URL at render time, so the static page must do the same.
// Keep the two in step; the parity gate compares the external links left in <main>.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export const crc32 = (s) => {
  let c = 0xffffffff;
  for (const b of Buffer.from(s, 'utf8')) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const strip = (h) => (h || '').toLowerCase().replace(/^www\./, '');
const decode = (s) => s.replace(/&#0?38;|&amp;/g, '&');

export function capExternalLinks(html, path, homeHost) {
  const keep = crc32(path) % 3;
  const start = html.toLowerCase().indexOf('<main');
  const end = html.toLowerCase().lastIndexOf('</main>');
  if (start < 0 || end < start) return html;
  const home = strip(homeHost);
  let kept = 0;
  const main = html.slice(start, end).replace(/<a\b([^>]*)>((?:(?!<a\b)[\s\S])*?)<\/a>/gi, (all, attrs, inner) => {
    const h = attrs.match(/\bhref=(["'])(https?:\/\/[^"']+)\1/i);
    if (!h) return all;
    const href = decode(h[2]);
    let host = '';
    try { host = strip(new URL(href).hostname); } catch { /* unparsable: treat as local */ }
    if (!host || host === home || host.endsWith('.' + home)) return all;
    if (/\brel=(["'])[^"']*\bsponsored\b/i.test(attrs) || /<img/i.test(inner)
      || /^https?:\/\/(?:www\.)?(?:linkedin\.com\/sharing\/|x\.com\/intent\/|twitter\.com\/intent\/|wa\.me\/)/i.test(href)) return all;
    if (kept < keep) { kept++; return all; }
    if (/\bclass=(["'])[^"']*\b(?:btn|button)\b/i.test(attrs)) return '';
    return '<span class="xf-ext">' + inner.replace(/↗/g, '').trim() + '</span>';
  });
  return html.slice(0, start) + main + html.slice(end);
}

/** Astro integration: apply the cap to every built page. */
export function capLinksIntegration(homeHost) {
  return {
    name: 'xf-cap-external-links',
    hooks: {
      'astro:build:done': ({ pages, dir }) => {
        for (const { pathname } of pages) {
          const rel = pathname ? pathname.replace(/^\/|\/?$/g, '') + '/' : '';
          const file = fileURLToPath(new URL(rel + 'index.html', dir));
          const path = '/' + rel; // WordPress keys the cap on the request path
          writeFileSync(file, capExternalLinks(readFileSync(file, 'utf8'), path, homeHost));
        }
      },
    },
  };
}

// Self-check against PHP: sprintf('%u', crc32('/')) = 2043925204, so "/" keeps 1 link.
if (crc32('/') !== 2043925204) throw new Error('crc32 port is wrong');
