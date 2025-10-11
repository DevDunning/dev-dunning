// app.js

// Utility to make API calls with error handling
async function apiFetch(url, options = {}) {
    if (!navigator.onLine) {
        document.getElementById('offline-banner').style.display = 'block';
        throw new Error('Offline');
    }
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            if (res.status === 429) {
                throw new Error('Rate limit');
            } else {
                throw new Error('Network response was not ok');
            }
        }
        return await res.json();
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}

// Dark mode toggle
const darkToggle = document.getElementById('dark-mode-toggle');
darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
});
// Initialize theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Offline/online detection
window.addEventListener('online', () => {
    document.getElementById('offline-banner').style.display = 'none';
});
window.addEventListener('offline', () => {
    document.getElementById('offline-banner').style.display = 'block';
});

// Particle background animation for intro
(function() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 50;
    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 2 + 1,
                dx: (Math.random() - 0.5) * 0.5,
                dy: (Math.random() - 0.5) * 0.5
            });
        }
    }
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = document.getElementById('intro').clientHeight;
        initParticles();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#ffffff' : '#000000';
            ctx.fill();
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
})();

// Token Info Section
async function fetchTokenInfo() {
    try {
        const data = await apiFetch('/.netlify/functions/token');
        if (data) {
            updateStat('stat-price', data.price);
            updateStat('stat-market-cap', data.market_cap);
            updateStat('stat-supply', data.total_supply);
            updateStat('stat-holders', data.holders);
            updateStat('stat-trades', data.trades);
        }
    } catch (err) {
        console.error('Failed to fetch token info');
    }
}
function updateStat(id, value) {
    const el = document.getElementById(id);
    const start = 0;
    const end = parseFloat(value.replace(/[$,]/g, '')) || 0;
    let current = start;
    const step = end / 60;
    const formatter = new Intl.NumberFormat();
    function animate() {
        current += step;
        if (current >= end) {
            el.textContent = formatter.format(end);
        } else {
            el.textContent = formatter.format(Math.floor(current));
            requestAnimationFrame(animate);
        }
    }
    animate();
}
fetchTokenInfo();
setInterval(fetchTokenInfo, 30000);

// Poll Section
let pollData = {};
let hasVoted = false;
async function loadPoll() {
    try {
        pollData = await apiFetch('/.netlify/functions/poll-get');
        renderPoll();
        updateVoteCount();
        if (!hasVoted) {
            document.querySelectorAll('.poll-choice button').forEach(btn => {
                btn.addEventListener('click', vote);
            });
        }
    } catch (err) {
        if (err.message === 'Rate limit') {
            document.getElementById('poll-container').textContent = 'You have reached the voting limit.';
        } else {
            console.error('Failed to load poll');
        }
    }
}
async function vote(event) {
    const choiceId = event.target.getAttribute('data-id');
    // Generate fingerprint
    const fp = await generateFingerprint();
    try {
        const res = await apiFetch('/.netlify/functions/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp, choice_id: choiceId })
        });
        hasVoted = true;
        renderPollResults(res);
    } catch (err) {
        if (err.message === 'Rate limit') {
            alert('You have reached the vote limit.');
        } else {
            console.error('Vote error', err);
        }
    }
}
function renderPoll() {
    const container = document.getElementById('poll-container');
    container.innerHTML = '';
    if (!hasVoted) {
        const question = document.createElement('p');
        question.textContent = pollData.question || 'Do you like DevDunning token?';
        container.appendChild(question);
        pollData.choices.forEach(choice => {
            const div = document.createElement('div');
            div.className = 'poll-choice';
            const btn = document.createElement('button');
            btn.textContent = choice.choice_text;
            btn.setAttribute('data-id', choice.id);
            div.appendChild(btn);
            container.appendChild(div);
        });
    } else {
        renderPollResults(pollData);
    }
}
function renderPollResults(data) {
    const container = document.getElementById('poll-container');
    container.innerHTML = '';
    const totalVotes = data.total;
    data.choices.forEach(choice => {
        const div = document.createElement('div');
        div.className = 'poll-result';
        const text = document.createElement('span');
        text.textContent = choice.choice_text + ': ' + choice.votes + ' votes (' + Math.round((choice.votes / totalVotes) * 100) + '%)';
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const inner = document.createElement('div');
        inner.className = 'progress-bar-inner';
        inner.style.width = '0';
        div.appendChild(text);
        div.appendChild(bar);
        bar.appendChild(inner);
        container.appendChild(div);
        // Animate bar
        setTimeout(() => {
            inner.style.width = (choice.votes / totalVotes * 100) + '%';
        }, 100);
    });
    document.getElementById('total-votes').textContent = totalVotes;
}
async function updateVoteCount() {
    try {
        const data = await apiFetch('/.netlify/functions/poll-get');
        document.getElementById('total-votes').textContent = data.total;
    } catch (err) {
        console.error('Failed to update vote count');
    }
}
loadPoll();
setInterval(updateVoteCount, 30000);

// Fingerprint generation
async function generateFingerprint() {
    const fpData = navigator.userAgent + navigator.language + screen.width + screen.height + screen.colorDepth + Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hashBuffer = await sha256(fpData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// News Section
let lastNewsTimestamp = localStorage.getItem('lastNewsTimestamp') || 0;
async function loadNews() {
    try {
        const data = await apiFetch('/.netlify/functions/news-get');
        renderNews(data);
        if (data.length && data[0].created_at > lastNewsTimestamp) {
            localStorage.setItem('lastNewsTimestamp', data[0].created_at);
        }
    } catch (err) {
        console.error('Failed to load news');
    }
}
function renderNews(items) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'news-item';
        const title = document.createElement('h4');
        title.textContent = item.title;
        const date = document.createElement('div');
        date.className = 'news-meta';
        const created = new Date(item.created_at);
        date.textContent = created.toLocaleString();
        if (item.created_at > lastNewsTimestamp) {
            const badge = document.createElement('span');
            badge.textContent = 'New';
            badge.style.color = 'red';
            date.appendChild(document.createTextNode(' '));
            date.appendChild(badge);
        }
        const body = document.createElement('p');
        body.innerHTML = item.body;
        const link = document.createElement('a');
        link.href = item.link;
        link.textContent = 'Read more';
        link.className = 'news-link';
        link.target = '_blank';
        // Social share buttons
        const shareTwitter = document.createElement('a');
        shareTwitter.href = `https://twitter.com/share?url=${encodeURIComponent(item.link)}&text=${encodeURIComponent(item.title)}`;
        shareTwitter.target = '_blank';
        shareTwitter.textContent = 'Twitter';
        const shareTelegram = document.createElement('a');
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(item.link)}&text=${encodeURIComponent(item.title)}`;
        shareTelegram.target = '_blank';
        shareTelegram.textContent = 'Telegram';
        shareTwitter.style.marginRight = '1rem';
        div.appendChild(title);
        div.appendChild(date);
        div.appendChild(body);
        div.appendChild(link);
        div.appendChild(document.createElement('br'));
        div.appendChild(shareTwitter);
        div.appendChild(shareTelegram);
        container.appendChild(div);
    });
}
loadNews();
setInterval(loadNews, 45000);
document.getElementById('refresh-news').addEventListener('click', loadNews);

// Roadmap Section
async function loadRoadmap() {
    let data = [];
    try {
        data = await apiFetch('/.netlify/functions/roadmap-get');
    } catch (err) {
        // fallback to static JSON
        try {
            const res = await fetch('roadmap.json');
            data = await res.json();
        } catch(e) {
            console.error('Failed to load roadmap');
        }
    }
    const container = document.getElementById('roadmap-container');
    container.innerHTML = '';
    data.forEach(phase => {
        const phaseDiv = document.createElement('div');
        phaseDiv.className = 'roadmap-phase';
        const title = document.createElement('div');
        title.className = 'roadmap-title';
        title.textContent = `${phase.title} (${phase.progress}% complete)`;
        const content = document.createElement('div');
        content.className = 'roadmap-content';
        content.style.display = 'none';
        const desc = document.createElement('div');
        desc.innerHTML = phase.description;
        content.appendChild(desc);
        phaseDiv.appendChild(title);
        phaseDiv.appendChild(content);
        container.appendChild(phaseDiv);
        title.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
    });
}
loadRoadmap();

// Admin Section
const adminLink = document.getElementById('admin-link');
const adminSection = document.getElementById('admin');
const adminLoginDiv = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginButton = document.getElementById('admin-login-button');
const adminLoginError = document.getElementById('admin-login-error');
const adminLogoutButton = document.getElementById('admin-logout-button');

function showAdminInterface() {
    adminLoginDiv.style.display = 'none';
    adminPanel.style.display = 'block';
    adminLink.style.display = 'inline';
    document.getElementById('admin').style.display = 'block';
}
function hideAdminInterface() {
    adminLoginDiv.style.display = 'block';
    adminPanel.style.display = 'none';
    adminLink.style.display = 'none';
    document.getElementById('admin').style.display = 'none';
    localStorage.removeItem('adminToken');
}

adminLoginButton.addEventListener('click', async () => {
    const password = adminPasswordInput.value;
    try {
        const res = await fetch('/.netlify/functions/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('adminToken', data.token);
            showAdminInterface();
            loadAdminData();
        } else {
            adminLoginError.textContent = 'Invalid password';
        }
    } catch (err) {
        adminLoginError.textContent = 'Login failed';
    }
});

adminLogoutButton.addEventListener('click', () => {
    hideAdminInterface();
});

// Load admin data (poll choices, news, roadmap)
async function loadAdminData() {
    // Fetch poll choices
    const pollChoicesDiv = document.getElementById('admin-poll-choices');
    pollChoicesDiv.innerHTML = '';
    try {
        const data = await apiFetch('/.netlify/functions/poll-get');
        data.choices.forEach(choice => {
            const div = document.createElement('div');
            div.textContent = choice.choice_text;
            pollChoicesDiv.appendChild(div);
        });
        // Add form to add new choice
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'new-choice-text';
        input.placeholder = 'New choice text';
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Choice';
        addBtn.addEventListener('click', addPollChoice);
        pollChoicesDiv.appendChild(input);
        pollChoicesDiv.appendChild(addBtn);
    } catch (err) {
        console.error('Failed to load poll choices');
    }

    // Fetch news items
    const newsAdminDiv = document.getElementById('admin-news');
    newsAdminDiv.innerHTML = '';
    try {
        const data = await apiFetch('/.netlify/functions/news-get');
        data.forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `${item.title} - <button data-id="${item.id}" class="delete-news">Delete</button>`;
            newsAdminDiv.appendChild(div);
        });
        // Add form to add news
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.id = 'new-news-title';
        titleInput.placeholder = 'Title';
        const bodyInput = document.createElement('textarea');
        bodyInput.id = 'new-news-body';
        bodyInput.placeholder = 'Body HTML';
        const linkInput = document.createElement('input');
        linkInput.type = 'text';
        linkInput.id = 'new-news-link';
        linkInput.placeholder = 'Link';
        const addNewsBtn = document.createElement('button');
        addNewsBtn.textContent = 'Add News';
        addNewsBtn.addEventListener('click', addNewsItem);
        newsAdminDiv.appendChild(titleInput);
        newsAdminDiv.appendChild(bodyInput);
        newsAdminDiv.appendChild(linkInput);
        newsAdminDiv.appendChild(addNewsBtn);
        document.querySelectorAll('.delete-news').forEach(btn => {
            btn.addEventListener('click', deleteNewsItem);
        });
    } catch (err) {
        console.error('Failed to load news items');
    }

    // Fetch roadmap
    const roadmapAdminDiv = document.getElementById('admin-roadmap');
    roadmapAdminDiv.innerHTML = '';
    try {
        const data = await apiFetch('/.netlify/functions/roadmap-get');
        data.forEach(phase => {
            const div = document.createElement('div');
            div.innerHTML = `
                <h4>${phase.title}</h4>
                <input type="number" id="progress-${phase.id}" value="${phase.progress}" min="0" max="100">%
                <textarea id="desc-${phase.id}">${phase.description}</textarea>
            `;
            roadmapAdminDiv.appendChild(div);
        });
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Roadmap';
        saveBtn.addEventListener('click', saveRoadmap);
        roadmapAdminDiv.appendChild(saveBtn);
    } catch (err) {
        console.error('Failed to load roadmap');
    }
}

async function addPollChoice() {
    const text = document.getElementById('new-choice-text').value;
    const token = localStorage.getItem('adminToken');
    await fetch('/.netlify/functions/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ action: 'add_poll_choice', text })
    });
    loadAdminData();
}

async function addNewsItem() {
    const title = document.getElementById('new-news-title').value;
    const body = document.getElementById('new-news-body').value;
    const link = document.getElementById('new-news-link').value;
    const token = localStorage.getItem('adminToken');
    await fetch('/.netlify/functions/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ action: 'add_news', title, body, link })
    });
    loadAdminData();
}

async function deleteNewsItem(event) {
    const id = event.target.getAttribute('data-id');
    const token = localStorage.getItem('adminToken');
    await fetch('/.netlify/functions/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ action: 'delete_news', id })
    });
    loadAdminData();
}

async function saveRoadmap() {
    const token = localStorage.getItem('adminToken');
    const phases = [];
    document.querySelectorAll('#admin-roadmap div').forEach(div => {
        const id = div.querySelector('input').id.split('-')[1];
        const progress = div.querySelector('input').value;
        const desc = div.querySelector('textarea').value;
        phases.push({ id, progress, description: desc });
    });
    await fetch('/.netlify/functions/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ action: 'update_roadmap', phases })
    });
    alert('Roadmap saved');
}
