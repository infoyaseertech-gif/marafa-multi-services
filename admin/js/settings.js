let company = {};
let currentUser = null;

function render() {
  document.getElementById("page-content").innerHTML = `
    <h1 class="page-title">Settings</h1>

    <div class="settings-card">
      <h3>🏢 Company Information</h3>
      <form id="companyForm">
        <div class="form-field"><label>Company Name</label><input id="c_name" value="${esc(company.name)}"></div>
        <div class="form-field"><label>RC Number</label><input id="c_rc" value="${esc(company.rc)}"></div>
        <div class="form-field"><label>Address</label><input id="c_address" value="${esc(company.address)}"></div>
        <div class="form-row-2">
          <div class="form-field"><label>Email</label><input id="c_email" value="${esc(company.email)}"></div>
          <div class="form-field"><label>Phone</label><input id="c_phone" value="${esc(company.phone)}"></div>
        </div>
        <div class="form-msg ok" id="companyMsg" style="display:none;"></div>
        <button type="submit" class="btn-save">Save Company Info</button>
      </form>
    </div>

    <div class="settings-card">
      <h3>🔒 Change My Password</h3>
      <p style="font-size:12.5px;color:#94a3b8;margin-top:-10px;">Signed in as ${esc(currentUser.email)}</p>
      <form id="pwForm">
        <div class="form-field"><label>Current Password</label><input id="p_current" type="password" required></div>
        <div class="form-row-2">
          <div class="form-field"><label>New Password</label><input id="p_next" type="password" required></div>
          <div class="form-field"><label>Confirm New Password</label><input id="p_confirm" type="password" required></div>
        </div>
        <div class="form-msg" id="pwMsg" style="display:none;"></div>
        <button type="submit" class="btn-save">Update Password</button>
      </form>
      <div class="note-line"><span>🛡️</span><span>Your account is secured by Supabase Auth. Data is stored online and shared with every staff member who has an active login.</span></div>
    </div>

    <div class="settings-card danger">
      <h3>⚠️ Danger Zone</h3>
      <p style="font-size:13.5px;color:#64748b;margin-bottom:16px;">Permanently erase all staff, project, sales and expense records for the whole company. This cannot be undone and affects every staff member.</p>
      <button class="btn-danger" id="resetBtn">Reset All Data</button>
    </div>
  `;

  document.getElementById("companyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const patch = {
      name: document.getElementById("c_name").value.trim(),
      rc: document.getElementById("c_rc").value.trim(),
      address: document.getElementById("c_address").value.trim(),
      email: document.getElementById("c_email").value.trim(),
      phone: document.getElementById("c_phone").value.trim(),
    };
    const ok = await updateCompany(patch);
    const msg = document.getElementById("companyMsg");
    if (ok) { company = { ...company, ...patch }; msg.className = "form-msg ok"; msg.textContent = "Company details saved."; msg.style.display = "block"; setTimeout(() => (msg.style.display = "none"), 2500); }
  });

  document.getElementById("pwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const current = document.getElementById("p_current").value;
    const next = document.getElementById("p_next").value;
    const confirmVal = document.getElementById("p_confirm").value;
    const msg = document.getElementById("pwMsg");
    msg.style.display = "block";
    if (next.length < 6) { msg.className = "form-msg err"; msg.textContent = "New password must be at least 6 characters."; return; }
    if (next !== confirmVal) { msg.className = "form-msg err"; msg.textContent = "New passwords do not match."; return; }

    const { error: verifyError } = await sb.auth.signInWithPassword({ email: currentUser.email, password: current });
    if (verifyError) { msg.className = "form-msg err"; msg.textContent = "Current password is incorrect."; return; }

    const { error } = await sb.auth.updateUser({ password: next });
    if (error) { msg.className = "form-msg err"; msg.textContent = error.message; return; }
    msg.className = "form-msg ok"; msg.textContent = "Password updated successfully.";
    document.getElementById("pwForm").reset();
  });

  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("This will permanently erase ALL staff, project, sales and expense records for the entire company. Continue?")) return;
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    await Promise.all([
      sb.from("staff").delete().gt("id", 0),
      sb.from("projects").delete().gt("id", 0),
      sb.from("sales").delete().gt("id", 0),
      sb.from("expenses").delete().gt("id", 0),
    ]);
    alert("All records have been cleared.");
    window.location.href = "dashboard.html";
  });
}

(async function init() {
  const { user, profile } = await requireAuth();
  currentUser = user;
  company = await getCompany();
  renderShell("settings", company, profile.full_name || profile.email);
  render();
})();
