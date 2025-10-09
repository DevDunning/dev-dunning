// ============================
// ADMIN CONTROL
// ============================
const ADMIN_PASSWORD = "Diesel!"; // <--- change this anytime
let isAdmin = false;

const loginBtn = document.getElementById("admin-login");
const adminControls = document.getElementById("admin-controls");
const logoutBtn = document.getElementById("logout");
const votingAdminControls = document.getElementById("voting-admin-controls");

// Handle admin login
loginBtn.addEventListener("click", () => {
  const pass = prompt("Enter admin password:");
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    adminControls.classList.remove("hidden");
    votingAdminControls?.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    alert("Admin logged in!");
  } else {
    alert("Incorrect password!");
  }
});

// Handle admin logout
logoutBtn.addEventListener("click", () => {
  isAdmin = false;
  adminControls.classList.add("hidden");
  votingAdminControls?.classList.add("hidden");
  loginBtn.classList.remove("hidden");
  alert("Logged out.");
});

// ============================
// UPDATES SYSTEM
// ============================
const updateList = document.getElementById("update-list");
const newUpdate = document.getElementById("new-update");
const postBtn = document.getElementById("post-update");
let updates = JSON.parse(localStorage.getItem("updates")) || [];

function renderUpdates() {
  if (!updateList) return;
  updateList.innerHTML = updates.map(u => `<li>${u}</li>`).join("");
}

postBtn?.addEventListener("click", () => {
  if (!isAdmin) {
    alert("Admin only. Please log in.");
    return;
  }

  const text = newUpdate.value.trim();
  if (!text) return alert("Please enter an update before posting.");

  updates.unshift(`🕒 ${new Date().toLocaleString()} — ${text}`);
  localStorage.setItem("updates", JSON.stringify(updates));
  newUpdate.value = "";
  renderUpdates();
});

renderUpdates();

// ============================
// VOTING SYSTEM (Live + Persistent)
// ============================

// Load saved voting data or default
let votingData = JSON.parse(localStorage.getItem("votingData")) || {
  question: "What should we build next?",
  options: ["New dashboard", "Token tracker"],
  votes: {}
};

// Ensure votes object matches options
votingData.options.forEach(opt => {
  if (!votingData.votes[opt]) votingData.votes[opt] = 0;
});

function renderVoting() {
  const titleEl = document.getElementById("voting-title");
  const pollContainer = document.getElementById("poll");
  if (!titleEl || !pollContainer) return;

  titleEl.textContent = "🗳 " + votingData.question;
  pollContainer.innerHTML = "";

  const totalVotes = Object.values(votingData.votes).reduce((a, b) => a + b, 0) || 1;

  votingData.options.forEach(opt => {
    const count = votingData.votes[opt] || 0;
    const percent = ((count / totalVotes) * 100).toFixed(1);

    const btn = document.createElement("button");
    btn.textContent = `${opt} — ${count} votes (${percent}%)`;
    btn.className = "vote-btn";
    btn.addEventListener("click", () => {
      votingData.votes[opt]++;
      localStorage.setItem("votingData", JSON.stringify(votingData));
      renderVoting();
    });

    // Visual bar to show percentage
    const bar = document.createElement("div");
    bar.style.height = "6px";
    bar.style.width = percent + "%";
    bar.style.background = "linear-gradient(90deg, var(--accent), var(--primary))";
    bar.style.marginTop = "4px";
    bar.style.borderRadius = "3px";

    const wrapper = document.createElement("div");
    wrapper.appendChild(btn);
    wrapper.appendChild(bar);
    pollContainer.appendChild(wrapper);
  });
}

renderVoting();

// Admin adds new voting question and options dynamically
document.getElementById("update-vote-btn")?.addEventListener("click", () => {
  if (!isAdmin) {
    alert("Admin only. Please log in.");
    return;
  }

  const newQuestion = document.getElementById("new-question").value.trim();
  const optionsText = document.getElementById("new-options").value.trim();

  if (!newQuestion || !optionsText) {
    alert("Please enter a question and options (comma-separated).");
    return;
  }

  const options = optionsText.split(",").map(o => o.trim()).filter(Boolean);

  votingData = {
    question: newQuestion,
    options,
    votes: {}
  };
  options.forEach(opt => votingData.votes[opt] = 0);

  localStorage.setItem("votingData", JSON.stringify(votingData));
  renderVoting();

  document.getElementById("new-question").value = "";
  document.getElementById("new-options").value = "";
  alert("Voting updated!");
});

// ============================
// SCROLL FADE-IN EFFECT
// ============================
const faders = document.querySelectorAll(".fade-in");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
});
faders.forEach(fader => observer.observe(fader));
