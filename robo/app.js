// DOM Elements
const addTaskBtn = document.getElementById('add-task-btn');
const selectWeekBtn = document.getElementById('select-week-btn');
const settingsBtn = document.getElementById('settings-btn');

const addTaskSection = document.getElementById('add-task-section');
const weekViewSection = document.getElementById('week-view-section');
const settingsSection = document.getElementById('settings-section');

const addTaskForm = document.getElementById('add-task-form');
const weekNumber = document.getElementById('week-number');
const weekPicker = document.getElementById('week-picker');
const weekDates = document.getElementById('week-dates');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const scheduleBody = document.getElementById('schedule-body');
const availableTasks = document.getElementById('available-tasks');

const filterDepartment = document.getElementById('filter-department');
const filterUser = document.getElementById('filter-user');
const clearFilters = document.getElementById('clear-filters');
const taskSearch = document.getElementById('task-search');

const taskEditModal = document.getElementById('task-edit-modal');
const taskDetailModal = document.getElementById('task-detail-modal');
const departmentEditModal = document.getElementById('department-edit-modal');

const timeSettingsForm = document.getElementById('time-settings-form');
const addUserForm = document.getElementById('add-user-form');
const addDepartmentForm = document.getElementById('add-department-form');
const usersListBody = document.getElementById('users-list-body');
const departmentsListBody = document.getElementById('departments-list-body');

// Globalne zmienne
let tasks = [];
let users = [];
let departments = [];
let settings = {
    yellowThreshold: 4,
    greenThresholdMin: 4,
    greenThresholdMax: 6,
    orangeThresholdMin: 6,
    orangeThresholdMax: 8,
    showFullWeek: 'workdays',
    yellowColor: '#f39c12',
    greenColor: '#2ecc71',
    orangeColor: '#ff9800',
    redColor: '#e74c3c'
};

let currentWeek = getCurrentWeek();
let currentWeekDates = getWeekDates(currentWeek);
let currentEditingTask = null;
let currentEditingDept = null;
let colorPickers = {};
let weekPickr = null;
let departmentPicker = null;
let editDepartmentPicker = null;
let filters = {
    department: '',
    user: '',
    taskSearch: ''
};

// ====== Event Listeners ======

function setupEventListeners() {
    // Nawigacja
    addTaskBtn.addEventListener('click', () => showSection(addTaskSection));
    selectWeekBtn.addEventListener('click', () => {
        showSection(weekViewSection);
        renderWeekView();
    });
    settingsBtn.addEventListener('click', () => {
        showSection(settingsSection);
        loadSettings();
        renderDepartmentsList();
        renderUsersList();
    });
    
    // Formularze
    addTaskForm.addEventListener('submit', handleAddTask);
    timeSettingsForm.addEventListener('submit', handleSaveSettings);
    addUserForm.addEventListener('submit', handleAddUser);
    addDepartmentForm.addEventListener('submit', handleAddDepartment);
    
    // Nawigacja tygodni
    prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    nextWeekBtn.addEventListener('click', () => changeWeek(1));
    
    // Filtry
    filterDepartment.addEventListener('change', handleFilterChange);
    filterUser.addEventListener('change', handleFilterChange);
    clearFilters.addEventListener('click', clearAllFilters);
    taskSearch.addEventListener('input', handleTaskSearch);
    
    // Modalne okna
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            taskEditModal.style.display = 'none';
            taskDetailModal.style.display = 'none';
            departmentEditModal.style.display = 'none';
        });
    });
    
    // Kliknięcie poza modalem
    window.addEventListener('click', event => {
        if (event.target === taskEditModal) taskEditModal.style.display = 'none';
        if (event.target === taskDetailModal) taskDetailModal.style.display = 'none';
        if (event.target === departmentEditModal) departmentEditModal.style.display = 'none';
    });
}

// ====== Funkcje UI ======

// Pokaż wybraną sekcję, ukryj pozostałe
function showSection(section) {
    addTaskSection.classList.add('hidden');
    weekViewSection.classList.add('hidden');
    settingsSection.classList.add('hidden');
    
    section.classList.remove('hidden');
}

// Zaktualizuj zmienne CSS
function updateStyleVariables() {
    document.documentElement.style.setProperty('--yellow-cell', settings.yellowColor);
    document.documentElement.style.setProperty('--green-cell', settings.greenColor);
    document.documentElement.style.setProperty('--orange-cell', settings.orangeColor);
    document.documentElement.style.setProperty('--red-cell', settings.redColor);
}

// Wypełnij pola select z użytkownikami
function populateUserSelects() {
    const accountSelect = document.getElementById('account');
    const leaderSelect = document.getElementById('leader');
    const userDepartmentSelect = document.getElementById('user-department');
    
    // Wyczyść istniejące opcje (poza pierwszą - placeholder)
    while (accountSelect.options.length > 1) {
        accountSelect.remove(1);
    }
    
    while (leaderSelect.options.length > 1) {
        leaderSelect.remove(1);
    }
    
    // Accounts tylko z działu Account
    const accounts = users.filter(user => user.department_name === 'Account');
    accounts.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        accountSelect.appendChild(option);
    });
    
    // Liderzy z wszystkich działów
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.department_name})`;
        leaderSelect.appendChild(option);
    });
    
    // Wypełnij select działów w formularzu użytkownika
    if (userDepartmentSelect) {
        // Wyczyść istniejące opcje (poza pierwszą - placeholder)
        while (userDepartmentSelect.options.length > 1) {
            userDepartmentSelect.remove(1);
        }
        
        // Dodaj działy do wyboru
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            userDepartmentSelect.appendChild(option);
        });
    }
}

// Wypełnij select z działami
function populateDepartmentSelect() {
    const userDepartmentSelect = document.getElementById('user-department');
    
    if (userDepartmentSelect) {
        // Wyczyść istniejące opcje (poza pierwszą - placeholder)
        while (userDepartmentSelect.options.length > 1) {
            userDepartmentSelect.remove(1);
        }
        
        // Dodaj działy do wyboru
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            userDepartmentSelect.appendChild(option);
        });
    }
}

// Wypełnij filtry w widoku tygodnia
function populateFilterSelects() {
    // Wyczyść istniejące opcje (poza pierwszą - placeholder)
    while (filterDepartment.options.length > 1) {
        filterDepartment.remove(1);
    }
    
    while (filterUser.options.length > 1) {
        filterUser.remove(1);
    }
    
    // Dodaj działy do filtra
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        filterDepartment.appendChild(option);
    });
    
    // Dodaj użytkowników do filtra
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.department_name})`;
        filterUser.appendChild(option);
    });
}

// ====== Funkcje obsługi tygodni ======

function getCurrentWeek() {
    const now = new Date();
    return getWeekNumber(now);
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getWeekDates(weekNum) {
    const year = new Date().getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = firstDayOfYear.getDay() || 7; // Jeśli 0 (niedziela), to 7
    
    // Znajdź pierwszy dzień tygodnia
    const firstDayOfWeek = new Date(year, 0, 1 + (weekNum - 1) * 7 - daysOffset + 1);
    
    // Utwórz tablicę dat dla całego tygodnia
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(date.getDate() + i);
        weekDates.push(date);
    }
    
    return weekDates;
}

function formatDateRange(dates) {
    if (!dates || dates.length === 0) return '';
    
    const options = { day: '2-digit', month: '2-digit' };
    const startDate = dates[0].toLocaleDateString('pl-PL', options);
    const endDate = dates[6].toLocaleDateString('pl-PL', options);
    
    return `${startDate} - ${endDate}`;
}

function updateWeekDates() {
    currentWeekDates = getWeekDates(currentWeek);
    weekDates.textContent = formatDateRange(currentWeekDates);
    
    // Aktualizuj datę w pickerze
    if (weekPickr) {
        weekPickr.setDate(currentWeekDates[0]);
    }
}

function changeWeek(direction) {
    currentWeek = parseInt(currentWeek) + direction;
    weekNumber.textContent = currentWeek;
    updateWeekDates();
    renderWeekView();
}

// ====== Funkcje widoku tygodnia ======

function renderWeekView() {
    // Aktualizuj wyświetlany numer tygodnia
    weekNumber.textContent = currentWeek;
    updateWeekDates();
    
    // Wyczyść i odbuduj tabelę harmonogramu
    scheduleBody.innerHTML = '';
    
    // Nagłówek tabeli z dniami tygodnia
    const headerRow = document.querySelector('#schedule-table thead tr');
    headerRow.innerHTML = '<th>Osoba</th>';
    
    // Określ liczbę dni do wyświetlenia
    const daysToShow = settings.showFullWeek === 'fullweek' ? 7 : 5;
    const dayNames = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
    
    // Dodaj nazwy dni tygodnia z datami
    for (let day = 0; day < daysToShow; day++) {
        const th = document.createElement('th');
        const dateStr = currentWeekDates[day].toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
        th.textContent = `${dayNames[day]} (${dateStr})`;
        headerRow.appendChild(th);
    }
    
    // Przefiltruj użytkowników, jeśli potrzebne
    let filteredUsers = users;
    if (filters.department) {
        filteredUsers = users.filter(user => user.department_id.toString() === filters.department);
    }
    if (filters.user) {
        filteredUsers = filteredUsers.filter(user => user.id.toString() === filters.user);
    }
    
    // Renderuj wiersze użytkowników
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        const deptColor = user.department_color || '#ccc';
        
        row.innerHTML = `
            <td style="background-color: ${deptColor}20; border-left: 4px solid ${deptColor}">
                ${user.name} <br> <small>${user.department_name}</small>
            </td>
        `;
        
        // Dodaj komórki dla każdego dnia tygodnia
        for (let day = 1; day <= daysToShow; day++) {
            const cell = document.createElement('td');
            cell.className = 'schedule-cell';
            cell.dataset.userId = user.id;
            cell.dataset.day = day;
            
            // Dodaj event listenery dla drag and drop
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            
            // Dodaj wskaźnik czasu
            const timeIndicator = document.createElement('div');
            timeIndicator.className = 'schedule-cell-time';
            timeIndicator.textContent = '0h';
            cell.appendChild(timeIndicator);
            
            row.appendChild(cell);
        }
        
        scheduleBody.appendChild(row);
    });
    
    // Odśwież dostępne zadania i przypisane zadania
    renderAvailableTasks();
    renderAssignedTasks();
    
    // Po zakończeniu renderowania dodaj funkcjonalności do zadań
    setTimeout(() => {
        enhanceTaskItems();
    }, 100);
}

function renderAvailableTasks() {
    availableTasks.innerHTML = '';
    
    // Filtruj zadania nieprzypisane do bieżącego tygodnia
    let unassignedTasks = tasks.filter(task => 
        task.week_number !== currentWeek || task.assigned_to === null
    );
    
    // Zastosuj filtr wyszukiwania
    if (filters.taskSearch) {
        const searchTerm = filters.taskSearch.toLowerCase();
        unassignedTasks = unassignedTasks.filter(task => 
            task.client.toLowerCase().includes(searchTerm) ||
            task.brand.toLowerCase().includes(searchTerm) ||
            task.task_description.toLowerCase().includes(searchTerm) ||
            (task.account_name && task.account_name.toLowerCase().includes(searchTerm)) ||
            (task.leader_name && task.leader_name.toLowerCase().includes(searchTerm))
        );
    }
    
    // Posortuj zadania według priorytetu
    unassignedTasks.sort((a, b) => a.priority - b.priority);
    
    // Stwórz elementy zadań
    unassignedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        availableTasks.appendChild(taskElement);
    });
    
    // Komunikat, jeśli brak zadań
    if (unassignedTasks.length === 0) {
        availableTasks.innerHTML = '<p class="no-tasks">Brak dostępnych zadań</p>';
    }
}

function renderAssignedTasks() {
    // Filtruj zadania przypisane do bieżącego tygodnia
    const assignedTasks = tasks.filter(task => 
        task.week_number === currentWeek && task.assigned_to !== null && task.assigned_day !== null
    );
    
    // Grupuj zadania według użytkownika i dnia
    const tasksByCell = {};
    assignedTasks.forEach(task => {
        const key = `${task.assigned_to}-${task.assigned_day}`;
        if (!tasksByCell[key]) tasksByCell[key] = [];
        tasksByCell[key].push(task);
    });
    
    // Wyczyść wszystkie komórki
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        // Usuń wszystkie zadania, ale zachowaj wskaźnik czasu
        Array.from(cell.children).forEach(child => {
            if (!child.classList.contains('schedule-cell-time')) {
                cell.removeChild(child);
            }
        });
        
        // Resetuj czas do 0
        const timeIndicator = cell.querySelector('.schedule-cell-time');
        if (timeIndicator) timeIndicator.textContent = '0h';
        
        // Resetuj kolor komórki
        cell.className = 'schedule-cell';
    });
    
    // Dodaj zadania do komórek i zaktualizuj czas
    Object.entries(tasksByCell).forEach(([key, cellTasks]) => {
        const [userId, day] = key.split('-');
        const cell = document.querySelector(`.schedule-cell[data-user-id="${userId}"][data-day="${day}"]`);
        
        if (!cell) return;
        
        // Oblicz łączny czas
        const totalTime = cellTasks.reduce((sum, task) => sum + parseFloat(task.estimated_time), 0);
        
        // Aktualizuj wskaźnik czasu
        const timeIndicator = cell.querySelector('.schedule-cell-time');
        timeIndicator.textContent = `${totalTime}h`;
        
        // Aktualizuj kolor komórki na podstawie progów czasowych
        updateCellColor(cell, totalTime);
        
        // Dodaj zadania do komórki
        cellTasks.forEach(task => {
            const taskElement = createTaskElement(task, true);
            
            // Sprawdź, czy to zadanie wielodniowe
            if (task.day_span && task.day_span > 1) {
                taskElement.classList.add('multi-day');
                
                // Określ maksymalną liczbę dni do wyświetlenia
                const daysToShow = settings.showFullWeek === 'fullweek' ? 7 : 5;
                
                // Oblicz szerokość jednej komórki
                const cellWidth = cell.offsetWidth;
                
                // Oblicz końcowy dzień (nie może przekraczać widocznego zakresu)
                const endDay = Math.min(parseInt(day) + task.day_span - 1, daysToShow);
                
                // Oblicz ile dni jest faktycznie widocznych
                const visibleDays = endDay - parseInt(day) + 1;
                
                // Ustaw szerokość zadania (szerokość komórki * liczba dni - margines)
                taskElement.style.width = `${visibleDays * cellWidth - 10}px`;
                
                // Dodaj informację o liczbie dni w opisie zadania
                const taskDetails = taskElement.querySelector('.task-item-details');
                if (taskDetails) {
                    taskDetails.innerHTML += `<br><small>(${visibleDays} ${visibleDays === 1 ? 'dzień' : 'dni'})</small>`;
                }
            }
            
            cell.insertBefore(taskElement, timeIndicator);
        });
    });
    
    // Uporządkuj czasy w komórkach, gdzie są już zadania
    updateTaskTimesInCells();
}

// ====== Funkcje obsługi zadań ======

function createTaskElement(task, isCompact = false) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item priority-${getPriorityClass(task.priority)}`;
    
    // Wszystkie zadania powinny być przeciągalne, niezależnie czy są przypisane czy nie
    taskElement.draggable = true;
    
    // Dodaj event listenery dla przeciągania
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
    
    if (isCompact) {
        // Dla przypisanych zadań dodaj klasę assigned
        taskElement.classList.add('assigned-task');
    }
    
    taskElement.dataset.taskId = task.id;
    
    // Dodaj event do kliknięcia
    taskElement.addEventListener('click', () => showTaskDetails(task));
    
    // Przygotuj informacje o użytkownikach
    const accountName = task.account_name || 'Brak';
    const leaderName = task.leader_name || 'Brak';
    
    if (isCompact) {
        // Widok kompaktowy dla przypisanych zadań
        taskElement.innerHTML = `
            <div class="task-item-header">
                <span class="task-item-title">${task.client} - ${task.brand}</span>
                <span class="task-item-time">${task.estimated_time}h</span>
            </div>
            <div class="task-item-details">
                ${task.task_description.substring(0, 30)}${task.task_description.length > 30 ? '...' : ''}
            </div>
        `;
    } else {
        // Pełny widok dla dostępnych zadań
        taskElement.innerHTML = `
            <div class="task-item-header">
                <span class="task-item-title">${task.client} - ${task.brand}</span>
                <span class="task-item-time">${task.estimated_time}h</span>
            </div>
            <div class="task-item-details">
                <strong>Zlecenie:</strong> ${task.task_description.substring(0, 50)}${task.task_description.length > 50 ? '...' : ''}<br>
                <strong>Account:</strong> ${accountName}<br>
                <strong>ID:</strong> ${task.id.toString().substring(0, 8)}
                <i class="fas fa-arrow-up" style="float: right; cursor: pointer;"></i>
            </div>
        `;
        
        // Dodaj funkcjonalność przycisku rozwijania
        const expandBtn = taskElement.querySelector('.fa-arrow-up');
        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showTaskDetails(task);
            });
        }
    }
    
    return taskElement;
}

function getPriorityClass(priority) {
    switch (parseInt(priority)) {
        case 1: return 'critical';
        case 2: return 'important';
        case 3: return 'normal';
        default: return 'normal';
    }
}

function updateCellColor(cell, totalTime) {
    // Resetuj klasy
    cell.classList.remove('time-yellow', 'time-green', 'time-orange', 'time-red');
    
    // Dodaj nową klasę na podstawie progów
    if (totalTime < settings.yellowThreshold) {
        cell.classList.add('time-yellow');
    } else if (totalTime >= settings.greenThresholdMin && totalTime <= settings.greenThresholdMax) {
        cell.classList.add('time-green');
    } else if (totalTime > settings.orangeThresholdMin && totalTime <= settings.orangeThresholdMax) {
        cell.classList.add('time-orange');
    } else if (totalTime > settings.orangeThresholdMax) {
        cell.classList.add('time-red');
    }
}

// ====== Funkcje obsługi przeciągania i upuszczania ======

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drop-target');
}

function handleDrop(e) {
    e.preventDefault();
    
    // Usuń podświetlenie docelowego miejsca
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    // Pobierz ID zadania z danych przeciągania
    const taskId = e.dataTransfer.getData('text/plain');
    
    // Znajdź komórkę harmonogramu (może być elementem potomnym)
    let cell = e.target;
    while (!cell.classList.contains('schedule-cell') && !cell.classList.contains('available-tasks') && cell.parentElement) {
        cell = cell.parentElement;
    }
    
    // Znajdź zadanie
    const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
    if (taskIndex === -1) return;
    
    // Zapisz poprzednie wartości na wypadek niepowodzenia
    const prevAssignedTo = tasks[taskIndex].assigned_to;
    const prevAssignedDay = tasks[taskIndex].assigned_day;
    const prevWeekNumber = tasks[taskIndex].week_number;
    
    // Obsługa upuszczenia na różne elementy
    if (cell.classList.contains('schedule-cell')) {
        // Upuszczenie na komórkę harmonogramu
        const userId = cell.dataset.userId;
        const day = cell.dataset.day;
        
        // Zapisz lokalne dane
        tasks[taskIndex].assigned_to = userId;
        tasks[taskIndex].assigned_day = day;
        tasks[taskIndex].week_number = currentWeek;
        
        // Odśwież widok już teraz, aby użytkownik widział natychmiastową zmianę
        renderWeekView();
        renderAvailableTasks();
        
        // Wyślij aktualizację do API
        updateTaskAssignment(taskId, {
            assigned_to: userId,
            assigned_day: day,
            week_number: currentWeek
        }).then((result) => {
            if (result.success) {
                console.log('Zadanie przypisane pomyślnie', result.offline ? '(tryb offline)' : '');
            } else {
                console.error('Błąd przypisania zadania:', result.message);
                
                // Przywróć poprzednie dane tylko w przypadku faktycznego błędu (nie w trybie offline)
                if (!result.offline) {
                    alert('Nie udało się przypisać zadania: ' + result.message);
                    
                    // Przywróć poprzedni stan
                    tasks[taskIndex].assigned_to = prevAssignedTo;
                    tasks[taskIndex].assigned_day = prevAssignedDay;
                    tasks[taskIndex].week_number = prevWeekNumber;
                    
                    // Odśwież widok
                    renderWeekView();
                    renderAvailableTasks();
                }
            }
        }).catch(error => {
            console.error('Błąd przypisania zadania:', error);
            alert('Wystąpił nieoczekiwany błąd podczas przypisywania zadania.');
            
            // Przywróć poprzedni stan
            tasks[taskIndex].assigned_to = prevAssignedTo;
            tasks[taskIndex].assigned_day = prevAssignedDay;
            tasks[taskIndex].week_number = prevWeekNumber;
            
            // Odśwież widok
            renderWeekView();
            renderAvailableTasks();
        });
    } else if (cell.classList.contains('available-tasks')) {
        // Upuszczenie zadania z powrotem na listę dostępnych zadań
        // czyli usunięcie przypisania
        
        // Usuń przypisanie lokalnie
        tasks[taskIndex].assigned_to = null;
        tasks[taskIndex].assigned_day = null;
        tasks[taskIndex].week_number = null;
        
        // Odśwież widoki od razu
        renderWeekView();
        renderAvailableTasks();
        
        // Wyślij aktualizację do API
        updateTaskAssignment(taskId, {
            assigned_to: null,
            assigned_day: null,
            week_number: null
        }).then((result) => {
            if (result.success) {
                console.log('Przypisanie zadania zostało usunięte', result.offline ? '(tryb offline)' : '');
            } else {
                console.error('Błąd podczas usuwania przypisania zadania:', result.message);
                
                // Przywróć poprzednie dane tylko w przypadku faktycznego błędu (nie w trybie offline)
                if (!result.offline) {
                    alert('Nie udało się usunąć przypisania zadania: ' + result.message);
                    
                    // Wróć do poprzedniego stanu
                    tasks[taskIndex].assigned_to = prevAssignedTo;
                    tasks[taskIndex].assigned_day = prevAssignedDay;
                    tasks[taskIndex].week_number = prevWeekNumber;
                    
                    // Odśwież widoki
                    renderWeekView();
                    renderAvailableTasks();
                }
            }
        }).catch(error => {
            console.error('Błąd podczas usuwania przypisania zadania:', error);
            alert('Wystąpił nieoczekiwany błąd podczas usuwania przypisania zadania.');
            
            // Wróć do poprzedniego stanu
            tasks[taskIndex].assigned_to = prevAssignedTo;
            tasks[taskIndex].assigned_day = prevAssignedDay;
            tasks[taskIndex].week_number = prevWeekNumber;
            
            // Odśwież widoki
            renderWeekView();
            renderAvailableTasks();
        });
    }
}

// ====== Funkcje obsługi formularzy ======

// Obsługa dodawania zadania
async function handleAddTask(event) {
    event.preventDefault();
    
    try {
        const taskData = {
            priority: parseInt(addTaskForm.priority.value),
            client: addTaskForm.client.value,
            brand: addTaskForm.brand.value,
            task_description: addTaskForm.task.value,
            account_id: addTaskForm.account.value,
            leader_id: addTaskForm.leader.value,
            estimated_time: parseFloat(addTaskForm['estimated-time'].value),
            notes: addTaskForm.notes.value,
            links: addTaskForm.links.value
        };
        
        // Dodaj zadanie do API
        const response = await addTask(taskData);
        
        // Dodaj ID i dodatkowe informacje z odpowiedzi
        taskData.id = response.id;
        
        // Znajdź dane użytkowników
        const account = users.find(u => u.id.toString() === taskData.account_id);
        const leader = users.find(u => u.id.toString() === taskData.leader_id);
        
        if (account) taskData.account_name = account.name;
        if (leader) taskData.leader_name = leader.name;
        
        // Dodaj do lokalnej tablicy
        tasks.push(taskData);
        
        // Resetuj formularz
        addTaskForm.reset();
        
        alert('Zadanie zostało dodane pomyślnie!');
    } catch (error) {
        console.error('Błąd dodawania zadania:', error);
        alert('Nie udało się dodać zadania. Sprawdź połączenie lub dane.');
    }
}

// Obsługa zapisywania ustawień
async function handleSaveSettings(event) {
    event.preventDefault();
    
    try {
        // Pobierz wartości z formularza
        const yellowThreshold = parseFloat(document.getElementById('yellow-threshold').value);
        const greenThresholdMin = parseFloat(document.getElementById('green-threshold-min').value);
        const greenThresholdMax = parseFloat(document.getElementById('green-threshold-max').value);
        const orangeThresholdMin = parseFloat(document.getElementById('orange-threshold-min').value);
        const orangeThresholdMax = parseFloat(document.getElementById('orange-threshold-max').value);
        const showFullWeek = document.getElementById('show-full-week').value;
        
        // Aktualizuj ustawienia
        settings.yellowThreshold = yellowThreshold;
        settings.greenThresholdMin = greenThresholdMin;
        settings.greenThresholdMax = greenThresholdMax;
        settings.orangeThresholdMin = orangeThresholdMin;
        settings.orangeThresholdMax = orangeThresholdMax;
        settings.showFullWeek = showFullWeek;
        
        // Zaktualizuj zmienne CSS
        updateStyleVariables();
        
        // Wyślij ustawienia do API
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        alert('Ustawienia zostały zapisane!');
        
        // Odśwież widok tygodnia
        renderWeekView();
    } catch (error) {
        console.error('Error saving settings:', error);
        
        // W trybie offline symulujemy zapisanie
        alert('Symulacja: Ustawienia zostały zapisane (tryb offline).');
        
        // Odśwież widok tygodnia
        renderWeekView();
    }
}

// Obsługa dodawania użytkownika
async function handleAddUser(event) {
    event.preventDefault();
    
    try {
        const userData = {
            name: document.getElementById('user-name').value,
            department_id: document.getElementById('user-department').value,
            permission: document.getElementById('user-permission').value
        };
        
        // Sprawdź dane
        if (!userData.name || !userData.department_id) {
            alert('Wypełnij wszystkie wymagane pola.');
            return;
        }
        
        // Dodaj użytkownika do API
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        // Dodaj informacje o dziale
        const department = departments.find(d => d.id.toString() === userData.department_id);
        
        // Dodaj użytkownika do lokalnej tablicy
        const newUser = {
            id: result.id,
            name: userData.name,
            department_id: userData.department_id,
            department_name: department ? department.name : 'Nieznany',
            department_color: department ? department.color : '#ccc',
            permission: userData.permission
        };
        
        users.push(newUser);
        
        // Resetuj formularz
        document.getElementById('user-name').value = '';
        document.getElementById('user-department').value = '';
        document.getElementById('user-permission').value = 'editor';
        
        // Odśwież widoki
        renderUsersList();
        populateUserSelects();
        populateFilterSelects();
        
        alert('Użytkownik został dodany pomyślnie!');
    } catch (error) {
        console.error('Error adding user:', error);
        
        // W trybie offline symulujemy dodanie
        const userData = {
            name: document.getElementById('user-name').value,
            department_id: document.getElementById('user-department').value,
            permission: document.getElementById('user-permission').value
        };
        
        // Dodaj informacje o dziale
        const department = departments.find(d => d.id.toString() === userData.department_id);
        
        // Dodaj użytkownika do lokalnej tablicy
        const newUser = {
            id: Date.now(), // generowanie ID
            name: userData.name,
            department_id: userData.department_id,
            department_name: department ? department.name : 'Nieznany',
            department_color: department ? department.color : '#ccc',
            permission: userData.permission
        };
        
        users.push(newUser);
        
        // Resetuj formularz
        document.getElementById('user-name').value = '';
        document.getElementById('user-department').value = '';
        document.getElementById('user-permission').value = 'editor';
        
        // Odśwież widoki
        renderUsersList();
        populateUserSelects();
        populateFilterSelects();
        
        alert('Symulacja: Użytkownik został dodany (tryb offline).');
    }
}

// Obsługa dodawania działu
async function handleAddDepartment(event) {
    event.preventDefault();
    
    try {
        const departmentData = {
            name: document.getElementById('department-name').value,
            color: document.getElementById('department-color').value || '#3498db'
        };
        
        // Sprawdź dane
        if (!departmentData.name) {
            alert('Podaj nazwę działu.');
            return;
        }
        
        // Dodaj dział do API
        const response = await fetch('/api/departments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(departmentData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        // Dodaj dział do lokalnej tablicy
        const newDepartment = {
            id: result.id,
            name: departmentData.name,
            color: departmentData.color
        };
        
        departments.push(newDepartment);
        
        // Resetuj formularz
        document.getElementById('department-name').value = '';
        
        // Odśwież widoki
        renderDepartmentsList();
        populateDepartmentSelect();
        populateFilterSelects();
        
        alert('Dział został dodany pomyślnie!');
    } catch (error) {
        console.error('Error adding department:', error);
        
        // W trybie offline symulujemy dodanie
        const departmentData = {
            name: document.getElementById('department-name').value,
            color: document.getElementById('department-color').value || '#3498db'
        };
        
        // Dodaj dział do lokalnej tablicy
        const newDepartment = {
            id: Date.now(), // generowanie ID
            name: departmentData.name,
            color: departmentData.color
        };
        
        departments.push(newDepartment);
        
        // Resetuj formularz
        document.getElementById('department-name').value = '';
        
        // Odśwież widoki
        renderDepartmentsList();
        populateDepartmentSelect();
        populateFilterSelects();
        
        alert('Symulacja: Dział został dodany (tryb offline).');
    }
}

// Obsługa zmian w filtrach
function handleFilterChange() {
    // Pobierz wartości filtrów
    filters.department = filterDepartment.value;
    filters.user = filterUser.value;
    
    // Odśwież widok
    renderWeekView();
}

// Obsługa wyszukiwania zadań
function handleTaskSearch() {
    // Aktualizuj wartość filtra wyszukiwania
    filters.taskSearch = taskSearch.value;
    
    // Odśwież listę dostępnych zadań
    renderAvailableTasks();
}

// Wyczyść wszystkie filtry
function clearAllFilters() {
    // Resetuj wartości w interfejsie
    filterDepartment.value = '';
    filterUser.value = '';
    taskSearch.value = '';
    
    // Resetuj wartości w obiekcie filtrów
    filters.department = '';
    filters.user = '';
    filters.taskSearch = '';
    
    // Odśwież widok
    renderWeekView();
    renderAvailableTasks();
}

// ====== API Functions ======

// Przykładowe dane dla trybu offline
const sampleDepartments = [
    { id: 1, name: 'Account', color: '#3498db' },
    { id: 2, name: 'Creative', color: '#2ecc71' },
    { id: 3, name: 'Design', color: '#f39c12' },
    { id: 4, name: 'Content', color: '#9b59b6' },
    { id: 5, name: 'Development', color: '#e74c3c' }
];

const sampleUsers = [
    { id: 1, name: 'Anna Kowalska', department_id: 1, department_name: 'Account', department_color: '#3498db', permission: 'admin' },
    { id: 2, name: 'Jan Nowak', department_id: 2, department_name: 'Creative', department_color: '#2ecc71', permission: 'editor' },
    { id: 3, name: 'Tomasz Wiśniewski', department_id: 3, department_name: 'Design', department_color: '#f39c12', permission: 'editor' },
    { id: 4, name: 'Monika Lewandowska', department_id: 4, department_name: 'Content', department_color: '#9b59b6', permission: 'editor' },
    { id: 5, name: 'Piotr Zieliński', department_id: 5, department_name: 'Development', department_color: '#e74c3c', permission: 'editor' }
];

const sampleTasks = [
    { 
        id: 1, 
        priority: 1, 
        client: 'Acme Corp', 
        brand: 'SuperBrand', 
        task_description: 'Kampania social media', 
        account_id: 1, 
        account_name: 'Anna Kowalska', 
        leader_id: 2, 
        leader_name: 'Jan Nowak', 
        estimated_time: 4, 
        notes: 'Ważny klient, trzeba się postarać', 
        links: 'https://example.com', 
        assigned_to: null, 
        assigned_day: null, 
        week_number: null 
    },
    { 
        id: 2, 
        priority: 2, 
        client: 'Big Company', 
        brand: 'MegaProduct', 
        task_description: 'Nowa grafika produktowa', 
        account_id: 1, 
        account_name: 'Anna Kowalska', 
        leader_id: 3, 
        leader_name: 'Tomasz Wiśniewski', 
        estimated_time: 6, 
        notes: 'Potrzebne do 15-go', 
        links: '', 
        assigned_to: null, 
        assigned_day: null, 
        week_number: null 
    },
    { 
        id: 3, 
        priority: 3, 
        client: 'Tech Solutions', 
        brand: 'TechApp', 
        task_description: 'Poprawki w treści strony', 
        account_id: 1, 
        account_name: 'Anna Kowalska', 
        leader_id: 4, 
        leader_name: 'Monika Lewandowska', 
        estimated_time: 2, 
        notes: '', 
        links: '', 
        assigned_to: null, 
        assigned_day: null, 
        week_number: null 
    }
];

async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        
        // Jeśli mamy już dane w pamięci, używamy ich
        if (tasks.length > 0) {
            console.log('Using existing tasks data from memory');
            return tasks;
        }
        
        // W przeciwnym razie używamy przykładowych danych
        console.log('Używam przykładowych danych dla zadań');
        return sampleTasks;
    }
}

async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        
        // Jeśli mamy już dane w pamięci, używamy ich
        if (users.length > 0) {
            console.log('Using existing users data from memory');
            return users;
        }
        
        // W przeciwnym razie używamy przykładowych danych
        console.log('Używam przykładowych danych dla użytkowników');
        return sampleUsers;
    }
}

async function fetchDepartments() {
    try {
        const response = await fetch('/api/departments');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching departments:', error);
        
        // Jeśli mamy już dane w pamięci, używamy ich
        if (departments.length > 0) {
            console.log('Using existing departments data from memory');
            return departments;
        }
        
        // W przeciwnym razie używamy przykładowych danych
        console.log('Używam przykładowych danych dla działów');
        return sampleDepartments;
    }
}

async function fetchSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching settings:', error);
        
        // Jeśli mamy już dane w pamięci, używamy ich
        if (settings && Object.keys(settings).length > 0) {
            console.log('Using existing settings data from memory');
            return settings;
        }
        
        // W przeciwnym razie używamy przykładowych danych
        console.log('Używam przykładowych ustawień');
        return {
            yellow_threshold: 4,
            green_threshold_min: 4,
            green_threshold_max: 6,
            orange_threshold_min: 6,
            orange_threshold_max: 8,
            show_full_week: 'workdays',
            yellow_color: '#FFEB3B',
            green_color: '#4CAF50', 
            green_max_color: '#8BC34A',
            orange_color: '#FF9800',
            orange_max_color: '#FF5722',
            red_color: '#F44336'
        };
    }
}

async function addTask(taskData) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
}

async function updateTask(taskId, taskData) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
}

async function updateTaskAssignment(taskId, assignmentData) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/assign`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        
        if (!response.ok && response.status !== 404) {
            // Obsługa błędów poza 404 (które mogą wynikać z braku serwera)
            const errorData = await response.json();
            return { 
                success: false, 
                message: errorData.message || 'Błąd aktualizacji przypisania' 
            };
        }
        
        // Próba odczytania odpowiedzi JSON
        try {
            const data = await response.json();
            return data;
        } catch (jsonError) {
            // Jeśli nie możemy odczytać JSON, prawdopodobnie serwer nie działa
            console.log('Nie można odczytać odpowiedzi JSON, zakładam tryb offline');
            return { 
                success: true, 
                offline: true, 
                message: 'Zadanie zostało przypisane (tryb offline)' 
            };
        }
    } catch (error) {
        console.error('Błąd podczas aktualizacji przypisania zadania:', error);
        // W przypadku całkowitego braku połączenia, zwracamy sukces ale z flagą offline
        return { 
            success: true, 
            offline: true, 
            message: 'Zadanie zostało przypisane (tryb offline)' 
        };
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}

// ====== Inicjalizacja aplikacji ======

// Funkcja do inicjalizacji colorPickerów
function initColorPickers() {
    const pickrOptions = {
        el: null,
        theme: 'classic',
        default: '#000000',
        swatches: [
            '#f39c12', // yellow
            '#2ecc71', // green
            '#ff9800', // orange
            '#e74c3c', // red
            '#3498db', // blue
            '#9b59b6', // purple
            '#1abc9c', // teal
            '#34495e'  // dark
        ],
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                save: true
            }
        }
    };
    
    // Stwórz pickery kolorów dla ustawień
    if (document.getElementById('yellow-color-picker')) {
        const yellowPickr = Pickr.create({
            ...pickrOptions,
            el: '#yellow-color-picker',
            default: settings.yellowColor
        });
        colorPickers.yellow = yellowPickr;
        
        yellowPickr.on('save', (color) => {
            if (color) {
                settings.yellowColor = color.toHEXA().toString();
                updateStyleVariables();
            }
            yellowPickr.hide();
        });
    }
    
    if (document.getElementById('green-color-picker')) {
        const greenPickr = Pickr.create({
            ...pickrOptions,
            el: '#green-color-picker',
            default: settings.greenColor
        });
        colorPickers.green = greenPickr;
        
        greenPickr.on('save', (color) => {
            if (color) {
                settings.greenColor = color.toHEXA().toString();
                updateStyleVariables();
            }
            greenPickr.hide();
        });
        
        // Dodaj kolorpicker dla górnego progu zielonego
        if (document.getElementById('green-max-color-picker')) {
            const greenMaxPickr = Pickr.create({
                ...pickrOptions,
                el: '#green-max-color-picker',
                default: settings.greenColor
            });
            colorPickers.greenMax = greenMaxPickr;
            
            greenMaxPickr.on('save', (color) => {
                if (color) {
                    settings.greenMaxColor = color.toHEXA().toString();
                    updateStyleVariables();
                }
                greenMaxPickr.hide();
            });
        }
    }
    
    if (document.getElementById('orange-color-picker')) {
        const orangePickr = Pickr.create({
            ...pickrOptions,
            el: '#orange-color-picker',
            default: settings.orangeColor
        });
        colorPickers.orange = orangePickr;
        
        orangePickr.on('save', (color) => {
            if (color) {
                settings.orangeColor = color.toHEXA().toString();
                updateStyleVariables();
            }
            orangePickr.hide();
        });
    }
    
    if (document.getElementById('red-color-picker')) {
        const redPickr = Pickr.create({
            ...pickrOptions,
            el: '#red-color-picker',
            default: settings.redColor
        });
        colorPickers.red = redPickr;
        
        redPickr.on('save', (color) => {
            if (color) {
                settings.redColor = color.toHEXA().toString();
                updateStyleVariables();
            }
            redPickr.hide();
        });
    }
}

// Funkcja do inicjalizacji wyboru tygodnia (flatpickr)
function initWeekPicker() {
    if (document.getElementById('week-picker')) {
        weekPickr = flatpickr('#week-picker', {
            locale: 'pl',
            dateFormat: 'j.m.Y',
            mode: 'single',
            defaultDate: currentWeekDates[0],
            onChange: function(selectedDates, dateStr) {
                if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    const selectedWeek = getWeekNumber(selectedDate);
                    currentWeek = selectedWeek;
                    weekNumber.textContent = currentWeek;
                    updateWeekDates();
                    renderWeekView();
                }
            }
        });
    }
}

// Funkcja inicjalizująca elementy osi czasu
function initTimeAxis() {
    const timeAxisMaxValue = 12; // Maksymalna wartość godzin na osi
    const timeAxisWidth = document.querySelector('.time-axis-line').offsetWidth;
    
    // Ustaw początkowo pozycje suwaków na podstawie wartości
    updateThresholdPosition('yellow-threshold-point', settings.yellowThreshold, timeAxisMaxValue, timeAxisWidth);
    updateThresholdPosition('green-min-threshold-point', settings.greenThresholdMin, timeAxisMaxValue, timeAxisWidth);
    updateThresholdPosition('green-max-threshold-point', settings.greenThresholdMax, timeAxisMaxValue, timeAxisWidth);
    updateThresholdPosition('orange-min-threshold-point', settings.orangeThresholdMin, timeAxisMaxValue, timeAxisWidth);
    updateThresholdPosition('orange-max-threshold-point', settings.orangeThresholdMax, timeAxisMaxValue, timeAxisWidth);
    
    // Zaktualizuj szerokości stref kolorów
    updateColorZones(timeAxisMaxValue, timeAxisWidth);
    
    // Inicjalizuj przeciąganie suwaków
    initDraggableThreshold('yellow-threshold-point', 'yellow-threshold', timeAxisMaxValue, timeAxisWidth);
    initDraggableThreshold('green-min-threshold-point', 'green-threshold-min', timeAxisMaxValue, timeAxisWidth);
    initDraggableThreshold('green-max-threshold-point', 'green-threshold-max', timeAxisMaxValue, timeAxisWidth);
    initDraggableThreshold('orange-min-threshold-point', 'orange-threshold-min', timeAxisMaxValue, timeAxisWidth);
    initDraggableThreshold('orange-max-threshold-point', 'orange-threshold-max', timeAxisMaxValue, timeAxisWidth);
    
    // Podepnij zdarzenia do pól input, aby aktualizowały pozycje suwaków
    document.getElementById('yellow-threshold').addEventListener('change', function() {
        const value = parseFloat(this.value);
        settings.yellowThreshold = value;
        updateThresholdPosition('yellow-threshold-point', value, timeAxisMaxValue, timeAxisWidth);
        updateColorZones(timeAxisMaxValue, timeAxisWidth);
    });
    
    document.getElementById('green-threshold-min').addEventListener('change', function() {
        const value = parseFloat(this.value);
        settings.greenThresholdMin = value;
        updateThresholdPosition('green-min-threshold-point', value, timeAxisMaxValue, timeAxisWidth);
        updateColorZones(timeAxisMaxValue, timeAxisWidth);
    });
    
    document.getElementById('green-threshold-max').addEventListener('change', function() {
        const value = parseFloat(this.value);
        settings.greenThresholdMax = value;
        updateThresholdPosition('green-max-threshold-point', value, timeAxisMaxValue, timeAxisWidth);
        updateColorZones(timeAxisMaxValue, timeAxisWidth);
    });
    
    document.getElementById('orange-threshold-min').addEventListener('change', function() {
        const value = parseFloat(this.value);
        settings.orangeThresholdMin = value;
        updateThresholdPosition('orange-min-threshold-point', value, timeAxisMaxValue, timeAxisWidth);
        updateColorZones(timeAxisMaxValue, timeAxisWidth);
    });
    
    document.getElementById('orange-threshold-max').addEventListener('change', function() {
        const value = parseFloat(this.value);
        settings.orangeThresholdMax = value;
        updateThresholdPosition('orange-max-threshold-point', value, timeAxisMaxValue, timeAxisWidth);
        updateColorZones(timeAxisMaxValue, timeAxisWidth);
    });
}

// Aktualizuj pozycję suwaka progu na osi
function updateThresholdPosition(thresholdId, value, maxValue, axisWidth) {
    const position = (value / maxValue) * 100;
    const threshold = document.getElementById(thresholdId);
    if (threshold) {
        threshold.style.left = `${position}%`;
    }
}

// Aktualizuj strefy kolorów na osi
function updateColorZones(maxValue, axisWidth) {
    const yellowZone = document.getElementById('zone-yellow');
    const greenZone = document.getElementById('zone-green');
    const orangeZone = document.getElementById('zone-orange');
    const redZone = document.getElementById('zone-red');
    
    const yellowPos = (settings.yellowThreshold / maxValue) * 100;
    const greenMinPos = (settings.greenThresholdMin / maxValue) * 100;
    const greenMaxPos = (settings.greenThresholdMax / maxValue) * 100;
    const orangeMinPos = (settings.orangeThresholdMin / maxValue) * 100;
    const orangeMaxPos = (settings.orangeThresholdMax / maxValue) * 100;
    
    if (yellowZone) {
        yellowZone.style.width = `${yellowPos}%`;
    }
    
    if (greenZone) {
        greenZone.style.left = `${greenMinPos}%`;
        greenZone.style.width = `${greenMaxPos - greenMinPos}%`;
    }
    
    if (orangeZone) {
        orangeZone.style.left = `${orangeMinPos}%`;
        orangeZone.style.width = `${orangeMaxPos - orangeMinPos}%`;
    }
    
    if (redZone) {
        redZone.style.left = `${orangeMaxPos}%`;
        redZone.style.width = `${100 - orangeMaxPos}%`;
    }
}

// Inicjalizacja przeciągania suwaków progów
function initDraggableThreshold(thresholdId, inputId, maxValue, axisWidth) {
    const threshold = document.getElementById(thresholdId);
    const input = document.getElementById(inputId);
    
    if (!threshold) return;
    
    let isDragging = false;
    
    threshold.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault(); // Zapobiega zaznaczaniu tekstu
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const axisLine = document.querySelector('.time-axis-line');
        const rect = axisLine.getBoundingClientRect();
        
        // Oblicz pozycję względną w procentach
        let xPos = (e.clientX - rect.left) / rect.width;
        xPos = Math.max(0, Math.min(1, xPos)); // Ogranicz do zakresu 0-1
        
        // Zaktualizuj pozycję suwaka
        threshold.style.left = `${xPos * 100}%`;
        
        // Oblicz wartość dla inputa
        const value = Math.round((xPos * maxValue) * 2) / 2; // Zaokrąglij do 0.5
        input.value = value;
        
        // Zaktualizuj ustawienia
        if (inputId === 'yellow-threshold') {
            settings.yellowThreshold = value;
        } else if (inputId === 'green-threshold-min') {
            settings.greenThresholdMin = value;
        } else if (inputId === 'green-threshold-max') {
            settings.greenThresholdMax = value;
        } else if (inputId === 'orange-threshold-min') {
            settings.orangeThresholdMin = value;
        } else if (inputId === 'orange-threshold-max') {
            settings.orangeThresholdMax = value;
        }
        
        // Zaktualizuj strefy kolorów
        updateColorZones(maxValue, axisWidth);
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
        }
    });
}

// Obsługa wyboru dni tygodnia
function initWeekdaySelector() {
    const checkboxes = document.querySelectorAll('input[name="weekday"]');
    const dropdown = document.querySelector('.dropdown-toggle');
    
    // Zaktualizuj text przycisku na podstawie zaznaczonych dni
    function updateButtonText() {
        const checked = Array.from(checkboxes).filter(cb => cb.checked);
        
        if (checked.length === 7) {
            dropdown.innerHTML = 'Wszystkie dni <i class="fas fa-caret-down"></i>';
        } else if (checked.length === 5 && 
                 Array.from(checkboxes).slice(0, 5).every(cb => cb.checked) && 
                 Array.from(checkboxes).slice(5).every(cb => !cb.checked)) {
            dropdown.innerHTML = 'Dni robocze <i class="fas fa-caret-down"></i>';
        } else if (checked.length === 0) {
            dropdown.innerHTML = 'Brak dni <i class="fas fa-caret-down"></i>';
        } else {
            const days = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd'];
            const selectedDays = checked.map(cb => days[parseInt(cb.value) - 1]).join(', ');
            dropdown.innerHTML = `${selectedDays} <i class="fas fa-caret-down"></i>`;
        }
        
        // Zaktualizuj ustawienia aplikacji
        settings.selectedDays = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
    }
    
    // Inicjalizuj wartości na podstawie aktualnych ustawień
    if (settings.selectedDays && settings.selectedDays.length > 0) {
        checkboxes.forEach(cb => {
            cb.checked = settings.selectedDays.includes(parseInt(cb.value));
        });
    } else if (settings.showFullWeek === 'fullweek') {
        checkboxes.forEach(cb => cb.checked = true);
    } else {
        // Domyślnie dni robocze
        checkboxes.forEach(cb => {
            const day = parseInt(cb.value);
            cb.checked = day >= 1 && day <= 5;
        });
    }
    
    updateButtonText();
    
    // Podepnij zdarzenia zmiany
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateButtonText);
    });
}

// Funkcja dodająca przyciski podziału zadań i uchwyty do rozszerzania
function enhanceTaskItems() {
    document.querySelectorAll('.task-item').forEach(taskItem => {
        // Sprawdź, czy nie dodano już funkcjonalności
        if (taskItem.querySelector('.task-split-button') || 
            taskItem.closest('.tasks-list')) return;
        
        // Dodaj przycisk podziału
        const splitButton = document.createElement('div');
        splitButton.className = 'task-split-button';
        splitButton.innerHTML = '+';
        splitButton.title = 'Podziel zadanie';
        taskItem.appendChild(splitButton);
        
        // Dodaj uchwyt do rozszerzania
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'task-resize-handle';
        resizeHandle.title = 'Przeciągnij, aby rozszerzyć zadanie';
        taskItem.appendChild(resizeHandle);
        
        // Obsługa podziału zadania
        splitButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleTaskSplit(taskItem);
        });
        
        // Obsługa rozszerzania zadania
        initTaskResizeHandle(taskItem, resizeHandle);
    });
}

// Obsługa podziału zadania
function handleTaskSplit(taskItem) {
    const taskId = taskItem.dataset.taskId;
    const task = tasks.find(t => t.id.toString() === taskId);
    
    if (!task) return;
    
    // Pokaż okno dialogowe do podziału czasu
    const totalTime = task.estimated_time;
    const firstPartTime = prompt(`Podaj czas pierwszej części zadania (max: ${totalTime}h):`, Math.round(totalTime / 2));
    
    if (firstPartTime === null) return; // Anulowano
    
    const firstTime = parseFloat(firstPartTime);
    if (isNaN(firstTime) || firstTime <= 0 || firstTime >= totalTime) {
        alert('Podaj prawidłową wartość czasu (większą od 0 i mniejszą od całkowitego czasu zadania).');
        return;
    }
    
    const secondTime = totalTime - firstTime;
    
    // Zaktualizuj oryginalne zadanie
    const originalTaskIndex = tasks.findIndex(t => t.id.toString() === taskId);
    if (originalTaskIndex === -1) return;
    
    tasks[originalTaskIndex].estimated_time = firstTime;
    
    // Utwórz nowe zadanie (kopię)
    const newTask = { ...task };
    newTask.id = Date.now(); // Generowanie unikalnego ID
    newTask.estimated_time = secondTime;
    newTask.assigned_to = null;
    newTask.assigned_day = null;
    newTask.week_number = null;
    newTask.original_task_id = task.id; // Referencja do oryginalnego zadania
    
    // Dodaj do tablicy zadań
    tasks.push(newTask);
    
    // Odśwież widok
    renderWeekView();
    
    // Wyślij aktualizacje do API (jeśli serwer działa)
    try {
        // Aktualizacja oryginalnego zadania
        updateTask(task.id, tasks[originalTaskIndex])
            .then(() => console.log('Zaktualizowano oryginalne zadanie'))
            .catch(err => console.error('Błąd aktualizacji oryginalnego zadania:', err));
        
        // Dodanie nowego zadania
        addTask(newTask)
            .then(response => {
                newTask.id = response.id;
                console.log('Dodano nowe zadanie z ID:', response.id);
            })
            .catch(err => console.error('Błąd dodawania nowego zadania:', err));
    } catch (error) {
        console.log('Działanie w trybie offline - zmiany zapisane lokalnie');
    }
}

// Inicjalizacja uchwytu do rozszerzania zadania
function initTaskResizeHandle(taskItem, resizeHandle) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let cellWidth = 0;
    let currentDay = 0;
    let maxDays = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizing = true;
        
        // Pobierz aktualną szerokość i dzień
        const cell = taskItem.closest('.schedule-cell');
        if (!cell) return;
        
        currentDay = parseInt(cell.dataset.day);
        cellWidth = cell.offsetWidth;
        startX = e.clientX;
        startWidth = taskItem.offsetWidth;
        
        // Określ maksymalną liczbę dni na podstawie ustawień
        maxDays = settings.selectedDays ? settings.selectedDays.length : 
                  (settings.showFullWeek === 'fullweek' ? 7 : 5);
        
        // Dodaj klasy do zadania
        taskItem.classList.add('resizing');
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const diffX = e.clientX - startX;
        let newWidth = startWidth + diffX;
        
        // Oblicz, ile dni zadanie zajmuje
        const daySpan = Math.ceil(newWidth / cellWidth);
        const maxWidth = Math.min(daySpan, maxDays - currentDay + 1) * cellWidth - 10;
        
        // Ogranicz szerokość
        newWidth = Math.max(cellWidth - 10, Math.min(newWidth, maxWidth));
        
        // Ustaw szerokość
        taskItem.style.width = `${newWidth}px`;
        
        // Dodaj klasę dla zadania wielodniowego
        if (newWidth > cellWidth - 10) {
            taskItem.classList.add('multi-day');
        } else {
            taskItem.classList.remove('multi-day');
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        
        isResizing = false;
        
        // Pobierz nową szerokość i oblicz liczbę dni
        const newWidth = taskItem.offsetWidth;
        const daySpan = Math.ceil(newWidth / cellWidth);
        
        // Aktualizuj dane zadania
        const taskId = taskItem.dataset.taskId;
        const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
        
        if (taskIndex === -1) return;
        
        const task = tasks[taskIndex];
        task.day_span = daySpan;
        
        // Usuń klasę resizing
        taskItem.classList.remove('resizing');
        
        // Wyślij aktualizację do API
        try {
            updateTask(task.id, task)
                .then(() => console.log('Zaktualizowano zadanie z nowymi dniami'))
                .catch(err => console.error('Błąd aktualizacji zadania:', err));
        } catch (error) {
            console.log('Działanie w trybie offline - zmiany zapisane lokalnie');
        }
        
        // Odśwież widok
        renderWeekView();
    });
}

// Funkcja inicjalizująca aplikację
async function initApp() {
    try {
        // Pobierz dane z API
        await Promise.all([
            fetchDepartments(),
            fetchUsers(),
            fetchSettings(),
            fetchTasks()
        ]);
        
        // Ustaw style kolorów
        updateStyleVariables();
        
        // Zainicjuj selektor tygodnia
        initWeekPicker();
        
        // Zainicjuj pickery kolorów
        initColorPickers();
        
        // Zainicjuj oś czasu
        initTimeAxis();
        
        // Zainicjuj selektor dni tygodnia
        initWeekdaySelector();
        
        // Ustaw nasłuchiwacze zdarzeń
        setupEventListeners();
        
        // Ustaw początkowy widok
        showSection(addTaskSection);
        
        // Wypełnij pola select
        populateUserSelects();
        populateFilterSelects();
        
        // Aktualizuj datę i numer tygodnia
        weekNumber.textContent = currentWeek;
        updateWeekDates();
        
        // Dodaj sprawdzanie połączenia
        setupConnectionChecker();
        
        console.log('Aplikacja zainicjalizowana pomyślnie');
    } catch (error) {
        console.error('Błąd inicjalizacji aplikacji:', error);
    }
}

// Uruchom inicjalizację po załadowaniu DOMu
document.addEventListener('DOMContentLoaded', initApp);

// Renderuj listę działów w ustawieniach
function renderDepartmentsList() {
    if (!departmentsListBody) return;
    
    departmentsListBody.innerHTML = '';
    
    departments.forEach(dept => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${dept.name}</td>
            <td class="department-color-cell">
                <span class="color-preview" style="background-color: ${dept.color}"></span>
                ${dept.color}
            </td>
            <td>
                <button class="edit-dept-btn" data-dept-id="${dept.id}">Edytuj</button>
            </td>
        `;
        
        departmentsListBody.appendChild(row);
        
        // Dodaj obsługę przycisku edycji
        const editBtn = row.querySelector('.edit-dept-btn');
        editBtn.addEventListener('click', () => {
            openDepartmentEditModal(dept);
        });
    });
}

// Renderuj listę użytkowników w ustawieniach
function renderUsersList() {
    if (!usersListBody) return;
    
    usersListBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const deptColor = user.department_color || '#ccc';
        
        row.innerHTML = `
            <td>${user.name}</td>
            <td style="background-color: ${deptColor}20; border-left: 3px solid ${deptColor}">
                ${user.department_name}
            </td>
            <td>${getUserPermissionLabel(user.permission)}</td>
            <td>
                <button class="edit-user-btn" data-user-id="${user.id}">Edytuj</button>
                <button class="delete-user-btn delete-btn" data-user-id="${user.id}">Usuń</button>
            </td>
        `;
        
        usersListBody.appendChild(row);
        
        // Dodaj obsługę przycisków
        const editBtn = row.querySelector('.edit-user-btn');
        const deleteBtn = row.querySelector('.delete-user-btn');
        
        editBtn.addEventListener('click', () => {
            openUserEditModal(user);
        });
        
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Czy na pewno chcesz usunąć użytkownika ${user.name}?`)) {
                deleteUser(user.id);
            }
        });
    });
}

// Funkcja pomocnicza do wyświetlania etykiet uprawnień
function getUserPermissionLabel(permission) {
    switch (permission) {
        case 'admin': return 'Administrator';
        case 'editor': return 'Edytor';
        case 'viewer': return 'Przeglądający';
        default: return 'Nieznane';
    }
}

// Obsługa otwierania modala edycji działu
function openDepartmentEditModal(dept) {
    currentEditingDept = dept;
    
    // Ustaw wartości formularza
    document.getElementById('edit-department-name').value = dept.name;
    
    // Ustaw kolor pickera
    if (editDepartmentPicker) {
        editDepartmentPicker.setColor(dept.color);
    } else {
        // Inicjalizuj picker, jeśli jeszcze nie istnieje
        editDepartmentPicker = Pickr.create({
            el: '#edit-department-color-picker',
            theme: 'classic',
            default: dept.color,
            swatches: [
                '#f39c12', '#2ecc71', '#ff9800', '#e74c3c',
                '#3498db', '#9b59b6', '#1abc9c', '#34495e'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    save: true
                }
            }
        });
    }
    
    // Pokaż modal
    departmentEditModal.style.display = 'block';
}

// Obsługa otwierania modala edycji użytkownika
function openUserEditModal(user) {
    // Tu może być kod obsługi modala edycji użytkownika
    alert('Funkcja edycji użytkownika jeszcze nie zaimplementowana');
}

// Usuń użytkownika
async function deleteUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        // Usuń użytkownika z lokalnej tablicy
        users = users.filter(u => u.id.toString() !== userId.toString());
        
        // Odśwież widok
        renderUsersList();
        populateUserSelects();
        populateFilterSelects();
        
        alert('Użytkownik został usunięty.');
    } catch (error) {
        console.error('Error deleting user:', error);
        
        // W trybie offline tylko symulujemy usunięcie
        users = users.filter(u => u.id.toString() !== userId.toString());
        
        // Odśwież widok
        renderUsersList();
        populateUserSelects();
        populateFilterSelects();
        
        alert('Symulacja: Użytkownik został usunięty (tryb offline).');
    }
}

// Aktualizuje sumę czasów we wszystkich komórkach z uwzględnieniem zadań wielodniowych
function updateTaskTimesInCells() {
    // Dla każdej widocznej komórki w harmonogramie
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        // Pobierz wszystkie zadania w komórce
        const tasks = Array.from(cell.querySelectorAll('.task-item'));
        
        // Jeśli nie ma zadań, nie ma co aktualizować
        if (tasks.length === 0) return;
        
        // Oblicz sumę czasów wszystkich zadań
        let totalTime = 0;
        tasks.forEach(taskElem => {
            const taskId = taskElem.dataset.taskId;
            const task = window.tasks.find(t => t.id.toString() === taskId);
            
            if (task) {
                // Jeśli to zadanie wielodniowe, podziel czas proporcjonalnie
                if (task.day_span && task.day_span > 1) {
                    totalTime += parseFloat(task.estimated_time) / task.day_span;
                } else {
                    totalTime += parseFloat(task.estimated_time);
                }
            }
        });
        
        // Zaokrąglij czas do jednego miejsca po przecinku
        totalTime = Math.round(totalTime * 10) / 10;
        
        // Aktualizuj wskaźnik czasu
        const timeIndicator = cell.querySelector('.schedule-cell-time');
        if (timeIndicator) {
            timeIndicator.textContent = `${totalTime}h`;
        }
        
        // Aktualizuj kolor komórki
        updateCellColor(cell, totalTime);
    });
}

// Funkcja do usuwania przypisania zadania
async function unassignTask(taskId) {
    // Znajdź zadanie
    const taskIndex = tasks.findIndex(t => t.id.toString() === taskId.toString());
    if (taskIndex === -1) return;
    
    // Zapisz poprzednie wartości na wypadek niepowodzenia
    const prevAssignedTo = tasks[taskIndex].assigned_to;
    const prevAssignedDay = tasks[taskIndex].assigned_day;
    const prevWeekNumber = tasks[taskIndex].week_number;
    
    // Usuń przypisanie lokalnie
    tasks[taskIndex].assigned_to = null;
    tasks[taskIndex].assigned_day = null;
    tasks[taskIndex].week_number = null;
    
    // Odśwież widoki od razu
    renderWeekView();
    renderAvailableTasks();
    
    // Wyślij aktualizację do API
    try {
        const result = await updateTaskAssignment(taskId, {
            assigned_to: null,
            assigned_day: null,
            week_number: null
        });
        
        if (result.success) {
            console.log('Przypisanie zadania usunięte pomyślnie', result.offline ? '(tryb offline)' : '');
        } else {
            console.error('Błąd usuwania przypisania:', result.message);
            
            // Przywróć poprzednie dane tylko w przypadku faktycznego błędu (nie w trybie offline)
            if (!result.offline) {
                alert('Nie udało się usunąć przypisania zadania: ' + result.message);
                
                // Przywróć poprzedni stan
                tasks[taskIndex].assigned_to = prevAssignedTo;
                tasks[taskIndex].assigned_day = prevAssignedDay;
                tasks[taskIndex].week_number = prevWeekNumber;
                
                // Odśwież widoki
                renderWeekView();
                renderAvailableTasks();
            }
        }
    } catch (error) {
        console.error('Błąd podczas usuwania przypisania zadania:', error);
        alert('Wystąpił nieoczekiwany błąd podczas usuwania przypisania zadania.');
        
        // Przywróć poprzedni stan
        tasks[taskIndex].assigned_to = prevAssignedTo;
        tasks[taskIndex].assigned_day = prevAssignedDay;
        tasks[taskIndex].week_number = prevWeekNumber;
        
        // Odśwież widoki
        renderWeekView();
        renderAvailableTasks();
    }
}

// Funkcja wyświetlająca szczegóły zadania
function showTaskDetails(task) {
    const taskDetailModal = document.getElementById('task-detail-modal');
    if (!taskDetailModal) return;
    
    // Wypełnij modal danymi zadania
    const taskTitle = taskDetailModal.querySelector('.modal-title');
    const taskContent = taskDetailModal.querySelector('.modal-body');
    
    if (taskTitle && taskContent) {
        taskTitle.textContent = `${task.client} - ${task.brand}`;
        
        // Przygotuj informacje o użytkownikach
        const accountName = task.account_name || 'Brak';
        const leaderName = task.leader_name || 'Brak';
        const assignedName = task.assigned_name || 'Nie przypisano';
        
        // Przygotuj dane o przypisaniu
        let assignmentInfo = 'Nie przypisano';
        if (task.assigned_to) {
            const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
            assignmentInfo = `${assignedName} (${days[task.assigned_day]}, tydzień ${task.week_number})`;
        }
        
        taskContent.innerHTML = `
            <div class="task-details">
                <p><strong>Priorytet:</strong> ${task.priority}</p>
                <p><strong>Opis zadania:</strong> ${task.task_description}</p>
                <p><strong>Account:</strong> ${accountName}</p>
                <p><strong>Lider:</strong> ${leaderName}</p>
                <p><strong>Szacowany czas:</strong> ${task.estimated_time}h</p>
                <p><strong>Przypisanie:</strong> ${assignmentInfo}</p>
                ${task.notes ? `<p><strong>Notatki:</strong> ${task.notes}</p>` : ''}
                ${task.links ? `<p><strong>Linki:</strong> <a href="${task.links}" target="_blank">${task.links}</a></p>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn btn-primary btn-edit-task" data-task-id="${task.id}">Edytuj</button>
                <button class="btn btn-danger btn-delete-task" data-task-id="${task.id}">Usuń</button>
                ${task.assigned_to ? 
                    `<button class="btn btn-warning btn-unassign-task" data-task-id="${task.id}">Usuń przypisanie</button>` : 
                    ''}
            </div>
        `;
        
        // Dodaj obsługę przycisków
        const editBtn = taskContent.querySelector('.btn-edit-task');
        const deleteBtn = taskContent.querySelector('.btn-delete-task');
        const unassignBtn = taskContent.querySelector('.btn-unassign-task');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                taskDetailModal.style.display = 'none';
                // Tu powinno być wywołanie funkcji do edycji zadania
                // openTaskEditModal(task);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Czy na pewno chcesz usunąć zadanie "${task.task_description}"?`)) {
                    deleteTask(task.id)
                        .then(() => {
                            // Usuń zadanie z lokalnej tablicy
                            tasks = tasks.filter(t => t.id !== task.id);
                            // Odśwież widoki
                            renderWeekView();
                            renderAvailableTasks();
                            // Zamknij modal
                            taskDetailModal.style.display = 'none';
                        })
                        .catch(error => {
                            console.error('Błąd usuwania zadania:', error);
                            alert('Nie udało się usunąć zadania.');
                        });
                }
            });
        }
        
        if (unassignBtn) {
            unassignBtn.addEventListener('click', () => {
                unassignTask(task.id);
                // Zamknij modal
                taskDetailModal.style.display = 'none';
            });
        }
    }
    
    // Pokaż modal
    taskDetailModal.style.display = 'block';
}

// Funkcja sprawdzająca połączenie z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
            // W przypadku błędu sieciowego zapisz zmianę offline
            if (error.message.includes('Failed to fetch')) {
                addOfflineChange(url, method, data);
                resolve({ success: true, offline: true });
            } else {
                reject(error);
            }
        });
    });
}

// Funkcja synchronizująca zmiany dokonane offline
function syncOfflineChanges() {
    // Pobierz dane z localStorage
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    console.log(`Synchronizowanie ${offlineChanges.length} zmian offline`);
    
    // Iteracja przez zmiany i wysyłanie ich do serwera
    const promises = offlineChanges.map(change => {
        return new Promise((resolve, reject) => {
            const { url, method, data } = change;
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Zsynchronizowano: ${method} ${url}`);
                resolve(true);
            })
            .catch(error => {
                console.error(`Błąd synchronizacji: ${method} ${url}`, error);
                reject(error);
            });
        });
    });
    
    // Po zakończeniu wszystkich synchronizacji, wyczyść bufor zmian offline
    Promise.allSettled(promises)
        .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Zsynchronizowano ${successful} z ${offlineChanges.length} zmian`);
            
            // Usuń zsynchronizowane zmiany
            localStorage.setItem('offlineChanges', JSON.stringify([]));
            
            // Odśwież dane
            loadAllData();
        });
    
    // Sprawdź również stare formaty danych
    saveLocalDataToServer();
}

// Funkcja do synchronizacji danych w starym formacie
function saveLocalDataToServer() {
    if (navigator.onLine) {
        // Synchronizacja tasków
        if (localStorage.getItem('pendingTasks')) {
            try {
                const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks'));
                pendingTasks.forEach(task => {
                    fetch('/api/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task)
                    }).then(response => {
                        if (response.ok) {
                            console.log('Zadanie zsynchronizowane:', task.title);
                        }
                    }).catch(err => console.error('Błąd synchronizacji zadania:', err));
                });
                localStorage.removeItem('pendingTasks');
            } catch (e) {
                console.error('Błąd parsowania pendingTasks:', e);
            }
        }
        
        // Synchronizacja ustawień
        if (localStorage.getItem('pendingSettings')) {
            try {
                const pendingSettings = JSON.parse(localStorage.getItem('pendingSettings'));
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingSettings)
                }).then(response => {
                    if (response.ok) {
                        console.log('Ustawienia zsynchronizowane');
                        localStorage.removeItem('pendingSettings');
                    }
                }).catch(err => console.error('Błąd synchronizacji ustawień:', err));
            } catch (e) {
                console.error('Błąd parsowania pendingSettings:', e);
            }
        }
    }
}

// Sprawdzanie połączenia z serwerem
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Dodaj regularne sprawdzanie połączenia z serwerem
function setupConnectionChecker() {
    let isOnline = navigator.onLine;
    
    // Sprawdzaj co 30 sekund
    setInterval(async () => {
        const serverAvailable = await checkServerConnection();
        
        // Jeśli zmienia się stan połączenia
        if (serverAvailable !== isOnline) {
            isOnline = serverAvailable;
            
            if (isOnline) {
                console.log('Przywrócono połączenie z serwerem. Odświeżam dane...');
                hideOfflineNotification();
                // Odśwież dane z serwera
                await refreshDataFromServer();
                syncOfflineChanges();
            } else {
                console.log('Utracono połączenie z serwerem. Przechodzę w tryb offline.');
                showOfflineNotification();
            }
        }
    }, 30000); // Co 30 sekund
}

// Nasłuchiwanie zdarzeń zmiany stanu połączenia
window.addEventListener('online', function() {
    hideOfflineNotification();
    console.log('Przywrócono połączenie z internetem');
    syncOfflineChanges();
});

window.addEventListener('offline', function() {
    showOfflineNotification();
    console.log('Utracono połączenie z internetem, przełączam na tryb offline');
});

// Inicjalizacja aplikacji
async function initApp() {
    await loadAllData();
    setupEventListeners();
    setupConnectionChecker();
    
    // Inicjalizacja obsługi powiadomień offline
    const closeBtn = document.querySelector('#offline-notification .notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideOfflineNotification);
    }
    
    console.log('Aplikacja zainicjalizowana pomyślnie');
}

// Inicjalizacja aplikacji przy załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź stan połączenia przy załadowaniu
    if (!navigator.onLine) {
        showOfflineNotification();
    }
    
    // Inicjalizacja aplikacji
    initApp();
});

// ... existing code ...

// Usuń wszystkie zduplikowane funkcje związane z trybem offline i dodaj jedną implementację
// Usuń showOfflineNotification, hideOfflineNotification, syncOfflineChanges, saveLocalDataToServer,
// setupConnectionChecker, addEventListener('online'), addEventListener('offline')
// I dodaj nowe implementacje

// Poniższy kod zastępuje wszystkie dotychczasowe implementacje funkcji offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(0)';
    }
}

function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
    }
}

// Funkcja dodająca zmianę do bufora offline
function addOfflineChange(url, method, data) {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    offlineChanges.push({ url, method, data, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineChanges', JSON.stringify(offlineChanges));
    console.log(`Dodano zmianę offline: ${method} ${url}`);
}

// Funkcja do wysyłania danych do API z obsługą offline
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            console.log(`Tryb offline: ${method} ${url}`);
            addOfflineChange(url, method, data);
            resolve({ success: true, offline: true });
            return;
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            resolve(result);
        })
        .catch(error => {
            console.error(`API error: ${method} ${url}`, error);
            
    // ... existing code ...
}); 