import * as vscode from 'vscode';

/**
 * Log levels for the extension
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Extension logger class to centralize all logging
 */
export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private _logLevel: LogLevel = LogLevel.INFO;
  
  /**
   * Create a new logger instance
   * @param channelName Name of the output channel
   */
  private constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }
  
  /**
   * Get or create the logger instance
   * @param channelName Name of the output channel
   * @returns Logger instance
   */
  public static getInstance(channelName: string = 'MD-AR-EXT'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(channelName);
    }
    return Logger.instance;
  }
  
  /**
   * Get the output channel
   */
  public get channel(): vscode.OutputChannel {
    return this.outputChannel;
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
  private formatMessage(message: string, category?: string): string {
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
    if (this._logLevel <= LogLevel.DEBUG) {
      const formattedMessage = this.formatMessage(message, category || 'DEBUG');
      this.outputChannel.appendLine(formattedMessage);
      console.debug(formattedMessage);
    }
  }
  
  /**
   * Log an info message
   * @param message Message to log
   * @param category Optional category
   */
  public info(message: string, category?: string): void {
    if (this._logLevel <= LogLevel.INFO) {
      const formattedMessage = this.formatMessage(message, category || 'INFO');
      this.outputChannel.appendLine(formattedMessage);
      console.info(formattedMessage);
    }
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   * @param category Optional category
   */
  public warn(message: string, category?: string): void {
    if (this._logLevel <= LogLevel.WARN) {
      const formattedMessage = this.formatMessage(message, category || 'WARN');
      this.outputChannel.appendLine(formattedMessage);
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
    if (this._logLevel <= LogLevel.ERROR) {
      const errorDetails = error instanceof Error 
        ? `\n${error.message}\n${error.stack || ''}`
        : error 
          ? `\n${String(error)}`
          : '';
      
      const formattedMessage = this.formatMessage(
        `${message}${errorDetails}`, 
        category || 'ERROR'
      );
      
      this.outputChannel.appendLine(formattedMessage);
      console.error(formattedMessage);
    }
  }
  
  /**
   * Show the output channel
   * @param preserveFocus Whether to preserve focus in the editor
   */
  public show(preserveFocus: boolean = false): void {
    this.outputChannel.show(preserveFocus);
  }
  
  /**
   * Hide the output channel
   */
  public hide(): void {
    this.outputChannel.hide();
  }
  
  /**
   * Clear the output channel
   */
  public clear(): void {
    this.outputChannel.clear();
  }
  
  /**
   * Dispose the output channel
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 