export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UpstreamError extends AppError {
  constructor(message, code = 'UPSTREAM_ERROR') {
    super(message, code, 502);
    this.name = 'UpstreamError';
  }
}
