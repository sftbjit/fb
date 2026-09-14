// ---- Data: edit these values to update the site ----
const TOTAL_TARGET = 900000;

const users = [
  { name: "AH", collected: 25000 },
  { name: "TI", collected: 25000 },
  { name: "SR", collected: 25000 },
  { name: "SRI", collected: 25000 },
];

const paymentSchedule = [
  { title: "1st Payment", date: "2026-09-13", label: "13th September" },
  { title: "2nd Payment", date: "2026-10-31", label: "Before November" },
  { title: "3rd Payment", date: "2026-12-31", label: "Before January" },
];
// -----------------------------------------------------

const currency = (n) => n.toLocaleString("en-US");

function renderSummary() {
  const totalCollected = users.reduce((sum, u) => sum + u.collected, 0);
  const remaining = Math.max(TOTAL_TARGET - totalCollected, 0);
  const percent = ((totalCollected / TOTAL_TARGET) * 100).toFixed(1);

  const cards = [
    { label: "Total Target", value: currency(TOTAL_TARGET) },
    { label: "Total Collected", value: currency(totalCollected) },
    { label: "Remaining", value: currency(remaining) },
    { label: "Progress", value: `${percent}%` },
  ];

  document.getElementById("summary").innerHTML = cards
    .map(
      (c) => `
      <div class="card">
        <div class="label">${c.label}</div>
        <div class="value">${c.value}</div>
      </div>`
    )
    .join("");
}

function renderUsers() {
  const perUserTarget = TOTAL_TARGET / users.length;

  document.getElementById("users").innerHTML = users
    .map((u) => {
      const percent = Math.min((u.collected / perUserTarget) * 100, 100).toFixed(1);
      return `
        <div class="user-card">
          <div class="name-row">
            <span class="name">${u.name}</span>
            <span class="amount">${currency(u.collected)} / ${currency(perUserTarget)}</span>
          </div>
          <div class="progress-bar">
            <div class="fill" style="width: ${percent}%"></div>
          </div>
          <div class="percent">${percent}%</div>
        </div>`;
    })
    .join("");
}

function renderTimeline() {
  const today = new Date();

  document.getElementById("timeline").innerHTML = paymentSchedule
    .map((step) => {
      const dueDate = new Date(step.date);
      const isDone = dueDate < today;
      return `
        <li class="${isDone ? "done" : "upcoming"}">
          <span class="dot"></span>
          <div class="title">${step.title}</div>
          <div class="date">${step.label}</div>
          <span class="status">${isDone ? "Completed" : "Upcoming"}</span>
        </li>`;
    })
    .join("");
}

function renderFooter() {
  document.getElementById("last-updated").textContent = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

renderSummary();
renderUsers();
renderTimeline();
renderFooter();
