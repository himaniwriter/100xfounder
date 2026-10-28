// WordPress is the source of truth: every build reads the plugin's headless endpoints.
export const WP = (process.env.XF_WP_URL || 'https://100xfounder.com').replace(/\/$/, '');

export async function wp(route, params = {}) {
  const url = `${WP}/wp-json/xf/v1/${route}?${new URLSearchParams(params)}`;
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': '100xfounder-astro-build' } });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      const d = await r.json();
      if (!d || d.error || d.code) throw new Error(`bad payload from ${url}: ${JSON.stringify(d).slice(0, 200)}`);
      return d;
    } catch (e) {
      last = e;
      await new Promise((ok) => setTimeout(ok, 3000));
    }
  }
  throw last; // a failed fetch fails the build, so a broken page is never uploaded
}
