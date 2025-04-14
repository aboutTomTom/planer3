# Planer 3 - System planowania zadań agencji kreatywnej

Planer 3 to aplikacja webowa do zarządzania zadaniami i harmonogramem pracy w agencji kreatywnej. Pozwala na efektywne zarządzanie projektami, przydzielanie zadań zespołowi oraz śledzenie postępów prac.

## Funkcje

- Zarządzanie zadaniami (dodawanie, edycja, usuwanie)
- Harmonogram pracy z widokiem tygodniowym
- Zarządzanie użytkownikami i działami
- Przydzielanie zadań do użytkowników
- Filtrowanie i sortowanie zadań
- System priorytetów
- Zarządzanie klientami i markami

## Technologie

- Next.js 15
- React
- Tailwind CSS
- Prisma ORM
- SQLite (w wersji deweloperskiej)

## Wymagania

- Node.js (v18 lub nowszy)
- npm (v9 lub nowszy)

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/aboutTomTom/planer3.git
cd planer3
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Wygeneruj klienta Prisma:
```bash
npx prisma generate
```

4. Uruchom migracje bazy danych:
```bash
npx prisma migrate dev
```

## Uruchomienie

1. Uruchom serwer deweloperski:
```bash
npm run dev
```

2. Otwórz aplikację w przeglądarce:
```
http://localhost:3000
```

3. Aby otworzyć Prisma Studio (przeglądarka bazy danych):
```bash
npx prisma studio
```

## Lista zadań (TODO)

- [ ] Informacja o źródle danych - dodać oznaczenie przy konfiguracji informujące, czy dane zostały pobrane z localStorage czy z bazy danych (np. przy "Wersja konfiguracji: validated.1744491083991" dodać informację "pobrane z LS" lub "pobrane z DB")
- [ ] Zabezpieczenie całego serwisu logowaniem
- [ ] Obsługa współbieżnego używania przez wielu użytkowników - implementacja mechanizmu blokującego możliwość równoczesnej edycji tego samego zadania przez różnych użytkowników

## Licencja

Ten projekt jest własnością [nazwa firmy/właściciela]. Wszelkie prawa zastrzeżone.
