const supplementPlans = {
  training: [
    { name: "Magnesium", iconLeft: "💊", iconRight: "⏰", cycle: "omega" },
    { name: "Creatin", iconLeft: "🏋️", iconRight: "💥", cycle: "creatin" },
    { name: "Citrullin", iconLeft: "💪", iconRight: "🏃", cycle: "creatin" },
    { name: "Whey Shake", iconLeft: "🥤", iconRight: "💥", cycle: null },
    { name: "Omega 3", iconLeft: "🧠", iconRight: "⏰", cycle: "omega" },
    { name: "Vitamin D3", iconLeft: "🦴", iconRight: "☀️", cycle: "d3" },
    { name: "Vitamin B12", iconLeft: "🩸", iconRight: "🗓️", cycle: null, days: [1, 4] }, // Mo + Do
    { name: "Ashwagandha", iconLeft: "🧘", iconRight: "🌙", cycle: "ashwa" },
    { name: "Whey Night", iconLeft: "🥤zzz", iconRight: "😴", cycle: null }
  ],
  rest: [
    { name: "Whey Shake", iconLeft: "🥤", iconRight: "⏰", cycle: null },
    { name: "Magnesium", iconLeft: "💊", iconRight: "⏰", cycle: "omega" },
    { name: "Omega 3", iconLeft: "🧠", iconRight: "⏰", cycle: "omega" },
    { name: "Vitamin D3", iconLeft: "🦴", iconRight: "☀️", cycle: "d3" },
    { name: "Vitamin B12", iconLeft: "🩸", iconRight: "🗓️", cycle: null, days: [1, 4] },
    { name: "Ashwagandha", iconLeft: "🧘", iconRight: "🌙", cycle: "ashwa" }
  ]
};

const cycles = {
  creatin: { daysOn: 42, daysOff: 14, start: null },
  omega: { daysOn: 42, daysOff: 7, start: null },
  d3: { daysOn: 56, daysOff: 14, start: null },
  ashwa: { daysOn: 42, daysOff: 14, start: null }
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function loadDayType() {
  const saved = localStorage.getItem("dayType");
  return saved || "training";
}

function saveDayType(type) {
  localStorage.setItem("dayType", type);
}

function isPaused(supplement) {
  const cycle = supplement.cycle;
  if (!cycle || !cycles[cycle].start) return false;
  const daysSinceStart = Math.floor((new Date() - new Date(cycles[cycle].start)) / 86400000);
  const { daysOn, daysOff } = cycles[cycle];
  return daysSinceStart >= daysOn && daysSinceStart < daysOn + daysOff;
}

function isB12Day(days) {
  const today = new Date().getDay(); // 0=So, 1=Mo, ...
  return days.includes(today);
}

function createSupplementElement(supplement) {
  if (supplement.days && !isB12Day(supplement.days)) return null;
  const div = document.createElement("div");
  div.className = "supplement";
  if (isPaused(supplement)) div.classList.add("paused");

  const left = document.createElement("span");
  left.className = "left";
  left.innerText = `${supplement.iconLeft} ${supplement.name}`;

  const right = document.createElement("span");
  right.innerText = isPaused(supplement) ? "⏸️" : supplement.iconRight;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = loadCheckboxState(supplement.name);
  checkbox.addEventListener("change", () => saveCheckboxState(supplement.name, checkbox.checked));

  div.appendChild(left);
  div.appendChild(right);
  div.appendChild(checkbox);
  return div;
}

function resetCheckboxesIfNewDay() {
  const lastDate = localStorage.getItem("lastVisit");
  const today = getToday();
  if (lastDate !== today) {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("check_")) localStorage.removeItem(k);
    });
    localStorage.setItem("lastVisit", today);
  }
}

function saveCheckboxState(name, checked) {
  localStorage.setItem("check_" + name, checked ? "1" : "0");
}

function loadCheckboxState(name) {
  return localStorage.getItem("check_" + name) === "1";
}

function renderSupplements() {
  const dayType = loadDayType();
  const container = document.getElementById("supplements");
  container.innerHTML = "";
  supplementPlans[dayType].forEach(s => {
    const el = createSupplementElement(s);
    if (el) container.appendChild(el);
  });
  document.getElementById("notes").value = localStorage.getItem("notes_" + getToday()) || "";
}

function setDayType(type) {
  saveDayType(type);
  renderSupplements();
}

function exportData() {
  const data = {
    notes: localStorage.getItem("notes_" + getToday()),
    cycles,
    checkboxes: Object.entries(localStorage).filter(([k]) => k.startsWith("check_"))
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "supplement_data.json";
  a.click();
}

function importData(event) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    if (data.notes) localStorage.setItem("notes_" + getToday(), data.notes);
    if (data.cycles) Object.assign(cycles, data.cycles);
    if (data.checkboxes) {
      data.checkboxes.forEach(([k, v]) => localStorage.setItem(k, v));
    }
    renderSupplements();
  };
  reader.readAsText(event.target.files[0]);
}

document.getElementById("notes").addEventListener("input", e => {
  localStorage.setItem("notes_" + getToday(), e.target.value);
});

resetCheckboxesIfNewDay();
renderSupplements();
