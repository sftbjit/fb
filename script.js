// ---- Data: edit these values to update the site ----
const TOTAL_TARGET = 900000;

const users = [
  { name: "AH", payments: [25000] },
  { name: "TI", payments: [25000] },
  { name: "SR", payments: [25000] },
  { name: "SI", payments: [25000] },
];

const paymentSchedule = [
  { title: "1st Payment", date: "2026-09-13", label: "13th September" },
  { title: "2nd Payment", date: "2026-10-31", label: "Before November" },
  { title: "3rd Payment", date: "2026-12-31", label: "Before January" },
];
// -----------------------------------------------------

const currency = (n) => n.toLocaleString("en-US");
const paidOf = (u) => u.payments.reduce((sum, p) => sum + p, 0);

function renderSummary() {
  const totalCollected = users.reduce((sum, u) => sum + paidOf(u), 0);
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
      const paid = paidOf(u);
      const percent = Math.min((paid / perUserTarget) * 100, 100).toFixed(1);
      return `
        <div class="user-card">
          <div class="name-row">
            <span class="name">${u.name}</span>
            <span class="amount">${currency(paid)} / ${currency(perUserTarget)}</span>
          </div>
          <div class="progress-bar">
            <div class="fill" style="width: ${percent}%"></div>
          </div>
          <div class="percent">${percent}%</div>
        </div>`;
    })
    .join("");
}

function renderTable() {
  const perUserTarget = TOTAL_TARGET / users.length;
  const totals = { p1: 0, p2: 0, rest: 0, target: 0 };

  const rows = users
    .map((u) => {
      const [p1 = 0, p2 = 0] = u.payments;
      const rest = Math.max(perUserTarget - (p1 + p2), 0);
      totals.p1 += p1;
      totals.p2 += p2;
      totals.rest += rest;
      totals.target += perUserTarget;
      const p1Cell = p1 > 0 ? `<span class="paid-badge">${currency(p1)}</span>` : "—";
      const p2Cell = p2 > 0 ? `<span class="paid-badge">${currency(p2)}</span>` : `<span class="pending-badge">Pending</span>`;
      return `
        <tr>
          <td>${u.name}</td>
          <td>${p1Cell}</td>
          <td>${p2Cell}</td>
          <td>${currency(rest)}</td>
          <td>${currency(perUserTarget)}</td>
        </tr>`;
    })
    .join("");

  const footer = `
    <tr class="totals-row">
      <td>Total</td>
      <td>${currency(totals.p1)}</td>
      <td>${currency(totals.p2)}</td>
      <td>${currency(totals.rest)}</td>
      <td>${currency(totals.target)}</td>
    </tr>`;

  document.getElementById("payments-table-body").innerHTML = rows + footer;
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
renderTable();
renderTimeline();
renderFooter();
