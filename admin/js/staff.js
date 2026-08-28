let staff = [];
let searchTerm = "";

function staffFormHtml(s) {
  s = s || { name: "", role: "", department: DEPARTMENTS[0], phone: "", email: "", joined: "", status: "Active" };
  return `
    <form id="staffForm">
      <div class="form-field"><label>Full Name</label><input id="f_name" required value="${esc(s.name)}"></div>
      <div class="form-row-2">
        <div class="form-field"><label>Role / Position</label><input id="f_role" required value="${esc(s.role)}"></div>
        <div class="form-field"><label>Department</label><select id="f_department">${DEPARTMENTS.map((d) => `<option ${d === s.department ? "selected" : ""}>${esc(d)}</option>`).join("")}</select></div>
      </div>
      <div class="form-row-2">
        <div class="form-field"><label>Phone</label><input id="f_phone" value="${esc(s.phone)}"></div>
        <div class="form-field"><label>Email</label><input id="f_email" type="email" value="${esc(s.email)}"></div>
      </div>
      <div class="form-row-2">
        <div class="form-field"><label>Date Joined</label><input id="f_joined" type="date" value="${esc(s.joined)}"></div>
        <div class="form-field"><label>Status</label><select id="f_status"><option ${s.status === "Active" ? "selected" : ""}>Active</option><option ${s.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div>
      </div>
      <div class="form-actions"><button type="button" class="btn-cancel" id="cancelBtn">Cancel</button><button type="submit" class="btn-save">Save</button></div>
    </form>`;
}

function openStaffModal(existing) {
  const modal = openModal(existing ? "Edit Staff Member" : "Add Staff Member", staffFormHtml(existing));
  modal.querySelector("#cancelBtn").addEventListener("click", closeModal);
  modal.querySelector("#staffForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: modal.querySelector("#f_name").value.trim(),
      role: modal.querySelector("#f_role").value.trim(),
      department: modal.querySelector("#f_department").value,
      phone: modal.querySelector("#f_phone").value.trim(),
      email: modal.querySelector("#f_email").value.trim(),
      joined: modal.querySelector("#f_joined").value || null,
      status: modal.querySelector("#f_status").value,
    };
    if (existing) await updateStaff(existing.id, data);
    else await addStaff(data);
    closeModal();
    load();
  });
}

function render() {
  const filtered = staff.filter((s) => (s.name + s.role + s.department).toLowerCase().includes(searchTerm.toLowerCase()));
  const rows = filtered.length
    ? `<table class="data-table"><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Contact</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>
        ${filtered.map((s) => `
          <tr>
            <td class="cell-strong">${esc(s.name)}</td>
            <td>${esc(s.role)}</td>
            <td>${esc(s.department)}</td>
            <td>${esc(s.phone)}<br><span class="cell-sub">${esc(s.email)}</span></td>
            <td>${esc(s.joined) || "—"}</td>
            <td><span class="badge ${badgeClass(s.status)}">${esc(s.status)}</span></td>
            <td><div class="row-actions">
              <button class="icon-btn" data-edit="${s.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
              <button class="icon-btn danger" data-del="${s.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div></td>
          </tr>`).join("")}
      </tbody></table>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20C2.5 16 5.5 14 9 14C12.5 14 15.5 16 15.5 20"/></svg>', "No staff records yet. Click “Add Staff” to get started.");

  document.getElementById("page-content").innerHTML = `
    <div class="toolbar">
      <h1 class="page-title" style="margin:0;">Staff Records</h1>
      <div class="toolbar-actions">
        <input class="search-input" id="searchBox" placeholder="Search..." value="${esc(searchTerm)}">
        <button class="btn-outline-sm" id="exportBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg> Export</button>
        <button class="btn-add" id="addBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add Staff</button>
      </div>
    </div>
    <p style="font-size:12.5px;color:#94a3b8;margin:-10px 0 16px;">These are HR records only. To create a staff member's login for this portal, use <a href="access.html" style="color:#b5622d;font-weight:600;">Manage Access</a>.</p>
    <div class="table-card">${rows}</div>
  `;
  document.getElementById("searchBox").addEventListener("input", (e) => { searchTerm = e.target.value; render(); });
  document.getElementById("exportBtn").addEventListener("click", () => exportCSV("marafa_staff.csv", staff));
  document.getElementById("addBtn").addEventListener("click", () => openStaffModal(null));
  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openStaffModal(staff.find((s) => s.id == btn.dataset.edit))));
  document.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    const person = staff.find((s) => s.id == btn.dataset.del);
    if (confirm(`Remove ${person.name}?`)) { await deleteStaff(person.id); load(); }
  }));
}

async function load() { staff = await getStaff(); render(); }

(async function init() {
  const { profile } = await requireAuth();
  const company = await getCompany();
  renderShell("staff", company, profile.full_name || profile.email);
  await load();
})();
