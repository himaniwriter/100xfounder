const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.SMOKE_BASE_URL || 'https://100xfounder.com';

function attachIssueCollectors(page, issues) {
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message });
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure();
    issues.push({
      type: 'requestfailed',
      url: request.url(),
      method: request.method(),
      message: failure ? failure.errorText : 'unknown',
    });
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500 && !url.includes('/_next/')) {
      issues.push({ type: 'http5xx', status, url });
    }
  });
}

test.describe('100Xfounder smoke navigation', () => {
  test('main pages load and are usable', async ({ page }) => {
    test.setTimeout(180000);

    const issues = [];
    attachIssueCollectors(page, issues);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Home$/ })).toBeVisible();

    const navChecks = [
      { name: 'Startup', urlPart: '/startups' },
      { name: 'Blog', urlPart: '/blog' },
      { name: 'Signals', urlPart: '/signals' },
      { name: 'Pricing', urlPart: '/pricing' },
    ];

    for (const step of navChecks) {
      await page.getByRole('link', { name: new RegExp(`^${step.name}$`, 'i') }).first().click();
      await page.waitForURL(new RegExp(step.urlPart.replace('/', '\\/')));
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/this page could not be found|error 404/i);
    }

    await page.goto(`${BASE_URL}/founders`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading').first()).toContainText(/Founder Directory|Founders/i);
    const founderCardLink = page.locator('a[href^="/founders/"]').first();
    if (await founderCardLink.count()) {
      await founderCardLink.click();
      await page.waitForURL(/\/founders\//);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/this page could not be found|error 404/i);
      await page.goBack({ waitUntil: 'domcontentloaded' });
    }

    await page.goto(`${BASE_URL}/countries`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading').first()).toContainText(/Countries|Country/i);
    const countryLink = page.locator('a[href^="/countries/"]').first();
    if (await countryLink.count()) {
      await countryLink.click();
      await page.waitForURL(/\/countries\//);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/this page could not be found|error 404/i);
      await page.goBack({ waitUntil: 'domcontentloaded' });
    }

    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'domcontentloaded' });
    const blogPostLink = page.locator('a[href^="/blog/"]').first();
    if (await blogPostLink.count()) {
      await blogPostLink.click();
      await page.waitForURL(/\/blog\//);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/this page could not be found|error 404/i);
    }

    await page.getByRole('link', { name: /Get Featured/i }).first().click();
    await page.waitForURL(/\/get-featured/);
    await expect(page.locator('main')).toBeVisible();

    const filtered = issues.filter((issue) => {
      const message = (issue.message || '').toLowerCase();
      const url = (issue.url || '').toLowerCase();
      // Ignore known noisy client-side extensions and third-party trackers.
      if (message.includes('net::err_blocked_by_client')) return false;
      if (message.includes('net::err_aborted') && (url.includes('_rsc=') || url.includes('/api/auth/me'))) return false;
      if (url.includes('unavatar.io')) return false;
      if (message.includes('notsameorigin') || message.includes('blocked_by_orb')) return false;
      if (url.includes('clarity.ms')) return false;
      if (url.includes('google-analytics.com')) return false;
      return true;
    });

    if (filtered.length > 0) {
      test.info().attach('smoke-issues.json', {
        body: Buffer.from(JSON.stringify(filtered, null, 2), 'utf-8'),
        contentType: 'application/json',
      });
    }

    expect(filtered, `Found runtime/network issues: ${JSON.stringify(filtered, null, 2)}`).toEqual([]);
  });
});
