function successResponse(message, data = null) {
  return {
    success: true,
    message,
    data
  };
}

module.exports = {
  successResponse
};