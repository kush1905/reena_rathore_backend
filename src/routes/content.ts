import { Router } from "express";
import {
  deleteBanner,
  getHomepage,
  listBanners,
  putHomepage,
  saveBanner,
  setBannerStatus,
  toggleHomepageSection,
} from "../services/content.service.js";
import { bannerInputSchema, homepagePutSchema } from "../models/schemas.js";
import { validateBody } from "../middleware/validate.js";
import { ok, param } from "../utils/http.js";
import { z } from "zod";

export const contentRouter = Router();

contentRouter.get("/banners", (req, res) => {
  const query = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]));
  res.json(ok(listBanners(query)));
});

contentRouter.post("/banners", validateBody(bannerInputSchema), (req, res) => {
  res.status(201).json(ok(saveBanner(req.body)));
});

contentRouter.put("/banners/:id", validateBody(bannerInputSchema), (req, res) => {
  res.json(ok(saveBanner({ ...req.body, id: param(req.params.id) })));
});

contentRouter.delete("/banners/:id", (req, res) => {
  res.json(ok(deleteBanner(param(req.params.id))));
});

contentRouter.patch("/banners/:id/status", (req, res) => {
  const status = z.enum(["draft", "scheduled", "published"]).parse(req.body?.status);
  res.json(ok(setBannerStatus(param(req.params.id), status)));
});

contentRouter.get("/homepage", (req, res) => {
  res.json(ok(getHomepage(req.query.public === "1")));
});

contentRouter.put("/homepage", validateBody(homepagePutSchema), (req, res) => {
  res.json(ok(putHomepage(req.body.sections)));
});

contentRouter.patch("/homepage/:id/toggle", (req, res) => {
  res.json(ok(toggleHomepageSection(param(req.params.id))));
});
