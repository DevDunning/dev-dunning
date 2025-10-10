// ============================
// FIREBASE SETUP
// ============================
const firebaseConfig = {
  apiKey: "AIzaSyBVDOstjavCFnS7hGviN4wGOjBo1bHZ4H0",
  authDomain: "dev-dunning.firebaseapp.com",
  databaseURL: "https://dev-dunning-default-rtdb.firebaseio.com",
  projectId: "dev-dunning",
  storageBucket: "dev-dunning.firebasestorage.app",
  messagingSenderId: "159207306253",
  appId: "1:159207306253:web:3668f18c8008a22620d144",
  measurementId: "G-R2WZ908M50"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================
// ADMIN CONTROL
// ============================
const ADMIN_PASSWORD = "Diesel!";
let isAdmin = false;

const loginBtn = document.getElementById('admin-login');
const logoutBtn = document.getElementById('logout');
const openModalBtn = document.getElementById('open-modal');
const adminModal = document.getElementById('update-modal');
const closeModalBtn = document.getElementById('close-modal');
const postUpdateBtn = document.getElementById('post-update');
const newUpdate = document.getElementById('new-update');

// Poll inputs (we’ll dynamically create these in modal)
let pollQuestionInput = null;
let pollOptionsInput = null;

// LOGIN
loginBtn.addEventListener('click', () => {
  const pass = prompt("Enter Admin Password:");
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    alert("✅ Admin mode activated");
    loginBtn.classList.add('hidden');
    document.getElementById('admin-controls').classList.remove('hidden');
  } else {
    alert("❌ Wrong password");
  }
});

// LOGOUT
logoutBtn.addEventListener('click', () => {
  isAdmin = false;
  alert("👋 Logged out");
  loginBtn.classList.remove('hidden');
  document.getElementById('admin-controls').classList.add('hidden');
});

// OPEN/CLOSE MODAL
openModalBtn.addEventListener('click', () => {
  if (!isAdmin) return alert("Admin only");
  adminModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => adminModal.classList.add('hidden'));

// ============================
// UPDATES SYSTEM (LIVE)
// ============================
const updateList = document.getElementById('update-list');
const updatesRef = db.ref('updates');

updatesRef.on('value', snapshot => {
  const data = snapshot.val();
  const updates = data ? Object.entries(data)
      .sort((a, b) => b[0] - a[0])
      .map(e => e[1]) : [];
  renderUpdates(updates);
});

function renderUpdates(updates) {
  updateList.innerHTML = updates.map(u => `<li>${u}</li>`).join('');
}

// Post new update
postUpdateBtn.addEventListener('click', async () => {
  if (!isAdmin) return alert("Admin only");
  const text = newUpdate.value.trim();
  if (!text) return alert("Enter an update");

  const key = Date.now().toString();
  const entry = `🕒 ${new Date().toLocaleString()} — ${text}`;
  await db.ref('updates/' + key).set(entry);
  newUpdate.value = '';
  adminModal.classList.add('hidden');
});

// ============================
// POLL SYSTEM
// ============================
const pollRef = db.ref('polls/main');
let votingData = {
  question: "What should we build next?",
  options: ["New dashboard", "Token tracker"],
  votes: {}
};

pollRef.on('value', snapshot => {
  const data = snapshot.val();
  if (data) votingData = data;
  renderVoting();
});

function hasVoted() {
  return localStorage.getItem('voted_main') === 'true';
}

async function vote(option) {
  if (hasVoted()) return alert("You already voted");
  votingData.votes[option] = (votingData.votes[option] || 0) + 1;
  await pollRef.set(votingData);
  localStorage.setItem('voted_main', 'true');
  renderVoting();
}

// Render poll
function renderVoting() {
  const pollContainer = document.getElementById('poll');
  const titleEl = document.getElementById('voting-title');
  if (!pollContainer || !titleEl) return;

  titleEl.textContent = "🗳 " + votingData.question;
  pollContainer.innerHTML = "";

  const totalVotes = Object.values(votingData.votes || {}).reduce((a,b)=>a+b,0)||1;

  votingData.options.forEach(opt => {
    const count = votingData.votes[opt] || 0;
    const percent = ((count / totalVotes) * 100).toFixed(1);

    const btn = document.createElement('button');
    btn.textContent = `${opt} — ${count} votes (${percent}%)`;
    btn.className = 'vote-btn';
    btn.disabled = hasVoted();
    btn.addEventListener('click', () => vote(opt));

    const bar = document.createElement('div');
    bar.style.width = percent + '%';
    bar.style.height = '6px';
    bar.style.background = 'linear-gradient(90deg,var(--accent),var(--primary))';
    bar.style.marginTop = '4px';
    bar.style.borderRadius = '3px';

    const wrapper = document.createElement('div');
    wrapper.appendChild(btn);
    wrapper.appendChild(bar);
    pollContainer.appendChild(wrapper);
  });
}

// ============================
// ADMIN POLL UPDATE (DYNAMIC IN MODAL)
// ============================
function createPollInputs() {
  if (pollQuestionInput) return; // already exists
  const container = document.createElement('div');
  container.style.marginTop = '10px';

  const label1 = document.createElement('label');
  label1.textContent = "Poll Question:";
  pollQuestionInput = document.createElement('input');
  pollQuestionInput.type = "text";
  pollQuestionInput.value = votingData.question;
  pollQuestionInput.style.width = "100%";

  const label2 = document.createElement('label');
  label2.textContent = "Poll Options (comma separated):";
  pollOptionsInput = document.createElement('textarea');
  pollOptionsInput.value = votingData.options.join(", ");
  pollOptionsInput.style.width = "100%";

  const updatePollBtn = document.createElement('button');
  updatePollBtn.textContent = "Update Poll";
  updatePollBtn.style.marginTop = "5px";
  updatePollBtn.addEventListener('click', async () => {
    if (!isAdmin) return alert("Admin only");
    const question = pollQuestionInput.value.trim();
    const options = pollOptionsInput.value.split(',').map(o=>o.trim()).filter(Boolean);
    if (!question || options.length === 0) return alert("Enter question and options");
    votingData = { question, options, votes: {} };
    options.forEach(o => votingData.votes[o] = 0);
    await pollRef.set(votingData);
    renderVoting();
    alert("✅ Poll updated!");
  });

  container.appendChild(label1);
  container.appendChild(pollQuestionInput);
  container.appendChild(label2);
  container.appendChild(pollOptionsInput);
  container.appendChild(updatePollBtn);

  adminModal.querySelector('.modal-content').appendChild(container);
}
createPollInputs();

// ============================
// ROADMAP (VISIBLE TO ALL)
// ============================
const roadmapList = document.getElementById('roadmap-list');
const mockRoadmap = [
  { phase: "Phase 1", detail: "Launch $DD token & website" },
  { phase: "Phase 2", detail: "Enable live polls & community updates" },
  { phase: "Phase 3", detail: "Integrate tools and analytics" }
];
function renderRoadmap(items) {
  if (!roadmapList) return;
  roadmapList.innerHTML = items.map(r => `<li><strong>${r.phase}</strong>: ${r.detail}</li>`).join('');
}
renderRoadmap(mockRoadmap);

// ============================
// FADE-IN EFFECT
// ============================
const faders = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
});
faders.forEach(fader => observer.observe(fader));
