'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { FaArrowLeft, FaArrowRight, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { useAppConfig } from '@/lib/context/AppConfigContext';
import { useLoading } from '@/lib/context/LoadingContext';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import './harmonogram.css';
import Link from 'next/link';

// Interfejs dla zadania
interface Task {
  id: number;
  title: string;
  priority: string | number;
  estimatedTime: number;
  brand: {
    id: number;
    name: string;
  };
  assignedToId?: number;
  expiryDate?: string;
}

// Interfejs dla bloku harmonogramu
interface HarmonogramBlock {
  id: number;
  taskId: number;
  userId: number;
  date: string;
  allocatedTime: number;
  task: Task;
}

// Interfejs dla użytkownika
interface User {
  id: number;
  name: string;
  departmentId?: number;
}

// Funkcja do określania klasy koloru na podstawie priorytetu
const getPriorityColor = (priority: string | number): string => {
  if (typeof priority === 'number') {
    switch (priority) {
      case 1:
        return 'border-red-500';
      case 2:
        return 'border-yellow-500';
      case 3:
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  } else {
    switch (priority) {
      case 'HIGH':
        return 'border-red-500';
      case 'MEDIUM':
        return 'border-yellow-500';
      case 'LOW':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  }
};

// Komponent dla zadania, które może być przeciągane
const DraggableTaskItem = ({ task, id, type }: { task: Task; id: number; type: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      type,
      task
    }
  });

  const priorityColor = getPriorityColor(task.priority);
  
  // Zapobieganie zaznaczaniu tekstu podczas próby przeciągania
  const preventTextSelection = (e: React.MouseEvent) => {
    // Jeśli nie jest to kliknięcie lewym przyciskiem, pozwól na normalne działanie
    if (e.button !== 0) return;
    
    // Zapobiegaj domyślnemu zachowaniu tylko dla lewego przycisku myszy
    e.preventDefault();
    
    // Pozbądź się fokusu z aktywnego elementu
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };
  
  // Obsługa podwójnego kliknięcia - usunięcie zadania z komórki
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'assignedTask') {
      // Wykonaj żądanie usunięcia przypisania
      fetch(`/api/harmonogram/${id}`, {
        method: 'DELETE'
      })
      .then(response => {
        if (response.ok) {
          // Wywołaj niestandardowe zdarzenie zadanie zostało usunięte
          const event = new CustomEvent('taskUnassigned', { 
            detail: { taskId: task.id, blockId: id }
          });
          window.dispatchEvent(event);
          document.dispatchEvent(event);
        }
      })
      .catch(error => {
        console.error('Błąd podczas usuwania przypisania:', error);
      });
    }
  };
  
  // Obsługa kliknięcia prawym przyciskiem - szybka edycja
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Zapobieganie wyświetleniu menu kontekstowego przeglądarki
    
    // Wywołujemy niestandardowe zdarzenie do obsługi przez komponent nadrzędny
    const event = new CustomEvent('taskQuickEdit', { 
      detail: { task, blockId: id, type }
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  };
  
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-1.5 rounded-md bg-white border draggable-item draggable-transition ${priorityColor} ${isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'}`}
      style={{ touchAction: 'none' }}
      onMouseDown={preventTextSelection}
      data-draggable="true"
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="font-medium text-xs">{task.title}</div>
      <div className="flex justify-between text-xs mt-0.5">
        <span className="text-xs text-gray-500">{task.brand.name}</span>
        <span className="font-medium text-xs">{task.estimatedTime}h</span>
      </div>
    </div>
  );
};

// Komponent dla komórki, która może przyjmować upuszczone zadania
const DroppableCell = ({ 
  children, 
  id, 
  userId, 
  date,
  isOver = false,
  totalTime = 0,
  thresholdClass = '' // Zostawiamy parametr dla kolorystyki licznika czasu
}: { 
  children: React.ReactNode; 
  id: string; 
  userId: number; 
  date: string;
  isOver?: boolean;
  totalTime?: number;
  thresholdClass?: string;
}) => {
  const { setNodeRef, isOver: cellIsOver } = useDroppable({
    id,
    data: {
      type: 'cell',
      userId,
      date
    }
  });
  
  const isHighlighted = cellIsOver || isOver;
  
  // Określenie klasy koloru tła dla licznika czasu
  let timeCounterClass = 'bg-gray-200';
  if (thresholdClass === 'green-500') {
    timeCounterClass = 'bg-green-500';
  } else if (thresholdClass === 'yellow-500') {
    timeCounterClass = 'bg-yellow-500';
  } else if (thresholdClass === 'orange-500') {
    timeCounterClass = 'bg-orange-500';
  } else if (thresholdClass === 'red-500') {
    timeCounterClass = 'bg-red-500';
  }
  
  return (
    <div 
      ref={setNodeRef} 
      className={`min-h-16 relative p-0.5 transition-all duration-200 ease-in-out
        ${isHighlighted 
          ? 'bg-blue-50 ring-1 ring-blue-300 shadow-inner' 
          : 'hover:bg-gray-50'}`}
    >
      {totalTime > 0 && (
        <div className={`schedule-cell-time z-10 text-white px-1 rounded-sm shadow-md absolute -top-3 -right-1 ${timeCounterClass}`}>
          {totalTime}h
        </div>
      )}
      {children}
    </div>
  );
};

// Komponenty docelowego panelu dla nieprzypisanych zadań
const UnassignedDroppablePanel = ({
  children
}: {
  children: React.ReactNode
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-panel',
    data: { type: 'unassignedPanel' }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto p-2 
        border border-dashed rounded-md transition-all duration-200
        ${isOver ? 'border-primary-color bg-blue-50' : 'border-gray-200'}`}
      style={{ 
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db transparent'
      }}
    >
      {children}
    </div>
  );
};

export default function HarmonogramPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const { config } = useAppConfig();
  const { setLoading } = useLoading();
  const { displayedDays } = config;
  
  // Stany dla drag & drop
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Definiujemy sensory dla drag & drop z poprawioną konfiguracją
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 3, // Mniejszy dystans aktywacji
        tolerance: 8, // Większa tolerancja
        delay: 0 // Brak opóźnienia
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Funkcje do nawigacji tygodniami
  const previousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const toggleWeekPicker = () => setIsWeekPickerOpen(!isWeekPickerOpen);
  
  // Funkcja do wyboru tygodnia z kalendarza
  const selectWeek = (date: Date) => {
    setCurrentWeek(date);
    setIsWeekPickerOpen(false);
  };

  // Funkcja znajdująca początek tygodnia (poniedziałek)
  const getWeekStart = (date: Date) => {
    return startOfWeek(date, { weekStartsOn: 1 });
  };

  // Funkcja do uzyskania numeru tygodnia
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Przygotowanie dni tygodnia - używamy useMemo, aby uniknąć niepotrzebnych przeliczeń
  const weekStart = useMemo(() => getWeekStart(currentWeek), [currentWeek]);
  const weekNumber = useMemo(() => getWeekNumber(currentWeek), [currentWeek]);
  const weekDays = useMemo(() => {
    return displayedDays.map(dayNumber => {
      // dayNumber to 1-7 (poniedziałek-niedziela)
      const date = addDays(weekStart, dayNumber - 1);
      return {
        date,
        name: format(date, 'EEEE', { locale: pl }),
        shortName: format(date, 'EEE', { locale: pl }),
        dayOfMonth: format(date, 'd', { locale: pl }),
        isToday: isToday(date),
      };
    });
  }, [displayedDays, weekStart]);

  // Dane z API
  const [taskBlocks, setTaskBlocks] = useState<HarmonogramBlock[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{id: number, name: string, color: string}[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stan dla szybkiej edycji zadania
  const [quickEditTask, setQuickEditTask] = useState<{
    task: Task | null;
    blockId?: number;
    type?: string;
  } | null>(null);

  // Pobieranie danych
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoading(true); // Ustaw globalny stan ładowania
      
      try {
        // Pobieranie użytkowników
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Pobieranie działów
        const departmentsResponse = await fetch('/api/departments');
        let departmentsData = [];
        if (departmentsResponse.ok) {
          departmentsData = await departmentsResponse.json();
        }
        setDepartments(departmentsData);
        
        // Pobieranie bloków zadań
        const weekStartString = format(weekStart, 'yyyy-MM-dd');
        const blocksResponse = await fetch(`/api/harmonogram?week=${weekStartString}`);
        const blocksData = await blocksResponse.json();
        setTaskBlocks(blocksData);

        // Pobieranie nieprzypisanych zadań
        const tasksResponse = await fetch('/api/tasks?unassigned=true');
        const tasksData = await usersResponse.ok ? await tasksResponse.json() : [];
        setUnassignedTasks(tasksData);
      } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
        // Tymczasowe przykładowe dane
        setUsers([
          { id: 1, name: 'Jan Kowalski', departmentId: 1 },
          { id: 2, name: 'Anna Nowak', departmentId: 2 },
          { id: 3, name: 'Piotr Wiśniewski', departmentId: 3 },
        ]);
        
        setDepartments([
          { id: 1, name: 'Marketing', color: '#f0f8ff' },
          { id: 2, name: 'Grafika', color: '#fff0f5' },
          { id: 3, name: 'Programowanie', color: '#f5fffa' },
        ]);
        
        setTaskBlocks([]);
        
        setUnassignedTasks([
          { 
            id: 101, 
            title: 'Kampania reklamowa', 
            priority: 1, 
            estimatedTime: 6,
            brand: { id: 1, name: 'TechNova Cloud' }
          },
          { 
            id: 102, 
            title: 'Projekt strony', 
            priority: 2, 
            estimatedTime: 8,
            brand: { id: 2, name: 'ACME Pro' }
          },
          { 
            id: 103, 
            title: 'Analiza konkurencji', 
            priority: 3, 
            estimatedTime: 3.5,
            brand: { id: 3, name: 'EcoHome' }
          },
        ]);
      } finally {
        setIsLoading(false);
        setLoading(false); // Zakończ globalny stan ładowania
      }
    };
    
    fetchData();
  }, [currentWeek, weekStart, setLoading]);

  // Filtrowanie użytkowników wg działu
  const filteredUsers = useMemo(() => {
    if (!selectedDepartmentId && !selectedUserId) return users;
    if (selectedUserId) return users.filter(user => user.id === selectedUserId);
    return users.filter(user => user.departmentId === selectedDepartmentId);
  }, [users, selectedDepartmentId, selectedUserId]);

  // Filtrowanie nieprzypisanych zadań
  const filteredUnassignedTasks = unassignedTasks.filter(task => 
    searchQuery === '' || 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Resetowanie filtrów
  const resetFilters = () => {
    setSelectedDepartmentId(null);
    setSelectedUserId(null);
  };

  // Obsługa rozpoczęcia przeciągania
  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);

    // Pobierz dane przeciąganego elementu
    const dragType = active.data.current?.type;
    if (dragType === 'unassignedTask') {
      // Nieprzypisane zadanie z panelu bocznego
      const taskId = active.id;
      const task = unassignedTasks.find(t => t.id === taskId);
      if (task) {
        setActiveDragData({ type: 'unassignedTask', task });
      }
    } else if (dragType === 'assignedTask') {
      // Zadanie przypisane już do harmonogramu
      const blockId = active.id;
      const block = taskBlocks.find(b => b.id === blockId);
      if (block) {
        setActiveDragData({ type: 'assignedTask', block });
      }
    }
  };

  // Obsługa przeciągania zadań między dniami
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    // Jeśli brak celu upuszczenia, anuluj operację
    if (!over) {
      setActiveId(null);
      setActiveDragData(null);
      return;
    }
    
    if (over.data.current?.type === 'cell') {
      const { userId, date } = over.data.current;
      
      if (activeDragData?.type === 'unassignedTask') {
        // Przypisujemy nowe zadanie do komórki
        const task = activeDragData.task;
        
        try {
          // W rzeczywistej aplikacji, wysłalibyśmy to do API
          const response = await fetch('/api/harmonogram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: task.id,
              userId,
              date,
              allocatedTime: task.estimatedTime
            })
          });
          
          if (response.ok) {
            const newBlock = await response.json();
            // Zapewniamy, że zadanie jest dołączone do bloku
            const blockWithTask = { ...newBlock, task };
            setTaskBlocks(prev => [...prev, blockWithTask]);
            setUnassignedTasks(prev => prev.filter(t => t.id !== task.id));
          }
        } catch (error) {
          console.error('Błąd podczas przypisywania zadania:', error);
          // Symulacja sukcesu dla celów demonstracyjnych
          const newBlock = {
            id: Date.now(),
            taskId: task.id,
            userId,
            date,
            allocatedTime: task.estimatedTime,
            task
          };
          setTaskBlocks(prev => [...prev, newBlock]);
          setUnassignedTasks(prev => prev.filter(t => t.id !== task.id));
        }
      } else if (activeDragData?.type === 'assignedTask') {
        // Przesuwamy istniejące zadanie do innej komórki
        const block = activeDragData.block;
        
        // Jeśli to ta sama komórka, nie robimy nic
        if (block.userId === userId && block.date === date) {
          setActiveId(null);
          setActiveDragData(null);
          return;
        }
        
        try {
          // W rzeczywistej aplikacji, wysłalibyśmy to do API
          const response = await fetch(`/api/harmonogram/${block.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              date
            })
          });
          
          if (response.ok) {
            const updatedBlock = await response.json();
            setTaskBlocks(prev => prev.map(b => 
              b.id === block.id 
                ? { ...updatedBlock, task: block.task } 
                : b
            ));
          }
        } catch (error) {
          console.error('Błąd podczas przesuwania zadania:', error);
          // Symulacja sukcesu dla celów demonstracyjnych
          setTaskBlocks(prev => prev.map(b => 
            b.id === block.id 
              ? { ...block, userId, date } 
              : b
          ));
        }
      }
    } else if (over.data.current?.type === 'unassignedPanel' && activeDragData?.type === 'assignedTask') {
      // Przesunięcie zadania z powrotem do panelu nieprzypisanych
      const block = activeDragData.block;
      
      try {
        // W rzeczywistej aplikacji, wysłalibyśmy to do API
        const response = await fetch(`/api/harmonogram/${block.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setTaskBlocks(prev => prev.filter(b => b.id !== block.id));
          setUnassignedTasks(prev => [...prev, block.task]);
        }
      } catch (error) {
        console.error('Błąd podczas usuwania przypisania zadania:', error);
        // Symulacja sukcesu dla celów demonstracyjnych
        setTaskBlocks(prev => prev.filter(b => b.id !== block.id));
        setUnassignedTasks(prev => [...prev, block.task]);
      }
    }
    
    setActiveId(null);
    setActiveDragData(null);
  };

  // Komponent dla przeciąganego zadania
  const TaskDragItem = ({ task }: { task: Task }) => (
    <div 
      className={`p-1.5 rounded-md bg-white border shadow-sm draggable-item w-52 ${getPriorityColor(task.priority)}`}
      style={{ touchAction: 'none' }}
      data-draggable="true"
    >
      <div className="font-medium text-xs">{task.title}</div>
      <div className="flex justify-between text-xs mt-0.5">
        <span className="text-xs text-gray-500">{task.brand.name}</span>
        <span className="font-medium text-xs">{task.estimatedTime}h</span>
      </div>
    </div>
  );

  // Obsługa niestandardowych zdarzeń
  useEffect(() => {
    // Obsługa zdarzenia usunięcia zadania z komórki
    const handleTaskUnassigned = (event: CustomEvent) => {
      const { taskId, blockId } = event.detail;
      
      // Znajdź blok zadania, który został usunięty
      const removedBlock = taskBlocks.find(b => b.id === blockId);
      if (!removedBlock) return;
      
      // Usuń blok z listy przypisanych bloków
      setTaskBlocks(prev => prev.filter(b => b.id !== blockId));
      
      // Dodaj zadanie z powrotem do listy nieprzypisanych zadań
      const task = removedBlock.task;
      setUnassignedTasks(prev => [...prev, task]);
    };
    
    // Obsługa zdarzenia szybkiej edycji
    const handleTaskQuickEdit = (event: CustomEvent) => {
      const { task, blockId, type } = event.detail;
      setQuickEditTask({ task, blockId, type });
    };
    
    // Rejestracja nasłuchiwaczy zdarzeń
    window.addEventListener('taskUnassigned', handleTaskUnassigned as EventListener);
    window.addEventListener('taskQuickEdit', handleTaskQuickEdit as EventListener);
    
    // Czyszczenie nasłuchiwaczy zdarzeń
    return () => {
      window.removeEventListener('taskUnassigned', handleTaskUnassigned as EventListener);
      window.removeEventListener('taskQuickEdit', handleTaskQuickEdit as EventListener);
    };
  }, [taskBlocks]);

  // Obsługa zamknięcia edytora zadania
  const handleCloseTaskEditor = () => {
    setQuickEditTask(null);
  };

  // Obsługa zapisania zmian w zadaniu
  const handleSaveTask = (updatedTask: Task) => {
    // Symulacja zapisania zmian (w rzeczywistej aplikacji wysyłamy do API)
    if (quickEditTask?.type === 'assignedTask' && quickEditTask.blockId) {
      // Aktualizacja przypisanego zadania
      setTaskBlocks(prev => prev.map(block => 
        block.id === quickEditTask.blockId 
          ? { ...block, task: updatedTask } 
          : block
      ));
    } else if (quickEditTask?.type === 'unassignedTask') {
      // Aktualizacja nieprzypisanego zadania
      setUnassignedTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    }
    
    setQuickEditTask(null);
  };

  // Obsługa usunięcia przypisania zadania
  const handleUnassignTask = () => {
    if (quickEditTask?.type === 'assignedTask' && quickEditTask.blockId && quickEditTask.task) {
      // Wykonanie żądania do API
      fetch(`/api/harmonogram/${quickEditTask.blockId}`, {
        method: 'DELETE'
      })
      .then(response => {
        if (response.ok) {
          // Usunięcie z bloków i dodanie do nieprzypisanych
          setTaskBlocks(prev => prev.filter(b => b.id !== quickEditTask.blockId));
          setUnassignedTasks(prev => [...prev, quickEditTask.task!]);
        }
      })
      .catch(error => {
        console.error('Błąd podczas usuwania przypisania:', error);
      });
    }
    
    setQuickEditTask(null);
  };

  return (
    <div className="bg-background-color min-h-screen">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="w-full">
          {/* Nagłówek z wyborem tygodnia */}
          <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
            <h1 className="text-base font-bold text-gray-900">Tydzień {weekNumber}</h1>
            
            <div className="flex items-center">
              <button
                onClick={previousWeek}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Poprzedni tydzień"
              >
                <FaArrowLeft className="text-gray-500 text-xs" />
              </button>
              
              <div className="relative mx-2">
                <button
                  onClick={toggleWeekPicker}
                  className="inline-flex items-center px-3 py-1 border border-gray-200 rounded-md bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FaCalendarAlt className="mr-2 text-primary-color text-xs" />
                  <span>
                    {format(weekStart, 'd MMM', { locale: pl })} - {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: pl })}
                  </span>
                </button>
                
                {isWeekPickerOpen && (
                  <div className="absolute mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 w-64">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {/* Nagłówki dni tygodnia */}
                      {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      
                      {/* Generowanie kalendarza z podziałem na tygodnie */}
                      {Array.from({ length: 42 }).map((_, i) => {
                        const date = addDays(
                          startOfWeek(
                            new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1), 
                            { weekStartsOn: 1 }
                          ), 
                          i
                        );
                        const isCurrentMonth = date.getMonth() === currentWeek.getMonth();
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelectedWeek = 
                          getWeekStart(date).toDateString() === getWeekStart(currentWeek).toDateString();
                        
                        return (
                          <button
                            key={i}
                            onClick={() => selectWeek(date)}
                            className={`
                              p-1 text-xs rounded-full w-7 h-7 flex items-center justify-center
                              ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                              ${isToday ? 'bg-blue-100 text-blue-700' : ''}
                              ${isSelectedWeek ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-100'}
                            `}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-center text-gray-500">
                      Kliknij na dzień, aby wybrać tydzień
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={nextWeek}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Następny tydzień"
              >
                <FaArrowRight className="text-gray-500 text-xs" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Główny harmonogram */}
            <div className="lg:w-4/5 bg-white rounded-lg shadow-sm">
              {/* Filtrowanie pracowników */}
              <div className="flex space-x-4 p-2 border-b border-gray-100">
                <div className="relative">
                  <button 
                    className="px-2 py-1 text-xs border border-gray-200 rounded flex items-center"
                    onClick={() => document.getElementById('departmentFilterDropdown')?.classList.toggle('hidden')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {selectedDepartmentId 
                      ? `Dział: ${departments.find(d => d.id === selectedDepartmentId)?.name}` 
                      : 'Filtruj wg działu'}
                  </button>
                  <div 
                    id="departmentFilterDropdown" 
                    className="absolute left-0 z-50 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden"
                  >
                    <div className="p-2">
                      <div 
                        className="py-1 px-2 hover:bg-gray-100 cursor-pointer text-xs rounded"
                        onClick={() => {
                          setSelectedDepartmentId(null);
                          document.getElementById('departmentFilterDropdown')?.classList.add('hidden');
                        }}
                      >
                        Wszystkie działy
                      </div>
                      {departments.map(dept => (
                        <div 
                          key={dept.id}
                          className="py-1 px-2 hover:bg-gray-100 cursor-pointer text-xs rounded flex items-center"
                          onClick={() => {
                            setSelectedDepartmentId(dept.id);
                            document.getElementById('departmentFilterDropdown')?.classList.add('hidden');
                          }}
                        >
                          <span 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: dept.color }}
                          ></span>
                          {dept.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    className="px-2 py-1 text-xs border border-gray-200 rounded flex items-center"
                    onClick={() => document.getElementById('userFilterDropdown')?.classList.toggle('hidden')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {selectedUserId 
                      ? `Osoba: ${users.find(u => u.id === selectedUserId)?.name}` 
                      : 'Filtruj wg osoby'}
                  </button>
                  <div 
                    id="userFilterDropdown" 
                    className="absolute left-0 z-50 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden"
                  >
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Szukaj..."
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded mb-2"
                        onKeyUp={(e) => {
                          const input = e.target as HTMLInputElement;
                          const filter = input.value.toLowerCase();
                          const items = document.querySelectorAll('.user-filter-item');
                          
                          items.forEach(item => {
                            const text = item.textContent || '';
                            if (text.toLowerCase().includes(filter)) {
                              (item as HTMLElement).style.display = '';
                            } else {
                              (item as HTMLElement).style.display = 'none';
                            }
                          });
                        }}
                      />
                      <div 
                        className="py-1 px-2 hover:bg-gray-100 cursor-pointer text-xs rounded user-filter-item"
                        onClick={() => {
                          setSelectedUserId(null);
                          document.getElementById('userFilterDropdown')?.classList.add('hidden');
                        }}
                      >
                        Wszyscy pracownicy
                      </div>
                      {users.map(user => (
                        <div 
                          key={user.id}
                          className="py-1 px-2 hover:bg-gray-100 cursor-pointer text-xs rounded user-filter-item"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            document.getElementById('userFilterDropdown')?.classList.add('hidden');
                          }}
                        >
                          {user.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {(selectedDepartmentId || selectedUserId) && (
                  <button 
                    className="px-2 py-1 text-xs border border-gray-200 rounded text-red-500 hover:bg-red-50"
                    onClick={resetFilters}
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>
              
              {/* Tabela harmonogramu */}
              <div className="overflow-x-auto">
                <div className="align-middle">
                  {isLoading ? (
                    <div className="p-3 text-center text-xs text-gray-500">Ładowanie danych...</div>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th scope="col" className="py-2 pl-3 pr-1 text-left text-xs font-semibold text-gray-900 w-28">
                            Pracownik
                          </th>
                          {weekDays.map((day) => (
                            <th 
                              key={day.date.toString()} 
                              scope="col" 
                              className={`px-1 py-2 text-xs font-semibold text-center w-36 ${day.isToday ? 'today' : ''}`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="hidden sm:block text-xs">{day.name}</span>
                                <span className="sm:hidden text-xs">{day.shortName}</span>
                                <span className={`text-sm font-bold ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                  {day.dayOfMonth}.{format(day.date, 'MM.yyyy')}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={weekDays.length + 1} className="py-3 text-center text-xs text-gray-500">
                              Brak danych do wyświetlenia
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user, userIndex) => {
                            // Znajdź dział użytkownika
                            const userDept = departments.find(d => d.id === user.departmentId);
                            const deptColor = userDept?.color || '#f8f9fa';
                            
                            // Oblicz odcień koloru w zależności od indeksu
                            const adjustedColor = userIndex % 2 === 0 ? deptColor : 
                              `${deptColor}${Math.min(90, 100 - 10)}`;
                            
                            return (
                              <tr key={user.id} style={{ backgroundColor: userIndex % 2 === 0 ? deptColor : adjustedColor }}>
                                <td className="whitespace-nowrap py-1 pl-3 pr-1 text-xs font-medium">
                                  {user.name}
                                </td>
                                {weekDays.map((day) => {
                                  // Formatujemy datę do porównania
                                  const formattedDate = format(day.date, 'yyyy-MM-dd');
                                  
                                  // Znajdź zadania dla tego użytkownika i dnia
                                  const dayTasks = taskBlocks.filter(
                                    (block) => 
                                      block.userId === user.id && 
                                      format(new Date(block.date), 'yyyy-MM-dd') === formattedDate
                                  );
                                  
                                  // Oblicz łączny czas zadań
                                  const totalTime = dayTasks.reduce((sum, block) => sum + block.allocatedTime, 0);
                                  
                                  // Określ klasę koloru obramowania na podstawie progów czasowych
                                  let thresholdClass = '';
                                  for (const threshold of config.timeThresholds) {
                                    if (totalTime >= threshold.min && 
                                        (threshold.max === null || totalTime < threshold.max)) {
                                      if (threshold.name === 'low') thresholdClass = 'green-500';
                                      else if (threshold.name === 'medium') thresholdClass = 'yellow-500';
                                      else if (threshold.name === 'high') thresholdClass = 'orange-500';
                                      else if (threshold.name === 'critical') thresholdClass = 'red-500';
                                      break;
                                    }
                                  }
                                  
                                  const cellId = `cell-${user.id}-${formattedDate}`;
                                  
                                  return (
                                    <td 
                                      key={day.date.toString()} 
                                      className={`schedule-cell ${day.isToday ? 'today-cell' : ''}`}
                                      style={{ padding: 0 }}
                                    >
                                      <DroppableCell
                                        id={cellId}
                                        userId={user.id}
                                        date={formattedDate}
                                        totalTime={totalTime}
                                        thresholdClass={thresholdClass}
                                      >
                                        {dayTasks.length === 0 ? (
                                          <div className="h-full flex items-center justify-center text-gray-400 min-h-[30px] text-xs">-</div>
                                        ) : (
                                          <div className="space-y-0">
                                            {dayTasks.map((block, index) => (
                                              <div key={block.id} className={index !== 0 ? "mt-1" : ""}>
                                                <DraggableTaskItem
                                                  task={block.task}
                                                  id={block.id}
                                                  type="assignedTask"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </DroppableCell>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
            
            {/* Panel boczny z nieprzypisanymi zadaniami */}
            <div className="lg:w-1/5 bg-white p-3 rounded-lg shadow-sm">
              <h2 className="text-sm font-semibold mb-3 text-gray-800 border-b border-gray-100 pb-2">Zadania do przypisania</h2>
              
              {/* Wyszukiwarka zadań */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400 text-xs" />
                </div>
                <input
                  type="text"
                  placeholder="Szukaj zadań..."
                  className="block w-full pl-7 pr-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-color focus:border-primary-color transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Lista nieprzypisanych zadań */}
              <UnassignedDroppablePanel>
                {filteredUnassignedTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-2 text-xs">Brak zadań do przypisania</p>
                ) : (
                  filteredUnassignedTasks.map(task => (
                    <DraggableTaskItem 
                      key={task.id} 
                      task={task} 
                      id={task.id} 
                      type="unassignedTask" 
                    />
                  ))
                )}
              </UnassignedDroppablePanel>
            </div>
          </div>
        </div>

        {/* Nakładka DnD pokazująca przeciągany element */}
        <DragOverlay zIndex={1000} dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }} modifiers={[restrictToWindowEdges]}>
          {activeId && activeDragData?.task && (
            <div className="transform scale-105 opacity-95 shadow-sm rounded-md draggable-transition cursor-grabbing">
              <TaskDragItem task={activeDragData.task} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      
      {/* Edytor zadania - wyświetlany po kliknięciu prawym przyciskiem myszy */}
      {quickEditTask && quickEditTask.task && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(100, 116, 139, 0.8)'
          }} 
          onClick={handleCloseTaskEditor}
        >
          <div className="bg-white rounded-lg shadow-xl p-4 w-96 max-w-full" 
               onClick={e => e.stopPropagation()} 
               style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.12)' }}>
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-800">Edycja zadania</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors" 
                onClick={handleCloseTaskEditor}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedTask: Task = {
                ...quickEditTask.task!,
                title: formData.get('title') as string,
                estimatedTime: parseFloat(formData.get('estimatedTime') as string),
                priority: formData.get('priority') as string,
                brand: {
                  ...quickEditTask.task!.brand,
                  name: formData.get('brand') as string
                }
              };
              handleSaveTask(updatedTask);
            }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tytuł zadania</label>
                  <input 
                    type="text" 
                    name="title" 
                    defaultValue={quickEditTask.task.title}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-color"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Marka</label>
                  <input 
                    type="text" 
                    name="brand" 
                    defaultValue={quickEditTask.task.brand.name}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-color"
                    required
                  />
                </div>
                
                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priorytet</label>
                    <select 
                      name="priority" 
                      defaultValue={quickEditTask.task.priority}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-color"
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                    </select>
                  </div>
                  
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Czas (h)</label>
                    <input 
                      type="number" 
                      name="estimatedTime" 
                      defaultValue={quickEditTask.task.estimatedTime}
                      min="0.5"
                      step="0.5"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-color"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-4 pt-3 border-t">
                <div className="flex space-x-2">
                  {quickEditTask.type === 'assignedTask' && (
                    <button 
                      type="button"
                      className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      onClick={handleUnassignTask}
                    >
                      Usuń przypisanie
                    </button>
                  )}
                  
                  <Link 
                    href={`/zadania/${quickEditTask.task.id}/edycja`}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    onClick={() => handleCloseTaskEditor()}
                  >
                    Edytuj szczegóły
                  </Link>
                </div>
                
                <div className="flex space-x-2 ml-auto">
                  <button 
                    type="button"
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    onClick={handleCloseTaskEditor}
                  >
                    Anuluj
                  </button>
                  
                  <button 
                    type="submit"
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 