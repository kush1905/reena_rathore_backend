/** Public API origin without trailing slash (e.g. https://api.example.com). */
export function publicApiOrigin() {
  const fromEnv = process.env.PUBLIC_API_ORIGIN?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "";
}

/** Normalize stored media to a browser-usable absolute or root-relative URL. */
export function resolveMediaUrl(pathOrUrl: string, reqHost?: { protocol?: string; host?: string }) {
  if (!pathOrUrl) return pathOrUrl;

  const localUpload = pathOrUrl.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/uploads\/.+)$/i);
  if (localUpload) {
    const path = localUpload[3];
    const origin = publicApiOrigin() || (reqHost?.host ? `${reqHost.protocol ?? "https"}://${reqHost.host}` : "");
    return origin ? `${origin}${path}` : path;
  }

  if (pathOrUrl.startsWith("/uploads/")) {
    const origin = publicApiOrigin() || (reqHost?.host ? `${reqHost.protocol ?? "https"}://${reqHost.host}` : "");
    return origin ? `${origin}${pathOrUrl}` : pathOrUrl;
  }

  return pathOrUrl;
}

export function toStoredUploadPath(filename: string) {
  return `/uploads/${filename}`;
}
