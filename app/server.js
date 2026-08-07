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
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    h1 { font-size: 1.35rem; margin: 0 0 0.5rem; font-weight: 650; }
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
    .repo-links { margin: 0.5rem 0 0; color: #64748b; font-size: 0.875rem; }
    .repo-links a { margin-right: 0.75rem; }
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
    main { flex: 1; padding: 1rem; }
    embed {
      width: 100%;
      height: calc(100vh - 12rem);
      min-height: 420px;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      background: #fff;
    }
  </style>
</head>
<body>
  <header>
    <h1>Hello from the cloud.</h1>
    <p class="tagline">
      You're viewing my resume through a <strong>containerized Node.js app</strong> on
      <strong>Google Cloud Run</strong> — built, pushed, and deployed with
      <strong>Pulumi</strong> on GCP.
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
      Source code:
      <a href="https://github.com/michaelsolla/Pulumi-GCP-Ed" rel="noopener noreferrer" target="_blank">GitHub</a>
      <a href="https://gitlab.com/michael.solla/Pulumi-GCP-Ed" rel="noopener noreferrer" target="_blank">GitLab</a>
    </p>
    <div class="badges" aria-label="Tech stack">
      <span class="badge">Docker</span>
      <span class="badge">Cloud Run</span>
      <span class="badge">GCP</span>
      <span class="badge">Pulumi</span>
    </div>
  </header>
  <main>
    <embed src="/resume.pdf" type="application/pdf" title="Michael Solla Resume" />
  </main>
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
