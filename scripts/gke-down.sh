#!/usr/bin/env bash
# Destroy the GKE Autopilot lab. Run this when you are done demoing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT}/infra-gke"
pulumi stack select lab
pulumi destroy --yes
