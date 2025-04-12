import { PrismaClient, UserRole } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Funkcja do inicjalizacji ustawień
async function initSettings() {
  // Domyślne progi czasowe
  const defaultTimeThresholds = [
    { name: "low", min: 0, max: 5, color: "#42B983" },    // zielony dla <5h
    { name: "medium", min: 5, max: 7, color: "#FFAB00" }, // żółty dla 5-7h
    { name: "high", min: 7, max: 8, color: "#FF9800" },   // pomarańczowy dla 7-8h
    { name: "critical", min: 8, max: 12, color: "#E9546B" } // czerwony dla >8h
  ];

  // Domyślne dni tygodnia
  const defaultDisplayedDays = [1, 2, 3, 4, 5]; // Poniedziałek do piątku

  // Zapisz ustawienia w bazie danych
  await prisma.settings.upsert({
    where: { key: 'timeThresholds' },
    update: { value: JSON.stringify(defaultTimeThresholds) },
    create: { key: 'timeThresholds', value: JSON.stringify(defaultTimeThresholds) }
  });

  await prisma.settings.upsert({
    where: { key: 'displayedDays' },
    update: { value: JSON.stringify(defaultDisplayedDays) },
    create: { key: 'displayedDays', value: JSON.stringify(defaultDisplayedDays) }
  });

  console.log('Settings initialized successfully');
}

async function main() {
  console.log('Rozpoczynam seedowanie bazy danych...');

  // Usuń wszystkie istniejące rekordy (dla czystego startu)
  await prisma.harmonogramBlock.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.settings.deleteMany({});

  // Utwórz przykładowe działy
  console.log('Tworzę działy...');
  const departments = [
    { name: 'Marketing', color: '#4A6FDC' },
    { name: 'Grafika', color: '#E9546B' },
    { name: 'Programowanie', color: '#42B983' },
    { name: 'Sprzedaż', color: '#FFAB00' },
    { name: 'Obsługa klienta', color: '#9C6ADE' },
  ];

  for (const department of departments) {
    await prisma.department.create({
      data: department,
    });
  }

  // Utwórz przykładowych użytkowników
  console.log('Tworzę użytkowników...');
  const plainPassword = 'haslo123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const users = [
    { name: 'Admin Testowy', email: 'admin@planer.pl', password: hashedPassword, role: UserRole.ADMIN, departmentId: 3 },
    { name: 'Jan Kowalski', email: 'jan@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 1 },
    { name: 'Anna Nowak', email: 'anna@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 2 },
    { name: 'Piotr Wiśniewski', email: 'piotr@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 3 },
    { name: 'Marta Dąbrowska', email: 'marta@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 4 },
    { name: 'Tomasz Lewandowski', email: 'tomasz@planer.pl', password: hashedPassword, role: UserRole.VIEWER, departmentId: 5 },
    { name: 'Magdalena Wójcik', email: 'magdalena@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 1 },
    { name: 'Michał Kamiński', email: 'michal@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 2 },
    { name: 'Katarzyna Krawczyk', email: 'katarzyna@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 3 },
    { name: 'Krzysztof Zieliński', email: 'krzysztof@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 4 },
    { name: 'Agnieszka Szymańska', email: 'agnieszka@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 5 },
    { name: 'Marcin Woźniak', email: 'marcin@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 1 },
    { name: 'Aleksandra Kozłowska', email: 'aleksandra@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 2 },
    { name: 'Rafał Jankowski', email: 'rafal@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 3 },
    { name: 'Natalia Majewska', email: 'natalia@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 4 },
    { name: 'Damian Wojciechowski', email: 'damian@planer.pl', password: hashedPassword, role: UserRole.VIEWER, departmentId: 5 },
    { name: 'Karolina Kwiatkowska', email: 'karolina@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 1 },
    { name: 'Patryk Mazur', email: 'patryk@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 2 },
    { name: 'Monika Kaczmarek', email: 'monika@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 3 },
    { name: 'Łukasz Piotrowski', email: 'lukasz@planer.pl', password: hashedPassword, role: UserRole.EDITOR, departmentId: 4 },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  // Utwórz przykładowych klientów i marki
  console.log('Tworzę klientów i marki...');
  const clients = [
    { 
      name: 'ACME Corp', 
      brands: ['ACME Classic', 'ACME Pro', 'ACME Lite'] 
    },
    { 
      name: 'TechNova', 
      brands: ['TechNova Cloud', 'TechNova Mobile', 'TechNova Enterprise'] 
    },
    { 
      name: 'EcoSolutions', 
      brands: ['EcoHome', 'EcoBusiness', 'EcoGarden'] 
    },
    { 
      name: 'MegaMedia', 
      brands: ['MegaNews', 'MegaSport', 'MegaEntertainment', 'MegaKids'] 
    },
    { 
      name: 'HealthPlus', 
      brands: ['VitaPlus', 'FitPlus', 'MindPlus', 'NutriPlus'] 
    },
    { 
      name: 'UrbanStyle', 
      brands: ['UrbanClassic', 'UrbanModern', 'UrbanSport'] 
    },
    { 
      name: 'FoodDelights', 
      brands: ['DelightsBakery', 'DelightsDairy', 'DelightsOrganic'] 
    },
  ];

  for (const client of clients) {
    const createdClient = await prisma.client.create({
      data: {
        name: client.name,
      },
    });

    for (const brandName of client.brands) {
      await prisma.brand.create({
        data: {
          name: brandName,
          clientId: createdClient.id,
        },
      });
    }
  }

  // Pobierz ID użytkowników, marek i działów do tworzenia zadań
  const createdUsers = await prisma.user.findMany();
  const createdBrands = await prisma.brand.findMany();
  
  // Przykładowe tytuły zadań
  const taskTitles = [
    'Kampania reklamowa w mediach społecznościowych',
    'Projekt strony internetowej',
    'Analiza konkurencji',
    'Aktualizacja treści na blogu',
    'Projektowanie grafiki do prezentacji',
    'Montaż wideo promocyjnego',
    'Przygotowanie oferty handlowej',
    'Organizacja webinaru',
    'Optymalizacja SEO',
    'Projektowanie logo',
    'Badanie rynku',
    'Opracowanie strategii marketingowej',
    'Przygotowanie materiałów drukowanych',
    'Rebranding marki',
    'Testowanie nowych funkcji aplikacji',
    'Kontakt z klientami',
    'Tworzenie bazy danych',
    'Analiza wyników kampanii',
    'Raportowanie miesięczne',
    'Wdrożenie nowego systemu',
  ];

  // Utwórz przykładowe zadania
  console.log('Tworzę zadania...');
  const tasks = [];

  for (let i = 0; i < 20; i++) {
    const randomBrand = createdBrands[Math.floor(Math.random() * createdBrands.length)];
    const randomCreator = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const randomAssignee = Math.random() > 0.2 ? createdUsers[Math.floor(Math.random() * createdUsers.length)] : null;
    const randomPriority = Math.floor(Math.random() * 3) + 1;
    const randomEstimatedTime = Math.round((Math.random() * 8 + 1) * 2) / 2; // Od 1 do 9 godzin z krokiem 0.5
    
    // Data ważności (od dzisiaj do 30 dni w przyszłość)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
    
    const task = {
      title: taskTitles[i % taskTitles.length],
      description: `Szczegółowy opis zadania ${i + 1} - wymaga ${randomEstimatedTime} godzin pracy.`,
      priority: randomPriority,
      estimatedTime: randomEstimatedTime,
      brandId: randomBrand.id,
      createdById: randomCreator.id,
      assignedToId: randomAssignee ? randomAssignee.id : null,
      expiryDate: futureDate,
      notes: `Notatki do zadania ${i + 1}`,
      links: `https://przyklad.pl/zadanie-${i + 1}`,
    };
    
    tasks.push(task);
  }

  for (const task of tasks) {
    await prisma.task.create({
      data: task,
    });
  }

  // Pobierz utworzone zadania
  const createdTasks = await prisma.task.findMany({
    where: {
      assignedToId: {
        not: null,
      },
    },
  });

  // Utwórz przykładowe bloki harmonogramu
  console.log('Tworzę bloki harmonogramu...');
  
  // Przygotuj daty dla następnego tygodnia (od poniedziałku do piątku)
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
  
  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(nextMonday);
    day.setDate(nextMonday.getDate() + i);
    weekDays.push(day);
  }
  
  // Dla każdego zadania z przypisanym użytkownikiem, utwórz blok w harmonogramie
  for (const task of createdTasks) {
    // Niektóre zadania będą podzielone na kilka dni
    const splitIntoDays = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 1;
    
    if (splitIntoDays === 1) {
      // Pojedynczy blok na losowy dzień
      const randomDay = weekDays[Math.floor(Math.random() * weekDays.length)];
      
      await prisma.harmonogramBlock.create({
        data: {
          taskId: task.id,
          userId: task.assignedToId!,
          date: randomDay,
          allocatedTime: task.estimatedTime,
          isLocked: false,
        },
      });
    } else {
      // Podziel zadanie na kilka dni
      const totalTime = task.estimatedTime;
      let remainingTime = totalTime;
      
      // Losowo wybierz dni (bez powtórzeń)
      const selectedDays: number[] = [];
      while (selectedDays.length < splitIntoDays && selectedDays.length < weekDays.length) {
        const randomDayIndex = Math.floor(Math.random() * weekDays.length);
        if (!selectedDays.includes(randomDayIndex)) {
          selectedDays.push(randomDayIndex);
        }
      }
      
      // Przydziel czas dla każdego dnia
      for (let i = 0; i < selectedDays.length; i++) {
        const isLastDay = i === selectedDays.length - 1;
        let timeForThisDay;
        
        if (isLastDay) {
          timeForThisDay = remainingTime;
        } else {
          // Losowy przydział czasu, ale co najmniej 0.5h
          const maxForThisDay = remainingTime - 0.5 * (selectedDays.length - i - 1);
          timeForThisDay = Math.max(0.5, Math.round((Math.random() * maxForThisDay) * 2) / 2);
          remainingTime -= timeForThisDay;
        }
        
        await prisma.harmonogramBlock.create({
          data: {
            taskId: task.id,
            userId: task.assignedToId!,
            date: weekDays[selectedDays[i]],
            allocatedTime: timeForThisDay,
            isLocked: false,
          },
        });
      }
    }
  }

  // Utwórz konfigurację aplikacji
  console.log('Tworzę konfigurację aplikacji...');
  await prisma.appConfig.create({
    data: {
      timeThresholds: JSON.stringify([
        { name: "low", min: 0, max: 5, color: "#42B983" },    // zielony
        { name: "medium", min: 5, max: 7, color: "#FFAB00" }, // żółty
        { name: "high", min: 7, max: 8, color: "#FF9800" },   // pomarańczowy
        { name: "critical", min: 8, max: 10, color: "#E9546B" } // czerwony
      ]),
      displayedDays: "1,2,3,4,5" // Domyślnie wyświetlamy dni od poniedziałku do piątku
    },
  });

  // Inicjalizuj ustawienia
  await initSettings();

  console.log('Seedowanie zakończone!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 