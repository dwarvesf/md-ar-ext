import * as vscode from 'vscode';

// Logger
import { logger, LogLevel } from './utils/monitoring/logger';

// Command handlers
import { 
  handlePasteImage, 
  handleUploadImage, 
  processImageOnly,
  checkImageMagickInstallation
} from './commands/image';

import { 
  handleUpdatePrivateKey, 
  handleDeletePrivateKey,
  handleImportKeyFromFile,
  handleShowWalletAddress,
  handleCheckBalance,
  handleWalletHistory
} from './commands/wallet';

import { 
  handleOpenSettings,
  handleQuickConfigureSettings,
  handleShowSettingsUI,
  handleExportSettings,
  handleImportSettings
} from './commands/settings';

import { 
  handleDisplayStats,
  handleExportStats,
  handleVerifyTransactions
} from './commands/statistics';

// Utils
import { checkImageMagickInstalled } from './utils/processing/imageProcessor';
import { handleError, ExtensionError, ErrorType } from './utils/monitoring/errorHandler';

// Extend the Clipboard interface to include readImage
declare module 'vscode' {
  export interface Clipboard {
    readImage(): Thenable<Uint8Array>;
  }
}

/**
 * Extension state
 */
export interface ExtensionState {
  initialized: boolean;
  debugMode: boolean;
}

// Global extension state
const extensionState: ExtensionState = {
  initialized: false,
  debugMode: false
};

/**
 * Activate the extension
 * @param context Extension context
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    logger.info('Activating md-ar-ext extension...', 'EXTENSION');
    
    // Initialize extension state
    extensionState.debugMode = context.extensionMode === vscode.ExtensionMode.Development;
    
    // Set appropriate log level based on mode
    if (extensionState.debugMode) {
      logger.logLevel = LogLevel.debug;
      logger.debug('Debug mode enabled', 'EXTENSION');
    }
    
    // Register image commands
    registerCommand(context, 'md-ar-ext.pasteAndInsert', () => handlePasteImage(context));
    registerCommand(context, 'md-ar-ext.uploadAndInsert', () => handleUploadImage(context));
    registerCommand(context, 'md-ar-ext.processImage', () => processImageOnly(context));
    registerCommand(context, 'md-ar-ext.checkImageMagick', () => checkImageMagickInstallation());
    
    // Register wallet commands
    registerCommand(context, 'md-ar-ext.updatePrivateKey', () => handleUpdatePrivateKey(context));
    registerCommand(context, 'md-ar-ext.deletePrivateKey', () => handleDeletePrivateKey(context));
    registerCommand(context, 'md-ar-ext.importKeyFromFile', () => handleImportKeyFromFile(context));
    registerCommand(context, 'md-ar-ext.showWalletAddress', () => handleShowWalletAddress(context));
    registerCommand(context, 'md-ar-ext.checkBalance', () => handleCheckBalance(context));
    registerCommand(context, 'md-ar-ext.walletHistory', () => handleWalletHistory(context));
    
    // Register settings commands
    registerCommand(context, 'md-ar-ext.openSettings', () => handleOpenSettings());
    registerCommand(context, 'md-ar-ext.configureSettings', () => handleQuickConfigureSettings());
    registerCommand(context, 'md-ar-ext.showSettingsUI', () => handleShowSettingsUI());
    registerCommand(context, 'md-ar-ext.exportSettings', () => handleExportSettings());
    registerCommand(context, 'md-ar-ext.importSettings', () => handleImportSettings());
    
    // Register statistics commands
    registerCommand(context, 'md-ar-ext.viewStatistics', () => handleDisplayStats(context));
    registerCommand(context, 'md-ar-ext.exportStats', () => handleExportStats(context));
    registerCommand(context, 'md-ar-ext.verifyTransactions', () => handleVerifyTransactions(context));
    
    // Register clipboard handler for paste events
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand('md-ar-ext.handlePaste', async (editor) => {
        try {
          // Only handle paste in markdown documents
          if (editor.document.languageId !== 'markdown') {
            return;
          }
          
          await handlePasteImage(context);
        } catch (error) {
          await handleError(error, logger.channel);
        }
      })
    );
    
    // Verify ImageMagick is installed at startup
    const checkDependencies = vscode.workspace.getConfiguration('md-ar-ext').get('autoCheckDependencies', true);
    
    if (checkDependencies) {
      logger.debug('Checking ImageMagick installation...', 'EXTENSION');
      
      const installed = await checkImageMagickInstalled();
      if (!installed) {
        const error = new ExtensionError(
          'ImageMagick is required but does not appear to be installed.',
          ErrorType.dependency,
          undefined,
          true,
          'Show Installation Instructions',
          () => checkImageMagickInstallation()
        );
        await handleError(error, logger.channel);
      } else {
        logger.info('ImageMagick is installed.', 'EXTENSION');
      }
    }
    
    // Mark as initialized
    extensionState.initialized = true;
    logger.info('md-ar-ext extension activated successfully.', 'EXTENSION');
  } catch (error) {
    logger.error('Failed to activate extension:', error, 'EXTENSION');
    
    // Show error notification
    await handleError(
      error, 
      logger.channel, 
      'Failed to activate md-ar-ext extension. See output panel for details.'
    );
  }
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
  logger.info('md-ar-ext extension deactivated.', 'EXTENSION');
  
  // Clean up resources
  logger.dispose();
}

/**
 * Helper function to register a command with error handling
 * @param context Extension context
 * @param command Command ID
 * @param callback Command callback
 */
function registerCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: (...args: any[]) => any
): void {
  const wrappedCallback = async (...args: any[]) => {
    try {
      logger.debug(`Executing command: ${command}`, 'COMMAND');
      return await callback(...args);
    } catch (error) {
      logger.error(`Error executing command ${command}:`, error, 'COMMAND');
      await handleError(error, logger.channel);
      return undefined;
    }
  };
  
  const disposable = vscode.commands.registerCommand(command, wrappedCallback);
  context.subscriptions.push(disposable);
  logger.debug(`Registered command: ${command}`, 'EXTENSION');
}