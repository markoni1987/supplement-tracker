const allSupplements = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], timing: "morning", restDay: true },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], timing: "morning", restDay: true },
  { name: "D3 + K2", icons: ["🦴", "⏰"], timing: "morning", restDay: true },
  { name: "Omega 3", icons: ["🧠", "⏰"], timing: "morning", restDay: true },
  { name: "Magnesium", icons: ["💤", "🌙"], timing: "earlyevening", restDay: true },
  { name: "Creatin", icons: ["🏋️", "🏃"], timing: "afterTraining", restDay: false },
  { name: "Citrullin", icons: ["💪", "🏃"], timing: "beforeTraining", restDay: false },
  { name: "Whey Shake", icons: ["🥤", "🤯"], timing: "afterTraining", restDay: true },
  { name: "Whey Night", icons: ["🥤😴", "😴"], timing: "evening", restDay: false }
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

  const supplements = allSupplements.filter(s => {
    if (currentDayType === "rest") {
      if (!s.restDay) return false;
      if (s.name === "Whey Shake") {
        s.icons[1] = "⏰";
        s.timing = "morning";
      }
    } else {
      if (s.name === "Whey Shake") {
        s.icons[1] = "🤯";
        s.timing = "afterTraining";
      }
    }
    return true;
  });

  const order = { morning: 1, beforeTraining: 2, earlyevening: 3, afterTraining: 4, evening: 5 };
  supplements.sort((a, b) => order[a.timing] - order[b.timing]);

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
