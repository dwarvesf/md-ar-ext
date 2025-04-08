import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const STATS_KEY = 'md-ar-ext.uploadStats';

// Upload statistics data structure
export interface UploadRecord {
  date: string;
  fileName: string;
  sizeBytes: number;
  costAR: string;
  txId: string;
}

export interface UploadStats {
  totalUploads: number;
  totalSizeBytes: number;
  totalCostAR: number;
  uploads: UploadRecord[];
}

/**
 * Initialize stats storage
 * @param context VS Code extension context
 * @returns Initialized upload stats
 */
function initializeStats(context: vscode.ExtensionContext): UploadStats {
  const emptyStats: UploadStats = {
    totalUploads: 0,
    totalSizeBytes: 0,
    totalCostAR: 0,
    uploads: []
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
  const stats = context.globalState.get<UploadStats>(STATS_KEY);
  return stats || initializeStats(context);
}

/**
 * Track a new upload
 * @param context VS Code extension context
 * @param fileName File name 
 * @param sizeBytes File size in bytes
 * @param costAR Cost in AR
 * @param txId Arweave transaction ID
 */
export async function trackUpload(
  context: vscode.ExtensionContext,
  fileName: string,
  sizeBytes: number,
  costAR: string,
  txId: string
): Promise<void> {
  const stats = getStats(context);
  const costARNumber = parseFloat(costAR);
  
  const newUpload: UploadRecord = {
    date: new Date().toISOString(),
    fileName,
    sizeBytes,
    costAR,
    txId
  };
  
  stats.uploads.push(newUpload);
  stats.totalUploads += 1;
  stats.totalSizeBytes += sizeBytes;
  stats.totalCostAR += costARNumber;
  
  await context.globalState.update(STATS_KEY, stats);
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
  
  return `# Upload Statistics

## Summary
- Total uploads: ${stats.totalUploads}
- Total size: ${formatSize(stats.totalSizeBytes)}
- Total cost: ${stats.totalCostAR.toFixed(8)} AR

## Recent Uploads
${stats.uploads.slice(-10).reverse().map(upload => {
  const date = new Date(upload.date).toLocaleString();
  return `- ${date}: ${upload.fileName} (${formatSize(upload.sizeBytes)}, ${upload.costAR} AR)`;
}).join('\n')}
`;
}

/**
 * Display upload statistics
 * @param context VS Code extension context
 */
export async function displayStats(context: vscode.ExtensionContext): Promise<void> {
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
 */
export async function exportStats(context: vscode.ExtensionContext): Promise<void> {
  const stats = getStats(context);
  
  if (stats.totalUploads === 0) {
    vscode.window.showInformationMessage('No uploads recorded yet.');
    return;
  }
  
  // Let user select where to save the file
  const defaultUri = vscode.Uri.file(path.join(vscode.workspace.rootPath || '~', 'md-ar-ext-stats.json'));
  const uri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'JSON': ['json'] }
  });
  
  if (uri) {
    fs.writeFileSync(uri.fsPath, JSON.stringify(stats, null, 2));
    vscode.window.showInformationMessage(`Statistics exported to ${uri.fsPath}`);
  }
} 