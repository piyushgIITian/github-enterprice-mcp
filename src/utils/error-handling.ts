import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Safely parse JSON with error handling
 * @param input JSON string to parse
 * @param errorMessage Custom error message
 * @returns Parsed JSON object
 */
export function safeJsonParse(input: string, errorMessage = 'Invalid JSON'): any {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new McpError(ErrorCode.InvalidParams, `${errorMessage}: ${(error as Error).message}`);
  }
}

/**
 * Safely stringify JSON with error handling
 * @param input Object to stringify
 * @param errorMessage Custom error message
 * @returns JSON string
 */
export function safeJsonStringify(input: any, errorMessage = 'Failed to stringify object'): string {
  try {
    return JSON.stringify(input);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `${errorMessage}: ${(error as Error).message}`);
  }
}

/**
 * Wrap async function execution with error handling
 * @param fn Async function to execute
 * @param errorMessage Custom error message
 * @returns Result of the function
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  errorMessage = 'Operation failed'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `${errorMessage}: ${(error as Error).message}`
    );
  }
}

/**
 * Wrap synchronous function execution with error handling
 * @param fn Function to execute
 * @param errorMessage Custom error message
 * @returns Result of the function
 */
export function tryCatch<T>(fn: () => T, errorMessage = 'Operation failed'): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `${errorMessage}: ${(error as Error).message}`
    );
  }
}

/**
 * Convert a base64 string to UTF-8
 * @param base64 Base64 string
 * @returns UTF-8 string
 */
export function base64ToUtf8(base64: string): string {
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to decode base64 string: ${(error as Error).message}`
    );
  }
}

/**
 * Convert a UTF-8 string to base64
 * @param utf8 UTF-8 string
 * @returns Base64 string
 */
export function utf8ToBase64(utf8: string): string {
  try {
    return Buffer.from(utf8, 'utf-8').toString('base64');
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to encode string to base64: ${(error as Error).message}`
    );
  }
}

/**
 * Validate required environment variables
 * @param variables Array of required environment variable names
 * @throws McpError if any required variable is missing
 */
export function validateEnvVariables(variables: string[]): void {
  const missing = variables.filter(variable => !process.env[variable]);
  if (missing.length > 0) {
    throw new McpError(
      ErrorCode.ConfigurationError,
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
