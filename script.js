// ------------------------------
// script.js
// ------------------------------

// 1) Definition aller Supplements und ihrer Zyklus-/Icon-Daten
const supplementsBase = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], color: "#8B0000", restDay: true, cycle: [6, 2] },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], color: "#6B8E23", restDay: true, cycle: [6, 2] }, // dunkleres Olivgrün
  { name: "D3 + K2", icons: ["🦴", "⏰"], color: "#D3D3D3", restDay: true, cycle: [8, 2] },
  { name: "Omega 3", icons: ["🧠", "⏰"], color: "#FF69B4", restDay: true, cycle: [6, 1] },
  { name: "Magnesium", icons: ["💤", "🌙"], color: "#1E90FF", restDay: true },   // helleres Blau
  { name: "Citrullin", icons: ["💪", "🏃"], color: "#f1c40f", restDay: false },
  { name: "Creatin", icons: ["🏋️", "🏃"], color: "#696969", restDay: false, cycle: [6, 2] },
  { name: "Whey Shake", icons: ["🥤", "🤯"], color: "#87CEFA", restDay: true },  // helleres Blau
  { name: "Whey Night", icons: ["🥤💤", "😴"], color: "#f77f00", restDay: false }
];

// 2) Initialer State oder aus localStorage geladen
let state = JSON.parse(localStorage.getItem("supplements-state")) || {
  dayType: "training",
  notes: "",
  checks: {},
  counters: {},
  lastDate: new Date().toDateString()
};

// 3) Funktion, um State in localStorage zu speichern
function saveState() {
  localStorage.setItem("supplements-state", JSON.stringify(state));
}

// 4) Wenn ein neuer Tag beginnt, Counter hochzählen und Häkchen resetten
function resetDaily() {
  const today = new Date().toDateString();
  if (state.lastDate !== today) {
    state.lastDate = today;
    state.checks = {};
    for (const supp of supplementsBase) {
      if (!state.counters[supp.name]) state.counters[supp.name] = 0;
      if (!isInPause(supp.name)) {
        state.counters[supp.name]++;
      }
    }
    saveState();
  }
}

// 5) Prüfen, ob ein Supplement gerade in einer Pause ist
function isInPause(name) {
  const supp = supplementsBase.find(s => s.name === name);
  if (!supp?.cycle) return false;
  const [active, pause] = supp.cycle;
  const total = active + pause;
  const counter = state.counters[name] || 0;
  return counter % total >= active;
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

// 10) Import-Funktion (JSON)
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

  // Wir zeigen jetzt **alle** Supplements in der Statistik, unabhängig von Checkboxen:
  const labels = supplementsBase.map(s => s.name);
  const days = range === "week" ? 7 : 30;
  const data = supplementsBase.map(s => {
    const c = state.counters[s.name] || 0;
    return Math.min(100, Math.round((c % (days + 1)) / days * 100));
  });

  // Die zugehörigen Balkenfarben:
  const colors = supplementsBase.map(s => s.color);

  const canvas = document.getElementById("statsChart");
  const ctx = canvas.getContext("2d");

  // Prüfe, ob das Canvas korrekt 190px hoch ist
  console.log("→ Canvas-Höhe (px):", canvas.offsetHeight);

  // Vorherigen Chart zerstören, falls vorhanden
  if (window.myChart) window.myChart.destroy();

  // Chart erzeugen
  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "% Einnahme",
        data,
        backgroundColor: colors,
        borderRadius: 5,
        barThickness: 20
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  console.log("→ Chart-Datenfarben:", window.myChart.data.datasets[0].backgroundColor);
}

// 12) CSV-Export (global an window gebunden, mit Header-Namen und ohne Leerzeile)
window.exportCSV = function() {
  console.log("exportCSV wurde über window aufgerufen");

  // 1. Kopfzeile mit den deutschen Spaltennamen
  const headers = [
    "Supplement",   // statt "name"
    "Aktivität",    // statt "dayType"
    "Status",       // statt "EinnahmeStatus"
    "Datum",        // statt "lastDate"
    "Pause"         // statt "PauseStatus"
  ];
  const csvRows = [];
  csvRows.push(headers.join(","));

  // 2. Pro Supplement eine Zeile mit Werten
  for (const supp of supplementsBase) {
    const supplementName = supp.name;
    const aktivitaet = state.dayType;
    const status = state.checks[supplementName] ? "eingenommen" : "nicht eingenommen";
    const datumRaw = state.lastDate;
    const datum = `"${datumRaw}"`;
    const pause = isInPause(supplementName) ? "Pause" : "keine Pause";

    const row = [supplementName, aktivitaet, status, datum, pause];
    csvRows.push(row.join(","));
  }

  // 3. Sofort Notizen-Zeile (kein Leerzeilen-Abschnitt)
  const notesEscaped = state.notes ? state.notes.replace(/\r?\n/g, "\\r\\n") : "";
  csvRows.push(`Notizen,"${notesEscaped}"`);

  // 4. Gesamten CSV-Text zusammenfügen
  const csvString = csvRows.join("\r\n");

  // 5. Download-Link erstellen und klicken
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplement-data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // 6. URL-Objekt wieder freigeben
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

// 13) Service Worker registrieren (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 14) Beim initialen Laden Supplements rendern
renderSupplements();
