'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaUsers, FaBuilding, FaStore, FaUserCog, FaClock, FaCalendarWeek, FaCheck, FaExclamationTriangle, FaInfo, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaTimes, FaEdit, FaTrashAlt, FaEye, FaList, FaTags, FaPlus } from 'react-icons/fa';
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

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentId?: number;
  department?: { name: string; color: string };
}

export default function UstawieniaPage() {
  const { config, updateTimeThresholds, updateDisplayedDays, reloadConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [timeThresholds, setTimeThresholds] = useState(config.timeThresholds);
  const [displayedDays, setDisplayedDays] = useState(config.displayedDays);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  
  // System powiadomień
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Zarządzanie użytkownikami
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Stany dla wyszukiwania i filtrowania użytkowników
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState<string>('');
  const [userSortField, setUserSortField] = useState<string>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Formularz użytkownika
  const [userForm, setUserForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'EDITOR',
    departmentId: ''
  });
  
  // Zarządzanie działami
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  
  // Formularz działu
  const [departmentForm, setDepartmentForm] = useState({
    id: '',
    name: '',
    color: '#3498db'
  });

  // Stany dla klientów
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientForm, setClientForm] = useState({
    id: '',
    name: ''
  });
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  
  // Stany dla marek
  const [clientBrands, setClientBrands] = useState<any[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [brandForm, setBrandForm] = useState({
    id: '',
    name: '',
    color: '#3498db',
    clientId: ''
  });

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
  
  // Funkcja do pobierania listy użytkowników
  const fetchUsers = async () => {
    try {
      showLoading();
      setIsLoadingUsers(true);
      const response = await fetch('/api/users?include=department');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const error = await response.json();
        showToast(error.error || 'Błąd podczas pobierania użytkowników', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania użytkowników:', error);
      showToast('Wystąpił błąd podczas pobierania użytkowników', 'error');
    } finally {
      setIsLoadingUsers(false);
      hideLoading();
    }
  };
  
  // Funkcja do pobierania listy działów
  const fetchDepartments = async () => {
    try {
      setIsLoadingDepartments(true);
      showLoading();
      
      const response = await fetch('/api/departments?includeUserCount=true');
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        const error = await response.json();
        showToast(error.error || 'Błąd podczas pobierania działów', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania działów:', error);
      showToast('Wystąpił błąd podczas pobierania działów', 'error');
    } finally {
      setIsLoadingDepartments(false);
      hideLoading();
    }
  };
  
  // Pobranie danych przy pierwszym renderowaniu i zmianie aktywnej zakładki
  useEffect(() => {
    if (activeTab === 1) { // Zakładka użytkowników
      fetchUsers();
      fetchDepartments();
    } else if (activeTab === 2) { // Zakładka działów
      fetchDepartments();
    } else if (activeTab === 3) { // Zakładka Klienci
      fetchClients();
    }
  }, [activeTab]);
  
  // Otwieranie modalu dodawania użytkownika
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      id: '',
      name: '',
      email: '',
      password: '',
      role: 'EDITOR',
      departmentId: ''
    });
    setShowUserModal(true);
  };
  
  // Otwieranie modalu edycji użytkownika
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: '', // Nie ustawiamy hasła przy edycji
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : ''
    });
    setShowUserModal(true);
  };
  
  // Aktualizacja formularza
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Zapisywanie użytkownika
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      showLoading();
      
      const method = editingUser ? 'PUT' : 'POST';
      const url = '/api/users';
      
      const userData: Record<string, any> = {
        ...userForm,
        id: userForm.id || undefined
      };
      
      // Nie wysyłamy pustego hasła przy edycji
      if (editingUser && !userForm.password) {
        delete userData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        showToast(
          editingUser ? 'Użytkownik został zaktualizowany' : 'Użytkownik został dodany', 
          'success'
        );
        setShowUserModal(false);
        fetchUsers(); // Odświeżenie listy
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas zapisywania użytkownika', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania użytkownika:', error);
      showToast('Wystąpił błąd podczas zapisywania użytkownika', 'error');
    } finally {
      hideLoading();
    }
  };
  
  // Usuwanie użytkownika
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      return;
    }
    
    try {
      showLoading();
      
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Użytkownik został usunięty', 'success');
        fetchUsers(); // Odświeżenie listy
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas usuwania użytkownika', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania użytkownika:', error);
      showToast('Wystąpił błąd podczas usuwania użytkownika', 'error');
    } finally {
      hideLoading();
    }
  };
  
  // Funkcja pomocnicza do tłumaczenia ról
  const translateRole = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'EDITOR': return 'Edytor';
      case 'VIEWER': return 'Przeglądający';
      default: return role;
    }
  };
  
  // Otwieranie modalu dodawania działu
  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setDepartmentForm({
      id: '',
      name: '',
      color: '#3498db'
    });
    setShowDepartmentModal(true);
  };
  
  // Otwieranie modalu edycji działu
  const handleEditDepartment = (department: any) => {
    setEditingDepartment(department);
    setDepartmentForm({
      id: department.id.toString(),
      name: department.name,
      color: department.color
    });
    setShowDepartmentModal(true);
  };
  
  // Aktualizacja formularza działu
  const handleDepartmentFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDepartmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Zmiana koloru działu
  const handleColorChange = (color: string) => {
    setDepartmentForm(prev => ({
      ...prev,
      color
    }));
  };
  
  // Zapisywanie działu
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      showLoading();
      
      const method = editingDepartment ? 'PUT' : 'POST';
      const url = '/api/departments';
      
      const departmentData: Record<string, any> = {
        ...departmentForm,
        id: departmentForm.id || undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(departmentData)
      });
      
      if (response.ok) {
        showToast(
          editingDepartment ? 'Dział został zaktualizowany' : 'Dział został dodany', 
          'success'
        );
        setShowDepartmentModal(false);
        fetchDepartments(); // Odświeżenie listy
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas zapisywania działu', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania działu:', error);
      showToast('Wystąpił błąd podczas zapisywania działu', 'error');
    } finally {
      hideLoading();
    }
  };
  
  // Usuwanie działu
  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten dział?')) {
      return;
    }
    
    try {
      showLoading();
      
      const response = await fetch(`/api/departments?id=${departmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Dział został usunięty', 'success');
        fetchDepartments(); // Odświeżenie listy
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas usuwania działu', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania działu:', error);
      showToast('Wystąpił błąd podczas usuwania działu', 'error');
    } finally {
      hideLoading();
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

  // Pobieranie klientów
  const fetchClients = async () => {
    try {
      showLoading();
      setIsLoadingClients(true);
      
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        showToast('Błąd podczas pobierania klientów', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania klientów:', error);
      showToast('Wystąpił błąd podczas pobierania klientów', 'error');
    } finally {
      setIsLoadingClients(false);
      hideLoading();
    }
  };
  
  // Filtrowanie klientów według wyszukiwania
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    
    const query = clientSearchQuery.toLowerCase();
    return clients.filter(client => 
      // Wyszukiwanie po nazwie klienta
      client.name.toLowerCase().includes(query) || 
      // Wyszukiwanie po nazwach marek klienta
      (client.brands && client.brands.some((brand: { name: string }) => 
        brand.name.toLowerCase().includes(query)
      ))
    );
  }, [clients, clientSearchQuery]);
  
  // Pobieranie marek dla klienta
  const fetchClientBrands = async (clientId: number) => {
    try {
      showLoading();
      setIsLoadingBrands(true);
      
      const response = await fetch(`/api/brands?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClientBrands(data);
      } else {
        showToast('Błąd podczas pobierania marek', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania marek:', error);
      showToast('Wystąpił błąd podczas pobierania marek', 'error');
    } finally {
      setIsLoadingBrands(false);
      hideLoading();
    }
  };
  
  // Obsługa dodawania klienta
  const handleAddClient = () => {
    setEditingClient(null);
    setClientForm({
      id: '',
      name: ''
    });
    setShowClientModal(true);
  };
  
  // Obsługa edycji klienta
  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setClientForm({
      id: client.id.toString(),
      name: client.name
    });
    setShowClientModal(true);
  };
  
  // Aktualizacja formularza klienta
  const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Zapisywanie klienta
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      showLoading();
      
      const method = editingClient ? 'PUT' : 'POST';
      const url = '/api/clients';
      
      const clientData: Record<string, any> = {
        ...clientForm,
        id: clientForm.id || undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });
      
      if (response.ok) {
        showToast(
          editingClient ? 'Klient został zaktualizowany' : 'Klient został dodany', 
          'success'
        );
        setShowClientModal(false);
        fetchClients(); // Odświeżenie listy
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas zapisywania klienta', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania klienta:', error);
      showToast('Wystąpił błąd podczas zapisywania klienta', 'error');
    } finally {
      hideLoading();
    }
  };
  
  // Usuwanie klienta
  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) {
      return;
    }
    
    try {
      showLoading();
      
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Klient został usunięty', 'success');
        fetchClients(); // Odświeżenie listy
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas usuwania klienta', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania klienta:', error);
      showToast('Wystąpił błąd podczas usuwania klienta', 'error');
    } finally {
      hideLoading();
    }
  };
  
  // Pokazanie szczegółów klienta i jego marek
  const handleShowClientDetails = async (client: any) => {
    setSelectedClient(client);
    setShowClientDetailsModal(true);
    await fetchClientBrands(client.id);
  };
  
  // Obsługa dodawania marki
  const handleAddBrand = () => {
    if (!selectedClient) return;
    
    setEditingBrand(null);
    setBrandForm({
      id: '',
      name: '',
      color: '#3498db',
      clientId: selectedClient.id.toString()
    });
    setShowBrandModal(true);
  };
  
  // Obsługa edycji marki
  const handleEditBrand = (brand: any) => {
    setEditingBrand(brand);
    setBrandForm({
      id: brand.id.toString(),
      name: brand.name,
      color: brand.color || '#3498db',
      clientId: brand.clientId.toString()
    });
    setShowBrandModal(true);
  };
  
  // Aktualizacja formularza marki
  const handleBrandFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBrandForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Zmiana koloru marki
  const handleBrandColorChange = (color: string) => {
    setBrandForm(prev => ({
      ...prev,
      color
    }));
  };
  
  // Zapisywanie marki
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      showLoading();
      
      const method = editingBrand ? 'PUT' : 'POST';
      const url = '/api/brands';
      
      const brandData: Record<string, any> = {
        ...brandForm,
        id: brandForm.id || undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(brandData)
      });
      
      if (response.ok) {
        showToast(
          editingBrand ? 'Marka została zaktualizowana' : 'Marka została dodana', 
          'success'
        );
        setShowBrandModal(false);
        if (selectedClient) {
          fetchClientBrands(selectedClient.id); // Odświeżenie listy marek
        }
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas zapisywania marki', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania marki:', error);
      showToast('Wystąpił błąd podczas zapisywania marki', 'error');
    } finally {
      hideLoading();
    }
  };
  
  // Usuwanie marki
  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę markę?')) {
      return;
    }
    
    try {
      showLoading();
      
      const response = await fetch(`/api/brands?id=${brandId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Marka została usunięta', 'success');
        if (selectedClient) {
          fetchClientBrands(selectedClient.id); // Odświeżenie listy marek
        }
      } else {
        const error = await response.json();
        showToast(error.error || 'Wystąpił błąd podczas usuwania marki', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania marki:', error);
      showToast('Wystąpił błąd podczas usuwania marki', 'error');
    } finally {
      hideLoading();
    }
  };

  // Funkcja sortująca użytkowników
  const handleSortUsers = (field: string) => {
    if (userSortField === field) {
      // Jeśli kliknięto to samo pole, odwróć kierunek sortowania
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Jeśli kliknięto inne pole, ustaw je jako pole sortowania i kierunek na rosnący
      setUserSortField(field);
      setUserSortDirection('asc');
    }
  };

  // Filtrowane i posortowane dane użytkowników
  const filteredAndSortedUsers = useMemo(() => {
    // Najpierw filtruj
    let result = users.filter(user => {
      // Filtrowanie po wyszukiwaniu (nazwa lub email)
      const matchesSearch = userSearchQuery === '' || 
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      // Filtrowanie po roli
      const matchesRole = userRoleFilter === '' || user.role === userRoleFilter;
      
      // Filtrowanie po dziale
      const matchesDepartment = userDepartmentFilter === '' || 
        (userDepartmentFilter === 'none' 
          ? user.departmentId === null 
          : user.departmentId?.toString() === userDepartmentFilter);
      
      return matchesSearch && matchesRole && matchesDepartment;
    });
    
    // Następnie sortuj
    return result.sort((a, b) => {
      let valueA, valueB;
      
      // Pobierz wartości do porównania w zależności od pola sortowania
      switch (userSortField) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'role':
          valueA = a.role;
          valueB = b.role;
          break;
        case 'department':
          valueA = a.department?.name?.toLowerCase() || '';
          valueB = b.department?.name?.toLowerCase() || '';
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }
      
      // Porównaj wartości
      if (valueA < valueB) return userSortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, userSearchQuery, userRoleFilter, userDepartmentFilter, userSortField, userSortDirection]);

  // Funkcja czyszcząca filtry
  const clearUserFilters = () => {
    setUserSearchQuery('');
    setUserRoleFilter('');
    setUserDepartmentFilter('');
  };

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
              toast.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' : 
              toast.type === 'error' ? 'bg-red-100 border-l-4 border-red-500' :
              'bg-blue-100 border-l-4 border-blue-500'
            )}
          >
            <div className="mr-3">
              {toast.type === 'success' ? (
                <FaCheck className="text-green-500" />
              ) : toast.type === 'error' ? (
                <FaExclamationTriangle className="text-red-500" />
              ) : (
                <FaInfo className="text-blue-500" />
              )}
            </div>
            <p className={toast.type === 'success' ? 'text-green-800' : 
                          toast.type === 'error' ? 'text-red-800' : 'text-blue-800'}>
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaUsers className="mr-2 text-blue-500" />
                    Zarządzanie użytkownikami
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all hover:shadow-lg"
                    onClick={handleAddUser}
                  >
                    <FaPlus className="mr-1 h-3 w-3" />
                    Dodaj użytkownika
                  </button>
                </div>
                
                {/* Pasek wyszukiwania i filtrowania */}
                <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Wyszukiwarka */}
                    <div className="flex-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Szukaj po nazwie lub emailu"
                        />
                      </div>
                    </div>
                    
                    {/* Filtr roli */}
                    <div className="w-full md:w-48">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border border-gray-300 rounded-md text-sm p-2"
                      >
                        <option value="">Wszystkie role</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="EDITOR">Edytor</option>
                        <option value="VIEWER">Przeglądający</option>
                      </select>
                    </div>
                    
                    {/* Filtr działu */}
                    <div className="w-full md:w-48">
                      <select
                        value={userDepartmentFilter}
                        onChange={(e) => setUserDepartmentFilter(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border border-gray-300 rounded-md text-sm p-2"
                      >
                        <option value="">Wszystkie działy</option>
                        <option value="none">Bez działu</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Informacja o filtrowaniu i przycisk resetowania */}
                  {(userSearchQuery || userRoleFilter || userDepartmentFilter) && (
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-500">
                        Znaleziono <span className="font-semibold">{filteredAndSortedUsers.length}</span> z <span className="font-semibold">{users.length}</span> użytkowników
                      </div>
                      <button 
                        onClick={clearUserFilters}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FaTimes className="mr-1" />
                        Wyczyść filtry
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg max-h-[55vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSortUsers('name')}
                        >
                          <div className="flex items-center">
                            Nazwa
                            <span className="ml-1">
                              {userSortField === 'name' ? (
                                userSortDirection === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />
                              ) : (
                                <FaSort className="h-3 w-3 text-gray-400" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSortUsers('email')}
                        >
                          <div className="flex items-center">
                            Email
                            <span className="ml-1">
                              {userSortField === 'email' ? (
                                userSortDirection === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />
                              ) : (
                                <FaSort className="h-3 w-3 text-gray-400" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSortUsers('role')}
                        >
                          <div className="flex items-center">
                            Rola
                            <span className="ml-1">
                              {userSortField === 'role' ? (
                                userSortDirection === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />
                              ) : (
                                <FaSort className="h-3 w-3 text-gray-400" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSortUsers('department')}
                        >
                          <div className="flex items-center">
                            Dział
                            <span className="ml-1">
                              {userSortField === 'department' ? (
                                userSortDirection === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />
                              ) : (
                                <FaSort className="h-3 w-3 text-gray-400" />
                              )}
                            </span>
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Ładowanie użytkowników...
                          </td>
                        </tr>
                      ) : filteredAndSortedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            {users.length === 0 ? 'Brak użytkowników w systemie' : 'Brak użytkowników spełniających kryteria wyszukiwania'}
                          </td>
                        </tr>
                      ) : (
                        filteredAndSortedUsers.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'ADMIN' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : user.role === 'EDITOR' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {translateRole(user.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.department ? (
                                <div className="flex items-center">
                                  <div 
                                    className="h-3 w-3 rounded-full mr-2" 
                                    style={{ backgroundColor: user.department.color || '#808080' }}
                                  />
                                  <span className="text-sm text-gray-900">{user.department.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Brak przypisania</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900 transition-all hover:scale-110"
                                  title="Edytuj użytkownika"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900 transition-all hover:scale-110"
                                  title="Usuń użytkownika"
                                >
                                  <FaTrashAlt className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Modal dodawania/edycji użytkownika */}
              {showUserModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                      <form onSubmit={handleSaveUser}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                {editingUser ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika'}
                              </h3>
                              
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nazwa użytkownika <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={userForm.name}
                                    onChange={handleFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    value={userForm.email}
                                    onChange={handleFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Hasło {!editingUser && <span className="text-red-500">*</span>}
                                    {editingUser && <span className="text-xs text-gray-500 ml-1">(pozostaw puste, aby nie zmieniać)</span>}
                                  </label>
                                  <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    required={!editingUser}
                                    value={userForm.password}
                                    onChange={handleFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                    Rola użytkownika
                                  </label>
                                  <select
                                    name="role"
                                    id="role"
                                    value={userForm.role}
                                    onChange={handleFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  >
                                    <option value="ADMIN">Administrator</option>
                                    <option value="EDITOR">Edytor</option>
                                    <option value="VIEWER">Przeglądający</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                                    Dział
                                  </label>
                                  <select
                                    name="departmentId"
                                    id="departmentId"
                                    value={userForm.departmentId}
                                    onChange={handleFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  >
                                    <option value="">Brak przypisania</option>
                                    {departments.map(department => (
                                      <option key={department.id} value={department.id.toString()}>
                                        {department.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {editingUser ? 'Zapisz zmiany' : 'Dodaj użytkownika'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUserModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Anuluj
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </Tab.Panel>

            {/* Panel zarządzania działami */}
            <Tab.Panel className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaBuilding className="mr-2 text-blue-500" />
                    Zarządzanie działami
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all hover:shadow-lg"
                    onClick={handleAddDepartment}
                  >
                    <FaPlus className="mr-1 h-3 w-3" />
                    Dodaj dział
                  </button>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg max-h-[55vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nazwa
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kolor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Użytkownicy
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingDepartments ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            Ładowanie działów...
                          </td>
                        </tr>
                      ) : departments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            Brak działów w systemie
                          </td>
                        </tr>
                      ) : (
                        departments.map(department => (
                          <tr key={department.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{department.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div 
                                  className="h-6 w-6 rounded mr-2 border border-gray-300" 
                                  style={{ backgroundColor: department.color }}
                                />
                                <span className="text-sm text-gray-500">{department.color}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {department.userCount !== undefined ? department.userCount : 0} użytkowników
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => handleEditDepartment(department)}
                                  className="text-blue-600 hover:text-blue-900 transition-all hover:scale-110"
                                  title="Edytuj dział"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDepartment(department.id)}
                                  className="text-red-600 hover:text-red-900 transition-all hover:scale-110"
                                  title="Usuń dział"
                                >
                                  <FaTrashAlt className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Modal dodawania/edycji działu */}
              {showDepartmentModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                      <form onSubmit={handleSaveDepartment}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                {editingDepartment ? 'Edytuj dział' : 'Dodaj nowy dział'}
                              </h3>
                              
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nazwa działu <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={departmentForm.name}
                                    onChange={handleDepartmentFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                                    Kolor działu
                                  </label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        name="color"
                                        id="color"
                                        value={departmentForm.color}
                                        onChange={handleDepartmentFormChange}
                                        className="p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                      />
                                    </div>
                                    <div 
                                      className="h-10 w-10 rounded cursor-pointer border border-gray-300"
                                      style={{ backgroundColor: departmentForm.color }}
                                      onClick={() => setActiveColorPicker(activeColorPicker === 'department' ? null : 'department')}
                                    />
                                  </div>
                                  
                                  {activeColorPicker === 'department' && (
                                    <div className="mt-2 relative">
                                      <div className="absolute right-0 z-10">
                                        <HexColorPicker 
                                          color={departmentForm.color} 
                                          onChange={handleColorChange} 
                                        />
                                        <button
                                          type="button"
                                          className="mt-2 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                          onClick={() => setActiveColorPicker(null)}
                                        >
                                          Zatwierdź kolor
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {editingDepartment ? 'Zapisz zmiany' : 'Dodaj dział'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDepartmentModal(false);
                              setActiveColorPicker(null);
                            }}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Anuluj
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </Tab.Panel>

            {/* Panel zarządzania klientami */}
            <Tab.Panel className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Zarządzanie klientami</h3>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all hover:shadow-lg"
                    onClick={handleAddClient}
                  >
                    <FaPlus className="mr-1 h-3 w-3" />
                    Dodaj klienta
                  </button>
                </div>
                
                {/* Pasek wyszukiwania klientów */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm p-2"
                      placeholder="Szukaj po nazwie klienta lub marki..."
                    />
                  </div>
                  {clientSearchQuery && (
                    <div className="mt-2 flex justify-between items-center text-sm">
                      <div className="text-gray-500">
                        Znaleziono <span className="font-semibold">{filteredClients.length}</span> z <span className="font-semibold">{clients.length}</span> klientów
                      </div>
                      <button 
                        onClick={() => setClientSearchQuery('')}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FaTimes className="mr-1" />
                        Wyczyść
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg max-h-[55vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nazwa
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Liczba marek
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingClients ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                            Ładowanie klientów...
                          </td>
                        </tr>
                      ) : filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                            {clients.length === 0 ? 'Brak klientów w systemie' : 'Brak klientów spełniających kryteria wyszukiwania'}
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map(client => (
                          <tr key={client.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                {client.brands && client.brands.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Marki: {client.brands.map((brand: { name: string }) => brand.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm text-gray-900">
                                  {client.brands ? client.brands.length : 0} marek
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleShowClientDetails(client)}
                                  className="text-green-600 hover:text-green-900 ml-2 transition-all hover:scale-110"
                                  title="Zarządzaj markami"
                                >
                                  <FaTags className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => handleEditClient(client)}
                                  className="text-blue-600 hover:text-blue-900 transition-all hover:scale-110"
                                  title="Edytuj klienta"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="text-red-600 hover:text-red-900 transition-all hover:scale-110"
                                  title="Usuń klienta"
                                >
                                  <FaTrashAlt className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Modal dodawania/edycji klienta */}
              {showClientModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                      <form onSubmit={handleSaveClient}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                {editingClient ? 'Edytuj klienta' : 'Dodaj nowego klienta'}
                              </h3>
                              
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                                    Nazwa klienta <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    id="clientName"
                                    required
                                    value={clientForm.name}
                                    onChange={handleClientFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {editingClient ? 'Zapisz zmiany' : 'Dodaj klienta'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowClientModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Anuluj
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Modal szczegółów klienta i zarządzania markami */}
              {showClientDetailsModal && selectedClient && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                      <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Marki klienta: {selectedClient.name}
                          </h3>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all hover:shadow-lg"
                            onClick={handleAddBrand}
                          >
                            <FaPlus className="mr-1 h-3 w-3" />
                            Dodaj markę
                          </button>
                        </div>
                        
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Nazwa
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Kolor
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Akcje
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {isLoadingBrands ? (
                                <tr>
                                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                    Ładowanie marek...
                                  </td>
                                </tr>
                              ) : clientBrands.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                    Brak marek dla tego klienta
                                  </td>
                                </tr>
                              ) : (
                                clientBrands.map(brand => (
                                  <tr key={brand.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div 
                                          className="h-6 w-6 rounded mr-2 border border-gray-300" 
                                          style={{ backgroundColor: brand.color }}
                                        />
                                        <span className="text-sm text-gray-500">{brand.color}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center space-x-3">
                                        <button
                                          type="button"
                                          onClick={() => handleEditBrand(brand)}
                                          className="text-blue-600 hover:text-blue-900 transition-all hover:scale-110"
                                          title="Edytuj markę"
                                        >
                                          <FaEdit className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteBrand(brand.id)}
                                          className="text-red-600 hover:text-red-900 transition-all hover:scale-110"
                                          title="Usuń markę"
                                        >
                                          <FaTrashAlt className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="button"
                          onClick={() => setShowClientDetailsModal(false)}
                          className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
                        >
                          Zamknij
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Modal dodawania/edycji marki */}
              {showBrandModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                      <form onSubmit={handleSaveBrand}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                {editingBrand ? 'Edytuj markę' : 'Dodaj nową markę'}
                              </h3>
                              
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label htmlFor="brandName" className="block text-sm font-medium text-gray-700">
                                    Nazwa marki <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    id="brandName"
                                    required
                                    value={brandForm.name}
                                    onChange={handleBrandFormChange}
                                    className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-2">
                                    Kolor marki
                                  </label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        name="color"
                                        id="brandColor"
                                        value={brandForm.color}
                                        onChange={handleBrandFormChange}
                                        className="p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                                      />
                                    </div>
                                    <div 
                                      className="h-10 w-10 rounded cursor-pointer border border-gray-300"
                                      style={{ backgroundColor: brandForm.color }}
                                      onClick={() => setActiveColorPicker(activeColorPicker === 'brand' ? null : 'brand')}
                                    />
                                  </div>
                                  
                                  {activeColorPicker === 'brand' && (
                                    <div className="mt-2 relative">
                                      <div className="absolute right-0 z-10">
                                        <HexColorPicker 
                                          color={brandForm.color} 
                                          onChange={color => handleBrandColorChange(color)}
                                        />
                                        <button
                                          type="button"
                                          className="mt-2 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                          onClick={() => setActiveColorPicker(null)}
                                        >
                                          Zatwierdź kolor
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {editingBrand ? 'Zapisz zmiany' : 'Dodaj markę'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBrandModal(false);
                              setActiveColorPicker(null);
                            }}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            Anuluj
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 