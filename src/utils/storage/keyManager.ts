import * as vscode from 'vscode';
import * as fs from 'fs';
import { getWalletAddress } from '../processing/arweaveUploader';

const ARWEAVE_KEY_SECRET = 'arweavePrivateKey';

/**
 * Validates an Arweave key to ensure it's properly formatted and usable
 * @param keyString JSON string of Arweave key
 * @returns Object with validation result and error message if any
 */
export async function validateArweaveKey(keyString: string): Promise<{ valid: boolean; message?: string; address?: string }> {
  try {
    // Try to parse as JSON
    const keyObj = JSON.parse(keyString);
    
    // Check if the key has the expected structure
    if (!keyObj || typeof keyObj !== 'object') {
      return { valid: false, message: 'Key is not a valid JSON object' };
    }
    
    // Check for required RSA key properties
    if (!keyObj.kty || keyObj.kty !== 'RSA') {
      return { valid: false, message: 'Key is not a valid RSA key (missing or invalid "kty" property)' };
    }
    
    // Check for required key components
    const requiredProps = ['d', 'n', 'e', 'p', 'q'];
    const missingProps = requiredProps.filter(prop => !keyObj[prop]);
    
    if (missingProps.length > 0) {
      return { valid: false, message: `Key is missing required RSA properties: ${missingProps.join(', ')}` };
    }
    
    // Try to get the address to verify it's a working key
    try {
      const address = await getWalletAddress(keyObj);
      if (!address || address.length < 20) {
        return { valid: false, message: 'Unable to derive a valid wallet address' };
      }
      
      return { valid: true, address };
    } catch (e) {
      return { valid: false, message: 'Error validating key with Arweave: ' + (e instanceof Error ? e.message : String(e)) };
    }
  } catch (e) {
    return { valid: false, message: 'Invalid JSON format: ' + (e instanceof Error ? e.message : String(e)) };
  }
}

/**
 * Retrieves the stored Arweave private key from SecretStorage
 * @param context VSCode extension context
 * @returns Promise resolving to the private key or undefined if not found
 */
export async function getPrivateKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  return context.secrets.get(ARWEAVE_KEY_SECRET);
}

/**
 * Prompts user for Arweave private key and stores it in SecretStorage
 * @param context VSCode extension context
 * @returns Promise resolving to the private key or undefined if user cancels
 */
export async function promptAndStorePrivateKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const privateKey = await vscode.window.showInputBox({
    prompt: 'Enter your Arweave private key (JSON string from wallet file)',
    placeHolder: '{"kty":"RSA", ...}',
    password: true,
    ignoreFocusOut: true
  });

  if (privateKey) {
    const validation = await validateArweaveKey(privateKey);
    
    if (validation.valid) {
      await context.secrets.store(ARWEAVE_KEY_SECRET, privateKey);
      
      // Show wallet address with copy option
      if (validation.address) {
        const message = `Arweave private key stored securely.\nWallet Address: ${validation.address}`;
        const result = await vscode.window.showInformationMessage(
          message,
          'Copy Address'
        );
        
        if (result === 'Copy Address') {
          await vscode.env.clipboard.writeText(validation.address);
          vscode.window.showInformationMessage('Wallet address copied to clipboard.');
        }
      } else {
        vscode.window.showInformationMessage('Arweave private key stored securely.');
      }
      
      return privateKey;
    } else {
      vscode.window.showErrorMessage(`Invalid Arweave key: ${validation.message}`);
      return undefined;
    }
  } else {
    vscode.window.showErrorMessage('Arweave private key required to proceed.');
    return undefined;
  }
}

/**
 * Gets stored key or prompts for a new one if not found
 * @param context VSCode extension context
 * @returns Promise resolving to the private key or undefined if not available
 */
export async function getOrPromptForPrivateKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  let privateKey = await getPrivateKey(context);
  if (!privateKey) {
    privateKey = await promptAndStorePrivateKey(context);
  }
  return privateKey;
}

/**
 * Updates the stored Arweave private key
 * @param context VSCode extension context
 * @returns Promise resolving to boolean indicating success
 */
export async function updatePrivateKey(context: vscode.ExtensionContext): Promise<boolean> {
  const newKey = await vscode.window.showInputBox({
    prompt: 'Enter new Arweave private key (JSON string)',
    placeHolder: '{"kty":"RSA", ...}',
    password: true
  });

  if (newKey) {
    const validation = await validateArweaveKey(newKey);
    
    if (validation.valid) {
      await context.secrets.store(ARWEAVE_KEY_SECRET, newKey);
      vscode.window.showInformationMessage('Arweave private key updated.');
      return true;
    } else {
      vscode.window.showErrorMessage(`Invalid Arweave key: ${validation.message}`);
      return false;
    }
  }
  return false;
}

/**
 * Imports an Arweave key from a file
 * @param context VSCode extension context
 * @returns Promise resolving to boolean indicating success
 */
export async function importKeyFromFile(context: vscode.ExtensionContext): Promise<boolean> {
  // Prompt for file
  const fileUris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
      jsonFiles: ['json'],
      allFiles: ['*']
    },
    title: 'Select Arweave Keyfile'
  });
  
  if (!fileUris || fileUris.length === 0) {
    return false;
  }
  
  try {
    // Read key file
    const keyData = fs.readFileSync(fileUris[0].fsPath, 'utf8');
    
    // Validate key
    const validation = await validateArweaveKey(keyData);
    
    if (validation.valid) {
      // Store key
      await context.secrets.store(ARWEAVE_KEY_SECRET, keyData);
      vscode.window.showInformationMessage('Arweave private key imported and stored securely.');
      return true;
    } else {
      vscode.window.showErrorMessage(`Invalid Arweave key file: ${validation.message}`);
      return false;
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error reading key file: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Displays address for the current wallet
 * @param context VSCode extension context
 * @returns Promise resolving to wallet address or undefined if not available
 */
export async function showWalletAddress(context: vscode.ExtensionContext): Promise<string | undefined> {
  const privateKey = await getPrivateKey(context);
  
  if (!privateKey) {
    vscode.window.showErrorMessage('No Arweave key is currently stored.');
    return undefined;
  }
  
  try {
    const keyObj = JSON.parse(privateKey);
    const address = await getWalletAddress(keyObj);
    
    // Show address with copy and view on Viewblock options
    const result = await vscode.window.showInformationMessage(
      `Wallet Address: ${address}`, 
      'Copy to Clipboard',
      'View on Viewblock'
    );
    
    if (result === 'Copy to Clipboard') {
      await vscode.env.clipboard.writeText(address);
      vscode.window.showInformationMessage('Wallet address copied to clipboard.');
    } else if (result === 'View on Viewblock') {
      // Open Viewblock explorer in browser
      const url = `https://viewblock.io/arweave/address/${address}`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
    
    return address;
  } catch (error) {
    vscode.window.showErrorMessage(`Error retrieving wallet address: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

/**
 * Deletes the stored Arweave private key
 * @param context VSCode extension context
 */
export async function deletePrivateKey(context: vscode.ExtensionContext): Promise<void> {
  const confirmation = await vscode.window.showWarningMessage(
    'Are you sure you want to delete your stored Arweave private key?',
    'Yes, Delete',
    'Cancel'
  );
  
  if (confirmation === 'Yes, Delete') {
    await context.secrets.delete(ARWEAVE_KEY_SECRET);
    vscode.window.showInformationMessage('Arweave private key deleted.');
  }
} 