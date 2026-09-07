import type { Category, Collection, InventoryMovement, Product, ProductStatus } from "../types/index.js";
import type { Database } from "../types/database.js";
import { HttpError, nowIso, slugify, uid } from "../utils/http.js";
import { getDb, mutate } from "../store/json-store.js";

function recountCategories(db: Database) {
  for (const category of db.categories) {
    category.productCount = db.products.filter((p) => p.categoryId === category.id).length;
  }
}

export function listProducts(query: Record<string, string | undefined>) {
  const db = getDb();
  let items = [...db.products];
  const publicOnly = query.public === "1" || query.status === "published";
  if (publicOnly) items = items.filter((p) => p.status === "published");
  else if (query.status) items = items.filter((p) => p.status === query.status);

  if (query.category) {
    const cat = db.categories.find((c) => c.slug === query.category || c.id === query.category);
    if (cat) {
      const ids = new Set(descendantCategoryIds(db.categories, cat.id));
      items = items.filter((p) => ids.has(p.categoryId));
    }
  }
  if (query.collection) {
    const col = db.collections.find((c) => c.slug === query.collection || c.id === query.collection);
    if (col) items = items.filter((p) => col.productIds.includes(p.id));
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        db.categories.find((c) => c.id === p.categoryId)?.name.toLowerCase().includes(q),
    );
  }
  if (query.size) items = items.filter((p) => p.sizes.includes(query.size!));
  if (query.color) items = items.filter((p) => p.colors.some((c) => c.name.toLowerCase() === query.color!.toLowerCase()));
  if (query.availability === "in_stock") {
    items = items.filter((p) => p.variants.some((v) => v.stock > 0));
  } else if (query.availability === "out_of_stock") {
    items = items.filter((p) => p.variants.every((v) => v.stock <= 0));
  }
  const min = query.minPrice ? Number(query.minPrice) : undefined;
  const max = query.maxPrice ? Number(query.maxPrice) : undefined;
  if (min != null && !Number.isNaN(min)) items = items.filter((p) => p.price >= min);
  if (max != null && !Number.isNaN(max)) items = items.filter((p) => p.price <= max);

  const sort = query.sort ?? "newest";
  items.sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "title") return a.title.localeCompare(b.title);
    return b.createdAt.localeCompare(a.createdAt);
  });
  return items;
}

export function descendantCategoryIds(categories: Category[], id: string): string[] {
  const ids = [id];
  for (const child of categories.filter((c) => c.parentId === id)) {
    ids.push(...descendantCategoryIds(categories, child.id));
  }
  return ids;
}

export function getProduct(idOrSlug: string, publicOnly = false) {
  const product = getDb().products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (!product) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
  if (publicOnly && product.status !== "published") {
    throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  return product;
}

export function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  return mutate((db) => {
    if (!db.categories.some((c) => c.id === input.categoryId)) {
      throw new HttpError(400, "MISSING_CATEGORY", "Category not found");
    }
    if (db.products.some((p) => p.sku === input.sku)) {
      throw new HttpError(409, "DUPLICATE_SKU", "A product with this SKU already exists");
    }
    if (input.price < 0 || input.mrp < 0) {
      throw new HttpError(400, "INVALID_PRICE", "Price must be zero or greater");
    }
    if (input.variants.some((v) => v.stock < 0)) {
      throw new HttpError(400, "INVALID_STOCK", "Stock cannot be negative");
    }
    const product: Product = {
      ...input,
      id: input.id ?? uid("prd"),
      slug: input.slug || slugify(input.title),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.products.unshift(product);
    recountCategories(db);
    return product;
  });
}

export function updateProduct(id: string, patch: Partial<Product>) {
  return mutate((db) => {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    if (patch.sku && db.products.some((p) => p.sku === patch.sku && p.id !== id)) {
      throw new HttpError(409, "DUPLICATE_SKU", "A product with this SKU already exists");
    }
    if (patch.categoryId && !db.categories.some((c) => c.id === patch.categoryId)) {
      throw new HttpError(400, "MISSING_CATEGORY", "Category not found");
    }
    if (patch.price != null && patch.price < 0) throw new HttpError(400, "INVALID_PRICE", "Invalid price");
    const next = { ...db.products[index], ...patch, id, updatedAt: nowIso() };
    db.products[index] = next;
    recountCategories(db);
    return next;
  });
}

export function deleteProducts(ids: string[]) {
  return mutate((db) => {
    db.products = db.products.filter((p) => !ids.includes(p.id));
    recountCategories(db);
    return { deleted: ids.length };
  });
}

export function setProductStatus(id: string, status: ProductStatus) {
  return updateProduct(id, { status });
}

export function bulkStatus(ids: string[], status: ProductStatus) {
  return mutate((db) => {
    db.products = db.products.map((p) => (ids.includes(p.id) ? { ...p, status, updatedAt: nowIso() } : p));
    return db.products.filter((p) => ids.includes(p.id));
  });
}

export function listCategories(query: Record<string, string | undefined>) {
  let items = [...getDb().categories];
  if (query.public === "1") items = items.filter((c) => !c.hidden);
  return items.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function saveCategory(input: Partial<Category> & { name: string }) {
  return mutate((db) => {
    const id = input.id ?? uid("cat");
    const existing = db.categories.find((c) => c.id === id);
    const category: Category = {
      id,
      name: input.name,
      slug: input.slug || slugify(input.name),
      parentId: input.parentId ?? null,
      hidden: input.hidden ?? false,
      productCount: existing?.productCount ?? 0,
      order: input.order ?? existing?.order ?? db.categories.length,
    };
    if (existing) {
      Object.assign(existing, category);
      recountCategories(db);
      return existing;
    }
    db.categories.push(category);
    recountCategories(db);
    return category;
  });
}

export function deleteCategory(id: string) {
  return mutate((db) => {
    db.categories = db.categories.filter((c) => c.id !== id && c.parentId !== id);
    recountCategories(db);
    return { deleted: true };
  });
}

export function listCollections(query: Record<string, string | undefined>) {
  let items = [...getDb().collections];
  if (query.public === "1" || query.status === "published") items = items.filter((c) => c.status === "published");
  return items;
}

export function getCollection(idOrSlug: string, publicOnly = false) {
  const collection = getDb().collections.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  if (!collection) throw new HttpError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  if (publicOnly && collection.status !== "published") {
    throw new HttpError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  }
  return collection;
}

export function saveCollection(input: Partial<Collection> & { name: string }) {
  return mutate((db) => {
    const id = input.id ?? uid("col");
    const existing = db.collections.find((c) => c.id === id);
    const collection: Collection = {
      id,
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: input.description ?? "",
      image: input.image ?? "",
      productIds: input.productIds ?? existing?.productIds ?? [],
      status: input.status ?? "draft",
      season: input.season,
    };
    if (existing) {
      Object.assign(existing, collection);
      return existing;
    }
    db.collections.push(collection);
    return collection;
  });
}

export function deleteCollection(id: string) {
  return mutate((db) => {
    db.collections = db.collections.filter((c) => c.id !== id);
    return { deleted: true };
  });
}

export function listInventory() {
  const db = getDb();
  return db.products.flatMap((product) =>
    product.variants.map((variant) => ({
      sku: variant.sku,
      productId: product.id,
      title: product.title,
      color: variant.color,
      size: variant.size,
      stock: variant.stock,
      reserved: variant.reserved,
      price: variant.price,
    })),
  );
}

export function adjustInventory(sku: string, quantity: number, reason: string, notes?: string, user = "Reena Rathore") {
  return mutate((db) => {
    let found: { product: Product; sku: string } | undefined;
    for (const product of db.products) {
      const variant = product.variants.find((v) => v.sku === sku);
      if (variant) {
        const next = variant.stock + quantity;
        if (next < 0) throw new HttpError(400, "INVALID_STOCK", "Stock cannot be negative");
        variant.stock = next;
        product.updatedAt = nowIso();
        found = { product, sku };
        break;
      }
    }
    if (!found) throw new HttpError(404, "INVENTORY_NOT_FOUND", "SKU not found");
    const movement: InventoryMovement = {
      id: uid("mv"),
      sku,
      productId: found.product.id,
      type: quantity > 0 ? "restock" : "adjustment",
      quantity,
      reason,
      notes,
      createdAt: nowIso(),
      user,
    };
    db.movements.unshift(movement);
    return { product: found.product, movement };
  });
}

export function decrementVariantStock(db: Database, sku: string, quantity: number, reason: string) {
  for (const product of db.products) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) continue;
    if (variant.stock < quantity) {
      throw new HttpError(400, "INSUFFICIENT_STOCK", `Not enough stock for ${sku}`);
    }
    variant.stock -= quantity;
    product.updatedAt = nowIso();
    db.movements.unshift({
      id: uid("mv"),
      sku,
      productId: product.id,
      type: "sale",
      quantity: -quantity,
      reason,
      createdAt: nowIso(),
      user: "System",
    });
    return;
  }
  throw new HttpError(400, "INVENTORY_NOT_FOUND", `SKU ${sku} not found`);
}
