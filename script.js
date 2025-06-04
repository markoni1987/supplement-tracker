const supplements = [
  { name: "Vitamin B12", icons: ["🩸", "⏰"], basePriority: 1, restDay: true, cycle: { weeksOn: 6, weeksOff: 2 } },
  { name: "Ashwagandha", icons: ["🧘", "⏰"], basePriority: 2, restDay: true, cycle: { weeksOn: 6, weeksOff: 2 } },
  { name: "D3 + K2", icons: ["🦴", "⏰"], basePriority: 3, restDay: true, cycle: { weeksOn: 8, weeksOff: 2 } },
  { name: "Omega 3", icons: ["🧠", "⏰"], basePriority: 4, restDay: true, cycle: { weeksOn: 6, weeksOff: 1 } },
  { name: "Magnesium", icons: ["💤", "🌙"], basePriority: 5, restDay: true },
  { name: "Citrullin", icons: ["💪", "🏃"], basePriority: 6, restDay: false },
  { name: "Creatin", icons: ["🏋️", "🏃"], basePriority: 7, restDay: false, cycle: { weeksOn: 6, weeksOff: 2 } },
  { name: "Whey Shake", icons: ["🥤", "🤯"], basePriority: 8, restDay: true },
  { name: "Whey Night", icons: ["🥤💤", "😴"], basePriority: 9, restDay: false }
];

let currentDayType = "training";

function setDayType(type) {
  currentDayType = type;
  renderSupplements();
}

function renderSupplements() {
  const container = document.getElementById("supplements");
  container.innerHTML = "";

  let daySupps = supplements.filter(s => currentDayType === "training" || s.restDay);

  if (currentDayType === "rest") {
    daySupps.forEach(s => {
      if (s.name === "Whey Shake") {
        s.icons[1] = "⏰"; // Wecker für Ruhetag
      }
    });

    daySupps.sort((a, b) => {
      if (a.name === "Whey Shake") return -1;
      if (b.name === "Whey Shake") return 1;
      return a.basePriority - b.basePriority;
    });
  } else {
    supplements.forEach(s => {
      if (s.name === "Whey Shake") {
        s.icons[1] = "🤯"; // Zurücksetzen für Training
      }
    });

    daySupps.sort((a, b) => a.basePriority - b.basePriority);
  }

  daySupps.forEach(supplement => {
    const div = document.createElement("div");
    div.className = "supplement";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${supplement.icons[0]} ${supplement.name}`;

    const rightIcon = document.createElement("span");
    rightIcon.className = "right-icon";
    rightIcon.textContent = supplement.icons[1];

    const leftContainer = document.createElement("div");
    leftContainer.className = "left";
    leftContainer.appendChild(checkbox);
    leftContainer.appendChild(nameSpan);

    div.appendChild(leftContainer);
    div.appendChild(rightIcon);
    container.appendChild(div);
  });
}
