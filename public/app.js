const backdrop = document.getElementById("signupBackdrop");
const emailStep = document.getElementById("emailStep");
const phoneStep = document.getElementById("phoneStep");
const successStep = document.getElementById("successStep");
const emailForm = document.getElementById("emailForm");
const phoneForm = document.getElementById("phoneForm");
const emailError = document.getElementById("emailError");
const phoneError = document.getElementById("phoneError");
let subscriberEmail = "";

getLandingSourceUrl();

function openSignup() { backdrop.hidden = false; document.getElementById("email").focus(); }
function closeSignup() { backdrop.hidden = true; }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validPhone(phone) { return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/[^\d+]/g, "")); }
function showSuccess(phone) {
  emailStep.hidden = true;
  phoneStep.hidden = true;
  document.getElementById("submittedPhone").textContent = `We're now calling your phone: ${phone}`;
  successStep.hidden = false;
}

setTimeout(openSignup, 200);
document.querySelectorAll("[data-open-signup]").forEach((button) => button.addEventListener("click", openSignup));
document.querySelectorAll("[data-close-signup]").forEach((button) => button.addEventListener("click", closeSignup));

emailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  subscriberEmail = emailForm.email.value.trim();
  if (!validEmail(subscriberEmail)) { emailError.textContent = "Please enter a valid email address."; return; }
  emailError.textContent = "";
  emailStep.hidden = true;
  phoneStep.hidden = false;
  phoneForm.phone.focus();
});

async function saveSubscription(phone) {
  const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: subscriberEmail, phone, source_url: getStoredSourceUrl() }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save your subscription.");
  showSuccess(phone);
}

phoneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const phone = phoneForm.phone.value.trim();
  if (!validPhone(phone)) { phoneError.textContent = "Please enter a valid international phone number."; return; }
  phoneError.textContent = "";
  try { await saveSubscription(phone); } catch (error) { phoneError.textContent = error.message; }
});
