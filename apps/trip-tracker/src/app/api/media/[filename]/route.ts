import { NextRequest } from "next/server";
import { stat } from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import { Readable } from "stream";

const UPLOAD_DIR = "/data/uploads";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", heic: "image/heic",
  mp4: "video/mp4", mov: "video/quicktime",
};

type Ctx = { params: Promise<{ filename: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { filename } = await ctx.params;
  const safe = path.basename(filename);
  const filepath = path.join(UPLOAD_DIR, safe);

  let fileSize: number;
  try {
    const s = await stat(filepath);
    fileSize = s.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = safe.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";
  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!match) return new Response("Invalid range", { status: 416 });
    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    if (start > end || end >= fileSize) {
      return new Response("Range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }
    const nodeStream = createReadStream(filepath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const nodeStream = createReadStream(filepath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
