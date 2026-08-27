# Pulumi Cloud — Solla Resume

Portfolio resume site: a **containerized Node.js app** on **Google Cloud Run**, provisioned with **Pulumi TypeScript** on GCP.

**Live:** [https://resume.solla.app](https://resume.solla.app)

[![GitLab pipeline](https://gitlab.com/michael.solla/pulumi-cloud-solla-resume/badges/main/pipeline.svg)](https://gitlab.com/michael.solla/pulumi-cloud-solla-resume/-/pipelines?ref=main)

Cloud Run is the always-on public site. Kubernetes is a **lab**: local [kind](docs/K8S-LOCAL.md) plus on-demand [GKE Autopilot](docs/GKE.md) (destroy when idle). This repo stays **Pulumi-first** and **GCP-first**. Plan: [docs/PLAN.md](docs/PLAN.md).

**Check in on GitHub.** A GitHub Action mirrors refs to GitLab, which is the production CI (WIF → Pulumi → Cloud Run). Do not add a second deploy on GitHub. Forge diagram: [docs/FORGES.md](docs/FORGES.md).

## Status

| Piece | State |
|--------|--------|
| Cloud Run + `resume.solla.app` | Live (the site is the proof) |
| GitLab CI `preview` / `up` via GCP WIF | Live |
| GitHub → GitLab mirror | Live |
| kind (laptop) | Optional local lab |
| GKE Autopilot | On-demand, **offline by default**, not in GitLab CI |

## Tech stack

Pulumi TypeScript · GCP · Cloud Run · Artifact Registry · Docker · GitLab CI + Workload Identity Federation · kind · GKE Autopilot

## Forge

| Forge | Role |
|--------|------|
| [GitHub](https://github.com/michaelsolla/pulumi-cloud-solla-resume) | Inlet (humans and Cursor Cloud Agents) |
| [GitLab](https://gitlab.com/michael.solla/pulumi-cloud-solla-resume) | Deploy (`pulumi preview` on branches, `pulumi up` on `main`) |

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running locally, for the Cloud Run image build)
- [Google Cloud SDK](https://cloud.google.com/sdk) (`gcloud`)
- GCP project with billing enabled (`pulumi-gcp-ed-msolla`)
- Application Default Credentials (`gcloud auth application-default login`)

## Getting started

Production deploys from **GitLab CI** after a GitHub merge to `main`. Local Cloud Run stack (needs Docker):

```bash
# One-time Docker auth for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

cd infra
npm install
pulumi stack select dev
pulumi preview
pulumi up
```

Open the `customDomainUrl` / `serviceUrl` output in a browser.

Run only the app container:

```bash
cd app
docker build -t solla-resume:local .
docker run --rm -p 8080:8080 solla-resume:local
# http://localhost:8080
```

Local kind: [docs/K8S-LOCAL.md](docs/K8S-LOCAL.md) (`./scripts/k8s-up.sh`).  
GKE lab (costs money while up): [docs/GKE.md](docs/GKE.md) (`./scripts/gke-up.sh` / `gke-down.sh`).

Custom domain: [docs/CUSTOM-DOMAIN.md](docs/CUSTOM-DOMAIN.md).

See [`.env.example`](.env.example) for local placeholders — **never commit real credentials**.

## Repository layout

```
.
├── app/                # Resume container (Dockerfile + server.js)
├── infra/              # Pulumi TypeScript (GCP Cloud Run)
├── infra-k8s/          # Pulumi TypeScript (local kind)
├── infra-gke/          # Pulumi TypeScript (GKE Autopilot lab)
├── scripts/
│   ├── k8s-up.sh
│   ├── k8s-down.sh
│   ├── gke-up.sh
│   └── gke-down.sh
├── docs/
│   ├── PLAN.md
│   ├── K8S-LOCAL.md
│   ├── GKE.md
│   ├── FORGES.md
│   └── CUSTOM-DOMAIN.md
├── .github/workflows/
│   └── mirror-to-gitlab.yml
├── .gitlab-ci.yml      # preview on feature branches, deploy on main
├── README.md
└── .env.example
```

## License

This project is licensed under the [MIT License](LICENSE).
