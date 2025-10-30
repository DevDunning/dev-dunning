// ================================
// $DD Wheel Game Script (Netlify-ready)
// Canvas-based wheel with readable text
// ================================

let prizes = [];
let availableSpins = 0;
let usedSpinsToday = 0;
let walletAddress = null;

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let rotation = 0;
let spinning = false;

// -------------------------------
// Fetch Prizes & Init Wheel
// -------------------------------
async function initWheel() {
  try {
    const res = await fetch('/.netlify/functions/get-rewards');
    prizes = res.ok ? await res.json() : [];
  } catch (err) {
    console.warn('Failed to fetch prizes, using default', err);
    prizes = [];
  }

  if (!Array.isArray(prizes) || prizes.length === 0) {
    prizes = [10000, 20000, 50000, 10000, 5000, 2500, 7500, 0];
    console.warn('Using default prizes:', prizes);
  }

  drawWheel();
}

// -------------------------------
// Draw Wheel on Canvas
// -------------------------------
function drawWheel() {
  const radius = canvas.width / 2;
  const segmentColors = [
    '#b88a53', '#e8e2d5', '#3b3834',
    '#d3a44c', '#e3dccd', '#625b53',
    '#151311', '#b88a53'
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  prizes.forEach((prize, i) => {
    const startAngle = (i * 2 * Math.PI) / prizes.length + rotation;
    const endAngle = ((i + 1) * 2 * Math.PI) / prizes.length + rotation;

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 10, startAngle, endAngle);
    ctx.fillStyle = segmentColors[i % segmentColors.length];
    ctx.fill();
    ctx.closePath();

    // Draw text
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate((startAngle + endAngle) / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000'; // Black text for readability
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(prize > 0 ? `${prize} $DD` : 'Try Again!', radius - 20, 0);
    ctx.restore();
  });

  // Draw pointer
  ctx.beginPath();
  ctx.moveTo(radius, 10);
  ctx.lineTo(radius - 10, 30);
  ctx.lineTo(radius + 10, 30);
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  ctx.closePath();
}

// -------------------------------
// Spin Animation
// -------------------------------
function spinAnimation(callback) {
  if (spinning) return;
  spinning = true;
  let speed = Math.random() * 0.3 + 0.3;
  const deceleration = 0.995;

  function animate() {
    rotation += speed;
    speed *= deceleration;
    drawWheel();
    if (speed > 0.002) requestAnimationFrame(animate);
    else {
      spinning = false;
      callback();
    }
  }
  animate();
}

// -------------------------------
// Connect Phantom Wallet
// -------------------------------
async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    alert('Phantom Wallet not detected. Enter manually.');
    document.getElementById('walletInput').style.display = 'block';
    return;
  }

  try {
    const resp = await window.solana.connect();
    walletAddress = resp.publicKey.toString();
    document.getElementById('status').innerHTML =
      `✅ Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    document.getElementById('walletInput').style.display = 'none';
    document.getElementById('checkBtn').disabled = false;
  } catch (err) {
    console.error('Wallet connect failed:', err);
    alert('Wallet connect failed. Enter manually.');
    document.getElementById('walletInput').style.display = 'block';
  }
}

// -------------------------------
// Check Spins
// -------------------------------
async function checkSpins() {
  const wallet = walletAddress || document.getElementById('walletInput').value.trim();
  if (!wallet) return alert('Connect wallet or enter manually!');

  try {
    const res = await fetch('/.netlify/functions/check-spins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet })
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    availableSpins = data.available;
    usedSpinsToday = data.used;

    document.getElementById('status').innerHTML = `
      💰 Balance: ${data.balance.toLocaleString()} $DD | 
      🎯 Max spins: ${data.maxSpins} | 
      🔄 Used today: ${data.used} | 
      🌀 Available: ${availableSpins}
    `;

    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = availableSpins <= 0;
    spinBtn.textContent = `Spin the Wheel! (${availableSpins} left)`;
  } catch (err) {
    console.error('Check spins error:', err);
    alert('Error checking spins: ' + err.message);
  }
}

// -------------------------------
// Spin Wheel
// -------------------------------
function spinWheel() {
  if (availableSpins <= 0) return alert('No spins left today!');

  availableSpins--;
  const spinBtn = document.getElementById('spinBtn');
  spinBtn.textContent = `Spin the Wheel! (${availableSpins} left)`;
  spinBtn.disabled = true;
  document.getElementById('result').innerHTML = '🎡 Spinning...';

  spinAnimation(handleSpinFinish);
}

// -------------------------------
// Handle Spin Result & Log
// -------------------------------
async function handleSpinFinish() {
  const wallet = walletAddress || document.getElementById('walletInput').value.trim();
  if (!wallet) return;

  const totalUsed = usedSpinsToday + 1;

  try {
    const res = await fetch('/.netlify/functions/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, spinCount: totalUsed })
    });

    if (!res.ok) throw new Error(await res.text());
    const { prize } = await res.json();

    document.getElementById('result').innerHTML =
      prize > 0
        ? `🎉 You won ${prize} $DD! Logged for manual payout.`
        : '😔 Try again tomorrow—better luck next spin!';

    loadWinners();

    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = availableSpins <= 0;
    spinBtn.textContent = `Spin the Wheel! (${availableSpins} left)`;
  } catch (err) {
    console.error('Spin log error:', err);
    document.getElementById('result').innerHTML =
      '⚠️ Spin complete, but log failed. Contact support.';
  }
}

// -------------------------------
// Load Recent Winners
// -------------------------------
async function loadWinners() {
  try {
    const res = await fetch('/.netlify/functions/winners');
    if (!res.ok) throw new Error(await res.text());
    const logs = await res.json();

    const ul = document.getElementById('winners');
    ul.innerHTML = '';
    logs.slice(0, 10).reverse().forEach(log => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${log.wallet.slice(0, 6)}...${log.wallet.slice(-4)}</strong> won ${log.prize} $DD on ${new Date(log.date).toLocaleDateString()}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error('Load winners error:', err);
  }
}

// -------------------------------
// On Page Load
// -------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  await initWheel();
  loadWinners();
});
