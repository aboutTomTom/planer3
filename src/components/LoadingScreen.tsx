'use client';

import React, { useEffect, useState } from 'react';
import { useLoading } from '@/lib/context/LoadingContext';

export default function LoadingScreen() {
  const { isLoading } = useLoading();
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Efekt montowania - ustawienie flagi mounted na true po zamontowaniu
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Efekt obsługujący widoczność ekranu ładowania
  useEffect(() => {
    if (mounted) {
      if (isLoading) {
        // Pokaż ekran natychmiast, gdy isLoading = true
        setVisible(true);
      } else {
        // Dodaj opóźnienie przed usunięciem, aby zapewnić płynne przejście
        const timer = setTimeout(() => {
          setVisible(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, mounted]);

  // Nie renderuj nic, jeśli ekran jest niewidoczny i nie jest w trakcie ładowania
  if (!visible && !isLoading) {
    return null;
  }

  return (
    <div 
      className="loading-overlay"
      style={{
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? 'auto' : 'none',
      }}
    >
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
          transition: opacity 0.5s ease;
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
          transform: scale(1);
          transition: transform 0.3s ease;
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