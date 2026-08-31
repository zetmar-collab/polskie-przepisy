// Własne przepisy użytkownika — warstwa danych
// Odpowiada wyłącznie za trwałość (localStorage), walidację i kopię zapasową.
// Reszta aplikacji korzysta z tego obiektu i nie wie, jak wygląda zapis.

window.MyRecipes = (function () {
  "use strict";

  const STORAGE_KEY = "ksiazka-kucharska-moje-przepisy";
  const FILE_FORMAT = "ksiazka-kucharska/moje-przepisy";
  const FILE_VERSION = 1;

  const CATEGORIES = ["obiady", "salatki", "desery", "ciasta"];
  const AGES = ["dzieci", "mlodzi", "dorosli", "seniorzy"];
  const DEFAULT_CATEGORY = "obiady";
  const DEFAULT_AGE = "dorosli";
  const DEFAULT_TIME = 30;

  let items = readStorage();

  // ===================== ODCZYT I ZAPIS =====================

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Pojedynczy uszkodzony wpis nie może zablokować całej bazy.
      return parsed.map(normalize).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function writeStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return { ok: true };
    } catch (e) {
      // Najczęściej QuotaExceededError, ale też tryb prywatny bez dostępu do zapisu.
      return { ok: false, error: isQuotaError(e) ? "quota" : "storage" };
    }
  }

  function isQuotaError(e) {
    return (
      e &&
      (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        e.code === 22)
    );
  }

  // ===================== WALIDACJA =====================

  // Zamienia dowolne dane wejściowe na poprawny przepis albo zwraca null.
  function normalize(data) {
    if (!data || typeof data !== "object") return null;

    const title = text(data.title);
    const ingredients = lines(data.ingredients);
    const steps = lines(data.steps);
    if (!title || !ingredients.length || !steps.length) return null;

    return {
      id: text(data.id) || newId(),
      title: title,
      category: CATEGORIES.indexOf(data.category) !== -1 ? data.category : DEFAULT_CATEGORY,
      age: AGES.indexOf(data.age) !== -1 ? data.age : DEFAULT_AGE,
      time: time(data.time),
      ingredients: ingredients,
      steps: steps,
      own: true,
      createdAt: text(data.createdAt) || new Date().toISOString(),
    };
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  // Przyjmuje tablicę albo tekst z jedną pozycją w linii.
  function lines(value) {
    const list = Array.isArray(value) ? value : String(value || "").split("\n");
    return list.map(text).filter(Boolean);
  }

  function time(value) {
    const minutes = parseInt(value, 10);
    if (!isFinite(minutes) || minutes <= 0) return DEFAULT_TIME;
    return Math.min(minutes, 24 * 60);
  }

  function newId() {
    const stamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `moj-${stamp}-${random}`;
  }

  // ===================== OPERACJE =====================

  function all() {
    // Najnowsze na górze — użytkownik zwykle szuka tego, co przed chwilą dopisał.
    return items.slice().reverse();
  }

  function get(id) {
    return items.find((r) => r.id === id) || null;
  }

  function count() {
    return items.length;
  }

  function add(data) {
    const recipe = normalize(data);
    if (!recipe) return { ok: false, error: "invalid" };

    recipe.id = newId();
    recipe.createdAt = new Date().toISOString();
    items.push(recipe);

    const saved = writeStorage();
    if (!saved.ok) {
      items.pop();
      return saved;
    }
    return { ok: true, recipe: recipe };
  }

  function update(id, data) {
    const index = items.findIndex((r) => r.id === id);
    if (index === -1) return { ok: false, error: "notfound" };

    const previous = items[index];
    const recipe = normalize(data);
    if (!recipe) return { ok: false, error: "invalid" };

    recipe.id = previous.id;
    recipe.createdAt = previous.createdAt;
    items[index] = recipe;

    const saved = writeStorage();
    if (!saved.ok) {
      items[index] = previous;
      return saved;
    }
    return { ok: true, recipe: recipe };
  }

  function remove(id) {
    const index = items.findIndex((r) => r.id === id);
    if (index === -1) return { ok: false, error: "notfound" };

    const previous = items[index];
    items.splice(index, 1);

    const saved = writeStorage();
    if (!saved.ok) {
      items.splice(index, 0, previous);
      return saved;
    }
    return { ok: true };
  }

  // ===================== KOPIA ZAPASOWA =====================

  function exportFile() {
    if (!items.length) return { ok: false, error: "empty" };

    const payload = {
      format: FILE_FORMAT,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      recipes: items,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { ok: true, count: items.length };
  }

  function fileName() {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    return `moje-przepisy-${stamp}.json`;
  }

  // Dopisuje przepisy z pliku, pomijając te, które już są (po id).
  function importFile(file) {
    return new Promise((resolve) => {
      if (!file) {
        resolve({ ok: false, error: "nofile" });
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => resolve({ ok: false, error: "unreadable" });
      reader.onload = () => resolve(importText(reader.result));
      reader.readAsText(file, "utf-8");
    });
  }

  function importText(raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return { ok: false, error: "invalidfile" };
    }

    // Akceptujemy plik z kopii zapasowej oraz samą tablicę przepisów.
    const incoming = Array.isArray(parsed) ? parsed : parsed && parsed.recipes;
    if (!Array.isArray(incoming)) return { ok: false, error: "invalidfile" };

    const known = {};
    items.forEach((r) => {
      known[r.id] = true;
    });

    const added = [];
    let skipped = 0;

    incoming.forEach((entry) => {
      const recipe = normalize(entry);
      if (!recipe) {
        skipped++;
        return;
      }
      if (known[recipe.id]) {
        skipped++;
        return;
      }
      known[recipe.id] = true;
      added.push(recipe);
    });

    if (!added.length) return { ok: true, added: 0, skipped: skipped };

    const previous = items.slice();
    items = items.concat(added);

    const saved = writeStorage();
    if (!saved.ok) {
      items = previous;
      return saved;
    }
    return { ok: true, added: added.length, skipped: skipped };
  }

  return {
    CATEGORIES: CATEGORIES,
    AGES: AGES,
    all: all,
    get: get,
    count: count,
    add: add,
    update: update,
    remove: remove,
    exportFile: exportFile,
    importFile: importFile,
  };
})();
