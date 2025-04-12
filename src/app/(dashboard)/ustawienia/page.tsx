'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaBuilding, FaStore, FaUserCog, FaClock, FaCalendarWeek, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Tab } from '@headlessui/react';
import { useAppConfig } from '@/lib/context/AppConfigContext';
import { HexColorPicker } from 'react-colorful';
import { clsx } from 'clsx';
import TimeThresholdSlider from '@/components/TimeThresholdSlider';
import DaysSelector from '@/components/DaysSelector';
import { showLoading, hideLoading } from '@/components/LoadingScreen';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export default function UstawieniaPage() {
  const { config, updateTimeThresholds, updateDisplayedDays, reloadConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [timeThresholds, setTimeThresholds] = useState(config.timeThresholds);
  const [displayedDays, setDisplayedDays] = useState(config.displayedDays);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  
  // System powiadomień
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Inicjalizacja komponentu - ładowanie konfiguracji
  useEffect(() => {
    // Chwilowo pokazujemy ekran ładowania podczas inicjalizacji
    showLoading();
    
    // Zaktualizuj stany lokalne z konfiguracji
    setTimeThresholds(config.timeThresholds);
    setDisplayedDays(config.displayedDays);
    
    // Po krótkim opóźnieniu ukryjemy ekran ładowania
    setTimeout(() => {
      hideLoading();
    }, 500);
  }, [config]);

  // Funkcja do wyświetlania powiadomień
  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Automatyczne usuwanie powiadomienia po 3 sekundach
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Funkcja zapisująca zmiany w progach czasowych
  const saveTimeThresholds = async () => {
    try {
      // Pokaż ekran ładowania podczas zapisywania
      showLoading();
      
      const success = await updateTimeThresholds(timeThresholds);
      
      // Ukryj ekran ładowania
      hideLoading();
      
      if (success) {
        showToast('Progi czasowe zostały zapisane', 'success');
      } else {
        showToast('Wystąpił błąd podczas zapisywania progów czasowych', 'error');
      }
    } catch (error) {
      hideLoading();
      showToast('Wystąpił błąd podczas zapisywania progów czasowych', 'error');
      console.error('Error saving time thresholds:', error);
    }
  };

  // Funkcja zapisująca zmiany w wyświetlanych dniach
  const saveDisplayedDays = async () => {
    try {
      // Pokaż ekran ładowania podczas zapisywania
      showLoading();
      
      const success = await updateDisplayedDays(displayedDays);
      
      // Ukryj ekran ładowania
      hideLoading();
      
      if (success) {
        showToast('Ustawienia dni zostały zapisane', 'success');
      } else {
        showToast('Wystąpił błąd podczas zapisywania ustawień dni', 'error');
      }
    } catch (error) {
      hideLoading();
      showToast('Wystąpił błąd podczas zapisywania ustawień dni', 'error');
      console.error('Error saving displayed days:', error);
    }
  };

  // Funkcja aktualizująca próg czasowy
  const updateThreshold = (index: number, field: keyof typeof timeThresholds[0], value: any) => {
    const newThresholds = [...timeThresholds];
    newThresholds[index] = { ...newThresholds[index], [field]: value };
    setTimeThresholds(newThresholds);
  };

  // Funkcja aktualizująca wyświetlane dni
  const toggleDisplayedDay = (day: number) => {
    if (displayedDays.includes(day)) {
      // Usuń dzień, jeśli już jest wybrany (sprawdź czy to nie jest ostatni dzień)
      if (displayedDays.length > 1) {
        setDisplayedDays(displayedDays.filter(d => d !== day));
      }
    } else {
      // Dodaj dzień, jeśli nie jest wybrany
      setDisplayedDays([...displayedDays, day].sort());
    }
  };

  // Funkcja do ponownego ładowania konfiguracji z serwera
  const handleReloadConfig = async () => {
    try {
      // Pokaż ekran ładowania
      showLoading();
      
      await reloadConfig();
      
      // Ukryj ekran ładowania
      hideLoading();
      
      showToast('Konfiguracja została ponownie załadowana', 'success');
    } catch (error) {
      hideLoading();
      showToast('Wystąpił błąd podczas ponownego ładowania konfiguracji', 'error');
      console.error('Error reloading config:', error);
    }
  };

  const tabs = [
    { name: 'Ogólne', icon: FaUserCog },
    { name: 'Użytkownicy', icon: FaUsers },
    { name: 'Działy', icon: FaBuilding },
    { name: 'Klienci', icon: FaStore },
  ];

  // Mapowanie dni tygodnia
  const weekDays = [
    { id: 1, name: 'Poniedziałek' },
    { id: 2, name: 'Wtorek' },
    { id: 3, name: 'Środa' },
    { id: 4, name: 'Czwartek' },
    { id: 5, name: 'Piątek' },
    { id: 6, name: 'Sobota' },
    { id: 7, name: 'Niedziela' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>

      {/* System powiadomień */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={classNames(
              "px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center",
              toast.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'
            )}
          >
            <div className="mr-3">
              {toast.type === 'success' ? (
                <FaCheck className="text-green-500" />
              ) : (
                <FaExclamationTriangle className="text-red-500" />
              )}
            </div>
            <p className={toast.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {toast.message}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }: { selected: boolean }) =>
                  classNames(
                    'px-4 py-2 text-sm font-medium border-b-2 focus:outline-none',
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                <div className="flex items-center">
                  <tab.icon className="mr-2" />
                  {tab.name}
                </div>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {/* Panel ustawień ogólnych */}
            <Tab.Panel className="p-6">
              <div className="space-y-8 max-w-[1000px] mx-auto">
                {/* Układ pionowy dla ustawień */}
                <div className="space-y-8">
                  {/* Informacje o konfiguracji */}
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-gray-500">
                      Wersja konfiguracji: {config.version || 'nieznana'}
                    </p>
                    <button
                      type="button"
                      onClick={handleReloadConfig}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      Odśwież
                    </button>
                  </div>

                  {/* Progi czasowe */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FaClock className="mr-2 text-blue-500" />
                      Progi czasowe
                    </h3>
                    
                    <div className="mt-4 border p-4 pt-[25px] pb-[25px] rounded-md bg-white shadow-sm">
                      <TimeThresholdSlider 
                        thresholds={timeThresholds}
                        onChange={setTimeThresholds}
                        min={0}
                        max={12}
                        step={0.5}
                      />
                    </div>
                    
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={saveTimeThresholds}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        Zapisz progi czasowe
                      </button>
                    </div>
                  </div>
                  
                  {/* Wybór dni tygodnia */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FaCalendarWeek className="mr-2 text-blue-500" />
                      Dni tygodnia
                    </h3>
                    
                    <div className="mt-4 border p-4 pt-[25px] pb-[25px] rounded-md bg-white shadow-sm relative">
                      <DaysSelector 
                        selectedDays={displayedDays} 
                        onChange={setDisplayedDays} 
                      />
                      <div className="instruction-text">
                        Kliknij dzień, aby włączyć lub wyłączyć jego wyświetlanie w harmonogramie.
                      </div>
                    </div>
                    
                    <style jsx>{`
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
                    
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={saveDisplayedDays}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        Zapisz wybrane dni
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Panel zarządzania użytkownikami */}
            <Tab.Panel className="p-6">
              <div className="text-center py-10 text-gray-500">
                Funkcjonalność zarządzania użytkownikami w trakcie implementacji
              </div>
            </Tab.Panel>

            {/* Panel zarządzania działami */}
            <Tab.Panel className="p-6">
              <div className="text-center py-10 text-gray-500">
                Funkcjonalność zarządzania działami w trakcie implementacji
              </div>
            </Tab.Panel>

            {/* Panel zarządzania klientami */}
            <Tab.Panel className="p-6">
              <div className="text-center py-10 text-gray-500">
                Funkcjonalność zarządzania klientami w trakcie implementacji
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 