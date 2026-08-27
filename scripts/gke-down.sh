#!/usr/bin/env bash
# Destroy the GKE Autopilot lab (costs money while the cluster is up).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required." >&2
  exit 1
fi

# Same Homebrew SDK PATH as gke-up.sh: kubectl/Pulumi need gke-gcloud-auth-plugin
# to delete the workload before the cluster.
SDK_ROOT="$(gcloud info --format='value(installation.sdk_root)')"
export PATH="${SDK_ROOT}/bin:${PATH}"
if ! command -v gke-gcloud-auth-plugin >/dev/null 2>&1; then
  echo "gke-gcloud-auth-plugin is required (kubectl/Pulumi auth to GKE)." >&2
  echo "Install: gcloud components install gke-gcloud-auth-plugin" >&2
  exit 1
fi
export USE_GKE_GCLOUD_AUTH_PLUGIN=True

cd "${ROOT}/infra-gke"
pulumi stack select lab
pulumi destroy --yes
