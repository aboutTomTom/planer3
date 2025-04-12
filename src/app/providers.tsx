'use client';

import React, { useState, useEffect } from 'react';
import { AppConfigProvider } from '../lib/context/AppConfigContext';
import { OfflineProvider } from '../lib/context/OfflineContext';
import LoadingScreen from '../components/LoadingScreen';
import { usePathname } from 'next/navigation';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Resetujemy stan mounted przy każdej zmianie ścieżki
  useEffect(() => {
    setMounted(true);
    
    // Cleanup przy odmontowaniu
    return () => setMounted(false);
  }, [pathname]);
  
  // Zapewnia, że komponenty są zawsze świeżo renderowane
  useEffect(() => {
    // Efekt inicjalizacji
    const timeout = setTimeout(() => {
      if (!mounted) {
        setMounted(true);
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [mounted]);

  return (
    <OfflineProvider>
      <AppConfigProvider>
        <LoadingScreen />
        {mounted ? children : null}
      </AppConfigProvider>
    </OfflineProvider>
  );
} 