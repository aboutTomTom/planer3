'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaClock, FaSave, FaListUl, FaRegCheckSquare, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import FilteredDropdown from '@/components/FilteredDropdown';
import { use } from 'react';

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

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: string | number;
  estimatedTime: number;
  brandId: number;
  brand: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    };
  };
  createdById: number;
  assignedToId?: number;
  expiryDate?: string;
  notes?: string;
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

export default function EdytujZadaniePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Rozwiązanie parametrów zgodnie z nowym API Next.js
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const taskId = parseInt(resolvedParams.id);
  
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('');
  const [showTimeWheel, setShowTimeWheel] = useState(false);
  const [isRichEditorActive, setIsRichEditorActive] = useState(false);

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

  // Ładowanie danych zadania i list pomocniczych
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Równoległe pobieranie danych
        const [taskResponse, clientsResponse, brandsResponse, usersResponse] = await Promise.all([
          fetch(`/api/tasks/${taskId}`),
          fetch('/api/clients'),
          fetch('/api/brands'),
          fetch('/api/users'),
        ]);

        if (!taskResponse.ok) {
          throw new Error('Nie znaleziono zadania');
        }

        const task = await taskResponse.json();
        const clientsData = await clientsResponse.json();
        const brandsData = await brandsResponse.json();
        const usersData = await usersResponse.json();

        setClients(clientsData);
        setBrands(brandsData);
        setUsers(usersData);

        // Ustawienie danych formularza na podstawie pobranego zadania
        setFormData({
          title: task.title,
          startDate: format(new Date(), 'yyyy-MM-dd'), // Data początkowa nie jest przechowywana w zadaniu
          endDate: task.expiryDate ? format(new Date(task.expiryDate), 'yyyy-MM-dd') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          clientId: task.brand.client.id,
          brandId: task.brandId,
          createdById: task.createdById,
          assignedToId: task.assignedToId || null,
          estimatedTime: task.estimatedTime,
          priority: task.priority.toString(),
          notes: task.notes || '',
        });
      } catch (error) {
        console.error('Błąd podczas ładowania danych:', error);
        router.push('/zadania');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId, router]);

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
    } else {
      setFormData({
        ...formData,
        [name]: value,
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
      
      setFormData({
        ...formData,
        notes: newValue,
      });
      
      // Przywrócenie fokusa i ustawienie kursora
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formattedText.length,
          start + formattedText.length
        );
      }, 10);
    }
  };

  // Zapisanie zadania
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      // Jeśli brakuje wymaganych pól, nie wysyłaj formularza
      if (!formData.title || !formData.brandId || !formData.estimatedTime) {
        alert('Wypełnij wszystkie wymagane pola');
        return;
      }
      
      const taskData = {
        title: formData.title,
        brandId: formData.brandId,
        priority: formData.priority,
        estimatedTime: formData.estimatedTime,
        createdById: formData.createdById || 1, // Domyślny użytkownik jeśli nie wybrano
        assignedToId: formData.assignedToId,
        expiryDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        notes: formData.notes,
      };
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error('Błąd podczas aktualizacji zadania');
      }
      
      router.push('/zadania');
    } catch (error) {
      console.error('Błąd:', error);
      alert('Wystąpił błąd podczas aktualizacji zadania');
    }
  };

  // Usunięcie zadania
  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Błąd podczas usuwania zadania');
      }
      
      router.push('/zadania');
    } catch (error) {
      console.error('Błąd:', error);
      alert('Wystąpił błąd podczas usuwania zadania');
    }
  };

  // Filtrowane listy do wyboru
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner-border text-blue-500 mb-3" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-gray-600">Ładowanie danych zadania...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/zadania" className="text-blue-600 hover:text-blue-800 mr-4">
            <FaArrowLeft className="text-lg" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edycja zadania #{taskId}</h1>
        </div>
        <button
          type="button"
          className="text-red-600 hover:text-red-800 flex items-center"
          onClick={handleDelete}
        >
          <FaTrash className="mr-1" /> Usuń
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tytuł zadania */}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Przedział dat */}
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

        {/* Klient i marka */}
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
                  brandId: null // Resetujemy markę przy zmianie klienta
                });
              }}
              placeholder="Wybierz klienta"
              searchPlaceholder="Szukaj klienta..."
              emptyOption={false}
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
            />
          </div>
        </div>

        {/* Account i Leader */}
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

        {/* Priorytet i czas */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            {/* Wizualne wybieranie czasu */}
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

        {/* ID zadania (informacyjne) */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            ID zadania: <span className="font-medium">{taskId}</span>
          </label>
        </div>

        {/* Notatki z formatowaniem */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notatki
            </label>
            <div className="flex space-x-2">
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
              onFocus={() => setIsRichEditorActive(true)}
              onBlur={() => setIsRichEditorActive(false)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wpisz notatki. Możesz użyć przycisków powyżej, aby dodać formatowanie."
            ></textarea>
            {isRichEditorActive && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                Używaj markdown: [tekst](url) dla linków, - dla list, 1. dla numeracji
              </div>
            )}
          </div>
        </div>

        {/* Przyciski */}
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
            <FaSave className="mr-2" /> Zapisz zmiany
          </button>
        </div>
      </form>
    </div>
  );
} 