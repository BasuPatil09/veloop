/** Wrap an async controller so a thrown/rejected error reaches errorMiddleware instead of hanging the request. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
