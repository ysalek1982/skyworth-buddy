import { supabase } from "@/integrations/supabase/client";

type StorageInfo = { bucket: string; path: string };

const STORAGE_URL_RE = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/i;
const KNOWN_BUCKETS = new Set(["purchase-documents", "seller-documents"]);

// Simple in-memory cache so we don't re-sign the same object repeatedly.
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function extractStorageInfo(value: string): StorageInfo | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Full storage URL (public or signed)
  const m = trimmed.match(STORAGE_URL_RE);
  if (m) {
    const bucket = m[1];
    const rawPath = m[2];
    const path = decodeURIComponent(rawPath);
    return { bucket, path };
  }

  // "bucket/path" format
  for (const bucket of KNOWN_BUCKETS) {
    if (trimmed.startsWith(`${bucket}/`)) {
      return { bucket, path: trimmed.slice(bucket.length + 1) };
    }
  }

  return null;
}

export async function toSignedStorageUrl(
  value: string,
  opts?: { expiresIn?: number; fallback?: string | null }
): Promise<string> {
  const fallback = opts?.fallback ?? value;
  const expiresIn = opts?.expiresIn ?? 60 * 60; // 1 hour

  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.includes("/storage/v1/object/sign/")) return trimmed; // already signed

  const info = extractStorageInfo(trimmed);
  if (!info) return fallback;

  // Only sign known buckets; otherwise treat as normal URL.
  if (!KNOWN_BUCKETS.has(info.bucket)) return fallback;

  const cacheKey = `${info.bucket}:${info.path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage.from(info.bucket).createSignedUrl(info.path, expiresIn);
  if (error || !data?.signedUrl) {
    return fallback;
  }

  // Cache slightly less than the actual expiration.
  signedUrlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() + Math.max(0, expiresIn - 60) * 1000,
  });

  return data.signedUrl;
}
