const { isPopulated, error, isEmpty } = require('./helpers')

const { APP_AUTH_TOKEN } = process.env
const AUTH_TOKENS = APP_AUTH_TOKEN.split(',')

export const authorization = (handler) => (req, res) => {
  if (isEmpty(req.headers.authorization) && isEmpty(req.query.token))
    return error(res, 401, 'authorization required')

  // authorize by either Bearer token or query param
  req.authorized = { bearer: false, query: false }

  if (isPopulated(req.headers.authorization))
    if (AUTH_TOKENS.includes(req.headers.authorization.split(' ')[1])) {
      req.authorized.bearer = true
    }
  if (isPopulated(req.query.token))
    if (AUTH_TOKENS.includes(req.query.token)) {
      req.authorized.query = true
    }

  if (!req.authorized.bearer && !req.authorized.query)
    return error(res, 401, 'permission denied')

  return handler(req, res)
}
