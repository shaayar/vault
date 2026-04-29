/**
 * Response utility functions for consistent API responses
 */

export function successResponse(data) {
  return {
    success: true,
    data
  };
}

export function errorResponse(message) {
  return {
    success: false,
    error: message
  };
}

export function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}
