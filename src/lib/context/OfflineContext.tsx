'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Dexie from 'dexie';

// Definiujemy bazę danych dla trybu offline
class OfflineDatabase extends Dexie {
  pendingChanges: Dexie.Table<PendingChange, number>;

  constructor() {
    super('plannerOfflineDB');
    this.version(1).stores({
      pendingChanges: '++id,entity,action,timestamp',
    });
    this.pendingChanges = this.table('pendingChanges');
  }
}

const db = new OfflineDatabase();

// Typ dla oczekujących zmian
export interface PendingChange {
  id?: number;
  entity: string;  // np. 'task', 'user', itd.
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

// Interfejs kontekstu trybu offline
interface OfflineContextType {
  isOnline: boolean;
  isPendingChanges: boolean;
  storePendingChange: (change: Omit<PendingChange, 'id' | 'timestamp'>) => Promise<void>;
  synchronizeChanges: () => Promise<void>;
  pendingChangesCount: number;
}

// Tworzymy kontekst
const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Provider dla kontekstu
export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Monitorowanie stanu połączenia
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Sprawdź aktualny stan
    setIsOnline(navigator.onLine);

    // Ustaw nasłuchiwanie zdarzeń
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sprawdzaj liczbę oczekujących zmian
    const checkPendingChanges = async () => {
      const count = await db.pendingChanges.count();
      setPendingChangesCount(count);
    };

    checkPendingChanges();

    // Ustaw interwał sprawdzania oczekujących zmian
    const interval = setInterval(checkPendingChanges, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Zapisanie zmiany w lokalnej bazie danych
  const storePendingChange = async (change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    await db.pendingChanges.add({
      ...change,
      timestamp: Date.now(),
    });
    
    const count = await db.pendingChanges.count();
    setPendingChangesCount(count);
  };

  // Synchronizacja zmian z serwerem
  const synchronizeChanges = async () => {
    if (!isOnline) return;

    // Pobierz wszystkie oczekujące zmiany
    const pendingChanges = await db.pendingChanges.toArray();
    
    // Posortuj zmiany według timestampu (od najstarszych do najnowszych)
    pendingChanges.sort((a, b) => a.timestamp - b.timestamp);
    
    for (const change of pendingChanges) {
      try {
        // Określamy endpoint na podstawie encji i akcji
        const endpoint = `/api/${change.entity}${change.action === 'delete' ? `/${change.data.id}` : ''}`;
        
        // Określamy metodę HTTP
        const method = change.action === 'create' 
          ? 'POST' 
          : change.action === 'update' 
            ? 'PUT' 
            : 'DELETE';
        
        // Wysyłamy zmianę do API
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method !== 'DELETE' ? JSON.stringify(change.data) : undefined,
        });

        // Jeśli wszystko poszło dobrze, usuwamy zmianę z bazy
        if (response.ok) {
          await db.pendingChanges.delete(change.id!);
        }
      } catch (error) {
        console.error('Błąd podczas synchronizacji:', error);
        // Jeśli wystąpił błąd, przerywamy synchronizację
        break;
      }
    }
    
    // Aktualizujemy licznik
    const count = await db.pendingChanges.count();
    setPendingChangesCount(count);
  };

  return (
    <OfflineContext.Provider value={{
      isOnline,
      isPendingChanges: pendingChangesCount > 0,
      storePendingChange,
      synchronizeChanges,
      pendingChangesCount,
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

// Hook do używania kontekstu
export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
} 