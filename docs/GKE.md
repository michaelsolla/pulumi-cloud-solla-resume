# GKE Autopilot lab (on-demand)

Same resume app as Cloud Run and local kind, on **GKE Autopilot**. This is a **lab**, not the public site. `resume.solla.app` stays on Cloud Run.

**Pulumi project / stack:** `pulumi-gke-lab` / `lab`  
**Cluster:** `solla-resume-autopilot` in `us-central1`  
**Not in GitLab CI.** Applying this stack is a laptop (or later workflow_dispatch) action so a forgotten pipeline cannot leave a cluster running.

## Cost

The GKE free-tier credit covers **one Autopilot control plane**. It does **not** cover Pod CPU/RAM. There is **no** HTTP(S) load balancer in this stack (that is the ~$15–20/mo trap). Access is `kubectl port-forward`.

**Destroy when idle:** `./scripts/gke-down.sh`. Credits do not make a leftover cluster free.

## One-shot (after you have reviewed `pulumi preview`)

```bash
./scripts/gke-up.sh
# other terminal — after get-credentials:
kubectl -n solla-resume port-forward svc/solla-resume 8080:8080
# http://localhost:8080
```

Tear down:

```bash
./scripts/gke-down.sh
```

## What Pulumi does

1. Enables `container.googleapis.com` and `compute.googleapis.com`.
2. Creates a regional Autopilot cluster (`deletionProtection: false`).
3. Deploys namespace `solla-resume`, one Deployment (250m / 512Mi — Autopilot minimums), ClusterIP Service.
4. Image is the Cloud Run stack’s `imageDigest` (Artifact Registry), unless you `pulumi config set image ...`.

## Inspect

- **GCP console:** Kubernetes Engine → Clusters / Workloads (the EKS analog).
- **k9s / Headlamp:** `gcloud container clusters get-credentials solla-resume-autopilot --region us-central1 --project pulumi-gcp-ed-msolla` then the same tools as local kind, context `gke_pulumi-gcp-ed-msolla_us-central1_solla-resume-autopilot`.
