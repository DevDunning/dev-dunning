// -------------------------------
// Global Variables
// -------------------------------
let topHolders = [];
let winnerWallet = null;

// -------------------------------
// Fetch Daily Winner + Top 10
// -------------------------------
async function fetchDailyData() {
  try {
    const res = await fetch('/.netlify/functions/daily-spin');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    topHolders = data.topHolders || [];
    winnerWallet = data.wallet || null;

    renderTopHolders();
    renderWinner();
  } catch (err) {
    console.error('Error fetching daily spin:', err);
  }
}

// -------------------------------
// Render Top 10 Holders
// -------------------------------
function renderTopHolders() {
  const ul = document.getElementById('holder-list');
  ul.innerHTML = '';
  topHolders.forEach((wallet, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${wallet.slice(0,6)}...${wallet.slice(-4)}`;
    ul.appendChild(li);
  });
}

// -------------------------------
// Render Winner if Drawn
// -------------------------------
function renderWinner() {
  const winnerEl = document.getElementById('winner');
  if (winnerWallet) {
    winnerEl.textContent = winnerWallet;
  } else {
    winnerEl.textContent = 'Not selected yet';
  }
}

// -------------------------------
// Fetch Recent Winners
// -------------------------------
async function loadRecentWinners() {
  try {
    const res = await fetch('/.netlify/functions/winners');
    if (!res.ok) throw new Error(await res.text());
    const logs = await res.json();

    const ul = document.getElementById('winners');
    ul.innerHTML = '';
    logs.slice(0, 10).reverse().forEach(log => {
      const li = document.createElement('li');
      li.textContent = `${log.wallet.slice(0,6)}...${log.wallet.slice(-4)} won ${log.prize} $DD on ${new Date(log.date).toLocaleDateString()}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error('Load recent winners error:', err);
  }
}

// -------------------------------
// Countdown Timer
// -------------------------------
function startTimer() {
  const countdownEl = document.getElementById('countdown');
  const nextSpin = new Date();
  nextSpin.setUTCHours(17,0,0,0); // daily at 17:00 UTC
  if(nextSpin < new Date()) nextSpin.setUTCDate(nextSpin.getUTCDate() + 1);

  function updateTimer() {
    const now = new Date();
    const diff = nextSpin - now;

    if(diff <= 0){
      countdownEl.textContent = 'Drawing now...';
    } else {
      const h = Math.floor(diff/1000/60/60);
      const m = Math.floor((diff/1000/60)%60);
      const s = Math.floor((diff/1000)%60);
      countdownEl.textContent = `${h}h ${m}m ${s}s`;
    }

    requestAnimationFrame(updateTimer);
  }

  updateTimer();
}

// -------------------------------
// Auto-refresh top holders every 30s
// -------------------------------
function autoRefreshTopHolders() {
  fetchDailyData();
  setInterval(fetchDailyData, 30000); // refresh every 30 seconds
}

// -------------------------------
// Initialize
// -------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  await fetchDailyData();
  await loadRecentWinners();
  startTimer();
  autoRefreshTopHolders();
});
