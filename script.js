const SUPPLEMENTS = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], basePriority: 1, restDay: true, cycle: null },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], basePriority: 2, restDay: true, cycle: { on: 42, off: 14, start: 0 } },
  { name: "D3 + K2", icons: ["🦴", "⏰"], basePriority: 3, restDay: true, cycle: { on: 56, off: 14, start: 0 } },
  { name: "Omega 3", icons: ["🧠", "⏰"], basePriority: 4, restDay: true, cycle: { on: 42, off: 7, start: 0 } },
  { name: "Magnesium", icons: ["💤", "🌙"], basePriority: 5, restDay: true, cycle: null },
  { name: "Creatin", icons: ["🏋️", "🏃"], basePriority: 6, restDay: false, cycle: { on: 42, off: 14, start: 0 } },
  { name: "Whey Shake", icons: ["🥤", "🤯"], basePriority: 7, restDay: true, cycle: null },
  { name: "Citrullin", icons: ["💪", "🏃"], basePriority: 8, restDay: false, cycle: null },
  { name: "Whey Night", icons: ["🥤💤", "😴"], basePriority: 9, restDay: false, cycle: null }
];

let currentDayType = localStorage.getItem("dayType") || "training";
let checkedSupplements = JSON.parse(localStorage.getItem("checkedSupplements") || "{}");
let notes = JSON.parse(localStorage.getItem("dailyNotes") || "{}");
let startDate = localStorage.getItem("startDate") || new Date().toISOString().split("T")[0];
if (!localStorage.getItem("startDate")) localStorage.setItem("startDate", startDate);

function daysSinceStart() {
  return Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
}

function inPause(cycle) {
  if (!cycle) return false;
  const day = daysSinceStart();
  const total = cycle.on + cycle.off;
  const relativeDay = (day - cycle.start + total) % total;
  return relativeDay >= cycle.on;
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";

  const dayKey = new Date().toISOString().split("T")[0];
  const todayChecks = checkedSupplements[dayKey] || [];

  let visibleSupplements = SUPPLEMENTS
    .filter(s => currentDayType === "training" || s.restDay)
    .map(s => ({ ...s, paused: inPause(s.cycle) }));

  // Reorder for special case: Whey Shake on top at rest days
  if (currentDayType === "rest") {
    const wheyIndex = visibleSupplements.findIndex(s => s.name === "Whey Shake");
    if (wheyIndex > -1) {
      const whey = visibleSupplements.splice(wheyIndex, 1)[0];
      visibleSupplements.unshift(whey);
    }
  }

  visibleSupplements
    .sort((a, b) => a.basePriority - b.basePriority)
    .forEach(supp => {
      const div = document.createElement("div");
      div.className = "supplement" + (supp.paused ? " paused" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todayChecks.includes(supp.name);
      checkbox.onchange = () => toggleSupplement(supp.name, checkbox.checked);

      const left = document.createElement("div");
      left.className = "left";
      left.innerHTML = `<span>${supp.icons[0]}</span> <span>${supp.name}</span>`;

      const right = document.createElement("div");
      right.className = "right-icon";
      right.textContent = supp.paused ? "⏸️" : supp.icons[1];

      div.appendChild(checkbox);
      div.appendChild(left);
      div.appendChild(right);
      container.appendChild(div);
    });

  document.getElementById("notes").value = notes[dayKey] || "";
}

function toggleSupplement(name, checked) {
  const dayKey = new Date().toISOString().split("T")[0];
  checkedSupplements[dayKey] = checkedSupplements[dayKey] || [];
  if (checked) {
    if (!checkedSupplements[dayKey].includes(name)) checkedSupplements[dayKey].push(name);
  } else {
    checkedSupplements[dayKey] = checkedSupplements[dayKey].filter(n => n !== name);
  }
  localStorage.setItem("checkedSupplements", JSON.stringify(checkedSupplements));
}

function setDayType(type) {
  currentDayType = type;
  localStorage.setItem("dayType", type);
  renderSupplements();
}

function exportData() {
  const data = {
    checkedSupplements,
    notes,
    startDate
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplement_tracker_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.checkedSupplements) checkedSupplements = data.checkedSupplements;
      if (data.notes) notes = data.notes;
      if (data.startDate) startDate = data.startDate;
      localStorage.setItem("checkedSupplements", JSON.stringify(checkedSupplements));
      localStorage.setItem("dailyNotes", JSON.stringify(notes));
      localStorage.setItem("startDate", startDate);
      renderSupplements();
    } catch (err) {
      alert("Fehler beim Importieren der Daten.");
    }
  };
  reader.readAsText(file);
}

document.getElementById("notes").addEventListener("input", () => {
  const dayKey = new Date().toISOString().split("T")[0];
  notes[dayKey] = document.getElementById("notes").value;
  localStorage.setItem("dailyNotes", JSON.stringify(notes));
});

renderSupplements();
