import type { Banner, HomepageSection, Product } from "../types/index.js";
import { HttpError, nowIso, uid } from "../utils/http.js";
import { getDb, mutate } from "../store/json-store.js";

export function listBanners(query: Record<string, string | undefined>) {
  let items = [...getDb().banners];
  if (query.public === "1" || query.status === "published") items = items.filter((b) => b.status === "published");
  else if (query.status) items = items.filter((b) => b.status === query.status);
  return items;
}

export function getBanner(id: string) {
  const banner = getDb().banners.find((b) => b.id === id);
  if (!banner) throw new HttpError(404, "BANNER_NOT_FOUND", "Banner not found");
  return banner;
}

export function saveBanner(input: Partial<Banner> & { title: string; desktopImage: string }) {
  return mutate((db) => {
    const id = input.id ?? uid("bn");
    const existing = db.banners.find((b) => b.id === id);
    const banner: Banner = {
      id,
      title: input.title,
      subtitle: input.subtitle ?? "",
      cta: input.cta ?? "",
      destination: input.destination ?? "/products",
      desktopImage: input.desktopImage,
      tabletImage: input.tabletImage || input.desktopImage,
      mobileImage: input.mobileImage || input.desktopImage,
      videoUrl: input.videoUrl ?? existing?.videoUrl ?? "",
      videoPoster: input.videoPoster ?? existing?.videoPoster ?? "",
      status: input.status ?? "draft",
      startDate: input.startDate ?? "",
      endDate: input.endDate ?? "",
    };
    if (existing) {
      Object.assign(existing, banner);
      return existing;
    }
    db.banners.unshift(banner);
    return banner;
  });
}

export function deleteBanner(id: string) {
  return mutate((db) => {
    const exists = db.banners.some((b) => b.id === id);
    if (!exists) throw new HttpError(404, "BANNER_NOT_FOUND", "Banner not found");
    db.banners = db.banners.filter((b) => b.id !== id);
    return { deleted: true };
  });
}

export function setBannerStatus(id: string, status: Banner["status"]) {
  return mutate((db) => {
    const banner = db.banners.find((b) => b.id === id);
    if (!banner) throw new HttpError(404, "BANNER_NOT_FOUND", "Banner not found");
    banner.status = status;
    return banner;
  });
}

function publishedProducts() {
  return getDb().products.filter((p) => p.status === "published");
}

function collectionProducts(slug: string): Product[] {
  const col = getDb().collections.find((c) => c.slug === slug);
  if (!col) return [];
  const map = new Map(publishedProducts().map((p) => [p.id, p]));
  return col.productIds.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
}

export function getHomepage(publicOnly = false) {
  const db = getDb();
  const sections = publicOnly ? db.homepage.filter((s) => s.visible) : db.homepage;
  const publishedBanners = db.banners.filter((b) => b.status === "published");
  const editorial = publishedBanners[0] ?? db.banners[0] ?? null;
  const promo = db.banners.find((b) => b.id === "bn_02") ?? publishedBanners[1] ?? null;
  return {
    sections,
    resolved: {
      heroBanners: publishedBanners,
      featuredCollection: db.collections.find((c) => c.slug === "festive") ?? db.collections[0],
      featuredProducts: collectionProducts("festive").slice(0, 8),
      newArrivals: collectionProducts("new-arrivals"),
      bestsellers: collectionProducts("best-sellers"),
      showcase: collectionProducts("wedding").slice(0, 6),
      editorialBanner: editorial,
      promoBanner: promo,
      categories: db.categories.filter((c) => !c.hidden && !c.parentId),
      video: {
        poster: db.homepage.find((s) => s.type === "video")?.preview ?? "",
        url: publishedProducts().find((p) => p.video)?.video ?? "",
        title: "Atelier film",
      },
      testimonials: db.reviews.filter((r) => r.status === "approved").slice(0, 4),
      brandStory: db.pages.find((p) => p.slug === "about") ?? null,
    },
    updatedAt: nowIso(),
  };
}

export function putHomepage(sections: HomepageSection[]) {
  return mutate((db) => {
    db.homepage = sections;
    return getHomepage(false);
  });
}

export function toggleHomepageSection(id: string) {
  return mutate((db) => {
    const section = db.homepage.find((s) => s.id === id);
    if (!section) throw new HttpError(404, "SECTION_NOT_FOUND", "Homepage section not found");
    section.visible = !section.visible;
    return section;
  });
}
