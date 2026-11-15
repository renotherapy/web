const menuButton = document.querySelector("[data-menu-button]");
const mobileNavigation = document.querySelector("[data-mobile-navigation]");
const form = document.querySelector("[data-estimate-form]");
const formMessage = document.querySelector("[data-form-message]");
const year = document.querySelector("[data-current-year]");
const serviceSelect = document.querySelector("#service");

if (year) year.textContent = new Date().getFullYear();

const requestedService = new URLSearchParams(window.location.search).get("service");
if (serviceSelect && requestedService) {
  const matchingOption = [...serviceSelect.options].find((option) => option.text === requestedService);
  if (matchingOption) serviceSelect.value = matchingOption.value;
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mobileNavigation?.classList.toggle("nav-open", !isOpen);
});

mobileNavigation?.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  menuButton?.setAttribute("aria-expanded", "false");
  mobileNavigation.classList.remove("nav-open");
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const subject = `Renovation enquiry — ${data.get("service")}`;
  const body = [
    `Name: ${data.get("name")}`,
    `Email: ${data.get("email")}`,
    `Phone: ${data.get("phone") || "Not provided"}`,
    `Service: ${data.get("service")}`,
    "",
    "Project details:",
    data.get("details"),
  ].join("\n");

  formMessage?.classList.add("form-message-visible");
  window.location.href = `mailto:info@renotherapy.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
