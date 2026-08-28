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
    document.getElementById("loginError").textContent = "Your access has been deactivated. Contact a Director.";
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

    const { data: profile } = await sb.from("profiles").select("is_active").eq("id", data.user.id).single();
    if (!profile || profile.is_active === false) {
      await sb.auth.signOut();
      errorBox.textContent = "Your access has been deactivated. Contact a Director.";
      btn.disabled = false; btn.textContent = "Sign In";
      return;
    }

    window.location.href = "dashboard.html";
  });
})();
