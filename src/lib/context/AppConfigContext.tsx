'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Typy dla progów czasowych
export interface TimeThreshold {
  name: string;
  min: number;
  max: number;
  color: string;
}

// Interfejs konfiguracji aplikacji
export interface AppConfig {
  timeThresholds: TimeThreshold[];
  displayedDays: number[];
  version?: string; // Informacja o wersji konfiguracji
}

// Domyślna konfiguracja
const defaultConfig: AppConfig = {
  timeThresholds: [
    { name: "low", min: 0, max: 5, color: "#42B983" },    // zielony dla <5h
    { name: "medium", min: 5, max: 7, color: "#FFAB00" }, // żółty dla 5-7h
    { name: "high", min: 7, max: 8, color: "#FF9800" },   // pomarańczowy dla 7-8h
    { name: "critical", min: 8, max: 12, color: "#E9546B" } // czerwony dla >8h
  ],
  displayedDays: [1, 2, 3, 4, 5], // Domyślnie dni od poniedziałku do piątku
  version: 'default.1.0' // Oznaczenie domyślnej konfiguracji
};

// Interfejs kontekstu
interface AppConfigContextType {
  config: AppConfig;
  updateTimeThresholds: (thresholds: TimeThreshold[]) => Promise<boolean>;
  updateDisplayedDays: (days: number[]) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  reloadConfig: () => Promise<void>; // Nowa funkcja do ponownego ładowania konfiguracji
}

// Tworzymy kontekst
const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

// Sprawdza poprawność konfiguracji
const validateConfig = (config: any): AppConfig => {
  const validConfig = { ...defaultConfig };
  
  // Sprawdź czy timeThresholds jest poprawny
  if (Array.isArray(config.timeThresholds) && config.timeThresholds.length > 0) {
    const allValid = config.timeThresholds.every((t: any) => 
      typeof t.name === 'string' && 
      typeof t.min === 'number' && 
      typeof t.max === 'number' && 
      typeof t.color === 'string'
    );
    
    if (allValid) {
      validConfig.timeThresholds = config.timeThresholds;
    }
  }
  
  // Sprawdź czy displayedDays jest poprawny
  if (Array.isArray(config.displayedDays) && config.displayedDays.length > 0) {
    const allValid = config.displayedDays.every((day: any) => 
      typeof day === 'number' && day >= 1 && day <= 7
    );
    
    if (allValid) {
      validConfig.displayedDays = config.displayedDays;
    }
  }
  
  // Dodaj informację o wersji
  validConfig.version = config.version || 'validated.' + Date.now();
  
  return validConfig;
};

// Provider dla kontekstu
export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ładujemy konfigurację z API
  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading configuration from API...');
      const response = await fetch('/api/config');
      
      if (!response.ok) {
        console.error(`Błąd HTTP: ${response.status} - ${response.statusText}`);
        // Spróbujmy odczytać treść błędu, jeśli jest dostępna
        try {
          const errorData = await response.json();
          console.error('Treść błędu:', errorData);
        } catch (e) {
          console.error('Nie udało się odczytać treści błędu');
        }
        throw new Error(`Błąd podczas pobierania konfiguracji: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received configuration:', data);
      
      // Waliduj otrzymaną konfigurację
      const validatedConfig = validateConfig(data);
      console.log('Validated configuration:', validatedConfig);
      
      setConfig(validatedConfig);
      
      // Zapisz kopię do localStorage
      localStorage.setItem('appConfig', JSON.stringify(validatedConfig));
    } catch (error) {
      console.error('Błąd podczas pobierania konfiguracji:', error);
      setError('Nie udało się pobrać konfiguracji. Używam ustawień domyślnych.');
      
      // Próbujemy pobrać kopię z localStorage
      const storedConfig = localStorage.getItem('appConfig');
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig);
          const validatedConfig = validateConfig(parsedConfig);
          console.log('Using localStorage config:', validatedConfig);
          setConfig(validatedConfig);
        } catch (e) {
          console.error('Błąd podczas parsowania konfiguracji z localStorage:', e);
          console.log('Using default config');
          setConfig({...defaultConfig, version: 'default.fallback.' + Date.now()});
        }
      } else {
        console.log('No localStorage config, using default');
        setConfig({...defaultConfig, version: 'default.fallback.' + Date.now()});
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ładujemy konfigurację przy montowaniu
  useEffect(() => {
    loadConfig();
  }, []);

  // Funkcja do ponownego ładowania konfiguracji
  const reloadConfig = async () => {
    await loadConfig();
  };

  // Funkcja do aktualizacji progów czasowych
  const updateTimeThresholds = async (thresholds: TimeThreshold[]): Promise<boolean> => {
    try {
      console.log('Updating time thresholds:', thresholds);
      
      // Aktualizuj lokalnie
      setConfig(prevConfig => {
        const newConfig = { 
          ...prevConfig, 
          timeThresholds: thresholds,
          version: 'updated.' + Date.now() 
        };
        // Zapisz do localStorage jako kopię
        localStorage.setItem('appConfig', JSON.stringify(newConfig));
        return newConfig;
      });
      
      // Zapisz do API
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeThresholds: thresholds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`Błąd podczas zapisywania progów: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      return true;
    } catch (error) {
      console.error('Błąd podczas zapisywania progów czasowych:', error);
      setError('Nie udało się zapisać progów czasowych na serwerze.');
      return false;
    }
  };

  // Funkcja do aktualizacji wyświetlanych dni
  const updateDisplayedDays = async (days: number[]): Promise<boolean> => {
    try {
      console.log('Updating displayed days:', days);
      
      // Aktualizuj lokalnie
      setConfig(prevConfig => {
        const newConfig = { 
          ...prevConfig, 
          displayedDays: days,
          version: 'updated.' + Date.now() 
        };
        // Zapisz do localStorage jako kopię
        localStorage.setItem('appConfig', JSON.stringify(newConfig));
        return newConfig;
      });
      
      // Zapisz do API
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayedDays: days }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`Błąd podczas zapisywania dni: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      return true;
    } catch (error) {
      console.error('Błąd podczas zapisywania dni:', error);
      setError('Nie udało się zapisać dni tygodnia na serwerze.');
      return false;
    }
  };

  return (
    <AppConfigContext.Provider value={{ 
      config, 
      updateTimeThresholds, 
      updateDisplayedDays, 
      isLoading, 
      error, 
      reloadConfig 
    }}>
      {children}
    </AppConfigContext.Provider>
  );
}

// Hook do używania kontekstu
export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
} 