const supplements = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], basePriority: 1, restDay: true, cycle: { on: 7, off: 0 } },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], basePriority: 2, restDay: true, cycle: { on: 42, off: 14 } },
  { name: "D3 + K2", icons: ["🦴", "⏰"], basePriority: 3, restDay: true, cycle: { on: 56, off: 14 } },
  { name: "Omega 3", icons: ["🧠", "⏰"], basePriority: 4, restDay: true, cycle: { on: 42, off: 7 } },
  { name: "Magnesium", icons: ["💤", "🌙"], basePriority: 5, restDay: true },
  { name: "Citrullin", icons: ["💪", "🏃"], basePriority: 6, restDay: false, cycle: { on: 0, off: 0 } },
  { name: "Creatin", icons: ["🏋️", "🏃"], basePriority: 7, restDay: false, cycle: { on: 42, off: 14 } },
  { name: "Whey Shake", icons: ["🥤", "🤯"], basePriority: 8, restDay: true },
  { name: "Whey Night", icons: ["🥤💤", "😴"], basePriority: 9, restDay: false }
];

let dayType = localStorage.getItem("dayType") || "training";
let progress = JSON.parse(localStorage.getItem("progress") || "{}");
let note = localStorage.getItem("note") || "";
let cycleStates = JSON.parse(localStorage.getItem("cycleStates") || "{}");
let lastDate = localStorage.getItem("lastDate") || new Date().toLocaleDateString();

function saveState() {
  localStorage.setItem("progress", JSON.stringify(progress));
  localStorage.setItem("note", document.getElementById("notes").value);
  localStorage.setItem("dayType", dayType);
  localStorage.setItem("cycleStates", JSON.stringify(cycleStates));
}

function resetDaily() {
  const today = new Date().toLocaleDateString();
  if (today !== lastDate) {
    lastDate = today;
    localStorage.setItem("lastDate", lastDate);
    progress = {};
    document.getElementById("notes").value = "";
    updateCycles();
  }
}

function updateCycles() {
  supplements.forEach(s => {
    if (!s.cycle) return;
    const state = cycleStates[s.name] || { count: 0, paused: false };
    if (state.paused) {
      state.count++;
      if (state.count >= s.cycle.off) {
        state.count = 0;
        state.paused = false;
      }
    } else {
      state.count++;
      if (state.count >= s.cycle.on) {
        state.count = 0;
        state.paused = true;
      }
    }
    cycleStates[s.name] = state;
  });
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";

  let orderedSupplements = supplements
    .filter(s => s.restDay || dayType === "training")
    .map(s => ({
      ...s,
      show: dayType === "rest"
        ? s.name === "Whey Shake"
          ? { ...s, basePriority: 0, icons: ["🥤", "⏰"] }
          : s
        : s
    }))
    .sort((a, b) => a.basePriority - b.basePriority);

  orderedSupplements.forEach(s => {
    const state = cycleStates[s.name] || { paused: false };
    const supplementDiv = document.createElement("div");
    supplementDiv.className = "supplement" + (state.paused ? " paused" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = progress[s.name] || false;
    checkbox.onchange = () => {
      progress[s.name] = checkbox.checked;
      saveState();
    };

    const label = document.createElement("div");
    label.className = "left";
    label.innerHTML = `${s.icons[0]} ${s.name}`;

    const icon = document.createElement("div");
    icon.className = "right-icon";
    icon.textContent = state.paused ? "⏸️" : s.icons[1];

    supplementDiv.appendChild(checkbox);
    supplementDiv.appendChild(label);
    supplementDiv.appendChild(icon);
    container.appendChild(supplementDiv);
  });
}

function setDayType(type) {
  dayType = type;
  localStorage.setItem("dayType", type);
  renderSupplements();
}

function exportData() {
  const data = {
    progress,
    note: document.getElementById("notes").value,
    cycleStates,
    dayType
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplement-tracker-backup.json";
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    progress = data.progress || {};
    cycleStates = data.cycleStates || {};
    dayType = data.dayType || "training";
    localStorage.setItem("dayType", dayType);
    document.getElementById("notes").value = data.note || "";
    saveState();
    renderSupplements();
  };
  reader.readAsText(file);
}

document.getElementById("notes").value = note;
resetDaily();
renderSupplements();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(console.error);
  });
}
