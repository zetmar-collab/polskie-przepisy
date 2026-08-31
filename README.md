# 🍲 Książka Kucharska

[![Pobierz z Microsoft Store](https://get.microsoft.com/images/en-us%20dark.svg)](https://apps.microsoft.com/detail/9nr7twlxmw6b)

Responsywna aplikacja webowa (HTML/CSS/JS, bez backendu) z **232 przepisami**
kulinarnymi podzielonymi na grupy wiekowe i kategorie dań.

## ✨ Funkcje

- **232 przepisy** — każdy zawiera składniki, sposób przygotowania i czas
- **4 kategorie**: 🍝 Obiady · 🥗 Sałatki · 🍮 Desery · 🍰 Ciasta (po 50 przepisów)
- **🎄 Dział świąteczny**: 34 przepisy — Wielkanoc (17) i Boże Narodzenie (17)
- **4 grupy wiekowe**:
  - 👶 dzieci i młodzież (3–18 lat)
  - 🧑 młodzi dorośli (20–40 lat)
  - 🧓 dorośli (40–60 lat)
  - 👵 seniorzy (60+)
- 🔍 **Wyszukiwarka** — po nazwie przepisu i po składnikach
- 🎚️ **Filtry** — kategoria + grupa wiekowa
- 🛒 **Lista zakupów** — dodawanie składników i **eksport do pliku `.txt`** (lista zapisuje się w przeglądarce)
- 📋 **Kopiowanie** całego przepisu do schowka
- 🤖 **Przyciski AI** (ChatGPT, Claude, Gemini, Perplexity, Copilot) — kopiują przepis z gotowym promptem i otwierają wybrany model do dalszej modyfikacji
- 📱 **Responsywność** — działa na komputerze i urządzeniach mobilnych
- 🎨 Kolorystyka przyjazna dla oka (ciepły krem, stonowana zieleń, terakota)

## 🛒 Wersja dla Windows (Microsoft Store)

Ta sama aplikacja jest wydana w Microsoft Store jako
**[Polskie Przepisy](https://apps.microsoft.com/detail/9nr7twlxmw6b)** — bezpłatnie, samodzielny pakiet MSIX z wbudowanym silnikiem stron, bez potrzeby instalowania
czegokolwiek dodatkowo. Kod hosta, manifest i skrypty budowania znajdziesz
w katalogu [`store/`](store/), a instrukcję w [`store/README-SKLEP.md`](store/README-SKLEP.md).

```powershell
pwsh -File store\scriptsuild-msix.ps1
```

## 🚀 Uruchomienie

Nie wymaga instalacji ani serwera. Wystarczy otworzyć plik:

```
index.html
```

w dowolnej nowoczesnej przeglądarce (Chrome, Firefox, Edge, Safari).

## 📁 Struktura projektu

```
Ksiazka-kucharska/
├── index.html          # struktura strony
├── css/
│   └── styles.css      # style + responsywność
├── js/
│   ├── recipes.js      # baza 232 przepisów (dane)
│   └── app.js          # logika aplikacji
├── .cursorrules        # kontekst projektu
└── README.md
```

## 🧩 Jak dodać własny przepis

W pliku `js/recipes.js` dopisz obiekt do tablicy `RECIPES`:

```js
{
  id: 201,
  title: "Nazwa dania",
  category: "obiady",      // obiady | salatki | desery | ciasta
  age: "mlodzi",           // dzieci | mlodzi | dorosli | seniorzy
  time: 30,                // czas w minutach
  ingredients: ["składnik 1", "składnik 2"],
  steps: ["krok 1", "krok 2"]
}
```

## 📝 Uwagi

- Lista zakupów jest zapisywana lokalnie w przeglądarce (localStorage).
- Przyciski AI kopiują przepis do schowka — jeśli model nie wczyta treści
  automatycznie, wystarczy wkleić ją skrótem **Ctrl + V**.

## ⚖️ Licencja

**Kod źródłowy — [MIT](LICENSE).** Możesz go używać, modyfikować i rozpowszechniać,
także komercyjnie, zachowując informację o autorstwie. Obejmuje `index.html`,
`css/`, `js/app.js` oraz cały katalog `store/` (host aplikacji, manifest MSIX,
skrypty budowania).

**Baza przepisów** (`js/recipes.js`) oraz **ikony i grafiki** (`icons/`,
`store/assets/`) — © Marek Zettel, wszelkie prawa zastrzeżone. Nie są objęte
licencją MIT; ich wykorzystanie wymaga zgody autora.

**`LICENCJA.txt`** to umowa licencyjna użytkownika końcowego (EULA) dołączana do
gotowej aplikacji dla jej odbiorców. Nie dotyczy korzystania z kodu źródłowego
z tego repozytorium — tu obowiązuje MIT.
