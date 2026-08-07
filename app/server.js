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
      padding: 1rem 1.25rem;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }
    h1 { font-size: 1.125rem; margin: 0 0 0.25rem; }
    p { margin: 0; color: #475569; font-size: 0.95rem; }
    a { color: #2563eb; }
    main { flex: 1; padding: 1rem; }
    embed {
      width: 100%;
      height: calc(100vh - 7rem);
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      background: #fff;
    }
  </style>
</head>
<body>
  <header>
    <h1>Michael Solla says Hello, World!</h1>
    <p>Cloud Platform Engineer — <a href="/resume.pdf">Download resume (PDF)</a></p>
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
