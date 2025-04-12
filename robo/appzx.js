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
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    
    // Dodaj event listenery dla przeciągania
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
    
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
            <div class="task-item-details">${task.task_description.substring(0, 30)}${task.task_description.length > 30 ? '...' : ''}</div>
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
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showTaskDetails(task);
        });
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
    while (!cell.classList.contains('schedule-cell') && cell.parentElement) {
        cell = cell.parentElement;
    }
    
    if (!cell.classList.contains('schedule-cell')) return;
    
    // Zaktualizuj przypisanie zadania
    const userId = cell.dataset.userId;
    const day = cell.dataset.day;
    
    const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
    if (taskIndex === -1) return;
    
    // Zapisz lokalne dane
    tasks[taskIndex].assigned_to = userId;
    tasks[taskIndex].assigned_day = day;
    tasks[taskIndex].week_number = currentWeek;
    
    // Wyślij aktualizację do API
    updateTaskAssignment(taskId, {
        assigned_to: userId,
        assigned_day: day,
        week_number: currentWeek
    }).then(() => {
        console.log('Zadanie przypisane pomyślnie');
    }).catch(error => {
        console.error('Błąd przypisania zadania:', error);
        alert('Nie udało się przypisać zadania.');
    });
    
    // Odśwież widok
    renderWeekView();
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

// Funkcja do pobierania zadań z API
function fetchTasks() {
    console.log('Pobieranie zadań z API...');
    return apiRequest('GET', '/api/tasks')
        .then(response => response.json())
        .then(fetchedTasks => {
            console.log('Pobrano zadania:', fetchedTasks);
            tasks = fetchedTasks;
            return tasks;
        })
        .catch(error => {
            console.error('Błąd podczas pobierania zadań:', error);
            return tasks || [];
        });
}

// Funkcja do pobierania użytkowników z API
function fetchUsers() {
    console.log('Pobieranie użytkowników z API...');
    return apiRequest('GET', '/api/users')
        .then(response => response.json())
        .then(fetchedUsers => {
            console.log('Pobrano użytkowników:', fetchedUsers);
            users = fetchedUsers;
            return users;
        })
        .catch(error => {
            console.error('Błąd podczas pobierania użytkowników:', error);
            return users || [];
        });
}

// Funkcja do pobierania działów z API
function fetchDepartments() {
    console.log('Pobieranie działów z API...');
    return apiRequest('GET', '/api/departments')
        .then(response => response.json())
        .then(fetchedDepartments => {
            console.log('Pobrano działy:', fetchedDepartments);
            departments = fetchedDepartments;
            return departments;
        })
        .catch(error => {
            console.error('Błąd podczas pobierania działów:', error);
            return departments || [];
        });
}

// Funkcja do pobierania ustawień z API
function fetchSettings() {
    console.log('Pobieranie ustawień z API...');
    return apiRequest('GET', '/api/settings')
        .then(response => response.json())
        .then(fetchedSettings => {
            console.log('Pobrano ustawienia:', fetchedSettings);
            settings = fetchedSettings;
            
            // Zapisz ustawienia w localStorage
            localStorage.setItem('settings', JSON.stringify(settings));
            
            // Zaktualizuj zmienne CSS
            updateCSSVariables();
            
            return settings;
        })
        .catch(error => {
            console.error('Błąd podczas pobierania ustawień:', error);
            return settings || getDefaultSettings();
        });
}

async function fetchSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data && Object.keys(data).length > 0) {
            // Aktualizuj lokalne ustawienia z danymi z serwera
            settings = {
                ...settings,  // Zachowaj domyślne wartości jako fallback
                ...data       // Nadpisz wartościami z serwera
            };
        }
        
        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        // W przypadku błędu użyj domyślnych ustawień
        return settings;
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
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating task assignment:', error);
        throw error;
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
document.addEventListener('DOMContentLoaded', function() {
    // Inicjalizacja aplikacji
    init();
});

// Inicjalizacja aplikacji
function init() {
    console.log('Inicjalizacja aplikacji...');
    
    // Sprawdź połączenie z serwerem przed rozpoczęciem
    checkServerConnection()
        .then(isConnected => {
            if (isConnected) {
                console.log('Połączenie z serwerem OK - pobieram dane...');
                hideOfflineNotification();
            } else {
                console.log('Brak połączenia z serwerem - używam danych lokalnych');
                showOfflineNotification();
                loadSampleData();
            }
            
            // Ładowanie ustawień
            loadSettings();
            
            // Pobieranie danych (lub użycie danych lokalnych jeśli brak połączenia)
            return Promise.all([
                isConnected ? fetchDepartments() : Promise.resolve(departments),
                isConnected ? fetchUsers() : Promise.resolve(users),
                isConnected ? fetchTasks() : Promise.resolve(tasks)
            ]);
        })
        .then(() => {
            // Inicjalizacja UI po załadowaniu danych
            setupEventListeners();
            initializationTimeline();
            updateDateDisplay();
            
            // Renderowanie widoków
            renderWeekView();
            renderUsersList();
            renderDepartmentsList();
            renderAvailableTasks();
            
            // Usuwanie loadera
            hideLoader();
            
            // Pokaż domyślną sekcję
            showSection('week-view');
            
            // Dodaj nasłuchiwanie na zdarzenia sieciowe
            setupNetworkListeners();
            
            // Ustaw cykliczne odświeżanie danych
            setupDataRefresh();
            
            console.log('Inicjalizacja zakończona!');
        })
        .catch(error => {
            console.error('Błąd podczas inicjalizacji aplikacji:', error);
            
            // Nawet w przypadku błędu inicjalizacji, pokaż UI z danymi próbnymi
            hideLoader();
            loadSampleData();
            setupEventListeners();
            renderWeekView();
            renderUsersList();
            renderDepartmentsList();
            renderAvailableTasks();
            showSection('week-view');
        });
}

// Funkcja sprawdzająca połączenie z serwerem
function checkServerConnection() {
    return fetch('/api/health', { method: 'GET', cache: 'no-store' })
        .then(response => {
            return response.ok;
        })
        .catch(() => {
            return false;
        });
}

// Funkcja ustawiająca cykliczne odświeżanie danych
function setupDataRefresh() {
    // Odświeżaj dane co 5 minut, jeśli użytkownik jest online
    setInterval(() => {
        if (navigator.onLine) {
            console.log('Automatyczne odświeżanie danych...');
            Promise.all([
                fetchDepartments(),
                fetchUsers(),
                fetchTasks()
            ]).then(() => {
                // Odśwież widoki
                renderWeekView();
                renderUsersList();
                renderDepartmentsList();
                renderAvailableTasks();
            }).catch(error => {
                console.error('Błąd podczas odświeżania danych:', error);
            });
        }
    }, 5 * 60 * 1000); // 5 minut
}

// Funkcja do ustawiania nasłuchiwania na zdarzenia sieciowe
function setupNetworkListeners() {
    // Nasłuchuj na zdarzenie online
    window.addEventListener('online', () => {
        console.log('Połączono z siecią');
        hideOfflineNotification();
        
        // Synchronizuj zmiany offline
        syncOfflineChanges();
        
        // Pobierz najnowsze dane
        Promise.all([
            fetchDepartments(),
            fetchUsers(),
            fetchTasks(),
            fetchSettings()
        ]).then(() => {
            // Odśwież widoki
            renderWeekView();
            renderUsersList();
            renderDepartmentsList();
            renderAvailableTasks();
        });
    });
    
    // Nasłuchuj na zdarzenie offline
    window.addEventListener('offline', () => {
        console.log('Utracono połączenie z siecią');
        showOfflineNotification();
    });
}

// Funkcja do obsługi trybu offline
function setupOfflineHandler() {
    console.log('Inicjalizacja obsługi trybu offline');
    
    // Sprawdź aktualny stan połączenia
    checkConnectionStatus();
    
    // Nasłuchuj zmiany stanu połączenia
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Stwórz element powiadomienia o trybie offline, jeśli nie istnieje
    if (!document.getElementById('offline-notification')) {
        const offlineNotification = document.createElement('div');
        offlineNotification.id = 'offline-notification';
        offlineNotification.className = 'offline-notification';
        offlineNotification.innerHTML = `
            <div class="offline-notification-content">
                <span class="offline-icon">⚠️</span>
                <span class="offline-message">Tryb offline - zmiany będą zapisane lokalnie</span>
            </div>
        `;
        document.body.appendChild(offlineNotification);
    }
    
    // Dostosuj styl powiadomienia
    const style = document.createElement('style');
    style.textContent = `
        .offline-notification {
            position: fixed;
            top: -60px;
            left: 0;
            right: 0;
            background-color: #ff9800;
            color: white;
            text-align: center;
            padding: 12px;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: transform 0.3s ease-in-out;
        }
        .offline-notification.visible {
            transform: translateY(60px);
        }
        .offline-notification-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .offline-icon {
            font-size: 20px;
        }
        .offline-message {
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

// Funkcja sprawdzająca status połączenia
function checkConnectionStatus() {
    if (navigator.onLine) {
        console.log('Połączenie z siecią aktywne');
        handleOnline();
    } else {
        console.log('Brak połączenia z siecią - tryb offline');
        handleOffline();
    }
}

// Obsługa przejścia w tryb online
function handleOnline() {
    console.log('Przywrócono połączenie z siecią');
    hideOfflineNotification();
    
    // Synchronizuj zmiany dokonane offline
    syncOfflineChanges();
    
    // Odśwież dane
    fetchData();
}

// Obsługa przejścia w tryb offline
function handleOffline() {
    console.log('Utracono połączenie z siecią');
    showOfflineNotification();
    
    // Załaduj dane przykładowe, jeśli nie mamy lokalnych danych
    if (tasks.length === 0) {
        loadSampleData();
    }
}

// Pokaż powiadomienie o trybie offline
function showOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.classList.add('visible');
    }
}

// Ukryj powiadomienie o trybie offline
function hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
        notification.classList.remove('visible');
    }
}

// Funkcja do synchronizacji zmian offline
function syncOfflineChanges() {
    const offlineChanges = getOfflineChanges();
    if (!offlineChanges || offlineChanges.length === 0) {
        console.log('Brak zmian do synchronizacji');
        return;
    }
    
    console.log(`Synchronizacja ${offlineChanges.length} zmian...`);
    
    offlineChanges.forEach(change => {
        try {
            switch (change.type) {
                case 'addTask':
                    apiRequest('POST', '/api/tasks', change.data);
                    break;
                case 'updateTask':
                    apiRequest('PUT', `/api/tasks/${change.id}`, change.data);
                    break;
                case 'deleteTask':
                    apiRequest('DELETE', `/api/tasks/${change.id}`);
                    break;
                case 'addUser':
                    apiRequest('POST', '/api/users', change.data);
                    break;
                case 'updateUser':
                    apiRequest('PUT', `/api/users/${change.id}`, change.data);
                    break;
                case 'deleteUser':
                    apiRequest('DELETE', `/api/users/${change.id}`);
                    break;
                case 'addDepartment':
                    apiRequest('POST', '/api/departments', change.data);
                    break;
                case 'updateDepartment':
                    apiRequest('PUT', `/api/departments/${change.id}`, change.data);
                    break;
                case 'deleteDepartment':
                    apiRequest('DELETE', `/api/departments/${change.id}`);
                    break;
                case 'updateSettings':
                    apiRequest('PUT', '/api/settings', change.data);
                    break;
                case 'splitTask':
                    handleSplitTaskSync(change.data);
                    break;
            }
        } catch (error) {
            console.error(`Błąd synchronizacji zmiany ${change.type}:`, error);
        }
    });
    
    // Usuń zsynchronizowane zmiany
    clearOfflineChanges();
    
    console.log('Synchronizacja zakończona');
}

// Obsługa synchronizacji podziału zadania
function handleSplitTaskSync(splitData) {
    if (!splitData.originalTaskId || !splitData.newTasks) return;
    
    // Usuń oryginalne zadanie
    apiRequest('DELETE', `/api/tasks/${splitData.originalTaskId}`);
    
    // Dodaj nowe zadania
    splitData.newTasks.forEach(task => {
        apiRequest('POST', '/api/tasks', task);
    });
}

// Funkcja do zapisywania zmian offline
function addOfflineChange(type, data, id = null) {
    let changes = getOfflineChanges() || [];
    
    // Dodaj zmianę
    changes.push({
        type,
        data,
        id,
        timestamp: Date.now()
    });
    
    // Zapisz zmiany do localStorage
    localStorage.setItem('offlineChanges', JSON.stringify(changes));
    
    console.log(`Dodano zmianę offline: ${type}`);
}

// Funkcja pobierająca zmiany offline z localStorage
function getOfflineChanges() {
    const changesJson = localStorage.getItem('offlineChanges');
    if (!changesJson) return [];
    try {
        return JSON.parse(changesJson);
    } catch (e) {
        console.error('Błąd parsowania zmian offline:', e);
        return [];
    }
}

// Funkcja czyszcząca zmiany offline
function clearOfflineChanges() {
    localStorage.removeItem('offlineChanges');
}

// Funkcja do pobierania danych z API
function fetchData() {
    console.log('Pobieranie danych...');
    
    // Pobierz zadania
    apiRequest('GET', '/api/tasks')
        .then(data => {
            tasks = data;
            renderWeekView();
            renderAvailableTasks();
            console.log('Pobrano zadania:', tasks.length);
        })
        .catch(error => {
            console.error('Błąd pobierania zadań:', error);
            if (!navigator.onLine) {
                loadSampleData();
            }
        });
    
    // Pobierz użytkowników
    apiRequest('GET', '/api/users')
        .then(data => {
            users = data;
            populateUserSelects();
            populateFilterSelects();
            renderUsersList();
            console.log('Pobrano użytkowników:', users.length);
        })
        .catch(error => {
            console.error('Błąd pobierania użytkowników:', error);
            if (!navigator.onLine) {
                loadSampleData();
            }
        });
    
    // Pobierz działy
    apiRequest('GET', '/api/departments')
        .then(data => {
            departments = data;
            populateDepartmentSelect();
            populateFilterSelects();
            renderDepartmentsList();
            console.log('Pobrano działy:', departments.length);
        })
        .catch(error => {
            console.error('Błąd pobierania działów:', error);
            if (!navigator.onLine) {
                loadSampleData();
            }
        });
    
    // Pobierz ustawienia
    apiRequest('GET', '/api/settings')
        .then(data => {
            settings = { ...settings, ...data };
            updateStyleVariables();
            console.log('Pobrano ustawienia');
        })
        .catch(error => {
            console.error('Błąd pobierania ustawień:', error);
            // Używamy domyślnych ustawień
        });
}

// Funkcja do ładowania przykładowych danych
function loadSampleData() {
    console.log('Ładowanie przykładowych danych...');
    
    // Przykładowe działy
    departments = [
        { id: 1, name: 'Account', color: '#3498db' },
        { id: 2, name: 'Creative', color: '#2ecc71' },
        { id: 3, name: 'Social Media', color: '#e74c3c' },
        { id: 4, name: 'Content', color: '#f39c12' }
    ];
    
    // Przykładowi użytkownicy
    users = [
        { id: 1, name: 'Jan Kowalski', department_id: 1, department_name: 'Account', department_color: '#3498db', permission: 'admin' },
        { id: 2, name: 'Anna Nowak', department_id: 2, department_name: 'Creative', department_color: '#2ecc71', permission: 'editor' },
        { id: 3, name: 'Piotr Wiśniewski', department_id: 3, department_name: 'Social Media', department_color: '#e74c3c', permission: 'editor' },
        { id: 4, name: 'Alicja Dąbrowska', department_id: 4, department_name: 'Content', department_color: '#f39c12', permission: 'editor' }
    ];
    
    // Przykładowe zadania
    tasks = [
        { 
            id: 1, 
            priority: 2, 
            client: 'Firma A', 
            brand: 'BrandA', 
            task_description: 'Kampania Social Media', 
            account_id: 1, 
            account_name: 'Jan Kowalski', 
            leader_id: 3, 
            leader_name: 'Piotr Wiśniewski', 
            estimated_time: 5, 
            notes: 'Przygotować posty na Facebook i Instagram', 
            links: 'https://example.com/project1' 
        },
        { 
            id: 2, 
            priority: 1, 
            client: 'Firma B', 
            brand: 'BrandB', 
            task_description: 'Projekt graficzny', 
            account_id: 1, 
            account_name: 'Jan Kowalski', 
            leader_id: 2, 
            leader_name: 'Anna Nowak', 
            estimated_time: 8, 
            notes: 'Logo i materiały brandingowe', 
            links: 'https://example.com/project2' 
        },
        { 
            id: 3, 
            priority: 3, 
            client: 'Firma C', 
            brand: 'BrandC', 
            task_description: 'Artykuł na blog', 
            account_id: 1, 
            account_name: 'Jan Kowalski', 
            leader_id: 4, 
            leader_name: 'Alicja Dąbrowska', 
            estimated_time: 3, 
            notes: 'Artykuł dotyczący najnowszych trendów', 
            links: 'https://example.com/project3' 
        }
    ];
    
    // Aktualizuj interfejs
    updateStyleVariables();
    
    try {
        // Wypełnij pola select i renderuj widoki
        if (typeof populateUserSelects === 'function') populateUserSelects();
        if (typeof populateDepartmentSelect === 'function') populateDepartmentSelect();
        if (typeof populateFilterSelects === 'function') populateFilterSelects();
        if (typeof renderWeekView === 'function') renderWeekView();
        if (typeof renderAvailableTasks === 'function') renderAvailableTasks();
        if (typeof renderUsersList === 'function') renderUsersList();
        if (typeof renderDepartmentsList === 'function') renderDepartmentsList();
        
        console.log('Załadowano przykładowe dane');
    } catch (error) {
        console.error('Błąd podczas renderowania danych przykładowych:', error);
    }
    
    // Pokazuj powiadomienie o trybie offline, jeśli nie mamy połączenia
    if (!navigator.onLine) {
        showOfflineNotification();
    }
}

// Ulepszona funkcja do robienia zapytań API z obsługą trybu offline
function apiRequest(method, url, data = null) {
    // Generuj unikalny identyfikator dla żądania
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Jeśli jesteśmy online, próbuj normalnie
    if (isOnline) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            return fetch(url, options);
        } catch (error) {
            console.error('Błąd podczas wykonywania żądania API:', error);
            
            // Jeśli wystąpił błąd, traktuj jak tryb offline
            isOnline = false;
            showOfflineNotification();
        }
    }
    
    // Jeśli jesteśmy offline, symuluj odpowiedź API z lokalnych danych
    console.log('Tryb offline - symulacja odpowiedzi API:', method, url);
    
    // Symuluj opóźnienie sieciowe
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // W trybie offline, zapisz zmiany lokalnie i dodaj do kolejki do synchronizacji później
    if (method !== 'GET') {
        // Dodaj zmianę do kolejki offline z unikalnym ID
        const offlineChange = {
            id: requestId,
            method: method,
            url: url,
            data: data,
            timestamp: Date.now()
        };
        
        addOfflineChange(offlineChange);
        
        // Aktualizuj lokalne dane
        handleLocalChange(method, url, data, requestId);
    }
    
    // Przygotuj symulowaną odpowiedź
    let responseBody = null;
    
    // Obsługa różnych endpointów
    if (url.includes('/api/tasks')) {
        if (method === 'GET') {
            responseBody = tasks;
        } else {
            responseBody = { success: true, id: requestId };
        }
    } else if (url.includes('/api/users')) {
        if (method === 'GET') {
            responseBody = users;
        } else {
            responseBody = { success: true, id: requestId };
        }
    } else if (url.includes('/api/departments')) {
        if (method === 'GET') {
            responseBody = departments;
        } else {
            responseBody = { success: true, id: requestId };
        }
    } else if (url.includes('/api/settings')) {
        if (method === 'GET') {
            responseBody = settings;
        } else {
            responseBody = { success: true };
        }
    } else {
        responseBody = { error: 'Nieznany endpoint w trybie offline' };
    }
    
    // Symuluj odpowiedź fetch
    const response = {
        ok: true,
        status: 200,
        statusText: 'OK (Symulacja offline)',
        json: async () => responseBody
    };
    
    return response;
}

// Obsługa lokalnych zmian w trybie offline
function handleLocalChange(method, url, data, offlineId) {
    // Obsługa różnych endpointów
    if (url.includes('/api/tasks')) {
        if (method === 'POST') {
            // Dodaj nowe zadanie z tymczasowym ID
            const newTask = { ...data, id: offlineId };
            tasks.push(newTask);
        } else if (method === 'PUT') {
            // Aktualizuj istniejące zadanie
            const taskId = url.split('/').pop();
            const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], ...data };
            }
        } else if (method === 'DELETE') {
            // Usuń zadanie
            const taskId = url.split('/').pop();
            tasks = tasks.filter(t => t.id.toString() !== taskId);
        }
        
        // Odśwież widok zadań
        renderWeekView();
        renderAvailableTasks();
    } else if (url.includes('/api/users')) {
        if (method === 'POST') {
            // Dodaj nowego użytkownika z tymczasowym ID
            const newUser = { ...data, id: offlineId };
            users.push(newUser);
        } else if (method === 'PUT') {
            // Aktualizuj istniejącego użytkownika
            const userId = url.split('/').pop();
            const userIndex = users.findIndex(u => u.id.toString() === userId);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...data };
            }
        } else if (method === 'DELETE') {
            // Usuń użytkownika
            const userId = url.split('/').pop();
            users = users.filter(u => u.id.toString() !== userId);
        }
        
        // Odśwież listę użytkowników
        renderUsersList();
    } else if (url.includes('/api/departments')) {
        if (method === 'POST') {
            // Dodaj nowy dział z tymczasowym ID
            const newDepartment = { ...data, id: offlineId };
            departments.push(newDepartment);
        } else if (method === 'PUT') {
            // Aktualizuj istniejący dział
            const deptId = url.split('/').pop();
            const deptIndex = departments.findIndex(d => d.id.toString() === deptId);
            
            if (deptIndex !== -1) {
                departments[deptIndex] = { ...departments[deptIndex], ...data };
            }
        } else if (method === 'DELETE') {
            // Usuń dział
            const deptId = url.split('/').pop();
            departments = departments.filter(d => d.id.toString() !== deptId);
        }
        
        // Odśwież listę działów
        renderDepartmentsList();
    } else if (url.includes('/api/settings')) {
        if (method === 'PUT') {
            // Aktualizuj ustawienia
            settings = { ...settings, ...data };
            
            // Zapisz ustawienia lokalnie
            localStorage.setItem('settings', JSON.stringify(settings));
            
            // Aktualizuj zmienne CSS
            updateCSSVariables();
        }
    }
}

// Funkcja pomocnicza do określenia typu zmiany
function getChangeType(method, url) {
    if (url.includes('/tasks')) {
        if (method === 'POST') return 'addTask';
        if (method === 'PUT') return 'updateTask';
        if (method === 'DELETE') return 'deleteTask';
    } else if (url.includes('/users')) {
        if (method === 'POST') return 'addUser';
        if (method === 'PUT') return 'updateUser';
        if (method === 'DELETE') return 'deleteUser';
    } else if (url.includes('/departments')) {
        if (method === 'POST') return 'addDepartment';
        if (method === 'PUT') return 'updateDepartment';
        if (method === 'DELETE') return 'deleteDepartment';
    } else if (url.includes('/settings')) {
        if (method === 'PUT') return 'updateSettings';
    }
    return null;
}

// Funkcja pomocnicza do wyciągnięcia ID z URL
function getIdFromUrl(url) {
    const matches = url.match(/\/(\d+)(?:\/|$)/);
    return matches ? matches[1] : null;
}

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

// Funkcja do ładowania ustawień
function loadSettings() {
    console.log('Ładowanie ustawień...');
    
    // Próba pobrania ustawień z localStorage
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            settings = { ...settings, ...parsedSettings };
            console.log('Załadowano ustawienia z localStorage');
        } catch (e) {
            console.error('Błąd parsowania ustawień z localStorage:', e);
        }
    }
    
    // Aktualizuj zmienne CSS
    updateStyleVariables();
}

// Funkcja do zapisywania ustawień w localStorage
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
    console.log('Ustawienia zapisane w localStorage');
}

// Funkcja do wykonywania zapytań API z obsługą trybu offline
function apiRequest(method, url, data) {
    // Sprawdź, czy istnieje połączenie z serwerem
    if (!navigator.onLine) {
        console.log(`Jesteś offline. Obsługa zapytania ${method} ${url} w trybie offline.`);
        
        // Symuluj opóźnienie jak przy prawdziwym zapytaniu
        return new Promise((resolve) => {
            setTimeout(() => {
                // Obsługa GET w trybie offline - zwróć dane z pamięci
                if (method === 'GET') {
                    let result;
                    
                    if (url === '/api/tasks' || url.startsWith('/api/tasks/')) {
                        result = tasks || sampleTasks;
                    } else if (url === '/api/users' || url.startsWith('/api/users/')) {
                        result = users || sampleUsers;
                    } else if (url === '/api/departments' || url.startsWith('/api/departments/')) {
                        result = departments || sampleDepartments;
                    } else if (url === '/api/settings') {
                        result = settings || getDefaultSettings();
                    } else {
                        result = { error: 'Nieznany endpoint API' };
                    }
                    
                    // Zwróć obiekt, który ma metodę json() jak prawdziwa odpowiedź fetch
                    const simulatedResponse = {
                        ok: true,
                        json: () => Promise.resolve(result)
                    };
                    
                    resolve(simulatedResponse);
                } else {
                    // Obsługa POST, PUT, DELETE w trybie offline
                    // Zapisz zmianę do synchronizacji po odzyskaniu połączenia
                    let changeId = Date.now();
                    let result;
                    
                    // Określ typ zmiany na podstawie metody
                    let changeType = method === 'POST' ? 'add' : method === 'PUT' ? 'update' : 'delete';
                    
                    // Wykonaj lokalną zmianę zależnie od endpointu
                    result = handleLocalChange(changeType, url, data);
                    
                    // Dodaj zmianę do kolejki zmian offline
                    addOfflineChange({
                        id: changeId,
                        timestamp: Date.now(),
                        method,
                        url,
                        data
                    });
                    
                    // Symuluj odpowiedź HTTP
                    const simulatedResponse = {
                        ok: true,
                        status: 200,
                        statusText: 'Offline - zmiany zapisane lokalnie',
                        json: () => Promise.resolve({ 
                            id: changeId, 
                            message: 'Dane zostały zapisane lokalnie i zostaną zsynchronizowane, gdy połączenie zostanie przywrócone',
                            ...result
                        })
                    };
                    
                    resolve(simulatedResponse);
                }
            }, 300); // Symuluje 300ms opóźnienia
        });
    }
    
    // Jeżeli jesteśmy online, wykonaj normalne zapytanie
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    return fetch(url, options);
}

// Funkcja obsługująca lokalne zmiany w trybie offline
function handleLocalChange(changeType, url, data) {
    let result = { success: true };
    
    // Obsługa zadań
    if (url === '/api/tasks' || url.startsWith('/api/tasks/')) {
        const taskId = url.split('/').pop();
        
        if (changeType === 'add' && url === '/api/tasks') {
            // Dodaj nowe zadanie lokalnie
            const newTask = {
                ...data,
                id: `offline_${Date.now()}`
            };
            tasks.push(newTask);
            result.id = newTask.id;
        } 
        else if (changeType === 'update' && taskId !== 'tasks') {
            // Aktualizuj istniejące zadanie
            const index = tasks.findIndex(t => t.id.toString() === taskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...data };
                result.id = taskId;
            }
        } 
        else if (changeType === 'delete' && taskId !== 'tasks') {
            // Usuń zadanie
            const index = tasks.findIndex(t => t.id.toString() === taskId);
            if (index !== -1) {
                tasks.splice(index, 1);
                result.id = taskId;
            }
        }
        
        // Odświerz widok zadań
        renderWeekView();
        renderAvailableTasks();
    }
    
    // Obsługa użytkowników
    else if (url === '/api/users' || url.startsWith('/api/users/')) {
        const userId = url.split('/').pop();
        
        if (changeType === 'add' && url === '/api/users') {
            // Dodaj nowego użytkownika lokalnie
            const newUser = {
                ...data,
                id: `offline_${Date.now()}`
            };
            users.push(newUser);
            result.id = newUser.id;
        } 
        else if (changeType === 'update' && userId !== 'users') {
            // Aktualizuj istniejącego użytkownika
            const index = users.findIndex(u => u.id.toString() === userId);
            if (index !== -1) {
                users[index] = { ...users[index], ...data };
                result.id = userId;
            }
        } 
        else if (changeType === 'delete' && userId !== 'users') {
            // Usuń użytkownika
            const index = users.findIndex(u => u.id.toString() === userId);
            if (index !== -1) {
                users.splice(index, 1);
                result.id = userId;
            }
        }
        
        // Odśwież listę użytkowników
        renderUsersList();
    }
    
    // Obsługa działów
    else if (url === '/api/departments' || url.startsWith('/api/departments/')) {
        const deptId = url.split('/').pop();
        
        if (changeType === 'add' && url === '/api/departments') {
            // Dodaj nowy dział lokalnie
            const newDept = {
                ...data,
                id: `offline_${Date.now()}`
            };
            departments.push(newDept);
            result.id = newDept.id;
        } 
        else if (changeType === 'update' && deptId !== 'departments') {
            // Aktualizuj istniejący dział
            const index = departments.findIndex(d => d.id.toString() === deptId);
            if (index !== -1) {
                departments[index] = { ...departments[index], ...data };
                result.id = deptId;
            }
        } 
        else if (changeType === 'delete' && deptId !== 'departments') {
            // Usuń dział
            const index = departments.findIndex(d => d.id.toString() === deptId);
            if (index !== -1) {
                departments.splice(index, 1);
                result.id = deptId;
            }
        }
        
        // Odśwież listę działów
        renderDepartmentsList();
    }
    
    // Obsługa ustawień
    else if (url === '/api/settings') {
        if (changeType === 'update') {
            // Aktualizuj ustawienia
            settings = { ...settings, ...data };
            localStorage.setItem('settings', JSON.stringify(settings));
            updateCSSVariables();
            result.id = 'settings';
        }
    }
    
    return result;
}

// Pobierz zapisane zmiany offline z localStorage
function getOfflineChanges() {
    const changes = localStorage.getItem('offlineChanges');
    return changes ? JSON.parse(changes) : [];
}

// Dodaj zmianę do kolejki zmian offline
function addOfflineChange(change) {
    const changes = getOfflineChanges();
    changes.push(change);
    localStorage.setItem('offlineChanges', JSON.stringify(changes));
    console.log('Dodano zmianę offline:', change);
}

// Usuń zmianę z kolejki zmian offline
function removeOfflineChange(changeId) {
    const changes = getOfflineChanges();
    const newChanges = changes.filter(c => c.id !== changeId);
    localStorage.setItem('offlineChanges', JSON.stringify(newChanges));
}

// Synchronizuj zmiany offline z serwerem
async function syncOfflineChanges() {
    const changes = getOfflineChanges();
    
    if (changes.length === 0) {
        console.log('Brak zmian offline do synchronizacji');
        return;
    }
    
    showToast('Synchronizowanie zmian offline...', 'info');
    
    console.log(`Synchronizowanie ${changes.length} zmian offline...`);
    
    for (const change of changes) {
        try {
            console.log(`Synchronizowanie zmiany: ${change.method} ${change.url}`);
            
            const options = {
                method: change.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (change.data && (change.method === 'POST' || change.method === 'PUT')) {
                options.body = JSON.stringify(change.data);
            }
            
            // Sprawdź czy ID jest offline i zamień na prawdziwe ID jeśli potrzeba
            if (change.data && change.data.id && typeof change.data.id === 'string' && change.data.id.startsWith('offline_')) {
                // Usuń prefix offline_ dla nowych elementów podczas synchronizacji
                const updatedData = { ...change.data };
                delete updatedData.id;
                options.body = JSON.stringify(updatedData);
            }
            
            const response = await fetch(change.url, options);
            
            if (response.ok) {
                console.log(`Zmiana zsynchronizowana: ${change.method} ${change.url}`);
                removeOfflineChange(change.id);
            } else {
                console.error(`Błąd podczas synchronizacji zmiany: ${change.method} ${change.url}`, response.statusText);
            }
        } catch (error) {
            console.error(`Błąd podczas synchronizacji zmiany: ${change.method} ${change.url}`, error);
        }
    }
    
    // Odśwież dane po synchronizacji
    await fetchData();
    
    const remainingChanges = getOfflineChanges();
    if (remainingChanges.length === 0) {
        showToast('Wszystkie zmiany offline zostały zsynchronizowane', 'success');
    } else {
        showToast(`Zsynchronizowano częściowo. Pozostało ${remainingChanges.length} zmian.`, 'warning');
    }
}

// Funkcja do pobierania zadań z API
async function fetchTasks() {
    try {
        console.log('Pobieranie zadań z API...');
        const response = await apiRequest('GET', '/api/tasks');
        
        if (response.ok) {
            const data = await response.json();
            console.log(`Pobrano ${data.length} zadań`);
            tasks = data;
            return data;
        } else {
            console.error('Błąd podczas pobierania zadań:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania zadań:', error);
        return null;
    }
}

// Funkcja do pobierania użytkowników z API
async function fetchUsers() {
    try {
        console.log('Pobieranie użytkowników z API...');
        const response = await apiRequest('GET', '/api/users');
        
        if (response.ok) {
            const data = await response.json();
            console.log(`Pobrano ${data.length} użytkowników`);
            users = data;
            return data;
        } else {
            console.error('Błąd podczas pobierania użytkowników:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania użytkowników:', error);
        return null;
    }
}

// Funkcja do pobierania działów z API
async function fetchDepartments() {
    try {
        console.log('Pobieranie działów z API...');
        const response = await apiRequest('GET', '/api/departments');
        
        if (response.ok) {
            const data = await response.json();
            console.log(`Pobrano ${data.length} działów`);
            departments = data;
            return data;
        } else {
            console.error('Błąd podczas pobierania działów:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania działów:', error);
        return null;
    }
}

// Funkcja do pobierania ustawień z API
async function fetchSettings() {
    try {
        console.log('Pobieranie ustawień z API...');
        const response = await apiRequest('GET', '/api/settings');
        
        if (response.ok) {
            const data = await response.json();
            console.log('Pobrano ustawienia');
            settings = data;
            
            // Zapisz ustawienia w localStorage
            localStorage.setItem('settings', JSON.stringify(settings));
            
            // Aktualizuj zmienne CSS na podstawie ustawień
            updateCSSVariables();
            
            return data;
        } else {
            console.error('Błąd podczas pobierania ustawień:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania ustawień:', error);
        return null;
    }
}

// Pobierz wszystkie dane
async function fetchData() {
    await Promise.all([
        fetchTasks(),
        fetchUsers(),
        fetchDepartments(),
        fetchSettings()
    ]);
    
    // Renderuj widoki po pobraniu danych
    renderWeekView();
    renderAvailableTasks();
    renderUsersList();
    renderDepartmentsList();
}