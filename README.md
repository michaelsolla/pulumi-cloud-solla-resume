# Pulumi GCP Ed

Infrastructure-as-code experiments and learning projects on **Google Cloud Platform**, built with [Pulumi](https://www.pulumi.com/).

This repository is an early-stage portfolio project. The goal is to explore modern cloud provisioning patterns, document what I learn along the way, and eventually deploy real workloads on GCP using Pulumi—likely in **TypeScript** (and possibly inspired by patterns from [Halloumi](https://github.com/pulumi/halloumi)).

## Status

🚧 **Scaffolding only** — project structure and repo hygiene are in place; infrastructure code has not been added yet.

## Planned focus

- Provisioning and managing GCP resources with Pulumi
- TypeScript (or Node.js) as the primary language
- Clear stack organization, previews, and safe deployment workflows
- Examples that demonstrate practical cloud engineering skills

## Prerequisites

When infrastructure code lands here, you will likely need:

- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- [Node.js](https://nodejs.org/) (LTS recommended, for TypeScript)
- [Google Cloud SDK](https://cloud.google.com/sdk) (`gcloud`)
- A GCP project with billing enabled
- Application Default Credentials or a service account with appropriate IAM roles

## Getting started

Infrastructure code is not checked in yet. Once the first stack is added, typical workflow will look like:

```bash
pulumi login
pulumi stack init dev
pulumi preview
pulumi up
```

See [`.env.example`](.env.example) for local environment variable placeholders—**never commit real credentials**.

## Repository layout

```
.
├── README.md           # This file
├── LICENSE             # MIT
├── .gitignore          # Pulumi, Node, GCP, and IDE ignores
└── .env.example        # Non-secret environment variable template
```

Additional directories (e.g. `infra/`, `src/`) will be added as the project takes shape.

## Roadmap

- [ ] Choose project structure (single stack vs. multi-stack)
- [ ] Add minimal Pulumi + `@pulumi/gcp` TypeScript program
- [ ] Configure GCP project, region, and authentication
- [ ] First deployable resource (e.g. Cloud Storage bucket or Cloud Run service)
- [ ] CI preview workflow (GitHub Actions + Pulumi)

## License

This project is licensed under the [MIT License](LICENSE).
