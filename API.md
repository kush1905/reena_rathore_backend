# Reena Rathore API

Demo REST API for the Reena Rathore admin and storefront. Envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found" } }
```

Base URL: `http://localhost:4000/api`

Storefront should pass `?public=1` on catalogue reads so drafts stay in admin only.

## Health

| Method | Path | Purpose |
| GET | `/health` | Process liveness (not under `/api`) |
| POST | `/api/admin/seed` | Reset `data/db.json` from seed |
| POST | `/api/upload` | Multipart field `file` — jpeg/png/webp/gif ≤5MB → `{ url }` under `/uploads/...` |

## Products

| Method | Path | Body / notes |
| GET | `/api/products` | Query: `public`, `status`, `category`, `collection`, `q`, `size`, `color`, `availability`, `minPrice`, `maxPrice`, `sort` |
| GET | `/api/products/:id` | id or slug. `?public=1` hides drafts |
| POST | `/api/products` | Full product. Rejects duplicate SKU, missing category, negative price/stock |
| PUT | `/api/products/:id` | Replace product |
| PATCH | `/api/products/:id` | Partial update |
| DELETE | `/api/products/:id` | Remove |
| POST | `/api/products/bulk-delete` | `{ ids: string[] }` |
| POST | `/api/products/bulk-status` | `{ ids, status }` |
| PATCH | `/api/products/:id/status` | `{ status }` |

## Categories / collections / inventory

| Method | Path |
| GET/POST | `/api/categories` |
| PUT/DELETE | `/api/categories/:id` |
| GET/POST | `/api/collections` |
| GET | `/api/collections/:id` |
| PUT/DELETE | `/api/collections/:id` |
| GET | `/api/inventory` | `{ items, movements }` |
| PATCH | `/api/inventory/:sku` | `{ quantity, reason, notes? }` — quantity is a delta |

## Banners / homepage

| Method | Path |
| GET/POST | `/api/banners` |
| PUT/DELETE | `/api/banners/:id` |
| PATCH | `/api/banners/:id/status` | `{ status }` |
| GET | `/api/homepage` | `{ sections, resolved }` — resolved includes banners, products, categories |
| PUT | `/api/homepage` | `{ sections }` |
| PATCH | `/api/homepage/:id/toggle` | Flip section visibility |

## Cart / wishlist / customers / reviews

Cart line ids in the URL are **SKUs**.

| Method | Path |
| GET | `/api/cart/:customerId` |
| POST | `/api/cart/:customerId/items` | `{ sku, quantity, size?, color? }` — server fills title/price |
| PATCH | `/api/cart/:customerId/items/:sku` | `{ quantity }` |
| DELETE | `/api/cart/:customerId/items/:sku` |
| GET | `/api/wishlist/:customerId` |
| POST | `/api/wishlist/:customerId/items` | `{ productId }` |
| DELETE | `/api/wishlist/:customerId/items/:productId` |
| GET | `/api/customers` |
| GET | `/api/customers/:id` | `cus_demo` and `customer-demo-001` are aliases |
| GET | `/api/reviews` | `?public=1` returns approved only |
| PATCH | `/api/reviews/:id/status` | `{ status, reply? }` |

## Orders

Totals are calculated on the server from live variant prices. Client-sent prices are ignored.

| Method | Path |
| GET | `/api/orders` | `?customerId=` |
| GET | `/api/orders/:id` |
| POST | `/api/orders` | `{ customerId, fulfillmentType, paymentMethod?, shippingAddress, billingAddress?, pickupLocation? }` uses current cart, decrements stock, clears cart |
| PATCH | `/api/orders/:id/status` | `{ status, note? }` stamps timeline |

`fulfillmentType`: `home_delivery` | `store_pickup`

## Admin extras

| Method | Path |
| GET | `/api/admin/bootstrap` | Full store for the admin Zustand hydrate |
| GET/PATCH | `/api/settings` |
| GET | `/api/promotions` `/api/coupons` `/api/pages` `/api/shipments` `/api/pickups` `/api/returns` `/api/staff` `/api/roles` |
| PATCH | `/api/coupons/:id/toggle`, `/api/shipments/:id/status`, `/api/pickups/:id/status`, `/api/returns/:id/status` |
| POST | `/api/shipments` | `{ orderId, courier, tracking }` |
