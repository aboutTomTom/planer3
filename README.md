# Planer3

System zarządzania zadaniami i harmonogramem pracy dla agencji reklamowej. Aplikacja umożliwia planowanie zadań, przydzielanie ich do pracowników i zarządzanie czasem pracy zespołu.

## Główne funkcje

- Zarządzanie zadaniami (dodawanie, edycja, usuwanie, sortowanie, filtrowanie)
- Przydzielanie zadań do pracowników
- Harmonogram pracy z widokiem tygodniowym
- Zarządzanie klientami i markami
- Zarządzanie działami i pracownikami
- System priorytetów dla zadań

## Technologie

- Next.js 15.3.0
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (baza danych)

## Wymagania

- Node.js w wersji 18 lub nowszej
- npm

## Instalacja i uruchomienie

1. Sklonuj repozytorium:
```bash
git clone https://github.com/aboutTomTom/planer3.git
cd planer3
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj bazę danych:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Uruchom aplikację w trybie deweloperskim:
```bash
npm run dev
```

5. Otwórz przeglądarkę i przejdź pod adres:
```
http://localhost:3000
```

## Narzędzia deweloperskie

- Prisma Studio - narzędzie do zarządzania bazą danych:
```bash
npx prisma studio
```

## Struktura projektu

- `/src/app` - główne komponenty aplikacji i routing
- `/src/components` - współdzielone komponenty UI
- `/src/lib` - funkcje pomocnicze, kontekst, konfiguracja
- `/prisma` - schemat bazy danych i migracje
