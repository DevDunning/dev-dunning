document.addEventListener("DOMContentLoaded", () => {
  // ====== THEME TOGGLE ======
  const toggle = document.getElementById("theme-toggle");

  // Load saved theme preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    toggle.textContent = "☀️";
  } else {
    toggle.textContent = "🌙";
  }

  // Toggle theme on click
  toggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    toggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});