const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Lista imion męskich
const maleFirstNames = [
  'Adam', 'Bartosz', 'Cezary', 'Damian', 'Edward', 'Filip', 'Grzegorz', 'Henryk',
  'Igor', 'Jakub', 'Kamil', 'Leszek', 'Mariusz', 'Norbert', 'Oskar', 'Patryk',
  'Robert', 'Sebastian', 'Tadeusz', 'Wiktor', 'Zbigniew'
];

// Lista imion żeńskich
const femaleFirstNames = [
  'Agata', 'Barbara', 'Celina', 'Dominika', 'Ewelina', 'Felicja', 'Grażyna', 'Halina',
  'Iwona', 'Joanna', 'Karina', 'Lidia', 'Małgorzata', 'Natalia', 'Olga', 'Paulina',
  'Renata', 'Sandra', 'Teresa', 'Urszula', 'Weronika', 'Zofia'
];

// Lista nazwisk
const lastNames = [
  'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Dąbrowski',
  'Zieliński', 'Szymański', 'Woźniak', 'Kozłowski', 'Jankowski', 'Wojciechowski', 'Kwiatkowski', 'Kaczmarek',
  'Mazur', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawłowski', 'Michalski', 'Nowicki',
  'Adamczyk', 'Dudek', 'Zając', 'Wieczorek', 'Jabłoński', 'Król', 'Majewski', 'Olszewski', 'Jaworski'
];

// Funkcja generująca losowe imię i nazwisko
function generateRandomName(gender = 'random') {
  let firstName;
  
  if (gender === 'random') {
    gender = Math.random() > 0.5 ? 'male' : 'female';
  }
  
  if (gender === 'male') {
    firstName = maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)];
  } else {
    firstName = femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
  }
  
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Dostosowanie końcówki nazwiska dla kobiet
  if (gender === 'female' && lastName.endsWith('ski')) {
    return `${firstName} ${lastName.replace(/ski$/, 'ska')}`;
  } else if (gender === 'female' && lastName.endsWith('cki')) {
    return `${firstName} ${lastName.replace(/cki$/, 'cka')}`;
  } else if (gender === 'female' && lastName.endsWith('dzki')) {
    return `${firstName} ${lastName.replace(/dzki$/, 'dzka')}`;
  }
  
  return `${firstName} ${lastName}`;
}

// Funkcja do generowania emaila na podstawie imienia i nazwiska
function generateEmail(fullName, attempt = 0) {
  const [firstName, lastName] = fullName.split(' ');
  // Normalizacja dla polskich znaków
  const normalizedFirstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedLastName = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (attempt === 0) {
    return `${normalizedFirstName}.${normalizedLastName}@planer.pl`;
  } else {
    return `${normalizedFirstName}.${normalizedLastName}${attempt}@planer.pl`;
  }
}

// Główna funkcja dodająca użytkowników
async function addMoreUsers() {
  console.log('Dodaję kolejnych 20 użytkowników...');
  
  // Przygotowanie hasła
  const plainPassword = 'haslo123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  // Pobierz listę działów
  let departments = await prisma.department.findMany();
  console.log(`Znaleziono ${departments.length} działów`);
  
  if (departments.length === 0) {
    console.log('Brak działów w bazie. Tworzę domyślne działy...');
    await prisma.department.createMany({
      data: [
        { name: 'Marketing', color: '#4A6FDC' },
        { name: 'Grafika', color: '#E9546B' },
        { name: 'Programowanie', color: '#42B983' },
        { name: 'Sprzedaż', color: '#FFAB00' },
        { name: 'Obsługa klienta', color: '#9C6ADE' },
      ]
    });
    console.log('Działy zostały utworzone.');
    // Pobierz ponownie listę działów
    departments = await prisma.department.findMany();
  }

  // Dodaj 20 nowych użytkowników
  for (let i = 0; i < 20; i++) {
    const fullName = generateRandomName();
    let email = generateEmail(fullName);
    let attempt = 0;
    let success = false;
    
    // Losowe przypisanie do działu
    const departmentId = departments[Math.floor(Math.random() * departments.length)].id;
    
    // Losowa rola (większość to edytorzy)
    const roleRandom = Math.random();
    let role = 'EDITOR';
    if (roleRandom > 0.9) {
      role = 'ADMIN';
    } else if (roleRandom > 0.7) {
      role = 'VIEWER';
    }
    
    // Próbuj dodać użytkownika, obsługując duplikaty emaili
    while (!success && attempt < 5) {
      try {
        const newUser = await prisma.user.create({
          data: {
            name: fullName,
            email,
            password: hashedPassword,
            role,
            departmentId
          }
        });
        
        console.log(`Dodano użytkownika: ${newUser.name}, email: ${newUser.email}, rola: ${newUser.role}`);
        success = true;
      } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
          // Duplikat emaila, próbujemy z nowym
          attempt++;
          email = generateEmail(fullName, attempt);
          console.log(`Email zajęty, próbuję: ${email}`);
        } else {
          console.error(`Błąd podczas dodawania użytkownika ${fullName}:`, error);
          break;
        }
      }
    }
  }
  
  console.log('Zakończono dodawanie użytkowników.');
}

// Uruchomienie głównej funkcji
addMoreUsers()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 