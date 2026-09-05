import type {
  ContentPage,
  Coupon,
  PickupOrder,
  ReturnRequest,
  ReturnStatus,
  ReviewStatus,
  Role,
  Shipment,
  StaffUser,
  StoreSettings,
} from "../types/index.js";
import { HttpError } from "../utils/http.js";
import { getDb, mutate } from "../store/json-store.js";

export function listCustomers() {
  return getDb().customers;
}

export function getCustomer(id: string) {
  const customer = getDb().customers.find((c) => c.id === id || (id === "customer-demo-001" && c.id === "cus_demo"));
  if (!customer) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  return customer;
}

export function setCustomerAddresses(
  id: string,
  addresses: import("../types/index.js").Address[],
) {
  return mutate((db) => {
    const customer = db.customers.find((c) => c.id === id || (id === "customer-demo-001" && c.id === "cus_demo"));
    if (!customer) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
    customer.addresses = addresses;
    return customer;
  });
}

export function listReviews(query: Record<string, string | undefined>) {
  let items = [...getDb().reviews];
  if (query.productId) items = items.filter((r) => r.productId === query.productId);
  if (query.public === "1") items = items.filter((r) => r.status === "approved");
  else if (query.status) items = items.filter((r) => r.status === query.status);
  return items;
}

export function setReviewStatus(id: string, status: ReviewStatus, reply?: string) {
  return mutate((db) => {
    const review = db.reviews.find((r) => r.id === id);
    if (!review) throw new HttpError(404, "REVIEW_NOT_FOUND", "Review not found");
    review.status = status;
    if (reply != null) review.reply = reply;
    const approved = db.reviews.filter((r) => r.productId === review.productId && r.status === "approved");
    const product = db.products.find((p) => p.id === review.productId);
    if (product) {
      product.reviewCount = approved.length;
      product.rating = approved.length
        ? Math.round((approved.reduce((sum, r) => sum + r.rating, 0) / approved.length) * 10) / 10
        : 0;
    }
    return review;
  });
}

export function bootstrap() {
  const db = getDb();
  return { ...db };
}

export function updateSettings(patch: Partial<StoreSettings>) {
  return mutate((db) => {
    db.settings = { ...db.settings, ...patch };
    return db.settings;
  });
}

export function saveCoupon(coupon: Coupon) {
  return mutate((db) => {
    const existing = db.coupons.find((c) => c.id === coupon.id);
    if (existing) Object.assign(existing, coupon);
    else db.coupons.unshift(coupon);
    return coupon;
  });
}

export function toggleCoupon(id: string) {
  return mutate((db) => {
    const coupon = db.coupons.find((c) => c.id === id);
    if (!coupon) throw new HttpError(404, "COUPON_NOT_FOUND", "Coupon not found");
    coupon.active = !coupon.active;
    return coupon;
  });
}

export function savePage(page: ContentPage) {
  return mutate((db) => {
    const existing = db.pages.find((p) => p.id === page.id);
    if (existing) Object.assign(existing, page);
    return existing ?? page;
  });
}

export function updateShipmentStatus(id: string, status: Shipment["status"]) {
  return mutate((db) => {
    const shipment = db.shipments.find((s) => s.id === id);
    if (!shipment) throw new HttpError(404, "SHIPMENT_NOT_FOUND", "Shipment not found");
    shipment.status = status;
    return shipment;
  });
}

export function updatePickupStatus(id: string, status: PickupOrder["status"]) {
  return mutate((db) => {
    const pickup = db.pickups.find((p) => p.id === id);
    if (!pickup) throw new HttpError(404, "PICKUP_NOT_FOUND", "Pickup not found");
    pickup.status = status;
    if (status === "ready") pickup.readyAt = new Date().toISOString();
    return pickup;
  });
}

export function updateReturnStatus(id: string, status: ReturnStatus) {
  return mutate((db) => {
    const item = db.returns.find((r) => r.id === id);
    if (!item) throw new HttpError(404, "RETURN_NOT_FOUND", "Return not found");
    item.status = status;
    return item;
  });
}

export function createShipment(orderId: string, courier: string, tracking: string) {
  return mutate((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
    const shipment: Shipment = {
      id: `SHP-${Math.floor(Math.random() * 9000 + 1000)}`,
      orderId,
      customerName: order.customerName,
      location: order.location,
      courier,
      trackingNumber: tracking,
      dispatchDate: new Date().toISOString(),
      eta: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: "label_created",
    };
    db.shipments.unshift(shipment);
    return shipment;
  });
}

export function saveStaff(user: StaffUser) {
  return mutate((db) => {
    const existing = db.staff.find((s) => s.id === user.id);
    if (existing) Object.assign(existing, user);
    else db.staff.unshift(user);
    return user;
  });
}

export function togglePermission(roleId: string, module: string, action: string) {
  return mutate((db) => {
    const role = db.roles.find((r) => r.id === roleId);
    if (!role) throw new HttpError(404, "ROLE_NOT_FOUND", "Role not found");
    const current = role.permissions[module] ?? [];
    role.permissions[module] = current.includes(action as never)
      ? current.filter((a) => a !== action)
      : [...current, action as never];
    return role as Role;
  });
}
