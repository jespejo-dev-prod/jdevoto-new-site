import { NextResponse, NextRequest } from 'next/server';
import { generateOpenApi } from '@/lib/openapi';

export async function GET(req: NextRequest) {
  // 1. Validar si está explícitamente permitida la documentación
  const exposeDocs = process.env.EXPOSE_API_DOCS === 'true';
  if (!exposeDocs) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Exigir llave secreta siempre que esté definida en el entorno
  const docsKey = process.env.API_DOCS_KEY;

  if (docsKey) {
    const { searchParams } = req.nextUrl;
    const providedKey = searchParams.get('key');
    if (providedKey !== docsKey) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }


  const document = generateOpenApi();
  return NextResponse.json(document);
}

