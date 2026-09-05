import { Router } from "express";
import {
  addCartItem,
  addWishlistItem,
  createOrder,
  getCart,
  getOrder,
  getWishlist,
  listOrders,
  removeCartItem,
  removeWishlistItem,
  updateCartItem,
  updateOrderStatus,
} from "../services/commerce.service.js";
import { getCustomer, listCustomers, listReviews, setCustomerAddresses, setReviewStatus } from "../services/admin.service.js";
import {
  cartItemSchema,
  cartQtySchema,
  customerAddressesSchema,
  orderCreateSchema,
  orderStatusSchema,
  reviewStatusSchema,
  wishlistItemSchema,
} from "../models/schemas.js";
import { validateBody } from "../middleware/validate.js";
import { ok, param } from "../utils/http.js";

export const commerceRouter = Router();

commerceRouter.get("/customers", (_req, res) => {
  res.json(ok(listCustomers()));
});

commerceRouter.get("/customers/:id", (req, res) => {
  res.json(ok(getCustomer(param(req.params.id))));
});

commerceRouter.patch("/customers/:id/addresses", validateBody(customerAddressesSchema), (req, res) => {
  res.json(ok(setCustomerAddresses(param(req.params.id), req.body.addresses)));
});

commerceRouter.get("/reviews", (req, res) => {
  const query = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]));
  res.json(ok(listReviews(query)));
});

commerceRouter.patch("/reviews/:id/status", validateBody(reviewStatusSchema), (req, res) => {
  res.json(ok(setReviewStatus(param(req.params.id), req.body.status, req.body.reply)));
});

commerceRouter.get("/wishlist/:customerId", (req, res) => {
  res.json(ok(getWishlist(param(req.params.customerId))));
});

commerceRouter.post("/wishlist/:customerId/items", validateBody(wishlistItemSchema), (req, res) => {
  res.status(201).json(ok(addWishlistItem(param(req.params.customerId), req.body.productId)));
});

commerceRouter.delete("/wishlist/:customerId/items/:productId", (req, res) => {
  res.json(ok(removeWishlistItem(param(req.params.customerId), param(req.params.productId))));
});

commerceRouter.get("/cart/:customerId", (req, res) => {
  res.json(ok(getCart(param(req.params.customerId))));
});

commerceRouter.post("/cart/:customerId/items", validateBody(cartItemSchema), (req, res) => {
  res.status(201).json(ok(addCartItem(param(req.params.customerId), req.body.sku, req.body.quantity, req.body.size, req.body.color)));
});

commerceRouter.patch("/cart/:customerId/items/:productId", validateBody(cartQtySchema), (req, res) => {
  res.json(ok(updateCartItem(param(req.params.customerId), param(req.params.productId), req.body.quantity)));
});

commerceRouter.delete("/cart/:customerId/items/:productId", (req, res) => {
  res.json(ok(removeCartItem(param(req.params.customerId), param(req.params.productId))));
});

commerceRouter.get("/orders", (req, res) => {
  const query = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]));
  res.json(ok(listOrders(query)));
});

commerceRouter.get("/orders/:id", (req, res) => {
  res.json(ok(getOrder(param(req.params.id))));
});

commerceRouter.post("/orders", validateBody(orderCreateSchema), (req, res) => {
  res.status(201).json(ok(createOrder(req.body)));
});

commerceRouter.patch("/orders/:id/status", validateBody(orderStatusSchema), (req, res) => {
  res.json(ok(updateOrderStatus(param(req.params.id), req.body.status, req.body.note)));
});
