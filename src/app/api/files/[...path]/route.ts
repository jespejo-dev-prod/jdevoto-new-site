import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * Servidor seguro de archivos locales con soporte para GET y HEAD.
 * 
 */

async function handleFileRequest(
  _req: NextRequest,
  params: Promise<{ path: string[] }>,
  method: "GET" | "HEAD"
) {
  try {
    const { path: filePathArray } = await params;
    const folder = filePathArray?.[0];

    // 1. Whitelist de carpetas permitidas
    if (!folder || !["temp", "products"].includes(folder)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 2. Construcción segura de ruta
    const baseStorageDir = path.resolve(process.cwd(), "storage");
    const resolvedPath = path.resolve(baseStorageDir, ...filePathArray);

    // Protección robusta: evitar escape del directorio base
    if (!resolvedPath.startsWith(baseStorageDir + path.sep)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      // Para HEAD solo necesitamos verificar existencia y stats
      const stats = await fs.stat(resolvedPath);

      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
      };

      const contentType = mimeMap[ext] || "application/octet-stream";
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": folder === "products"
          ? "public, max-age=31536000, immutable"
          : "public, max-age=0, must-revalidate",
      };

      if (method === "HEAD") {
        return new NextResponse(null, { headers });
      }

      const fileBuffer = await fs.readFile(resolvedPath);
      return new NextResponse(fileBuffer, { headers });

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return new NextResponse("Not Found", { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[FILE_SERVER_ERROR]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleFileRequest(req, params, "GET");
}

export async function HEAD(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleFileRequest(req, params, "HEAD");
}
