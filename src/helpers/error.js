'use strict';

class AuthException extends Error {
  constructor(message) {
    super(message);
    this.message = message || 'Authentication failed';
    this.name = 'AuthException';
    this.status = 401;
  }
}

class InternalServerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InternalServerError';
    this.message = message || 'Internal Server Error';
    this.status = 500;
  }
}

class NotFound extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFound';
    this.message = message || 'Recurso não encontrado';
    this.status = 404;
  }
}

const getKnownError = (error) => {
  let currentError = error;
  if (!currentError || !currentError.name) {
    currentError = {
      name: 'InternalServerError',
    };
  }

  const knownErrors = {
    InternalServerError: error,
    AuthException: error,
  };
  return knownErrors[currentError.name] || new InternalServerError(error);
};

const errorHandler = (err, _, res) => {
  console.log('ERROR: \n', err);
  const { message, status, name } = getKnownError(err);
  return res.status(status || 500).json({ message, name });
};

const notFoundHandler = (req, res, next) => next(new NotFound());

module.exports = {
  errorHandler,
  notFoundHandler,
  AuthException,
  InternalServerError,
};
