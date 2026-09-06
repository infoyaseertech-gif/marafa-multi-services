/* =====================================================================
   Marafa Operations Portal — shared.js
   Data + auth now live in Supabase (a real online database), not the
   browser. Every staff member with a login sees the same shared data.
===================================================================== */

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SERVICE_CATEGORIES = [
  "General Merchandise, Procurement & Supplies", "Import & Export", "Trading & Distribution",
  "Equipment & Machinery Supply", "Construction & Civil Engineering", "Real Estate & Property Services",
  "General Contracting", "Transportation & Logistics", "Automobile Sales & Services",
  "Mining & Solid Minerals", "Agricultural & Agro-Allied Activities", "Livestock & Food Processing",
  "Telecommunications & ICT", "Consultancy & Business Support",
];
const DEPARTMENTS = ["Management", "Operations", "Finance & Admin", "Field / Technical", "Logistics", "Sales & Business Development"];
const EXPENSE_CATEGORIES = ["Materials & Supplies", "Transport & Logistics", "Salaries & Wages", "Utilities", "Rent", "Equipment", "Marketing", "Professional Fees", "Miscellaneous"];
const DEFAULT_COMPANY = {
  name: "Marafa Multi-Services Limited", rc: "9797637",
  address: "14, Kakaki Road, Unguwar Rimi, off Bamako Road, Kaduna, Kaduna State, Nigeria",
  email: "marafa123419@gmail.com", phone: "+234 810 920 2315",
};

/* ---------------------- config sanity check ---------------------- */
function configIsMissing() {
  return !SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR") || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("PASTE_YOUR");
}
function showConfigError() {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f2a4a;padding:24px;font-family:sans-serif;">
      <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;">
        <h2 style="color:#e11d48;margin-top:0;">Supabase not connected yet</h2>
        <p style="color:#334155;font-size:14.5px;line-height:1.6;">
          Open <code>admin/js/supabase-config.js</code> and paste in your Supabase
          Project URL and anon public key (found under Project Settings → API
          in your Supabase dashboard). See <code>database/schema.sql</code> for
          the full setup steps.
        </p>
      </div>
    </div>`;
}

/* ---------------------- auth ---------------------- */
async function requireAuth() {
  if (configIsMissing()) { showConfigError(); throw new Error("stop"); }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = "login.html"; throw new Error("stop"); }
  const { data: profile } = await sb.from("profiles").select("is_active,full_name,email").eq("id", session.user.id).single();
  if (!profile || profile.is_active === false) {
    await sb.auth.signOut();
    window.location.href = "login.html?deactivated=1";
    throw new Error("stop");
  }
  return { user: session.user, profile };
}
async function logout() {
  await sb.auth.signOut();
  window.location.href = "login.html";
}

/* ---------------------- formatting ---------------------- */
function fmtNaira(n) {
  const num = Number(n) || 0;
  return "\u20A6" + num.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function badgeClass(status) {
  const map = { Planned: "badge-slate", Ongoing: "badge-amber", Completed: "badge-green", Paid: "badge-green", Unpaid: "badge-amber", Active: "badge-green", Inactive: "badge-slate" };
  return map[status] || "badge-slate";
}
function exportCSV(filename, rows) {
  if (!rows || !rows.length) { alert("No records to export yet."); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ======================= DATA ACCESS (Supabase) ======================= */

async function getCompany() {
  const { data, error } = await sb.from("company_settings").select("*").eq("id", 1).single();
  if (error || !data) return DEFAULT_COMPANY;
  return data;
}
async function updateCompany(patch) {
  const { error } = await sb.from("company_settings").update(patch).eq("id", 1);
  if (error) alert("Could not save company info: " + error.message);
  return !error;
}

async function getStaff() {
  const { data, error } = await sb.from("staff").select("*").order("id");
  if (error) { console.error(error); return []; }
  return data;
}
async function addStaff(obj) {
  const { error } = await sb.from("staff").insert(obj);
  if (error) alert("Could not save staff member: " + error.message);
  return !error;
}
async function updateStaff(id, patch) {
  const { error } = await sb.from("staff").update(patch).eq("id", id);
  if (error) alert("Could not update staff member: " + error.message);
  return !error;
}
async function deleteStaff(id) {
  const { error } = await sb.from("staff").delete().eq("id", id);
  if (error) alert("Could not remove staff member: " + error.message);
  return !error;
}

async function getProjects() {
  const { data, error } = await sb.from("projects").select("*").order("id");
  if (error) { console.error(error); return []; }
  return data;
}
async function addProject(obj) {
  const { error } = await sb.from("projects").insert(obj);
  if (error) alert("Could not save project: " + error.message);
  return !error;
}
async function updateProject(id, patch) {
  const { error } = await sb.from("projects").update(patch).eq("id", id);
  if (error) alert("Could not update project: " + error.message);
  return !error;
}
async function deleteProject(id) {
  const { error } = await sb.from("projects").delete().eq("id", id);
  if (error) alert("Could not delete project: " + error.message);
  return !error;
}

async function getSales() {
  const { data, error } = await sb.from("sales").select("*").order("id", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}
async function addSale(obj) {
  const { data, error } = await sb.from("sales").insert(obj).select().single();
  if (error) { alert("Could not save sale: " + error.message); return null; }
  return data;
}
async function updateSale(id, patch) {
  const { error } = await sb.from("sales").update(patch).eq("id", id);
  if (error) alert("Could not update sale: " + error.message);
  return !error;
}
async function deleteSale(id) {
  const { error } = await sb.from("sales").delete().eq("id", id);
  if (error) alert("Could not delete sale: " + error.message);
  return !error;
}

async function getExpenses() {
  const { data, error } = await sb.from("expenses").select("*").order("id", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}
async function addExpense(obj) {
  const { error } = await sb.from("expenses").insert(obj);
  if (error) alert("Could not save expense: " + error.message);
  return !error;
}
async function updateExpense(id, patch) {
  const { error } = await sb.from("expenses").update(patch).eq("id", id);
  if (error) alert("Could not update expense: " + error.message);
  return !error;
}
async function deleteExpense(id) {
  const { error } = await sb.from("expenses").delete().eq("id", id);
  if (error) alert("Could not delete expense: " + error.message);
  return !error;
}

async function getProfiles() {
  const { data, error } = await sb.from("profiles").select("*").order("created_at");
  if (error) { console.error(error); return []; }
  return data;
}
async function setProfileActive(id, isActive) {
  const { error } = await sb.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) alert("Could not update access: " + error.message);
  return !error;
}

async function getGalleryItems() {
  const { data, error } = await sb.from("gallery_items").select("*").order("sort_order").order("id", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}
async function addGalleryItem(obj) {
  const { error } = await sb.from("gallery_items").insert(obj);
  if (error) alert("Could not save gallery item: " + error.message);
  return !error;
}
async function deleteGalleryItem(id) {
  const { error } = await sb.from("gallery_items").delete().eq("id", id);
  if (error) alert("Could not remove gallery item: " + error.message);
  return !error;
}

async function getShowcaseProjects() {
  const { data, error } = await sb.from("showcase_projects").select("*").order("sort_order").order("id", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}
async function addShowcaseProject(obj) {
  const { error } = await sb.from("showcase_projects").insert(obj);
  if (error) alert("Could not save project: " + error.message);
  return !error;
}
async function updateShowcaseProject(id, patch) {
  const { error } = await sb.from("showcase_projects").update(patch).eq("id", id);
  if (error) alert("Could not update project: " + error.message);
  return !error;
}
async function deleteShowcaseProject(id) {
  const { error } = await sb.from("showcase_projects").delete().eq("id", id);
  if (error) alert("Could not delete project: " + error.message);
  return !error;
}

/* ---------------------- media upload (Supabase Storage) ---------------------- */
async function uploadMedia(file, folder) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, file);
  if (error) { alert("Upload failed: " + error.message); return null; }
  const { data } = sb.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
async function deleteMediaByUrl(url) {
  try {
    const marker = "/object/public/media/";
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    await sb.storage.from("media").remove([path]);
  } catch (e) { console.error("Could not remove stored file:", e); }
}

/* ---------------------- sidebar shell ---------------------- */
const NAV_ITEMS = [
  { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>' },
  { id: "staff", href: "staff.html", label: "Staff Records", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20C2.5 16 5.5 14 9 14C12.5 14 15.5 16 15.5 20"/><circle cx="17" cy="8" r="2.6"/><path d="M15 14.3C18 14.6 20.5 16.5 20.5 20"/></svg>' },
  { id: "projects", href: "projects.html", label: "Projects & Services", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V5.5C8 4.7 8.7 4 9.5 4H14.5C15.3 4 16 4.7 16 5.5V7"/></svg>' },
  { id: "sales", href: "sales.html", label: "Sales & Receipts", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12C3 12 6 6 12 6C18 6 21 12 21 12C21 12 18 18 12 18C6 18 3 12 3 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>' },
  { id: "expenses", href: "expenses.html", label: "Expenses", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8H16M8 12H16M8 16H12"/></svg>' },
  { id: "showcase", href: "showcase.html", label: "Project Showcase", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="14" rx="1.5"/><path d="M3 15L8.5 10L13 13.5L21 7"/><circle cx="7.5" cy="8.5" r="1.2"/></svg>' },
  { id: "gallery", href: "gallery.html", label: "Gallery", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.2"/><rect x="13" y="3" width="8" height="8" rx="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.2"/><rect x="13" y="13" width="8" height="8" rx="1.2"/></svg>' },
  { id: "reports", href: "reports.html", label: "Reports", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M12 20V4M20 20V14"/></svg>' },
  { id: "access", href: "access.html", label: "Manage Access", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>' },
  { id: "settings", href: "settings.html", label: "Settings", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' },
];

function renderShell(activeId, company, userLabel) {
  company = company || DEFAULT_COMPANY;
  const navHtml = NAV_ITEMS.map((n) => `<a href="${n.href}" class="${n.id === activeId ? "active" : ""}">${n.icon}${n.label}</a>`).join("");
  document.getElementById("app-shell").innerHTML = `
    <div class="scrim" id="scrim"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-head">
        <div class="sidebar-badge"><img src="../assets/logo.png" alt="logo"></div>
        <div><div class="co-name">${esc(company.name)}</div><div class="co-rc">RC ${esc(company.rc)}</div></div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-foot">
        ${userLabel ? `<div style="font-size:11.5px;color:#94a3b8;padding:0 4px 10px;">Signed in as<br><b style="color:#63c060;">${esc(userLabel)}</b></div>` : ""}
        <button class="logout-btn" id="logoutBtn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg> Log Out</button>
      </div>
    </aside>
    <div class="main-col">
      <div class="topbar">
        <button id="menuBtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <strong style="font-size:14px;">${NAV_ITEMS.find((n) => n.id === activeId)?.label || ""}</strong>
      </div>
      <div class="content" id="page-content"><div style="padding:40px;color:#94a3b8;">Loading…</div></div>
    </div>
  `;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => { sidebar.classList.add("open"); scrim.classList.add("open"); });
    scrim.addEventListener("click", () => { sidebar.classList.remove("open"); scrim.classList.remove("open"); });
  }
}

/* ---------------------- generic modal ---------------------- */
function openModal(title, bodyHtml, wide) {
  const wrap = document.createElement("div");
  wrap.className = "modal-scrim";
  wrap.id = "activeModal";
  wrap.innerHTML = `
    <div class="modal-box ${wide ? "wide" : ""}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" id="modalCloseBtn">&times;</button></div>
      <div class="modal-body">${bodyHtml}</div>
    </div>`;
  document.body.appendChild(wrap);
  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
  wrap.addEventListener("click", (e) => { if (e.target === wrap) closeModal(); });
  return wrap;
}
function closeModal() {
  const m = document.getElementById("activeModal");
  if (m) m.remove();
}
function emptyStateHtml(iconSvg, text) {
  return `<div class="empty-state">${iconSvg}<p>${esc(text)}</p></div>`;
}
