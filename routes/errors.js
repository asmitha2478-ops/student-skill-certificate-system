// Small helpers for consistent JSON errors.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Turns MySQL errors into messages a user can act on.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  switch (err.code) {
    case 'ER_DUP_ENTRY': {
      const m = /for key '(?:[^'.]+\.)?([^']+)'/.exec(err.sqlMessage || '');
      const key = m ? m[1] : '';
      const message =
        key === 'PRIMARY' || !key
          ? 'This record already exists.'
          : `That ${key.replace(/^uq_/, '').replace(/_/g, ' ')} is already in use.`;
      return res.status(409).json({ error: message });
    }
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ error: 'The selected related record does not exist.' });
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(409).json({
        error: 'This record cannot be deleted because other records still depend on it.',
      });
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      return res.status(400).json({ error: 'One of the values breaks a database rule.' });
    case 'ER_DATA_TOO_LONG':
    case 'ER_TRUNCATED_WRONG_VALUE':
    case 'ER_WARN_DATA_OUT_OF_RANGE':
      return res.status(400).json({ error: 'One of the values is not valid for its field.' });
    default:
      console.error(err);
      return res.status(500).json({ error: 'Something went wrong on the server.' });
  }
}

module.exports = { HttpError, asyncHandler, errorHandler };
