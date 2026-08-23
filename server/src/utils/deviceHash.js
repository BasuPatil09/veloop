const crypto = require('crypto');

/**
 * A lightweight, privacy-conscious abuse-prevention SIGNAL — not an identity lock.
 * Stored on each participation for the fraud service to consume in Phase 5; nothing
 * reads or blocks on this yet. Users can trivially change devices/clear cookies/use
 * a VPN, so this is combined with other signals later, never treated as proof on
 * its own (architecture doc, section 24 of the spec).
 */
function computeDeviceHash(req) {
  const ua = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(`${req.ip}|${ua}`).digest('hex');
}

function computeIpHash(req) {
  return crypto.createHash('sha256').update(req.ip || '').digest('hex');
}

module.exports = { computeDeviceHash, computeIpHash };
