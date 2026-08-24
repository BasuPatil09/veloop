import { apiClient } from './apiClient';

async function getGiveawayWinners(giveawayId) {
  const res = await apiClient.get(`/giveaways/${giveawayId}/winners`);
  return res.data.data; // { finalized, winners }
}

async function getPreviousWinners() {
  const res = await apiClient.get('/giveaways/previous/winners');
  return res.data.data.winners;
}

export const winnerService = { getGiveawayWinners, getPreviousWinners };
