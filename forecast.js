// Forecast Monthly Sales — predicts a month's totals from historical daily files.
// Reuses fetchSalesData, num, currency, commissionOf, DISTRIBUTION_USERS, renderDistribution from sales.js.

const TREND_WINDOW_DAYS = 90;
const HISTORY_YEARS_BACK = 3;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
const average = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function sumTotals(records) {
  return records.reduce(
    (acc, r) => {
      acc.total_sales += num(r.data, "total_sales");
      acc.net_sales += num(r.data, "net_sales");
      acc.foodpanda += num(r.data, "foodpanda");
      acc.foodi += num(r.data, "foodi");
      return acc;
    },
    { total_sales: 0, net_sales: 0, foodpanda: 0, foodi: 0 }
  );
}

async function forecastMonth(targetYear, targetMonth) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = daysInMonth(targetYear, targetMonth);
  const dateMap = new Map();
  const addDate = (dt) => dateMap.set(toFilenameDate(dt), dt);

  const targetDates = [];
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(targetYear, targetMonth - 1, d);
    targetDates.push(dt);
    addDate(dt);
  }
  for (let i = 1; i <= TREND_WINDOW_DAYS; i++) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - i);
    addDate(dt);
  }
  for (let yBack = 1; yBack <= HISTORY_YEARS_BACK; yBack++) {
    const y = targetYear - yBack;
    const dim = daysInMonth(y, targetMonth);
    for (let d = 1; d <= dim; d++) addDate(new Date(y, targetMonth - 1, d));
  }

  const allDates = Array.from(dateMap.values());
  const fetched = await Promise.all(
    allDates.map((dt) => fetchSalesData(dt).then((data) => ({ key: toFilenameDate(dt), date: dt, data })))
  );
  const byKey = new Map(fetched.map((r) => [r.key, r]));

  const targetResults = targetDates.map((dt) => byKey.get(toFilenameDate(dt)));
  const actualDays = targetResults.filter((r) => r.data);
  const missingDays = targetResults.filter((r) => !r.data);
  const historyPool = fetched.filter((r) => r.data);

  if (historyPool.length === 0) {
    return { status: "no-data", totalDays };
  }

  if (missingDays.length === 0) {
    return { status: "actual", totals: sumTotals(actualDays), totalDays, recordedDays: actualDays.length };
  }

  // Day-of-week seasonality factor (captures weekday/weekend patterns)
  const dowSums = Array(7).fill(0);
  const dowCounts = Array(7).fill(0);
  let grandSum = 0;
  historyPool.forEach((r) => {
    const t = num(r.data, "total_sales");
    dowSums[r.date.getDay()] += t;
    dowCounts[r.date.getDay()] += 1;
    grandSum += t;
  });
  const overallAvg = grandSum / historyPool.length;
  const dowFactor = dowSums.map((sum, i) => (dowCounts[i] > 0 && overallAvg > 0 ? sum / dowCounts[i] / overallAvg : 1));

  // Baseline daily level: blend of recent trend and same month in previous years
  const trendCutoff = new Date(today);
  trendCutoff.setDate(trendCutoff.getDate() - TREND_WINDOW_DAYS);
  const trendAvg = average(
    historyPool.filter((r) => r.date >= trendCutoff && r.date < today).map((r) => num(r.data, "total_sales"))
  );
  const sameMonthAvg = average(
    historyPool
      .filter((r) => r.date.getMonth() === targetMonth - 1 && r.date.getFullYear() < targetYear)
      .map((r) => num(r.data, "total_sales"))
  );
  const baseline = trendAvg && sameMonthAvg ? (trendAvg + sameMonthAvg) / 2 : trendAvg || sameMonthAvg || overallAvg;

  // Component ratios (net/foodpanda/foodi share of total), from historical pool
  const ratioOf = (key) =>
    average(
      historyPool
        .filter((r) => num(r.data, "total_sales") > 0)
        .map((r) => num(r.data, key) / num(r.data, "total_sales"))
    );
  const netRatio = ratioOf("net_sales");
  const fpRatio = ratioOf("foodpanda");
  const fiRatio = ratioOf("foodi");

  const forecastRecords = missingDays.map((r) => {
    const predictedTotal = baseline * (dowFactor[r.date.getDay()] || 1);
    return {
      date: r.date,
      data: {
        total_sales: predictedTotal,
        net_sales: predictedTotal * netRatio,
        foodpanda: predictedTotal * fpRatio,
        foodi: predictedTotal * fiRatio,
      },
    };
  });

  return {
    status: actualDays.length > 0 ? "partial" : "forecast",
    totals: sumTotals([...actualDays, ...forecastRecords]),
    totalDays,
    recordedDays: actualDays.length,
    forecastedDays: forecastRecords.length,
  };
}

function populateForecastSelectors() {
  const monthSelect = document.getElementById("forecast-month");
  const yearSelect = document.getElementById("forecast-year");
  const today = new Date();

  monthSelect.innerHTML = MONTH_NAMES.map((name, i) => `<option value="${i + 1}">${name}</option>`).join("");
  monthSelect.value = today.getMonth() + 1;

  const currentYear = today.getFullYear();
  const years = [];
  for (let y = currentYear - HISTORY_YEARS_BACK; y <= currentYear + 1; y++) years.push(y);
  yearSelect.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
  yearSelect.value = currentYear;
}

function initForecast() {
  populateForecastSelectors();

  const body = document.getElementById("forecast-body");
  const status = document.getElementById("forecast-status");

  document.getElementById("forecast-load").addEventListener("click", async () => {
    const month = Number(document.getElementById("forecast-month").value);
    const year = Number(document.getElementById("forecast-year").value);

    body.innerHTML = `<tr><td colspan="5" class="empty-msg">Calculating forecast...</td></tr>`;
    status.textContent = "";
    renderDistribution("forecast-distribution", 0);

    const result = await forecastMonth(year, month);

    if (result.status === "no-data") {
      body.innerHTML = `<tr><td colspan="5" class="empty-msg">Not enough historical data to forecast this month</td></tr>`;
      return;
    }

    const commission = commissionOf(result.totals);
    body.innerHTML = `
      <tr>
        <td>${currency(result.totals.total_sales)}</td>
        <td>${currency(result.totals.net_sales)}</td>
        <td>${currency(result.totals.foodpanda)}</td>
        <td>${currency(result.totals.foodi)}</td>
        <td>${currency(commission)}</td>
      </tr>`;
    renderDistribution("forecast-distribution", commission);

    const statusText = {
      actual: `Actual — all ${result.recordedDays} of ${result.totalDays} days recorded`,
      partial: `Partial — ${result.recordedDays} of ${result.totalDays} days recorded, ${result.forecastedDays} days forecasted`,
      forecast: `Forecast — no days recorded yet, all ${result.totalDays} days predicted`,
    };
    status.textContent = statusText[result.status] || "";
  });
}

initForecast();
