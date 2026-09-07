import type { Request, Response, NextFunction } from "express";
import { publicApiOrigin, resolveMediaUrl } from "../utils/media.js";

const MEDIA_KEY =
  /^(url|image|images|desktopImage|tabletImage|mobileImage|poster|video|avatar)$/i;

function rewriteValue(value: unknown, req: Request): unknown {
  if (typeof value === "string") {
    if (value.includes("/uploads/") || /localhost:\d+\/uploads\//i.test(value)) {
      return resolveMediaUrl(value, {
        protocol: req.protocol,
        host: req.get("host") ?? undefined,
      });
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteValue(item, req));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === "images" && Array.isArray(child)) {
        out[key] = child.map((item) =>
          typeof item === "string"
            ? resolveMediaUrl(item, { protocol: req.protocol, host: req.get("host") ?? undefined })
            : rewriteValue(item, req),
        );
      } else if (MEDIA_KEY.test(key) && typeof child === "string") {
        out[key] = resolveMediaUrl(child, { protocol: req.protocol, host: req.get("host") ?? undefined });
      } else {
        out[key] = rewriteValue(child, req);
      }
    }
    return out;
  }
  return value;
}

/** Rewrite /uploads and localhost upload URLs to the public API origin in JSON responses. */
export function mediaUrlMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = publicApiOrigin();
  if (!origin && !req.get("host")) {
    next();
    return;
  }

  const original = res.json.bind(res);
  res.json = ((body: unknown) => original(rewriteValue(body, req))) as Response["json"];
  next();
}
