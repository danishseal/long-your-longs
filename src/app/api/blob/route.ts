import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies a private Vercel Blob object through our origin.
// Used when blob uploads fall back to `access: "private"`.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  // Only allow Vercel Blob-hosted URLs.
  const host: string = new URL(url).host;
  if (
    !host.endsWith(".public.blob.vercel-storage.com") &&
    !host.endsWith(".blob.vercel-storage.com")
  ) {
    return NextResponse.json({ error: "invalid host" }, { status: 400 });
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: "blob fetch failed" }, { status: 502 });
  }

  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const bytes = await res.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
