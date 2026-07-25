const rows = document.getElementById("rows");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPassword");
const loginError = document.getElementById("loginError");
const adminContent = document.getElementById("adminContent");

const storageKey = "secure-access-demo-admin-password";
let adminPassword = window.localStorage.getItem(storageKey) || "";

function safe(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTable(data) {
  rows.innerHTML = data
    .map(
      (entry) => `
      <tr>
        <td>${safe(entry.name)}</td>
        <td>${safe(entry.email)}</td>
        <td>${safe(entry.phone)}</td>
        <td>${safe(entry.source_url || entry.referrer)}</td>
        <td>${safe(new Date(entry.created_at).toLocaleString())}</td>
      </tr>
    `
    )
    .join("");
}

async function loadSubmissions() {
  const response = await fetch("/api/submissions-list", {
    headers: {
      "x-admin-password": adminPassword
    }
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid admin password.");
    }
    throw new Error("Unable to load submissions.");
  }
  const data = await response.json();
  renderTable(data);
}

async function refresh() {
  try {
    await loadSubmissions();
    loginError.textContent = "";
    adminContent.hidden = false;
  } catch (error) {
    adminContent.hidden = true;
    loginError.textContent = error.message;
  }
}

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  adminPassword = adminPasswordInput.value.trim();
  window.localStorage.setItem(storageKey, adminPassword);
  refresh();
});

if (adminPassword) {
  adminPasswordInput.value = adminPassword;
  refresh();
}

setInterval(() => {
  if (adminPassword) {
    refresh();
  }
}, 5000);
