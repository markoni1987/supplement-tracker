// ------------------------------
// script.js (mit Tips 3.1–3.3 umgesetzt)
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
//    history speichert pro Tag: { checks: { … }, counters: { … } }
let state = JSON.parse(localStorage.getItem("supplements-state")) || {
  dayType: "training",
  notes: "",
  checks: {},       // { "Vitamin B12": true/false, … }  — für heute
  history: {},      // { "Tue Jun 04 2025": { checks: { … }, counters: { … } }, … }
  lastDate: new Date().toDateString(),
  counters: {}      // { "Vitamin B12": <Zähler>, … } für Zyklus‐Logik
};

// 3) Funktion, um State in localStorage zu speichern
function saveState() {
  localStorage.setItem("supplements-state", JSON.stringify(state));
}

// Hilfsfunktion: Datum-String → Date‐Objekt
function parseDateString(dateStr) {
  return new Date(new Date(dateStr).toDateString());
}

// 4) Bei jedem Rendern prüfen, ob ein neuer Tag begonnen hat.
//    Falls ja: alle Tage zwischen lastDate und heute in state.history auffüllen.
function resetDaily() {
  const todayStr = new Date().toDateString();
  if (state.lastDate !== todayStr) {
    const lastDateObj = parseDateString(state.lastDate);
    const todayObj = parseDateString(todayStr);

    // 4.1) Für jedes Datum zwischen lastDate (inklusiv) und gestern (inklusiv):
    let pointer = new Date(lastDateObj.getTime());
    while (pointer.toDateString() !== todayObj.toDateString()) {
      const pointerStr = pointer.toDateString();

      // Falls für diesen Tag noch kein Eintrag existiert, anlegen:
      if (!state.history[pointerStr]) {
        // a) checks: wenn pointerStr == letzter Tag, dann state.checks (echter Wert von gestern);
        //           sonst {} (App war an diesem Tag geschlossen).
        const isYesterday = (pointerStr === state.lastDate);
        const savedChecks = isYesterday ? { ...state.checks } : {};
        // b) counters: Wir speichern den aktuellen Zähler‐Snapshot.
        const savedCounters = { ...state.counters };
        state.history[pointerStr] = {
          checks: savedChecks,
          counters: savedCounters
        };
      }

      // pointer++ (nächster Tag)
      pointer.setDate(pointer.getDate() + 1);
    }

    // 4.2) Eigentlichen „Übergang“ auf heute:
    //       Zähler für heute updaten (nur Supplements, die nicht in Pause sind).
    for (const supp of supplementsBase) {
      if (!state.counters[supp.name]) state.counters[supp.name] = 0;
      // Prüfen, ob heute in Pause: (Zähler vor dem Inkrement)
      const inPauseToday = (() => {
        const [active, pause] = supp.cycle || [];
        if (!supp.cycle) return false;
        const cnt = state.counters[supp.name] || 0;
        const total = active + pause;
        return (cnt % total) >= active;
      })();
      if (!inPauseToday) {
        state.counters[supp.name]++;
      }
    }

    // 4.3) Reset für state.checks (heute beginnen wir frisch)
    state.checks = {};
    state.lastDate = todayStr;
    saveState();
  }
}

// 5) Prüfen, ob ein Supplement hier und jetzt in Pause ist
function isInPause(name) {
  const supp = supplementsBase.find(s => s.name === name);
  if (!supp?.cycle) return false;
  const [active, pause] = supp.cycle;
  const total = active + pause;
  const counter = state.counters[name] || 0;
  return (counter % total) >= active;
}

// 5b) Prüfen, ob ein Supplement an einem historischen Tag in Pause war:
//     Wir lesen den counters-Snapshot aus state.history[dateStr].counters
function isInPauseHistoric(name, dayCounters) {
  const supp = supplementsBase.find(s => s.name === name);
  if (!supp?.cycle) return false;
  const [active, pause] = supp.cycle;
  const total = active + pause;
  const counter = dayCounters[name] || 0;
  return (counter % total) >= active;
}

// 6) Filtert & sortiert je nach dayType (Training vs. Ruhetag)
function getSupplementsToShow() {
  const isRest = state.dayType === "rest";
  return supplementsBase
    .filter(s => isRest ? s.restDay : true)
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

  // Falls Trainingstag: Whey Shake und Whey Night tauschen, falls nötig
  if (state.dayType === "training") {
    const wheyIndex = supplements.findIndex(s => s.name === "Whey Shake");
    const nightIndex = supplements.findIndex(s => s.name === "Whey Night");
    if (wheyIndex > -1 && nightIndex > -1 && wheyIndex > nightIndex) {
      const [whey] = supplements.splice(wheyIndex, 1);
      supplements.splice(nightIndex, 0, whey);
    }
  }

  supplements.forEach(supp => {
    // Bei Whey Shake Icon ändern je nach dayType
    const thisSupp = { ...supp };
    if (thisSupp.name === "Whey Shake") {
      thisSupp.icons[1] = (state.dayType === "rest") ? "⏰" : "🤯";
    }

    const div = document.createElement("div");
    div.className = "supplement";
    if (isInPause(thisSupp.name)) div.classList.add("paused");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.checks[thisSupp.name] || false;
    checkbox.onchange = () => {
      state.checks[thisSupp.name] = checkbox.checked;
      saveState();
    };

    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `${thisSupp.icons[0]} ${thisSupp.name}`;

    const right = document.createElement("div");
    right.className = "right-icon";
    right.textContent = isInPause(thisSupp.name) ? "⏸️" : thisSupp.icons[1];

    div.appendChild(checkbox);
    div.appendChild(left);
    div.appendChild(right);
    container.appendChild(div);
  });

  document.getElementById("notes").value = state.notes || "";
  document.getElementById("trainingBtn").classList.toggle("active", state.dayType === "training");
  document.getElementById("restBtn").classList.toggle("active", state.dayType === "rest");
}

// 8) Button-Handler, um zwischen Training/Ruhetag zu wechseln
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

// 10) Import-Funktion (JSON) – übernimmt auch history und counters
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

// 11) Stats-Popup ein-/ausblenden + Body-Scroll steuern
function toggleStatsPopup() {
  const overlay = document.getElementById("overlayStats");
  const isOpen = overlay.style.display === "flex";
  if (isOpen) {
    overlay.style.display = "none";
    document.body.style.overflow = "";
  } else {
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    renderStatsChart(currentRange);
  }
}

// Beim initialen Laden Popup standardmäßig schließen
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("overlayStats").style.display = "none";
});

let currentRange = "week";
function renderStatsChart(range = "week") {
  currentRange = range;

  // 1) Baue Liste der letzten N Tage (inkl. heute)
  const days = (range === "week") ? 7 : 30;
  const today = new Date();
  const dateStrings = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    dateStrings.push(dt.toDateString());
  }

  // 2) Berechne pro Supplement: (Anzahl eingenommener Tage) / (Anzahl berücksichtigter Tage) × 100
  const labels = [];
  const data = [];
  const colors = [];

  supplementsBase.forEach(supp => {
    let countTaken = 0;
    let countConsidered = 0;

    dateStrings.forEach((dateStr, idx) => {
      // a) Ermitteln, ob an diesem Tag ein Häkchen gesetzt war:
      let hadChecked = false;
      let dayCounters = {};

      if (idx === 0) {
        // Heute
        hadChecked = !!state.checks[supp.name];
        dayCounters = { ...state.counters };
      } else {
        // Ältere Tage
        const entry = state.history[dateStr];
        if (entry) {
          hadChecked = !!entry.checks[supp.name];
          dayCounters = { ...entry.counters };
        } else {
          // Wenn gar kein History‐Eintrag vorliegt (App geschlossen an dem Tag),
          // werten wir als „nicht eingenommen“, und dayCounters bleibt vom neuesten Stand
          hadChecked = false;
          dayCounters = { ...state.counters };
        }
      }

      // b) Prüfen, ob an diesem Tag Pause war (historisch):
      if (!isInPauseHistoric(supp.name, dayCounters)) {
        // Nur wenn NICHT in Pause, gehört der Tag in die Statistik:
        countConsidered++;
        if (hadChecked) countTaken++;
      }
      // Wenn Pause, zählen wir weder in countTaken noch in countConsidered
    });

    // c) Prozent berechnen (0, falls überhaupt keine berücksichtigten Tage)
    const percent = (countConsidered > 0)
      ? Math.round((countTaken / countConsidered) * 100)
      : 0;

    labels.push(supp.name);
    data.push(percent);
    colors.push(supp.color);
  });

  // 3) Chart erzeugen
  const canvas = document.getElementById("statsChart");
  const ctx = canvas.getContext("2d");

  if (window.myChart) window.myChart.destroy();

  // 4) Falls alle Prozentwerte 0 → Hinweistext anzeigen
  const allZero = data.every(v => v === 0);
  if (allZero) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Keine Daten in diesem Zeitraum", canvas.width / 2, canvas.height / 2);
    return;
  }

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "% der Einnahmetage",
        data,
        backgroundColor: colors,
        borderRadius: 5,
        barThickness: 18
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              const suppName = context.label;
              const pct = context.raw;
              // Für den Tooltip zählen wir hier erneut kurz ab,
              // um X von Y Tage anzuzeigen:
              let countTaken = 0;
              let countConsidered = 0;
              for (let i = 0; i < days; i++) {
                const dt = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const ds = dt.toDateString();
                let checked = false;
                let dayCounters = {};

                if (i === 0) {
                  checked = !!state.checks[suppName];
                  dayCounters = { ...state.counters };
                } else {
                  const ent = state.history[ds];
                  if (ent) {
                    checked = !!ent.checks[suppName];
                    dayCounters = { ...ent.counters };
                  } else {
                    checked = false;
                    dayCounters = { ...state.counters };
                  }
                }

                if (!isInPauseHistoric(suppName, dayCounters)) {
                  countConsidered++;
                  if (checked) countTaken++;
                }
              }
              return `${suppName} – ${countTaken} von ${countConsidered} Tagen (${pct} %)`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 9 },
            color: "#ffffff"
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 10,
            font: { size: 9 },
            color: "#ffffff"
          },
          grid: {
            color: "rgba(255,255,255,0.1)",
            lineWidth: 0.5
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// 12) CSV-Export (mit deutschen Kopfzeilen, inkl. „Notizen“ am Ende)
window.exportCSV = function() {
  const headers = [
    "Supplement",
    "Aktivität",
    "Status",
    "Datum",
    "Pause"
  ];
  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const supp of supplementsBase) {
    const name = supp.name;
    const akt = state.dayType;
    const stat = state.checks[name] ? "eingenommen" : "nicht eingenommen";
    const dat = `"${state.lastDate}"`;
    const p = isInPause(name) ? "Pause" : "keine Pause";
    csvRows.push([name, akt, stat, dat, p].join(","));
  }

  const notesEscaped = state.notes ? state.notes.replace(/\r?\n/g, "\\r\\n") : "";
  csvRows.push(`Notizen,"${notesEscaped}"`);

  const csvString = csvRows.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplement-data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
};

// 13) Service Worker registrieren (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 14) Beim initialen Laden Supplements rendern
renderSupplements();
