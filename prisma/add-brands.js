const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Tablice przykładowych kolorów
const colors = [
  '#FF6B6B', // czerwony
  '#4ECDC4', // turkusowy
  '#FFA400', // pomarańczowy
  '#1A535C', // ciemny niebieskozielony
  '#F9F7F7', // biały
  '#3AAFA9', // morski
  '#2B2D42', // ciemny granatowy
  '#8D99AE', // szary niebieski
  '#EDF2F4', // jasny szary
  '#D90429', // czerwony
  '#E6B89C', // brzoskwiniowy
  '#9CAFB7', // niebieskoszary
  '#4281A4', // niebieski
  '#FE5F55', // koralowy
  '#59C3C3', // turkusowy
];

// Funkcja losująca unikalny kolor z tablicy
function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

// Przykładowe nazwy marek dla różnych sektorów
const techBrands = [
  'TechNova', 'DigiPulse', 'CyberWave', 'QuantumBit', 'NexusLink',
  'VortexTech', 'SynthSphere', 'ByteForge', 'EtherNode', 'PulseTech',
  'CodeCraft', 'DataDrive', 'FusionCore', 'InfiniByte', 'OmniStream'
];

const foodBrands = [
  'FreshHarvest', 'NatureBite', 'PureTaste', 'OrganicBliss', 'GreenPlate',
  'HoneyGrove', 'SunriseGrain', 'VeggieDelish', 'MilkyWay', 'FruitFusion',
  'BakeryDream', 'JuicyPick', 'SweetNest', 'CrispCrop', 'FlavorFarm'
];

const fashionBrands = [
  'StyleAxis', 'FabricFusion', 'ThreadNest', 'ChicVibe', 'ModernSilk',
  'UrbanThread', 'PrimeStitch', 'ElegantWeave', 'CoutureCanvas', 'VelvetVogue',
  'DenimDrive', 'LuxeLane', 'SilkSage', 'GlowGarb', 'NobleFiber'
];

const beautyBrands = [
  'GlowAura', 'PureLux', 'EssenceElite', 'SkinSphere', 'RadiantRoot',
  'BloomBeauty', 'CrystalClear', 'DewDrop', 'VelvetGlow', 'PetalPure',
  'LuminaLift', 'HydraHaven', 'SilkSheen', 'ZenBeauty', 'AquaArrow'
];

// Funkcja dodająca marki dla klientów
async function addBrandsToClients() {
  try {
    // Pobierz wszystkich klientów
    const clients = await prisma.client.findMany();
    
    if (clients.length === 0) {
      console.log('Brak klientów w bazie danych. Dodaję przykładowych klientów...');
      
      const defaultClients = [
        { name: 'TechCorp Solutions' },
        { name: 'FoodFusion Group' },
        { name: 'Fashion Forward' },
        { name: 'Beauty Essentials' }
      ];
      
      for (const client of defaultClients) {
        await prisma.client.create({
          data: {
            name: client.name
          }
        });
      }
      
      console.log('Dodano przykładowych klientów. Uruchom skrypt ponownie, aby dodać marki.');
      return;
    }
    
    console.log(`Znaleziono ${clients.length} klientów.`);
    
    // Dla każdego klienta dodaj od 3 do 5 marek
    for (const client of clients) {
      console.log(`Dodawanie marek dla klienta: ${client.name}...`);
      
      // Wybierz odpowiednią listę marek w zależności od nazwy klienta
      let brandsList = techBrands;
      
      if (client.name.toLowerCase().includes('food') || client.name.toLowerCase().includes('eat') || client.name.toLowerCase().includes('cuisine')) {
        brandsList = foodBrands;
      } else if (client.name.toLowerCase().includes('fashion') || client.name.toLowerCase().includes('style') || client.name.toLowerCase().includes('wear')) {
        brandsList = fashionBrands;
      } else if (client.name.toLowerCase().includes('beauty') || client.name.toLowerCase().includes('cosmetic') || client.name.toLowerCase().includes('skin')) {
        brandsList = beautyBrands;
      }
      
      // Losowa liczba marek (od 3 do 5)
      const numBrands = Math.floor(Math.random() * 3) + 3;
      
      // Pomieszaj listę marek
      const shuffledBrands = [...brandsList].sort(() => Math.random() - 0.5);
      
      // Sprawdź istniejące marki dla tego klienta
      const existingBrands = await prisma.brand.findMany({
        where: { clientId: client.id }
      });
      
      console.log(`Klient ma już ${existingBrands.length} marek.`);
      
      // Pomijaj klienta, jeśli ma już wystarczająco marek
      if (existingBrands.length >= 3) {
        console.log(`Klient ${client.name} ma już wystarczająco marek. Pomijam.`);
        continue;
      }
      
      // Ile marek należy dodać
      const brandsToAdd = numBrands - existingBrands.length;
      
      for (let i = 0; i < brandsToAdd; i++) {
        if (i >= shuffledBrands.length) break;
        
        const brandName = shuffledBrands[i];
        const color = getRandomColor();
        
        try {
          // Sprawdź, czy marka o takiej nazwie już istnieje dla tego klienta
          const brandExists = await prisma.brand.findFirst({
            where: {
              name: brandName,
              clientId: client.id
            }
          });
          
          if (brandExists) {
            console.log(`Marka ${brandName} już istnieje dla klienta ${client.name}. Pomijam.`);
            continue;
          }
          
          // Dodaj markę
          const brand = await prisma.brand.create({
            data: {
              name: brandName,
              color: color,
              clientId: client.id
            }
          });
          
          console.log(`Dodano markę: ${brand.name} (kolor: ${brand.color}) dla klienta: ${client.name}`);
        } catch (error) {
          console.error(`Błąd podczas dodawania marki ${brandName}:`, error);
        }
      }
    }
    
    console.log('Zakończono dodawanie marek.');
  } catch (error) {
    console.error('Wystąpił błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom funkcję dodającą marki
addBrandsToClients()
  .then(() => console.log('Operacja zakończona pomyślnie.'))
  .catch((error) => console.error('Błąd podczas wykonywania operacji:', error)); 