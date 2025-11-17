/**
 * Centralized error handling and error codes for the application
 */

export enum ErrorCode {
  // Authentication Errors (AUTH_xxx)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_MISSING_TOKEN = 'AUTH_003',
  AUTH_SESSION_EXPIRED = 'AUTH_004',
  
  // Bus Tracking Errors (BUS_xxx)
  BUS_NO_BUSES_AVAILABLE = 'BUS_001',
  BUS_INVALID_LOCATION = 'BUS_002',
  BUS_FETCH_FAILED = 'BUS_003',
  
  // Network Errors (NETWORK_xxx)
  NETWORK_CONNECTION_FAILED = 'NETWORK_001',
  NETWORK_TIMEOUT = 'NETWORK_002',
  NETWORK_OFFLINE = 'NETWORK_003',
  
  // Cache Errors (CACHE_xxx)
  CACHE_UNAVAILABLE = 'CACHE_001',
  CACHE_CORRUPTED = 'CACHE_002',
  
  // Validation Errors (VALIDATION_xxx)
  VALIDATION_INVALID_EMAIL = 'VALIDATION_001',
  VALIDATION_INVALID_PASSWORD = 'VALIDATION_002',
  VALIDATION_PASSWORD_MISMATCH = 'VALIDATION_003',
  
  // Generic Errors
  UNKNOWN_ERROR = 'ERROR_000',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string; // Albanian user-friendly message
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export class ApplicationError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    recoverable = true,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
    this.timestamp = new Date();
    this.recoverable = recoverable;
    this.name = 'ApplicationError';

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
    };
  }
}

/**
 * Error message mappings in Albanian
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Email ose fjalëkalimi është i gabuar',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Sesioni juaj ka skaduar. Ju lutem kyçuni përsëri',
  [ErrorCode.AUTH_MISSING_TOKEN]: 'Ju duhet të kyçeni për të vazhduar',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Sesioni juaj ka skaduar. Ju lutem kyçuni përsëri',
  
  // Bus Tracking
  [ErrorCode.BUS_NO_BUSES_AVAILABLE]: 'Nuk ka autobus aktiv në këtë moment',
  [ErrorCode.BUS_INVALID_LOCATION]: 'Vendndodhja e autobusit nuk është e vlefshme',
  [ErrorCode.BUS_FETCH_FAILED]: 'Dështoi marrja e të dhënave të autobusëve',
  
  // Network
  [ErrorCode.NETWORK_CONNECTION_FAILED]: 'Lidhja me serverin dështoi. Kontrolloni internetin',
  [ErrorCode.NETWORK_TIMEOUT]: 'Kërkesa ka kaluar kohen e pritjes. Provoni përsëri',
  [ErrorCode.NETWORK_OFFLINE]: 'Jeni offline. Kontrolloni lidhjen me internetin',
  
  // Cache
  [ErrorCode.CACHE_UNAVAILABLE]: 'Nuk mund të ruhen të dhënat lokale',
  [ErrorCode.CACHE_CORRUPTED]: 'Të dhënat lokale janë të dëmtuara',
  
  // Validation
  [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Ju lutem vendosni një email të vlefshëm',
  [ErrorCode.VALIDATION_INVALID_PASSWORD]: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere',
  [ErrorCode.VALIDATION_PASSWORD_MISMATCH]: 'Fjalëkalimet nuk përputhen',
  
  // Generic
  [ErrorCode.UNKNOWN_ERROR]: 'Ndodhi një gabim. Ju lutem provoni përsëri',
};

/**
 * Create an ApplicationError from various error sources
 */
export function createError(
  code: ErrorCode,
  technicalMessage?: string,
  details?: any
): ApplicationError {
  const userMessage = ERROR_MESSAGES[code];
  const message = technicalMessage || userMessage;
  
  // Determine if error is recoverable based on code
  const recoverable = !code.startsWith('AUTH_') || code === ErrorCode.AUTH_INVALID_CREDENTIALS;

  return new ApplicationError(code, message, userMessage, recoverable, details);
}

/**
 * Parse HTTP errors and convert to ApplicationError
 */
export function parseHttpError(
  error: any,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
): ApplicationError {
  // Network errors
  if (error.message === 'Network request failed') {
    return createError(ErrorCode.NETWORK_CONNECTION_FAILED, error.message);
  }

  if (error.message?.includes('timeout')) {
    return createError(ErrorCode.NETWORK_TIMEOUT, error.message);
  }

  // API errors
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 401:
        return createError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Unauthorized');
      case 403:
        return createError(ErrorCode.AUTH_SESSION_EXPIRED, 'Forbidden');
      case 404:
        return createError(ErrorCode.BUS_NO_BUSES_AVAILABLE, 'Not found');
      case 429:
        return createError(
          ErrorCode.NETWORK_TIMEOUT,
          'Too many requests',
          { retryAfter: error.response.headers['retry-after'] }
        );
      case 500:
      case 502:
      case 503:
        return createError(
          ErrorCode.NETWORK_CONNECTION_FAILED,
          'Server error',
          { status }
        );
      default:
        return createError(defaultCode, error.message);
    }
  }

  return createError(defaultCode, error.message);
}

/**
 * Log error to console (development) or Sentry (production)
 */
export function logError(error: ApplicationError | Error): void {
  if (__DEV__) {
    console.error('Application Error:', {
      ...(error instanceof ApplicationError ? error.toJSON() : {}),
      message: error.message,
      stack: error.stack,
    });
  } else {
    // In production, send to Sentry
    try {
      const Sentry = require('@sentry/react-native');
      Sentry.captureException(error, {
        extra: error instanceof ApplicationError ? error.toJSON() : {},
      });
    } catch (e) {
      console.error('Failed to log to Sentry:', e);
    }
  }
}

/**
 * Legacy error handler for backward compatibility
 */
export function handleError(error: any): string {
  const appError = error instanceof ApplicationError 
    ? error 
    : parseHttpError(error);
  
  logError(appError);
  return appError.userMessage;
}