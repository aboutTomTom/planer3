'use client';

import React from 'react';
import { AppConfigProvider } from '../lib/context/AppConfigContext';
import { OfflineProvider } from '../lib/context/OfflineContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <OfflineProvider>
      <AppConfigProvider>
        {children}
      </AppConfigProvider>
    </OfflineProvider>
  );
} 