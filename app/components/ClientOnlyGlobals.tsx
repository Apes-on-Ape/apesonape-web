'use client';
import dynamic from 'next/dynamic';

const SoundCloudPlayer = dynamic(() => import('./SoundCloudPlayer'), { ssr: false });
const InstallPWA = dynamic(() => import('./InstallPWA'), { ssr: false });

export default function ClientOnlyGlobals() {
  return (
    <>
      <SoundCloudPlayer />
      <InstallPWA />
    </>
  );
}
