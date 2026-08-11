import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export interface GitlabCiWifArgs {
  /** GCP project ID that owns the pool, provider, and deployer service account. */
  projectId: pulumi.Input<string>;
  /**
   * GitLab project path in `namespace/project` form, e.g.
   * `michael.solla/pulumi-cloud-solla-resume`. Only pipelines running in this
   * exact GitLab project can federate as the deployer service account.
   */
  gitlabProjectPath: string;
  /**
   * Email of the runtime service account Cloud Run revisions run as (the
   * default compute SA, unless the service sets a custom one). Deploying a
   * new revision requires `iam.serviceaccounts.actAs` on this exact SA --
   * granting it project-wide would let the deployer impersonate every
   * service account in the project.
   */
  computeDefaultServiceAccountEmail: pulumi.Input<string>;
}

/**
 * Keyless GitLab CI -> GCP authentication via Workload Identity Federation (WIF).
 *
 * The handshake, end to end:
 * 1. A GitLab CI job requests a short-lived OIDC ID token (`id_tokens:` keyword).
 * 2. The token's issuer (`https://gitlab.com`) and claims (`sub`, `project_path`,
 *    `ref`) are checked against the WorkloadIdentityPoolProvider below.
 * 3. If `attribute.project_path` matches this GitLab project, GCP's Security
 *    Token Service exchanges the GitLab token for a short-lived federated GCP
 *    token that can impersonate `gitlab-ci-deployer` -- allowed only because of
 *    the `iam.workloadIdentityUser` binding scoped to that exact principal set.
 * 4. `pulumi preview`/`up` then runs as that service account. No static JSON
 *    key ever leaves GCP or gets stored in GitLab.
 */
export class GitlabCiWif extends pulumi.ComponentResource {
  /** Email of the service account GitLab CI impersonates. */
  public readonly serviceAccountEmail: pulumi.Output<string>;
  /**
   * Fully qualified provider resource name, e.g.
   * `projects/<number>/locations/global/workloadIdentityPools/gitlab-pool/providers/gitlab-provider`.
   * Used verbatim as the `create-cred-config` audience, and prefixed with
   * `https://iam.googleapis.com/` as the `id_tokens` `aud` claim, in
   * `.gitlab-ci.yml`.
   */
  public readonly providerName: pulumi.Output<string>;

  constructor(
    name: string,
    args: GitlabCiWifArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("solla:ci:GitlabCiWif", name, args, opts);

    const pool = new gcp.iam.WorkloadIdentityPool(
      `${name}-pool`,
      {
        workloadIdentityPoolId: "gitlab-pool",
        displayName: "GitLab CI",
        description: "Federates GitLab CI/CD pipelines for keyless GCP auth",
      },
      { parent: this },
    );

    const provider = new gcp.iam.WorkloadIdentityPoolProvider(
      `${name}-provider`,
      {
        workloadIdentityPoolId: pool.workloadIdentityPoolId,
        workloadIdentityPoolProviderId: "gitlab-provider",
        displayName: "GitLab OIDC",
        // Only pipelines from this exact GitLab project may federate at all.
        // Tighten further (e.g. `&& attribute.ref == 'refs/heads/main'`) if
        // preview and deploy should have different trust boundaries -- for
        // now the .gitlab-ci.yml `rules:` blocks are what separate them.
        attributeCondition: `attribute.project_path == '${args.gitlabProjectPath}'`,
        attributeMapping: {
          "google.subject": "assertion.sub",
          "attribute.project_path": "assertion.project_path",
          "attribute.ref": "assertion.ref",
        },
        oidc: {
          issuerUri: "https://gitlab.com",
        },
      },
      { parent: this },
    );

    const deployer = new gcp.serviceaccount.Account(
      `${name}-sa`,
      {
        accountId: "gitlab-ci-deployer",
        displayName: "GitLab CI deployer (WIF)",
        description:
          "Impersonated by GitLab CI/CD via Workload Identity Federation to run `pulumi preview`/`up`",
      },
      { parent: this },
    );

    // Least-privilege roles for what this stack actually manages -- Cloud
    // Run, Artifact Registry, and API enablement. Pulumi *state* lives in
    // Pulumi Cloud (via PULUMI_ACCESS_TOKEN in CI), not GCP, so no
    // storage/state roles are needed here.
    const projectRoles = [
      "roles/run.admin",
      "roles/artifactregistry.admin",
      "roles/serviceusage.serviceUsageAdmin",
      "roles/browser", // resourcemanager.projects.get, used by getProjectOutput()
      "roles/compute.viewer", // compute.regions.list, probed by the gcp provider on startup
    ];

    for (const role of projectRoles) {
      new gcp.projects.IAMMember(
        `${name}-${role.replace(/[^a-zA-Z0-9]+/g, "-")}`,
        {
          project: args.projectId,
          role,
          member: pulumi.interpolate`serviceAccount:${deployer.email}`,
        },
        { parent: this },
      );
    }

    // Deploying a Cloud Run revision requires the caller to be able to
    // `actAs` the runtime service account, not just manage the Cloud Run
    // resource itself -- scoped to that one SA, not project-wide.
    new gcp.serviceaccount.IAMMember(
      `${name}-compute-sa-actas`,
      {
        serviceAccountId: pulumi.interpolate`projects/-/serviceAccounts/${args.computeDefaultServiceAccountEmail}`,
        role: "roles/iam.serviceAccountUser",
        member: pulumi.interpolate`serviceAccount:${deployer.email}`,
      },
      { parent: this },
    );

    // The actual "keyless" trust edge: only principals matching the
    // attribute condition above may impersonate the deployer SA.
    const principalSet = pulumi.interpolate`principalSet://iam.googleapis.com/${pool.name}/attribute.project_path/${args.gitlabProjectPath}`;

    new gcp.serviceaccount.IAMMember(
      `${name}-wif-user`,
      {
        serviceAccountId: deployer.name,
        role: "roles/iam.workloadIdentityUser",
        member: principalSet,
      },
      { parent: this, dependsOn: [provider] },
    );

    this.serviceAccountEmail = deployer.email;
    this.providerName = provider.name;

    this.registerOutputs({
      serviceAccountEmail: this.serviceAccountEmail,
      providerName: this.providerName,
    });
  }
}
