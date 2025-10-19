document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // THEME TOGGLE
  // ============================
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

  // ============================
  // FIREBASE SETUP
  // ============================
  const firebaseConfig = {
  apiKey: "AIzaSyBs5KhK2wLU_lSiqg_rgw0HhzKW8VMVIHk",
  authDomain: "dd-voting.firebaseapp.com",
  projectId: "dd-voting",
  storageBucket: "dd-voting.firebasestorage.app",
  messagingSenderId: "476144697593",
  appId: "1:476144697593:web:2bd45a5c554279e4046228"
};

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ============================
  // POLL LOGIC
  // ============================
  const form = document.getElementById("poll-form");
  const resultsDiv = document.getElementById("results");
  const resultsDisplay = document.getElementById("results-display");

  // Track if user already voted
  const hasVoted = localStorage.getItem("voted");

  if (hasVoted) {
    form.style.display = "none";
    resultsDiv.classList.remove("hidden");
  }

  // Handle vote submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const choice = form.vote.value;

    if (!choice) return alert("Please select an option!");

    try {
      await db.collection("votes").add({ choice });
      localStorage.setItem("voted", "true");

      form.style.display = "none";
      resultsDiv.classList.remove("hidden");
    } catch (error) {
      console.error("Error saving vote:", error);
    }
  });

  // ============================
  // LIVE RESULTS (auto-updating)
  // ============================
  db.collection("votes").onSnapshot((snapshot) => {
    const counts = { option1: 0, option2: 0, option3: 0 };

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (counts[data.choice] !== undefined) {
        counts[data.choice]++;
      }
    });

    resultsDisplay.innerHTML = `
      <p><strong>Expand Marketing:</strong> ${counts.option1}</p>
      <p><strong>Increase Burn Rate:</strong> ${counts.option2}</p>
      <p><strong>Focus on AI Integration:</strong> ${counts.option3}</p>
    `;
  });
});
