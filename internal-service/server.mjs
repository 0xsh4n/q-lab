import http from "node:http";

const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.url === "/health") {
    response.end(JSON.stringify({ status: "ok", service: "internal-service" }));
    return;
  }
  response.end(JSON.stringify({
    service: "Q-Lab synthetic metadata relay",
    environment: "synthetic",
    note: "Docker-only fixture for the SSRF lesson. No host or public network access is available.",
  }));
});

server.listen(8081, "0.0.0.0");