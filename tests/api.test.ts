import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetStore } from "../src/store/json-store.js";

const app = createApp();

beforeEach(() => {
  resetStore();
});

describe("Reena Rathore API", () => {
  it("lists published products only when public=1", async () => {
    const all = await request(app).get("/api/products");
    const pub = await request(app).get("/api/products?public=1");
    expect(all.body.success).toBe(true);
    expect(pub.body.data.every((p: { status: string }) => p.status === "published")).toBe(true);
    expect(pub.body.data.length).toBeLessThan(all.body.data.length);
  });

  it("creates, updates, and unpublishes a product", async () => {
    const created = await request(app)
      .post("/api/products")
      .send({
        title: "Hand Embroidered Silk Saree",
        sku: "AR-SR-DEMO-1",
        mrp: 88000,
        price: 72000,
        categoryId: "cat_sarees",
        status: "published",
        images: ["https://images.unsplash.com/photo-1583391733956-6c78276477e2"],
        colors: [{ name: "Ivory", hex: "#F4EFE6" }],
        sizes: ["Free size"],
        variants: [
          {
            id: "v_demo",
            color: "Ivory",
            colorHex: "#F4EFE6",
            size: "Free size",
            sku: "AR-SR-DEMO-1-IV-FS",
            price: 72000,
            stock: 5,
            reserved: 0,
          },
        ],
      });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    const updated = await request(app).patch(`/api/products/${id}`).send({ title: "Rose Silk Lehenga", price: 69000 });
    expect(updated.body.data.title).toBe("Rose Silk Lehenga");
    expect(updated.body.data.price).toBe(69000);
    await request(app).patch(`/api/products/${id}/status`).send({ status: "draft" });
    const pub = await request(app).get("/api/products?public=1");
    expect(pub.body.data.some((p: { id: string }) => p.id === id)).toBe(false);
  });

  it("rejects duplicate SKUs", async () => {
    const res = await request(app).post("/api/products").send({
      title: "Ivory Chanderi Kurta Set",
      sku: "AD-LH-2401",
      mrp: 10,
      price: 10,
      categoryId: "cat_kurtas",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_SKU");
  });

  it("supports category CRUD", async () => {
    const created = await request(app).post("/api/categories").send({ name: "Dupattas" });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    const updated = await request(app).put(`/api/categories/${id}`).send({ name: "Embroidered Organza Dupatta" });
    expect(updated.body.data.name).toContain("Dupatta");
    const deleted = await request(app).delete(`/api/categories/${id}`);
    expect(deleted.body.success).toBe(true);
  });

  it("creates and publishes banners", async () => {
    const created = await request(app).post("/api/banners").send({
      title: "Festive courtyard",
      subtitle: "Gota and silk",
      desktopImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
      status: "draft",
    });
    const id = created.body.data.id;
    const published = await request(app).patch(`/api/banners/${id}/status`).send({ status: "published" });
    expect(published.body.data.status).toBe("published");
    const list = await request(app).get("/api/banners?public=1");
    expect(list.body.data.some((b: { id: string }) => b.id === id)).toBe(true);
  });

  it("reads and updates homepage visibility", async () => {
    const home = await request(app).get("/api/homepage");
    expect(home.body.data.sections.length).toBeGreaterThan(3);
    expect(home.body.data.resolved.heroBanners.length).toBeGreaterThan(0);
    const hidden = home.body.data.sections.map((s: { id: string; visible: boolean; type: string; title: string; preview: string }) => ({
      ...s,
      visible: s.type !== "hero",
    }));
    await request(app).put("/api/homepage").send({ sections: hidden });
    const pub = await request(app).get("/api/homepage?public=1");
    expect(pub.body.data.sections.some((s: { type: string }) => s.type === "hero")).toBe(false);
  });

  it("updates inventory stock", async () => {
    const patched = await request(app)
      .patch("/api/inventory/AD-LH-2401-IV-S")
      .send({ quantity: -1, reason: "Demo adjustment" });
    expect(patched.body.success).toBe(true);
    const variant = patched.body.data.product.variants.find((v: { sku: string }) => v.sku === "AD-LH-2401-IV-S");
    expect(variant.stock).toBe(3);
  });

  it("supports cart, wishlist, order, and stock decrement", async () => {
    const wish = await request(app).post("/api/wishlist/cus_demo/items").send({ productId: "prd_06" });
    expect(wish.status).toBe(201);
    const wishList = await request(app).get("/api/wishlist/cus_demo");
    expect(wishList.body.data.some((w: { productId: string }) => w.productId === "prd_06")).toBe(true);

    const added = await request(app).post("/api/cart/cus_demo/items").send({
      sku: "AD-AC-702-IV-OS",
      quantity: 2,
      size: "One size",
      color: "Ivory",
    });
    expect(added.body.data.items[0].price).toBe(8200);

    const before = await request(app).get("/api/products/prd_16");
    const stockBefore = before.body.data.variants.find((v: { sku: string }) => v.sku === "AD-AC-702-IV-OS").stock;

    const order = await request(app).post("/api/orders").send({
      customerId: "cus_demo",
      fulfillmentType: "home_delivery",
      paymentMethod: "Demo card",
      shippingAddress: {
        name: "Demo User",
        phone: "+91 9000000001",
        line1: "Mehrauli Flagship",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110030",
        country: "India",
      },
    });
    expect(order.status).toBe(201);
    expect(order.body.data.subtotal).toBe(16400);
    expect(order.body.data.paymentStatus).toBe("paid");

    const after = await request(app).get("/api/products/prd_16");
    const stockAfter = after.body.data.variants.find((v: { sku: string }) => v.sku === "AD-AC-702-IV-OS").stock;
    expect(stockAfter).toBe(stockBefore - 2);

    const cart = await request(app).get("/api/cart/cus_demo");
    expect(cart.body.data.items).toHaveLength(0);

    const status = await request(app).patch(`/api/orders/${order.body.data.id}/status`).send({ status: "dispatched" });
    expect(status.body.data.orderStatus).toBe("dispatched");
    expect(status.body.data.timeline.some((t: { label: string; done: boolean }) => t.label === "Dispatched" && t.done)).toBe(true);
  });

  it("uploads an image and serves it from /uploads", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const uploaded = await request(app)
      .post("/api/upload")
      .attach("file", png, { filename: "pixel.png", contentType: "image/png" });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.success).toBe(true);
    expect(uploaded.body.data.url).toMatch(/\/uploads\/img_/);

    const filename = String(uploaded.body.data.url).split("/uploads/")[1];
    const served = await request(app).get(`/uploads/${filename}`);
    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/image/);
  });

  it("hides unapproved reviews from the public list", async () => {
    const pub = await request(app).get("/api/reviews?public=1&productId=prd_03");
    expect(pub.body.data.every((r: { status: string }) => r.status === "approved")).toBe(true);
    await request(app).patch("/api/reviews/rev_07/status").send({ status: "approved" });
    const after = await request(app).get("/api/reviews?public=1&productId=prd_03");
    expect(after.body.data.some((r: { id: string }) => r.id === "rev_07")).toBe(true);
  });
});
