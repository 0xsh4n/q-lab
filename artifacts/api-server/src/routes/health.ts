import { Router, type IRouter } from "express";
import { settings, mode } from "../lib/store";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    product: settings.productName,
    labMode: mode(),
    model: settings.model,
    services: {
      api: "ready",
      postgres: "synthetic-seed",
      qdrant: "synthetic-index",
      ollama: process.env.LLM_PROVIDER === "ollama" ? "configured" : "optional",
      mcp: settings.mcpEnabled ? "ready" : "disabled",
    },
  });
});

export default router;
