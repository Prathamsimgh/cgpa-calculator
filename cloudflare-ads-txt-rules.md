# Cloudflare rules for /ads.txt (AdSense crawler access)

AdSense's crawler must be able to fetch `https://YOUR-DOMAIN/ads.txt` at all
times. Cloudflare's cache and security features can block or serve a stale
copy, which causes "ads.txt not found" / "site not ready" states in AdSense.
Create the two rules below in the Cloudflare dashboard
(dash.cloudflare.com → select your domain). Both rules match ONLY the exact
path `/ads.txt`, so nothing else on the site is affected.

## Rule 1 — Cache Rule: bypass cache for /ads.txt

1. Go to **Caching → Cache Rules → Create rule**.
2. Rule name: `ads.txt - Bypass Cache`
3. "When incoming requests match…": choose **Custom filter expression** and set:
   - Field: `URI Path` · Operator: `equals` · Value: `/ads.txt`
   - (Expression preview: `http.request.uri.path eq "/ads.txt"`)
4. "Then…": **Cache eligibility → Bypass cache**.
5. **Deploy**.

Effect: every request for /ads.txt hits the origin, so AdSense always sees
the live file.

## Rule 2 — Security Rule: skip WAF / bot checks for /ads.txt

1. Go to **Security → Security rules → Create rule** (WAF custom rules).
2. Rule name: `ads.txt - Skip security`
3. "When incoming requests match…": **Custom filter expression**:
   - Field: `URI Path` · Operator: `equals` · Value: `/ads.txt`
4. "Then…": choose action **Skip**.
5. In "Skip the following", tick:
   - All Managed Rulesets (WAF)
   - Super Bot Fight Mode (if enabled on your plan)
   - Browser Integrity Check
   - (Leave rate-limiting rules unticked unless you use them.)
6. **Deploy**.

Effect: Google's crawler is never served a managed challenge or blocked by
WAF rules when fetching /ads.txt.

## Verify

- `curl -s https://YOUR-DOMAIN/ads.txt` should print your ads.txt content.
- In Cloudflare: **Caching → Configuration → Purge Everything** once after
  deploying, so no stale copy lingers.
- In AdSense: **Sites → your domain** — the ads.txt status should flip to
  "Authorized" within a few days of the crawler's next visit.

## Notes

- These rules are needed on every domain you add to the same AdSense
  account, since ads.txt is per-domain.
- If you later move DNS away from Cloudflare, delete both rules — they only
  apply while Cloudflare proxies the domain (orange cloud).
