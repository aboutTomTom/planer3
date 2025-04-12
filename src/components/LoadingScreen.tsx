'use client';

import React from 'react';
import { useLoading } from '@/lib/context/LoadingContext';

export default function LoadingScreen() {
  const { isLoading } = useLoading();

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