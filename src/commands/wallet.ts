import * as vscode from 'vscode';
import { 
  getOrPromptForPrivateKey, 
  updatePrivateKey, 
  deletePrivateKey,
  importKeyFromFile,
  showWalletAddress,
  validateArweaveKey
} from '../utils/storage/keyManager';

import { 
  checkWalletBalance, 
  estimateUploadCost 
} from '../utils/processing/arweaveUploader';

/**
 * Command handler for updating the Arweave private key
 * @param context Extension context
 */
export async function handleUpdatePrivateKey(context: vscode.ExtensionContext): Promise<void> {
  await updatePrivateKey(context);
}

/**
 * Command handler for deleting the Arweave private key
 * @param context Extension context
 */
export async function handleDeletePrivateKey(context: vscode.ExtensionContext): Promise<void> {
  await deletePrivateKey(context);
}

/**
 * Command handler for importing the Arweave key from a file
 * @param context Extension context
 */
export async function handleImportKeyFromFile(context: vscode.ExtensionContext): Promise<void> {
  await importKeyFromFile(context);
}

/**
 * Command handler for showing the wallet address
 * @param context Extension context
 */
export async function handleShowWalletAddress(context: vscode.ExtensionContext): Promise<void> {
  await showWalletAddress(context);
}

/**
 * Command handler for checking the wallet balance
 * @param context Extension context
 */
export async function handleCheckBalance(context: vscode.ExtensionContext): Promise<void> {
  try {
    const privateKeyJson = await getOrPromptForPrivateKey(context);
    if (!privateKeyJson) return;
    
    // Validate key format
    const validation = await validateArweaveKey(privateKeyJson);
    if (!validation.valid) {
      vscode.window.showErrorMessage(`Invalid Arweave key format: ${validation.message}`);
      return;
    }
    
    const wallet = JSON.parse(privateKeyJson);
    
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Checking Arweave Wallet Balance',
      cancellable: false
    }, async (progress) => {
      progress.report({ message: 'Connecting to Arweave...' });
      
      const balance = await checkWalletBalance(wallet);
      
      // Try to get USD equivalent if possible
      try {
        const sampleUploadCost = await estimateUploadCost(1024 * 1024); // 1MB sample
        if (sampleUploadCost.usd !== null) {
          // If we have USD conversion for the sample, we can calculate balance in USD
          const arToUsdRate = parseFloat(sampleUploadCost.usd) / parseFloat(sampleUploadCost.ar);
          const balanceAr = parseFloat(balance);
          const balanceUsd = (balanceAr * arToUsdRate).toFixed(2);
          
          vscode.window.showInformationMessage(
            `Current Arweave balance: ${balance} AR (approx. $${balanceUsd} USD)`
          );
          return;
        }
      } catch (error) {
        // Silently fail USD conversion
      }
      
      // Fallback to AR only
      vscode.window.showInformationMessage(`Current Arweave balance: ${balance} AR`);
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to check balance: ${errorMessage}`);
  }
}

/**
 * Command handler for getting wallet transaction history
 * This is a new feature to show recent transactions
 * @param context Extension context
 */
export async function handleWalletHistory(context: vscode.ExtensionContext): Promise<void> {
  try {
    const privateKeyJson = await getOrPromptForPrivateKey(context);
    if (!privateKeyJson) return;
    
    // Validate key format
    const validation = await validateArweaveKey(privateKeyJson);
    if (!validation.valid) {
      vscode.window.showErrorMessage(`Invalid Arweave key format: ${validation.message}`);
      return;
    }
    
    const wallet = JSON.parse(privateKeyJson);
    
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Fetching Wallet History',
      cancellable: true
    }, async (progress, token) => {
      progress.report({ message: 'Connecting to Arweave...' });
      
      // This is a placeholder for future implementation
      // In the actual implementation, we would use the Arweave GraphQL API
      // to fetch transaction history
      
      if (token.isCancellationRequested) {
        return;
      }
      
      progress.report({ message: 'Retrieving transaction history...' });
      
      // For now, just show a message that this feature is coming soon
      vscode.window.showInformationMessage(
        'Wallet transaction history feature will be implemented in a future update.'
      );
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to fetch wallet history: ${errorMessage}`);
  }
} 