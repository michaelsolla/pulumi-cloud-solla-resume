# Local Kubernetes (kind + Pulumi)

Same resume container as Cloud Run, running on a **local kind cluster**, deployed with Pulumi. Nothing here is public and GitLab CI does not touch this stack.

**Cluster name:** `solla-resume`  
**Kube context:** `kind-solla-resume`  
**Pulumi project / stack:** `pulumi-k8s-local` / `local`

## Prerequisites

- Docker Desktop running
- [kind](https://kind.sigs.k8s.io/) (`brew install kind`)
- `kubectl`
- Pulumi CLI (logged in to the same Pulumi Cloud org as the Cloud Run stack)

## One-shot

```bash
./scripts/k8s-up.sh
# other terminal:
kubectl --context kind-solla-resume -n solla-resume port-forward svc/solla-resume 8080:8080
# open http://localhost:8080
```

Tear down the workload (keep the cluster):

```bash
./scripts/k8s-down.sh
```

Tear down the workload **and** delete the kind cluster:

```bash
./scripts/k8s-down.sh --cluster
```

## What Pulumi does

1. Builds `app/Dockerfile` locally (`solla-resume:local`) — no Artifact Registry push.
2. `kind load docker-image` so the node can run it (`imagePullPolicy: Never`).
3. Creates namespace `solla-resume`, a Deployment (1 replica), and a ClusterIP Service on port 8080.

GKE Autopilot comes later; this stack is laptop-only on purpose.
