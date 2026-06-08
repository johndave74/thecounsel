import { ZodError } from 'zod'
import ApiError from '../utils/ApiError.js'

/**
 * Validate `req[source]` against a Zod schema. On success the parsed (and
 * coerced) value replaces `req[source]`. On failure → 400 with field details.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    req[source] = schema.parse(req[source])
    next()
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({
        field: i.path.join('.') || '(root)',
        message: i.message,
      }))
      return next(ApiError.badRequest('Validation failed', details))
    }
    next(err)
  }
}

export default validate
