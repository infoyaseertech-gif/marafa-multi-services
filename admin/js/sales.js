let sales = [];
let projects = [];
let company = null;
let currentUserLabel = "";
let searchTerm = "";

function saleFormHtml(s) {
  s = s || { sale_date: "", client: "", description: "", amount: "", status: "Unpaid", project_id: "" };
  const projectOptions = projects.length
    ? `<div class="form-field"><label>Linked Project (optional)</label><select id="f_projectId"><option value="">— None —</option>${projects.map((p) => `<option value="${p.id}" ${String(p.id) === String(s.project_id) ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></div>`
    : "";
  return `
    <form id="saleForm">
      <div class="form-row-2">
        <div class="form-field"><label>Date</label><input id="f_date" type="date" required value="${esc(s.sale_date)}"></div>
        <div class="form-field"><label>Client</label><input id="f_client" value="${esc(s.client)}"></div>
      </div>
      <div class="form-field"><label>Description</label><input id="f_description" required value="${esc(s.description)}"></div>
      <div class="form-row-2">
        <div class="form-field"><label>Amount (₦)</label><input id="f_amount" type="number" required value="${esc(s.amount)}"></div>
        <div class="form-field"><label>Payment Status</label><select id="f_status"><option ${s.status === "Unpaid" ? "selected" : ""}>Unpaid</option><option ${s.status === "Paid" ? "selected" : ""}>Paid</option></select></div>
      </div>
      ${projectOptions}
      <div class="form-actions"><button type="button" class="btn-cancel" id="cancelBtn">Cancel</button><button type="submit" class="btn-save">Save</button></div>
    </form>`;
}

function openSaleModal(existing) {
  const modal = openModal(existing ? "Edit Sale" : "Add Sale — New Receipt", saleFormHtml(existing));
  modal.querySelector("#cancelBtn").addEventListener("click", closeModal);
  modal.querySelector("#saleForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const projectField = modal.querySelector("#f_projectId");
    const data = {
      sale_date: modal.querySelector("#f_date").value,
      client: modal.querySelector("#f_client").value.trim(),
      description: modal.querySelector("#f_description").value.trim(),
      amount: modal.querySelector("#f_amount").value,
      status: modal.querySelector("#f_status").value,
      project_id: projectField && projectField.value ? projectField.value : null,
    };
    if (existing) {
      await updateSale(existing.id, data);
    } else {
      data.issued_by = currentUserLabel;
      if (data.status === "Paid") data.paid_at = new Date().toISOString();
      const created = await addSale(data);
      closeModal();
      await load();
      if (created) openReceiptModal(created, company, currentUserLabel);
      return;
    }
    closeModal();
    load();
  });
}

async function markPaid(sale) {
  if (!confirm(`Mark ${receiptNo(sale)} (${fmtNaira(sale.amount)}) as PAID?`)) return;
  await updateSale(sale.id, { status: "Paid", paid_at: new Date().toISOString() });
  load();
}
async function markUnpaid(sale) {
  if (!confirm(`Revert ${receiptNo(sale)} back to UNPAID?`)) return;
  await updateSale(sale.id, { status: "Unpaid", paid_at: null });
  load();
}

function render() {
  const filtered = sales.filter((s) => (s.client + s.description).toLowerCase().includes(searchTerm.toLowerCase()));
  const total = filtered.reduce((a, s) => a + (Number(s.amount) || 0), 0);
  const unpaidTotal = filtered.filter((s) => s.status === "Unpaid").reduce((a, s) => a + (Number(s.amount) || 0), 0);

  const rows = filtered.length
    ? `<table class="data-table"><thead><tr><th>Receipt</th><th>Date</th><th>Client</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
        ${filtered.map((s) => `
          <tr>
            <td class="cell-sub">${esc(receiptNo(s))}</td>
            <td>${esc(s.sale_date) || "—"}</td>
            <td class="cell-strong">${esc(s.client) || "—"}</td>
            <td>${esc(s.description)}</td>
            <td class="cell-strong">${fmtNaira(s.amount)}</td>
            <td><span class="badge ${badgeClass(s.status)}">${esc(s.status)}</span></td>
            <td><div class="row-actions">
              ${s.status === "Unpaid"
                ? `<button class="icon-btn" title="Mark as Paid" data-paid="${s.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.2"><path d="M4 12.5L9.5 18L20 6"/></svg></button>`
                : `<button class="icon-btn" title="Revert to Unpaid" data-unpaid="${s.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2"><path d="M3 12a9 9 0 1015.5-6.5M21 4v5h-5"/></svg></button>`}
              <button class="icon-btn" title="Receipt" data-receipt="${s.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 8H15M9 12H15M9 16H12"/></svg></button>
              <button class="icon-btn" title="Edit" data-edit="${s.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
              <button class="icon-btn danger" title="Delete" data-del="${s.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div></td>
          </tr>`).join("")}
      </tbody></table>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12C3 12 6 6 12 6C18 6 21 12 21 12C21 12 18 18 12 18C6 18 3 12 3 12Z"/></svg>', "No sales recorded yet.");

  document.getElementById("page-content").innerHTML = `
    <div class="toolbar">
      <h1 class="page-title" style="margin:0;">Sales &amp; Receipts</h1>
      <div class="toolbar-actions">
        <input class="search-input" id="searchBox" placeholder="Search..." value="${esc(searchTerm)}">
        <button class="btn-outline-sm" id="exportBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg> Export</button>
        <button class="btn-add" id="addBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add Sale</button>
      </div>
    </div>
    <div class="summary-line">Showing ${filtered.length} record(s) — Total: <b>${fmtNaira(total)}</b> &nbsp;|&nbsp; Unpaid: <b style="color:#b45309;">${fmtNaira(unpaidTotal)}</b></div>
    <div class="table-card">${rows}</div>
  `;
  document.getElementById("searchBox").addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  document.getElementById("exportBtn").addEventListener("click", () => exportCSV("marafa_sales.csv", sales));
  document.getElementById("addBtn").addEventListener("click", () => openSaleModal(null));
  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openSaleModal(sales.find((s) => s.id == btn.dataset.edit))));
  document.querySelectorAll("[data-paid]").forEach((btn) => btn.addEventListener("click", () => markPaid(sales.find((s) => s.id == btn.dataset.paid))));
  document.querySelectorAll("[data-unpaid]").forEach((btn) => btn.addEventListener("click", () => markUnpaid(sales.find((s) => s.id == btn.dataset.unpaid))));
  document.querySelectorAll("[data-receipt]").forEach((btn) => btn.addEventListener("click", () => openReceiptModal(sales.find((s) => s.id == btn.dataset.receipt), company, currentUserLabel)));
  document.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (confirm("Delete this sale record? This cannot be undone.")) { await deleteSale(btn.dataset.del); load(); }
  }));
}

async function load() {
  [sales, projects] = await Promise.all([getSales(), getProjects()]);
  render();
}

(async function init() {
  const { profile } = await requireAuth();
  currentUserLabel = profile.full_name || profile.email;
  company = await getCompany();
  renderShell("sales", company, currentUserLabel);
  await load();
})();
