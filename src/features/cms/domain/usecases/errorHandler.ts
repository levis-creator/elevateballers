/**
 * Error handling utilities for CMS
 */

export class CMSError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'CMSError';
  }
}

export function handleAPIError(error: unknown): { message: string; status: number } {
  if (error instanceof CMSError) {
    return {
      message: error.message,
      status: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

