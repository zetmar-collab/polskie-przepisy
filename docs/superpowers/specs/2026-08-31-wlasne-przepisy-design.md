# Własne przepisy użytkownika — projekt

Data: 2026-08-31 · Wersja aplikacji: 1.0.1.0

## Problem

Aplikacja dostarcza 232 gotowe przepisy, ale nie pozwala dopisać własnych.
Ludzie mają przepisy w zeszytach i na kartkach — chcą je przenieść do jednego
miejsca, w którym działa wyszukiwarka, filtry i lista zakupów.

## Zakres

Użytkownik może dodawać, edytować i usuwać własne przepisy, zapisywane lokalnie
na jego komputerze. Może też zapisać kopię zapasową do pliku i wczytać ją z
powrotem — również na innym komputerze.

**Poza zakresem tej wersji:** zdjęcia potraw (limit `localStorage` to ok. 5 MB
na całą aplikację; kilkanaście zdjęć wyczerpałoby go i zapis zacząłby się nie
udawać), synchronizacja w chmurze, udostępnianie przepisów między użytkownikami.

## Decyzje projektowe

| Decyzja | Wybór | Dlaczego |
|---|---|---|
| Wbudowane przepisy | tylko do odczytu, z opcją „Zapisz jako mój przepis" | zmiany użytkownika nie kolidują z aktualizacjami bazy i nie da się bezpowrotnie zepsuć oryginału |
| Kopia zapasowa | eksport i import pliku `.json` | `localStorage` znika przy czyszczeniu danych i reinstalacji; bez tego „własna baza" jest nietrwała |
| Miejsce w interfejsie | wmieszane w listę + filtr „📒 Moje" | wyszukiwarka po składnikach obejmuje wtedy całość, a użytkownik nadal może zobaczyć wyłącznie swoje |
| Import | dopisuje, pomija duplikaty po `id` | dwukrotne wczytanie tej samej kopii nie robi bałaganu, a przeniesienie bazy dokłada brakujące zamiast kasować obecne |

## Model danych

Klucz `localStorage`: `ksiazka-kucharska-moje-przepisy` — tablica przepisów.

```js
{
  id: "moj-lz3k9f-7a2",   // tekst z prefiksem "moj-"
  title: "Ciasto babci",
  category: "ciasta",      // obiady | salatki | desery | ciasta
  age: "dorosli",          // dzieci | mlodzi | dorosli | seniorzy
  time: 60,                // minuty
  ingredients: ["..."],
  steps: ["..."],
  own: true,
  createdAt: "2026-08-31T10:00:00.000Z"
}
```

Identyfikatory własnych przepisów są tekstem, a wbudowanych — liczbą. Kolizja
jest więc niemożliwa, także po dodaniu nowych przepisów w aktualizacji.

Plik kopii zapasowej:

```json
{ "format": "ksiazka-kucharska/moje-przepisy", "version": 1, "recipes": [ ... ] }
```

Import przyjmuje też samą tablicę przepisów, żeby ręcznie przygotowany plik
również zadziałał.

## Architektura

### `js/my-recipes.js` — nowy moduł

`app.js` ma już 20 KB i odpowiada za wszystko. Warstwa danych trafia osobno,
jako globalny obiekt `MyRecipes` (bez modułów ES — `.cursorrules` zabrania
buildu, a moduły nie działają z `file://`).

Jedyna odpowiedzialność: trwałość i walidacja. `app.js` nie wie, jak wygląda
zapis.

| Metoda | Zwraca |
|---|---|
| `all()` | kopia tablicy przepisów, od najnowszego |
| `get(id)` | przepis albo `null` |
| `add(dane)` | `{ ok, recipe }` albo `{ ok: false, error }` |
| `update(id, dane)` | `{ ok, recipe }` albo `{ ok: false, error }` |
| `remove(id)` | `{ ok }` |
| `count()` | liczba przepisów |
| `exportFile()` | pobranie pliku `.json`; `{ ok, count }` |
| `importFile(plik)` | `Promise<{ ok, added, skipped }>` |

Walidacja odrzuca wpisy bez tytułu, bez składników albo bez kroków, i normalizuje
nieznane kategorie oraz grupy wiekowe do wartości domyślnych. Zapis łapie
`QuotaExceededError` i zwraca `error: "quota"`, zamiast po cichu zgubić przepis.

### `js/app.js` — zmiany

- `getAllRecipes()` = `RECIPES.concat(MyRecipes.all())` — jedno źródło dla
  siatki, wyszukiwarki i filtrów
- kategoria `moje` w filtrach (pokazuje wyłącznie `r.own`)
- odznaka „📒 Mój przepis" w `buildBadges()`
- modal własnego przepisu: **Edytuj**, **Usuń** (z potwierdzeniem)
- modal wbudowanego: **Zapisz jako mój przepis** — otwiera formularz z kopią
- modal formularza: tytuł, kategoria, grupa wiekowa, czas, składniki i kroki
  jako `textarea`, gdzie jedna linia to jedna pozycja — najszybszy sposób
  przepisywania z zeszytu
- panel „📒 Moje przepisy": licznik, **Zapisz kopię (.json)**, **Wczytaj kopię**

Walidacja formularza: tytuł, co najmniej jeden składnik, co najmniej jeden krok.
Pozostałe pola mają wartości domyślne.

### `index.html`

Przycisk „➕ Dodaj przepis" w nagłówku, kafelek kategorii „📒 Moje", markup
formularza i panelu, `<script src="js/my-recipes.js">` przed `app.js`.

Przy okazji poprawka liczby przepisów: `200` → `232` w tytule, podtytule,
stopce i `meta description`. Interfejs mówił „200 przepisów", a lista wypisywała
„Znaleziono 232 z 232".

### `css/styles.css`

Style formularza, odznaki własnego przepisu i panelu moich przepisów.

## Obsługa błędów

| Sytuacja | Zachowanie |
|---|---|
| przekroczony limit `localStorage` | komunikat „Brak miejsca — zapisz kopię i usuń część przepisów"; przepis nie znika z formularza |
| `localStorage` niedostępny | aplikacja działa dalej, tylko bez zapisu; komunikat przy próbie dodania |
| uszkodzony plik przy imporcie | komunikat o nieprawidłowym pliku; obecna baza nietknięta |
| pojedyncze błędne wpisy w pliku | pomijane, reszta wczytana; komunikat podaje, ile dodano i ile pominięto |
| uszkodzony wpis w `localStorage` | pomijany przy odczycie, żeby jeden błąd nie zablokował całej bazy |

## Testy

Aplikacja nie ma frameworka testowego i `.cursorrules` zabrania dokładania
zależności. Weryfikacja ręczna, na zbudowanym pakiecie MSIX:

1. dodanie przepisu → widoczny w liście, w wyszukiwarce po składniku i pod filtrem „Moje"
2. edycja i usunięcie własnego przepisu
3. „Zapisz jako mój przepis" na wbudowanym → kopia edytowalna, oryginał nietknięty
4. eksport → import na czystej instalacji → przepisy wracają
5. powtórny import tego samego pliku → nic się nie dubluje
6. dane przetrwają zamknięcie i ponowne uruchomienie aplikacji
7. składniki własnego przepisu trafiają na listę zakupów

## Wydanie

Wersja `1.0.1.0`, przebudowa pakietu, test lokalnej instalacji, wysyłka do
Microsoft Store z wypełnionym polem „Co nowego w tej wersji".
