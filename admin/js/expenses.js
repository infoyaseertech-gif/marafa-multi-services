requireAuth();
renderShell("expenses");

let expenses = getLS(LS.expenses, []);
let searchTerm = "";

function saveExpenses() { setLS(LS.expenses, expenses); }

function expenseFormHtml(e) {
  e = e || { date: "", category: EXPENSE_CATEGORIES[0], amount: "", description: "", paidTo: "" };
  return `
    <form id="expenseForm">
      <div class="form-row-2">
        <div class="form-field"><label>Date</label><input id="f_date" type="date" required value="${esc(e.date)}"></div>
        <div class="form-field"><label>Category</label><select id="f_category">${EXPENSE_CATEGORIES.map((c) => `<option ${c === e.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
      </div>
      <div class="form-field"><label>Description</label><input id="f_description" required value="${esc(e.description)}"></div>
      <div class="form-row-2">
        <div class="form-field"><label>Amount (₦)</label><input id="f_amount" type="number" required value="${esc(e.amount)}"></div>
        <div class="form-field"><label>Paid To</label><input id="f_paidTo" value="${esc(e.paidTo)}"></div>
      </div>
      <div class="form-actions"><button type="button" class="btn-cancel" id="cancelBtn">Cancel</button><button type="submit" class="btn-save">Save</button></div>
    </form>`;
}

function openExpenseModal(existing) {
  const modal = openModal(existing ? "Edit Expense" : "Add Expense", expenseFormHtml(existing));
  modal.querySelector("#cancelBtn").addEventListener("click", closeModal);
  modal.querySelector("#expenseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      date: modal.querySelector("#f_date").value,
      category: modal.querySelector("#f_category").value,
      amount: modal.querySelector("#f_amount").value,
      description: modal.querySelector("#f_description").value.trim(),
      paidTo: modal.querySelector("#f_paidTo").value.trim(),
    };
    if (existing) { expenses = expenses.map((x) => (x.id === existing.id ? { ...x, ...data } : x)); }
    else { expenses.push({ id: uid(), ...data }); }
    saveExpenses();
    closeModal();
    render();
  });
}

function render() {
  const filtered = expenses.filter((e) => (e.category + e.description + e.paidTo).toLowerCase().includes(searchTerm.toLowerCase()));
  const total = filtered.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const rows = filtered.length
    ? `<table class="data-table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid To</th><th>Amount</th><th></th></tr></thead><tbody>
        ${filtered.map((e) => `
          <tr>
            <td>${esc(e.date)}</td>
            <td><span class="badge badge-slate">${esc(e.category)}</span></td>
            <td>${esc(e.description)}</td>
            <td>${esc(e.paidTo) || "—"}</td>
            <td class="cell-strong">${fmtNaira(e.amount)}</td>
            <td><div class="row-actions">
              <button class="icon-btn" data-edit="${e.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
              <button class="icon-btn danger" data-del="${e.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div></td>
          </tr>`).join("")}
      </tbody></table>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="1.5"/></svg>', "No expenses recorded yet.");

  document.getElementById("page-content").innerHTML = `
    <div class="toolbar">
      <h1 class="page-title" style="margin:0;">Expenses</h1>
      <div class="toolbar-actions">
        <input class="search-input" id="searchBox" placeholder="Search..." value="${esc(searchTerm)}">
        <button class="btn-outline-sm" id="exportBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg> Export</button>
        <button class="btn-add" id="addBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add Expense</button>
      </div>
    </div>
    <div class="summary-line">Showing ${filtered.length} record(s) — Total: <b>${fmtNaira(total)}</b></div>
    <div class="table-card">${rows}</div>
  `;
  document.getElementById("searchBox").addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  document.getElementById("exportBtn").addEventListener("click", () => exportCSV("marafa_expenses.csv", expenses));
  document.getElementById("addBtn").addEventListener("click", () => openExpenseModal(null));
  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openExpenseModal(expenses.find((x) => x.id == btn.dataset.edit))));
  document.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", () => {
    if (confirm("Delete this expense record?")) { expenses = expenses.filter((x) => x.id != btn.dataset.del); saveExpenses(); render(); }
  }));
}

render();
