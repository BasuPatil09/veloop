function serializePrize(prize) {
  return {
    id: prize.id,
    slug: prize.slug,
    name: prize.name,
    position: prize.position,
    image: prize.image,
    description: prize.description,
    type: prize.type,
    claimType: prize.claimType,
    entryCurrency: prize.entryCurrency,
    entryAmount: prize.entryAmount,
    winnerCount: prize.winnerCount,
    value: prize.value,
  };
}

function serializeGiveaway(giveaway) {
  return {
    id: giveaway.id,
    title: giveaway.title,
    slug: giveaway.slug,
    description: giveaway.description,
    status: giveaway.status,
    startAt: giveaway.startAt,
    endAt: giveaway.endAt,
    bannerImage: giveaway.bannerImage,
    allowMultipleEntries: giveaway.allowMultipleEntries,
    prizes: (giveaway.prizes || []).map(serializePrize),
    createdAt: giveaway.createdAt,
  };
}

/** Shape used by GET /giveaways/slug/:slug — a single prize plus its parent giveaway's shared context. */
function serializePrizeWithGiveaway(prize, giveaway) {
  return {
    prize: serializePrize(prize),
    giveaway: {
      id: giveaway.id,
      title: giveaway.title,
      slug: giveaway.slug,
      description: giveaway.description,
      status: giveaway.status,
      startAt: giveaway.startAt,
      endAt: giveaway.endAt,
      allowMultipleEntries: giveaway.allowMultipleEntries,
    },
  };
}

module.exports = { serializeGiveaway, serializePrize, serializePrizeWithGiveaway };
