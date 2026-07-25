const form = document.getElementById("stepTwoForm");
const errorText = document.getElementById("errorText");

const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "";
const email = params.get("email") || "";
const sourceUrl = params.get("sourceUrl") || "";

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
        source_url: sourceUrl || document.referrer || ""
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit demo details.");
    }

    window.location.href = "/thank-you.html";
  } catch (error) {
    errorText.textContent = error.message;
  }
});
