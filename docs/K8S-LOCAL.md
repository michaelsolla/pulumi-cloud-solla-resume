# Local Kubernetes (kind + Pulumi)

Same resume container as Cloud Run, running on a **local kind cluster**, deployed with Pulumi. Nothing here is public and GitLab CI does not touch this stack.

**Cluster name:** `solla-resume`  
**Kube context:** `kind-solla-resume`  
**Pulumi project / stack:** `pulumi-k8s-local` / `local`

## Cluster shape

kind has no AWS-style console. This is the object graph Pulumi creates (plus the kind control-plane that already exists once `kind create cluster` has run):

```mermaid
flowchart TB
  subgraph laptop [This laptop]
    Docker[Docker Desktop]
    PF["kubectl port-forward :8080"]
    Browser[http://localhost:8080]
  end

  subgraph kind [kind cluster: solla-resume]
    Node[control-plane node]
    subgraph ns [namespace: solla-resume]
      Deploy[Deployment solla-resume<br/>replicas: 1]
      RS[ReplicaSet]
      Pod[Pod<br/>container: resume<br/>image: solla-resume:local<br/>imagePullPolicy: Never]
      Svc[Service solla-resume<br/>ClusterIP :8080]
    end
  end

  Docker --> Node
  Deploy --> RS --> Pod
  Svc --> Pod
  PF --> Svc
  Browser --> PF
```

kube-system (CoreDNS, apiserver, etc.) is still there; that is the cluster, not the app.

## Inspecting it live

**k9s** is a terminal UI. The name is **K8s + s** (“Kubernetes screens,” from the old curses UI library) — not an acronym, and the dog branding is intentional. Pronounce it “k-nine-s” or “canines.”

```bash
brew install k9s
k9s --context kind-solla-resume -n solla-resume
```

`:ns` then pick `solla-resume` if you opened k9s without `-n`. `deploy`, `po`, `svc` are the usual views. Enter a pod for logs/describe. `?` is help, `q` quits. Empty pod list usually means you are in namespace `default`. If the namespace is missing, run `./scripts/k8s-up.sh` first.

**Headlamp** is a desktop Kubernetes console (CNCF / SIG UI). Closest local analog to the EKS or GKE Workloads UI.

```bash
brew install --cask headlamp
open -a Headlamp
```

Select kubeconfig context **`kind-solla-resume`**, namespace **`solla-resume`**. Service **Endpoints** vs **EndpointSlice** (`solla-resume-xxxxx`) are two API views of the same pod backends, not two apps. GKE’s console is the cloud equivalent later; do not install Headlamp in-cluster for this lab.

## Prerequisites

- Docker Desktop running
- [kind](https://kind.sigs.k8s.io/) (`brew install kind`)
- `kubectl`
- Optional: [k9s](https://k9scli.io/) (`brew install k9s`), [Headlamp](https://headlamp.dev/) (`brew install --cask headlamp`)
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

GKE Autopilot is a separate on-demand stack: [GKE.md](GKE.md). This stack stays laptop-only on purpose.
