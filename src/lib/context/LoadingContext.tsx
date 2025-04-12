'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Interfejs dla kontekstu ładowania
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Tworzenie kontekstu z domyślnymi wartościami
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

// Hook do używania kontekstu ładowania
export const useLoading = () => useContext(LoadingContext);

// Props dla providera ładowania
interface LoadingProviderProps {
  children: React.ReactNode;
}

// Provider dla kontekstu ładowania
export function LoadingProvider({ children }: LoadingProviderProps) {
  // Inicjalizujemy jako false, aby nie pokazywać ekranu ładowania przy starcie
  const [isLoading, setIsLoading] = useState(false);
  
  // Prosta funkcja do ustawiania stanu ładowania
  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
} 