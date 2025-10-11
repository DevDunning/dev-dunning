// Hash routing
const sections = document.querySelectorAll('section');
function showSection() {
  const hash = location.hash.slice(1) || 'intro';
  sections.forEach(s => s.style.display = s.id === hash ? 'block' : 'none');
  if (hash === 'admin' && !localStorage.token) document.getElementById('admin-panel').style.display = 'none';
}
addEventListener('hashchange', showSection);
showSection();

// Dark mode
const toggle = document.getElementById('dark-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('dark', document.body.classList.contains('dark'));
  toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});
if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark');
toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';

// Offline handling
const offlineMsg = document.getElementById('offline-msg');
addEventListener('offline', () => offlineMsg.style.display = 'block');
addEventListener('online', () => offlineMsg.style.display = 'none');

// Animate number
function animateNumber(el, end) {
  let start = 0;
  const duration = 1000;
  const stepTime = 20;
  const steps = duration / stepTime;
  const increment = end / steps;
  const timer = setInterval(() => {
    start += increment;
    el.textContent = Math.round(start);
    if (start >= end) clearInterval(timer);
  }, stepTime);
}

// Particles
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.color = document.body.classList.contains('dark') ? '#fff' : '#000';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 2, 2);
  }
}
const particles = Array.from({length: 50}, () => new Particle());
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// Token info
const priceEl = document.getElementById('price');
const mcapEl = document.getElementById('mcap');
const supplyEl = document.getElementById('supply');
const holdersEl = document.getElementById('holders');
const tradesEl = document.getElementById('trades');
async function fetchToken() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch('/.netlify/functions/token');
    const data = await res.json();
    animateNumber(priceEl, data.price || 0);
    animateNumber(mcapEl, data.marketCap || 0);
    animateNumber(supplyEl, data.totalSupply || 0);
    holdersEl.textContent = data.holders || 'N/A';
    animateNumber(tradesEl, data.recentTrades || 0);
  } catch {}
}
fetchToken();
setInterval(fetchToken, 30000);

// Poll
const pollOptions = document.getElementById('poll-options');
const pollResults = document.getElementById('poll-results');
const totalVotes = document.getElementById('total-votes');
const pollMsg = document.getElementById('poll-msg');
async function fetchPoll(showResults = true) {
  const res = await fetch('/.netlify/functions/poll-get');
  const options = await res.json();
  pollOptions.innerHTML = options.map(o => `<button onclick="vote('${o.id}')">${o.text}</button>`).join('');
  if (showResults) {
    let total = 0;
    options.forEach(o => total += o.votes);
    pollResults.innerHTML = options.map(o => {
      const perc = total ? (o.votes / total * 100) : 0;
      return `<p>${o.text}: ${o.votes} <div class="poll-bar" style="width:0%"></div></p>`;
    }).join('');
    animateNumber(totalVotes, total);
    // Animate bars
    document.querySelectorAll('.poll-bar').forEach((bar, i) => {
      const perc = total ? (options[i].votes / total * 100) : 0;
      setTimeout(() => bar.style.width = `${perc}%`, 100);
    });
  }
}
fetchPoll();
setInterval(() => fetchPoll(false), 30000);

// Vote
async function vote(option_id) {
  const fingerprint = getFingerprint();
  let recaptchaToken;
  if (typeof grecaptcha !== 'undefined' && process.env.RECAPTCHA_SECRET) {
    recaptchaToken = await grecaptcha.execute('your_site_key', {action: 'vote'});
  }
  try {
    const res = await fetch('/.netlify/functions/vote', {
      method: 'POST',
      body: JSON.stringify({option_id, fingerprint, recaptchaToken}),
    });
    if (res.status === 429) pollMsg.textContent = 'Rate limit exceeded - try later';
    else if (!res.ok) pollMsg.textContent = 'Already voted or error';
    else pollMsg.textContent = 'Voted!';
    fetchPoll();
  } catch { pollMsg.textContent = 'Error voting'; }
}

// Fingerprint
function getFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("test", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("test", 4, 17);
  const canvasData = canvas.toDataURL();

  const fontTest = document.createElement('span');
  fontTest.style.fontSize = '40px';
  fontTest.style.visibility = 'hidden';
  fontTest.textContent = 'abcdefghijklmnopqrstuvwxyz';
  document.body.appendChild(fontTest);
  const fontWidth = fontTest.offsetWidth;
  document.body.removeChild(fontTest);

  const data = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!navigator.cookieEnabled,
    canvasData,
    fontWidth
  ].join(';;;');
  return sha256(data);
}

// News
const newsList = document.getElementById('news-list');
const lastVisit = localStorage.getItem('lastVisit') || new Date(0).toISOString();
localStorage.setItem('lastVisit', new Date().toISOString());
async function fetchNews() {
  const res = await fetch('/.netlify/functions/news-get');
  const news = await res.json();
  newsList.innerHTML = news.map(n => {
    const isNew = new Date(n.created_at) > new Date(lastVisit) ? '<span class="new-badge">New</span>' : '';
    return `<div><h3>${n.title} ${isNew}</h3><p>${n.body}</p>${n.link ? `<a href="${n.link}">Link</a>` : ''}
      <button onclick="shareTwitter('${n.title}','${location.href}')">Twitter</button>
      <button onclick="shareTelegram('${n.title}','${location.href}')">Telegram</button></div>`;
  }).join('');
}
fetchNews();
setInterval(fetchNews, 45000);
document.getElementById('news-refresh').addEventListener('click', fetchNews);

// Social share
function shareTwitter(title, url) { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`); }
function shareTelegram(title, url) { window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`); }

// Roadmap
const roadmapPhases = document.getElementById('roadmap-phases');
async function fetchRoadmap() {
  try {
    const res = await fetch('/.netlify/functions/roadmap-get');
    const phases = await res.json();
    roadmapPhases.innerHTML = phases.map(p => `
      <div class="collapsible">
        <h3>${p.phase_name} (${p.progress}%) ${p.completed ? '✅' : ''}</h3>
        <div class="progress" style="width:0%"></div>
        <p style="display:none;">${p.milestones.replace(/\n/g, '<br>')}</p>
      </div>
    `).join('');
    // Animate progress
    document.querySelectorAll('.progress').forEach((bar, i) => {
      setTimeout(() => bar.style.width = `${phases[i].progress}%`, 100);
    });
    // Collapsible
    document.querySelectorAll('.collapsible h3').forEach(h => {
      h.addEventListener('click', () => {
        const content = h.nextElementSibling.nextElementSibling;
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      });
    });
  } catch {
    const res = await fetch('roadmap.json');
    const phases = await res.json();
    roadmapPhases.innerHTML = phases.map(p => `
      <div class="collapsible">
        <h3>${p.phase_name} (${p.progress}%) ${p.completed ? '✅' : ''}</h3>
        <div class="progress" style="width:0%"></div>
        <p style="display:none;">${p.milestones.replace(/\n/g, '<br>')}</p>
      </div>
    `).join('');
    document.querySelectorAll('.progress').forEach((bar, i) => {
      setTimeout(() => bar.style.width = `${phases[i].progress}%`, 100);
    });
    document.querySelectorAll('.collapsible h3').forEach(h => {
      h.addEventListener('click', () => {
        const content = h.nextElementSibling.nextElementSibling;
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      });
    });
  }
}
fetchRoadmap();

// Admin
const adminLink = document.getElementById('admin-link');
if (localStorage.token) {
  adminLink.style.display = 'list-item';
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  loadAdmin();
}
document.getElementById('login-btn').addEventListener('click', async () => {
  const pass = document.getElementById('admin-pass').value;
  const res = await fetch('/.netlify/functions/auth-login', {
    method: 'POST',
    body: JSON.stringify({password: pass})
  });
  if (res.ok) {
    const {token} = await res.json();
    localStorage.token = token;
    adminLink.style.display = 'list-item';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadAdmin();
  } else {
    alert('Invalid password');
  }
});

async function loadAdmin() {
  // Poll edit
  const resPoll = await fetch('/.netlify/functions/poll-get', {
    headers: {Authorization: `Bearer ${localStorage.token}`}
  });
  const options = await resPoll.json();
  document.getElementById('poll-edit').innerHTML = options.map(o => `
    <div>
      <input value="${o.text}" onchange="updatePoll('${o.id}', this.value)">
      <button onclick="deletePoll('${o.id}')">Delete</button>
    </div>
  `).join('') + '<button onclick="addPoll()">Add Option</button>';

  // News edit
  const resNews = await fetch('/.netlify/functions/news-get');
  const news = await resNews.json();
  document.getElementById('news-edit').innerHTML = news.map(n => `
    <div>
      <input value="${n.title}" placeholder="Title">
      <textarea placeholder="Body">${n.body}</textarea>
      <input value="${n.link || ''}" placeholder="Link">
      <button onclick="updateNews('${n.id}', this)">Update</button>
      <button onclick="deleteNews('${n.id}')">Delete</button>
    </div>
  `).join('');

  // Roadmap edit
  const resRoadmap = await fetch('/.netlify/functions/roadmap-get');
  const phases = await resRoadmap.json();
  document.getElementById('roadmap-edit').innerHTML = phases.map(p => `
    <div>
      <input value="${p.phase_name}" placeholder="Phase Name">
      <textarea placeholder="Milestones">${p.milestones}</textarea>
      <input type="number" value="${p.progress}" placeholder="Progress (0-100)">
      <input type="checkbox" ${p.completed ? 'checked' : ''}> Completed
      <button onclick="updateRoadmap('${p.id}', this)">Update</button>
    </div>
  `).join('');

  // Poll results and recent votes
  document.getElementById('poll-results-admin').innerHTML = options.map(o => `
    <p>${o.text}: ${o.votes}</p>
  `).join('');
  // Note: Recent votes requires additional function or admin-update type='get_votes'
}

async function updatePoll(id, text) {
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'poll', data: {id, text}})
  });
  loadAdmin();
}

async function addPoll() {
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'poll', data: {text: 'New Option'}})
  });
  loadAdmin();
}

async function deletePoll(id) {
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'delete_poll', data: {id}})
  });
  loadAdmin();
}

async function updateNews(id, btn) {
  const div = btn.parentElement;
  const title = div.querySelector('input').value;
  const body = div.querySelector('textarea').value;
  const link = div.querySelector('input:nth-child(3)').value;
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'news', data: {id, title, body, link}})
  });
  loadAdmin();
}

async function deleteNews(id) {
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'delete_news', data: {id}})
  });
  loadAdmin();
}

document.getElementById('add-news').addEventListener('click', async () => {
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'news', data: {title: 'New Title', body: 'New Body'}})
  });
  loadAdmin();
});

async function updateRoadmap(id, btn) {
  const div = btn.parentElement;
  const phase_name = div.querySelector('input').value;
  const milestones = div.querySelector('textarea').value;
  const progress = parseInt(div.querySelector('input[type=number]').value);
  const completed = div.querySelector('input[type=checkbox]').checked;
  await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {Authorization: `Bearer ${localStorage.token}`},
    body: JSON.stringify({type: 'roadmap', data: {id, phase_name, milestones, progress, completed}})
  });
  loadAdmin();
}

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'block' ? 'none' : 'block';
});