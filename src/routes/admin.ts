import { Router } from "express";
import {
  bootstrap,
  createShipment,
  saveCoupon,
  savePage,
  saveStaff,
  toggleCoupon,
  togglePermission,
  updatePickupStatus,
  updateReturnStatus,
  updateSettings,
  updateShipmentStatus,
} from "../services/admin.service.js";
import { settingsPatchSchema } from "../models/schemas.js";
import { validateBody } from "../middleware/validate.js";
import { ok, param } from "../utils/http.js";
import { getDb } from "../store/json-store.js";
import { z } from "zod";

export const adminRouter = Router();

adminRouter.get("/admin/bootstrap", (_req, res) => {
  res.json(ok(bootstrap()));
});

adminRouter.get("/settings", (_req, res) => {
  res.json(ok(getDb().settings));
});

adminRouter.patch("/settings", validateBody(settingsPatchSchema), (req, res) => {
  res.json(ok(updateSettings(req.body)));
});

adminRouter.get("/promotions", (_req, res) => {
  res.json(ok(getDb().promotions));
});

adminRouter.get("/coupons", (_req, res) => {
  res.json(ok(getDb().coupons));
});

adminRouter.put("/coupons/:id", (req, res) => {
  res.json(ok(saveCoupon({ ...req.body, id: param(req.params.id) })));
});

adminRouter.patch("/coupons/:id/toggle", (req, res) => {
  res.json(ok(toggleCoupon(param(req.params.id))));
});

adminRouter.get("/pages", (_req, res) => {
  res.json(ok(getDb().pages));
});

adminRouter.put("/pages/:id", (req, res) => {
  res.json(ok(savePage({ ...req.body, id: param(req.params.id) })));
});

adminRouter.get("/shipments", (_req, res) => {
  res.json(ok(getDb().shipments));
});

adminRouter.patch("/shipments/:id/status", (req, res) => {
  const status = z.enum(["label_created", "dispatched", "in_transit", "out_for_delivery", "delivered"]).parse(req.body?.status);
  res.json(ok(updateShipmentStatus(param(req.params.id), status)));
});

adminRouter.post("/shipments", (req, res) => {
  res.status(201).json(ok(createShipment(req.body.orderId, req.body.courier, req.body.tracking)));
});

adminRouter.get("/pickups", (_req, res) => {
  res.json(ok(getDb().pickups));
});

adminRouter.patch("/pickups/:id/status", (req, res) => {
  const status = z.enum(["awaiting", "ready", "picked_up", "completed"]).parse(req.body?.status);
  res.json(ok(updatePickupStatus(param(req.params.id), status)));
});

adminRouter.get("/returns", (_req, res) => {
  res.json(ok(getDb().returns));
});

adminRouter.patch("/returns/:id/status", (req, res) => {
  res.json(ok(updateReturnStatus(param(req.params.id), req.body.status)));
});

adminRouter.get("/staff", (_req, res) => {
  res.json(ok(getDb().staff));
});

adminRouter.put("/staff/:id", (req, res) => {
  res.json(ok(saveStaff({ ...req.body, id: param(req.params.id) })));
});

adminRouter.get("/roles", (_req, res) => {
  res.json(ok(getDb().roles));
});

adminRouter.patch("/roles/:id/permissions", (req, res) => {
  res.json(ok(togglePermission(param(req.params.id), req.body.module, req.body.action)));
});
