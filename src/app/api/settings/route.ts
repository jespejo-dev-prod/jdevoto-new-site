import { NextResponse } from 'next/server';
import { prisma } from '@/lib/client';
import { getServerUser } from '@/lib/server-auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    const setting = await prisma.storeSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json({ value: null }, { status: 200 });
    }

    return NextResponse.json({ value: setting.value }, { status: 200 });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    // Only allow ADMIN to save settings
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const setting = await prisma.storeSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true, setting }, { status: 200 });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
