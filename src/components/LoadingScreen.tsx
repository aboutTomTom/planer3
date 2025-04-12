'use client';

import React, { useEffect, useState } from 'react';

// Globalny identyfikator dla naszego ekranu ładowania
let loadingTimeoutId: NodeJS.Timeout | null = null;
let isGlobalLoading = false;

// Funkcje pomocnicze do sterowania ekranem ładowania
export const showLoading = () => {
  isGlobalLoading = true;
  const event = new Event('loading-change');
  window.dispatchEvent(event);
  
  // Automatycznie ukryj ekran ładowania po 10 sekundach (dla bezpieczeństwa)
  if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
  loadingTimeoutId = setTimeout(() => {
    hideLoading();
  }, 10000);
};

export const hideLoading = () => {
  isGlobalLoading = false;
  if (loadingTimeoutId) {
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
  }
  const event = new Event('loading-change');
  window.dispatchEvent(event);
};

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Aktualizacja stanu na podstawie globalnego zdarzenia
    const handleLoadingChange = () => {
      setIsLoading(isGlobalLoading);
    };
    
    // Rejestracja nasłuchiwacza zdarzenia
    if (typeof window !== 'undefined') {
      window.addEventListener('loading-change', handleLoadingChange);
    }
    
    // Czyszczenie nasłuchiwacza przy odmontowaniu
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('loading-change', handleLoadingChange);
      }
      
      // Zawsze czyścimy timeout przy odmontowaniu
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
        loadingTimeoutId = null;
      }
    };
  }, []);

  // Jeśli nie ładujemy, nie renderuj nic
  if (!isLoading) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Ładowanie aplikacji...</p>
      </div>

      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: pulse 2s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #1890ff;
          animation: spin 1s ease infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-container p {
          font-size: 1rem;
          color: #333;
          margin: 0;
        }
      `}</style>
    </div>
  );
} 