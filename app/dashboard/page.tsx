import React from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import DashboardClient from './DashboardClient';
import { getDashboardCommunities } from '@/lib/dashboard/service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let initialError: string | undefined;
  let initialData = undefined;

  try {
    initialData = await getDashboardCommunities({ period: '7d', limit: 100 });
  } catch (error) {
    initialError = error instanceof Error ? error.message : 'Unable to load dashboard data';
    console.error('dashboard page load error', error);
  }

  return (
    <div className="min-h-screen relative">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <DashboardClient initialData={initialData} initialError={initialError} />
      </main>
      <Footer />
    </div>
  );
}


