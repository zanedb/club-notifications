const { isPopulated, error } = require('./helpers')

const { APP_AUTH_TOKEN } = process.env

export const authorization = (handler) => (req, res) => {
  if (isPopulated(req.headers.authorization)) {
    // validate Bearer token
    const tokens = APP_AUTH_TOKEN.split(',')
    if (!tokens.includes(req.headers.authorization.split(' ')[1])) {
      return error(res, 401, 'permission denied')
    }
  } else {
    return error(res, 401, 'authorization required')
  }

  return handler(req, res)
}
