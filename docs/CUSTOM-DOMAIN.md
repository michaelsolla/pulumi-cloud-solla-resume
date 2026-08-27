# Custom domain: resume.solla.app

How **resume.solla.app** (Cloudflare DNS) is mapped to the Cloud Run service with Pulumi, plus the one-time DNS records in Cloudflare.

Reference: [Cloud Run custom domains](https://cloud.google.com/run/docs/mapping-custom-domains)

---

## Overview

```text
Visitor → resume.solla.app (Cloudflare DNS) → Google Cloud Run (hello-world)
```

1. **Verify** domain ownership of `solla.app` in Google (one-time per GCP project).
2. **`pulumi up`** — creates `gcp.cloudrun.DomainMapping` and outputs DNS records.
3. **Cloudflare** — add the DNS record(s) from Pulumi output.
4. **Wait** — Google provisions a managed SSL cert (often ~15 min, up to 24h).

The Cloud Run service is still named `hello-world` (early project name). The public hostname is `resume.solla.app`.

---

## Step 1: Verify domain ownership in Google

Cloud Run requires the **base domain** (`solla.app`) to be verified before mapping `resume.solla.app`.

Check if already verified:

```bash
gcloud domains list-user-verified
```

If `solla.app` is not listed:

```bash
gcloud domains verify solla.app
```

That opens Google Search Console. Add the TXT record Google provides in **Cloudflare DNS** for `solla.app`, then complete verification.

---

## Step 2: Deploy domain mapping with Pulumi

Optional — override the default domain:

```bash
cd infra
pulumi config set customDomain resume.solla.app
```

Deploy:

```bash
pulumi up
```

Show DNS records to add in Cloudflare:

```bash
pulumi stack output dnsRecords
```

Typical record for a subdomain (confirm against the stack output):

| Type  | Name   | Target                 |
|-------|--------|------------------------|
| CNAME | resume | `ghs.googlehosted.com` |

---

## Step 3: Cloudflare DNS (manual)

In [Cloudflare Dashboard](https://dash.cloudflare.com) → **solla.app** → **DNS** → **Records**:

1. Click **Add record**.
2. Use the values from `pulumi stack output dnsRecords`:
   - **Type:** usually `CNAME`
   - **Name:** `resume` (Cloudflare may show `resume.solla.app`)
   - **Target:** value from Pulumi (often `ghs.googlehosted.com`)
   - **Proxy status:** **DNS only** (grey cloud) — recommended for Google-managed Cloud Run certs
   - **TTL:** Auto

3. Save.

### Why DNS only (grey cloud)?

Cloud Run domain mapping uses a **Google-managed certificate**. Orange-cloud (proxied) traffic can interfere with certificate provisioning or cause SSL mismatches. Start with **DNS only**; proxying can be tried later.

### SSL/TLS settings (if needed)

Cloudflare → **SSL/TLS** → set to **Full** if proxying is enabled later. For grey-cloud + Google cert, default settings are usually fine.

---

## Step 4: Test

```bash
# DNS propagation (may take a few minutes)
dig resume.solla.app CNAME +short

# HTTPS (after cert is ready)
curl -I https://resume.solla.app
```

Open https://resume.solla.app in a browser.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Domain mapping fails on `pulumi up` | Verify `solla.app` in Search Console |
| DNS works but no HTTPS | Wait up to 24h for managed cert |
| 525 / SSL errors with orange cloud | Switch record to **DNS only** |
| Wrong service | Confirm `routeName` matches Cloud Run service `hello-world` |

Re-fetch DNS records anytime:

```bash
gcloud beta run domain-mappings describe --domain resume.solla.app --region us-central1
```

---

## Pulumi resources

- `gcp.cloudrun.DomainMapping` — maps `resume.solla.app` → `hello-world`
- Outputs: `customDomainUrl`, `dnsRecords`

To use a different subdomain, update config and re-run `pulumi up`:

```bash
pulumi config set customDomain other.solla.app
pulumi up
```
