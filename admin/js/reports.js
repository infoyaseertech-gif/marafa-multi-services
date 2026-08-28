(async function init() {
  const { profile } = await requireAuth();
  const company = await getCompany();
  renderShell("reports", company, profile.full_name || profile.email);

  const [staff, projects, sales, expenses] = await Promise.all([getStaff(), getProjects(), getSales(), getExpenses()]);

  const totalSales = sales.reduce((a, s) => a + (Number(s.amount) || 0), 0);
  const totalExpenses = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const pending = sales.filter((s) => s.status === "Unpaid").reduce((a, s) => a + (Number(s.amount) || 0), 0);
  const net = totalSales - totalExpenses;

  document.getElementById("page-content").innerHTML = `
    <h1 class="page-title">Reports &amp; Summary</h1>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="color:#047857">${fmtNaira(totalSales)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Expenses</div><div class="kpi-value" style="color:#b5622d">${fmtNaira(totalExpenses)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Net Profit / Loss</div><div class="kpi-value" style="color:${net >= 0 ? "#047857" : "#e11d48"}">${fmtNaira(net)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Unpaid Receivables</div><div class="kpi-value" style="color:#c9962c">${fmtNaira(pending)}</div></div>
    </div>
    <div class="chart-grid" style="grid-template-columns:1fr 1fr;">
      <div class="chart-card"><h3>Expenses by Category</h3><div id="pieWrap"><canvas id="pieChart" height="180"></canvas></div></div>
      <div class="chart-card"><h3>Projects by Service Line</h3><div id="barWrap"><canvas id="barChart" height="180"></canvas></div></div>
    </div>
    <div class="chart-card" style="margin-top:16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
      <span style="font-size:13.5px;color:#64748b;margin-right:6px;">Export full records:</span>
      <button class="btn-outline-sm" id="expStaff">Staff CSV</button>
      <button class="btn-outline-sm" id="expProjects">Projects CSV</button>
      <button class="btn-outline-sm" id="expSales">Sales CSV</button>
      <button class="btn-outline-sm" id="expExpenses">Expenses CSV</button>
    </div>
  `;

  document.getElementById("expStaff").addEventListener("click", () => exportCSV("marafa_staff.csv", staff));
  document.getElementById("expProjects").addEventListener("click", () => exportCSV("marafa_projects.csv", projects));
  document.getElementById("expSales").addEventListener("click", () => exportCSV("marafa_sales.csv", sales));
  document.getElementById("expExpenses").addEventListener("click", () => exportCSV("marafa_expenses.csv", expenses));

  const catMap = {};
  expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0); });
  const catLabels = Object.keys(catMap);
  if (catLabels.length) {
    new Chart(document.getElementById("pieChart"), {
      type: "pie",
      data: { labels: catLabels, datasets: [{ data: catLabels.map((c) => catMap[c]), backgroundColor: ["#101c33", "#c9962c", "#b5622d", "#10b981", "#64748b", "#e11d48", "#0ea5e9", "#a855f7", "#f59e0b"] }] },
      options: { responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 10 } } } } },
    });
  } else {
    document.getElementById("pieWrap").innerHTML = emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="1.5"/></svg>', "No expense data yet.");
  }

  const svcMap = {};
  projects.forEach((p) => { svcMap[p.category] = (svcMap[p.category] || 0) + 1; });
  const svcLabels = Object.keys(svcMap);
  if (svcLabels.length) {
    new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: { labels: svcLabels, datasets: [{ data: svcLabels.map((c) => svcMap[c]), backgroundColor: "#101c33", borderRadius: 4 }] },
      options: { indexAxis: "y", responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { precision: 0 } }, y: { ticks: { font: { size: 10 } } } } },
    });
  } else {
    document.getElementById("barWrap").innerHTML = emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="1.5"/></svg>', "No project data yet.");
  }
})();
