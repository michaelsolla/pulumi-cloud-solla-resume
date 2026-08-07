import * as path from "path";
import * as docker from "@pulumi/docker";
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const gcpConfig = new pulumi.Config("gcp");
const project = gcpConfig.require("project");
const region = gcpConfig.get("region") || "us-central1";

const appPath = path.join(__dirname, "..", "app");
const repositoryId = "hello-world";
const containerPlatform = "linux/amd64";

const requiredApis = [
  "artifactregistry.googleapis.com",
  "run.googleapis.com",
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

export const repositoryUrl = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${repositoryId}`;
export const imageUrl = image.imageName;
export const serviceUrl = service.uri;
