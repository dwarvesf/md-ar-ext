import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';

const STATS_KEY = 'md-ar-ext.uploadStats';

// Legacy interface for backwards compatibility
interface LegacyUploadRecord {
  date: string;
  fileName: string;
  sizeBytes: number;
  costAR: string;
  txId: string;
}

interface LegacyUploadStats {
  totalUploads: number;
  totalSizeBytes: number;
  totalCostAR: number;
  uploads: LegacyUploadRecord[];
}

// Upload statistics data structure
export interface UploadRecord {
  date: string;
  fileName: string;
  originalSizeBytes: number;
  uploadedSizeBytes: number;
  sizeSavingPercent: number;
  costAR: string;
  estimatedCostUSD: string;
  txId: string;
  status: 'pending' | 'confirmed' | 'failed';
  contentType: string;
}

export interface UploadStats {
  totalUploads: number;
  totalOriginalSizeBytes: number;
  totalUploadedSizeBytes: number;
  totalSizeSavings: number;
  totalCostAR: number;
  totalEstimatedCostUSD: number;
  uploads: UploadRecord[];
  lastUpdateTime: string;
}

/**
 * Initialize stats storage
 * @param context VS Code extension context
 * @returns Initialized upload stats
 */
function initializeStats(context: vscode.ExtensionContext): UploadStats {
  const emptyStats: UploadStats = {
    totalUploads: 0,
    totalOriginalSizeBytes: 0,
    totalUploadedSizeBytes: 0,
    totalSizeSavings: 0,
    totalCostAR: 0,
    totalEstimatedCostUSD: 0,
    uploads: [],
    lastUpdateTime: new Date().toISOString()
  };
  
  context.globalState.update(STATS_KEY, emptyStats);
  return emptyStats;
}

/**
 * Get current upload statistics
 * @param context VS Code extension context
 * @returns Current upload statistics
 */
export function getStats(context: vscode.ExtensionContext): UploadStats {
  const stats = context.globalState.get<UploadStats | LegacyUploadStats>(STATS_KEY);
  if (!stats) {
    return initializeStats(context);
  }
  
  // Handle stats from previous versions
  if ('totalSizeBytes' in stats) {
    const legacyStats = stats as LegacyUploadStats;
    const updatedStats: UploadStats = {
      totalUploads: legacyStats.totalUploads || 0,
      totalOriginalSizeBytes: legacyStats.totalSizeBytes || 0,
      totalUploadedSizeBytes: legacyStats.totalSizeBytes || 0,
      totalSizeSavings: 0,
      totalCostAR: legacyStats.totalCostAR || 0,
      totalEstimatedCostUSD: 0,
      uploads: legacyStats.uploads.map(upload => ({
        date: upload.date,
        fileName: upload.fileName,
        originalSizeBytes: upload.sizeBytes,
        uploadedSizeBytes: upload.sizeBytes,
        sizeSavingPercent: 0,
        costAR: upload.costAR,
        estimatedCostUSD: '0.00',
        txId: upload.txId,
        status: 'confirmed' as const,
        contentType: 'image/webp'
      })),
      lastUpdateTime: new Date().toISOString()
    };
    return updatedStats;
  }
  
  return stats as UploadStats;
}

/**
 * Track a new upload
 * @param context VS Code extension context
 * @param fileName File name 
 * @param originalSizeBytes Original file size in bytes
 * @param uploadedSizeBytes Uploaded file size in bytes
 * @param costAR Cost in AR
 * @param estimatedCostUSD Estimated cost in USD
 * @param txId Arweave transaction ID
 * @param contentType Content type of the uploaded file
 */
export async function trackUpload(
  context: vscode.ExtensionContext,
  fileName: string,
  originalSizeBytes: number,
  uploadedSizeBytes: number,
  costAR: string,
  estimatedCostUSD: string,
  txId: string,
  contentType: string = 'image/webp'
): Promise<void> {
  const stats = getStats(context);
  const costARNumber = parseFloat(costAR);
  const costUSDNumber = parseFloat(estimatedCostUSD);
  
  // Calculate size savings percentage
  const sizeSavingPercent = originalSizeBytes > 0 
    ? ((originalSizeBytes - uploadedSizeBytes) / originalSizeBytes) * 100 
    : 0;
  
  const newUpload: UploadRecord = {
    date: new Date().toISOString(),
    fileName,
    originalSizeBytes,
    uploadedSizeBytes,
    sizeSavingPercent,
    costAR,
    estimatedCostUSD,
    txId,
    status: 'pending',
    contentType
  };
  
  stats.uploads.push(newUpload);
  stats.totalUploads += 1;
  stats.totalOriginalSizeBytes += originalSizeBytes;
  stats.totalUploadedSizeBytes += uploadedSizeBytes;
  stats.totalSizeSavings += (originalSizeBytes - uploadedSizeBytes);
  stats.totalCostAR += costARNumber;
  stats.totalEstimatedCostUSD += costUSDNumber;
  stats.lastUpdateTime = new Date().toISOString();
  
  await context.globalState.update(STATS_KEY, stats);
}

/**
 * Update transaction status
 * @param context VS Code extension context
 * @param txId Transaction ID to update
 * @param status New status
 */
export async function updateTransactionStatus(
  context: vscode.ExtensionContext,
  txId: string,
  status: 'pending' | 'confirmed' | 'failed'
): Promise<void> {
  const stats = getStats(context);
  
  const uploadIndex = stats.uploads.findIndex(upload => upload.txId === txId);
  if (uploadIndex !== -1) {
    stats.uploads[uploadIndex].status = status;
    stats.lastUpdateTime = new Date().toISOString();
    await context.globalState.update(STATS_KEY, stats);
  }
}

/**
 * Update transaction statuses for pending transactions
 * @param context VS Code extension context
 */
export async function updatePendingTransactions(context: vscode.ExtensionContext): Promise<void> {
  const stats = getStats(context);
  
  const pendingUploads = stats.uploads.filter(upload => upload.status === 'pending');
  if (pendingUploads.length === 0) {
    return;
  }
  
  let updated = false;
  
  for (const upload of pendingUploads) {
    try {
      // Check transaction status on Arweave
      const response = await fetch(`https://arweave.net/tx/${upload.txId}/status`);
      
      if (response.status === 200) {
        const status = await response.text();
        if (status.includes('Pending')) {
          // Still pending, do nothing
        } else if (status.includes('confirmed')) {
          // Transaction confirmed
          upload.status = 'confirmed';
          updated = true;
        }
      } else if (response.status === 404) {
        // If it's been more than 24 hours since upload and still 404, mark as failed
        const uploadDate = new Date(upload.date);
        const now = new Date();
        const hoursSinceUpload = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpload > 24) {
          upload.status = 'failed';
          updated = true;
        }
      }
    } catch (error) {
      // Ignore network errors - will try again next time
      console.error(`Error checking transaction ${upload.txId}: ${error}`);
    }
  }
  
  if (updated) {
    stats.lastUpdateTime = new Date().toISOString();
    await context.globalState.update(STATS_KEY, stats);
  }
}

/**
 * Clear all tracked statistics
 * @param context VS Code extension context
 */
export async function clearStats(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(STATS_KEY, null);
  initializeStats(context);
}

/**
 * Format stats for display
 * @param stats Upload statistics
 * @returns Formatted stats as a string
 */
export function formatStats(stats: UploadStats): string {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Calculate average size savings
  const avgSavingsPercent = stats.totalUploads > 0 
    ? (stats.totalSizeSavings / stats.totalOriginalSizeBytes * 100).toFixed(2)
    : '0.00';
  
  return `# Upload Statistics

## Summary
- Total uploads: ${stats.totalUploads}
- Total original size: ${formatSize(stats.totalOriginalSizeBytes)}
- Total uploaded size: ${formatSize(stats.totalUploadedSizeBytes)}
- Total size savings: ${formatSize(stats.totalSizeSavings)} (${avgSavingsPercent}%)
- Total cost: ${stats.totalCostAR.toFixed(8)} AR (~ $${stats.totalEstimatedCostUSD.toFixed(2)} USD)
- Last updated: ${new Date(stats.lastUpdateTime).toLocaleString()}

## Recent Uploads
${stats.uploads.slice(-10).reverse().map(upload => {
  const date = new Date(upload.date).toLocaleString();
  const savings = (upload.sizeSavingPercent).toFixed(2);
  const statusEmoji = upload.status === 'confirmed' ? '✅' : upload.status === 'pending' ? '⏳' : '❌';
  
  return `- ${statusEmoji} ${date}: ${upload.fileName}
  Original: ${formatSize(upload.originalSizeBytes)}, Uploaded: ${formatSize(upload.uploadedSizeBytes)} (${savings}% saved)
  Cost: ${upload.costAR} AR (~ $${upload.estimatedCostUSD} USD)
  TX: ${upload.txId}`;
}).join('\n\n')}
`;
}

/**
 * Display upload statistics
 * @param context VS Code extension context
 */
export async function displayStats(context: vscode.ExtensionContext): Promise<void> {
  await updatePendingTransactions(context);
  const stats = getStats(context);
  
  if (stats.totalUploads === 0) {
    vscode.window.showInformationMessage('No uploads recorded yet.');
    return;
  }
  
  const formattedStats = formatStats(stats);
  
  // Create a virtual document to display stats
  const doc = await vscode.workspace.openTextDocument({
    content: formattedStats,
    language: 'markdown'
  });
  
  await vscode.window.showTextDocument(doc);
}

/**
 * Export statistics to a file
 * @param context VS Code extension context
 * @param format Export format: 'json' or 'csv'
 */
export async function exportStats(
  context: vscode.ExtensionContext,
  format: 'json' | 'csv' = 'json'
): Promise<void> {
  await updatePendingTransactions(context);
  const stats = getStats(context);
  
  if (stats.totalUploads === 0) {
    vscode.window.showInformationMessage('No uploads recorded yet.');
    return;
  }
  
  // Determine file extension and content
  const fileExt = format.toLowerCase();
  let content: string;
  let fileTypeDescription: string;
  
  if (format === 'csv') {
    // Generate CSV content
    const headers = [
      'Date',
      'Filename',
      'Original Size (B)',
      'Uploaded Size (B)',
      'Size Savings (%)',
      'Cost (AR)',
      'Estimated Cost (USD)',
      'Transaction ID',
      'Status',
      'Content Type'
    ].join(',');
    
    const rows = stats.uploads.map(upload => [
      upload.date,
      upload.fileName.replace(/,/g, ' '),  // Remove commas from filenames
      upload.originalSizeBytes,
      upload.uploadedSizeBytes,
      upload.sizeSavingPercent.toFixed(2),
      upload.costAR,
      upload.estimatedCostUSD,
      upload.txId,
      upload.status,
      upload.contentType
    ].join(','));
    
    content = [headers, ...rows].join('\n');
    fileTypeDescription = 'CSV';
  } else {
    // Default to JSON
    content = JSON.stringify(stats, null, 2);
    fileTypeDescription = 'JSON';
  }
  
  // Let user select where to save the file
  const defaultFile = `md-ar-ext-stats.${fileExt}`;
  
  // Use workspace folder if available
  let defaultUri: vscode.Uri;
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    defaultUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, defaultFile);
  } else {
    defaultUri = vscode.Uri.file(defaultFile);
  }
  
  const uri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { [fileTypeDescription]: [fileExt] }
  });
  
  if (uri) {
    fs.writeFileSync(uri.fsPath, content);
    vscode.window.showInformationMessage(`Statistics exported to ${uri.fsPath}`);
  }
} 