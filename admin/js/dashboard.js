requireAuth();
renderShell("dashboard");

const staff = getLS(LS.staff, DEFAULT_STAFF);
const projects = getLS(LS.projects, []);
const sales = getLS(LS.sales, []);
const expenses = getLS(LS.expenses, []);

const totalStaff = staff.length;
const activeStaff = staff.filter((s) => s.status === "Active").length;
const ongoing = projects.filter((p) => p.status === "Ongoing").length;
const completed = projects.filter((p) => p.status === "Completed").length;
const totalSales = sales.reduce((a, s) => a + (Number(s.amount) || 0), 0);
const totalExpenses = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
const net = totalSales - totalExpenses;

document.getElementById("page-content").innerHTML = `
  <h1 class="page-title">Dashboard</h1>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Total Staff</div><div class="kpi-value">${totalStaff}</div><div class="kpi-sub">${activeStaff} active</div></div>
    <div class="kpi-card"><div class="kpi-label">Ongoing Projects</div><div class="kpi-value">${ongoing}</div><div class="kpi-sub">${completed} completed</div></div>
    <div class="kpi-card"><div class="kpi-label">Total Sales</div><div class="kpi-value">${fmtNaira(totalSales)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Total Expenses</div><div class="kpi-value">${fmtNaira(totalExpenses)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Net Position</div><div class="kpi-value" style="color:${net >= 0 ? "#047857" : "#e11d48"}">${fmtNaira(net)}</div></div>
  </div>
  <div class="chart-grid">
    <div class="chart-card"><h3>Sales vs Expenses (by month)</h3><div id="barWrap"><canvas id="barChart" height="130"></canvas></div></div>
    <div class="chart-card"><h3>Projects by Status</h3><div id="pieWrap"><canvas id="pieChart" height="130"></canvas></div></div>
  </div>
`;

/* ---- monthly aggregation ---- */
const monthMap = {};
sales.forEach((s) => { const m = (s.date || "").slice(0, 7); if (!m) return; monthMap[m] = monthMap[m] || { sales: 0, expenses: 0 }; monthMap[m].sales += Number(s.amount) || 0; });
expenses.forEach((e) => { const m = (e.date || "").slice(0, 7); if (!m) return; monthMap[m] = monthMap[m] || { sales: 0, expenses: 0 }; monthMap[m].expenses += Number(e.amount) || 0; });
const months = Object.keys(monthMap).sort().slice(-8);

if (months.length) {
  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        { label: "Sales", data: months.map((m) => monthMap[m].sales), backgroundColor: "#10b981", borderRadius: 4 },
        { label: "Expenses", data: months.map((m) => monthMap[m].expenses), backgroundColor: "#b5622d", borderRadius: 4 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }, scales: { y: { ticks: { callback: (v) => "₦" + v / 1000 + "k" } } } },
  });
} else {
  document.getElementById("barWrap").innerHTML = emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V10M12 20V4M20 20V14"/></svg>', "Add sales or expense records to see trends here.");
}

/* ---- status pie ---- */
const statusCounts = {
  Planned: projects.filter((p) => p.status === "Planned").length,
  Ongoing: ongoing,
  Completed: completed,
};
const statusLabels = Object.keys(statusCounts).filter((k) => statusCounts[k] > 0);
if (statusLabels.length) {
  new Chart(document.getElementById("pieChart"), {
    type: "doughnut",
    data: { labels: statusLabels, datasets: [{ data: statusLabels.map((k) => statusCounts[k]), backgroundColor: ["#94a3b8", "#c9962c", "#10b981"] }] },
    options: { responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } },
  });
} else {
  document.getElementById("pieWrap").innerHTML = emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="1.5"/></svg>', "Add a project to see the breakdown.");
}
