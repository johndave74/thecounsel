/** A typed HTTP error the central error handler knows how to serialize. */
export default class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.expose = true // these messages are safe to show clients
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details)
  }
  static unauthorized(msg = 'Authentication required') {
    return new ApiError(401, msg)
  }
  static forbidden(msg = 'You do not have permission to perform this action') {
    return new ApiError(403, msg)
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg)
  }
  static conflict(msg = 'Resource already exists') {
    return new ApiError(409, msg)
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg)
  }
}
