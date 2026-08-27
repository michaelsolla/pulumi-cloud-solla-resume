import * as path from "path";
import { local } from "@pulumi/command";
import * as docker from "@pulumi/docker";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const clusterName = "solla-resume";
const imageTag = "solla-resume:local";
const appLabels = { app: "solla-resume" };
const appPath = path.join(__dirname, "..", "app");

// Local-only: build the same Dockerfile Cloud Run uses, but do not push to
// Artifact Registry. kind will import the image from the Docker daemon.
const image = new docker.Image("solla-resume", {
  imageName: imageTag,
  skipPush: true,
  build: {
    context: appPath,
    dockerfile: path.join(appPath, "Dockerfile"),
    // kind node architecture (linux/arm64 on Apple Silicon). Cloud Run still
    // builds linux/amd64 in the GCP stack. Change this if the host is amd64.
    platform: "linux/arm64",
  },
});

// kind nodes do not see host images until they are loaded into the cluster.
const loaded = new local.Command(
  "kind-load",
  {
    create: pulumi.interpolate`kind load docker-image ${image.imageName} --name ${clusterName}`,
    update: pulumi.interpolate`kind load docker-image ${image.imageName} --name ${clusterName}`,
    triggers: [image.repoDigest],
  },
  { dependsOn: [image] },
);

const ns = new k8s.core.v1.Namespace("solla-resume", {
  metadata: { name: "solla-resume" },
});

const deployment = new k8s.apps.v1.Deployment(
  "solla-resume",
  {
    metadata: {
      name: "solla-resume",
      namespace: ns.metadata.name,
      labels: appLabels,
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: appLabels },
      template: {
        metadata: { labels: appLabels },
        spec: {
          containers: [
            {
              name: "resume",
              image: imageTag,
              imagePullPolicy: "Never",
              ports: [{ containerPort: 8080, name: "http" }],
              readinessProbe: {
                httpGet: { path: "/", port: "http" },
                initialDelaySeconds: 2,
                periodSeconds: 5,
              },
            },
          ],
        },
      },
    },
  },
  { dependsOn: [loaded] },
);

const service = new k8s.core.v1.Service("solla-resume", {
  metadata: {
    name: "solla-resume",
    namespace: ns.metadata.name,
    labels: appLabels,
  },
  spec: {
    type: "ClusterIP",
    selector: appLabels,
    ports: [{ port: 8080, targetPort: 8080, name: "http" }],
  },
});

export const kubeContext = "kind-solla-resume";
export const namespace = ns.metadata.name;
export const imageName = image.imageName;
export const imageDigest = image.repoDigest;
export const serviceName = service.metadata.name;
export const portForward = pulumi.interpolate`kubectl --context kind-solla-resume -n ${ns.metadata.name} port-forward svc/${service.metadata.name} 8080:8080`;
