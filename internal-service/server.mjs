import http from "node:http";

// Docker-only SSRF training fixture for TechDesk AI. No host or public network
// access is available from here. Every response is synthetic.
const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/json");
  const url = request.url ?? "/";
  if (url === "/health") {
    response.end(JSON.stringify({ status: "ok", service: "internal-service" }));
    return;
  }
  if (url.startsWith("/admin")) {
    // Stands in for an unauthenticated internal admin panel reachable via SSRF.
    response.end(JSON.stringify({
      panel: "internal-admin",
      note: "Reachable only from inside the Docker network — this is the SSRF impact target.",
      synthetic: true,
      secrets: { deployKey: "TD-INTERNAL-DEPLOY-9K2F-SYNTHETIC" },
    }));
    return;
  }
  if (url.startsWith("/webhook")) {
    response.end(JSON.stringify({ received: true, service: "internal-service", synthetic: true }));
    return;
  }
  // Emulates a cloud metadata relay (169.254.169.254-style) — the classic SSRF
  // pivot — but entirely synthetic and Docker-local.
  response.end(JSON.stringify({
    service: "TechDesk synthetic metadata relay",
    environment: "synthetic",
    instanceRole: "techdesk-internal",
    credentials: { accessKeyId: "AKIA-SYNTHETIC-LAB", secretAccessKey: "synthetic-not-a-real-secret", token: "synthetic" },
    note: "Docker-only fixture for the SSRF lesson. Not a real metadata service.",
  }));
});

server.listen(8081, "0.0.0.0");
