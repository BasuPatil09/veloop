import { apiClient } from './apiClient';

async function getMyStatus(prizeId) {
  const res = await apiClient.get(`/giveaways/${prizeId}/my-status`);
  return res.data.data;
}

async function join(prizeId, idempotencyKey) {
  const res = await apiClient.post(`/giveaways/${prizeId}/join`, { idempotencyKey });
  return res.data.data;
}

export const participationService = { getMyStatus, join };
