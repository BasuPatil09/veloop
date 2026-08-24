/**
 * PRIVATE shape — only ever returned to the claim's own owner (ownership already
 * checked by claimService before this is called). Includes the submitted contact
 * fields since the user is looking at their own submission, not a public listing.
 */
function serializeClaim(claim) {
  if (!claim) return null;
  return {
    id: claim.id,
    claimType: claim.claimType,
    status: claim.status,
    fullName: claim.fullName,
    phone: claim.phone,
    address: claim.address,
    city: claim.city,
    state: claim.state,
    pin: claim.pin,
    email: claim.email,
    submittedAt: claim.submittedAt,
    processedAt: claim.processedAt,
  };
}

module.exports = { serializeClaim };
