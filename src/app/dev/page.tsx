export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SketchViewer from './sketch-viewer';

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') redirect('/login')

  return <SketchViewer />;
}
