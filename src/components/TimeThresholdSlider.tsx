'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { TimeThreshold } from '@/lib/context/AppConfigContext';

interface TimeThresholdSliderProps {
  thresholds: TimeThreshold[];
  onChange: (thresholds: TimeThreshold[]) => void;
  min: number;
  max: number;
  step: number;
}

const TimeThresholdSlider: React.FC<TimeThresholdSliderProps> = ({
  thresholds,
  onChange,
  min = 0,
  max = 12,
  step = 0.5
}) => {
  // Wartości sliderów
  const [sliderValues, setSliderValues] = useState<number[]>([5, 7, 8]);
  
  // Aktualny zakres skali
  const [currentScale, setCurrentScale] = useState<number>(max);
  
  // Referncje do aktywnego slidera
  const activeSliderRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const initialXRef = useRef<number>(0);
  const initialLeftRef = useRef<number>(0);
  const battonbarRef = useRef<HTMLDivElement>(null);

  // Stan dla otwartego okna wyboru koloru
  const [activeColorPicker, setActiveColorPicker] = useState<number | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Pozycja okna wyboru koloru
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

  // Inicjalizacja wartości z progów
  useEffect(() => {
    if (thresholds.length >= 3) {
      const newValues = [
        thresholds[0].max, // pierwszy suwak to max pierwszego progu (low)
        thresholds[1].max, // drugi suwak to max drugiego progu (medium)
        thresholds[2].max, // trzeci suwak to max trzeciego progu (high)
      ];
      setSliderValues(newValues);
    }
  }, [thresholds]);

  // Obsługa kliknięcia poza pickerem kolorów
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeColorPicker !== null &&
        colorPickerRef.current && 
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setActiveColorPicker(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeColorPicker]);

  // Funkcja do obliczania skali na podstawie wartości sliderów
  const calculateScale = (values: number[]) => {
    const maxSliderValue = Math.max(...values);
    
    if (maxSliderValue <= 10) {
      return 12;
    } else {
      // Proste liniowe skalowanie od 10->12h do 20->24h
      const additionalHours = Math.min((maxSliderValue - 10) * (12/10), 12);
      return 12 + additionalHours;
    }
  };

  // Funkcja aktualizująca progi czasowe na podstawie wartości suwaków
  const updateThresholds = (newValues: number[]) => {
    if (newValues.length !== 3 || thresholds.length < 4) return;

    const updatedThresholds = [...thresholds];
    
    // Aktualizacja progów czasowych na podstawie pozycji suwaków
    updatedThresholds[0].min = min;
    updatedThresholds[0].max = newValues[0];
    
    updatedThresholds[1].min = newValues[0];
    updatedThresholds[1].max = newValues[1];
    
    updatedThresholds[2].min = newValues[1];
    updatedThresholds[2].max = newValues[2];
    
    updatedThresholds[3].min = newValues[2];
    updatedThresholds[3].max = max;
    
    onChange(updatedThresholds);
  };

  // Funkcja aktualizująca kolor
  const handleColorChange = (index: number, color: string) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds[index].color = color;
    onChange(updatedThresholds);
  };
  
  // Funkcja sprawdzająca jasność koloru i zwracająca odpowiedni kolor tekstu
  const getTextColor = (backgroundColor: string): string => {
    // Konwersja HEX do RGB
    let r, g, b;
    
    // Obsługa kolorów w formacie HEX
    if (backgroundColor.startsWith('#')) {
      const hex = backgroundColor.slice(1);
      r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
      g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
      b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
    } 
    // Obsługa kolorów w formacie rgba
    else if (backgroundColor.startsWith('rgb')) {
      const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
      if (rgbMatch) {
        r = parseInt(rgbMatch[1]);
        g = parseInt(rgbMatch[2]);
        b = parseInt(rgbMatch[3]);
      } else {
        // Domyślnie czarny tekst, jeśli format koloru jest nieznany
        return 'black';
      }
    } else {
      // Domyślnie czarny tekst, jeśli format koloru jest nieznany
      return 'black';
    }
    
    // Obliczenie jasności (luminance) według formuły YIQ
    // Źródło: https://24ways.org/2010/calculating-color-contrast/
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // YIQ < 128 to ciemny kolor, > 128 to jasny
    return yiq >= 128 ? 'black' : 'white';
  };
  
  // Funkcja sprawdzająca czy segment jest za wąski na pełny tekst
  const checkSegmentWidth = (element: HTMLElement | null) => {
    if (!element) return;
    
    const width = element.offsetWidth;
    
    // Jeśli szerokość mniejsza niż 70px, przełącz na krótki tekst
    if (width < 70) {
      element.classList.add('narrow');
    } else {
      element.classList.remove('narrow');
    }
  };
  
  // Funkcja rozpoczynająca przeciąganie
  const startDrag = (index: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Zapisz aktualny slider
    const slider = e.currentTarget as HTMLDivElement;
    activeSliderRef.current = slider;
    isDraggingRef.current = true;
    
    if ('clientX' in e) {
      initialXRef.current = e.clientX;
    } else if (e.touches && e.touches.length) {
      initialXRef.current = e.touches[0].clientX;
    }
    
    // Zapisz początkową pozycję slidera
    const style = window.getComputedStyle(slider);
    initialLeftRef.current = parseFloat(style.left);
    
    // Dodaj globalne listenery
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag as unknown as EventListener);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  };
  
  // Funkcja obsługująca przeciąganie
  const drag = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !activeSliderRef.current || !battonbarRef.current) return;
    
    let currentX;
    if ('clientX' in e) {
      currentX = e.clientX;
    } else if (e.touches && e.touches.length) {
      currentX = e.touches[0].clientX;
    } else {
      return;
    }
    
    const diffX = currentX - initialXRef.current;
    const barWidth = battonbarRef.current.offsetWidth;
    let newLeft = (initialLeftRef.current + diffX);
    
    // Upewnij się, że slider pozostaje w granicach battonbar
    if (newLeft < 0) newLeft = 0;
    if (newLeft > barWidth) newLeft = barWidth;
    
    // Oblicz wartość czasu na podstawie aktualnej skali
    let timeValue = (newLeft / barWidth) * currentScale;
    
    // Zaokrąglij do najbliższego 0.5
    timeValue = Math.round(timeValue * 2) / 2;
    
    // Zastosuj ograniczenia min/max
    const minValue = 0.5;
    const maxValue = currentScale - 0.5;
    if (timeValue < minValue) timeValue = minValue;
    if (timeValue > maxValue) timeValue = maxValue;
    
    // Tymczasowa kopia wartości sliderów
    const newValues = [...sliderValues];
    const sliderIndex = activeSliderRef.current === document.getElementById('s1') ? 0 :
                         activeSliderRef.current === document.getElementById('s2') ? 1 : 2;
    
    // Zastosuj ograniczenia dla poszczególnych sliderów
    if (sliderIndex === 0) {
      // s1 < s2 - 0.5
      timeValue = Math.min(timeValue, sliderValues[1] - 0.5);
      newValues[0] = timeValue;
    } else if (sliderIndex === 1) {
      // s1 + 0.5 < s2 < s3 - 0.5
      timeValue = Math.max(timeValue, sliderValues[0] + 0.5);
      timeValue = Math.min(timeValue, sliderValues[2] - 0.5);
      newValues[1] = timeValue;
    } else if (sliderIndex === 2) {
      // s2 + 0.5 < s3
      timeValue = Math.max(timeValue, sliderValues[1] + 0.5);
      newValues[2] = timeValue;
    }
    
    // Aktualizuj wartości sliderów
    setSliderValues(newValues);
    
    // Aktualizuj skalę
    const newScale = calculateScale(newValues);
    setCurrentScale(newScale);
    
    // Aktualizuj progi czasowe
    updateThresholds(newValues);
  };
  
  // Funkcja kończąca przeciąganie
  const stopDrag = () => {
    isDraggingRef.current = false;
    activeSliderRef.current = null;
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag as unknown as EventListener);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    
    // Sprawdź szerokości segmentów po zakończeniu przeciągania
    setTimeout(() => {
      checkSegmentWidth(document.querySelector('.segment.low'));
      checkSegmentWidth(document.querySelector('.segment.medium'));
      checkSegmentWidth(document.querySelector('.segment.high'));
      checkSegmentWidth(document.querySelector('.segment.critical'));
    }, 0);
  };

  // Funkcja obsługująca kliknięcie na segment
  const handleSegmentClick = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Zapisz pozycję kliknięcia
    setPickerPosition({ 
      x: e.clientX, 
      y: e.clientY 
    });
    
    // Aktywuj picker lub zamknij jeśli kliknięto drugi raz ten sam segment
    setActiveColorPicker(activeColorPicker === index ? null : index);
  };

  // Renderowanie komponentu
  return (
    <div className="time-threshold-slider-wrapper">
      <div className="time-threshold-slider">
        <div className="slider-container">
          <div className="slider-end zero">0</div>
          <div className="slider-track" id="battonbar" ref={battonbarRef}>
            <button 
              className="segment low" 
              style={{ 
                backgroundColor: thresholds[0]?.color || '#95ff82',
                width: `calc((${sliderValues[0]} / ${currentScale}) * 100% - 20px)`,
                color: getTextColor(thresholds[0]?.color || '#95ff82')
              }}
              onClick={handleSegmentClick(0)}
            >
              <span className="full">NISKI</span>
              <span className="short">N</span>
            </button>
            
            <div 
              className="slider-handle s1" 
              id="s1"
              style={{ left: `calc((${sliderValues[0]} / ${currentScale}) * 100%)` }}
              onMouseDown={startDrag(0)}
              onTouchStart={startDrag(0)}
            >
              {sliderValues[0]}
            </div>
            
            <button 
              className="segment medium" 
              style={{ 
                backgroundColor: thresholds[1]?.color || '#fbff82',
                left: `calc((${sliderValues[0]} / ${currentScale}) * 100% + 20px)`,
                width: `calc(((${sliderValues[1]} - ${sliderValues[0]}) / ${currentScale}) * 100% - 40px)`,
                color: getTextColor(thresholds[1]?.color || '#fbff82')
              }}
              onClick={handleSegmentClick(1)}
            >
              <span className="full">ŚREDNI</span>
              <span className="short">Ś</span>
            </button>
            
            <div 
              className="slider-handle s2" 
              id="s2"
              style={{ left: `calc((${sliderValues[1]} / ${currentScale}) * 100%)` }}
              onMouseDown={startDrag(1)}
              onTouchStart={startDrag(1)}
            >
              {sliderValues[1]}
            </div>
            
            <button 
              className="segment high" 
              style={{ 
                backgroundColor: thresholds[2]?.color || '#ffda82',
                left: `calc((${sliderValues[1]} / ${currentScale}) * 100% + 20px)`,
                width: `calc(((${sliderValues[2]} - ${sliderValues[1]}) / ${currentScale}) * 100% - 40px)`,
                color: getTextColor(thresholds[2]?.color || '#ffda82')
              }}
              onClick={handleSegmentClick(2)}
            >
              <span className="full">WYSOKI</span>
              <span className="short">W</span>
            </button>
            
            <div 
              className="slider-handle s3" 
              id="s3"
              style={{ left: `calc((${sliderValues[2]} / ${currentScale}) * 100%)` }}
              onMouseDown={startDrag(2)}
              onTouchStart={startDrag(2)}
            >
              {sliderValues[2]}
            </div>
            
            <button 
              className="segment critical" 
              style={{ 
                backgroundColor: thresholds[3]?.color || '#b91a1a',
                left: `calc((${sliderValues[2]} / ${currentScale}) * 100% + 20px)`,
                width: `calc((1 - (${sliderValues[2]} / ${currentScale})) * 100% - 20px)`,
                color: getTextColor(thresholds[3]?.color || '#b91a1a')
              }}
              onClick={handleSegmentClick(3)}
            >
              <span className="full">KRYTYCZNY</span>
              <span className="short">K</span>
            </button>
          </div>
          <div className="slider-end max">MAX</div>
        </div>
      </div>
      
      <div className="instruction-text">
        Przeciągnij suwaki, aby ustawić progi czasowe. Kliknij w kolorowy segment, aby zmienić jego kolor.
      </div>
      
      {/* Picker kolorów pojawia się po kliknięciu w segment */}
      {activeColorPicker !== null && (
        <div 
          className="color-picker-container" 
          ref={colorPickerRef}
          style={{
            position: 'fixed',
            left: `${pickerPosition.x}px`,
            top: `${pickerPosition.y}px`,
            transform: 'translate(-50%, 10px)'
          }}
        >
          <div className="color-picker-header">
            Wybierz kolor dla progu: {
              activeColorPicker === 0 ? 'NISKI' :
              activeColorPicker === 1 ? 'ŚREDNI' :
              activeColorPicker === 2 ? 'WYSOKI' : 'KRYTYCZNY'
            }
          </div>
          <HexColorPicker 
            color={thresholds[activeColorPicker]?.color} 
            onChange={(color) => handleColorChange(activeColorPicker, color)} 
          />
          <input
            type="text"
            value={thresholds[activeColorPicker]?.color || ''}
            onChange={(e) => handleColorChange(activeColorPicker, e.target.value)}
            className="color-input"
          />
          <button 
            className="close-picker-button"
            onClick={() => setActiveColorPicker(null)}
          >
            Zamknij
          </button>
        </div>
      )}
      
      <style jsx>{`
        .time-threshold-slider-wrapper {
          position: relative;
          width: 100%;
        }
        
        .time-threshold-slider {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding-top: 5px;
          padding-bottom: 5px;
        }
        
        .slider-container {
          display: flex;
          width: 100%;
          justify-content: space-between;
          position: relative;
          margin: auto;
          align-items: center;
        }
        
        .slider-end {
          height: 19px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: normal;
          border-radius: 5px;
          font-size: 0.75rem;
          background-color: #f5f5f5;
          border: 2px solid #e0e0e0;
          width: 60px;
          flex-shrink: 0;
          color: #666;
          padding-top: 20px;
          padding-bottom: 20px;
        }
        
        .slider-track {
          display: flex;
          flex-grow: 1;
          width: calc(100% - 120px);
          position: relative;
          background-color: #f5f5f5;
          height: 44px;
          border-radius: 5px;
          margin: 0 2px;
          padding-top: 0;
          padding-bottom: 0;
        }
        
        .slider-handle {
          width: 35px;
          height: 19px;
          flex-shrink: 0;
          flex-grow: 0;
          position: absolute;
          z-index: 10;
          cursor: move;
          user-select: none;
          touch-action: none;
          background-color: #1890ff;
          transform: translateX(-50%);
          border-radius: 5px;
          font-size: 0.75rem;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 2px solid rgba(0, 0, 0, 0.1);
          padding-top: 20px;
          padding-bottom: 20px;
        }
        
        .segment {
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: normal;
          position: absolute;
          height: 19px;
          z-index: 5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-radius: 5px;
          font-size: 0.75rem;
          padding: 20px 0;
          margin: 0;
          border: 2px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          background-color: transparent;
          outline: none;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        
        .segment:hover {
          filter: brightness(1.05);
        }
        
        .segment span.full {
          display: inline;
        }
        
        .segment span.short {
          display: none;
        }
        
        .segment.narrow span.full {
          display: none;
        }
        
        .segment.narrow span.short {
          display: inline;
        }
        
        .color-buttons-container {
          display: none;
        }
        
        .color-picker-container {
          padding: 15px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1000;
          width: 240px;
          border: 1px solid #e0e0e0;
        }
        
        .color-picker-header {
          font-size: 0.85rem;
          font-weight: normal;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .color-input {
          margin-top: 10px;
          width: calc(100% - 10px);
          padding: 5px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .close-picker-button {
          margin-top: 10px;
          padding: 6px 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .close-picker-button:hover {
          background-color: #e5e7eb;
        }
        
        .instruction-text {
          text-align: center;
          margin-top: 5px;
          font-size: 0.75rem;
          color: #666;
          position: absolute;
          width: 100%;
          left: 0;
        }
      `}</style>
    </div>
  );
};

export default TimeThresholdSlider; 