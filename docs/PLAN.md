# Solla resume site — project plan

Portfolio and skill-building repo: a containerized resume app on **GCP**, provisioned with **Pulumi TypeScript**. Cloud Run is the always-on public site. Local **kind** and on-demand **GKE Autopilot** are proven. `resume.solla.app` is meant to be readable to an **engineering manager** in about 90 seconds: architecture, trade-offs, honest status, and security. Terraform is an optional later appendix — this repo stays Pulumi-first.

**GCP project:** `pulumi-gcp-ed-msolla`  
**Region:** `us-central1`  
**Public URL:** [https://resume.solla.app](https://resume.solla.app)

Check in on **GitHub**. GitLab is the production forge (mirror Action). See [FORGES.md](FORGES.md). Do not dual-push.

---

## Architecture (current)

```mermaid
flowchart LR
  subgraph inlet [GitHub — inlet]
    App[Resume app + Dockerfile]
    PulumiCR[Pulumi Cloud Run]
    PulumiKind[Pulumi kind]
    PulumiGKE[Pulumi GKE lab]
    Mirror[Mirror to GitLab Action]
  end

  subgraph gitlab [GitLab — production forge]
    CI[GitLab CI + WIF]
  end

  subgraph laptop [Laptop]
    Kind[kind cluster]
  end

  subgraph gcp [GCP]
    AR[Artifact Registry]
    CR[Cloud Run]
    DM[Domain mapping]
    GKE[GKE Autopilot — on demand]
  end

  subgraph dns [Cloudflare]
    DNS[resume.solla.app]
  end

  Mirror --> CI
  CI --> PulumiCR
  PulumiCR --> AR
  PulumiCR --> CR
  PulumiCR --> DM
  App --> AR
  AR --> CR
  DNS --> CR
  PulumiKind --> Kind
  App --> Kind
  PulumiGKE --> GKE
  AR --> GKE
```

Forge roles and secrets: [FORGES.md](FORGES.md). Local kind: [K8S-LOCAL.md](K8S-LOCAL.md). GKE lab: [GKE.md](GKE.md).

---

## Repository layout

```
pulumi-cloud-solla-resume/
├── app/                    # Resume container
├── infra/                  # Pulumi: GCP Cloud Run + WIF (GitLab CI)
├── infra-k8s/              # Pulumi: local kind (not CI)
├── infra-gke/              # Pulumi: on-demand Autopilot (not CI)
├── scripts/
│   ├── k8s-up.sh / k8s-down.sh
│   └── gke-up.sh / gke-down.sh
├── docs/
│   ├── PLAN.md
│   ├── K8S-LOCAL.md
│   ├── GKE.md
│   ├── FORGES.md
│   └── CUSTOM-DOMAIN.md
├── .github/workflows/mirror-to-gitlab.yml
├── .gitlab-ci.yml          # Cloud Run stack only
└── README.md
```

---

## What is already live

| Piece | Status |
|--------|--------|
| Resume container on Cloud Run + `resume.solla.app` | Live |
| Artifact Registry + digest-pinned Cloud Run deploys + cleanup policies | Live |
| GitLab CI `preview` / `up` via WIF (keyless) | Live |
| GitHub inlet; Actions mirror to GitLab | Live |
| Local kind + Pulumi (`infra-k8s`), k9s + Headlamp for inspect | Laptop (not public) |
| GKE Autopilot lab (`infra-gke/`, stack `lab`) | On-demand (destroy when idle; not in GitLab CI) |

### Inspect tools

- **k9s** — terminal UI. Name is K8s + s (“Kubernetes screens”), not an acronym.
- **Headlamp** — desktop console; closest local analog to EKS / GKE Workloads. For GKE on macOS, launch Headlamp from a shell that has `gke-gcloud-auth-plugin` on `PATH` ([GKE.md](GKE.md)); Spotlight/`open -a` often cannot auth.
- **kubectl port-forward** — http://localhost:8080 for the app itself (kind or GKE).
- **GCP → Kubernetes Engine → Workloads** — cloud inspect for Autopilot (no public GKE URL).

---

## Roadmap

### 0. Hygiene

- [x] Pin Cloud Run to `image.repoDigest`
- [x] Artifact Registry cleanup policies

### 1. Local Kubernetes (Pulumi)

- [x] kind cluster + Pulumi Deployment/Service
- [x] Scripts + [K8S-LOCAL.md](K8S-LOCAL.md) (mermaid, k9s, Headlamp)

### 2. Cheap GKE Autopilot (on-demand)

- [x] Separate Pulumi project (`infra-gke/`, stack `lab`)
- [x] Tiny Autopilot workload; **no** HTTP(S) load balancer; create on the **latest** `REGULAR` channel version
- [x] `scripts/gke-up.sh` / `gke-down.sh` (auth plugin + Homebrew SDK `PATH`)
- [x] First apply verified: console Workloads 1/1 + port-forward http://localhost:8080
- [x] Tear down when idle (`./scripts/gke-down.sh`) — Pods still bill while the cluster is up; last lab was destroyed after first apply
- [x] Cloud Run stays the public hub

GKE free tier = one Autopilot **control plane** credit, not free Pods. No always-on public GKE URL.

### 3. Site as EM interview artifact

What a hiring manager sees in 90 seconds on [resume.solla.app](https://resume.solla.app). High reward, low risk: **HTML/docs on a GitHub PR**. Merge to `main` → GitLab CI → Cloud Run. No GKE, no laptop `pulumi up`.

- [x] Homepage architecture (Mermaid): GitHub inlet → GitLab CI + WIF → Cloud Run; kind and Autopilot as labs, not the public URL
- [x] “Why / trade-offs” (decision-making, not a feature list): Pulumi vs Terraform; Cloud Run always-on vs GKE on-demand; ClusterIP and no HTTP(S) LB; GitHub for agents, GitLab for deploy
- [x] Honest status: Cloud Run **live** (this page is the proof); GKE lab **offline by default** (no public GKE URL; do not keep a cluster up just for a green badge)
- [x] GitHub + GitLab links; GitLab pipeline badge (WIF deploy)
- [x] Security, stated plainly: GCP is keyless WIF. Pulumi Cloud uses a GitLab `PULUMI_ACCESS_TOKEN` (masked, **not** Protected) so feature-branch `preview` works — acceptable for a solo personal repo; a team would use Pulumi OIDC/ESC and protected branches. Do not put that token on GitHub.
- [x] README polish: one-paragraph summary, live URL, stack, setup, forge rule (GitHub inlet / GitLab deploy)

**Ship path:** `app/server.js` + `README.md` + this file. Cursor on the laptop **or** a Cloud Agent on GitHub; you only need a browser after merge to confirm the live page.

**Not this week (unless leftover time):** live probe of GKE, rotating the Pulumi PAT to OIDC (explain it; don’t rewire CI mid-interview week), Helm, Terraform sidecar, GitHub `workflow_dispatch` for GKE.

### 4. Optional later

- Helm once a plain Deployment is solid
- GitHub Actions `workflow_dispatch` for GKE up/down
- Terraform sidecar **only** if a job hunt needs that signal
- Pulumi Cloud OIDC / ESC instead of `PULUMI_ACCESS_TOKEN` (team-shaped secret model)

### Explicitly out of scope

- **AWS in this repo**
- Dual-push to GitLab; GitLab MRs unless requested
- Putting `pulumi up` for GKE on every GitLab `main` pipeline (would leave spend running)
- Kubernetes Dashboard in-cluster for the laptop lab
- Always-on public GKE URL / HTTP(S) load balancer for the lab

---

## Security notes

- Never commit `.env`, SA JSON, or `*-credentials.json` / `service-account*.json`.
- `Pulumi.yaml` and allowlisted stack configs (`Pulumi.dev.yaml`, `Pulumi.local.yaml`, `Pulumi.lab.yaml`) **are** committed.
- Public Cloud Run is unauthenticated on purpose.
- ADC locally; no downloaded SA keys.
- GitLab CI: WIF + `PULUMI_ACCESS_TOKEN` (masked, **not** Protected). Never put that token on GitHub.
- `GITLAB_TOKEN` on GitHub is mirror-only (`write_repository`).
- Project-IAM grants for `gitlab-ci-deployer` must be applied once with a privileged identity; CI cannot self-escalate.
- GKE lab uses **your** local ADC when you run `gke-up.sh`, not the GitLab deployer SA (until we add that on purpose).
