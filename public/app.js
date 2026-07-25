const form = document.getElementById("stepOneForm");
const errorText = document.getElementById("errorText");

const landingSourceUrl = getLandingSourceUrl();

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorText.textContent = "";

  const name = form.fullName.value.trim();
  const email = form.email.value.trim();

  if (name.length < 2) {
    errorText.textContent = "Please enter your full name.";
    return;
  }
  if (!validEmail(email)) {
    errorText.textContent = "Please enter a valid email address.";
    return;
  }

  // Keep submitted details out of the address bar, browser history, and referrer.
  sessionStorage.setItem("feedback-name", name);
  sessionStorage.setItem("feedback-email", email);
  window.location.href = "/phone.html";
});
