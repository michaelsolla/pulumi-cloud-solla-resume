#!/usr/bin/env bash
# Create (or update) the on-demand GKE Autopilot lab. Costs money while up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required." >&2
  exit 1
fi

# Homebrew's gcloud-cli cask only links gcloud/gsutil/bq into PATH. The GKE
# auth plugin lives in the SDK bin dir after `gcloud components install`.
SDK_ROOT="$(gcloud info --format='value(installation.sdk_root)')"
export PATH="${SDK_ROOT}/bin:${PATH}"
if ! command -v gke-gcloud-auth-plugin >/dev/null 2>&1; then
  echo "gke-gcloud-auth-plugin is required (kubectl/Pulumi auth to GKE)." >&2
  echo "Install: gcloud components install gke-gcloud-auth-plugin" >&2
  exit 1
fi
export USE_GKE_GCLOUD_AUTH_PLUGIN=True

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
echo "Headlamp on macOS: launch the app binary from this shell (GUI PATH cannot find gke-gcloud-auth-plugin):"
echo "  /Applications/Headlamp.app/Contents/MacOS/Headlamp"
