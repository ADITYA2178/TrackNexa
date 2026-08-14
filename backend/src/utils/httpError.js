const createError = (message, status, extra = {}) => {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

export { createError }