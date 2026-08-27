const participationService = require('../services/participationService');
const { ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeParticipation, serializeMyParticipation, serializeTransaction } = require('../utils/serializeParticipation');
const { computeDeviceHash, computeIpHash } = require('../utils/deviceHash');

const getMyStatus = asyncHandler(async (req, res) => {
  const { joined, participation } = await participationService.getMyStatus(req.user.id, req.params.prizeId);
  return ok(res, { joined, participation: serializeParticipation(participation) });
});

const getMyParticipations = asyncHandler(async (req, res) => {
  const results = await participationService.getMyParticipations(req.user.id);
  return ok(res, { participations: results.map(serializeMyParticipation) });
});

const join = asyncHandler(async (req, res) => {
  const { idempotencyKey } = req.body;
  const deviceHash = computeDeviceHash(req);
  const ipHash = computeIpHash(req);

  const result = await participationService.join(req.user.id, req.params.prizeId, {
    idempotencyKey,
    deviceHash,
    ipHash,
  });

  return ok(
    res,
    {
      participation: serializeParticipation(result.participation),
      transaction: serializeTransaction(result.transaction),
    },
    result.replayed ? 200 : 201,
  );
});

module.exports = { getMyStatus, getMyParticipations, join };
