// ------------------------------
// script.js (mit Tipps 3.1–3.3 umgesetzt)
// ------------------------------

// 1) Definition aller Supplements und ihrer Zyklus-/Icon-Daten
const supplementsBase = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], color: "#8B0000", restDay: true, cycle: [6, 2] },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], color: "#6B8E23", restDay: true, cycle: [6, 2] },
  { name: "D3 + K2", icons: ["🦴", "⏰"], color: "#D3D3D3", restDay: true, cycle: [8, 2] },
  { name: "Omega 3", icons: ["🧠", "⏰"], color: "#FF69B4", restDay: true, cycle: [6, 1] },
  { name: "Magnesium", icons: ["💤", "🌙"], color: "#1E90FF", restDay: true },
  { name: "Citrullin", icons: ["💪", "🏃"], color: "#f1c40f", restDay: false },
  { name: "Creatin", icons: ["🏋️", "🏃"], color: "#696969", restDay: false, cycle: [6, 2] },
  { name: "Whey Shake", icons: ["🥤", "🤯"], color: "#87CEFA", restDay: true },
  { name: "Whey Night", icons: ["🥤💤", "😴"], color: "#f77f00", restDay: false }
];

// 2) Initialer State oder aus localStorage geladen
// history enthält ab sofort für jedes Datum zusätzlich einen "counters"-Snapshot
let state = JSON.parse(localStorage.getItem("supplements-state")) || {
  dayType: "training",
  notes: "",
  checks: {},    // aktuell angeklickte Supplements für heute
  history: {},   // z.B. { "Fri Jun 06 2025": { checks: { ... }, counters: { ... } }, ... }
  lastDate: new Date().toDateString(),
  counters: {}   // Zähler pro Supplement für Zyklus‐Pauses
};

// 3) Funktion, um State in localStorage zu speichern
function saveState() {
  localStorage.setItem("supplements-state", JSON.stringify(state));
}

// Hilfsfunktion: Einen Datums-String (z. B. "Fri Jun 06 2025") in ein Date‐Objekt parsen
function parseDateString(dateStr) {
  return new Date(dateStr);
}

// 4) Wenn ein neuer Tag begonnen hat, History auffüllen
function resetDaily() {
  const todayStr = new Date().toDateString();
  if (state.lastDate !== todayStr) {
    // 4.1) Berechne Lücke zwischen state.lastDate und heute
    const last = parseDateString(state.lastDate);
    const today = parseDateString(todayStr);
    let pointer = new Date(last.getTime());
    
    // Für jeden Tag zwischen lastDate (inklusive) und (exklusive) heute
    while (pointer.toDateString() !== today.toDateString()) {
      const pointerStr = pointer.toDateString();
      
      // Falls noch kein History-Eintrag für pointerStr existiert, anlegen:
      if (!state.history[pointerStr]) {
        // checks: falls es der "echte" letzte Tag war, nimm den vorhandenen state.checks;
        // sonst leere checks (App wurde nicht geöffnet).
        const isActualLast = (pointerStr === state.lastDate);
        const recordChecks = isActualLast ? { ...state.checks } : {};
        const recordCounters = { ...state.counters };
        state.history[pointerStr] = {
          checks: recordChecks,
          counters: recordCounters
        };
      }

      // Bewege pointer um einen Tag vorwärts
      pointer.setDate(pointer.getDate() + 1);
    }

    // 4.2) Jetzt: state.history enthält für jeden Tag bis "gestern" einen Eintrag.
    //       Speichere danach den echten gestrigen Zustand:
    const yesterdayStr = state.lastDate;
    state.history[yesterdayStr] = {
      checks: { ...state.checks },
      counters: { ...state.counters }
    };

    // 4.3) Zähler-Logik: Für Supplements, die heute aktiv sind (nicht in Pause),
    //       erhöhe den counter. Pausen‐Berechnung erfolgt mit historischem Zähler-Snapshot.
    for (const supp of supplementsBase) {
      if (!state.counters[supp.name]) state.counters[supp.name] = 0;
      if (!isInPause(supp.name)) {
        state.counters[supp.name]++;
      }
    }

    // 4.4) Setze state.checks zurück für den neuen Tag
    state.checks = {};
    state.lastDate = todayStr;
    saveState();
  }
}

// 5) Prüfen, ob ein Supplement gerade in einer Pause ist (aktuell für "heute")
function isInPause(name) {
  const supp = supplementsBase.find(s => s.name === name);
  if (!supp?.cycle) return false;
  const [active, pause] = supp.cycle;
  const total = active + pause;
  const counter = state.counters[name] || 0;
  return (counter % total) >= active;
}

// 5b) Prüfen, ob ein Supplement an einem historischen Tag in Pause war:
//     Wir verwenden dafür den "counters"-Snapshot aus dem History-Eintrag jenes Tages.
function isInPauseHistoric(name, dayCounters) {
  const supp = supplementsBase.find(s => s.name === name);
  if (!supp?.cycle) return false;
  const [active, pause] = supp.cycle;
  const total = active + pause;
  const counter = dayCounters[name] || 0;
  return (counter % total) >= active;
}

// 6) Filtert und sortiert die Supplements je nach dayType
function getSupplementsToShow() {
  const isRest = state.dayType === "rest";
  return supplementsBase
    .filter(s => (isRest ? s.restDay : true))
    .map(s => ({ ...s }))
    .sort((a, b) => {
      if (isRest) {
        if (a.name === "Whey Shake") return -1;
        if (b.name === "Whey Shake") return 1;
      }
      return supplementsBase.indexOf(a) - supplementsBase.indexOf(b);
    });
}

// 7) Rendern der Supplements im DOM
function renderSupplements() {
  resetDaily();
  const container = document.getElementById("supplements");
  container.innerHTML = "";
  const supplements = getSupplementsToShow();

  // Wenn Trainingstag, Whey Shake und Whey Night in korrekter Reihenfolge
  if (state.dayType === "training") {
    const wheyIndex = supplements.findIndex(s => s.name === "Whey Shake");
    const nightIndex = supplements.findIndex(s => s.name === "Whey Night");
    if (wheyIndex > -1 && nightIndex > -1 && wheyIndex > nightIndex) {
      const [whey] = supplements.splice(wheyIndex, 1);
      supplements.splice(nightIndex, 0, whey);
    }
  }

  supplements.forEach(s => {
    const supp = { ...s };
    if (supp.name === "Whey Shake") {
      supp.icons[1] = state.dayType === "rest" ? "⏰" : "🤯";
    }

    const div = document.createElement("div");
    div.className = "supplement";
    if (isInPause(supp.name)) div.classList.add("paused");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.checks[supp.name] || false;
    checkbox.onchange = () => {
      state.checks[supp.name] = checkbox.checked;
      saveState();
    };

    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `${supp.icons[0]} ${supp.name}`;

    const right = document.createElement("div");
    right.className = "right-icon";
    right.textContent = isInPause(supp.name) ? "⏸️" : supp.icons[1];

    div.appendChild(checkbox);
    div.appendChild(left);
    div.appendChild(right);
    container.appendChild(div);
  });

  document.getElementById("notes").value = state.notes || "";
  document.getElementById("trainingBtn").classList.toggle("active", state.dayType === "training");
  document.getElementById("restBtn").classList.toggle("active", state.dayType === "rest");
}

// 8) Button-Handler, um dayType zu wechseln
function setDayType(type) {
  state.dayType = type;
  saveState();
  renderSupplements();
}

// 9) Notizen-Eingabe: bei jeder Änderung speichern
document.getElementById("notes").addEventListener("input", e => {
  state.notes = e.target.value;
  saveState();
});

// 10) Import-Funktion (JSON) – History wird übernommen
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = JSON.parse(reader.result);
      saveState();
      renderSupplements();
    } catch (err) {
      alert("Fehler beim Einlesen der Datei: Ungültiges JSON.");
    }
  };
  reader.readAsText(file);
}

// 11) Stats-Popup (Overlay) ein-/ausblenden, plus Body-Scroll steuern
function toggleStatsPopup() {
  const overlay = document.getElementById("overlayStats");
  const isCurrentlyOpen = overlay.style.display === "flex";

  if (isCurrentlyOpen) {
    // Overlay + Popup schließen
    overlay.style.display = "none";
    document.body.style.overflow = ""; // Body-Scroll wieder erlauben
  } else {
    // Overlay + Popup öffnen
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden"; // Body-Scroll ausschalten

    // Initiales Rendern der Statistik (Woche oder Monat)
    renderStatsChart(currentRange);
  }
}

// Stelle sicher, dass das Popup beim ersten Laden geschlossen bleibt
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("overlayStats").style.display = "none";
});

let currentRange = "week";
function renderStatsChart(range = "week") {
  currentRange = range;
  console.log("▶ renderStatsChart aufgerufen mit:", range);

  // 1) Bestimme "today" und erzeuge Liste der letzten N Tage (inkl. heute)
  const days = range === "week" ? 7 : 30;
  const today = new Date();
  const dateStrings = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    dateStrings.push(dt.toDateString());
  }

  // 2) Für jedes Supplement: Prozentsatz der Tage, an denen es eingenommen wurde,
  //    Pausen-Tage (cycle) überspringen.
  const labels = [];
  const data = [];
  const colors = [];

  supplementsBase.forEach(supp => {
    let countTaken = 0;
    let countConsideredDays = 0;

    dateStrings.forEach((dateStr, idx) => {
      // 2.1) Historische Daten:
      //     - Für idx==0 (heute) in state.checks
      //     - Für idx>0 in state.history[dateStr]
      let hadChecked = false;
      let dayCounters = {};

      if (idx === 0) {
        // Heute
        hadChecked = !!state.checks[supp.name];
        dayCounters = { ...state.counters };
      } else {
        const entry = state.history[dateStr];
        if (entry) {
          hadChecked =
