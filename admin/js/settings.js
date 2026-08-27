requireAuth();
renderShell("settings");

let company = getLS(LS.company, DEFAULT_COMPANY);
let creds = getLS(LS.auth, DEFAULT_AUTH);

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
      <h3>🔒 Change Login Password</h3>
      <form id="pwForm">
        <div class="form-field"><label>Current Password</label><input id="p_current" type="password"></div>
        <div class="form-row-2">
          <div class="form-field"><label>New Password</label><input id="p_next" type="password"></div>
          <div class="form-field"><label>Confirm New Password</label><input id="p_confirm" type="password"></div>
        </div>
        <div class="form-msg" id="pwMsg" style="display:none;"></div>
        <button type="submit" class="btn-save">Update Password</button>
      </form>
      <div class="note-line"><span>🛡️</span><span>This is a simple access gate for this internal tool, not enterprise-grade authentication. Data is saved in this browser's local storage only.</span></div>
    </div>

    <div class="settings-card danger">
      <h3>⚠️ Danger Zone</h3>
      <p style="font-size:13.5px;color:#64748b;margin-bottom:16px;">Permanently erase all staff, project, sales and expense records saved in this browser. This cannot be undone.</p>
      <button class="btn-danger" id="resetBtn">Reset All Data</button>
    </div>
  `;

  document.getElementById("companyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    company = {
      name: document.getElementById("c_name").value.trim(),
      rc: document.getElementById("c_rc").value.trim(),
      address: document.getElementById("c_address").value.trim(),
      email: document.getElementById("c_email").value.trim(),
      phone: document.getElementById("c_phone").value.trim(),
    };
    setLS(LS.company, company);
    const msg = document.getElementById("companyMsg");
    msg.textContent = "Company details saved."; msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 2500);
  });

  document.getElementById("pwForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const current = document.getElementById("p_current").value;
    const next = document.getElementById("p_next").value;
    const confirmVal = document.getElementById("p_confirm").value;
    const msg = document.getElementById("pwMsg");
    msg.style.display = "block";
    if (current !== creds.password) { msg.className = "form-msg err"; msg.textContent = "Current password is incorrect."; return; }
    if (next.length < 4) { msg.className = "form-msg err"; msg.textContent = "New password must be at least 4 characters."; return; }
    if (next !== confirmVal) { msg.className = "form-msg err"; msg.textContent = "New passwords do not match."; return; }
    creds = { ...creds, password: next };
    setLS(LS.auth, creds);
    msg.className = "form-msg ok"; msg.textContent = "Password updated successfully.";
    document.getElementById("pwForm").reset();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("This will permanently erase ALL staff, project, sales and expense records saved in this browser. Continue?")) return;
    setLS(LS.staff, []);
    setLS(LS.projects, []);
    setLS(LS.sales, []);
    setLS(LS.expenses, []);
    alert("All records have been cleared.");
    window.location.href = "dashboard.html";
  });
}

render();
