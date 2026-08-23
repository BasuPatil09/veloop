function serializeParticipation(participation) {
  if (!participation) return null;
  return {
    id: participation.id,
    giveawayId: participation.giveawayId,
    prizeId: participation.prizeId,
    entryCurrency: participation.entryCurrency,
    entryAmount: participation.entryAmount,
    status: participation.status,
    joinedAt: participation.joinedAt,
  };
}

function serializeTransaction(transaction) {
  if (!transaction) return null;
  return {
    id: transaction.id,
    currency: transaction.currency,
    amount: transaction.amount,
    status: transaction.status,
    balanceBefore: transaction.balanceBefore,
    balanceAfter: transaction.balanceAfter,
    createdAt: transaction.createdAt,
  };
}

module.exports = { serializeParticipation, serializeTransaction };
