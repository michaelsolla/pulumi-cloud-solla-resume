#!/usr/bin/env bash
# Bring up the local kind cluster and apply the Pulumi Kubernetes stack.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER="solla-resume"
CONTEXT="kind-${CLUSTER}"

if ! command -v kind >/dev/null 2>&1; then
  echo "kind is not installed. On macOS: brew install kind" >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop and retry." >&2
  exit 1
fi

if ! kind get clusters 2>/dev/null | grep -qx "${CLUSTER}"; then
  echo "Creating kind cluster ${CLUSTER}..."
  kind create cluster --name "${CLUSTER}"
else
  echo "kind cluster ${CLUSTER} already exists."
fi

kubectl config use-context "${CONTEXT}" >/dev/null

cd "${ROOT}/infra-k8s"
if [[ ! -d node_modules ]]; then
  npm install
fi

if ! pulumi stack ls --json 2>/dev/null | grep -q '"name": "local"'; then
  pulumi stack init local
fi
pulumi stack select local
pulumi up --yes

echo
echo "Cluster is up. In another terminal:"
pulumi stack output portForward
echo "Then open http://localhost:8080"
