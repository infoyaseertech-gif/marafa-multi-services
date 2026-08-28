let profiles = [];
let currentUserId = null;

function addLoginFormHtml() {
  return `
    <form id="addLoginForm">
      <div class="form-field"><label>Full Name</label><input id="f_fullname" required></div>
      <div class="form-field"><label>Email</label><input id="f_email" type="email" required></div>
      <div class="form-field"><label>Temporary Password</label><input id="f_password" type="password" required minlength="6" placeholder="At least 6 characters"></div>
      <div class="form-msg err" id="addLoginMsg" style="display:none;"></div>
      <div class="form-actions"><button type="button" class="btn-cancel" id="cancelBtn">Cancel</button><button type="submit" class="btn-save">Create Login</button></div>
      <p style="font-size:12px;color:#94a3b8;margin-top:14px;line-height:1.5;">
        Share this temporary password with them directly (e.g. in person or via a private message) and ask them to change it under Settings after their first login.
        If your Supabase project still requires email confirmation, they'll also need to click a confirmation link sent to their inbox before they can sign in.
      </p>
    </form>`;
}

function openAddLoginModal() {
  const modal = openModal("Create Staff Login", addLoginFormHtml());
  modal.querySelector("#cancelBtn").addEventListener("click", closeModal);
  modal.querySelector("#addLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = modal.querySelector("#f_fullname").value.trim();
    const email = modal.querySelector("#f_email").value.trim();
    const password = modal.querySelector("#f_password").value;
    const msg = modal.querySelector("#addLoginMsg");
    msg.style.display = "none";

    // Use a throwaway client so this signUp doesn't hijack the current session
    const auxClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await auxClient.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) { msg.style.display = "block"; msg.textContent = error.message; return; }
    if (!data.user) { msg.style.display = "block"; msg.textContent = "Could not create the account. Please try again."; return; }

    const { error: profileError } = await sb.from("profiles").insert({ id: data.user.id, full_name: fullName, email, is_active: true });
    if (profileError) { msg.style.display = "block"; msg.textContent = "Login created, but profile save failed: " + profileError.message; return; }

    closeModal();
    load();
  });
}

function render() {
  const rows = profiles.length
    ? `<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Added</th><th>Access</th><th></th></tr></thead><tbody>
        ${profiles.map((p) => `
          <tr>
            <td class="cell-strong">${esc(p.full_name) || "—"}</td>
            <td>${esc(p.email)}</td>
            <td class="cell-sub">${p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
            <td><span class="badge ${p.is_active ? "badge-green" : "badge-slate"}">${p.is_active ? "Active" : "Deactivated"}</span></td>
            <td>${p.id === currentUserId
              ? '<span class="cell-sub">This is you</span>'
              : `<button class="btn-outline-sm" data-toggle="${p.id}" data-active="${p.is_active}">${p.is_active ? "Deactivate" : "Reactivate"}</button>`}</td>
          </tr>`).join("")}
      </tbody></table>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="10" width="16" height="10" rx="1.5"/></svg>', "No staff logins yet.");

  document.getElementById("page-content").innerHTML = `
    <div class="toolbar">
      <h1 class="page-title" style="margin:0;">Manage Access</h1>
      <div class="toolbar-actions">
        <button class="btn-add" id="addBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Create Staff Login</button>
      </div>
    </div>
    <p style="font-size:13px;color:#64748b;margin:-10px 0 16px;">Anyone with an active login here has full access to add, edit and remove staff records, projects, sales and expenses. Deactivating someone here blocks their access immediately without deleting their history.</p>
    <div class="table-card">${rows}</div>
  `;
  document.getElementById("addBtn").addEventListener("click", openAddLoginModal);
  document.querySelectorAll("[data-toggle]").forEach((btn) => btn.addEventListener("click", async () => {
    const willBeActive = btn.dataset.active !== "true";
    const person = profiles.find((p) => p.id === btn.dataset.toggle);
    const verb = willBeActive ? "reactivate" : "deactivate";
    if (!confirm(`Are you sure you want to ${verb} access for ${person.full_name || person.email}?`)) return;
    await setProfileActive(person.id, willBeActive);
    load();
  }));
}

async function load() { profiles = await getProfiles(); render(); }

(async function init() {
  const { user, profile } = await requireAuth();
  currentUserId = user.id;
  const company = await getCompany();
  renderShell("access", company, profile.full_name || profile.email);
  await load();
})();
