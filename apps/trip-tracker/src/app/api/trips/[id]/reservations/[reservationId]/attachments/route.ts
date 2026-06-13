import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWriteStream, mkdirSync } from "fs";
import path from "path";
import Busboy from "busboy";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const UPLOAD_DIR = "/data/uploads";

type Ctx = { params: Promise<{ id: string; reservationId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { reservationId } = await ctx.params;

  try {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch {}

  const contentType = req.headers.get("content-type") ?? "";
  const bb = Busboy({ headers: { "content-type": contentType } });

  return new Promise<NextResponse>((resolve) => {
    let filename = "";
    let originalName = "";
    let mimeType = "";

    bb.on("file", (_field, fileStream, info) => {
      originalName = info.filename;
      mimeType = info.mimeType;
      const ext = path.extname(originalName) || "";
      filename = `${randomUUID()}${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);
      fileStream.pipe(createWriteStream(dest));
    });

    bb.on("finish", async () => {
      if (!filename) {
        resolve(NextResponse.json({ error: "no file" }, { status: 400 }));
        return;
      }
      const attachment = await prisma.reservationAttachment.create({
        data: { reservationId, filename, originalName, mimeType },
      });
      resolve(NextResponse.json(attachment, { status: 201 }));
    });

    bb.on("error", () => resolve(NextResponse.json({ error: "upload failed" }, { status: 500 })));

    const body = req.body;
    if (body) {
      Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]).pipe(bb);
    } else {
      resolve(NextResponse.json({ error: "no body" }, { status: 400 }));
    }
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { reservationId } = await ctx.params;
  const { attachmentId } = await req.json();
  await prisma.reservationAttachment.deleteMany({ where: { id: attachmentId, reservationId } });
  return new NextResponse(null, { status: 204 });
}
