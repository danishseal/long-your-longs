import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

const METADATA_PREFIX = "metadata";

export interface TokenMetadata {
  mint: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  socials?: string[];
  creator?: string;
  createdAt?: number;
}

function sanitizeOptionalText(
  value: unknown,
  maxLength: number,
): string | undefined {
  const text = value?.toString().trim();
  if (!text) return undefined;
  return text.slice(0, maxLength);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}

function blobPathFor(mint: string): string {
  return `${METADATA_PREFIX}/${mint}.json`;
}

function localPathFor(mint: string): string {
  return join(process.cwd(), ".local-metadata", `${mint}.json`);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  if (!mint || mint.length < 32) {
    return NextResponse.json({ error: "invalid mint" }, { status: 400 });
  }

  const blobBaseUrl = process.env.BLOB_PUBLIC_BASE_URL;
  if (blobBaseUrl) {
    try {
      const url = `${blobBaseUrl}/${blobPathFor(mint)}`;
      const res = await fetch(url, { next: { revalidate: 30 } });
      if (res.ok) {
        const data = (await res.json()) as TokenMetadata;
        return NextResponse.json(data, {
          headers: { "cache-control": "public, max-age=60" },
        });
      }
    } catch {
      // fall through to local fallback
    }
  }

  try {
    const raw = await readFile(localPathFor(mint), "utf-8");
    return NextResponse.json(JSON.parse(raw), {
      headers: { "cache-control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  if (!mint || mint.length < 32) {
    return NextResponse.json({ error: "invalid mint" }, { status: 400 });
  }
  let body: Partial<TokenMetadata>;
  try {
    body = (await req.json()) as Partial<TokenMetadata>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const metadata: TokenMetadata = {
    mint,
    name: sanitizeOptionalText(body.name, 64),
    symbol: sanitizeOptionalText(body.symbol, 16),
    description: sanitizeOptionalText(body.description, 1000),
    image: sanitizeOptionalText(body.image, 500),
    socials: Array.isArray(body.socials)
      ? body.socials.map((s) => String(s).slice(0, 200)).slice(0, 10)
      : undefined,
    creator: sanitizeOptionalText(body.creator, 200),
    createdAt: Math.floor(Date.now() / 1000),
  };

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const blob = await put(blobPathFor(mint), JSON.stringify(metadata), {
        access: "public",
        contentType: "application/json",
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return NextResponse.json({ url: blob.url, metadata });
    } catch (e) {
      return NextResponse.json(
        { error: `blob put failed: ${getErrorMessage(e)}` },
        { status: 502 },
      );
    }
  }

  try {
    const dir = join(process.cwd(), ".local-metadata");
    await mkdir(dir, { recursive: true });
    await writeFile(localPathFor(mint), JSON.stringify(metadata), "utf-8");
    return NextResponse.json({ url: `file://${localPathFor(mint)}`, metadata });
  } catch (e) {
    return NextResponse.json(
      { error: `local write failed: ${getErrorMessage(e)}` },
      { status: 500 },
    );
  }
}
