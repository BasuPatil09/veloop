import { apiClient } from './apiClient';

async function getCurrent() {
  const res = await apiClient.get('/giveaways/current');
  return res.data.data.giveaways;
}

async function getPrevious() {
  const res = await apiClient.get('/giveaways/previous');
  return res.data.data.giveaways;
}

async function getStats() {
  const res = await apiClient.get('/giveaways/stats');
  return res.data.data;
}

/** Resolves /giveaway/:slug — matches against the PRIZE's slug, returns { prize, giveaway }. */
async function getBySlug(slug) {
  const res = await apiClient.get(`/giveaways/slug/${slug}`);
  return res.data.data;
}

export const giveawayService = { getCurrent, getPrevious, getStats, getBySlug };
