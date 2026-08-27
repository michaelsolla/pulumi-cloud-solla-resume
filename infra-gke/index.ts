import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const gcpConfig = new pulumi.Config("gcp");
const config = new pulumi.Config();
const project = gcpConfig.require("project");
const region = gcpConfig.get("region") || "us-central1";
const clusterName = config.get("clusterName") || "solla-resume-autopilot";
const releaseChannel = config.get("releaseChannel") || "REGULAR";
const cloudRunStack =
  config.get("cloudRunStack") || "michael-solla-gmail-com/pulumi-gcp-ed/dev";

const appLabels = { app: "solla-resume" };

// Same image Cloud Run just shipped (digest), unless you override with
// `pulumi config set image ...`. Autopilot pulls from Artifact Registry;
// the Cloud Run stack already grants artifactregistry.reader to the default
// compute SA, which Autopilot uses for image pulls.
const image: pulumi.Input<string> = config.get("image")
  ? config.get("image")!
  : new pulumi.StackReference(cloudRunStack).getOutput("imageDigest");

const enabledApis = [
  "container.googleapis.com",
  "compute.googleapis.com",
].map(
  (api) =>
    new gcp.projects.Service(`enable-${api.replace(/\./g, "-")}`, {
      service: api,
      disableOnDestroy: false,
    }),
);

// REGULAR's *default* version is what GKE uses if minMasterVersion is unset,
// and it lags the newest version already offered in that channel (the console
// "upgrade available" banner). Look up the latest in-channel version so a
// freshly created lab is current. Subsequent auto-upgrades still follow the
// channel. Override with `pulumi config set releaseChannel RAPID` if you want
// the faster stream.
const engineVersions = gcp.container.getEngineVersionsOutput(
  { location: region, project },
  { dependsOn: enabledApis },
);
const minMasterVersion = engineVersions.releaseChannelLatestVersion.apply(
  (versions) => {
    const latest = versions[releaseChannel];
    if (!latest) {
      throw new Error(
        `No latest GKE version for release channel ${releaseChannel} in ${region}`,
      );
    }
    return latest;
  },
);

// Regional Autopilot: control-plane fee is covered by the GKE monthly credit
// for one Autopilot cluster. Pods still bill. deletionProtection is off so
// `pulumi destroy` can actually tear it down after a demo.
const cluster = new gcp.container.Cluster(
  "solla-resume-autopilot",
  {
    name: clusterName,
    location: region,
    enableAutopilot: true,
    deletionProtection: false,
    releaseChannel: { channel: releaseChannel },
    minMasterVersion,
    description: "On-demand resume lab. Destroy when idle. No public load balancer.",
  },
  { dependsOn: enabledApis },
);

const kubeconfig = pulumi
  .all([cluster.name, cluster.endpoint, cluster.masterAuth, cluster.location])
  .apply(([name, endpoint, auth, location]) => {
    const context = `gke_${project}_${location}_${name}`;
    const ca = auth.clusterCaCertificate;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${ca}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin (gcloud components install gke-gcloud-auth-plugin)
      provideClusterInfo: true
`;
  });

const k8sProvider = new k8s.Provider("gke", {
  kubeconfig,
});

const ns = new k8s.core.v1.Namespace(
  "solla-resume",
  { metadata: { name: "solla-resume" } },
  { provider: k8sProvider },
);

// Autopilot bills from requests. These are the usual Autopilot minimums so
// we do not over-request and pay for idle CPU/RAM.
new k8s.apps.v1.Deployment(
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
              image,
              ports: [{ containerPort: 8080, name: "http" }],
              resources: {
                requests: { cpu: "250m", memory: "512Mi" },
                limits: { cpu: "250m", memory: "512Mi" },
              },
              readinessProbe: {
                httpGet: { path: "/", port: "http" },
                initialDelaySeconds: 3,
                periodSeconds: 5,
              },
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider },
);

new k8s.core.v1.Service(
  "solla-resume",
  {
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
  },
  { provider: k8sProvider },
);

export const gkeClusterName = cluster.name;
export const gkeLocation = cluster.location;
export const gkeReleaseChannel = releaseChannel;
export const gkeMinMasterVersion = minMasterVersion;
export const gkeMasterVersion = cluster.masterVersion;
export const kubeContext = pulumi.interpolate`gke_${project}_${cluster.location}_${cluster.name}`;
export const imageRef = image;
export const portForward = pulumi.interpolate`kubectl --context gke_${project}_${cluster.location}_${cluster.name} -n solla-resume port-forward svc/solla-resume 8080:8080`;
export const getCredentials = pulumi.interpolate`gcloud container clusters get-credentials ${cluster.name} --region ${cluster.location} --project ${project}`;
