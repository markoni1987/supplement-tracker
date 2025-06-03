const supplements = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], basePriority: 1, restDay: true },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], basePriority: 2, restDay: true },
  { name: "D3 + K2", icons: ["🦴", "⏰"], basePriority: 3, restDay: true },
  { name: "Omega 3", icons: ["🧠", "⏰"], basePriority: 4, restDay: true },
  { name: "Magnesium", icons: ["💤", "🌙"], basePriority: 5, restDay: true },
  { name: "Citrullin", icons: ["💪", "🏃"], basePriority: 6, restDay: false },
  { name: "Creatin", icons: ["🏋️", "🏃"], basePriority: 7, restDay: false },
  { name: "Whey Shake", icons: ["🥤", "🤯"], basePriority: 8, restDay: true },
  { name: "Whey Night", icons: ["🥤💤", "😴"], basePriority: 9, restDay: false }
];

let currentDayType = localStorage.getItem("dayType") || "training";

function saveCheckboxState(name, checked) {
  localStorage.setItem(`check_${name}_${getToday()}`, checked ? "1" : "0");
}

function loadCheckboxState(name) {
  return localStorage.getItem(`check_${name}_${getToday()}`) === "1";
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";

  const filtered = supplements
    .filter(s => currentDayType === "training" || s.restDay)
    .sort((a, b) => a.basePriority - b.basePriority);

  filtered.forEach(s => {
    const div = document.createElement("div");
    div.className = "supplement";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = loadCheckboxState(s.name);
    checkbox.addEventListener("change", () => saveCheckboxState(s.name, checkbox.checked));

    const left = document.createElement("span");
    left.className = "left";
    left.innerHTML = `${s.icons[0]} ${s.name}`;

    const right = document.createElement("span");
    right.innerText = s.icons[1];

    div.appendChild(checkbox);
    div.appendChild(left);
    div.appendChild(right);
    container.appendChild(div);
  });

  document.getElementById("notes").value = localStorage.getItem("notes_" + getToday()) || "";
}

function setDayType(type) {
  currentDayType = type;
  localStorage.setItem("dayType", type);
  renderSupplements();
}

document.getElementById("notes").addEventListener("input", e => {
  localStorage.setItem("notes_" + getToday(), e.target.value);
});

function exportData() {
  const data = {
    notes: localStorage.getItem("notes_" + getToday()),
    checkboxes: Object.entries(localStorage).filter(([k]) => k.startsWith("check_"))
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `supplements_${getToday()}.json`;
  a.click();
}

function importData(event) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    if (data.notes) localStorage.setItem("notes_" + getToday(), data.notes);
    if (data.checkboxes) {
      data.checkboxes.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }
    renderSupplements();
  };
  reader.readAsText(event.target.files[0]);
}

renderSupplements();
