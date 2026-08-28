let projects = [];
let searchTerm = "";
let statusFilter = "All";

function projectFormHtml(p) {
  p = p || { name: "", client: "", category: SERVICE_CATEGORIES[0], status: "Planned", start_date: "", end_date: "", value: "", notes: "" };
  return `
    <form id="projectForm">
      <div class="form-field"><label>Project / Contract Name</label><input id="f_name" required value="${esc(p.name)}"></div>
      <div class="form-row-2">
        <div class="form-field"><label>Client</label><input id="f_client" value="${esc(p.client)}"></div>
        <div class="form-field"><label>Service Category</label><select id="f_category">${SERVICE_CATEGORIES.map((c) => `<option ${c === p.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
      </div>
      <div class="form-row-3">
        <div class="form-field"><label>Status</label><select id="f_status"><option ${p.status === "Planned" ? "selected" : ""}>Planned</option><option ${p.status === "Ongoing" ? "selected" : ""}>Ongoing</option><option ${p.status === "Completed" ? "selected" : ""}>Completed</option></select></div>
        <div class="form-field"><label>Start Date</label><input id="f_start" type="date" value="${esc(p.start_date)}"></div>
        <div class="form-field"><label>End Date</label><input id="f_end" type="date" value="${esc(p.end_date)}"></div>
      </div>
      <div class="form-field"><label>Contract Value (₦)</label><input id="f_value" type="number" value="${esc(p.value)}"></div>
      <div class="form-field"><label>Notes</label><textarea id="f_notes">${esc(p.notes)}</textarea></div>
      <div class="form-actions"><button type="button" class="btn-cancel" id="cancelBtn">Cancel</button><button type="submit" class="btn-save">Save</button></div>
    </form>`;
}

function openProjectModal(existing) {
  const modal = openModal(existing ? "Edit Project" : "Add Project", projectFormHtml(existing), true);
  modal.querySelector("#cancelBtn").addEventListener("click", closeModal);
  modal.querySelector("#projectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: modal.querySelector("#f_name").value.trim(),
      client: modal.querySelector("#f_client").value.trim(),
      category: modal.querySelector("#f_category").value,
      status: modal.querySelector("#f_status").value,
      start_date: modal.querySelector("#f_start").value || null,
      end_date: modal.querySelector("#f_end").value || null,
      value: modal.querySelector("#f_value").value || null,
      notes: modal.querySelector("#f_notes").value.trim(),
    };
    if (existing) await updateProject(existing.id, data);
    else await addProject(data);
    closeModal();
    load();
  });
}

function render() {
  const filtered = projects.filter((p) =>
    (p.name + p.client + p.category).toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === "All" || p.status === statusFilter)
  );
  const rows = filtered.length
    ? `<table class="data-table"><thead><tr><th>Project</th><th>Client</th><th>Category</th><th>Timeline</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>
        ${filtered.map((p) => `
          <tr>
            <td class="cell-strong">${esc(p.name)}${p.notes ? `<div class="cell-sub">${esc(p.notes.slice(0, 60))}${p.notes.length > 60 ? "…" : ""}</div>` : ""}</td>
            <td>${esc(p.client) || "—"}</td>
            <td class="cell-sub" style="max-width:160px;">${esc(p.category)}</td>
            <td class="cell-sub">${esc(p.start_date) || "—"} → ${esc(p.end_date) || "—"}</td>
            <td class="cell-strong">${p.value ? fmtNaira(p.value) : "—"}</td>
            <td><span class="badge ${badgeClass(p.status)}">${esc(p.status)}</span></td>
            <td><div class="row-actions">
              <button class="icon-btn" data-edit="${p.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
              <button class="icon-btn danger" data-del="${p.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div></td>
          </tr>`).join("")}
      </tbody></table>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="1.5"/></svg>', "No projects yet. Click “Add Project” to log one.");

  document.getElementById("page-content").innerHTML = `
    <div class="toolbar">
      <h1 class="page-title" style="margin:0;">Projects &amp; Services</h1>
      <div class="toolbar-actions">
        <input class="search-input" id="searchBox" placeholder="Search..." value="${esc(searchTerm)}">
        <button class="btn-outline-sm" id="exportBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg> Export</button>
        <button class="btn-add" id="addBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add Project</button>
      </div>
    </div>
    <div class="status-pills">
      ${["All", "Planned", "Ongoing", "Completed"].map((s) => `<button class="status-pill ${statusFilter === s ? "active" : ""}" data-status="${s}">${s}</button>`).join("")}
    </div>
    <div class="table-card">${rows}</div>
  `;
  document.getElementById("searchBox").addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  document.getElementById("exportBtn").addEventListener("click", () => exportCSV("marafa_projects.csv", projects));
  document.getElementById("addBtn").addEventListener("click", () => openProjectModal(null));
  document.querySelectorAll("[data-status]").forEach((btn) => btn.addEventListener("click", () => { statusFilter = btn.dataset.status; render(); }));
  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openProjectModal(projects.find((p) => p.id == btn.dataset.edit))));
  document.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    const proj = projects.find((p) => p.id == btn.dataset.del);
    if (confirm(`Delete project "${proj.name}"?`)) { await deleteProject(proj.id); load(); }
  }));
}

async function load() { projects = await getProjects(); render(); }

(async function init() {
  const { profile } = await requireAuth();
  const company = await getCompany();
  renderShell("projects", company, profile.full_name || profile.email);
  await load();
})();
