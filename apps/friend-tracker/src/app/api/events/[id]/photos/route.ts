import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { mkdir, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { randomUUID } from "crypto";
import busboy from "busboy";
import { Readable } from "stream";

const UPLOAD_DIR = "/data/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const photos = await prisma.eventPhoto.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, dataUrl: true, caption: true, createdAt: true },
  });
  return Response.json(photos);
}

/** Stream a multipart upload directly to disk — never buffers the full file in memory. */
function saveMultipart(req: NextRequest, uploadDir: string): Promise<{ filePath: string; caption: string | null }> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type") ?? "";
    const bb = busboy({ headers: { "content-type": contentType } });

    let savedPath = "";
    let caption: string | null = null;
    let filePromise: Promise<void> | null = null;

    bb.on("file", (_field, stream, info) => {
      const ext = path.extname(info.filename).toLowerCase() || ".bin";
      const filename = `${randomUUID()}${ext}`;
      const dest = path.join(uploadDir, filename);
      savedPath = `/api/media/${filename}`;

      mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) { reject(err); return; }
        const writer = createWriteStream(dest);
        filePromise = pipeline(stream, writer).catch(reject);
      });
    });

    bb.on("field", (name, val) => {
      if (name === "caption") caption = val.trim() || null;
    });

    bb.on("finish", async () => {
      if (filePromise) await filePromise;
      if (!savedPath) { reject(new Error("No file in upload")); return; }
      resolve({ filePath: savedPath, caption });
    });

    bb.on("error", reject);

    // Pipe the Next.js request body (Web ReadableStream) into busboy (Node stream)
    const nodeStream = Readable.fromWeb(req.body as import("stream/web").ReadableStream);
    nodeStream.pipe(bb);
  });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const contentType = request.headers.get("content-type") ?? "";

  let dataUrl: string;
  let caption: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const { filePath, caption: cap } = await saveMultipart(request, UPLOAD_DIR);
    dataUrl = filePath;
    caption = cap;
  } else {
    // Legacy base64 JSON path (existing images already in DB)
    const body = await request.json();
    if (!body.dataUrl) return Response.json({ error: "dataUrl required" }, { status: 400 });
    dataUrl = body.dataUrl;
    caption = body.caption?.trim() || null;
  }

  const photo = await prisma.eventPhoto.create({
    data: { eventId: id, dataUrl, caption },
    select: { id: true, dataUrl: true, caption: true, createdAt: true },
  });
  return Response.json(photo, { status: 201 });
}
