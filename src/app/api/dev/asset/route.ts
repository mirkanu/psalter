import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionOr401 } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const { res: authRes } = await getAdminSessionOr401();
  if (authRes) return authRes;

  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'Missing file param' }, { status: 400 });
  }

  // Prevent directory traversal
  if (file.includes('..')) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  try {
    const assetPath = join(process.cwd(), '.planning/sketches', file);
    const content = await readFile(assetPath, 'utf-8');

    const mimeType = file.endsWith('.css')
      ? 'text/css'
      : file.endsWith('.js')
        ? 'application/javascript'
        : 'text/plain';

    return new NextResponse(content, {
      headers: { 'Content-Type': mimeType },
    });
  } catch (error) {
    console.error('Asset load error:', error);
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
