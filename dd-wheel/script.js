let topHolders = [];
let winnerWallet = null;
let rotation = 0;

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const radius = canvas.width / 2;

// -------------------------------
// Fetch Daily Winner + Top 10 Snapshot
// -------------------------------
async function fetchDailyData() {
  try {
    const res = await fetch('/.netlify/functions/daily-spin');
    const data = res.ok ? await res.json() : null;
    if (data) {
      topHolders = data.snapshot;
      winnerWallet = data.wallet;
    }
  } catch (err) {
    console.error('Error fetching daily spin:', err);
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
// Draw Wheel
// -------------------------------
function drawWheel() {
  const colors = ['#b88a53','#e8e2d5','#3b3834','#d3a44c','#e3dccd','#625b53','#151311','#b88a53','#e8e2d5','#3b3834'];
  ctx.clearRect(0,0,canvas.width,canvas.height);

  topHolders.forEach((wallet,i)=>{
    const startAngle = (i*2*Math.PI)/topHolders.length + rotation;
    const endAngle = ((i+1)*2*Math.PI)/topHolders.length + rotation;

    ctx.beginPath();
    ctx.moveTo(radius,radius);
    ctx.arc(radius,radius,radius-10,startAngle,endAngle);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.closePath();

    ctx.save();
    ctx.translate(radius,radius);
    ctx.rotate((startAngle+endAngle)/2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(wallet.slice(0,6)+'...', radius-20, 0);
    ctx.restore();
  });

  // Draw pointer
  ctx.beginPath();
  ctx.moveTo(radius,10);
  ctx.lineTo(radius-10,30);
  ctx.lineTo(radius+10,30);
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  ctx.closePath();
}

// -------------------------------
// Spin Wheel to Winner
// -------------------------------
function spinToWinner() {
  if (!winnerWallet || topHolders.length===0) return;

  const targetIndex = topHolders.indexOf(winnerWallet);
  if (targetIndex === -1) return;

  let currentRotation = 0;
  let speed = 0.2;
  const deceleration = 0.97;
  const segmentAngle = (2*Math.PI)/topHolders.length;
  const targetRotation = (Math.PI*3/2) - targetIndex*segmentAngle;

  function animate() {
    currentRotation += speed;
    speed *= deceleration;
    rotation = currentRotation;
    drawWheel();
    if(speed>0.002){
      requestAnimationFrame(animate);
    } else {
      rotation = targetRotation;
      drawWheel();
      document.getElementById('winner').textContent = winnerWallet;
    }
  }
  animate();
}

// -------------------------------
// Countdown Timer
// -------------------------------
function startTimer() {
  const countdownEl = document.getElementById('countdown');
  const nextSpin = new Date();
  nextSpin.setUTCHours(24,0,0,0);

  function updateTimer() {
    const now = new Date();
    const diff = nextSpin - now;
    if(diff<=0){
      countdownEl.textContent='Spinning soon...';
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
// On Page Load
// -------------------------------
window.addEventListener('DOMContentLoaded', async()=>{
  await fetchDailyData();
  drawWheel();
  spinToWinner();
  loadRecentWinners();
  startTimer();
});
