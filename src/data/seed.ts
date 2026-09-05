import { products } from "./products.js";
import { categories, collections } from "./catalog.js";
import { carts, customers, reviews, wishlists } from "./customers.js";
import { orders, pickups, returns, shipments } from "./orders.js";
import {
  activity,
  banners,
  contentPages,
  coupons,
  homepageSections,
  inventoryMovements,
  promotions,
  roles,
  settings,
  staff,
} from "./ops.js";
import type { Database } from "../types/database.js";

const SAMPLE_VIDEO = "https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4";

export function createSeedDb(): Database {
  const seededProducts = products.map((product) => {
    if (product.id === "prd_01" || product.id === "prd_03" || product.id === "prd_10") {
      return { ...product, video: SAMPLE_VIDEO };
    }
    return product;
  });

  return {
    products: seededProducts,
    categories,
    collections,
    movements: inventoryMovements,
    orders,
    shipments,
    pickups,
    returns,
    customers: [
      ...customers,
      {
        id: "cus_demo",
        name: "Demo User",
        email: "guest@demo.com",
        phone: "+91 90000 00001",
        location: "New Delhi, DL",
        city: "New Delhi",
        totalOrders: 0,
        totalSpend: 0,
        lastPurchase: "",
        joinedAt: "2026-09-01T00:00:00.000Z",
        segment: "new",
        addresses: [
          {
            label: "Home",
            name: "Demo User",
            phone: "+91 90000 00001",
            line1: "14, Lane 3, Westend Marg",
            landmark: "Near Qutub Minar",
            city: "New Delhi",
            state: "Delhi",
            postalCode: "110030",
            country: "India",
          },
          {
            label: "Office",
            name: "Demo User",
            phone: "+91 90000 00001",
            line1: "402, Tolstoy House, Tolstoy Marg",
            line2: "Connaught Place",
            city: "New Delhi",
            state: "Delhi",
            postalCode: "110001",
            country: "India",
          },
          {
            label: "Family",
            name: "Demo User",
            phone: "+91 98290 11223",
            line1: "C-18, Tilak Nagar",
            city: "Jaipur",
            state: "Rajasthan",
            postalCode: "302004",
            country: "India",
          },
        ],
      },
    ],
    carts: [
      ...carts,
      {
        id: "cart_demo",
        customerId: "cus_demo",
        customerName: "Demo User",
        customerEmail: "guest@demo.com",
        items: [],
        value: 0,
        updatedAt: "2026-09-01T00:00:00.000Z",
        abandoned: false,
      },
    ],
    wishlists,
    reviews,
    banners,
    homepage: homepageSections,
    promotions,
    coupons,
    pages: contentPages,
    roles,
    staff,
    settings: {
      ...settings,
      storeName: "Reena Rathore",
      email: "studio@reenarathore.com",
    },
    activity,
  };
}
