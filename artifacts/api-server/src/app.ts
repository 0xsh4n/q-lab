import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authenticate } from "./lib/context";
import { isSecure, settings } from "./lib/store";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// INTENTIONAL-LAB-VULNERABILITY: CORS. Vulnerable mode reflects any Origin and
// allows credentials, so a malicious site can read authenticated responses.
// Secure mode allows only the local app origin and disallows credential sharing.
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.header("origin");
  if (isSecure()) {
    if (origin === "http://localhost:8080") {
      res.header("Access-Control-Allow-Origin", origin);
    }
  } else if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Headers", "content-type, authorization, x-lab-user, x-api-key, x-middleware-subrequest");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Security headers are applied ONLY in secure mode. Their absence in vulnerable
// mode (no CSP, no HSTS, no X-Frame-Options) is itself part of the lab
// (OWASP A05:2021 Security Misconfiguration).
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (isSecure()) {
    res.header("Content-Security-Policy", "default-src 'self'");
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    res.header("Referrer-Policy", "no-referrer");
    res.header("Strict-Transport-Security", "max-age=63072000");
    res.removeHeader("X-Powered-By");
  } else {
    // Advertise the stack (fingerprinting aid) in vulnerable mode.
    res.header("X-Powered-By", "Express / TechDesk-AI 2.0");
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Resolve caller identity for every API request.
app.use("/api", authenticate);
app.use("/api", router);

// INTENTIONAL-LAB-VULNERABILITY: verbose error handler. In vulnerable/debug mode
// it returns the stack trace and request context to the client
// (OWASP A05:2021 / API8:2023 information disclosure).
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "unhandled error");
  if (!isSecure() || settings.debugEnabled) {
    res.status(500).json({
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 12),
      request: { method: req.method, url: req.originalUrl, body: req.body, headers: req.headers },
    });
    return;
  }
  res.status(500).json({ error: "Internal server error." });
});

export default app;
