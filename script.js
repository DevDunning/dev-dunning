// script.js (replace entire file with this)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // THEME TOGGLE (unchanged)
  const toggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    toggle.textContent = "☀️";
  } else {
    toggle.textContent = "🌙";
  }
  toggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    toggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // FIREBASE CONFIG (make sure these match your Firebase project)
  const firebaseConfig = {
    apiKey: "AIzaSyBs5KhK2wLU_lSiqg_rgw0HhzKW8VMVIHk",
    authDomain: "dd-voting.firebaseapp.com",
    projectId: "dd-voting",
  };

  // Initialize Firebase + Firestore
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // DOM elements
  const form = document.getElementById("poll-form");
  const resultsDiv = document.getElementById("results");
  const resultsDisplay = document.getElementById("results-display");

  // Unique local voter id and one-vote check
  const userId =
    localStorage.getItem("voterId") ||
    (() => {
      const id = Math.random().toString(36).substring(2);
      localStorage.setItem("voterId", id);
      return id;
    })();

  const voted = localStorage.getItem("hasVoted");
  if (voted) {
    form.style.display = "none";
    resultsDiv.classList.remove("hidden");
  }

  // Handle submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const choice = form.vote.value;
    if (!choice) {
      alert("Please select an option!");
      return;
    }

    try {
      // Ensure the user hasn't already voted (search votes collection)
      const q = query(collection(db, "votes"), where("userId", "==", userId));
      const existing = await getDocs(q);

      if (!existing.empty) {
        alert("You’ve already voted!");
        return;
      }

      // Add vote
      await addDoc(collection(db, "votes"), {
        userId,
        choice,
        timestamp: serverTimestamp(),
      });

      localStorage.setItem("hasVoted", "true");
      form.style.display = "none";
      resultsDiv.classList.remove("hidden");
    } catch (err) {
      console.error("Error saving vote:", err);
      alert("Error saving vote — check console and Firebase rules.");
    }
  });

  // Live results — updates in real time
  onSnapshot(collection(db, "votes"), (snapshot) => {
    const counts = { option1: 0, option2: 0, option3: 0 };
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data && counts[data.choice] !== undefined) counts[data.choice]++;
    });

    resultsDisplay.innerHTML = `
      <p><strong>Expand Marketing:</strong> ${counts.option1}</p>
      <p><strong>Increase Burn Rate:</strong> ${counts.option2}</p>
      <p><strong>Increase Rewards:</strong> ${counts.option3}</p>
    `;
  });
});
