import { mkdirSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";
import { HttpError, ok, uid } from "../utils/http.js";
import { publicApiOrigin, toStoredUploadPath } from "../utils/media.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const uploadsDir = resolve(root, "uploads");

mkdirSync(uploadsDir, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${uid("img")}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new HttpError(400, "INVALID_FILE", "Only jpeg, png, webp, and gif images are allowed"));
      return;
    }
    cb(null, true);
  },
});

function uploadResponseUrl(req: { protocol: string; get: (name: string) => string | undefined }, filename: string) {
  const stored = toStoredUploadPath(filename);
  const origin =
    publicApiOrigin() ||
    `${req.protocol}://${req.get("host") ?? `localhost:${process.env.PORT ?? 4000}`}`;
  return `${origin.replace(/\/$/, "")}${stored}`;
}

export const uploadRouter = Router();

uploadRouter.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5MB or smaller" : err.message;
        next(new HttpError(400, "UPLOAD_ERROR", message));
        return;
      }
      next(err);
      return;
    }
    if (!req.file) {
      next(new HttpError(400, "NO_FILE", "Choose an image file to upload"));
      return;
    }
    res.status(201).json(
      ok({
        url: uploadResponseUrl(req, req.file.filename),
        path: toStoredUploadPath(req.file.filename),
      }),
    );
  });
});
