const fs = require("fs");
const http = require("http");
const path = require("path");

const port = Number(process.env.PORT) || 8080;
const resumeFileName = "Michael Solla - Resume - Cloud Platform Engineer.pdf";
const resumePath = path.join(__dirname, "assets", resumeFileName);

const homePage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Michael Solla — Cloud Platform Engineer</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      color: #0f172a;
    }
    header {
      padding: 1.25rem 1.5rem 1rem;
      background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    h1 { font-size: 1.35rem; margin: 0 0 0.5rem; font-weight: 650; }
    h2 {
      font-size: 0.8rem;
      margin: 0 0 0.6rem;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #64748b;
    }
    .tagline { margin: 0 0 0.75rem; color: #334155; font-size: 0.975rem; line-height: 1.5; }
    .dedication {
      margin: 0 0 0.75rem;
      padding: 0.65rem 0.85rem;
      background: #fff;
      border-left: 3px solid #2563eb;
      border-radius: 0 0.375rem 0.375rem 0;
      color: #475569;
      font-size: 0.925rem;
      line-height: 1.5;
    }
    .meta { margin: 0; color: #64748b; font-size: 0.875rem; line-height: 1.6; }
    .repo-links { margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem 0.9rem; }
    .repo-links a { margin-right: 0; }
    .pipeline-badge { height: 20px; vertical-align: middle; }
    .badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.65rem; }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: #e0e7ff;
      color: #3730a3;
      font-weight: 500;
    }
    a { color: #2563eb; }
    .status {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.85rem 0 0;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      background: #fff;
      color: #334155;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-live { background: #16a34a; }
    .dot-idle { background: #94a3b8; }
    .platform {
      padding: 1.1rem 1.5rem 0.25rem;
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 1.25rem 1.75rem;
      border-bottom: 1px solid #e2e8f0;
      background: #fff;
    }
    .diagram {
      overflow-x: auto;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
    }
    .diagram .mermaid { margin: 0; }
    .caption {
      margin: 0.65rem 0 0;
      color: #64748b;
      font-size: 0.82rem;
      line-height: 1.5;
    }
    .copy p, .copy li { margin: 0 0 0.55rem; color: #334155; font-size: 0.9rem; line-height: 1.55; }
    .copy ul { margin: 0 0 0.75rem; padding-left: 1.15rem; }
    .copy p:last-child, .copy ul:last-child { margin-bottom: 0; }
    main { flex: 1; padding: 1rem 1.5rem 1.5rem; }
    embed {
      width: 100%;
      height: calc(100vh - 18rem);
      min-height: 420px;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      background: #fff;
    }
    @media (max-width: 900px) {
      .platform { grid-template-columns: 1fr; }
      embed { height: 70vh; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Hello from the cloud.</h1>
    <p class="tagline">
      You're viewing my resume through a <strong>containerized Node.js app</strong> on
      <strong>Google Cloud Run</strong> — built, pushed, and deployed with
      <strong>Pulumi</strong> on GCP. Kubernetes is a separate lab; this page is Cloud Run.
    </p>
    <p class="dedication">
      To Maria and Max — thank you for the love, patience, and joy that make every
      project (and this one) worth sharing.
    </p>
    <p class="meta">
      Michael Solla · Cloud Platform Engineer ·
      <a href="/resume.pdf">Download resume (PDF)</a>
    </p>
    <p class="repo-links">
      <span>Source:
        <a href="https://github.com/michaelsolla/pulumi-cloud-solla-resume" rel="noopener noreferrer" target="_blank">GitHub</a>
        ·
        <a href="https://gitlab.com/michael.solla/pulumi-cloud-solla-resume" rel="noopener noreferrer" target="_blank">GitLab</a>
      </span>
      <a href="https://gitlab.com/michael.solla/pulumi-cloud-solla-resume/-/pipelines?ref=main" rel="noopener noreferrer" target="_blank">
        <img class="pipeline-badge" alt="GitLab pipeline (main)" src="https://gitlab.com/michael.solla/pulumi-cloud-solla-resume/badges/main/pipeline.svg">
      </a>
    </p>
    <div class="badges" aria-label="Tech stack">
      <span class="badge">Pulumi</span>
      <span class="badge">GCP</span>
      <span class="badge">Cloud Run</span>
      <span class="badge">Docker</span>
      <span class="badge">GitLab CI + WIF</span>
      <span class="badge">GKE Autopilot lab</span>
    </div>
    <div class="status" aria-label="Runtime status">
      <span class="pill"><span class="dot dot-live" aria-hidden="true"></span> Cloud Run — live (this page)</span>
      <span class="pill"><span class="dot dot-idle" aria-hidden="true"></span> GKE Autopilot lab — offline by default</span>
    </div>
  </header>
  <section class="platform" aria-label="Architecture and trade-offs">
    <div>
      <h2>Architecture</h2>
      <div class="diagram">
        <pre class="mermaid">
flowchart LR
  Human[Human] --> GH[GitHub]
  Agent[Cloud agent] --> GH
  GH --> Copy[GitHub Action copies git to GitLab]
  Copy --> GL[GitLab CI + WIF]
  GL --> CR[Cloud Run]
  CR --> DNS[resume.solla.app]
  GH -.-> Kind[kind — local lab]
  GH -.-> GKE[GKE Autopilot — on demand]
        </pre>
      </div>
      <p class="caption">
        A person or a cloud agent lands work on GitHub. A GitHub Action copies the
        <em>same git branch</em> to GitLab. GitLab CI runs Pulumi against GCP. GitHub Actions never deploys.
      </p>
    </div>
    <div class="copy">
      <h2>Why these trade-offs</h2>
      <ul>
        <li><strong>Pulumi, not Terraform.</strong> One TypeScript program for Cloud Run, kind, and Autopilot. This repo is Pulumi-first on purpose — not a second language for the same graph.</li>
        <li><strong>Cloud Run is the public site.</strong> Always-on and cheap. GKE Autopilot is an on-demand lab, destroyed when idle: the control-plane credit does not cover Pods, and an HTTP(S) load balancer would add about $15–20/month. No public GKE URL.</li>
        <li><strong>GitHub for humans and cloud agents, GitLab for deploy.</strong> A person and a Cursor Cloud Agent both open PRs on GitHub — GitLab.com Free cannot issue the project access tokens those agents need. A GitHub Action copies each branch to GitLab; shared runners plus GCP Workload Identity Federation run <code>pulumi up</code>. GitHub Actions never deploys.</li>
      </ul>
      <h2>Security</h2>
      <p>
        GCP is keyless WIF — no service-account JSON in CI. Pulumi Cloud uses a GitLab
        <code>PULUMI_ACCESS_TOKEN</code> (masked, not Protected) so feature-branch
        <code>preview</code> can log in. That is acceptable on a solo personal repo; a team would
        typically use Pulumi OIDC/ESC and protected branches. The token lives only on GitLab.
      </p>
    </div>
  </section>
  <main>
    <embed src="/resume.pdf" type="application/pdf" title="Michael Solla Resume" />
  </main>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "strict" });
  </script>
</body>
</html>`;

function sendFile(res, filePath, contentType, disposition) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Resume not found\n");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url?.split("?")[0] ?? "/";

  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(homePage);
    return;
  }

  if (url === "/resume.pdf") {
    sendFile(
      res,
      resumePath,
      "application/pdf",
      'inline; filename="Michael-Solla-Resume.pdf"',
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
