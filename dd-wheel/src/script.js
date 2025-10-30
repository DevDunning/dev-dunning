// ================================
//  $DD Wheel Game Script (Fixed)
//  - Native Phantom wallet connect
//  - Works in Netlify functions
// ================================

let theWheel;
let availableSpins = 0;
let usedSpinsToday = 0;
let walletAddress = null;
let prizes = [];

// -------------------------------
// Initialize Wheel
// -------------------------------
async function initWheel() {
  try {
    const res = await fetch('/dd-wheel/.netlify/functions/get-rewards');
    if (!res.ok) throw new Error('Failed to load prizes');
    prizes = await res.json();

    const segmentColors = [
      '#b88a53', '#e8e2d5', '#3b3834',
      '#d3a44c', '#e3dccd', '#625b53',
      '#151311', '#b88a53'
    ];

    theWheel = new Winwheel({
      canvasId: 'wheel',
      numSegments: prizes.length,
      outerRadius: 180,
      innerRadius: 20,
      textOrientation: 'curved',
      textFontSize: 14,
      segments: prizes.map((prize, index) => ({
        fillStyle: segmentColors[index % segmentColors.length],
        text: prize > 0 ? `${prize} $DD` : 'Try Again!'
      })),
      animation: {
        type: 'spinToStop',
        duration: 6,
        spins: 10,
        callbackFinished: handleSpinFinish
      }
    });

    theWheel.draw();
  } catch (error) {
    console.error('Wheel init error:', error);
    document.getElementById('status').innerHTML = '⚠️ Error loading wheel. Try refreshing or contact support.';
    document.getElementById('spinBtn').disabled = true;
  }
}

// -------------------------------
// Connect Phantom Wallet
// -------------------------------
async function connectWallet() {
  // Detect Phantom
  if (!window.solana || !window.solana.isPhantom) {
    alert('Phantom Wallet not detected. Please install Phantom extension.');
    return;
  }

  try {
    const resp = await window.solana.connect();
    walletAddress = resp.publicKey.toString();

    document.getElementById('status').innerHTML =
      `✅ Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    document.getElementById('checkBtn').disabled = false;
    document.getElementById('walletInput').style.display = 'none';
  } catch (err) {
    console.error('Wallet connect failed:', err);
    alert('Wallet connect failed or was rejected. You can enter your address manually below.');
    document.getElementById('walletInput').style.display = 'block';
  }
}

// -------------------------------
// Check Available Spins
// -------------------------------
async function checkSpins() {
  const wallet = walletAddress || document.getElementById('walletInput').value.trim();
  if (!wallet) {
    alert('Please connect wallet or enter address!');
    return;
  }

  try {
    const res = await fetch('/dd-wheel/.netlify/functions/check-spins', {
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
    spinBtn.disabled = availableSpins <= 0 || !theWheel;
    spinBtn.textContent = `Spin the Wheel! (${availableSpins} left)`;
  } catch (error) {
    console.error('Check spins error:', error);
    alert('Error checking spins: ' + error.message);
  }
}

// -------------------------------
// Spin Wheel
// -------------------------------
function spinWheel() {
  if (!theWheel) {
    alert('Wheel not loaded. Try refreshing or contact support.');
    return;
  }
  if (availableSpins <= 0) {
    alert('No spins left today! Check back tomorrow.');
    return;
  }

  availableSpins--;
  const spinBtn = document.getElementById('spinBtn');
  spinBtn.textContent = `Spin the Wheel! (${availableSpins} left)`;
  spinBtn.disabled = true;
  document.getElementById('result').innerHTML = '🎡 Spinning...';

  theWheel.rotationAngle = 0;
  theWheel.draw();
  theWheel.startAnimation();
}

// -------------------------------
// Handle Spin Result
// -------------------------------
async function handleSpinFinish() {
  const spinBtn = document.getElementById('spinBtn');
  spinBtn.disabled = availableSpins <= 0 || !theWheel;

  const wallet = walletAddress || document.getElementById('walletInput').value.trim();
  if (!wallet) return;

  const totalUsed = usedSpinsToday + (availableSpins + 1);

  try {
    const res = await fetch('/dd-wheel/.netlify/functions/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, spinCount: totalUsed })
    });

    if (!res.ok) throw new Error(await res.text());
    const { prize } = await res.json();

    if (prize > 0) {
      document.getElementById('result').innerHTML =
        `🎉 You won ${prize} $DD! Logged for manual payout.`;
    } else {
      document.getElementById('result').innerHTML =
        '😔 Try again tomorrow—better luck next spin!';
    }

    loadWinners();
  } catch (error) {
    console.error('Spin log error:', error);
    document.getElementById('result').innerHTML =
      '⚠️ Spin complete, but log failed. Contact support.';
  }
}

// -------------------------------
// Load Recent Winners
// -------------------------------
async function loadWinners() {
  try {
    const res = await fetch('/dd-wheel/.netlify/functions/winners');
    if (!res.ok) throw new Error(await res.text());
    const logs = await res.json();

    const ul = document.getElementById('winners');
    ul.innerHTML = '';
    logs.slice(0, 10).reverse().forEach(log => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${log.wallet.slice(0, 6)}...${log.wallet.slice(-4)}</strong>
        won ${log.prize} $DD on
        ${new Date(log.date).toLocaleDateString()}
      `;
      ul.appendChild(li);
    });
  } catch (error) {
    console.error('Load winners error:', error);
  }
}

// -------------------------------
// On Page Load
// -------------------------------
window.addEventListener('load', async () => {
  await initWheel();
  loadWinners();

  // Auto-detect Phantom wallet on load
  if (window.solana && window.solana.isPhantom) {
    console.log('Phantom wallet detected');
  } else {
    console.warn('Phantom wallet not detected');
  }
});
