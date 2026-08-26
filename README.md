# Pulumi Cloud — Solla Resume

Portfolio resume site on **Google Cloud Run**, managed with [Pulumi](https://www.pulumi.com/) TypeScript. Public URL: [https://resume.solla.app](https://resume.solla.app).

Kubernetes is local **kind** plus an on-demand **GKE Autopilot** lab (destroy when idle). Cloud Run stays the public site. This repo stays **Pulumi-first** and **GCP-first**. See [docs/PLAN.md](docs/PLAN.md).

**Check in on GitHub.** A GitHub Action mirrors refs to GitLab, which remains the production CI (WIF → Pulumi → Cloud Run). Do not add a second deploy on GitHub. Setup and diagrams: [docs/FORGES.md](docs/FORGES.md).

## Status

**Live:** containerized resume on Cloud Run + custom domain, GitLab CI deploying via GCP Workload Identity Federation (keyless).

**Inlet:** GitHub is the source of truth for commits (humans and Cursor Cloud Agents). GitLab is the deploy forge.

**Labs:** local kind ([docs/K8S-LOCAL.md](docs/K8S-LOCAL.md)); on-demand GKE Autopilot ([docs/GKE.md](docs/GKE.md)) — not in GitLab CI, tear down with `./scripts/gke-down.sh`.

**Next:** Kubernetes section on `resume.solla.app`. See [docs/PLAN.md](docs/PLAN.md).

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running locally)
- [Google Cloud SDK](https://cloud.google.com/sdk) (`gcloud`)
- GCP project with billing enabled (`pulumi-gcp-ed-msolla`)
- Application Default Credentials (`gcloud auth application-default login`)

## Getting started

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

Custom domain notes: [docs/CUSTOM-DOMAIN.md](docs/CUSTOM-DOMAIN.md)

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
