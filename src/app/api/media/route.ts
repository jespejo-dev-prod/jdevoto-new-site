import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/server-auth';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/client';

cloudinary.config({
  secure: true
});

export async function GET(request: Request) {
  try {
    const user = await getServerUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const search = searchParams.get('search') || '';
    const folder = searchParams.get('folder') || '';
    
    let expression = 'resource_type:image';
    
    if (folder && folder !== 'all') {
      expression += ` AND folder:"${folder}/*"`;
    }
    
    if (search) {
      expression += ` AND (filename:"*${search}*" OR public_id:"*${search}*")`;
    }

    const result = await cloudinary.search
      .expression(expression)
      .sort_by('created_at', 'desc')
      .max_results(40)
      .next_cursor(cursor)
      .execute();

    return NextResponse.json({
      resources: result.resources.map((res: any) => ({
        publicId: res.public_id,
        secureUrl: res.secure_url,
        width: res.width,
        height: res.height,
        format: res.format,
        createdAt: res.created_at,
        folder: res.folder,
        filename: res.filename,
        thumbnailUrl: cloudinary.url(res.public_id, {
          width: 180,
          height: 180,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        })
      })),
      nextCursor: result.next_cursor
    });
  } catch (error: any) {
    console.error('Media API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getServerUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { publicId } = await request.json();
    if (!publicId) {
      return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
    }

    const settings = await prisma.setting.findUnique({
      where: { key: 'home_slides' }
    });

    if (settings && settings.value) {
      const slides = settings.value as any[];
      const isInUse = slides.some(slide => 
        (slide.imagePublicId && slide.imagePublicId === publicId) ||
        (slide.mobileImagePublicId && slide.mobileImagePublicId === publicId) ||
        (slide.image && slide.image.includes(publicId)) ||
        (slide.mobileImage && slide.mobileImage.includes(publicId))
      );

      if (isInUse) {
        return NextResponse.json({ 
          error: 'Esta imagen está siendo utilizada por un Banner de la página principal. No se puede eliminar.' 
        }, { status: 400 });
      }
    }

    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Media API DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
