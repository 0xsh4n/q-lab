import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({
    status: "ok",
    labMode: process.env.LAB_MODE ?? "vulnerable",
    model: process.env.OLLAMA_MODEL ?? "phi3:mini",
    services: {
      api: "ready",
      postgres: "synthetic-seed",
      qdrant: "synthetic-index",
      ollama: process.env.LLM_PROVIDER === "ollama" ? "configured" : "optional",
    },
  });
  res.json(data);
});

export default router;
