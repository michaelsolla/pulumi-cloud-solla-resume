# Solla resume site — project plan

A portfolio resume site: a containerized app on **GCP**, provisioned with **Pulumi TypeScript**. Cloud Run is the always-on public site. Local **kind** and on-demand **GKE Autopilot** run the same workload as labs. [resume.solla.app](https://resume.solla.app) is meant to be readable in about 90 seconds: architecture, trade-offs, honest status, and security. Terraform is an optional later appendix — this repo stays Pulumi-first.

**GCP project:** `pulumi-gcp-ed-msolla`  
**Region:** `us-central1`  
**Public URL:** [https://resume.solla.app](https://resume.solla.app)

**GitHub** is the canonical repository — a person and a cloud agent both open pull requests there. **GitLab** runs production CI. A GitHub Action copies git refs across; see [FORGES.md](FORGES.md).

---

## Architecture (current)

```mermaid
flowchart LR
  subgraph github [GitHub — humans and cloud agents]
    App[Resume app + Dockerfile]
    PulumiCR[Pulumi Cloud Run]
    PulumiKind[Pulumi kind]
    PulumiGKE[Pulumi GKE lab]
    Copy[GitHub Action copies git to GitLab]
  end

  subgraph gitlab [GitLab — production CI]
    CI[GitLab CI + WIF]
  end

  subgraph local [Local]
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

  Copy --> CI
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

Roles and secrets: [FORGES.md](FORGES.md). Local kind: [K8S-LOCAL.md](K8S-LOCAL.md). GKE lab: [GKE.md](GKE.md).

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
| GitHub as source of truth (humans and cloud agents); Action copies git to GitLab | Live |
| Local kind + Pulumi (`infra-k8s`), k9s + Headlamp for inspect | Local (not public) |
| GKE Autopilot lab (`infra-gke/`, stack `lab`) | On-demand (destroyed when idle; not in GitLab CI) |

### Inspect tools

- **k9s** — terminal UI for Kubernetes.
- **Headlamp** — desktop console; closest local analog to EKS / GKE Workloads. For GKE on macOS, launch Headlamp from a shell that has `gke-gcloud-auth-plugin` on `PATH` ([GKE.md](GKE.md)); Spotlight / `open -a` often cannot authenticate.
- **kubectl port-forward** — http://localhost:8080 for the app (kind or GKE).
- **GCP → Kubernetes Engine → Workloads** — cloud inspect for Autopilot (no public GKE URL).

---

## Roadmap

### 0. Hygiene

- [x] Pin Cloud Run to `image.repoDigest`
- [x] Artifact Registry cleanup policies

### 1. Local Kubernetes (Pulumi)

- [x] kind cluster + Pulumi Deployment/Service
- [x] Scripts + [K8S-LOCAL.md](K8S-LOCAL.md) (diagram, k9s, Headlamp)

### 2. Cheap GKE Autopilot (on-demand)

- [x] Separate Pulumi project (`infra-gke/`, stack `lab`)
- [x] Tiny Autopilot workload; **no** HTTP(S) load balancer; create on the **latest** `REGULAR` channel version
- [x] `scripts/gke-up.sh` / `gke-down.sh` (auth plugin + Homebrew SDK `PATH`)
- [x] First apply verified: console Workloads 1/1 + port-forward http://localhost:8080
- [x] Destroyed when idle (`./scripts/gke-down.sh`) — Pods still bill while the cluster is up
- [x] Cloud Run stays the public hub

GKE free tier = one Autopilot **control plane** credit, not free Pods. No always-on public GKE URL.

### 3. Site as a portfolio artifact

What a visitor sees in 90 seconds on [resume.solla.app](https://resume.solla.app). HTML and docs; merge to `main` → GitLab CI → Cloud Run. No GKE, no local `pulumi up`.

- [x] Homepage architecture (Mermaid): human + cloud agent → GitHub → GitLab CI + WIF → Cloud Run; kind and Autopilot as labs, not the public URL
- [x] Trade-offs (decision-making, not a feature list): Pulumi vs Terraform; Cloud Run always-on vs GKE on-demand; ClusterIP and no HTTP(S) LB; GitHub for humans and cloud agents, GitLab for deploy
- [x] Honest status: Cloud Run **live** (the page is the proof); GKE lab **offline by default** (no public GKE URL; no cluster left running just for a green badge)
- [x] GitHub + GitLab links; GitLab pipeline badge (WIF deploy)
- [x] Security, stated plainly: GCP is keyless WIF. Pulumi Cloud uses a GitLab `PULUMI_ACCESS_TOKEN` (masked, **not** Protected) so feature-branch `preview` can log in — acceptable on a solo personal repo; a team would use Pulumi OIDC/ESC and protected branches. That token is not stored on GitHub.
- [x] README: short summary, live URL, stack, setup, GitHub vs GitLab roles

### 4. Optional later

- Helm once a plain Deployment is solid
- GitHub Actions `workflow_dispatch` for GKE up/down
- Terraform sidecar if a side-by-side comparison is useful
- Pulumi Cloud OIDC / ESC instead of `PULUMI_ACCESS_TOKEN` (team-shaped secret model)
- Live probe of the GKE lab from the homepage

### Out of scope

- **AWS in this repo**
- Pushing to GitLab independently of the GitHub copy (histories would diverge). GitLab merge requests are optional and are not part of the deploy path.
- Putting `pulumi up` for GKE on every GitLab `main` pipeline (would leave spend running)
- Kubernetes Dashboard in-cluster for the local lab
- Always-on public GKE URL / HTTP(S) load balancer for the lab

---

## Security notes

- Do not commit `.env`, service-account JSON, or `*-credentials.json` / `service-account*.json`.
- `Pulumi.yaml` and allowlisted stack configs (`Pulumi.dev.yaml`, `Pulumi.local.yaml`, `Pulumi.lab.yaml`) **are** committed.
- Public Cloud Run is unauthenticated on purpose.
- Local applies use Application Default Credentials; no downloaded service-account keys.
- GitLab CI: WIF + `PULUMI_ACCESS_TOKEN` (masked, **not** Protected). That token is not stored on GitHub.
- `GITLAB_TOKEN` on GitHub is copy-only (`write_repository`).
- Project-IAM grants for `gitlab-ci-deployer` must be applied once with a privileged identity; CI cannot self-escalate.
- The GKE lab uses local Application Default Credentials when `gke-up.sh` runs, not the GitLab deployer service account.
