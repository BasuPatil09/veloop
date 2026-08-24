const crypto = require('crypto');

/**
 * Public winner listings must never expose a user's real UUID, name, or email
 * (spec §25 — winner privacy). Instead we derive a stable, deterministic 5-digit
 * "member code" from the user's UUID and mask all but the last two digits,
 * matching the spec's own example format ("VE****42").
 */
function memberCode(userId) {
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  const num = parseInt(hash.slice(0, 8), 16) % 100000;
  return String(num).padStart(5, '0');
}

function maskedMemberCode(userId) {
  const code = memberCode(userId);
  const visible = code.slice(-2);
  return `VE${'*'.repeat(code.length - 2)}${visible}`;
}

module.exports = { memberCode, maskedMemberCode };
