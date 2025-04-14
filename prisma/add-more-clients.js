const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Lista możliwych nazw firm
const companyNames = [
  'TechNova', 'GlobalSoft', 'InnoTech', 'DigitalWave', 'FutureSys',
  'SmartTech', 'WebSphere', 'EcoSolutions', 'MediaPro', 'DataCore',
  'CloudNine', 'MegaSystems', 'IntelliSoft', 'VisualArts', 'CyberTech',
  'GreenEnergy', 'UrbanDesign', 'HealthPlus', 'FoodDelights', 'TravelNow'
];

// Lista prefiksów marki
const brandPrefixes = [
  'Pro', 'Max', 'Ultra', 'Premium', 'Elite',
  'Smart', 'Digital', 'Modern', 'Classic', 'Lite',
  'Eco', 'Business', 'Enterprise', 'Home', 'Mobile',
  'Cloud', 'Power', 'Connect', 'Express', 'Flex'
];

// Lista sufiksów marki
const brandSuffixes = [
  'Solutions', 'Services', 'Products', 'Technology', 'Systems',
  'Apps', 'Software', 'Devices', 'Platform', 'Suite',
  'Tools', 'Network', 'Connect', 'Hub', 'Store',
  'Lab', 'Center', 'Group', 'Direct', 'Line'
];

// Lista możliwych kolorów marek (HEX)
const brandColors = [
  '#4A6FDC', '#E9546B', '#42B983', '#FFAB00', '#9C6ADE',
  '#FF9800', '#2196F3', '#4CAF50', '#9C27B0', '#F44336',
  '#3F51B5', '#00BCD4', '#009688', '#FFC107', '#795548',
  '#607D8B', '#8BC34A', '#CDDC39', '#673AB7', '#FF5722'
];

// Funkcja generująca losowe marki dla firmy
function generateBrands(companyName, count) {
  const brands = [];
  const usedPrefixes = new Set();
  
  for (let i = 0; i < count; i++) {
    let prefix;
    do {
      prefix = brandPrefixes[Math.floor(Math.random() * brandPrefixes.length)];
    } while (usedPrefixes.has(prefix));
    
    usedPrefixes.add(prefix);
    
    const suffix = brandSuffixes[Math.floor(Math.random() * brandSuffixes.length)];
    const color = brandColors[Math.floor(Math.random() * brandColors.length)];
    
    brands.push({
      name: `${companyName} ${prefix}`,
      description: `${companyName} ${prefix} - Linia ${suffix}`,
      color: color
    });
  }
  
  return brands;
}

// Główna funkcja dodająca klientów i marki
async function addClientsAndBrands() {
  console.log('Dodaję 10 klientów z ich markami...');
  
  // Pobierz istniejących klientów, aby uniknąć duplikatów
  const existingClients = await prisma.client.findMany();
  const existingClientNames = existingClients.map(client => client.name);
  
  // Wybierz 10 unikalnych nazw firm
  const selectedCompanyNames = [];
  const shuffledCompanyNames = [...companyNames].sort(() => Math.random() - 0.5);
  
  for (const name of shuffledCompanyNames) {
    if (!existingClientNames.includes(name) && selectedCompanyNames.length < 10) {
      selectedCompanyNames.push(name);
    }
    
    if (selectedCompanyNames.length >= 10) break;
  }
  
  // Dodaj klientów i ich marki
  for (const companyName of selectedCompanyNames) {
    try {
      // Losowa liczba marek (3-5)
      const brandsCount = Math.floor(Math.random() * 3) + 3; // 3, 4 lub 5
      const brands = generateBrands(companyName, brandsCount);
      
      const client = await prisma.client.create({
        data: {
          name: companyName,
        }
      });
      
      console.log(`Dodano klienta: ${client.name} (ID: ${client.id})`);
      
      // Dodaj marki dla tego klienta
      for (const brand of brands) {
        const createdBrand = await prisma.brand.create({
          data: {
            name: brand.name,
            color: brand.color,
            clientId: client.id
          }
        });
        
        console.log(`-- Dodano markę: ${createdBrand.name}`);
      }
      
      console.log(`Dodano ${brands.length} marek dla klienta ${companyName}`);
    } catch (error) {
      console.error(`Błąd podczas dodawania klienta ${companyName}:`, error);
    }
  }
  
  console.log('Zakończono dodawanie klientów i marek.');
}

// Uruchomienie głównej funkcji
addClientsAndBrands()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 