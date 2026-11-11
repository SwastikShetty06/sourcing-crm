function notFound(req, res) {
  res.status(404).json({ message: 'Resource not found.' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'ValidationError') {
    const fields = {};
    for (const key of Object.keys(err.errors)) {
      fields[key] = err.errors[key].message;
    }
    return res.status(400).json({
      message: 'Validation failed.',
      fields
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'A record with these unique details already exists.'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid format for field: ${err.path}.`
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500
    ? 'Internal server error occurred.'
    : err.message || 'An error occurred processing the request.';

  res.status(statusCode).json({ message });
}

module.exports = {
  notFound,
  errorHandler
};
