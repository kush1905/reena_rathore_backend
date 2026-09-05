import express from "express";
import cors from "cors";
import { catalogRouter } from "./routes/catalog.js";
import { contentRouter } from "./routes/content.js";
import { commerceRouter } from "./routes/commerce.js";
import { adminRouter } from "./routes/admin.js";
import { uploadRouter, uploadsDir } from "./routes/upload.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { mediaUrlMiddleware } from "./middleware/media-urls.js";
import { resetStore } from "./store/json-store.js";
import { ok } from "./utils/http.js";

function isLocalDevOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin) || isLocalDevOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(mediaUrlMiddleware);
  app.use("/uploads", express.static(uploadsDir));

  app.get("/health", (_req, res) => {
    res.json(ok({ status: "ok", service: "reena-rathore-api" }));
  });

  app.post("/api/admin/seed", (_req, res) => {
    resetStore();
    res.json(ok({ reset: true }));
  });

  app.use("/api", uploadRouter);
  app.use("/api", catalogRouter);
  app.use("/api", contentRouter);
  app.use("/api", commerceRouter);
  app.use("/api", adminRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
