'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import Footer from '@/app/components/Footer';
import MusicPlayer from '@/app/components/MusicPlayer';
import GoToTopButton from '@/app/components/GoToTopButton';

const PwaInstallPrompt = dynamic(() => import('@/app/components/PwaInstallPrompt'), {
  ssr: false,
});

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <PwaInstallPrompt />
      {children}
      <Footer />
      <MusicPlayer />
      <GoToTopButton />
    </>
  );
}
