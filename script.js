const supplementsData = [
  {
    name: "Whey Shake",
    iconLeft: "🥤",
    iconRight: "⏰",
    timing: "morning",
    restDay: true
  },
  {
    name: "Vitamin B12",
    iconLeft: "🩸",
    iconRight: "📆",
    timing: "morning",
    days: ["Montag", "Donnerstag"],
    restDay: true
  },
  {
    name: "Ashwagandha",
    iconLeft: "🧘",
    iconRight: "🌙",
    timing: "night",
    restDay: true,
    pauseCycle: { weeksOn: 6, weeksOff: 2 }
  },
  {
    name: "Vitamin D3",
    iconLeft: "🦴",
    iconRight: "🌞",
    timing: "morning",
    restDay: true,
    pauseCycle: { weeksOn: 8, weeksOff: 2 }
  },
  {
    name: "Omega 3",
    iconLeft: "🧠",
    iconRight: "🍽️",
    timing: "flexible",
    restDay: true,
    pauseCycle: { weeksOn: 6, weeksOff: 1 }
  },
  {
    name: "Magnesium",
    iconLeft: "💤",
    iconRight: "🌙",
    timing: "night",
    restDay: true,
    restSkip: ["Donnerstag"]
  },
  {
    name: "Creatin",
    iconLeft: "💪",
    iconRight: "🏃",
    timing: "post",
    restDay: false,
    pauseCycle: { weeksOn: 6, weeksOff: 2 }
  },
  {
    name: "Citrullin",
    iconLeft: "💪",
    iconRight: "🏃",
    timing: "pre",
    restDay: false
  },
  {
    name: "Whey Night",
    iconLeft: "🥤😴",
    iconRight: "😴",
    timing: "night",
    restDay: false
  }
];

let currentDayType = "training";
let supplementCycles = {};

function updateDisplay() {
  const list = document.getElementById("supplements");
  list.innerHTML = "";

  const today = new Date();
  const weekday = today.toLocaleDateString("de-DE", { weekday: "long" });

  const timingOrder = { morning: 1, flexible: 2, pre: 3, post: 4, night: 5 };
  const sortedSupplements = [...supplementsData].sort((a, b) => {
    return timingOrder[a.timing] - timingOrder[b.timing];
  });

  sortedSupplements.forEach(sup => {
    const isRest = currentDayType === "rest";
    const restSkip = sup.restSkip || [];

    if ((isRest && !sup.restDay) || (restSkip.includes(weekday))) return;
    if (sup.days && !sup.days.includes(weekday)) return;

    const cycleKey = sup.name;
    if (!supplementCycles[cycleKey]) supplementCycles[cycleKey] = { start: today, paused: false };

    const cycle = supplementCycles[cycleKey];
    let paused = false;
    if (sup.pauseCycle) {
      const startDate = new Date(cycle.start);
      const diffWeeks = Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks >= sup.pauseCycle.weeksOn && diffWeeks < sup.pauseCycle.weeksOn + sup.pauseCycle.weeksOff) {
        paused = true;
      } else if (diffWeeks >= sup.pauseCycle.weeksOn + sup.pauseCycle.weeksOff) {
        supplementCycles[cycleKey].start = today;
      }
    }

    const supplementDiv = document.createElement("div");
    supplementDiv.className = "supplement" + (paused ? " paused" : "");
    supplementDiv.innerHTML = `
      <div>${sup.iconLeft} ${sup.name}</div>
      <div>${paused ? "⏸️" : sup.iconRight}</div>
    `;

    if (isRest && sup.name === "Whey Shake") {
      list.prepend(supplementDiv); // Shake oben bei Ruhetagen
    } else {
      list.appendChild(supplementDiv);
    }
  });
}

function setDayType(type) {
  currentDayType = type;
  updateDisplay();
}

function exportData() {
  const notes = document.getElementById("notes").value;
  const data = {
    notes,
    cycles: supplementCycles
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "supplements.json";
  link.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    document.getElementById("notes").value = data.notes || "";
    supplementCycles = data.cycles || {};
    updateDisplay();
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", updateDisplay);
