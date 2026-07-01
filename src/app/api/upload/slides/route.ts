import { NextRequest, NextResponse } from "next/server";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { LocalStorageService } from "@/modules/catalog/application/services/StorageService";
import sharp from "sharp";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Implementación simple de rate limiting en memoria
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticación y Autorización
    const user = extractUserFromRequest(req);
    requireRole(user, [UserRole.ADMIN]);

    // 2. Rate Limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // 3. Procesar FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. Validación de Tipo y Tamaño
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG and WEBP are allowed." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    // 5. Optimización con Sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Redimensionar para slider (ancho máximo recomendado de 1920px para hero)
    const optimizedBuffer = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // 6. Guardar archivo permanente en carpeta de productos (permitida en GET files)
    const uniqueFilename = `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.webp`;
    const optimizedFile = new File([new Uint8Array(optimizedBuffer)], uniqueFilename, { type: "image/webp" });
    
    const storageService = new LocalStorageService();
    const permanentUrl = await storageService.upload(optimizedFile, { isTemp: false });

    return NextResponse.json({ url: permanentUrl }, { status: 201 });

  } catch (error: any) {
    console.error("[UPLOAD_SLIDES_ERROR]", error);
    if (error.name === "UnauthorizedError" || error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: error.name === "UnauthorizedError" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
