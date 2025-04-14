// Import PrismaClient from the specific generated location
const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

// Helper function to get the date for a specific week number and day
function getDateOfWeek(weekNumber, year, dayOfWeek = 1) {
  // Create a date for Jan 1 of the specified year
  const date = new Date(year, 0, 1);
  
  // Get the day of the week for Jan 1 (0 = Sunday, 1 = Monday, etc.)
  const dayOffset = date.getDay() || 7;
  
  // Calculate the date of the first day of the first week
  date.setDate(date.getDate() - dayOffset + 1 + (weekNumber - 1) * 7 + (dayOfWeek - 1));
  
  return date;
}

// Task titles - more varied for better distribution
const taskTitles = [
  'Kampania w social media',
  'Projekt graficzny baneru',
  'Aktualizacja strony www',
  'Newsletter miesięczny',
  'Raport analityczny',
  'Prezentacja dla klienta',
  'Materiały promocyjne',
  'Sesja zdjęciowa produktów',
  'Przygotowanie treści SEO',
  'Aktualizacja oferty handlowej',
  'Projekt logo',
  'Kampania Google Ads',
  'Artykuł sponsorowany',
  'Post na blog firmowy',
  'Animacja produktowa',
  'Edycja materiału wideo',
  'Strategia marketingowa',
  'Projektowanie UX aplikacji',
  'Projekt landing page',
  'Audyt SEO',
  'Kampania e-mail marketingowa',
  'Projekt ulotki',
  'Badanie satysfakcji klientów',
  'Aktualizacja portfolio',
  'Wdrożenie nowej funkcji',
  'Testy A/B interfejsu',
  'Analiza konkurencji',
  'Optymalizacja konwersji',
  'Implementacja tagowania',
  'Raport efektywności'
];

// Task descriptions - more variety
const taskDescriptions = [
  'Opracowanie i wdrożenie kampanii w mediach społecznościowych dla zwiększenia zasięgu marki.',
  'Przygotowanie materiałów graficznych zgodnie z wytycznymi brandbooka.',
  'Aktualizacja treści i optymalizacja pod kątem SEO.',
  'Analiza danych i przygotowanie raportu z rekomendacjami.',
  'Przygotowanie prezentacji wyników kampanii dla klienta końcowego.',
  'Opracowanie strategii komunikacji na najbliższy kwartał.',
  'Przygotowanie kompletu materiałów promocyjnych na wydarzenie targowe.',
  'Audyt i optymalizacja procesów marketingowych.',
  'Wdrożenie nowego systemu monitorowania efektywności działań.',
  'Przygotowanie briefu kreatywnego dla zespołu projektowego.',
  'Aktualizacja identyfikacji wizualnej zgodnie z nowymi wytycznymi.',
  'Koordynacja działań promocyjnych z zespołem sprzedaży.',
  'Analiza ścieżki klienta i rekomendacje ulepszeń UX.',
  'Optymalizacja platform cyfrowych pod kątem konwersji.',
  'Integracja nowych narzędzi analitycznych.',
  'Przygotowanie szkolenia z obsługi mediów społecznościowych dla klienta.',
  'Wdrożenie metodologii zarządzania projektami kreatywnych.',
  'Przeprowadzenie badań użyteczności interfejsu z grupą docelową.',
  'Benchmarking konkurencyjnych rozwiązań na rynku.',
  'Przygotowanie dokumentacji technicznej dla zespołu programistów.'
];

// Notes templates
const notesTemplates = [
  'Termin realizacji może wymagać koordynacji z zespołem IT.',
  'Klient podkreślił znaczenie spójności z poprzednimi materiałami.',
  'Należy uwzględnić wytyczne dotyczące nowego pozycjonowania marki.',
  'Zadanie wymaga konsultacji z działem prawnym przed finalizacją.',
  'Priorytet może ulec zmianie w zależności od harmonogramu kampanii.',
  'Klient oczekuje minimum 3 propozycji kreatywnych.',
  'Warto uwzględnić opinie z poprzedniego projektu dla tego klienta.',
  'Zadanie powinno być realizowane zgodnie z nową procedurą akceptacji.',
  'Budżet projektu został już zatwierdzony przez klienta.',
  'Wymagane jest zastosowanie nowych wytycznych graficznych.',
  'Projekt ma kluczowe znaczenie dla całej strategii klienta na Q2.',
  'Należy zaplanować spotkanie z klientem po ukończeniu pierwszego etapu.',
  'Zalecana jest konsultacja z zespołem marketingu przed rozpoczęciem prac.',
  'Dostęp do zasobów wymaga wcześniejszego kontaktu z koordynatorem projektu.',
  'Zadanie jest częścią większej kampanii - należy zachować spójność.'
];

async function generateTasks() {
  try {
    console.log('Rozpoczynam generowanie zadań dla tygodni 15, 16 i 17...');
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Fetch all brands
    const brands = await prisma.brand.findMany();
    if (brands.length === 0) {
      console.error('Nie znaleziono żadnych marek w bazie danych');
      return;
    }
    
    // Fetch a user to be the creator
    const creators = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'EDITOR']
        }
      }
    });
    
    if (creators.length === 0) {
      console.error('Nie znaleziono użytkowników, którzy mogliby tworzyć zadania');
      return;
    }
    
    // Tasks to create
    const tasksToCreate = [];
    
    // Generate 20 tasks for each week (15, 16, 17)
    for (let week = 15; week <= 17; week++) {
      const weekStartDate = getDateOfWeek(week, currentYear);
      
      for (let i = 0; i < 20; i++) {
        // Randomly select data
        const randomBrand = brands[Math.floor(Math.random() * brands.length)];
        const randomCreator = creators[Math.floor(Math.random() * creators.length)];
        const randomPriority = Math.floor(Math.random() * 3) + 1; // 1=HIGH, 2=MEDIUM, 3=LOW
        const randomEstimatedTime = Math.round((Math.random() * 8 + 1) * 2) / 2; // 1 to 9 hours, in 0.5 increments
        
        // Generate a random date within the week (0-6 days from the start of the week)
        const taskDate = new Date(weekStartDate);
        taskDate.setDate(weekStartDate.getDate() + Math.floor(Math.random() * 5)); // Mon-Fri
        
        // Create an expiry date 1-14 days in the future from the task date
        const expiryDate = new Date(taskDate);
        expiryDate.setDate(taskDate.getDate() + Math.floor(Math.random() * 14) + 1);
        
        // Select random title and description
        const titleIndex = Math.floor(Math.random() * taskTitles.length);
        const descriptionIndex = Math.floor(Math.random() * taskDescriptions.length);
        const notesIndex = Math.floor(Math.random() * notesTemplates.length);
        
        // Create task data
        const taskData = {
          title: `[W${week}] ${taskTitles[titleIndex]}`,
          description: taskDescriptions[descriptionIndex],
          priority: randomPriority,
          estimatedTime: randomEstimatedTime,
          brandId: randomBrand.id,
          createdById: randomCreator.id,
          assignedToId: null, // No assignment as requested
          expiryDate: expiryDate,
          notes: notesTemplates[notesIndex],
        };
        
        tasksToCreate.push(taskData);
      }
    }
    
    console.log(`Przygotowano ${tasksToCreate.length} zadań do utworzenia`);
    
    // Create tasks in batches to avoid overwhelming the database
    const batchSize = 10;
    let createdCount = 0;
    
    for (let i = 0; i < tasksToCreate.length; i += batchSize) {
      const batch = tasksToCreate.slice(i, i + batchSize);
      await Promise.all(batch.map(taskData => 
        prisma.task.create({
          data: taskData
        })
      ));
      
      createdCount += batch.length;
      console.log(`Utworzono ${createdCount} z ${tasksToCreate.length} zadań`);
    }
    
    console.log('Generowanie zadań zakończone pomyślnie!');
  } catch (error) {
    console.error('Wystąpił błąd podczas generowania zadań:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
generateTasks()
  .then(() => console.log('Skrypt zakończył działanie'))
  .catch(error => console.error('Błąd w skrypcie:', error)); 