const http = require("http");

const port = Number(process.env.PORT) || 8080;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Hello, World!\n");
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
