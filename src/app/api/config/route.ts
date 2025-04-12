import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { TimeThreshold } from '@/lib/context/AppConfigContext';

// Inicjalizacja PrismaClient
const prisma = new PrismaClient();

// Interfejs dla rekordu ustawień
interface SettingRecord {
  key: string;
  value: string;
}

// Domyślna konfiguracja
const defaultConfig = {
  timeThresholds: [
    { name: "low", min: 0, max: 5, color: "#42B983" },    // zielony dla <5h
    { name: "medium", min: 5, max: 7, color: "#FFAB00" }, // żółty dla 5-7h
    { name: "high", min: 7, max: 8, color: "#FF9800" },   // pomarańczowy dla 7-8h
    { name: "critical", min: 8, max: 12, color: "#E9546B" } // czerwony dla >8h
  ],
  displayedDays: [1, 2, 3, 4, 5], // Domyślnie dni od poniedziałku do piątku
};

// GET - pobierz aktualną konfigurację
export async function GET() {
  try {
    console.log('GET /api/config - Próba połączenia z bazą danych...');
    
    // Pobierz konfigurację z bazy danych
    const configSettings = await prisma.settings.findMany({
      where: {
        OR: [
          { key: 'timeThresholds' },
          { key: 'displayedDays' }
        ]
      }
    });

    console.log('Loaded settings:', configSettings);

    // Utwórz obiekt konfiguracji z rekordów
    const config: any = { ...defaultConfig };
    
    configSettings.forEach((setting: any) => {
      try {
        config[setting.key] = JSON.parse(setting.value);
      } catch (e) {
        console.error(`Failed to parse ${setting.key} setting:`, e);
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    // W przypadku błędu zwracamy domyślną konfigurację
    return NextResponse.json(defaultConfig);
  }
}

// POST - zapisz konfigurację
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data for saving:', data);
    
    const { timeThresholds, displayedDays } = data;

    // Zapisz progi czasowe
    if (timeThresholds) {
      console.log('Saving time thresholds:', timeThresholds);
      try {
        await prisma.settings.upsert({
          where: { key: 'timeThresholds' },
          update: { value: JSON.stringify(timeThresholds) },
          create: { key: 'timeThresholds', value: JSON.stringify(timeThresholds) }
        });
        console.log('Time thresholds saved successfully');
      } catch (err) {
        console.error('Error saving time thresholds:', err);
        throw new Error(`Failed to save time thresholds: ${(err as Error).message}`);
      }
    }

    // Zapisz wyświetlane dni
    if (displayedDays) {
      console.log('Saving displayed days:', displayedDays);
      try {
        await prisma.settings.upsert({
          where: { key: 'displayedDays' },
          update: { value: JSON.stringify(displayedDays) },
          create: { key: 'displayedDays', value: JSON.stringify(displayedDays) }
        });
        console.log('Displayed days saved successfully');
      } catch (err) {
        console.error('Error saving displayed days:', err);
        throw new Error(`Failed to save displayed days: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message || 'Unknown error'
    }, { status: 500 });
  }
} 