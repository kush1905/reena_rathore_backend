import type { Cart, Order, OrderItem, OrderStatus, WishlistEntry } from "../types/index.js";
import { HttpError, nowIso, uid } from "../utils/http.js";
import { getDb, mutate } from "../store/json-store.js";
import { decrementVariantStock } from "./catalog.service.js";

const DEMO_ALIASES = new Set(["cus_demo", "customer-demo-001"]);

export function resolveCustomerId(id: string) {
  return DEMO_ALIASES.has(id) ? "cus_demo" : id;
}

function requireCustomer(id: string) {
  const customerId = resolveCustomerId(id);
  const customer = getDb().customers.find((c) => c.id === customerId);
  if (!customer) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  return customer;
}

function findVariant(sku: string) {
  for (const product of getDb().products) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return null;
}

function cartValue(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function ensureCart(customerId: string): Cart {
  const customer = requireCustomer(customerId);
  const db = getDb();
  let cart = db.carts.find((c) => c.customerId === customer.id);
  if (!cart) {
    cart = {
      id: uid("cart"),
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      items: [],
      value: 0,
      updatedAt: nowIso(),
      abandoned: false,
    };
    db.carts.push(cart);
  }
  return cart;
}

export function getCart(customerId: string) {
  return mutate((db) => {
    const cart = ensureCart(customerId);
    cart.value = cartValue(cart.items);
    return db.carts.find((c) => c.id === cart.id)!;
  });
}

export function addCartItem(customerId: string, sku: string, quantity: number, size?: string, color?: string) {
  return mutate((db) => {
    const found = findVariant(sku);
    if (!found) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product variant not found");
    if (found.product.status !== "published") {
      throw new HttpError(400, "PRODUCT_UNAVAILABLE", "Product is not available");
    }
    if (found.variant.stock < quantity) {
      throw new HttpError(400, "INSUFFICIENT_STOCK", "Not enough stock");
    }
    const cart = ensureCart(customerId);
    const existing = cart.items.find((item) => item.sku === sku);
    if (existing) {
      existing.quantity += quantity;
      existing.price = found.variant.price;
    } else {
      cart.items.push({
        productId: found.product.id,
        title: found.product.title,
        sku,
        image: found.variant.image || found.product.images[0] || "",
        size: size || found.variant.size,
        color: color || found.variant.color,
        quantity,
        price: found.variant.price,
      });
    }
    cart.value = cartValue(cart.items);
    cart.updatedAt = nowIso();
    cart.abandoned = false;
    return cart;
  });
}

export function updateCartItem(customerId: string, sku: string, quantity: number) {
  return mutate((_db) => {
    const cart = ensureCart(customerId);
    const item = cart.items.find((i) => i.sku === sku);
    if (!item) throw new HttpError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
    const found = findVariant(sku);
    if (found && found.variant.stock < quantity) {
      throw new HttpError(400, "INSUFFICIENT_STOCK", "Not enough stock");
    }
    item.quantity = quantity;
    cart.value = cartValue(cart.items);
    cart.updatedAt = nowIso();
    return cart;
  });
}

export function removeCartItem(customerId: string, sku: string) {
  return mutate((_db) => {
    const cart = ensureCart(customerId);
    cart.items = cart.items.filter((i) => i.sku !== sku);
    cart.value = cartValue(cart.items);
    cart.updatedAt = nowIso();
    return cart;
  });
}

export function clearCart(customerId: string) {
  return mutate((_db) => {
    const cart = ensureCart(customerId);
    cart.items = [];
    cart.value = 0;
    cart.updatedAt = nowIso();
    return cart;
  });
}

export function getWishlist(customerId: string) {
  const customer = requireCustomer(customerId);
  return getDb().wishlists.filter((w) => w.customerId === customer.id);
}

export function addWishlistItem(customerId: string, productId: string) {
  return mutate((db) => {
    const customer = requireCustomer(customerId);
    const product = db.products.find((p) => p.id === productId);
    if (!product) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    const existing = db.wishlists.find((w) => w.customerId === customer.id && w.productId === productId);
    if (existing) return existing;
    const entry: WishlistEntry = {
      id: uid("w"),
      customerId: customer.id,
      customerName: customer.name,
      productId,
      addedAt: nowIso(),
    };
    db.wishlists.unshift(entry);
    return entry;
  });
}

export function removeWishlistItem(customerId: string, productId: string) {
  return mutate((db) => {
    const customer = requireCustomer(customerId);
    db.wishlists = db.wishlists.filter((w) => !(w.customerId === customer.id && w.productId === productId));
    return { deleted: true };
  });
}

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Payment confirmed",
  processing: "Processing",
  packed: "Packed",
  ready_for_pickup: "Ready for pickup",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
  refunded: "Refunded",
};

export function listOrders(query: Record<string, string | undefined>) {
  let items = [...getDb().orders];
  if (query.customerId) {
    const id = resolveCustomerId(query.customerId);
    items = items.filter((o) => o.customerId === id);
  }
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export function getOrder(id: string) {
  const order = getDb().orders.find((o) => o.id === id);
  if (!order) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  return order;
}

export function createOrder(input: {
  customerId: string;
  fulfillmentType: "home_delivery" | "store_pickup";
  paymentMethod?: string;
  shippingAddress: Order["shippingAddress"];
  billingAddress?: Order["billing"];
  pickupLocation?: string;
}) {
  return mutate((db) => {
    const customer = requireCustomer(input.customerId);
    const cart = db.carts.find((c) => c.customerId === customer.id);
    if (!cart || cart.items.length === 0) {
      throw new HttpError(400, "CART_EMPTY", "Cart is empty");
    }

    const priced: OrderItem[] = cart.items.map((item) => {
      const found = findVariant(item.sku);
      if (!found) throw new HttpError(400, "PRODUCT_NOT_FOUND", `Variant ${item.sku} is no longer available`);
      if (found.variant.stock < item.quantity) {
        throw new HttpError(400, "INSUFFICIENT_STOCK", `Not enough stock for ${found.product.title}`);
      }
      return {
        ...item,
        title: found.product.title,
        price: found.variant.price,
        image: found.product.images[0] || item.image,
      };
    });

    const subtotal = priced.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping =
      input.fulfillmentType === "store_pickup" || subtotal >= db.settings.freeShippingThreshold ? 0 : 450;
    const tax = Math.round((subtotal * db.settings.taxPercent) / 100);
    const total = subtotal + shipping + tax;
    const seq = 18000 + db.orders.length + 1;
    const id = `ORD-${seq}`;
    const created = nowIso();

    for (const item of priced) {
      decrementVariantStock(db, item.sku, item.quantity, `Order ${id}`);
    }

    const order: Order = {
      id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      date: created,
      items: priced,
      subtotal,
      discount: 0,
      shipping,
      tax,
      total,
      paymentStatus: "paid",
      paymentMethod: input.paymentMethod || "Demo card",
      transactionRef: `pay_demo_${Date.now().toString(36)}`,
      orderStatus: "confirmed",
      fulfillmentType: input.fulfillmentType,
      billing: input.billingAddress ?? input.shippingAddress,
      shippingAddress: input.shippingAddress,
      location: input.shippingAddress.city,
      pickupLocation: input.pickupLocation,
      timeline:
        input.fulfillmentType === "store_pickup"
          ? [
              { id: "t0", label: "Order placed", at: created, done: true },
              { id: "t1", label: "Payment confirmed", at: created, done: true },
              { id: "t2", label: "Packed", at: "", done: false },
              { id: "t3", label: "Ready for pickup", at: "", done: false },
              { id: "t4", label: "Picked up", at: "", done: false },
            ]
          : [
              { id: "t0", label: "Order placed", at: created, done: true },
              { id: "t1", label: "Payment confirmed", at: created, done: true },
              { id: "t2", label: "Packed", at: "", done: false },
              { id: "t3", label: "Dispatched", at: "", done: false },
              { id: "t4", label: "In transit", at: "", done: false },
              { id: "t5", label: "Delivered", at: "", done: false },
            ],
    };

    db.orders.unshift(order);
    cart.items = [];
    cart.value = 0;
    cart.updatedAt = created;
    customer.totalOrders += 1;
    customer.totalSpend += total;
    customer.lastPurchase = created;
    db.activity.unshift({
      id: uid("ac"),
      type: "order",
      message: `New order ${id} from ${customer.name}`,
      at: created,
    });
    return order;
  });
}

export function updateOrderStatus(id: string, status: OrderStatus, note?: string) {
  return mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
    order.orderStatus = status;
    const label = STATUS_LABEL[status];
    if (label) {
      const match = order.timeline.find((t) => t.label.toLowerCase() === label.toLowerCase());
      if (match) {
        match.done = true;
        match.at = nowIso();
        match.note = note;
      } else {
        order.timeline.push({ id: uid("t"), label, at: nowIso(), done: true, note });
      }
    }
    if (status === "cancelled") order.paymentStatus = order.paymentStatus === "paid" ? "refunded" : order.paymentStatus;
    return order;
  });
}
