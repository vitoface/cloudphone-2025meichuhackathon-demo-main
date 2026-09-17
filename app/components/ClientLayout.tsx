'use client';

import { NavigationProvider } from './NavigationContext';
import Navigation from './Navigation';
import KeyboardHandler from './KeyboardHandler';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      <KeyboardHandler />
      <div className="min-h-screen pb-6">
        {children}
      </div>
      <Navigation />
    </NavigationProvider>
  );
}