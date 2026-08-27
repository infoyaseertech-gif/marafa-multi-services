ensureSeed();
if (isLoggedIn()) window.location.href = "dashboard.html";

const company = getLS(LS.company, DEFAULT_COMPANY);
document.getElementById("companyNameLabel").textContent = company.name.toUpperCase();

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const creds = getLS(LS.auth, DEFAULT_AUTH);
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("loginError");
  if (username === creds.username && password === creds.password) {
    sessionStorage.setItem(SESSION_KEY, "1");
    window.location.href = "dashboard.html";
  } else {
    errorBox.textContent = "Incorrect username or password.";
  }
});
