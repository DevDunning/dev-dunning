// Public domain SHA-256 implementation
function sha256(message) {
  function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const initialHash = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  let hash = initialHash.slice(0);
  message = unescape(encodeURIComponent(message));
  let messageArray = [];
  for (let i = 0; i < message.length; ++i) messageArray[i] = message.charCodeAt(i);
  messageArray.push(0x80);
  while ((messageArray.length * 8) % 512 !== 448) messageArray.push(0);
  let length = message.length * 8;
  for (let i = 56; i >= 0; i -= 8) messageArray.push((length / Math.pow(2, i)) & 0xff);
  for (let i = 0; i < messageArray.length; i += 64) {
    let w = [];
    for (let t = 0; t < 64; ++t) {
      if (t < 16) w[t] = (messageArray[i + t * 4] << 24) | (messageArray[i + t * 4 + 1] << 16) | (messageArray[i + t * 4 + 2] << 8) | messageArray[i + t * 4 + 3];
      else w[t] = (rightRotate(w[t-3] ^ w[t-8] ^ w[t-14] ^ w[t-16], 7) + rightRotate(w[t-7] ^ w[t-2] ^ w[t-11] ^ w[t-15], 18) + w[t-16]) & 0xffffffff;
    }
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
    for (let t = 0; t < 64; ++t) {
      let t1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) & 0xffffffff;
      let t2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c)) & 0xffffffff;
      h = g; g = f; f = e; e = (d + t1) & 0xffffffff; d = c; c = b; b = a; a = (t1 + t2) & 0xffffffff;
    }
    hash = hash.map((val, idx) => (val + [a,b,c,d,e,f,g,h][idx]) & 0xffffffff);
  }
  return hash.map(val => val.toString(16).padStart(8, '0')).join('');
}