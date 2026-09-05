import { Router } from "express";
import { getDb } from "../store/json-store.js";
import {
  adjustInventory,
  bulkStatus,
  createProduct,
  deleteCategory,
  deleteCollection,
  deleteProducts,
  getCollection,
  getProduct,
  listCategories,
  listCollections,
  listInventory,
  listProducts,
  saveCategory,
  saveCollection,
  setProductStatus,
  updateProduct,
} from "../services/catalog.service.js";
import {
  categoryInputSchema,
  collectionInputSchema,
  inventoryPatchSchema,
  productInputSchema,
  productPatchSchema,
  productStatusSchema,
} from "../models/schemas.js";
import { validateBody } from "../middleware/validate.js";
import { ok, param } from "../utils/http.js";
import type { Product } from "../types/index.js";

function q(req: { query: Record<string, unknown> }) {
  return Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]));
}

export const catalogRouter = Router();

catalogRouter.get("/products", (req, res) => {
  res.json(ok(listProducts(q(req))));
});

catalogRouter.get("/products/:id", (req, res) => {
  res.json(ok(getProduct(param(req.params.id), req.query.public === "1")));
});

catalogRouter.post("/products", validateBody(productInputSchema), (req, res) => {
  res.status(201).json(ok(createProduct(req.body as Product)));
});

catalogRouter.put("/products/:id", validateBody(productInputSchema), (req, res) => {
  res.json(ok(updateProduct(param(req.params.id), req.body)));
});

catalogRouter.patch("/products/:id", validateBody(productPatchSchema), (req, res) => {
  res.json(ok(updateProduct(param(req.params.id), req.body)));
});

catalogRouter.delete("/products/:id", (req, res) => {
  res.json(ok(deleteProducts([param(req.params.id)])));
});

catalogRouter.post("/products/bulk-delete", (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  res.json(ok(deleteProducts(ids)));
});

catalogRouter.post("/products/bulk-status", (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const status = productStatusSchema.parse(req.body?.status);
  res.json(ok(bulkStatus(ids, status)));
});

catalogRouter.patch("/products/:id/status", (req, res) => {
  const status = productStatusSchema.parse(req.body?.status);
  res.json(ok(setProductStatus(param(req.params.id), status)));
});

catalogRouter.get("/categories", (req, res) => {
  res.json(ok(listCategories(q(req))));
});

catalogRouter.post("/categories", validateBody(categoryInputSchema), (req, res) => {
  res.status(201).json(ok(saveCategory(req.body)));
});

catalogRouter.put("/categories/:id", validateBody(categoryInputSchema), (req, res) => {
  res.json(ok(saveCategory({ ...req.body, id: param(req.params.id) })));
});

catalogRouter.delete("/categories/:id", (req, res) => {
  res.json(ok(deleteCategory(param(req.params.id))));
});

catalogRouter.get("/collections", (req, res) => {
  res.json(ok(listCollections(q(req))));
});

catalogRouter.get("/collections/:id", (req, res) => {
  res.json(ok(getCollection(param(req.params.id), req.query.public === "1")));
});

catalogRouter.post("/collections", validateBody(collectionInputSchema), (req, res) => {
  res.status(201).json(ok(saveCollection(req.body)));
});

catalogRouter.put("/collections/:id", validateBody(collectionInputSchema), (req, res) => {
  res.json(ok(saveCollection({ ...req.body, id: param(req.params.id) })));
});

catalogRouter.delete("/collections/:id", (req, res) => {
  res.json(ok(deleteCollection(param(req.params.id))));
});

catalogRouter.get("/inventory", (_req, res) => {
  res.json(ok({ items: listInventory(), movements: getDb().movements }));
});

catalogRouter.patch("/inventory/:id", validateBody(inventoryPatchSchema), (req, res) => {
  res.json(ok(adjustInventory(param(req.params.id), req.body.quantity, req.body.reason, req.body.notes, req.body.user)));
});
