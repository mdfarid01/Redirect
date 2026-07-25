const form = document.getElementById("stepTwoForm");
const errorText = document.getElementById("errorText");

const name = sessionStorage.getItem("feedback-name") || "";
const email = sessionStorage.getItem("feedback-email") || "";
const sourceUrl = getStoredSourceUrl();

form.name.value = name;
form.email.value = email;

function validPhone(phone) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return /^\+?[1-9]\d{7,14}$/.test(normalized);
}

if (!name || !email) {
  window.location.href = "/";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorText.textContent = "";

  const phone = form.phone.value.trim();
  if (!validPhone(phone)) {
    errorText.textContent = "Please enter a valid international phone number.";
    return;
  }

  try {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        phone,
        source_url: sourceUrl
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit demo details.");
    }

    sessionStorage.removeItem("feedback-name");
    sessionStorage.removeItem("feedback-email");
    sessionStorage.removeItem("feedback-source-url");
    window.location.href = "/thank-you.html";
  } catch (error) {
    errorText.textContent = error.message;
  }
});
