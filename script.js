const allSupplements = [
  { name: "Whey Shake", icons: ["🥤", "🤯"], priority: 10, restDay: true },
  { name: "Vitamin B12", icons: ["🩸", "⏰"], priority: 1, restDay: true },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], priority: 2, restDay: true },
  { name: "D3 + K2", icons: ["🦴", "⏰"], priority: 3, restDay: true },
  { name: "Omega 3", icons: ["🧠", "⏰"], priority: 4, restDay: true },
  { name: "Magnesium", icons: ["💤", "🌙"], priority: 5, restDay: true },
  { name: "Citrullin", icons: ["💪", "🏃"], priority: 6, restDay: false },
  { name: "Creatin", icons: ["🏋️", "🏃"], priority: 7, restDay: false },
  { name: "Whey Night", icons: ["🥤😴", "😴"], priority: 8, restDay: false }
];

let currentDayType = "training";
let checkedSupplements = {};

function setDayType(type) {
  currentDayType = type;
  renderSupplements();
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";

  const supplements = allSupplements
    .filter(s => currentDayType === "rest" ? s.restDay : true)
    .map(s => {
      const clone = { ...s };
      if (currentDayType === "rest" && clone.name === "Whey Shake") {
        clone.priority = 0;
        clone.icons[1] = "⏰";
      }
      return clone;
    })
    .sort((a, b) => a.priority - b.priority);

  supplements.forEach(supp => {
    const id = `${currentDayType}_${supp.name}`;
    const div = document.createElement("div");
    div.className = "supplement";
    div.innerHTML = `
      <label class="left">
        <input type="checkbox" ${checkedSupplements[id] ? "checked" : ""} onchange="toggleCheck('${id}')">
        <span>${supp.icons[0]} ${supp.name} ${supp.icons[1]}</span>
      </label>
    `;
    container.appendChild(div);
  });
}

function toggleCheck(id) {
  checkedSupplements[id] = !checkedSupplements[id];
}

function exportData() {
  const data = {
    notes: document.getElementById("notes").value,
    checks: checkedSupplements,
    dayType: currentDayType
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "supplements.json";
  link.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      document.getElementById("notes").value = data.notes || "";
      checkedSupplements = data.checks || {};
      setDayType(data.dayType || "training");
    } catch {
      alert("Fehler beim Importieren.");
    }
  };
  reader.readAsText(file);
}

window.onload = () => {
  renderSupplements();
};
