import * as vscode from 'vscode';

/**
 * Custom error types for the extension
 */
export enum ErrorType {
  // General errors
  GENERAL = 'GENERAL',
  VALIDATION = 'VALIDATION',
  DEPENDENCY = 'DEPENDENCY',
  
  // Image processing errors
  IMAGE_PROCESSING = 'IMAGE_PROCESSING',
  IMAGE_FORMAT = 'IMAGE_FORMAT',
  IMAGE_RESIZE = 'IMAGE_RESIZE',
  
  // Arweave errors
  ARWEAVE_CONNECTION = 'ARWEAVE_CONNECTION',
  ARWEAVE_TRANSACTION = 'ARWEAVE_TRANSACTION',
  ARWEAVE_WALLET = 'ARWEAVE_WALLET',
  ARWEAVE_BALANCE = 'ARWEAVE_BALANCE',
  
  // File system errors
  FILE_READ = 'FILE_READ',
  FILE_WRITE = 'FILE_WRITE',
  FILE_ACCESS = 'FILE_ACCESS',
  
  // Settings errors
  SETTINGS_VALIDATION = 'SETTINGS_VALIDATION',
  SETTINGS_ACCESS = 'SETTINGS_ACCESS',
  
  // Network errors
  NETWORK_REQUEST = 'NETWORK_REQUEST',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_RESPONSE = 'NETWORK_RESPONSE',
  
  // User input errors
  USER_INPUT = 'USER_INPUT',
  USER_CANCEL = 'USER_CANCEL'
}

/**
 * Extension-specific error with type and actionable information
 */
export class ExtensionError extends Error {
  type: ErrorType;
  details?: any;
  actionable: boolean;
  actionText?: string;
  actionCallback?: () => Promise<void>;
  
  constructor(
    message: string, 
    type: ErrorType = ErrorType.GENERAL, 
    details?: any,
    actionable: boolean = false,
    actionText?: string,
    actionCallback?: () => Promise<void>
  ) {
    super(message);
    this.name = 'ExtensionError';
    this.type = type;
    this.details = details;
    this.actionable = actionable;
    this.actionText = actionText;
    this.actionCallback = actionCallback;
    
    // Maintains proper stack trace for where error was thrown
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Get a user-friendly error message
   */
  get userMessage(): string {
    return this.message;
  }
  
  /**
   * Get a detailed developer message including error type
   */
  get devMessage(): string {
    return `[${this.type}] ${this.message}${this.details ? ` - ${JSON.stringify(this.details)}` : ''}`;
  }
}

/**
 * Log an error to the extension output channel
 * @param error Error to log
 * @param outputChannel VS Code output channel
 */
export function logError(error: Error | ExtensionError | unknown, outputChannel?: vscode.OutputChannel): void {
  const timestamp = new Date().toISOString();
  
  // Create a standardized error message
  let errorMessage: string;
  
  if (error instanceof ExtensionError) {
    errorMessage = `[${timestamp}] ${error.devMessage}\n${error.stack || ''}`;
  } else if (error instanceof Error) {
    errorMessage = `[${timestamp}] [UNKNOWN] ${error.message}\n${error.stack || ''}`;
  } else {
    errorMessage = `[${timestamp}] [UNKNOWN] ${String(error)}`;
  }
  
  // Log to output channel if available
  if (outputChannel) {
    outputChannel.appendLine(errorMessage);
  }
  
  // Log to console for debugging
  console.error(errorMessage);
}

/**
 * Show error message to user with optional action button
 * @param error Error to show
 * @param customMessage Optional custom message to override the error message
 * @returns Promise resolving to the selected action (if any)
 */
export async function showError(
  error: Error | ExtensionError | unknown, 
  customMessage?: string
): Promise<string | undefined> {
  let message: string;
  let actionText: string | undefined;
  let actionCallback: (() => Promise<void>) | undefined;
  
  if (error instanceof ExtensionError) {
    message = customMessage || error.userMessage;
    actionText = error.actionable ? (error.actionText || 'Fix It') : undefined;
    actionCallback = error.actionCallback;
  } else if (error instanceof Error) {
    message = customMessage || error.message;
  } else {
    message = customMessage || String(error);
  }
  
  // Show error message with optional action button
  const result = actionText
    ? await vscode.window.showErrorMessage(message, actionText)
    : await vscode.window.showErrorMessage(message);
  
  // Handle action button click
  if (result === actionText && actionCallback) {
    try {
      await actionCallback();
    } catch (err) {
      // Don't recursively call showError to avoid infinite loops
      console.error('Error in action callback:', err);
      await vscode.window.showErrorMessage('An error occurred while trying to fix the issue.');
    }
  }
  
  return result;
}

/**
 * Create a dependency error with installation instructions
 * @param dependencyName Name of the missing dependency
 * @param installationGuide Installation guide text
 * @param checkCommand Command to check if available
 * @returns ExtensionError for the dependency
 */
export function createDependencyError(
  dependencyName: string,
  installationGuide: string,
  checkCommand?: string
): ExtensionError {
  return new ExtensionError(
    `Required dependency "${dependencyName}" is not installed or not available.`,
    ErrorType.DEPENDENCY,
    { dependency: dependencyName, checkCommand },
    true,
    'Show Installation Guide',
    async () => {
      const doc = await vscode.workspace.openTextDocument({
        content: `# Installing ${dependencyName}\n\n${installationGuide}`,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(doc);
    }
  );
}

/**
 * Create a network error with retry option
 * @param message Error message
 * @param details Error details
 * @param retryCallback Callback to retry the operation
 * @returns ExtensionError for the network issue
 */
export function createNetworkError(
  message: string,
  details?: any,
  retryCallback?: () => Promise<void>
): ExtensionError {
  return new ExtensionError(
    message,
    ErrorType.NETWORK_REQUEST,
    details,
    !!retryCallback,
    'Retry',
    retryCallback
  );
}

/**
 * Handle an error with logging and user notification
 * @param error Error to handle
 * @param outputChannel VS Code output channel
 * @param customMessage Optional custom message to show to user
 */
export async function handleError(
  error: Error | ExtensionError | unknown,
  outputChannel?: vscode.OutputChannel,
  customMessage?: string
): Promise<void> {
  // Log the error
  logError(error, outputChannel);
  
  // Show error to user
  await showError(error, customMessage);
} 