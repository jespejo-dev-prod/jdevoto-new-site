import React from 'react';

export const dynamic = 'force-dynamic';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { WishlistContent } from './WishlistContent';
import { getServerUser } from '@/lib/server-auth';

export default async function WishlistPage() {
  const user = await getServerUser();
  const userEmail = user?.email || '';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PublicHeader />
      
      <WishlistContent defaultEmail={userEmail} />

      <PublicFooter />
    </div>
  );
}
