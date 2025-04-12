'use client';

import { useState, useEffect } from 'react';

// Dni tygodnia
const weekDayNames = [
  { id: 1, name: 'Poniedziałek', shortName: 'Pon' },
  { id: 2, name: 'Wtorek', shortName: 'Wt' },
  { id: 3, name: 'Środa', shortName: 'Śr' },
  { id: 4, name: 'Czwartek', shortName: 'Czw' },
  { id: 5, name: 'Piątek', shortName: 'Pt' },
  { id: 6, name: 'Sobota', shortName: 'Sob' },
  { id: 7, name: 'Niedziela', shortName: 'Nd' },
];

interface DaysSelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

export default function DaysSelector({ selectedDays, onChange }: DaysSelectorProps) {
  const [days, setDays] = useState(selectedDays);
  
  // Synchronizacja z propsami
  useEffect(() => {
    setDays(selectedDays);
  }, [selectedDays]);
  
  // Obsługa zaznaczenia/odznaczenia dnia
  const toggleDay = (dayId: number) => {
    let newDays;
    
    if (days.includes(dayId)) {
      // Upewnij się, że zawsze jest zaznaczony co najmniej jeden dzień
      if (days.length > 1) {
        newDays = days.filter(d => d !== dayId);
      } else {
        return; // Nie pozwól na odznaczenie ostatniego dnia
      }
    } else {
      newDays = [...days, dayId].sort((a, b) => a - b);
    }
    
    setDays(newDays);
    onChange(newDays);
  };
  
  return (
    <div className="days-selector-wrapper">
      <div className="days-selector">
        <div className="days-container">
          {weekDayNames.map((day) => (
            <div 
              key={day.id} 
              className={`day-item ${days.includes(day.id) ? 'selected' : ''}`}
              onClick={() => toggleDay(day.id)}
            >
              <div className="day-name">{day.shortName}</div>
              <div className="day-full-name">{day.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .days-selector-wrapper {
          position: relative;
          width: 100%;
        }
        
        .days-selector {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .days-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: space-between;
          width: 100%;
        }
        
        .day-item {
          width: calc(100% / 7 - 7px);
          padding: 10px 0;
          background: #f5f5f5;
          border: 2px solid #e0e0e0;
          border-radius: 5px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
        }
        
        .day-item:hover {
          background: #e8e8e8;
        }
        
        .day-item.selected {
          background: #e6f7ff;
          border-color: #1890ff;
          color: #1890ff;
        }
        
        .day-name {
          font-weight: bold;
          font-size: 16px;
        }
        
        .day-full-name {
          font-size: 11px;
          margin-top: 4px;
          color: #777;
        }
        
        @media (max-width: 640px) {
          .days-container {
            flex-wrap: wrap;
          }
          
          .day-item {
            width: calc(100% / 4 - 6px);
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
} 