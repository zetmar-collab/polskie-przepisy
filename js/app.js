// Logika aplikacji Książka Kucharska
// Wymaga wcześniejszego załadowania js/recipes.js (zmienna globalna RECIPES)

(function () {
  "use strict";

  // ----- Etykiety do wyświetlania -----
  const CATEGORY_LABELS = {
    obiady: "🍝 Obiad",
    salatki: "🥗 Sałatka",
    desery: "🍮 Deser",
    ciasta: "🍰 Ciasto",
    swieta: "🎄 Święta",
  };
  const HOLIDAY_LABELS = {
    wielkanoc: "🐣 Wielkanoc",
    "boze-narodzenie": "🎄 Boże Narodzenie",
  };
  const AGE_LABELS = {
    dzieci: "👶 3–18 lat",
    mlodzi: "🧑 20–40 lat",
    dorosli: "🧓 40–60 lat",
    seniorzy: "👵 Seniorzy 60+",
  };

  // ----- Konfiguracja przycisków AI -----
  // q:true -> model przyjmuje zapytanie z parametru URL; zawsze kopiujemy prompt do schowka.
  const AI_MODELS = [
    { name: "ChatGPT", icon: "🤖", url: "https://chat.openai.com/?q=", q: true },
    { name: "Claude", icon: "✳️", url: "https://claude.ai/new?q=", q: true },
    { name: "Gemini", icon: "✨", url: "https://gemini.google.com/app?prompt=", q: true },
    { name: "Perplexity", icon: "🔎", url: "https://www.perplexity.ai/search?q=", q: true },
    { name: "Copilot", icon: "🪟", url: "https://copilot.microsoft.com/?q=", q: true },
  ];

  // Modele zdolne do generowania obrazów (do funkcji "Zobrazuj przepis")
  const IMAGE_AI_MODELS = [
    { name: "ChatGPT", icon: "🤖", url: "https://chat.openai.com/?q=", q: true },
    { name: "Gemini", icon: "✨", url: "https://gemini.google.com/app?prompt=", q: true },
  ];

  // ----- Stan aplikacji -----
  const state = {
    category: "all",
    age: "all",
    holiday: "all",
    query: "",
  };

  // klucz w localStorage dla listy zakupów
  const STORAGE_KEY = "ksiazka-kucharska-zakupy";
  let shoppingItems = loadShopping();

  // ----- Referencje do elementów DOM -----
  const grid = document.getElementById("recipesGrid");
  const noResults = document.getElementById("noResults");
  const resultsInfo = document.getElementById("resultsInfo");
  const searchInput = document.getElementById("searchInput");
  const modal = document.getElementById("recipeModal");
  const modalBody = document.getElementById("modalBody");
  const shoppingPanel = document.getElementById("shoppingPanel");
  const shoppingOverlay = document.getElementById("shoppingOverlay");
  const shoppingListEl = document.getElementById("shoppingList");
  const shoppingEmpty = document.getElementById("shoppingEmpty");
  const cartCount = document.getElementById("cartCount");

  // ===================== RENDEROWANIE =====================

  function getFilteredRecipes() {
    const q = state.query.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (state.category !== "all" && r.category !== state.category) return false;
      if (state.age !== "all" && r.age !== state.age) return false;
      if (state.holiday !== "all" && r.holiday !== state.holiday) return false;
      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inIngredients = r.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!inTitle && !inIngredients) return false;
      }
      return true;
    });
  }

  // Buduje odznaki (kategoria/święto/typ dania + grupa wiekowa) wspólne dla karty i modala
  function buildBadges(r) {
    const badges = [];
    if (r.holiday) {
      badges.push(`<span class="badge badge--holiday">${HOLIDAY_LABELS[r.holiday]}</span>`);
      if (r.dish) badges.push(`<span class="badge badge--cat">${escapeHtml(r.dish)}</span>`);
    } else {
      badges.push(`<span class="badge badge--cat">${CATEGORY_LABELS[r.category]}</span>`);
    }
    badges.push(`<span class="badge badge--age">${AGE_LABELS[r.age]}</span>`);
    return badges.join("");
  }

  function renderRecipes() {
    const list = getFilteredRecipes();
    grid.innerHTML = "";

    resultsInfo.textContent = `Znaleziono ${list.length} z ${RECIPES.length} przepisów`;
    noResults.hidden = list.length !== 0;

    const fragment = document.createDocumentFragment();
    list.forEach((r) => {
      const card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.innerHTML = `
        <div class="card__badges">
          ${buildBadges(r)}
          <span class="badge badge--time">⏱️ ${r.time} min</span>
        </div>
        <h3 class="card__title">${escapeHtml(r.title)}</h3>
        <p class="card__ingredients">${r.ingredients.slice(0, 4).map(escapeHtml).join(" · ")}${r.ingredients.length > 4 ? "…" : ""}</p>
        <span class="card__cta">Zobacz przepis →</span>
      `;
      card.addEventListener("click", () => openRecipe(r.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRecipe(r.id); }
      });
      fragment.appendChild(card);
    });
    grid.appendChild(fragment);
  }

  // ===================== MODAL PRZEPISU =====================

  function openRecipe(id) {
    const r = RECIPES.find((x) => x.id === id);
    if (!r) return;

    const ingredientsHtml = r.ingredients
      .map((i) => `<li>${escapeHtml(i)}</li>`)
      .join("");
    const stepsHtml = r.steps
      .map((s) => `<li>${escapeHtml(s)}</li>`)
      .join("");

    const aiButtonsHtml = AI_MODELS
      .map((m) => `<button class="ai-btn" data-ai="${m.name}">${m.icon} ${m.name}</button>`)
      .join("");

    const imageButtonsHtml = IMAGE_AI_MODELS
      .map((m) => `<button class="ai-btn ai-btn--image" data-image-ai="${m.name}">${m.icon} ${m.name}</button>`)
      .join("");

    modalBody.innerHTML = `
      <h2 class="recipe__title" id="modalTitle">${escapeHtml(r.title)}</h2>
      <div class="recipe__meta">
        ${buildBadges(r)}
        <span class="badge badge--time">⏱️ Czas: ${r.time} min</span>
      </div>

      <h3 class="recipe__section-title">🧺 Składniki</h3>
      <ul class="recipe__list">${ingredientsHtml}</ul>

      <h3 class="recipe__section-title">👨‍🍳 Sposób przygotowania</h3>
      <ol class="recipe__list recipe__steps">${stepsHtml}</ol>

      <div class="recipe__actions">
        <button class="btn btn--primary" id="addToShopping">🛒 Dodaj składniki do listy</button>
        <button class="btn btn--ghost" id="copyRecipe">📋 Kopiuj przepis</button>
        <button class="btn btn--accent" id="printRecipe">🖨️ Drukuj</button>
      </div>

      <div class="ai-section">
        <p class="ai-section__title">🤖 Chcesz zmodyfikować przepis? Otwórz w wybranym AI (przepis skopiuje się do schowka):</p>
        <div class="ai-buttons">${aiButtonsHtml}</div>
      </div>

      <div class="ai-section">
        <p class="ai-section__title">🖼️ Zobrazuj przepis — wygeneruj zdjęcie gotowej potrawy w AI (prompt skopiuje się do schowka):</p>
        <div class="ai-buttons">${imageButtonsHtml}</div>
      </div>

      <p class="ai-hint">
        ℹ️ <strong>Gemini</strong> nie wstawia promptu z linku automatycznie. Jeśli treść się nie pojawi,
        wklej ją ręcznie (<strong>Ctrl + V</strong>) lub zainstaluj darmowe rozszerzenie
        <a href="https://chromewebstore.google.com/detail/gemini-url-prompt/kdbgjkfdooaiompgeckjbegnnccchmma"
           target="_blank" rel="noopener">Gemini URL Prompt</a>,
        dzięki któremu prompt wyśle się sam.
      </p>
    `;

    modalBody.querySelector("#addToShopping").addEventListener("click", () => {
      addIngredientsToShopping(r);
    });
    modalBody.querySelector("#copyRecipe").addEventListener("click", () => {
      copyToClipboard(recipeToText(r));
      showToast("📋 Przepis skopiowany do schowka!");
    });
    modalBody.querySelector("#printRecipe").addEventListener("click", () => {
      printRecipe(r);
    });
    modalBody.querySelectorAll("[data-ai]").forEach((btn) => {
      btn.addEventListener("click", () => openInAI(btn.dataset.ai, r));
    });
    modalBody.querySelectorAll("[data-image-ai]").forEach((btn) => {
      btn.addEventListener("click", () => visualizeRecipe(btn.dataset.imageAi, r));
    });

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  // ===================== TEKST PRZEPISU / AI =====================

  function recipeToText(r) {
    const lines = [];
    lines.push(r.title.toUpperCase());
    if (r.holiday) {
      lines.push(`Święta: ${HOLIDAY_LABELS[r.holiday].replace(/^[^ ]+ /, "")}`);
      if (r.dish) lines.push(`Rodzaj dania: ${r.dish}`);
    } else {
      lines.push(`Kategoria: ${CATEGORY_LABELS[r.category].replace(/^[^ ]+ /, "")}`);
    }
    lines.push(`Grupa wiekowa: ${AGE_LABELS[r.age].replace(/^[^ ]+ /, "")}`);
    lines.push(`Czas przygotowania: ${r.time} min`);
    lines.push("");
    lines.push("SKŁADNIKI:");
    r.ingredients.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
    lines.push("SPOSÓB PRZYGOTOWANIA:");
    r.steps.forEach((s, idx) => lines.push(`${idx + 1}. ${s}`));
    return lines.join("\n");
  }

  function openInAI(modelName, r) {
    const model = AI_MODELS.find((m) => m.name === modelName);
    if (!model) return;

    const prompt =
      `Oto przepis kulinarny. Pomóż mi go zmodyfikować (np. zmień liczbę porcji, ` +
      `zaproponuj wersję wegetariańską/bezglutenową lub zdrowsze zamienniki):\n\n` +
      recipeToText(r);

    copyToClipboard(prompt);

    let targetUrl = model.url;
    if (model.q) {
      targetUrl = model.url + encodeURIComponent(prompt);
    }
    window.open(targetUrl, "_blank", "noopener");
    if (model.name === "Gemini") {
      showToast("✅ Przepis skopiowany! W Gemini kliknij pole tekstowe, wklej (Ctrl+V) i naciśnij Enter.");
    } else {
      showToast(`✅ Przepis skopiowany — otwieram ${model.name}. Wklej (Ctrl+V), jeśli treść się nie pojawi.`);
    }
  }

  function visualizeRecipe(modelName, r) {
    const model = IMAGE_AI_MODELS.find((m) => m.name === modelName);
    if (!model) return;

    const mainIngredients = r.ingredients.slice(0, 6).join(", ");
    const dishType = r.holiday && r.dish
      ? `${r.dish.toLowerCase()} na ${HOLIDAY_LABELS[r.holiday].replace(/^[^ ]+ /, "").toLowerCase()}`
      : CATEGORY_LABELS[r.category].replace(/^[^ ]+ /, "").toLowerCase();

    const prompt =
      `Wygeneruj fotorealistyczne, apetyczne zdjęcie gotowej potrawy: "${r.title}". ` +
      `To danie z kategorii: ${dishType}. ` +
      `Główne składniki: ${mainIngredients}. ` +
      `Potrawa ładnie podana na talerzu, profesjonalna fotografia kulinarna, ` +
      `naturalne miękkie światło, ostre detale, kuszący wygląd, widok z góry lub pod kątem 45 stopni.`;

    copyToClipboard(prompt);

    let targetUrl = model.url;
    if (model.q) {
      targetUrl = model.url + encodeURIComponent(prompt);
    }
    window.open(targetUrl, "_blank", "noopener");
    if (model.name === "Gemini") {
      showToast("🖼️ Prompt skopiowany! W Gemini kliknij pole tekstowe, wklej (Ctrl+V) i naciśnij Enter.");
    } else {
      showToast(`🖼️ Prompt obrazu skopiowany — otwieram ${model.name}. Wklej (Ctrl+V), jeśli treść się nie pojawi.`);
    }
  }

  // ===================== DRUKOWANIE =====================

  function printRecipe(r) {
    const ingredientsHtml = r.ingredients
      .map((i) => `<li>${escapeHtml(i)}</li>`)
      .join("");
    const stepsHtml = r.steps
      .map((s) => `<li>${escapeHtml(s)}</li>`)
      .join("");

    const catLabel = r.holiday
      ? HOLIDAY_LABELS[r.holiday].replace(/^[^ ]+ /, "")
      : CATEGORY_LABELS[r.category].replace(/^[^ ]+ /, "");
    const catTitle = r.holiday ? "Święta" : "Kategoria";
    const dishLine = r.holiday && r.dish
      ? `<span><strong>Rodzaj:</strong> ${escapeHtml(r.dish)}</span>`
      : "";
    const age = AGE_LABELS[r.age].replace(/^[^ ]+ /, "");
    const date = new Date().toLocaleDateString("pl-PL");

    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(r.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #2b2b2b; max-width: 720px; margin: 0 auto; padding: 32px; line-height: 1.6; }
  h1 { font-size: 28px; margin: 0 0 8px; border-bottom: 3px solid #6b8e5a; padding-bottom: 10px; }
  .meta { color: #555; font-size: 14px; margin-bottom: 24px; }
  .meta span { display: inline-block; margin-right: 16px; }
  h2 { font-size: 18px; color: #56754a; margin: 24px 0 8px; }
  ul, ol { padding-left: 22px; }
  li { margin-bottom: 6px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 12px; color: #888; text-align: center; }
  @media print { body { padding: 0; } button { display: none; } }
</style>
</head>
<body>
  <h1>${escapeHtml(r.title)}</h1>
  <div class="meta">
    <span><strong>${catTitle}:</strong> ${escapeHtml(catLabel)}</span>
    ${dishLine}
    <span><strong>Grupa wiekowa:</strong> ${escapeHtml(age)}</span>
    <span><strong>Czas:</strong> ${r.time} min</span>
  </div>

  <h2>Składniki</h2>
  <ul>${ingredientsHtml}</ul>

  <h2>Sposób przygotowania</h2>
  <ol>${stepsHtml}</ol>

  <div class="footer">Książka Kucharska · wydrukowano ${date}</div>
  <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Zezwól na otwieranie okien, aby wydrukować przepis");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // ===================== LISTA ZAKUPÓW =====================

  function loadShopping() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveShopping() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shoppingItems));
    } catch (e) {
      /* brak dostępu do localStorage - pomijamy */
    }
  }

  function addIngredientsToShopping(r) {
    let added = 0;
    r.ingredients.forEach((ing) => {
      if (!shoppingItems.includes(ing)) {
        shoppingItems.push(ing);
        added++;
      }
    });
    saveShopping();
    renderShopping();
    showToast(added > 0
      ? `🛒 Dodano ${added} składnik(ów) do listy zakupów`
      : "Te składniki są już na liście");
  }

  function removeShoppingItem(index) {
    shoppingItems.splice(index, 1);
    saveShopping();
    renderShopping();
  }

  function renderShopping() {
    cartCount.textContent = shoppingItems.length;
    shoppingListEl.innerHTML = "";
    shoppingEmpty.hidden = shoppingItems.length !== 0;

    shoppingItems.forEach((item, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${escapeHtml(item)}</span>`;
      const btn = document.createElement("button");
      btn.textContent = "✕";
      btn.setAttribute("aria-label", "Usuń z listy");
      btn.addEventListener("click", () => removeShoppingItem(idx));
      li.appendChild(btn);
      shoppingListEl.appendChild(li);
    });
  }

  function exportShopping() {
    if (shoppingItems.length === 0) {
      showToast("Lista zakupów jest pusta");
      return;
    }
    const header = "LISTA ZAKUPÓW — Książka Kucharska\n" + "=".repeat(34) + "\n\n";
    const body = shoppingItems.map((i) => `[ ] ${i}`).join("\n");
    const date = new Date().toLocaleDateString("pl-PL");
    const content = header + body + `\n\nWygenerowano: ${date}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lista-zakupow.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("⬇️ Pobrano listę zakupów (.txt)");
  }

  function openShopping() {
    renderShopping();
    shoppingPanel.hidden = false;
    shoppingOverlay.hidden = false;
  }
  function closeShopping() {
    shoppingPanel.hidden = true;
    shoppingOverlay.hidden = true;
  }

  // ===================== NARZĘDZIA =====================

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("toast--show"), 3000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setupFilterButtons(containerId, filterKey) {
    const container = document.getElementById(containerId);
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      container.querySelectorAll(".chip").forEach((c) => c.classList.remove("chip--active"));
      btn.classList.add("chip--active");
      state[filterKey] = btn.dataset.value;

      // Podgrupa świąteczna widoczna tylko dla kategorii "Święta"
      if (filterKey === "category") {
        toggleHolidayFilter(btn.dataset.value === "swieta");
      }
      renderRecipes();
    });
  }

  function toggleHolidayFilter(show) {
    const group = document.getElementById("holidayGroup");
    group.hidden = !show;
    if (!show) {
      // reset podgrupy świątecznej przy wyjściu z kategorii Święta
      state.holiday = "all";
      const holidayBtns = document.querySelectorAll("#holidayFilters .chip");
      holidayBtns.forEach((c) => c.classList.remove("chip--active"));
      const allBtn = document.querySelector('#holidayFilters .chip[data-value="all"]');
      if (allBtn) allBtn.classList.add("chip--active");
    }
  }

  // ===================== INICJALIZACJA =====================

  function init() {
    renderRecipes();
    renderShopping();

    setupFilterButtons("categoryFilters", "category");
    setupFilterButtons("ageFilters", "age");
    setupFilterButtons("holidayFilters", "holiday");

    let searchTimer = null;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => {
        state.query = val;
        renderRecipes();
      }, 200);
    });

    // zamykanie modala
    modal.querySelectorAll("[data-close-modal]").forEach((el) =>
      el.addEventListener("click", closeModal)
    );

    // panel zakupów
    document.getElementById("toggleShopping").addEventListener("click", openShopping);
    document.getElementById("closeShopping").addEventListener("click", closeShopping);
    shoppingOverlay.addEventListener("click", closeShopping);
    document.getElementById("exportShopping").addEventListener("click", exportShopping);
    document.getElementById("clearShopping").addEventListener("click", () => {
      shoppingItems = [];
      saveShopping();
      renderShopping();
      showToast("🗑️ Wyczyszczono listę zakupów");
    });

    // Esc zamyka okna
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!modal.hidden) closeModal();
        if (!shoppingPanel.hidden) closeShopping();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
