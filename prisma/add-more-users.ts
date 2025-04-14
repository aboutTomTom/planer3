import { PrismaClient } from '../src/generated/prisma';
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
function generateRandomName(gender: 'male' | 'female' | 'random' = 'random'): string {
  let firstName: string;
  
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
function generateEmail(fullName: string): string {
  const [firstName, lastName] = fullName.split(' ');
  const normalizedFirstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedLastName = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return `${normalizedFirstName}.${normalizedLastName}@planer.pl`;
}

// Główna funkcja dodająca użytkowników
async function addMoreUsers() {
  console.log('Dodaję kolejnych 20 użytkowników...');
  
  // Przygotowanie hasła
  const plainPassword = 'haslo123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  // Pobierz listę działów
  const departments = await prisma.department.findMany();
  
  // Dodaj 20 nowych użytkowników
  for (let i = 0; i < 20; i++) {
    const fullName = generateRandomName();
    const email = generateEmail(fullName);
    
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
    
    try {
      const newUser = await prisma.user.create({
        data: {
          name: fullName,
          email,
          password: hashedPassword,
          role: role as any,
          departmentId
        }
      });
      
      console.log(`Dodano użytkownika: ${newUser.name}, email: ${newUser.email}, rola: ${newUser.role}`);
    } catch (error) {
      console.error(`Błąd podczas dodawania użytkownika ${fullName}:`, error);
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