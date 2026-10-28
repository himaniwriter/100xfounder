# Action plan: 100xfounder.com (20 Oct 2026)

## Phase 1: critical (this week)

1. **Save the Hostinger token in the Keychain** (owner, one command), so Astro rebuilds every 30 minutes and no stale noindex pages remain:
   `security add-generic-password -s 100xfounder-hostinger -a hostinger -w`
2. **Check that Hostinger's bot protection never challenges Googlebot,** and whitelist PSI/Lighthouse (hPanel → Security).
3. **Add the disclosure line next to Digihandler** in /best-education-marketing-agency-india/.
4. **Add `validThrough`** to JobPosting.
5. **Fix pagination:** each /startups/ page gets a self-canonical (not page 1) and a real `/page/N/` path, and out-of-range pages return 404.

## Phase 2: high impact (weeks 2–3)

6. **Internal linking.** Articles link to the startups and companies they mention, and listings link to related articles. The `internal-links.php` module exists; extend it to auto-link listing names.
7. **Make the funding tracker real:** add the rounds already sourced in articles (Simple Energy, DATOMS and others). If it stays empty, remove the promise.
8. **Schema clean-up:**
   - evergreen posts use Article
   - dateModified is never earlier than datePublished
   - decode entities
   - reference Organization by @id
   - add a Person entity for the pen name
   - strip utm tags from sameAs
9. **De-template listings:**
   - one "Pricing" heading per page
   - hide "0 taps" and the empty reviews blocks until there's data
10. **Images:**
    - mirror and resize hot-linked images
    - serve WebP with `sizes`
    - put fetchpriority on the hero image
    - set width and height on every image

## Phase 3: authority and focus (month 2)

11. **Build a brand entity:**
    - LinkedIn page, X, YouTube and a Crunchbase profile
    - add them all to Organization `sameAs`
12. **Earn links and mentions:** switch the founder-verification outreach and milestone emails back on, and push founders to embed their badges and use their share kits.
13. **Narrow the focus:** grow 2–3 clusters in depth (Indian startup funding, AI tools for startups, startup jobs/salary) and stop adding off-topic pieces like tax, immigration and tool reviews.
14. **Answer-first rewrite** of the top 20 articles: a 40–60 word direct answer, question headings, an updated date and a byline on profiles.

## Phase 4: monitor (ongoing)

15. **Search Console every week:** watch the indexed count and the trend of "crawled – not indexed".
16. **Re-run this audit in 4 weeks** and compare it with this baseline.
