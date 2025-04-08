import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Import utility modules
import { 
  isImageFile, 
  processImage, 
  checkImageMagickInstalled,
  showImageMagickInstallInstructions
} from './utils/imageProcessor';

import { 
  uploadToArweave, 
  getArweaveUrl, 
  createMarkdownLink, 
  checkWalletBalance, 
  checkBalanceSufficient,
  estimateUploadCost,
  formatFileSize,
  verifyTransaction
} from './utils/arweaveUploader';

import { 
  getOrPromptForPrivateKey, 
  updatePrivateKey, 
  deletePrivateKey,
  importKeyFromFile,
  showWalletAddress
} from './utils/keyManager';

import { 
  withProgress, 
  withCancellableProgress, 
  createTimeEstimateProgressHandler 
} from './utils/progressIndicator';

import { 
  trackUpload, 
  displayStats, 
  exportStats 
} from './utils/statsTracker';

import { 
  quickConfigureSettings, 
  openSettings,
  showSettingsUI,
  getSetting
} from './utils/settingsManager';

// Extend the Clipboard interface to include readImage
declare module 'vscode' {
  export interface Clipboard {
    readImage(): Thenable<Uint8Array>;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Register key management commands
  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.updatePrivateKey', async () => {
      await updatePrivateKey(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.deletePrivateKey', async () => {
      await deletePrivateKey(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.importKeyFromFile', async () => {
      await importKeyFromFile(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.showWalletAddress', async () => {
      await showWalletAddress(context);
    })
  );

  // Register statistics commands
  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.viewStatistics', async () => {
      await displayStats(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.exportStats', async () => {
      await exportStats(context);
    })
  );

  // Register settings commands
  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.configureSettings', async () => {
      await quickConfigureSettings();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.showSettingsUI', async () => {
      await showSettingsUI();
    })
  );

  // Register balance check command
  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.checkBalance', async () => {
      try {
        const privateKeyJson = await getOrPromptForPrivateKey(context);
        if (!privateKeyJson) return;
        
        const wallet = JSON.parse(privateKeyJson);
        const balance = await checkWalletBalance(wallet);
        
        vscode.window.showInformationMessage(`Current Arweave balance: ${balance} AR`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to check balance: ${errorMessage}`);
      }
    })
  );

  // Verify ImageMagick is installed at startup
  checkImageMagickInstalled().then(installed => {
    if (!installed) {
      vscode.window.showWarningMessage(
        'ImageMagick is required for image processing but does not appear to be installed.',
        'Show Installation Instructions'
      ).then(selection => {
        if (selection === 'Show Installation Instructions') {
          showImageMagickInstallInstructions();
        }
      });
    }
  });

  // Shared upload logic for drag-and-drop and paste
  async function uploadAndInsertImage(filePath: string, editor: vscode.TextEditor) {
    // Check if file is a valid image
    try {
      const isValid = await isImageFile(filePath);
      if (!isValid) {
        vscode.window.showErrorMessage('Please use a valid image file (PNG, JPG, JPEG, GIF - no videos or animated GIFs)');
        return;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error validating file: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    let processedFilePath = '';
    let wallet: any = null;
    let isCancelled = false;

    try {
      // Process with cancellable progress indicator
      await withCancellableProgress('Processing and uploading image', async (progress, token) => {
        // Set up cancellation
        token.onCancellationRequested(() => {
          isCancelled = true;
          vscode.window.showInformationMessage('Operation cancelled');
          throw new Error('Operation cancelled by user');
        });

        // Get private key
        progress.report({ message: 'Getting credentials...', increment: 5 });
        const privateKeyJson = await getOrPromptForPrivateKey(context);
        if (!privateKeyJson) return;
        
        // Parse the wallet
        try {
          wallet = JSON.parse(privateKeyJson);
        } catch (error) {
          throw new Error('Invalid Arweave key format. Please update your key.');
        }

        // Get file info
        const fileStats = fs.statSync(filePath);
        const fileSizeBytes = fileStats.size;
        const fileName = path.basename(filePath, path.extname(filePath));
        
        progress.report({ message: `Processing ${formatFileSize(fileSizeBytes)} image...`, increment: 5 });
        
        // Check balance if setting enabled
        if (getSetting('checkBalanceBeforeUpload', true)) {
          // Estimate upload cost and check balance
          progress.report({ message: 'Checking wallet balance...', increment: 5 });
          const balanceCheck = await checkBalanceSufficient(wallet, fileSizeBytes);
          
          if (!balanceCheck.sufficient) {
            const proceed = await vscode.window.showWarningMessage(
              `Your wallet balance (${balanceCheck.balance} AR) may be insufficient for this upload (est. ${balanceCheck.required} AR). Continue anyway?`,
              'Continue', 'Cancel'
            );
            
            if (proceed !== 'Continue') {
              throw new Error('Upload cancelled due to insufficient balance');
            }
          }
        }

        // Process image
        progress.report({ message: 'Processing image...', increment: 20 });
        processedFilePath = await processImage(filePath);
        
        if (token.isCancellationRequested) {
          isCancelled = true;
          return;
        }

        // Get the size of the processed file for time estimation
        const processedFileStats = fs.statSync(processedFilePath);
        const uploadSizeBytes = processedFileStats.size;
        
        // Show file size reduction if applicable
        if (uploadSizeBytes < fileSizeBytes) {
          const reduction = (100 - (uploadSizeBytes / fileSizeBytes * 100)).toFixed(1);
          progress.report({ 
            message: `Image optimized: ${formatFileSize(fileSizeBytes)} → ${formatFileSize(uploadSizeBytes)} (${reduction}% smaller)`,
            increment: 5
          });
          
          // Short pause so user can see the optimization results
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Create time estimate progress handler if enabled
        const useDetailedProgress = getSetting('showUploadProgress', true);
        const timeProgress = useDetailedProgress ? 
          createTimeEstimateProgressHandler(uploadSizeBytes) : null;

        // Upload to Arweave
        progress.report({ message: 'Starting upload to Arweave...', increment: 10 });
        
        // Use setTimeout to give the UI time to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (token.isCancellationRequested) {
          isCancelled = true;
          return;
        }
        
        // Start upload
        const startTime = Date.now();
        const transactionId = await uploadToArweave(processedFilePath, wallet);
        const uploadTime = (Date.now() - startTime) / 1000;
        
        // Complete with time info
        if (timeProgress) {
          timeProgress.complete(progress, `Upload complete in ${uploadTime.toFixed(1)}s`);
        } else {
          progress.report({ message: `Upload complete in ${uploadTime.toFixed(1)}s`, increment: 40 });
        }
        
        // Verify the transaction was posted
        progress.report({ message: 'Verifying transaction...', increment: 5 });
        const verified = await verifyTransaction(transactionId);
        
        if (!verified) {
          progress.report({ message: 'Transaction may be pending confirmation...' });
        }
        
        // Create URL and Markdown link
        progress.report({ message: 'Inserting link...', increment: 5 });
        const arweaveUrl = getArweaveUrl(transactionId);
        const markdownLink = createMarkdownLink(fileName, arweaveUrl);

        // Insert Markdown link
        await editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, markdownLink);
        });

        // Track upload statistics
        const costEstimate = await estimateUploadCost(uploadSizeBytes);
        await trackUpload(
          context,
          fileName,
          uploadSizeBytes,
          costEstimate,
          transactionId
        );
      });
      
      // Clean up temporary file if operation wasn't cancelled
      if (!isCancelled && processedFilePath && processedFilePath !== filePath) {
        fs.unlinkSync(processedFilePath);
      }

      if (!isCancelled) {
        vscode.window.showInformationMessage('Image resized, converted to WebP, uploaded to Arweave, and inserted!');
      }
    } catch (error: unknown) {
      // Clean up on error
      if (processedFilePath && processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
        fs.unlinkSync(processedFilePath);
      }
      
      if (!isCancelled) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to process or upload image: ${errorMessage}`);
      }
    }
  }

  // Drag-and-drop command
  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.uploadAndInsert', async (uri: vscode.Uri) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showInformationMessage('Please open a Markdown file first.');
        return;
      }
      await uploadAndInsertImage(uri.fsPath, editor);
    })
  );

  // Clipboard paste command
  context.subscriptions.push(
    vscode.commands.registerCommand('md-ar-ext.pasteAndInsert', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showInformationMessage('Please open a Markdown file first.');
        return;
      }

      try {
        // Read image from clipboard
        const clipboardImage = await vscode.env.clipboard.readImage();
        if (!clipboardImage || clipboardImage.length === 0) {
          const text = await vscode.env.clipboard.readText();
          if (text) {
            vscode.window.showInformationMessage('Text detected in clipboard - md-ar-ext only processes images.');
            return;
          }
          vscode.window.showErrorMessage('No image found in clipboard.');
          return;
        }

        // Save clipboard image to temporary file
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `md-ar-ext-clipboard-${Date.now()}.png`);
        fs.writeFileSync(tempFilePath, Buffer.from(clipboardImage));

        await uploadAndInsertImage(tempFilePath, editor);
      } catch (error: unknown) {
        vscode.window.showErrorMessage(`Error processing clipboard: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        // Clean up any temporary files
        const tempFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('md-ar-ext-clipboard-'));
        for (const file of tempFiles) {
          try {
            fs.unlinkSync(path.join(os.tmpdir(), file));
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    })
  );

  // Drag-and-drop listener
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'markdown') {
        const dropHandler = vscode.workspace.onDidChangeTextDocument(async (event) => {
          if (event.document === editor.document && event.contentChanges.length > 0) {
            const change = event.contentChanges[0];
            try {
              const droppedText = change.text.trim();
              
              // Check if it's a file path
              if (droppedText.startsWith('file://')) {
                const droppedUri = vscode.Uri.parse(droppedText);
                if (droppedUri.scheme === 'file') {
                  // Revert the text change (don't insert the actual path)
                  await editor.edit(editBuilder => {
                    editBuilder.delete(change.range);
                  });
                  
                  // Process the dropped file
                  await vscode.commands.executeCommand('md-ar-ext.uploadAndInsert', droppedUri);
                }
              }
            } catch (error: unknown) {
              // Not a valid URI, likely normal text input
              // No need to handle this error - it's expected for normal text
            }
          }
        });
        context.subscriptions.push(dropHandler);
      }
    })
  );

  // Paste listener (Ctrl+V or Cmd+V)
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('md-ar-ext.handlePaste', async (editor) => {
      if (editor.document.languageId === 'markdown') {
        await vscode.commands.executeCommand('md-ar-ext.pasteAndInsert');
      }
    })
  );
  
  // Log activation of extension
  console.log('md-ar-ext is now active');
}

export function deactivate() {
  // Perform any cleanup operations
  console.log('md-ar-ext deactivated');
}