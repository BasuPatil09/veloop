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

/** Richer shape for "My Entries" — includes prize/giveaway context and win status inline. */
function serializeMyParticipation({ participation, winner }) {
  return {
    id: participation.id,
    joinedAt: participation.joinedAt,
    entryCurrency: participation.entryCurrency,
    entryAmount: participation.entryAmount,
    prize: {
      id: participation.prize.id,
      slug: participation.prize.slug,
      name: participation.prize.name,
      image: participation.prize.image,
    },
    giveaway: {
      id: participation.giveaway.id,
      title: participation.giveaway.title,
      status: participation.giveaway.status,
    },
    isWinner: Boolean(winner),
    winnerStatus: winner ? winner.status : null,
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

module.exports = { serializeParticipation, serializeMyParticipation, serializeTransaction };
