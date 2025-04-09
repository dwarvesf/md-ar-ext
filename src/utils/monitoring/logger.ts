import * as vscode from 'vscode';

/**
 * Log levels for the extension
 */
export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3
}

/**
 * Extension logger class to centralize all logging
 */
export class Logger {
  private static _instance: Logger;
  private _outputChannel: vscode.OutputChannel;
  private _logLevel: LogLevel = LogLevel.info;
  
  /**
   * Create a new logger instance
   * @param channelName Name of the output channel
   */
  private constructor(channelName: string) {
    this._outputChannel = vscode.window.createOutputChannel(channelName);
  }
  
  /**
   * Get or create the logger instance
   * @param channelName Name of the output channel
   * @returns Logger instance
   */
  public static getInstance(channelName: string = 'MD-AR-EXT'): Logger {
    if (!Logger._instance) {
      Logger._instance = new Logger(channelName);
    }
    return Logger._instance;
  }
  
  /**
   * Get the output channel
   */
  public get channel(): vscode.OutputChannel {
    return this._outputChannel;
  }
  
  /**
   * Set the log level
   */
  public set logLevel(level: LogLevel) {
    this._logLevel = level;
    this.info(`Log level set to ${LogLevel[level]}`);
  }
  
  /**
   * Get the current log level
   */
  public get logLevel(): LogLevel {
    return this._logLevel;
  }
  
  /**
   * Format a log message with timestamp and category
   * @param message Message to format
   * @param category Optional category
   * @returns Formatted message
   */
  private _formatMessage(message: string, category?: string): string {
    const timestamp = new Date().toISOString();
    return category
      ? `[${timestamp}] [${category}] ${message}`
      : `[${timestamp}] ${message}`;
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param category Optional category
   */
  public debug(message: string, category?: string): void {
    if (this._logLevel <= LogLevel.debug) {
      const formattedMessage = this._formatMessage(message, category || 'DEBUG');
      this._outputChannel.appendLine(formattedMessage);
      console.debug(formattedMessage);
    }
  }
  
  /**
   * Log an info message
   * @param message Message to log
   * @param category Optional category
   */
  public info(message: string, category?: string): void {
    if (this._logLevel <= LogLevel.info) {
      const formattedMessage = this._formatMessage(message, category || 'INFO');
      this._outputChannel.appendLine(formattedMessage);
      console.info(formattedMessage);
    }
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   * @param category Optional category
   */
  public warn(message: string, category?: string): void {
    if (this._logLevel <= LogLevel.warn) {
      const formattedMessage = this._formatMessage(message, category || 'WARN');
      this._outputChannel.appendLine(formattedMessage);
      console.warn(formattedMessage);
    }
  }
  
  /**
   * Log an error message
   * @param message Message to log
   * @param error Optional error object
   * @param category Optional category
   */
  public error(message: string, error?: Error | unknown, category?: string): void {
    if (this._logLevel <= LogLevel.error) {
      const errorDetails = error instanceof Error 
        ? `\n${error.message}\n${error.stack || ''}`
        : error 
          ? `\n${String(error)}`
          : '';
      
      const formattedMessage = this._formatMessage(
        `${message}${errorDetails}`, 
        category || 'ERROR'
      );
      
      this._outputChannel.appendLine(formattedMessage);
      console.error(formattedMessage);
    }
  }
  
  /**
   * Show the output channel
   * @param preserveFocus Whether to preserve focus in the editor
   */
  public show(preserveFocus: boolean = false): void {
    this._outputChannel.show(preserveFocus);
  }
  
  /**
   * Hide the output channel
   */
  public hide(): void {
    this._outputChannel.hide();
  }
  
  /**
   * Clear the output channel
   */
  public clear(): void {
    this._outputChannel.clear();
  }
  
  /**
   * Dispose the output channel
   */
  public dispose(): void {
    this._outputChannel.dispose();
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 