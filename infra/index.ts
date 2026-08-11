import * as path from "path";
import * as docker from "@pulumi/docker";
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { GitlabCiWif } from "./gitlab-wif";

const gcpConfig = new pulumi.Config("gcp");
const config = new pulumi.Config();
const project = gcpConfig.require("project");
const region = gcpConfig.get("region") || "us-central1";
const customDomain = config.get("customDomain") || "resume.solla.app";

const appPath = path.join(__dirname, "..", "app");
const repositoryId = "hello-world";
const containerPlatform = "linux/amd64";

const requiredApis = [
  "artifactregistry.googleapis.com",
  "run.googleapis.com",
  // Needed for GitLab CI Workload Identity Federation (keyless auth).
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "sts.googleapis.com",
];

const enabledApis = requiredApis.map(
  (api) =>
    new gcp.projects.Service(`enable-${api.replace(/\./g, "-")}`, {
      service: api,
      disableOnDestroy: false,
    }),
);

const projectInfo = gcp.organizations.getProjectOutput({
  projectId: project,
});

// GitLab project path in `namespace/project` form. Only pipelines running in
// this exact GitLab project can authenticate via Workload Identity
// Federation; see gitlab-wif.ts for the full handshake.
const gitlabProjectPath =
  config.get("gitlabProjectPath") ||
  "michael.solla/pulumi-cloud-solla-resume";

const gitlabCiWif = new GitlabCiWif(
  "gitlab-ci",
  {
    projectId: project,
    gitlabProjectPath,
    computeDefaultServiceAccountEmail: projectInfo.number.apply(
      (number) => `${number}-compute@developer.gserviceaccount.com`,
    ),
  },
  { dependsOn: enabledApis },
);

const repository = new gcp.artifactregistry.Repository(
  "hello-world-repo",
  {
    repositoryId,
    location: region,
    format: "DOCKER",
    description: "Hello World container images for Cloud Run",
  },
  { dependsOn: enabledApis },
);

const imageName = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${repositoryId}/hello-world:latest`;

const image = new docker.Image(
  "hello-world-image",
  {
    imageName,
    build: {
      context: appPath,
      dockerfile: path.join(appPath, "Dockerfile"),
      platform: containerPlatform,
    },
  },
  { dependsOn: [repository] },
);

new gcp.artifactregistry.RepositoryIamMember("cloud-run-image-reader", {
  repository: repository.name,
  location: region,
  role: "roles/artifactregistry.reader",
  member: projectInfo.number.apply(
    (number) =>
      `serviceAccount:${number}-compute@developer.gserviceaccount.com`,
  ),
});

const service = new gcp.cloudrunv2.Service(
  "hello-world",
  {
    name: "hello-world",
    location: region,
    ingress: "INGRESS_TRAFFIC_ALL",
    template: {
      containers: [
        {
          image: image.imageName,
          ports: { containerPort: 8080 },
          resources: {
            limits: {
              cpu: "1",
              memory: "512Mi",
            },
          },
        },
      ],
      scaling: {
        minInstanceCount: 0,
        maxInstanceCount: 2,
      },
    },
  },
  { dependsOn: [image] },
);

new gcp.cloudrunv2.ServiceIamMember("hello-world-public", {
  location: region,
  name: service.name,
  role: "roles/run.invoker",
  member: "allUsers",
});

const domainMapping = new gcp.cloudrun.DomainMapping(
  "resume-domain",
  {
    location: region,
    name: customDomain,
    metadata: {
      namespace: project,
    },
    spec: {
      routeName: service.name,
    },
  },
  { dependsOn: [service] },
);

export const repositoryUrl = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${repositoryId}`;
export const imageUrl = image.imageName;
export const serviceUrl = service.uri;
export const customDomainUrl = pulumi.interpolate`https://${customDomain}`;
export const dnsRecords = domainMapping.statuses.apply((statuses) =>
  statuses.flatMap((status) =>
    (status.resourceRecords ?? []).map((record) => ({
      name: record.name,
      type: record.type,
      value: record.rrdata,
    })),
  ),
);

// Plug these into .gitlab-ci.yml's GCP_WORKLOAD_IDENTITY_PROVIDER / GCP_SERVICE_ACCOUNT
// (or into GitLab CI/CD variables) after the first `pulumi up`.
export const gitlabCiWifProviderName = gitlabCiWif.providerName;
export const gitlabCiServiceAccountEmail = gitlabCiWif.serviceAccountEmail;
