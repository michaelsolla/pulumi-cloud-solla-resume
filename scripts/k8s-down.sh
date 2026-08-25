#!/usr/bin/env bash
# Tear down the Pulumi Kubernetes resources. Pass --cluster to also delete kind.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER="solla-resume"
DELETE_CLUSTER=0

for arg in "$@"; do
  case "${arg}" in
    --cluster) DELETE_CLUSTER=1 ;;
    -h|--help)
      echo "Usage: $0 [--cluster]"
      echo "  (default) pulumi destroy the local stack"
      echo "  --cluster  also delete the kind cluster"
      exit 0
      ;;
  esac
done

cd "${ROOT}/infra-k8s"
pulumi stack select local
pulumi destroy --yes

if [[ "${DELETE_CLUSTER}" -eq 1 ]]; then
  kind delete cluster --name "${CLUSTER}"
fi
