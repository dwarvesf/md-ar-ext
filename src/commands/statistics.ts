import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
  displayStats, 
  exportStats,
  updatePendingTransactions,
  updateTransactionStatus
} from '../utils/monitoring/statsTracker';

/**
 * Command handler for displaying statistics
 * @param context Extension context
 */
export async function handleDisplayStats(context: vscode.ExtensionContext): Promise<void> {
  await displayStats(context);
}

/**
 * Command handler for exporting statistics
 * @param context Extension context
 */
export async function handleExportStats(context: vscode.ExtensionContext): Promise<void> {
  // Allow user to choose format
  const formatOptions = [
    { label: 'JSON', description: 'Export as JSON format (detailed data)' },
    { label: 'CSV', description: 'Export as CSV format (spreadsheet compatible)' }
  ];
  
  const selectedFormat = await vscode.window.showQuickPick(formatOptions, {
    placeHolder: 'Select export format',
    title: 'Export Statistics'
  });
  
  if (!selectedFormat) {
    return;
  }
  
  await exportStats(context, selectedFormat.label.toLowerCase() as 'json' | 'csv');
}

/**
 * Command handler for verifying all pending transactions
 * @param context Extension context
 */
export async function handleVerifyTransactions(context: vscode.ExtensionContext): Promise<void> {
  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Checking transaction status',
      cancellable: false
    }, async (progress) => {
      progress.report({ message: 'Checking Arweave network for transaction confirmations...' });
      await updatePendingTransactions(context);
      progress.report({ message: 'Done!' });
    });
    
    vscode.window.showInformationMessage('Transaction status check completed.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to verify transactions: ${errorMessage}`);
  }
} 