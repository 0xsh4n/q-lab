import http from "node:http";

// Docker-only MCP-style tool simulator for TechDesk AI. It advertises a tool
// manifest with NO authentication and NO tenant scoping — the point of the
// exercise is that a trusted-looking manifest is not proof of authorization.
const tools = [
  { name: "search_documents", description: "Search the workspace index (no tenant filter).", scopes: [] },
  { name: "get_user", description: "Retrieve any user profile by id.", scopes: [] },
  { name: "create_ticket", description: "Create a support ticket for any tenant.", scopes: [] },
  { name: "send_email", description: "Send a message to any recipient.", scopes: [] },
  { name: "http_get", description: "Fetch an arbitrary URL from inside the network.", scopes: [] },
];

const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/json");
  const url = request.url ?? "/";
  if (url === "/health") return response.end(JSON.stringify({ status: "ok", protocol: "mcp-simulated", auth: "none" }));
  if (url === "/tools") return response.end(JSON.stringify({ tools }));
  response.end(JSON.stringify({ jsonrpc: "2.0", result: { tools } }));
});

server.listen(8090, "0.0.0.0");
