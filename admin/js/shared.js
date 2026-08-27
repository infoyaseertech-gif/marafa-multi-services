/* ===================================================================== */
/*  Marafa Multi-Services — Internal Ops Tool — shared.js                */
/*  Storage: browser localStorage (per-device). Login: front-end gate.   */
/* ===================================================================== */

const LS = {
  auth: "marafa_auth_v1",
  company: "marafa_company_v1",
  staff: "marafa_staff_v1",
  projects: "marafa_projects_v1",
  sales: "marafa_sales_v1",
  expenses: "marafa_expenses_v1",
};
const SESSION_KEY = "marafa_session_v1";

const DEFAULT_AUTH = { username: "admin", password: "marafa2026" };
const DEFAULT_COMPANY = {
  name: "Marafa Multi-Services Limited",
  rc: "9797637",
  address: "14, Kakaki Road, Unguwar Rimi, off Bamako Road, Kaduna, Kaduna State, Nigeria",
  email: "marafa123419@gmail.com",
  phone: "+234 810 920 2315",
};
const DEFAULT_STAFF = [
  { id: 1, name: "Lawali Ibrahim Marafa", role: "Director", department: "Management", phone: "+234 810 920 2315", email: "marafa123419@gmail.com", joined: "2026-08-24", status: "Active" },
  { id: 2, name: "Aisha Muhammad Ibrahim", role: "Director", department: "Management", phone: "+234 813 590 2072", email: "aishaibrahimmuhammad902@gmail.com", joined: "2026-08-24", status: "Active" },
];

const SERVICE_CATEGORIES = [
  "General Merchandise, Procurement & Supplies", "Import & Export", "Trading & Distribution",
  "Equipment & Machinery Supply", "Construction & Civil Engineering", "Real Estate & Property Services",
  "General Contracting", "Transportation & Logistics", "Automobile Sales & Services",
  "Mining & Solid Minerals", "Agricultural & Agro-Allied Activities", "Livestock & Food Processing",
  "Telecommunications & ICT", "Consultancy & Business Support",
];
const DEPARTMENTS = ["Management", "Operations", "Finance & Admin", "Field / Technical", "Logistics", "Sales & Business Development"];
const EXPENSE_CATEGORIES = ["Materials & Supplies", "Transport & Logistics", "Salaries & Wages", "Utilities", "Rent", "Equipment", "Marketing", "Professional Fees", "Miscellaneous"];

/* ---------------------- storage helpers ---------------------- */
function getLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Read failed for", key, e);
    return fallback;
  }
}
function setLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Save failed for", key, e);
    alert("Could not save data. Your browser storage may be full or disabled (private/incognito mode can block this).");
    return false;
  }
}
function ensureSeed() {
  if (localStorage.getItem(LS.auth) === null) setLS(LS.auth, DEFAULT_AUTH);
  if (localStorage.getItem(LS.company) === null) setLS(LS.company, DEFAULT_COMPANY);
  if (localStorage.getItem(LS.staff) === null) setLS(LS.staff, DEFAULT_STAFF);
  if (localStorage.getItem(LS.projects) === null) setLS(LS.projects, []);
  if (localStorage.getItem(LS.sales) === null) setLS(LS.sales, []);
  if (localStorage.getItem(LS.expenses) === null) setLS(LS.expenses, []);
}

/* ---------------------- auth ---------------------- */
function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
function requireAuth() {
  ensureSeed();
  if (!isLoggedIn()) window.location.href = "login.html";
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

/* ---------------------- formatting ---------------------- */
function fmtNaira(n) {
  const num = Number(n) || 0;
  return "\u20A6" + num.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}
function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function badgeClass(status) {
  const map = { Planned: "badge-slate", Ongoing: "badge-amber", Completed: "badge-green", Paid: "badge-green", Pending: "badge-amber", Active: "badge-green", Inactive: "badge-slate" };
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

/* ---------------------- sidebar ---------------------- */
const NAV_ITEMS = [
  { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>' },
  { id: "staff", href: "staff.html", label: "Staff Records", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20C2.5 16 5.5 14 9 14C12.5 14 15.5 16 15.5 20"/><circle cx="17" cy="8" r="2.6"/><path d="M15 14.3C18 14.6 20.5 16.5 20.5 20"/></svg>' },
  { id: "projects", href: "projects.html", label: "Projects & Services", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V5.5C8 4.7 8.7 4 9.5 4H14.5C15.3 4 16 4.7 16 5.5V7"/></svg>' },
  { id: "sales", href: "sales.html", label: "Sales", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12C3 12 6 6 12 6C18 6 21 12 21 12C21 12 18 18 12 18C6 18 3 12 3 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>' },
  { id: "expenses", href: "expenses.html", label: "Expenses", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8H16M8 12H16M8 16H12"/></svg>' },
  { id: "reports", href: "reports.html", label: "Reports", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M12 20V4M20 20V14"/></svg>' },
  { id: "settings", href: "settings.html", label: "Settings", icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>' },
];

function renderShell(activeId) {
  const company = getLS(LS.company, DEFAULT_COMPANY);
  const navHtml = NAV_ITEMS.map((n) => `<a href="${n.href}" class="${n.id === activeId ? "active" : ""}">${n.icon}${n.label}</a>`).join("");
  document.getElementById("app-shell").innerHTML = `
    <div class="scrim" id="scrim"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-head">
        <div class="sidebar-badge">M</div>
        <div><div class="co-name">${esc(company.name)}</div><div class="co-rc">RC ${esc(company.rc)}</div></div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-foot"><button class="logout-btn" id="logoutBtn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg> Log Out</button></div>
    </aside>
    <div class="main-col">
      <div class="topbar">
        <button id="menuBtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <strong style="font-size:14px;">${NAV_ITEMS.find((n) => n.id === activeId)?.label || ""}</strong>
      </div>
      <div class="content" id="page-content"></div>
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
