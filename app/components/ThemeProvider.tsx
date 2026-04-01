'use client';

import React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light/dark mode is disabled; render children directly.
  return <>{children}</>;
}