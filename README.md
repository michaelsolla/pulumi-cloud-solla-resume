# Pulumi Cloud — Solla Resume

Portfolio resume site on **Google Cloud Run**, managed with [Pulumi](https://www.pulumi.com/) TypeScript. Public URL: [https://resume.solla.app](https://resume.solla.app).

Kubernetes (local first, then cheap GKE Autopilot) is the next expansion. This repo stays **Pulumi-first** and **GCP-first**. See [docs/PLAN.md](docs/PLAN.md).

## Status

**Live:** containerized resume on Cloud Run + custom domain, GitLab CI deploying via GCP Workload Identity Federation (keyless).

**Next:** hygiene (digest-pinned Cloud Run deploys + Artifact Registry cleanup), then local Kubernetes with Pulumi.

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
├── infra/              # Pulumi TypeScript program
├── docs/
│   └── PLAN.md         # Architecture and roadmap
├── .gitlab-ci.yml      # preview on MRs, deploy on main
├── README.md
└── .env.example
```

## License

This project is licensed under the [MIT License](LICENSE).
