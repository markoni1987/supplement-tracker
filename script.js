// script.js
const supplementsBase = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], color: "#e63946", restDay: true, cycle: [6, 2] },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], color: "#ffb703", restDay: true, cycle: [6, 2] },
  { name: "D3 + K2", icons: ["🦴", "⏰"], color: "#f8f9fa", restDay: true, cycle: [8, 2] },
  { name: "Omega 3", icons: ["🧠", "⏰"], color: "#ffafcc", restDay: true, cycle: [6, 1] },
  { name: "Magnesium", icons: ["💤", "🌙"], color: "#adb5bd", restDay: true },
  { name: "Citrullin", icons: ["💪", "🏃"], color: "#f1c40f", restDay: false },
  { name: "Creatin", icons: ["🏋️", "🏃"], color: "#ced4da", restDay: false, cycle: [6, 2] },
  { name: "Whey Shake", icons: ["🥤", "🤯"], color: "#89c2d9", restDay: true },
  { name: "Whey Night", icons: ["🥤💤", "😴"], color: "#f77f00", restDay: false }
];

let state = JSON.parse(localStorage.getItem("supplements-state")) || {
  dayType: "training",
  notes: "",
  checks: {},
  counters: {},
  lastDate: new Date().toDateString()
};

function saveState() {
  localStorage.setItem("supplements-state", JSON.stringify(state));
}

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

function isInPause(name) {
  const supp = supplementsBase.find(s => s.name === name);
  if (!supp?.cycle) return false;
  const [active, pause] = supp.cycle;
  const total = active + pause;
  const counter = state.counters[name] || 0;
  return counter % total >= active;
}

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

function renderSupplements() {
  resetDaily();
  const container = document.getElementById("supplements");
  container.innerHTML = "";
  const supplements = getSupplementsToShow();

  // Korrigierte Reihenfolge bei Training
  if (state.dayType === "training") {
    const wheyIndex = supplements.findIndex(s => s.name === "Whey Shake");
    const nightIndex = supplements.findIndex(s => s.name === "Whey Night");
    if (wheyIndex > -1 && nightIndex > -1 && wheyIndex > nightIndex) {
      const [whey] = supplements.splice(wheyIndex, 1);
      supplements.splice(nightIndex, 0, whey);
    }
  }

  supplements.forEach(s => {
    const supp = { ...s }; // Lokale Kopie
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

function setDayType(type) {
  state.dayType = type;
  saveState();
  renderSupplements();
}

document.getElementById("notes").addEventListener("input", e => {
  state.notes = e.target.value;
  saveState();
});

function exportData() {
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplement-data.json";
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state = JSON.parse(reader.result);
    saveState();
    renderSupplements();
  };
  reader.readAsText(file);
}

function toggleStatsPopup() {
  const popup = document.getElementById("statsPopup");
  popup.style.display = popup.style.display === "none" ? "block" : "none";
  renderStatsChart(currentRange);
}

let currentRange = "week";
function renderStatsChart(range = "week") {
  currentRange = range;
  const labels = supplementsBase.map(s => s.name);
  const days = range === "week" ? 7 : 30;
  const data = supplementsBase.map(s => {
    const c = state.counters[s.name] || 0;
    return Math.min(100, Math.round((c % (days + 1)) / days * 100));
  });
  const colors = supplementsBase.map(s => s.color || "#999");

  const ctx = document.getElementById("statsChart").getContext("2d");
  if (window.myChart) window.myChart.destroy();
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
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

renderSupplements();
