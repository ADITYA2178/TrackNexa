/**
 * Wraps an async Express route handler so rejected promises
 * are forwarded to the central error handler via next(err).
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export default asyncHandler
