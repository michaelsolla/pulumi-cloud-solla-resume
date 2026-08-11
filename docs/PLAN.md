# Cloud Run Hello World — Project Plan

Infrastructure-as-code showcase: a containerized **Hello World** app on **Google Cloud Run**, provisioned entirely with **Pulumi TypeScript**. A custom domain mapping comes in Phase 2.

**GCP project:** `pulumi-gcp-ed-msolla`  
**Region:** `us-central1`

---

## Architecture

```mermaid
flowchart LR
  subgraph repo [This repo]
    App[Hello World app + Dockerfile]
    Pulumi[Pulumi TypeScript program]
  end

  subgraph gcp [GCP]
    AR[Artifact Registry]
    CR[Cloud Run service]
    DM[Domain mapping — Phase 2]
  end

  subgraph dns [Your domain registrar — Phase 2]
    DNS[CNAME / A records]
  end

  Pulumi --> AR
  Pulumi --> CR
  Pulumi --> DM
  App --> AR
  AR --> CR
  DM --> DNS
  DNS --> CR
```

---

## Repository layout

```
Pulumi-cloud-solla-resume/
├── app/                    # Hello World container source
│   ├── Dockerfile
│   └── server.js
├── infra/                  # Pulumi TypeScript program
│   ├── Pulumi.yaml
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── PLAN.md             # This file
├── .env                    # Local only (gitignored)
└── README.md
```

---

## Phase 1 — Core showcase (current)

| Piece | Purpose |
|--------|---------|
| **`app/`** | Minimal HTTP server returning `"Hello, World!"` |
| **`Dockerfile`** | Container image for Cloud Run (listens on `PORT`, default 8080) |
| **`infra/`** | Pulumi program that provisions GCP resources |
| **Artifact Registry repo** | Stores the Docker image |
| **`@pulumi/docker` `Image`** | Builds locally and pushes to Artifact Registry during `pulumi up` |
| **Cloud Run v2 service** | Runs the container; scales to zero when idle |
| **IAM** | Public `run.invoker` for demo; Artifact Registry read for Cloud Run |
| **Pulumi outputs** | Service URL (`*.run.app`) for browser testing |

### Pulumi resources (Phase 1)

- `gcp.projects.Service` — enable required APIs
- `gcp.artifactregistry.Repository` — Docker image repository
- `gcp.artifactregistry.RepositoryIamMember` — Cloud Run can pull images
- `docker.Image` — build + push container
- `gcp.cloudrunv2.Service` — run the container
- `gcp.cloudrunv2.ServiceIamMember` — allow unauthenticated HTTP (demo)

### APIs enabled by Pulumi

- `artifactregistry.googleapis.com`
- `run.googleapis.com`

### Image build strategy: `@pulumi/docker`

Phase 1 uses the [**Pulumi Docker provider**](https://www.pulumi.com/registry/packages/docker/) (`@pulumi/docker`), not a separate `pulumi docker` CLI command.

**What it does:**

1. During `pulumi up`, Pulumi declares a `docker.Image` resource in TypeScript.
2. The provider uses your **local Docker daemon** to `docker build` from `app/`.
3. It then **pushes** the image to Artifact Registry (using credentials from `gcloud auth configure-docker`).
4. Cloud Run references that image URL; Pulumi tracks the image as part of infrastructure state.

**Why use it for this showcase:**

- Build, push, and deploy are orchestrated in one `pulumi up`.
- The full pipeline is visible in code — good for a portfolio repo.
- No separate CI step required for the first iteration.

**Prerequisites before `pulumi up`:**

```bash
# Docker Desktop (or equivalent) must be running
docker info

# One-time: teach Docker to authenticate to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

**Container platform: `linux/amd64`**

Images are built for **amd64** because Cloud Run requires the Linux x86_64 ABI. On Apple Silicon Macs, Docker uses emulation for this build (slower than native ARM, but required for Cloud Run). The Pulumi program sets `platform: "linux/amd64"` on the `docker.Image` resource.

**Local test (matches Cloud Run architecture):**

```bash
cd app
docker build --platform linux/amd64 -t hello-world-local .
docker run --rm -p 8080:8080 hello-world-local
curl http://localhost:8080
```

**Alternatives (later):**

| Approach | When to use |
|----------|-------------|
| **Cloud Build** | Production CI/CD; builds in GCP, not on your laptop |
| **Manual `docker push`** | Quick experiments; less “all-in-Pulumi” |
| **`@pulumi/docker-build`** | Newer provider; BuildKit features |

### Phase 1 workflow

```bash
cd infra
npm install
pulumi stack init dev          # first time only
pulumi config set gcp:project pulumi-gcp-ed-msolla
pulumi config set gcp:region us-central1
pulumi preview
pulumi up
```

Expected outputs:

- `serviceUrl` — open in a browser
- `imageUrl` — full Artifact Registry image reference
- `repositoryUrl` — registry location

### Cost ballpark

Cloud Run free tier covers a hello-world demo (scale-to-zero, minimal traffic). Artifact Registry has small storage costs. No charge for the default `*.run.app` URL.

---

## Phase 2 — Custom domain (later)

When a domain is ready (e.g. `hello.example.com`):

| Step | What happens |
|------|----------------|
| **Domain verification** | Prove ownership in GCP |
| **Cloud Run domain mapping** | Map subdomain → Cloud Run service |
| **DNS records** | Add CNAME/A at your registrar (Pulumi outputs exact values) |
| **HTTPS** | Google-managed certificate after DNS propagates |

**Information needed for Phase 2:**

- Domain name (e.g. `example.com`)
- Subdomain (e.g. `pulumi.example.com` — subdomains are easier than apex)
- DNS host (Cloudflare, Namecheap, Route53, etc.)

**Additional Pulumi resources (Phase 2):**

- `gcp.cloudrun.DomainMapping` (or load balancer pattern for apex domains)
- DNS record outputs for registrar configuration

---

## Known follow-ups

Not blocking, not urgent — the live site is unaffected by these. Tracked here so
they don't get forgotten mid-interview-prep.

- **Cloud Run doesn't redeploy on a new image push.** `hello-world-image`'s
  `imageName` output is a floating `:latest` tag (a static string), so Pulumi
  never sees a diff on that property and `gcp.cloudrunv2.Service` doesn't
  create a new revision, even though a new digest was just pushed underneath
  the same tag. Fix: reference `image.repoDigest` (the immutable
  `...@sha256:...` reference `@pulumi/docker`'s `Image` resource outputs)
  instead of `image.imageName` in the Cloud Run container spec. That also
  gives exact, unambiguous rollback — you always know precisely which digest
  is live.
- **Artifact Registry has no cleanup policy.** Every `pulumi up` (local or CI)
  pushes a new image with nothing pruning old ones, so storage — and cost —
  grows unbounded over time. Fix: add `cleanupPolicies` to the
  `gcp.artifactregistry.Repository` resource (e.g. keep the most recent N
  tagged versions, or delete anything older than X days). Runs natively in
  GCP, no extra services needed.

---

## Roadmap checklist

- [x] Repo scaffolding (GitHub + GitLab)
- [x] GCP account + local `gcloud` auth
- [x] Security-focused `.gitignore`
- [x] Phase 1 plan documented (this file)
- [x] Phase 1 implemented and deployed
- [x] Verify `*.run.app` URL in browser
- [x] Phase 2: custom domain + DNS
- [x] GitLab CI for `pulumi preview`/`up` via Workload Identity Federation (keyless)
- [ ] Cloud Run redeploys on new image digest (see Known follow-ups)
- [ ] Artifact Registry cleanup policy (see Known follow-ups)
- [ ] AWS deployment target

---

## Security notes

- Never commit `.env`, service account JSON, or files matching `*-credentials.json`/`service-account*.json`.
- `Pulumi.yaml` and stack config files (e.g. `Pulumi.dev.yaml`) **are** committed —
  they hold no secrets today (plain `gcp:project`/`gcp:region`), and Pulumi
  encrypts any future `--secret` values as `secure:` blocks even when committed.
  CI needs these files checked out to resolve required config like `gcp:project`.
- Phase 1 allows **unauthenticated** access for demo purposes; lock down before production.
- Prefer Application Default Credentials locally; avoid downloading service account keys.
- GitLab CI authenticates keyless via GCP Workload Identity Federation (see
  `infra/gitlab-wif.ts` and `.gitlab-ci.yml`) — no static service account key
  is stored anywhere. `PULUMI_ACCESS_TOKEN` (masked + protected GitLab CI/CD
  variable) is the only real secret in the pipeline.
