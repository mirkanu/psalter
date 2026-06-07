import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sketchId = searchParams.get('id');

  if (!sketchId) {
    return NextResponse.json({ error: 'Missing sketch id' }, { status: 400 });
  }

  // Prevent directory traversal
  if (sketchId.includes('..') || sketchId.includes('/')) {
    return NextResponse.json({ error: 'Invalid sketch id' }, { status: 400 });
  }

  try {
    const sketchPath = join(
      process.cwd(),
      '.planning/sketches',
      sketchId,
      'index.html'
    );

    let html = await readFile(sketchPath, 'utf-8');

    // Rewrite relative asset paths to serve from /api/dev/asset
    html = html.replace(
      /href="\.\.\/themes\/([^"]+)"/g,
      (match, file) => `href="/api/dev/asset?file=themes/${file}"`
    );
    html = html.replace(
      /src="\.\.\/themes\/([^"]+)"/g,
      (match, file) => `src="/api/dev/asset?file=themes/${file}"`
    );

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Sketch load error:', error);
    return NextResponse.json({ error: 'Sketch not found' }, { status: 404 });
  }
}
