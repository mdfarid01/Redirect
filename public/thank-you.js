const confirmation = document.getElementById("phoneConfirmation");
const phone = sessionStorage.getItem("feedback-phone-confirmation");

if (phone) {
  confirmation.textContent = `Please Answer: ${phone}`;
  sessionStorage.removeItem("feedback-phone-confirmation");
} else {
  confirmation.hidden = true;
}
