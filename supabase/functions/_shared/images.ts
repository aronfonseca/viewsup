// Downloads an image and base64-encodes it for the Anthropic vision API.
// Best-effort — a failed download just means one fewer image, never a hard failure.
export async function fetchImageAsBase64(url: string, timeoutMs = 8000): Promise<{ data: string; mediaType: string } | null> {
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const mediaType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!mediaType.startsWith("image/")) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < buf.length; i += chunkSize) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunkSize));
    }
    return { data: btoa(binary), mediaType };
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("[image-fetch] failed:", url, (e as Error).message);
    return null;
  }
}
