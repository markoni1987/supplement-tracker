const allSupplements = [
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
      clone.priority = clone.basePriority;

      // Spezialfall: Whey Shake an Ruhetagen ganz oben und Icon ändern
      if (currentDayType === "rest" && clone.name === "Whey Shake") {
        clone.priority = 0;
        clone.icons[1] = "⏰";
      }

      // Spezialfall: Whey Shake im Training => Icon explodierender Kopf
      if (currentDayType === "training" && clone.name === "Whey Shake") {
        clone.icons[1] = "🤯";
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
