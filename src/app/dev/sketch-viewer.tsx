'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from "@/components/Link";

export default function SketchViewer() {
  const searchParams = useSearchParams();
  const sketch = searchParams.get('sketch');
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sketches = [
    { id: '001-hymnal-layout-variants', name: 'Hymnal Layout Variants' },
    { id: '002-dynamic-sizing-interaction', name: 'Dynamic Sizing Interaction' },
    { id: '003-fullscreen-navigation', name: 'Fullscreen Navigation' },
    { id: '004-realistic-tune-inline-lyrics', name: 'Realistic Tune + Inline Lyrics' },
    { id: '005-desktop-fullscreen-layout', name: 'Desktop Fullscreen' },
    { id: '006-mobile-fullscreen-layout', name: 'Mobile Fullscreen' },
  ];

  useEffect(() => {
    if (!sketch) {
      setLoading(false);
      return;
    }

    const loadSketch = async () => {
      try {
        const res = await fetch(`/api/dev/sketch?id=${encodeURIComponent(sketch)}`);
        if (!res.ok) throw new Error('Sketch not found');
        const data = await res.json();
        setHtml(data.html);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sketch');
      } finally {
        setLoading(false);
      }
    };

    loadSketch();
  }, [sketch]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-bold mb-4">Sketch Viewer</h1>
          <div className="flex gap-2 flex-wrap">
            {sketches.map((s) => (
              <Link
                key={s.id}
                href={`/dev?sketch=${s.id}`}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  sketch === s.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="p-8">
        {error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
        ) : sketch ? (
          <div
            dangerouslySetInnerHTML={{ __html: html }}
            className="bg-white rounded"
          />
        ) : (
          <p className="text-gray-600">Select a sketch to view</p>
        )}
      </div>
    </div>
  );
}
