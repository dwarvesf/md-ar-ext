# md-ar-ext: Technical Specifications v2

This document provides detailed technical specifications for implementing the features outlined in the PRD v2 and Implementation Plan.

## 1. Module API Specifications

### 1.1. ImageProcessor Module

```typescript
// src/utils/imageProcessor.ts

/**
 * Check if ImageMagick is installed and meets version requirements
 * @returns {Promise<{installed: boolean, version: string | null, meetRequirements: boolean}>}
 */
export async function checkImageMagickDetails(): Promise<{
  installed: boolean;
  version: string | null;
  meetRequirements: boolean;
}>;

/**
 * Show installation instructions for ImageMagick based on platform
 */
export function showImageMagickInstallInstructions(): void;

/**
 * Process image file (resize, convert to WebP)
 * @param {string} filePath Source image file path
 * @param {ImageProcessOptions} options Processing options
 * @param {vscode.Progress<{message?: string; increment?: number}>} progress Progress reporter
 * @returns {Promise<ImageProcessResult>} Processing result with paths and stats
 */
export async function processImage(
  filePath: string,
  options: ImageProcessOptions,
  progress?: vscode.Progress<{message?: string; increment?: number}>
): Promise<ImageProcessResult>;

/**
 * Image processing options interface
 */
export interface ImageProcessOptions {
  webpQuality: number;
  maxWidth: number;
  maxHeight: number;
  preserveOriginal: boolean;
}

/**
 * Image processing result interface
 */
export interface ImageProcessResult {
  processedFilePath: string;
  originalFilePath: string;
  originalSize: number;
  processedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Check if a file is a valid image
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} True if valid image
 */
export async function isImageFile(filePath: string): Promise<boolean>;

/**
 * Get image dimensions and format
 * @param {string} filePath Path to the image file
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
export async function getImageInfo(
  filePath: string
): Promise<{width: number; height: number; format: string}>;
```

### 1.2. ArweaveUploader Module

```typescript
// src/utils/arweaveUploader.ts

/**
 * Upload file to Arweave with progress reporting and cancellation support
 * @param {any} wallet Arweave wallet
 * @param {string} filePath Path to file
 * @param {ArweaveUploadOptions} options Upload options
 * @param {vscode.Progress<{message?: string; increment?: number}>} progress Progress reporter
 * @param {vscode.CancellationToken} token Cancellation token
 * @returns {Promise<ArweaveUploadResult>} Upload result with txId and URL
 */
export async function uploadToArweave(
  wallet: any,
  filePath: string,
  options: ArweaveUploadOptions,
  progress?: vscode.Progress<{message?: string; increment?: number}>,
  token?: vscode.CancellationToken
): Promise<ArweaveUploadResult>;

/**
 * Arweave upload options interface
 */
export interface ArweaveUploadOptions {
  tags: Array<{name: string; value: string}>;
  enableMetadataTags: boolean;
  retryCount: number;
  retryDelay: number;
}

/**
 * Arweave upload result interface
 */
export interface ArweaveUploadResult {
  txId: string;
  url: string;
  cost: {
    ar: string;
    usd: string | null;
  };
  pending: boolean;
}

/**
 * Create Markdown link for an Arweave URL
 * @param {string} url Arweave URL
 * @param {string} altText Alt text for image
 * @returns {string} Markdown image link
 */
export function createMarkdownLink(url: string, altText: string): string;

/**
 * Check wallet balance
 * @param {any} wallet Arweave wallet
 * @returns {Promise<string>} Balance in AR
 */
export async function checkWalletBalance(wallet: any): Promise<string>;

/**
 * Check if wallet has sufficient balance for upload
 * @param {any} wallet Arweave wallet
 * @param {number} fileSizeBytes File size in bytes
 * @returns {Promise<{sufficient: boolean; balance: string; required: string}>}
 */
export async function checkBalanceSufficient(
  wallet: any,
  fileSizeBytes: number
): Promise<{sufficient: boolean; balance: string; required: string}>;

/**
 * Estimate upload cost
 * @param {number} fileSizeBytes File size in bytes
 * @returns {Promise<{ar: string; usd: string | null}>}
 */
export async function estimateUploadCost(
  fileSizeBytes: number
): Promise<{ar: string; usd: string | null}>;

/**
 * Verify transaction status
 * @param {string} txId Transaction ID
 * @returns {Promise<{confirmed: boolean; confirmations: number; status: string}>}
 */
export async function verifyTransaction(
  txId: string
): Promise<{confirmed: boolean; confirmations: number; status: string}>;

/**
 * Format file size for display
 * @param {number} bytes Size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes: number): string;
```

### 1.3. KeyManager Module

```typescript
// src/utils/keyManager.ts

/**
 * Get or prompt for private key
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<string | undefined>} Private key JSON string or undefined if cancelled
 */
export async function getOrPromptForPrivateKey(
  context: vscode.ExtensionContext
): Promise<string | undefined>;

/**
 * Update private key
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<void>}
 */
export async function updatePrivateKey(
  context: vscode.ExtensionContext
): Promise<void>;

/**
 * Delete private key
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<void>}
 */
export async function deletePrivateKey(
  context: vscode.ExtensionContext
): Promise<void>;

/**
 * Import key from file
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<void>}
 */
export async function importKeyFromFile(
  context: vscode.ExtensionContext
): Promise<void>;

/**
 * Show wallet address
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<void>}
 */
export async function showWalletAddress(
  context: vscode.ExtensionContext
): Promise<void>;

/**
 * Validate key format
 * @param {string} key Key JSON string
 * @returns {boolean} True if valid
 */
export function validateKeyFormat(key: string): boolean;
```

### 1.4. SettingsManager Module

```typescript
// src/utils/settingsManager.ts

/**
 * Extension settings interface
 */
export interface ExtensionSettings {
  webpQuality: number;
  maxDimension: { width: number; height: number };
  tagMetadata: boolean;
  showUploadProgress: boolean;
  checkBalanceBeforeUpload: boolean;
  customTags: Array<{ name: string; value: string }>;
  preserveOriginalImages: boolean;
  retryCount: number;
  retryDelay: number;
  showOptimizationStats: boolean;
  autoCheckDependencies: boolean;
}

/**
 * Get WebP quality setting
 * @returns {number} WebP quality value (50-100)
 */
export function getWebpQuality(): number;

/**
 * Gets maximum dimensions for resizing
 * @returns {Object} Object containing max width and height
 */
export function getMaxDimensions(): { width: number; height: number };

/**
 * Checks if metadata tagging is enabled
 * @returns {boolean} Boolean indicating if metadata tags should be added
 */
export function getMetadataTagsEnabled(): boolean;

/**
 * Gets custom tags for Arweave uploads
 * @returns {Array<{name: string; value: string}>} Array of custom tags
 */
export function getCustomTags(): Array<{ name: string; value: string }>;

/**
 * Gets the current value for any setting
 * @param {string} key Setting key
 * @param {T} defaultValue Default value if setting is not found
 * @returns {T} Setting value of type T
 */
export function getSetting<T>(key: string, defaultValue: T): T;

/**
 * Updates a setting value
 * @param {string} key Setting key
 * @param {any} value New value
 * @param {vscode.ConfigurationTarget} target Configuration target
 * @returns {Promise<void>}
 */
export async function updateSetting(
  key: string, 
  value: any, 
  target?: vscode.ConfigurationTarget
): Promise<void>;

/**
 * Opens the settings UI focused on the extension's settings
 * @returns {Promise<void>}
 */
export async function openSettings(): Promise<void>;

/**
 * Show comprehensive settings UI
 * @returns {Promise<void>}
 */
export async function showSettingsUI(): Promise<void>;

/**
 * Quick configure common settings
 * @returns {Promise<void>}
 */
export async function quickConfigureSettings(): Promise<void>;

/**
 * Export settings to file
 * @returns {Promise<void>}
 */
export async function exportSettings(): Promise<void>;

/**
 * Import settings from file
 * @returns {Promise<void>}
 */
export async function importSettings(): Promise<void>;
```

### 1.5. ProgressIndicator Module

```typescript
// src/utils/progressIndicator.ts

/**
 * Run a task with progress
 * @param {string} title Progress title
 * @param {Function} task Task function
 * @returns {Promise<T>} Task result
 */
export async function withProgress<T>(
  title: string,
  task: (progress: vscode.Progress<{message?: string; increment?: number}>) => Thenable<T>
): Promise<T>;

/**
 * Run a task with cancellable progress
 * @param {string} title Progress title
 * @param {Function} task Task function
 * @returns {Promise<T>} Task result
 */
export async function withCancellableProgress<T>(
  title: string,
  task: (
    progress: vscode.Progress<{message?: string; increment?: number}>,
    token: vscode.CancellationToken
  ) => Thenable<T>
): Promise<T>;

/**
 * Create a progress handler that estimates time remaining
 * @param {vscode.Progress<{message?: string; increment?: number}>} progress Progress reporter
 * @param {number} totalSteps Total number of steps
 * @returns {Function} Progress handler with time estimation
 */
export function createTimeEstimateProgressHandler(
  progress: vscode.Progress<{message?: string; increment?: number}>,
  totalSteps: number
): (step: number, message: string) => void;

/**
 * Format time remaining
 * @param {number} milliseconds Time in milliseconds
 * @returns {string} Formatted time
 */
export function formatTimeRemaining(milliseconds: number): string;
```

### 1.6. StatsTracker Module

```typescript
// src/utils/statsTracker.ts

/**
 * Upload statistics interface
 */
export interface UploadStats {
  id: string;
  fileName: string;
  originalSize: number;
  processedSize: number;
  reductionPercentage: number;
  uploadTime: number;
  cost: {
    ar: string;
    usd: string | null;
  };
  txId: string;
  url: string;
  timestamp: number;
  confirmed: boolean;
}

/**
 * Track a new upload
 * @param {vscode.ExtensionContext} context Extension context
 * @param {UploadStats} stats Upload statistics
 * @returns {Promise<void>}
 */
export async function trackUpload(
  context: vscode.ExtensionContext,
  stats: UploadStats
): Promise<void>;

/**
 * Display statistics
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<void>}
 */
export async function displayStats(
  context: vscode.ExtensionContext
): Promise<void>;

/**
 * Export statistics to file
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Promise<void>}
 */
export async function exportStats(
  context: vscode.ExtensionContext
): Promise<void>;

/**
 * Get all upload statistics
 * @param {vscode.ExtensionContext} context Extension context
 * @returns {Array<UploadStats>} Array of upload statistics
 */
export function getAllStats(
  context: vscode.ExtensionContext
): Array<UploadStats>;

/**
 * Calculate cumulative statistics
 * @param {Array<UploadStats>} stats Array of upload statistics
 * @returns {Object} Cumulative statistics
 */
export function calculateCumulativeStats(
  stats: Array<UploadStats>
): {
  totalUploads: number;
  totalOriginalSize: number;
  totalProcessedSize: number;
  averageReduction: number;
  totalCostAR: string;
  totalCostUSD: string | null;
};

/**
 * Update transaction confirmation status
 * @param {vscode.ExtensionContext} context Extension context
 * @param {string} id Upload ID
 * @param {boolean} confirmed Whether transaction is confirmed
 * @returns {Promise<void>}
 */
export async function updateTransactionStatus(
  context: vscode.ExtensionContext,
  id: string,
  confirmed: boolean
): Promise<void>;
```

## 2. New UI Components

### 2.1. Settings UI Panel

Create a custom settings UI WebView panel with the following components:

- Sections for:
  - Image Processing Settings
  - Arweave Upload Settings
  - Wallet Management
  - Statistics and Tracking
  - Advanced Settings
- Input controls for all settings
- Import/Export buttons for settings
- Reset to defaults option

### 2.2. Statistics Dashboard

Create a WebView-based statistics dashboard with:

- Upload history table
- Cost summary section
- File size reduction statistics
- Upload time statistics
- Export options (CSV, JSON)
- Date range filtering

### 2.3. Cost Estimation Dialog

Create a dialog showing:

- Estimated cost in AR
- USD equivalent (if available)
- Historical cost comparison
- Balance information
- Confirmation/Cancel buttons

## 3. Core Feature Implementation Details

### 3.1. Transaction Verification

1. Implement polling mechanism to check transaction status
2. Add background verification of pending transactions
3. Provide notification when transactions are confirmed
4. Support transaction status tracking in statistics

### 3.2. Wallet Management

1. Implement secure storage using SecretStorage API
2. Add file-based key import with validation
3. Support wallet address display and copying
4. Implement balance checking with AR and USD display

### 3.3. Image Processing

1. Add AVIF format support
2. Enhance WebP conversion with quality settings
3. Implement detailed size reduction feedback
4. Add ImageMagick dependency validation

### 3.4. Error Handling

1. Implement comprehensive error types
2. Add user-friendly error messages
3. Provide actionable error resolution guidance
4. Implement automatic retry for network operations

## 4. Command Implementation Details

### 4.1. Image Commands

- `md-ar-ext.pasteAndInsert`: Enhanced with progress, cancellation, and error handling
- `md-ar-ext.uploadAndInsert`: Enhanced with progress, cancellation, and error handling
- `md-ar-ext.processImage`: New command for processing without uploading

### 4.2. Wallet Commands

- `md-ar-ext.updatePrivateKey`: Enhanced with validation
- `md-ar-ext.deletePrivateKey`: No changes
- `md-ar-ext.checkBalance`: Enhanced with USD conversion
- `md-ar-ext.showWalletAddress`: New command to display and copy address
- `md-ar-ext.importKeyFromFile`: New command for file-based key import

### 4.3. Settings Commands

- `md-ar-ext.configureSettings`: Enhanced with comprehensive options
- `md-ar-ext.showSettingsUI`: New command for WebView-based settings UI
- `md-ar-ext.exportSettings`: New command for settings export
- `md-ar-ext.importSettings`: New command for settings import

### 4.4. Statistics Commands

- `md-ar-ext.viewStatistics`: Enhanced with WebView-based dashboard
- `md-ar-ext.exportStats`: Enhanced with format options
- `md-ar-ext.verifyTransactions`: New command to verify pending transactions

## 5. Data Storage

### 5.1. Secret Storage

- Use VS Code's SecretStorage API for Arweave keys
- Implement secure key validation and storage

### 5.2. Extension State

- Use ExtensionContext.globalState for storing:
  - Upload statistics
  - Settings values
  - Pending transactions

### 5.3. Settings Storage

- Use VS Code's Configuration API for settings
- Implement validation and schema

## 6. Performance Considerations

### 6.1. Image Processing

- Implement streaming processing for large images
- Add background processing to maintain UI responsiveness
- Optimize memory usage during processing

### 6.2. Network Operations

- Implement cancellable network requests
- Add automatic retry with exponential backoff
- Use streaming uploads for large files

### 6.3. WebView Rendering

- Optimize WebView content for performance
- Use efficient data loading patterns
- Implement pagination for large data sets

## 7. Security Considerations

### 7.1. Key Management

- Use SecretStorage API for sensitive data
- Validate key format before storage
- Never expose private keys in UI or logs

### 7.2. Network Security

- Use HTTPS for all external API calls
- Validate server responses
- Handle network errors gracefully

### 7.3. File System Security

- Use temporary directories for processed files
- Clean up temporary files after use
- Validate file paths before operations

## 8. Backwards Compatibility

### 8.1. Settings Migration

- Automatically migrate existing settings to new format
- Preserve user settings during updates
- Provide default values for new settings

### 8.2. API Compatibility

- Maintain compatibility with existing VS Code API
- Support backwards compatibility with older Arweave API versions
- Handle version differences gracefully 