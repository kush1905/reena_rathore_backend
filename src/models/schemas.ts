import { z } from "zod";

export const productStatusSchema = z.enum(["draft", "published", "scheduled", "archived"]);

export const variantSchema = z.object({
  id: z.string(),
  color: z.string(),
  colorHex: z.string(),
  size: z.string(),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative().optional().default(0),
  image: z.string().optional(),
});

export const productInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  sku: z.string().min(1),
  slug: z.string().optional(),
  shortDescription: z.string().optional().default(""),
  description: z.string().optional().default(""),
  mrp: z.number().nonnegative(),
  price: z.number().nonnegative(),
  taxPercent: z.number().min(0).max(100).optional().default(12),
  categoryId: z.string().min(1),
  collectionIds: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  variants: z.array(variantSchema).optional().default([]),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  status: productStatusSchema.optional().default("draft"),
  rating: z.number().optional().default(0),
  reviewCount: z.number().optional().default(0),
  scheduledAt: z.string().optional(),
});

export const productPatchSchema = productInputSchema.partial();

export const categoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().optional(),
  parentId: z.string().nullable().optional().default(null),
  hidden: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
});

export const collectionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  productIds: z.array(z.string()).optional().default([]),
  status: z.enum(["published", "draft"]).optional().default("draft"),
  season: z.string().optional(),
});

export const bannerInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  subtitle: z.string().optional().default(""),
  cta: z.string().optional().default(""),
  destination: z.string().optional().default("/products"),
  desktopImage: z.string().min(1),
  tabletImage: z.string().optional().default(""),
  mobileImage: z.string().optional().default(""),
  videoUrl: z.string().optional(),
  videoPoster: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published"]).optional().default("draft"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
});

export const homepagePutSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      visible: z.boolean(),
      preview: z.string().optional().default(""),
      meta: z.string().optional(),
    }),
  ),
});

export const inventoryPatchSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  user: z.string().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string(),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const cartQtySchema = z.object({
  quantity: z.number().int().positive(),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  name: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().optional().default("India"),
});

export const customerAddressesSchema = z.object({
  addresses: z.array(addressSchema).min(0),
});

export const orderCreateSchema = z.object({
  customerId: z.string(),
  fulfillmentType: z.enum(["home_delivery", "store_pickup"]),
  paymentMethod: z.string().optional().default("Demo card"),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  pickupLocation: z.string().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "packed",
    "ready_for_pickup",
    "dispatched",
    "in_transit",
    "delivered",
    "cancelled",
    "return_requested",
    "returned",
    "refunded",
  ]),
  note: z.string().optional(),
});

export const reviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "hidden", "rejected"]),
  reply: z.string().optional(),
});

export const settingsPatchSchema = z
  .object({
    storeName: z.string(),
    email: z.string(),
    phone: z.string(),
    currency: z.string(),
    timezone: z.string(),
    address: z.string(),
    taxPercent: z.number(),
    freeShippingThreshold: z.number(),
    lowStockThreshold: z.number(),
  })
  .partial();

export const wishlistItemSchema = z.object({
  productId: z.string(),
});
