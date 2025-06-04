// Supplement Tracker Script mit automatischem Tageswechsel, Pausenlogik, Statistik und PWA Registrierung

let dayType = localStorage.getItem("dayType") || "training";
let supplementData = JSON.parse(localStorage.getItem("supplementData")) || {};
let notesData = JSON.parse(localStorage.getItem("notesData")) || {};
let supplementDays = JSON.parse(localStorage.getItem("supplementDays")) || {};
let lastUpdated = localStorage.getItem("lastUpdated");
const today = new Date().toISOString().split("T")[0];

const supplementPlan = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], basePriority: 1, restDay: true, cycle: null },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], basePriority: 2, restDay: true, cycle: 42, pause: 14 },
  { name: "D3 + K2", icons: ["🦴", "⏰"], basePriority: 3, restDay: true, cycle: 56, pause: 14 },
  { name: "Omega 3", icons: ["🧠", "⏰"], basePriority: 4, restDay: true, cycle: 42, pause: 7 },
  { name: "Magnesium", icons: ["💤", "🌙"], basePriority: 5, restDay: true, cycle: null },
  { name: "Citrullin", icons: ["💪", "🏃"], basePriority: 6, restDay: false, cycle: null },
  { name: "Creatin", icons: ["🏋️", "🏃"], basePriority: 7, restDay: false, cycle: 42, pause: 14 },
  { name: "Whey Shake", icons: ["🥤", "🤯"], basePriority: 8, restDay: true, restPriority: 0, restIcon: "⏰" },
  { name: "Whey Night", icons: ["🥤💤", "😴"], basePriority: 9, restDay: false, cycle: null }
];

function init() {
  checkDayReset();
  renderSupplements();
  document.getElementById("notes").value = notesData[today] || "";
}

function checkDayReset() {
  if (lastUpdated !== today) {
    supplementData[today] = {};
    notesData[today] = "";
    supplementPlan.forEach(s => {
      if (!supplementDays[s.name]) supplementDays[s.name] = 0;
      supplementDays[s.name]++;

      if (s.cycle && supplementDays[s.name] > s.cycle) {
        supplementDays[s.name] = -(s.pause || 7);
      } else if (supplementDays[s.name] < 0) {
        // in pause
      }
    });
    localStorage.setItem("supplementData", JSON.stringify(supplementData));
    localStorage.setItem("notesData", JSON.stringify(notesData));
    localStorage.setItem("supplementDays", JSON.stringify(supplementDays));
    localStorage.setItem("lastUpdated", today);
  }
}

function setDayType(type) {
  dayType = type;
  localStorage.setItem("dayType", dayType);
  renderSupplements();
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";
  let supplements = supplementPlan
    .filter(s => s.restDay || dayType === "training")
    .sort((a, b) => {
      const aP = dayType === "rest" && a.restPriority !== undefined ? a.restPriority : a.basePriority;
      const bP = dayType === "rest" && b.restPriority !== undefined ? b.restPriority : b.basePriority;
      return aP - bP;
    });

  supplements.forEach(s => {
    const paused = supplementDays[s.name] < 0;
    const icons = dayType === "rest" && s.restIcon ? [s.icons[0], s.restIcon] : s.icons;

    const div = document.createElement("div");
    div.className = "supplement" + (paused ? " paused" : "");

    const left = document.createElement("div");
    left.className = "left";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = supplementData[today]?.[s.name] || false;
    checkbox.onchange = () => {
      if (!supplementData[today]) supplementData[today] = {};
      supplementData[today][s.name] = checkbox.checked;
      localStorage.setItem("supplementData", JSON.stringify(supplementData));
    };

    const iconLeft = document.createElement("span");
    iconLeft.textContent = icons[0];
    const label = document.createElement("span");
    label.textContent = s.name;
    const iconRight = document.createElement("span");
    iconRight.className = "right-icon";
    iconRight.textContent = paused ? "⏸️" : icons[1];

    left.appendChild(iconLeft);
    left.appendChild(label);

    div.appendChild(checkbox);
    div.appendChild(left);
    div.appendChild(iconRight);

    container.appendChild(div);
  });
}

function exportData() {
  const data = {
    supplementData,
    notesData,
    supplementDays,
    lastUpdated
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplement-tracker.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      supplementData = data.supplementData || {};
      notesData = data.notesData || {};
      supplementDays = data.supplementDays || {};
      lastUpdated = data.lastUpdated || null;
      localStorage.setItem("supplementData", JSON.stringify(supplementData));
      localStorage.setItem("notesData", JSON.stringify(notesData));
      localStorage.setItem("supplementDays", JSON.stringify(supplementDays));
      localStorage.setItem("lastUpdated", lastUpdated);
      init();
    } catch (error) {
      alert("Import fehlgeschlagen");
    }
  };
  reader.readAsText(file);
}

function toggleStatsPopup() {
  const popup = document.getElementById("statsPopup");
  popup.style.display = popup.style.display === "none" ? "block" : "none";
  renderStatsChart();
}

function renderStatsChart() {
  const labels = supplementPlan.map(s => s.name);
  const values = supplementPlan.map(s => {
    return Object.values(supplementData).reduce((sum, day) => sum + (day[s.name] ? 1 : 0), 0);
  });

  const ctx = document.getElementById("statsChart").getContext("2d");
  if (window.chart) window.chart.destroy();
  window.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Einnahmen", data: values }]
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(() => console.log("SW registered"));
}

window.onload = init;
document.getElementById("notes").addEventListener("input", e => {
  notesData[today] = e.target.value;
  localStorage.setItem("notesData", JSON.stringify(notesData));
});
