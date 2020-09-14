const { APP_AUTH_TOKEN } = process.env

export const authenticate = (token) => {
  const tokens = APP_AUTH_TOKEN.split(',')
  return tokens.includes(token)
}

export const error = (res, status, message) => {
  res.status(status).json({
    status,
    message,
  })
}
