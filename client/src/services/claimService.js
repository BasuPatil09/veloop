import { apiClient } from './apiClient';

async function getMyClaim(prizeId) {
  const res = await apiClient.get(`/giveaways/${prizeId}/my-claim`);
  return res.data.data;
}

async function submitClaim(prizeId, payload) {
  const res = await apiClient.post(`/giveaways/${prizeId}/claim`, payload);
  return res.data.data;
}

export const claimService = { getMyClaim, submitClaim };
