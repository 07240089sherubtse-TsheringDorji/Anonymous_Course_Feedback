function errorHandler(err, req, res, next) {
  console.error(err.stack || err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  const message =
    statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;