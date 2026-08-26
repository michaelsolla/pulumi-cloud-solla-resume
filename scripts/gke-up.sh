#!/usr/bin/env bash
# Create (or update) the on-demand GKE Autopilot lab. Costs money while up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required." >&2
  exit 1
fi

cd "${ROOT}/infra-gke"
if [[ ! -d node_modules ]]; then
  npm install
fi

if ! pulumi stack ls --json 2>/dev/null | grep -q '"name": "lab"'; then
  pulumi stack init lab
fi
pulumi stack select lab

echo "This creates a GKE Autopilot cluster + one tiny Pod."
echo "Destroy when idle: ./scripts/gke-down.sh"
pulumi up --yes

echo
echo "Wire kubectl (and Headlamp/k9s) to the cluster:"
pulumi stack output getCredentials
eval "$(pulumi stack output getCredentials)"
echo
echo "Then:"
pulumi stack output portForward
echo "Open http://localhost:8080"
echo "GCP console analog: Kubernetes Engine → Workloads"
