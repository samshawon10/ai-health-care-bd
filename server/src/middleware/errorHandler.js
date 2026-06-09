export function notFound(req, res) {
  res.status(404).json({
    code: "NOT_FOUND",
    error: "Route not found",
    path: req.originalUrl
  });
}

export function errorHandler(error, req, res, next) {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      code: "INVALID_JSON",
      error: "Invalid JSON request body."
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      code: "INVALID_ID",
      error: "Invalid resource identifier."
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      error: "Validation failed.",
      details: error.message
    });
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    code,
    error: statusCode >= 500 ? "Internal server error" : error.message || "Request failed"
  });
}
