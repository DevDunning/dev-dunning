document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("voteForm");
  const resultsDiv = document.getElementById("results");
  const votes = JSON.parse(localStorage.getItem("dd_votes")) || {
    marketing: 0,
    buybacks: 0,
    Website: 0,
    games: 0
  };
  const hasVoted = localStorage.getItem("dd_voted");

  function renderResults() {
    const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
    resultsDiv.innerHTML = Object.entries(votes)
      .map(([key, value]) => {
        const percent = ((value / total) * 100).toFixed(1);
        return `
          <div>${key.charAt(0).toUpperCase() + key.slice(1)} — ${percent}% (${value} votes)</div>
          <div class="vote-bar"><i style="width:${percent}%;"></i></div>
        `;
      })
      .join("");
  }

  renderResults();

  if (hasVoted) {
    form.style.display = "none";
    resultsDiv.style.display = "block";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const choice = form.vote.value;
    if (!choice) return alert("Please select an option before voting!");
    if (hasVoted) return alert("You’ve already voted!");

    votes[choice]++;
    localStorage.setItem("dd_votes", JSON.stringify(votes));
    localStorage.setItem("dd_voted", "true");

    form.style.display = "none";
    renderResults();
    resultsDiv.style.display = "block";
  });
});
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme',
    document.body.classList.contains('dark-mode') ? 'dark' : 'light'
  );
});

