// The signing half of the subscription (the checking half is src/mr/erriwaya/calendar/Sub.java).
// Pure JavaScript (no WebCrypto), so the page works from a file on the phone, offline.
import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32(d) {
  let s = '', buf = 0, bits = 0;
  for (const x of d) {
    buf = (buf << 8) | x; bits += 8;
    while (bits >= 5) { s += B32[(buf >> (bits - 5)) & 31]; bits -= 5; }
    buf &= (1 << bits) - 1;
  }
  if (bits > 0) s += B32[(buf << (5 - bits)) & 31];
  return s;
}
/** The code for the phone number `id` (ten letters), valid to the end of `day` (days since 1970, UTC). */
export function makeCode(privHex, id, day) {
  const msg = new TextEncoder().encode(`mrcal-sub-1|${id}|${day}`);
  const sig = p256.sign(sha256(msg), privHex, { lowS: true }).toCompactRawBytes();
  const raw = new Uint8Array(66);
  raw[0] = day >> 8; raw[1] = day & 255; raw.set(sig, 2);
  return b32(raw);
}
/** The public key (X.509 SubjectPublicKeyInfo, base64) that belongs to a private key: must equal Sub.PUBLIC_KEY. */
export function publicKeyOf(privHex) {
  const pt = p256.getPublicKey(privHex, false);
  const head = [0x30,0x59,0x30,0x13,0x06,0x07,0x2a,0x86,0x48,0xce,0x3d,0x02,0x01,0x06,0x08,0x2a,0x86,0x48,0xce,0x3d,0x03,0x01,0x07,0x03,0x42,0x00];
  const all = new Uint8Array(head.length + pt.length); all.set(head); all.set(pt, head.length);
  let s = ''; for (const x of all) s += String.fromCharCode(x);
  return btoa(s);
}
if (typeof window !== 'undefined') window.SUBSIGN = { makeCode, publicKeyOf };
