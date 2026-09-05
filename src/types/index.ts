export type ProductStatus = "draft" | "published" | "scheduled" | "archived";
export type StockHealth = "healthy" | "low" | "out";

export type ProductVariant = {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  price: number;
  stock: number;
  reserved: number;
  image?: string;
};

export type Product = {
  id: string;
  title: string;
  sku: string;
  slug: string;
  shortDescription: string;
  description: string;
  mrp: number;
  price: number;
  taxPercent: number;
  categoryId: string;
  collectionIds: string[];
  images: string[];
  video?: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  variants: ProductVariant[];
  attributes: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  hidden: boolean;
  productCount: number;
  order: number;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productIds: string[];
  status: "published" | "draft";
  season?: string;
};

export type InventoryMovement = {
  id: string;
  sku: string;
  productId: string;
  type: "restock" | "sale" | "adjustment" | "return" | "reserve";
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  user: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "ready_for_pickup"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refunded";

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "partially_refunded";
export type FulfillmentType = "home_delivery" | "store_pickup";

export type Address = {
  label?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderItem = {
  productId: string;
  title: string;
  sku: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
};

export type TimelineEvent = {
  id: string;
  label: string;
  at: string;
  done: boolean;
  note?: string;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  transactionRef?: string;
  orderStatus: OrderStatus;
  fulfillmentType: FulfillmentType;
  billing: Address;
  shippingAddress: Address;
  location: string;
  courier?: string;
  trackingNumber?: string;
  pickupLocation?: string;
  timeline: TimelineEvent[];
};

export type Shipment = {
  id: string;
  orderId: string;
  customerName: string;
  location: string;
  courier: string;
  trackingNumber: string;
  dispatchDate: string;
  eta: string;
  status: "label_created" | "dispatched" | "in_transit" | "out_for_delivery" | "delivered";
};

export type PickupOrder = {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  location: string;
  readyAt?: string;
  status: "awaiting" | "ready" | "picked_up" | "completed";
};

export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "returned"
  | "inspected"
  | "refund_initiated"
  | "refund_completed";

export type ReturnRequest = {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  productTitle: string;
  sku: string;
  image: string;
  reason: string;
  comment: string;
  images: string[];
  refundAmount: number;
  status: ReturnStatus;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  city: string;
  totalOrders: number;
  totalSpend: number;
  lastPurchase: string;
  joinedAt: string;
  addresses: Address[];
  segment: "new" | "repeat" | "vip";
};

export type WishlistEntry = {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  addedAt: string;
};

export type Cart = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  value: number;
  updatedAt: string;
  abandoned: boolean;
};

export type ReviewStatus = "pending" | "approved" | "hidden" | "rejected";

export type Review = {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  status: ReviewStatus;
  reply?: string;
};

export type BannerStatus = "draft" | "scheduled" | "published";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  destination: string;
  desktopImage: string;
  tabletImage: string;
  mobileImage: string;
  videoUrl?: string;
  videoPoster?: string;
  status: BannerStatus;
  startDate: string;
  endDate: string;
};

export type Promotion = {
  id: string;
  name: string;
  type: "discount" | "featured" | "category";
  description: string;
  value?: string;
  status: "active" | "scheduled" | "ended";
  startDate: string;
  endDate: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minCartValue?: number;
  productRestriction?: string;
  categoryRestriction?: string;
  firstOrderOnly: boolean;
  segment?: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
};

export type HomepageSection = {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  preview: string;
  meta?: string;
};

export type ContentPage = {
  id: string;
  title: string;
  slug: string;
  type: "page" | "blog" | "lookbook";
  excerpt: string;
  body: string;
  status: "published" | "draft";
  updatedAt: string;
};

export type PermissionAction = "view" | "create" | "edit" | "delete" | "update" | "cancel" | "refund" | "publish";

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, PermissionAction[]>;
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "active" | "invited" | "disabled";
  lastActive: string;
};

export type ActivityItem = {
  id: string;
  type: "order" | "stock" | "banner" | "customer" | "review" | "product";
  message: string;
  at: string;
};

export type StoreSettings = {
  storeName: string;
  email: string;
  phone: string;
  currency: string;
  timezone: string;
  address: string;
  taxPercent: number;
  freeShippingThreshold: number;
  lowStockThreshold: number;
};
