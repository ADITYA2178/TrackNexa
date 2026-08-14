/**
 * Catch-all for unmatched routes. Must be registered after all routes
 * and before the central error handler.
 */
export default function notFound(req, res) {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  })
}
