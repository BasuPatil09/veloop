const { maskedMemberCode } = require('./maskUserId');

/**
 * PUBLIC-facing shape — no real name, email, or UUID, ever. Matches the spec's own
 * masked-ID example format (§25, §60: "VE****42").
 */
function serializeWinner(winner) {
  return {
    id: winner.id,
    prizeId: winner.prizeId,
    prizeName: winner.prize?.name,
    prizePosition: winner.prize?.position,
    giveawayId: winner.giveawayId,
    giveawayTitle: winner.giveaway?.title,
    maskedUserId: maskedMemberCode(winner.userId),
    selectedAt: winner.selectedAt,
    status: winner.status,
  };
}

module.exports = { serializeWinner };
