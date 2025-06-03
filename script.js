const allSupplements = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], timing: "morning", paused: false, restDay: true },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], timing: "morning", paused: false, restDay: true },
  { name: "D3 + K2", icons: ["🦴", "⏰"], timing: "morning", paused: false, restDay: true },
  { name: "Omega 3", icons: ["🧠", "⏰"], timing: "morning", paused: false, restDay: true },
  { name: "Magnesium", icons: ["💤", "🌙"], timing: "evening", paused: false, restDay: true },
  { name: "Creatin", icons: ["🏋️", "🏃"], timing: "afterTraining", paused: false, restDay: false },
  { name: "Citrullin", icons: ["💪", "🏃"], timing: "beforeTraining", paused: false, restDay: false },
  { name: "Whey Shake", icons: ["🥤", "🤯"], timing: "afterTraining", paused: false, restDay: true },
  { name: "Whey Night", icons: ["🥤😴", "😴"], timing: "evening", paused: false, restDay: false }
];

let currentDayType = "training";

function setDayType(type) {
  currentDayType = type;
  renderSupplements();
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";

  const supplements = allSupplements.filter(supp => {
    if (currentDayType === "rest") {
      if (!supp.restDay) return false;
      if (supp.name === "Whey Shake") {
        supp.icons = ["🥤", "⏰"];
        supp.timing = "morning";
      }
    } else {
      if (supp.name === "Whey Shake") {
        supp.icons = ["🥤", "🤯"];
        supp.timing = "afterTraining";
      }
    }
    return true;
  });

  supplements.sort((a, b) => {
    const order = {
      morning: 1,
      beforeTraining: 2,
      afterTraining: 3,
      evening: 4
    };
    return order[a.timing] - order[b.timing];
  });

  supplements.forEach(supp => {
    const div = document.createElement("div");
    div.className = "supplement" + (supp.paused ? " paused" : "");
    div.innerHTML = `
      ${supp.icons.join(" ")} ${supp.name}
    `;
    container.appendChild(div);
  });
}

function exportData() {
  const data = {
    notes: document.getElementById("notes").value,
    dayType: currentDayType
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "supplement-tracker.json";
  link.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.notes) document.getElementById("notes").value = data.notes;
      if (data.dayType) setDayType(data.dayType);
    } catch (err) {
      alert("Fehler beim Importieren der Datei.");
    }
  };
  reader.readAsText(file);
}

window.onload = () => {
  renderSupplements();
};
