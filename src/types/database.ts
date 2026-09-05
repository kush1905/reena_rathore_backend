import type {
  ActivityItem,
  Banner,
  Cart,
  Category,
  Collection,
  ContentPage,
  Coupon,
  Customer,
  HomepageSection,
  InventoryMovement,
  Order,
  PickupOrder,
  Product,
  Promotion,
  ReturnRequest,
  Review,
  Role,
  Shipment,
  StaffUser,
  StoreSettings,
  WishlistEntry,
} from "./index.js";

export type Database = {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  movements: InventoryMovement[];
  orders: Order[];
  shipments: Shipment[];
  pickups: PickupOrder[];
  returns: ReturnRequest[];
  customers: Customer[];
  carts: Cart[];
  wishlists: WishlistEntry[];
  reviews: Review[];
  banners: Banner[];
  homepage: HomepageSection[];
  promotions: Promotion[];
  coupons: Coupon[];
  pages: ContentPage[];
  roles: Role[];
  staff: StaffUser[];
  settings: StoreSettings;
  activity: ActivityItem[];
};
