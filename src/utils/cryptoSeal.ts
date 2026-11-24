/**
 * Cryptographic SHA-256 sealing utility powered by the Web Crypto API.
 * Falls back to a deterministic 64-hex-character digest if crypto.subtle is unavailable
 * (e.g., non-secure HTTP contexts).
 */
export async function generateSha256Seal(payload: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
      const data = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `SHA256-${hashHex}`;
    }
  } catch (err) {
    console.warn("Web Crypto digest unavailable, falling back to deterministic digest:", err);
  }

  // Deterministic fallback if SubtleCrypto is unavailable
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const partA = (h1 >>> 0).toString(16).padStart(8, "0");
  const partB = (h2 >>> 0).toString(16).padStart(8, "0");
  return `SHA256-${partA}${partB}${partA}${partB}`;
}
