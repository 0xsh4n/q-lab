import http from "node:http";

const tools = [
  { name: "search_documents", description: "Search the synthetic workspace index." },
  { name: "get_user", description: "Retrieve a synthetic user profile." },
  { name: "create_ticket", description: "Create a synthetic support ticket." },
];

const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.url === "/health") return response.end(JSON.stringify({ status: "ok", protocol: "mcp-simulated" }));
  if (request.url === "/tools") return response.end(JSON.stringify({ tools }));
  response.end(JSON.stringify({ jsonrpc: "2.0", result: { tools } }));
});

server.listen(8090, "0.0.0.0");