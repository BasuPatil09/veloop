/**
 * Every API response uses the same envelope so the frontend service layer
 * never has to guess the shape: { success, data } on the happy path,
 * { success, error: { code, message } } on failure.
 */
function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function fail(res, statusCode, code, message) {
  return res.status(statusCode).json({ success: false, error: { code, message } });
}

module.exports = { ok, fail };
