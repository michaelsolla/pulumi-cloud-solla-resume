# GKE Autopilot lab (on-demand)

Same resume app as Cloud Run and local kind, on **GKE Autopilot**. This is a **lab**, not the public site. `resume.solla.app` stays on Cloud Run. There is **no** public GKE URL (ClusterIP + `kubectl port-forward` on purpose — an HTTP(S) load balancer would add about $15–20/month).

**Pulumi project / stack:** `pulumi-gke-lab` / `lab`  
**Cluster:** `solla-resume-autopilot` in `us-central1`  
**Kube context:** `gke_pulumi-gcp-ed-msolla_us-central1_solla-resume-autopilot`  
**Not in GitLab CI.** The stack is applied locally (or later via `workflow_dispatch`) so a forgotten pipeline cannot leave a cluster running.

First-time `pulumi preview` asks for a stack name: **`lab`**.

## Prerequisites

- `gcloud` authenticated to `pulumi-gcp-ed-msolla` (`gcloud auth application-default login` if local ADC is stale).
- `gke-gcloud-auth-plugin` (Pulumi, kubectl, k9s, and Headlamp use it to talk to the cluster):

```bash
gcloud components install gke-gcloud-auth-plugin
# Homebrew gcloud-cli cask: extra binaries are not on PATH until:
export PATH="$(gcloud info --format='value(installation.sdk_root)')/bin:$PATH"
```

`./scripts/gke-up.sh` and `./scripts/gke-down.sh` prepend that SDK bin dir for the duration of the script. New terminals still need the `export PATH=...` line (or an equivalent in `~/.zshrc`).

## Cost

The GKE free-tier credit covers **one Autopilot control plane**. It does **not** cover Pod CPU/RAM.

**Destroy when idle:** `./scripts/gke-down.sh`. Credits do not make a leftover cluster free.

## Bring the lab up

```bash
export PATH="$(gcloud info --format='value(installation.sdk_root)')/bin:$PATH"
./scripts/gke-up.sh
# other terminal:
export PATH="$(gcloud info --format='value(installation.sdk_root)')/bin:$PATH"
kubectl --context gke_pulumi-gcp-ed-msolla_us-central1_solla-resume-autopilot \
  -n solla-resume port-forward svc/solla-resume 8080:8080
# http://localhost:8080
```

Tear down:

```bash
./scripts/gke-down.sh
```

## What Pulumi does

1. Enables `container.googleapis.com` and `compute.googleapis.com`.
2. Creates a regional Autopilot cluster (`deletionProtection: false`) on the **latest** version in the `REGULAR` release channel (not GKE’s slower channel default, which is what shows the console “upgrade available” banner). `pulumi config set releaseChannel RAPID` for the faster stream.
3. Deploys namespace `solla-resume`, one Deployment (250m / 512Mi — Autopilot minimums), ClusterIP Service.
4. Image is the Cloud Run stack’s `imageDigest` (Artifact Registry), unless overridden with `pulumi config set image ...`.

## Inspect (verified)

**GCP console** (no plugin, no PATH): [Clusters](https://console.cloud.google.com/kubernetes/list?project=pulumi-gcp-ed-msolla) · [Workloads](https://console.cloud.google.com/kubernetes/workload?project=pulumi-gcp-ed-msolla). Workloads is the EKS analog. Namespace `solla-resume`, Deployment `solla-resume` should be 1/1 when the lab is up.

**App:** port-forward as above → http://localhost:8080. Same resume page as Cloud Run, served from the Autopilot Pod.

**k9s** (terminal; needs SDK bin on `PATH`):

```bash
export PATH="$(gcloud info --format='value(installation.sdk_root)')/bin:$PATH"
gcloud container clusters get-credentials solla-resume-autopilot --region us-central1 --project pulumi-gcp-ed-msolla
k9s --context gke_pulumi-gcp-ed-msolla_us-central1_solla-resume-autopilot -n solla-resume
```

**Headlamp:** macOS GUI apps do **not** inherit the shell `PATH`. GKE kubeconfig authenticates via `gke-gcloud-auth-plugin`, so `open -a Headlamp` often cannot see this cluster even when `kubectl` in the same terminal works. Launch the binary from a shell that already has the SDK bin:

```bash
export PATH="$(gcloud info --format='value(installation.sdk_root)')/bin:$PATH"
/Applications/Headlamp.app/Contents/MacOS/Headlamp
```

Then pick context **`gke_pulumi-gcp-ed-msolla_us-central1_solla-resume-autopilot`**, namespace **`solla-resume`**. If Headlamp still fails, the GCP Workloads console is the intended cloud inspect path.
