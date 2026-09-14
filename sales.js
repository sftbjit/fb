// Daily Sales — reads plain-text files named DDMMYYYY.txt from the /sales folder.
// Each file contains lines like:
//   total_sales:4000
//   net_sales:3000
//   foodpanda:100
//   foodi:50
const SALES_FOLDER = "sales";
const COMMISSION_RATE = 0.07;

const pad2 = (n) => String(n).padStart(2, "0");
const num = (data, key) => data[key] || 0;

const toFilenameDate = (d) => `${pad2(d.getDate())}${pad2(d.getMonth() + 1)}${d.getFullYear()}`;
const toInputDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toDisplayDate = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const parseInputDate = (val) => {
  const [y, m, d] = val.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function parseSalesText(text) {
  const data = {};
  text.split(/\r?\n/).forEach((line) => {
    const [key, value] = line.split(":");
    if (key && value !== undefined) {
      data[key.trim()] = parseFloat(value.trim()) || 0;
    }
  });
  return data;
}

async function fetchSalesData(dateObj) {
  try {
    const res = await fetch(`${SALES_FOLDER}/${toFilenameDate(dateObj)}.txt`, { cache: "no-store" });
    if (!res.ok) return null;
    return parseSalesText(await res.text());
  } catch {
    return null;
  }
}

const commissionOf = (data) => (num(data, "net_sales") + num(data, "foodi") + num(data, "foodpanda")) * COMMISSION_RATE;

// Commission is split equally among these users
const DISTRIBUTION_USERS = ["AH", "TI", "SR", "SI"];

function renderDistribution(elementId, commission) {
  const el = document.getElementById(elementId);
  if (!commission) {
    el.innerHTML = "";
    return;
  }
  const percent = (100 / DISTRIBUTION_USERS.length).toFixed(0);
  const share = commission / DISTRIBUTION_USERS.length;
  const items = DISTRIBUTION_USERS.map(
    (name) => `<span class="dist-item"><strong>${name}</strong>: ${percent}% \u2014 ${currency(share)} BDT</span>`
  ).join("");
  el.innerHTML = `Commission Distributed: ${items}`;
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

function initSingleDate() {
  const dateInput = document.getElementById("single-date");
  const body = document.getElementById("single-date-body");
  dateInput.value = toInputDate(new Date());

  document.getElementById("single-date-load").addEventListener("click", async () => {
    if (!dateInput.value) return;
    body.innerHTML = `<tr><td colspan="5" class="empty-msg">Loading...</td></tr>`;
    renderDistribution("single-date-distribution", 0);

    const data = await fetchSalesData(parseInputDate(dateInput.value));
    if (!data) {
      body.innerHTML = `<tr><td colspan="5" class="empty-msg">No data available</td></tr>`;
      return;
    }

    const commission = commissionOf(data);
    body.innerHTML = `
      <tr>
        <td>${currency(num(data, "total_sales"))}</td>
        <td>${currency(num(data, "net_sales"))}</td>
        <td>${currency(num(data, "foodpanda"))}</td>
        <td>${currency(num(data, "foodi"))}</td>
        <td>${currency(commission)}</td>
      </tr>`;
    renderDistribution("single-date-distribution", commission);
  });
}

function initRange() {
  const startInput = document.getElementById("range-start");
  const endInput = document.getElementById("range-end");
  const body = document.getElementById("range-body");

  const setLast6Months = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    startInput.value = toInputDate(start);
    endInput.value = toInputDate(end);
  };
  setLast6Months();

  document.getElementById("range-last-6-months").addEventListener("click", setLast6Months);

  document.getElementById("range-load").addEventListener("click", async () => {
    if (!startInput.value || !endInput.value) return;
    const start = parseInputDate(startInput.value);
    const end = parseInputDate(endInput.value);

    if (start > end) {
      body.innerHTML = `<tr><td colspan="6" class="empty-msg">Start date must be before end date</td></tr>`;
      renderDistribution("range-distribution", 0);
      return;
    }

    body.innerHTML = `<tr><td colspan="6" class="empty-msg">Loading...</td></tr>`;
    renderDistribution("range-distribution", 0);

    const dates = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      dates.push(new Date(cursor));
    }

    const results = await Promise.all(dates.map((d) => fetchSalesData(d).then((data) => ({ date: d, data }))));
    const found = results.filter((r) => r.data);

    if (found.length === 0) {
      body.innerHTML = `<tr><td colspan="6" class="empty-msg">No data available in this range</td></tr>`;
      renderDistribution("range-distribution", 0);
      return;
    }

    const totals = { total_sales: 0, net_sales: 0, foodpanda: 0, foodi: 0, commission: 0 };
    const rows = found.map(({ date, data }) => {
      const commission = commissionOf(data);
      totals.total_sales += num(data, "total_sales");
      totals.net_sales += num(data, "net_sales");
      totals.foodpanda += num(data, "foodpanda");
      totals.foodi += num(data, "foodi");
      totals.commission += commission;
      return `
        <tr>
          <td>${toDisplayDate(date)}</td>
          <td>${currency(num(data, "total_sales"))}</td>
          <td>${currency(num(data, "net_sales"))}</td>
          <td>${currency(num(data, "foodpanda"))}</td>
          <td>${currency(num(data, "foodi"))}</td>
          <td>${currency(commission)}</td>
        </tr>`;
    });

    rows.push(`
      <tr class="totals-row">
        <td>Total</td>
        <td>${currency(totals.total_sales)}</td>
        <td>${currency(totals.net_sales)}</td>
        <td>${currency(totals.foodpanda)}</td>
        <td>${currency(totals.foodi)}</td>
        <td>${currency(totals.commission)}</td>
      </tr>`);

    body.innerHTML = rows.join("");
    renderDistribution("range-distribution", totals.commission);
  });
}

initTabs();
initSingleDate();
initRange();
