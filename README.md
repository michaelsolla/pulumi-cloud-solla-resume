# Pulumi GCP Ed

Infrastructure-as-code experiments and learning projects on **Google Cloud Platform**, built with [Pulumi](https://www.pulumi.com/).

This repository is an early-stage portfolio project. The goal is to explore modern cloud provisioning patterns, document what I learn along the way, and eventually deploy real workloads on GCP using Pulumi—likely in **TypeScript** (and possibly inspired by patterns from [Halloumi](https://github.com/pulumi/halloumi)).

## Status

🚧 **Phase 1 in progress** — Hello World container + Pulumi program for Cloud Run. See [docs/PLAN.md](docs/PLAN.md) for the full architecture and roadmap.

## Planned focus

- Provisioning and managing GCP resources with Pulumi
- TypeScript as the primary language
- Docker build and push via `@pulumi/docker`
- Cloud Run deployment with a path to a custom domain (Phase 2)

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
pulumi stack init dev
pulumi config set gcp:project pulumi-gcp-ed-msolla
pulumi config set gcp:region us-central1
pulumi preview
pulumi up
```

Open the `serviceUrl` output in your browser to see **Hello, World!**

See [docs/PLAN.md](docs/PLAN.md) for architecture details, Phase 2 (custom domain), and `@pulumi/docker` explanation.

Custom domain setup for **resume.solla.app**: [docs/CUSTOM-DOMAIN.md](docs/CUSTOM-DOMAIN.md)

See [`.env.example`](.env.example) for local environment variable placeholders—**never commit real credentials**.

## Repository layout

```
.
├── app/                # Hello World container (Dockerfile + server.js)
├── infra/              # Pulumi TypeScript program
├── docs/
│   └── PLAN.md         # Architecture and phased rollout plan
├── README.md
├── LICENSE
├── .gitignore
└── .env.example
```

## License

This project is licensed under the [MIT License](LICENSE).
