'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaSortAmountDown, FaPen, FaTrash } from 'react-icons/fa';
import Link from 'next/link';

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: number;
  estimatedTime: number;
  brand: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    };
  };
  assignedTo?: {
    id: number;
    name: string;
  };
  expiryDate?: string;
}

export default function ZadaniaPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    clientId: '',
    brandId: '',
    assignedToId: '',
  });

  // Pobieranie zadań
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // W prawdziwej aplikacji pobieralibyśmy dane z API
        const response = await fetch('/api/tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Błąd podczas pobierania zadań:', error);
        // Tymczasowe dane dla prezentacji
        setTasks([
          {
            id: 1,
            title: 'Kampania reklamowa w mediach społecznościowych',
            description: 'Przygotowanie kampanii w mediach społecznościowych dla marki XYZ.',
            priority: 1,
            estimatedTime: 5,
            brand: {
              id: 1,
              name: 'TechNova Cloud',
              client: {
                id: 1,
                name: 'TechNova',
              },
            },
            assignedTo: {
              id: 2,
              name: 'Anna Nowak',
            },
            expiryDate: '2025-05-15',
          },
          {
            id: 2,
            title: 'Projekt strony internetowej',
            description: 'Zaprojektowanie nowej strony internetowej dla klienta.',
            priority: 2,
            estimatedTime: 8,
            brand: {
              id: 2,
              name: 'ACME Pro',
              client: {
                id: 2,
                name: 'ACME Corp',
              },
            },
            expiryDate: '2025-05-20',
          },
          {
            id: 3,
            title: 'Analiza konkurencji',
            description: 'Przeprowadzenie analizy konkurencji na rynku.',
            priority: 3,
            estimatedTime: 4,
            brand: {
              id: 3,
              name: 'EcoHome',
              client: {
                id: 3,
                name: 'EcoSolutions',
              },
            },
            assignedTo: {
              id: 3,
              name: 'Piotr Wiśniewski',
            },
            expiryDate: '2025-05-10',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Obsługa filtrowania zadań
  const filteredTasks = tasks.filter((task) => {
    // Filtrowanie po wyszukiwaniu
    const matchesSearch = searchQuery
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        task.brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.brand.client.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Filtrowanie po kryteriach
    const matchesPriority = filters.priority ? task.priority === parseInt(filters.priority) : true;
    const matchesClient = filters.clientId ? task.brand.client.id === parseInt(filters.clientId) : true;
    const matchesBrand = filters.brandId ? task.brand.id === parseInt(filters.brandId) : true;
    const matchesAssignee = filters.assignedToId
      ? task.assignedTo && task.assignedTo.id === parseInt(filters.assignedToId)
      : true;

    return matchesSearch && matchesPriority && matchesClient && matchesBrand && matchesAssignee;
  });

  // Funkcja zwracająca kolor dla priorytetu
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'text-red-600 bg-red-50';
      case 2:
        return 'text-yellow-600 bg-yellow-50';
      case 3:
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek z wyszukiwaniem i filtrowaniem */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Zadania</h1>

        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Szukaj zadań..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="mr-2 text-gray-500" />
            Filtry
          </button>

          <Link
            href="/zadania/nowe"
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <FaPlus className="mr-2" />
            Nowe zadanie
          </Link>
        </div>
      </div>

      {/* Panel filtrów */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priorytet
              </label>
              <select
                id="priority"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">Wszystkie</option>
                <option value="1">Wysoki</option>
                <option value="2">Średni</option>
                <option value="3">Niski</option>
              </select>
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Klient
              </label>
              <select
                id="clientId"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.clientId}
                onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              >
                <option value="">Wszyscy</option>
                <option value="1">TechNova</option>
                <option value="2">ACME Corp</option>
                <option value="3">EcoSolutions</option>
              </select>
            </div>

            <div>
              <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
                Marka
              </label>
              <select
                id="brandId"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.brandId}
                onChange={(e) => setFilters({ ...filters, brandId: e.target.value })}
              >
                <option value="">Wszystkie</option>
                <option value="1">TechNova Cloud</option>
                <option value="2">ACME Pro</option>
                <option value="3">EcoHome</option>
              </select>
            </div>

            <div>
              <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
                Przypisane do
              </label>
              <select
                id="assignedToId"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.assignedToId}
                onChange={(e) => setFilters({ ...filters, assignedToId: e.target.value })}
              >
                <option value="">Wszyscy</option>
                <option value="2">Anna Nowak</option>
                <option value="3">Piotr Wiśniewski</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabela zadań */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Zadanie
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Klient/Marka
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Priorytet
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Czas
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Przypisane do
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Termin
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  Ładowanie zadań...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  Brak zadań spełniających kryteria wyszukiwania
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{task.brand.client.name}</div>
                    <div className="text-xs text-gray-500">{task.brand.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority === 1
                        ? 'Wysoki'
                        : task.priority === 2
                        ? 'Średni'
                        : 'Niski'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.estimatedTime}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.assignedTo ? task.assignedTo.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.expiryDate
                      ? new Date(task.expiryDate).toLocaleDateString('pl-PL')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/zadania/${task.id}/edycja`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FaPen className="inline-block" />
                    </Link>
                    <button
                      onClick={() => {
                        // Tutaj dodaj logikę usuwania zadania
                        if (confirm(`Czy na pewno chcesz usunąć zadanie "${task.title}"?`)) {
                          // Symulacja usunięcia (w rzeczywistej aplikacji byłoby żądanie API)
                          setTasks(prev => prev.filter(t => t.id !== task.id));
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 