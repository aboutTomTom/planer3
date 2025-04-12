'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Interfejs dla kontekstu ładowania
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

// Tworzenie kontekstu z domyślnymi wartościami
const LoadingContext = createContext<LoadingContextType>({
  isLoading: true,
  setLoading: () => {},
  startLoading: () => {},
  stopLoading: () => {},
});

// Hook do używania kontekstu ładowania
export const useLoading = () => useContext(LoadingContext);

// Props dla providera ładowania
interface LoadingProviderProps {
  children: React.ReactNode;
}

// Provider dla kontekstu ładowania
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const loadingCountRef = useRef(1); // Inicjalna wartość 1 dla początkowego ładowania
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Funkcja do rozpoczęcia ładowania
  const startLoading = () => {
    loadingCountRef.current += 1;
    setIsLoading(true);
    
    // Anuluj istniejący timeout, jeśli istnieje
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Funkcja do zakończenia ładowania
  const stopLoading = () => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
    
    // Jeśli wszystkie procesy ładowania zostały zakończone, ustaw timeout
    if (loadingCountRef.current === 0) {
      // Anuluj istniejący timeout, jeśli istnieje
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Ustaw nowy timeout, aby dać czas na renderowanie
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        timeoutRef.current = null;
      }, 800);
    }
  };

  // Bezpośrednia funkcja do ustawiania stanu ładowania
  const setLoading = (loading: boolean) => {
    if (loading) {
      startLoading();
    } else {
      stopLoading();
    }
  };

  // Po załadowaniu strony ukryj ekran ładowania po pewnym czasie
  useEffect(() => {
    // Czekamy na pełne załadowanie DOM
    if (typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        stopLoading(); // Zatrzymaj początkowe ładowanie
      }, 1200); // Dłuższy czas ładowania, aby komponenty miały czas się wyrenderować

      return () => {
        clearTimeout(timeoutId);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
} 