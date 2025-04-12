'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaClock, FaSave, FaListUl, FaRegCheckSquare } from 'react-icons/fa';
import { format } from 'date-fns';
import FilteredDropdown from '@/components/FilteredDropdown';

interface Client {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
  clientId: number;
}

interface User {
  id: number;
  name: string;
  departmentId?: number;
}

interface TaskFormData {
  title: string;
  startDate: string;
  endDate: string;
  clientId: number | null;
  brandId: number | null;
  createdById: number | null;
  assignedToId: number | null;
  estimatedTime: number;
  priority: string;
  notes: string;
}

export default function NoweZadaniePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('');
  const [showTimeWheel, setShowTimeWheel] = useState(false);
  const [isRichEditorActive, setIsRichEditorActive] = useState(false);
  const [notesHistory, setNotesHistory] = useState<string[]>(['']);
  const [notesHistoryIndex, setNotesHistoryIndex] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: boolean;
    clientId?: boolean;
    brandId?: boolean;
    createdById?: boolean;
    estimatedTime?: boolean;
  }>({});

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    clientId: null,
    brandId: null,
    createdById: null,
    assignedToId: null,
    estimatedTime: 1,
    priority: 'MEDIUM',
    notes: '',
  });

  // Ładowanie danych
  useEffect(() => {
    // Ładowanie klientów
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error('Błąd pobierania klientów:', err));
    
    // Ładowanie marek
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error('Błąd pobierania marek:', err));
    
    // Ładowanie użytkowników
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Błąd pobierania użytkowników:', err));
  }, []);

  // Filtrowanie marek po wyborze klienta
  useEffect(() => {
    if (formData.clientId) {
      setFilteredBrands(brands.filter(brand => brand.clientId === formData.clientId));
    } else {
      setFilteredBrands(brands);
    }
  }, [formData.clientId, brands]);

  // Obsługa zmian w formularzu
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'clientId') {
      setFormData({
        ...formData,
        clientId: value ? parseInt(value) : null,
        brandId: null,  // Reset brandId when client changes
      });
    } else if (name === 'brandId' || name === 'createdById' || name === 'assignedToId') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : null,
      });
    } else if (name === 'estimatedTime') {
      setFormData({
        ...formData,
        estimatedTime: parseFloat(value),
      });
    } else if (name === 'notes') {
      if (value !== notesHistory[notesHistoryIndex]) {
        const newHistory = [...notesHistory.slice(0, notesHistoryIndex + 1), value];
        setNotesHistory(newHistory);
        setNotesHistoryIndex(newHistory.length - 1);
      }
      
      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Funkcja Undo dla notatek
  const handleUndo = () => {
    if (notesHistoryIndex > 0) {
      const newIndex = notesHistoryIndex - 1;
      setNotesHistoryIndex(newIndex);
      setFormData({
        ...formData,
        notes: notesHistory[newIndex]
      });
    }
  };

  // Funkcja Redo dla notatek
  const handleRedo = () => {
    if (notesHistoryIndex < notesHistory.length - 1) {
      const newIndex = notesHistoryIndex + 1;
      setNotesHistoryIndex(newIndex);
      setFormData({
        ...formData,
        notes: notesHistory[newIndex]
      });
    }
  };

  // Zmiana czasu przez koło czasu
  const handleTimeWheel = (hours: number) => {
    setFormData({
      ...formData,
      estimatedTime: hours,
    });
    setShowTimeWheel(false);
  };

  // Dodanie formatowania do notatek
  const addFormattingToNotes = (type: string) => {
    const textarea = document.getElementById('notes') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';

    switch (type) {
      case 'link':
        const url = prompt('Podaj adres URL:', 'https://');
        if (url) {
          formattedText = `[${selectedText || 'link'}](${url})`;
        }
        break;
      case 'list':
        formattedText = selectedText
          .split('\n')
          .map(line => (line.trim() ? `- ${line}` : line))
          .join('\n');
        break;
      case 'numbered':
        formattedText = selectedText
          .split('\n')
          .map((line, i) => (line.trim() ? `${i + 1}. ${line}` : line))
          .join('\n');
        break;
      case 'todo':
        formattedText = selectedText
          .split('\n')
          .map(line => (line.trim() ? `[ ] ${line}` : line))
          .join('\n');
        break;
      default:
        return;
    }

    if (formattedText) {
      const newValue =
        textarea.value.substring(0, start) + 
        formattedText + 
        textarea.value.substring(end);
      
      const newHistory = [...notesHistory.slice(0, notesHistoryIndex + 1), newValue];
      setNotesHistory(newHistory);
      setNotesHistoryIndex(newHistory.length - 1);
      
      setFormData({
        ...formData,
        notes: newValue,
      });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formattedText.length,
          start + formattedText.length
        );
      }, 10);
    }
  };

  // Obsługa skrótów klawiszowych dla undo/redo
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  // Zapisanie zadania
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setApiError(null);
      
      const errors = {
        title: !formData.title,
        clientId: !formData.clientId,
        brandId: !formData.brandId,
        createdById: !formData.createdById,
        estimatedTime: !formData.estimatedTime
      };
      
      const hasErrors = Object.values(errors).some(Boolean);
      setFormErrors(errors);
      
      if (hasErrors) {
        const firstErrorId = Object.entries(errors)
          .find(([_, hasError]) => hasError)?.[0];
        
        if (firstErrorId) {
          const element = document.getElementById(firstErrorId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }
      
      const taskData = {
        ...formData,
        priority: formData.priority || 'MEDIUM'
      };
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Błąd podczas zapisywania zadania');
      }
      
      router.push('/zadania');
    } catch (error) {
      console.error('Błąd:', error);
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania zadania';
      setApiError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredClients = clientFilter
    ? clients.filter(client => 
        client.name.toLowerCase().includes(clientFilter.toLowerCase()))
    : clients;

  const displayBrands = brandFilter
    ? filteredBrands.filter(brand => 
        brand.name.toLowerCase().includes(brandFilter.toLowerCase()))
    : filteredBrands;

  const filteredAccounts = accountFilter
    ? users.filter(user => 
        user.name.toLowerCase().includes(accountFilter.toLowerCase()))
    : users;

  const filteredLeaders = leaderFilter
    ? users.filter(user => 
        user.name.toLowerCase().includes(leaderFilter.toLowerCase()))
    : users;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/zadania" className="text-blue-600 hover:text-blue-800 mr-4">
            <FaArrowLeft className="text-lg" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Nowe zadanie</h1>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{apiError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tytuł zadania <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formErrors.title && (
            <div className="text-red-500 text-xs mt-1">To pole jest wymagane</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data rozpoczęcia
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data zakończenia
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Klient <span className="text-red-500">*</span>
            </label>
            <FilteredDropdown
              items={clients.map(client => ({ id: client.id, name: client.name }))}
              value={formData.clientId}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  clientId: value as number | null,
                  brandId: null
                });
              }}
              placeholder="Wybierz klienta"
              searchPlaceholder="Szukaj klienta..."
              emptyOption={false}
              isError={formErrors.clientId}
              required={true}
            />
          </div>
          <div>
            <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
              Marka <span className="text-red-500">*</span>
            </label>
            <FilteredDropdown
              items={filteredBrands.map(brand => ({ id: brand.id, name: brand.name }))}
              value={formData.brandId}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  brandId: value as number | null
                });
              }}
              placeholder="Wybierz markę"
              searchPlaceholder="Szukaj marki..."
              emptyOption={false}
              disabled={!formData.clientId}
              isError={formErrors.brandId}
              required={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="createdById" className="block text-sm font-medium text-gray-700 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <FilteredDropdown
              items={users.map(user => ({ id: user.id, name: user.name }))}
              value={formData.createdById}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  createdById: value as number | null
                });
              }}
              placeholder="Wybierz account"
              searchPlaceholder="Szukaj account..."
              emptyOption={false}
              isError={formErrors.createdById}
              required={true}
            />
          </div>
          <div>
            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
              Leader
            </label>
            <FilteredDropdown
              items={users.map(user => ({ id: user.id, name: user.name }))}
              value={formData.assignedToId}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  assignedToId: value as number | null
                });
              }}
              placeholder="Wybierz leadera"
              searchPlaceholder="Szukaj leadera..."
              emptyOptionLabel="Brak przypisania"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priorytet
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Niski</option>
              <option value="MEDIUM">Średni</option>
              <option value="HIGH">Wysoki</option>
            </select>
          </div>
          <div>
            <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-1">
              Szacowany czas (h) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="estimatedTime"
                name="estimatedTime"
                min="0.5"
                step="0.5"
                value={formData.estimatedTime}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.estimatedTime ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                }`}
                required
              />
              <button
                type="button"
                className="ml-2 text-blue-600 hover:text-blue-800"
                onClick={() => setShowTimeWheel(!showTimeWheel)}
              >
                <FaClock className="text-xl" />
              </button>
            </div>
            {formErrors.estimatedTime && (
              <div className="text-red-500 text-xs mt-1">To pole jest wymagane</div>
            )}
            
            {showTimeWheel && (
              <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="grid grid-cols-5 gap-2">
                  {[0.5, 1, 2, 3, 4, 5, 6, 7, 8, 10].map(time => (
                    <button
                      key={time}
                      type="button"
                      className={`p-2 rounded-md ${
                        formData.estimatedTime === time
                          ? 'bg-blue-500 text-white'
                          : 'bg-white hover:bg-blue-100'
                      }`}
                      onClick={() => handleTimeWheel(time)}
                    >
                      {time}h
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            ID zadania: <span className="font-medium">Zostanie nadane automatycznie</span>
          </label>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notatki
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                className={`text-gray-600 hover:text-blue-600 text-sm p-1 ${notesHistoryIndex > 0 ? '' : 'opacity-50 cursor-not-allowed'}`}
                onClick={handleUndo}
                disabled={notesHistoryIndex === 0}
                title="Cofnij (Ctrl+Z)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 14L4 9l5-5" />
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                </svg>
              </button>
              <button
                type="button"
                className={`text-gray-600 hover:text-blue-600 text-sm p-1 ${notesHistoryIndex < notesHistory.length - 1 ? '' : 'opacity-50 cursor-not-allowed'}`}
                onClick={handleRedo}
                disabled={notesHistoryIndex === notesHistory.length - 1}
                title="Ponów (Ctrl+Y)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 14l5-5-5-5" />
                  <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
                </svg>
              </button>
              <button
                type="button"
                className="text-gray-600 hover:text-blue-600 text-sm p-1"
                onClick={() => addFormattingToNotes('link')}
                title="Dodaj link"
              >
                🔗
              </button>
              <button
                type="button"
                className="text-gray-600 hover:text-blue-600 text-sm p-1"
                onClick={() => addFormattingToNotes('list')}
                title="Lista punktowana"
              >
                <FaListUl />
              </button>
              <button
                type="button"
                className="text-gray-600 hover:text-blue-600 text-sm p-1"
                onClick={() => addFormattingToNotes('numbered')}
                title="Lista numerowana"
              >
                1.
              </button>
              <button
                type="button"
                className="text-gray-600 hover:text-blue-600 text-sm p-1"
                onClick={() => addFormattingToNotes('todo')}
                title="Lista zadań"
              >
                <FaRegCheckSquare />
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              onKeyDown={handleNotesKeyDown}
              onFocus={() => setIsRichEditorActive(true)}
              onBlur={() => setIsRichEditorActive(false)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wpisz notatki. Możesz użyć przycisków powyżej, aby dodać formatowanie. Ctrl+Z cofnie ostatnią operację."
            ></textarea>
            {isRichEditorActive && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                Używaj markdown: [tekst](url) dla linków, - dla list, 1. dla numeracji, Ctrl+Z aby cofnąć
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Link
            href="/zadania"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Anuluj
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaSave className="mr-2" /> Zapisz zadanie
          </button>
        </div>
      </form>
    </div>
  );
} 