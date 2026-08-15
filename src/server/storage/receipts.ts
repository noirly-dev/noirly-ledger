import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError } from "@/src/server/api/http";

const ROOT = resolve(process.cwd(), "data", "receipts");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 8 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function saveReceipt(input: {
  workspaceId: string;
  bytes: Buffer;
  mime: string;
}): Promise<{ key: string; url: string }> {
  if (!ALLOWED.has(input.mime)) {
    throw new ApiError(400, "invalid_request", "Receipt must be JPEG, PNG, WebP, or PDF");
  }
  if (input.bytes.byteLength > MAX_BYTES) {
    throw new ApiError(400, "invalid_request", "Receipt must be 8 MB or smaller");
  }

  const ext = EXT[input.mime] ?? "bin";
  const key = `${input.workspaceId}/${randomUUID()}.${ext}`;
  const path = join(ROOT, key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, input.bytes);
  return { key, url: `/api/receipts/${key}` };
}

export async function readReceipt(key: string): Promise<{ bytes: Buffer; mime: string }> {
  if (key.includes("..") || key.startsWith("/") || key.startsWith("\\")) {
    throw new ApiError(400, "invalid_request", "Invalid receipt key");
  }
  const path = join(ROOT, key);
  const bytes = await readFile(path);
  const ext = key.split(".").pop()?.toLowerCase();
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "pdf"
          ? "application/pdf"
          : "image/jpeg";
  return { bytes, mime };
}

export async function deleteReceipt(key: string): Promise<void> {
  if (!key || key.includes("..")) return;
  await unlink(join(ROOT, key)).catch(() => undefined);
}
