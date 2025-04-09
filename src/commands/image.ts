import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { 
  isImageFile, 
  processImage, 
  checkImageMagickDetails,
  showImageMagickInstallInstructions,
  ImageProcessOptions,
  ImageProcessResult
} from '../utils/processing/imageProcessor';

import { 
  uploadToArweave, 
  createMarkdownLink, 
  checkBalanceSufficient,
  formatFileSize,
  verifyTransaction,
  ArweaveUploadOptions,
  ArweaveUploadResult
} from '../utils/processing/arweaveUploader';

import { getOrPromptForPrivateKey } from '../utils/storage/keyManager';
import { withCancellableProgress } from '../utils/monitoring/progressIndicator';
import { trackUpload } from '../utils/monitoring/statsTracker';
import { 
  getWebpQuality, 
  getMaxDimensions, 
  getMetadataTagsEnabled, 
  getCustomTags,
  getSetting 
} from '../utils/storage/settingsManager';

/**
 * Handle pasting an image from the clipboard and inserting it into the document
 * @param context Extension context
 */
export async function handlePasteImage(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Create a temporary file to store the image from clipboard
  const tempFilePath = path.join(os.tmpdir(), `md-ar-ext-paste-${Date.now()}.png`);

  try {
    // Get image from clipboard and save to temporary file
    const image = await vscode.env.clipboard.readImage();
    if (image.byteLength === 0) {
      vscode.window.showInformationMessage('No image found in clipboard');
      return;
    }

    fs.writeFileSync(tempFilePath, image);
    
    // Process and upload the image
    await uploadAndInsertImage(tempFilePath, editor, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to paste image: ${errorMessage}`);
  } finally {
    // Clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

/**
 * Handle uploading an image from file and inserting it into the document
 * @param context Extension context
 */
export async function handleUploadImage(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Show file picker to select image
  const fileUris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: {
      'images': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif']
    },
    title: 'Select an image to upload'
  });

  if (!fileUris || fileUris.length === 0) {
    return;
  }

  const filePath = fileUris[0].fsPath;
  
  // Process and upload the image
  await uploadAndInsertImage(filePath, editor, context);
}

/**
 * Process an image file without uploading it
 * @param context Extension context
 */
export async function processImageOnly(_context: vscode.ExtensionContext): Promise<void> {
  // Show file picker to select image
  const fileUris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: {
      'images': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif']
    },
    title: 'Select an image to process'
  });

  if (!fileUris || fileUris.length === 0) {
    return;
  }

  const filePath = fileUris[0].fsPath;

  try {
    // Validate the image file
    const isValid = await isImageFile(filePath);
    if (!isValid) {
      vscode.window.showErrorMessage('Please use a valid image file (PNG, JPG, JPEG, GIF, WEBP, AVIF - no videos or animated GIFs)');
      return;
    }

    // Get processing options
    const options: ImageProcessOptions = {
      webpQuality: getWebpQuality(),
      maxWidth: getMaxDimensions().width,
      maxHeight: getMaxDimensions().height,
      preserveOriginal: getSetting('preserveOriginalImages', true)
    };

    // Process the image with progress indication
    await withCancellableProgress('Processing image', async (progress, token) => {
      // Handle cancellation
      token.onCancellationRequested(() => {
        vscode.window.showInformationMessage('Image processing cancelled');
        throw new Error('Operation cancelled by user');
      });

      progress.report({ message: 'Processing image...', increment: 10 });
      
      const result = await processImage(filePath, options, progress);
      
      // Show the results
      progress.report({ message: 'Completed', increment: 100 });
      
      const message = `
        Original: ${formatFileSize(result.originalSize)}
        Processed: ${formatFileSize(result.processedSize)}
        Reduction: ${result.reductionPercentage.toFixed(2)}%
        Dimensions: ${result.width}x${result.height}
        Saved to: ${result.processedFilePath}
      `;
      
      vscode.window.showInformationMessage('Image processed successfully', 'View Details', 'Open File').then(selection => {
        if (selection === 'View Details') {
          // Show detailed results in a new document
          const detailsDoc = vscode.workspace.openTextDocument({
            content: message,
            language: 'markdown'
          });
          detailsDoc.then(doc => vscode.window.showTextDocument(doc));
        } else if (selection === 'Open File') {
          // Open the processed file
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(result.processedFilePath));
        }
      });
    });
  } catch (error) {
    // Handle errors unless it's a cancellation
    if (error instanceof Error && error.message === 'Operation cancelled by user') {
      return;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to process image: ${errorMessage}`);
  }
}

/**
 * Check if ImageMagick is installed and show installation instructions if needed
 */
export async function checkImageMagickInstallation(): Promise<void> {
  const details = await checkImageMagickDetails();
  
  if (!details.installed) {
    vscode.window.showWarningMessage(
      'ImageMagick is required for image processing but does not appear to be installed.',
      'Show Installation Instructions'
    ).then(selection => {
      if (selection === 'Show Installation Instructions') {
        showImageMagickInstallInstructions();
      }
    });
    return;
  }
  
  if (!details.meetRequirements) {
    vscode.window.showWarningMessage(
      `ImageMagick ${details.version} is installed, but version 7.0+ is recommended for best results.`,
      'Show Installation Instructions'
    ).then(selection => {
      if (selection === 'Show Installation Instructions') {
        showImageMagickInstallInstructions();
      }
    });
    return;
  }
  
  vscode.window.showInformationMessage(`ImageMagick ${details.version} is installed and ready to use.`);
}

/**
 * Shared upload logic for drag-and-drop and paste
 * @param filePath Source image file path
 * @param editor VS Code text editor
 * @param context Extension context
 */
async function uploadAndInsertImage(
  filePath: string, 
  editor: vscode.TextEditor,
  context: vscode.ExtensionContext
): Promise<void> {
  // Check if file is a valid image
  try {
    const isValid = await isImageFile(filePath);
    if (!isValid) {
      vscode.window.showErrorMessage('Please use a valid image file (PNG, JPG, JPEG, GIF, WEBP, AVIF - no videos or animated GIFs)');
      return;
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error validating file: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  let processedFilePath = '';
  let wallet: any = null;
  let isCancelled = false;
  let result: ImageProcessResult | null = null;
  let uploadResult: ArweaveUploadResult | null = null;

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
      progress.report({ message: 'Processing image...', increment: 10 });
      
      const options: ImageProcessOptions = {
        webpQuality: getWebpQuality(),
        maxWidth: getMaxDimensions().width,
        maxHeight: getMaxDimensions().height,
        preserveOriginal: getSetting('preserveOriginalImages', true)
      };
      
      result = await processImage(filePath, options, progress);
      processedFilePath = result.processedFilePath;
      
      // Upload to Arweave
      progress.report({ message: 'Uploading to Arweave...', increment: 20 });
      
      const uploadOptions: ArweaveUploadOptions = {
        tags: getCustomTags(),
        enableMetadataTags: getMetadataTagsEnabled(),
        retryCount: getSetting('retryCount', 3),
        retryDelay: getSetting('retryDelay', 1000)
      };
      
      uploadResult = await uploadToArweave(wallet, processedFilePath, uploadOptions, progress, token);
      
      // Insert markdown into document
      const mdLink = createMarkdownLink(uploadResult.url, fileName);
      
      progress.report({ message: 'Inserting link...', increment: 5 });
      
      await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, mdLink);
      });
      
      // Track stats
      if (result && uploadResult) {
        await trackUpload(
          context,
          path.basename(filePath),
          result.originalSize,
          result.processedSize,
          uploadResult.cost.ar,
          uploadResult.cost.usd || '0.00',
          uploadResult.txId,
          'image/webp'
        );
      }
      
      // Show upload complete message with size reduction info
      if (result) {
        const sizeReduction = `Original: ${formatFileSize(result.originalSize)}, Processed: ${formatFileSize(result.processedSize)} (${result.reductionPercentage.toFixed(0)}% reduction)`;
        vscode.window.showInformationMessage(`Upload complete! ${sizeReduction}`);
      } else {
        vscode.window.showInformationMessage('Upload complete!');
      }
      
      // Verify transaction in background
      if (uploadResult && uploadResult.pending) {
        // Schedule verification after upload completes
        setTimeout(() => {
          verifyTransaction(uploadResult!.txId).then(verification => {
            if (verification.confirmed) {
              vscode.window.showInformationMessage(`Transaction ${uploadResult!.txId.substring(0, 8)}... confirmed with ${verification.confirmations} confirmations.`);
            }
          }).catch(() => {
            // Silent fail for background verification
          });
        }, 30000); // Check after 30 seconds
      }
    });
  } catch (error) {
    // Handle cancellation
    if (isCancelled) {
      return;
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to upload image: ${errorMessage}`);
  } finally {
    // Cleanup temporary processed file if it exists and differs from the original
    if (processedFilePath && processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
      try {
        const preserveProcessed = getSetting('preserveProcessedImages', false);
        if (!preserveProcessed) {
          fs.unlinkSync(processedFilePath);
        }
      } catch (error) {
        // Silent fail on cleanup
      }
    }
  }
} 