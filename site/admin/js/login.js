const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function configIsMissing() {
  return !SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR") || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("PASTE_YOUR");
}

(async function init() {
  if (configIsMissing()) {
    document.querySelector(".login-box").innerHTML = `
      <p style="color:#e11d48;font-size:14px;line-height:1.6;">
        <b>Supabase not connected yet.</b><br>Open <code>admin/js/supabase-config.js</code>
        and paste in your Project URL and anon key. See <code>database/schema.sql</code> for setup steps.
      </p>`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("deactivated") === "1") {
    document.getElementById("loginError").textContent = "Your access has been deactivated by a Director. Contact them if this seems wrong.";
  } else if (params.get("noprofile") === "1") {
    document.getElementById("loginError").textContent = "No staff profile is linked to this account yet. Ask a Director to check Manage Access, or see database/schema.sql.";
  }

  const { data: { session } } = await sb.auth.getSession();
  if (session) window.location.href = "dashboard.html";

  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("loginError");
    const btn = document.getElementById("submitBtn");
    errorBox.textContent = "";
    btn.disabled = true; btn.textContent = "Signing in…";

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      errorBox.textContent = error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message;
      btn.disabled = false; btn.textContent = "Sign In";
      return;
    }

    const { data: profile, error: profileError } = await sb.from("profiles").select("is_active").eq("id", data.user.id).single();
    if (profileError || !profile) {
      await sb.auth.signOut();
      errorBox.textContent = "No staff profile is linked to this account yet. Ask a Director to check Manage Access, or see database/schema.sql.";
      btn.disabled = false; btn.textContent = "Sign In";
      return;
    }
    if (profile.is_active === false) {
      await sb.auth.signOut();
      errorBox.textContent = "Your access has been deactivated by a Director. Contact them if this seems wrong.";
      btn.disabled = false; btn.textContent = "Sign In";
      return;
    }

    window.location.href = "dashboard.html";
  });

  /* ---- Forgot password ---- */
  const loginForm = document.getElementById("loginForm");
  const resetForm = document.getElementById("resetForm");
  document.getElementById("forgotLink").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    resetForm.style.display = "block";
    document.getElementById("resetEmail").value = document.getElementById("email").value;
  });
  document.getElementById("backToLoginLink").addEventListener("click", (e) => {
    e.preventDefault();
    resetForm.style.display = "none";
    loginForm.style.display = "block";
  });
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();
    const errorBox = document.getElementById("resetError");
    const successBox = document.getElementById("resetSuccess");
    const btn = document.getElementById("resetBtn");
    errorBox.textContent = "";
    successBox.style.display = "none";
    if (!email) { errorBox.textContent = "Enter your email first."; return; }
    btn.disabled = true; btn.textContent = "Sending…";

    const redirectTo = window.location.href.replace(/login\.html.*$/, "reset-password.html");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    btn.disabled = false; btn.textContent = "Send Reset Link";
    if (error) { errorBox.textContent = error.message; return; }
    successBox.style.display = "flex";
  });
})();
