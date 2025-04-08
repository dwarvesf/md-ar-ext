import Arweave from 'arweave';
import * as fs from 'fs';
import * as settingsManager from './settingsManager';

// Initialize Arweave client
export const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000, // Increased timeout for better reliability
  logging: false
});

/**
 * Execute a function with retry capabilities
 * @param operation Function to execute
 * @param maxRetries Maximum number of retry attempts
 * @param delay Delay between retries in ms
 * @returns Promise resolving to the result of the operation
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after multiple retries');
}

/**
 * Check wallet balance
 * @param wallet Arweave wallet object (parsed from JSON)
 * @returns Promise resolving to the balance in AR
 */
export async function checkWalletBalance(wallet: any): Promise<string> {
  return withRetry(async () => {
    const address = await arweave.wallets.getAddress(wallet);
    const winstonBalance = await arweave.wallets.getBalance(address);
    const arBalance = arweave.ar.winstonToAr(winstonBalance);
    return arBalance;
  });
}

/**
 * Get wallet address from key
 * @param wallet Arweave wallet object
 * @returns Promise resolving to wallet address
 */
export async function getWalletAddress(wallet: any): Promise<string> {
  return withRetry(async () => {
    return await arweave.wallets.getAddress(wallet);
  });
}

/**
 * Estimate upload cost based on file size
 * @param sizeInBytes Size of the file in bytes
 * @returns Promise resolving to the estimated cost in AR
 */
export async function estimateUploadCost(sizeInBytes: number): Promise<string> {
  // Get estimation from Arweave
  try {
    const price = await withRetry(async () => {
      return await arweave.transactions.getPrice(sizeInBytes);
    });
    return arweave.ar.winstonToAr(price);
  } catch (error) {
    // Fallback to approximation if API call fails
    console.warn(`Failed to get accurate price estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.warn('Using approximation for cost estimation');
    
    // Arweave pricing algorithm approximately: 1 AR can store ~1GB of data
    const bytesPerAR = 1024 * 1024 * 1024;
    const estimatedAR = sizeInBytes / bytesPerAR;
    return estimatedAR.toFixed(8);
  }
}

/**
 * Check if wallet has sufficient balance for an upload
 * @param wallet Arweave wallet object
 * @param fileSizeBytes Size of file to upload in bytes
 * @returns Promise resolving to object with balance status and details
 */
export async function checkBalanceSufficient(
  wallet: any, 
  fileSizeBytes: number
): Promise<{ sufficient: boolean; balance: string; required: string }> {
  const balance = await checkWalletBalance(wallet);
  const required = await estimateUploadCost(fileSizeBytes);
  
  return {
    sufficient: parseFloat(balance) >= parseFloat(required),
    balance,
    required
  };
}

/**
 * Format file size for human-readable display
 * @param bytes Size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Uploads an image file to Arweave
 * @param filePath Path to the image file to upload
 * @param wallet Arweave wallet object (parsed from JSON)
 * @returns Promise resolving to the Arweave transaction ID
 */
export async function uploadToArweave(filePath: string, wallet: any): Promise<string> {
  return withRetry(async () => {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read file data
    const data = fs.readFileSync(filePath);
    
    // Verify we have data
    if (!data || data.length === 0) {
      throw new Error(`Empty file: ${filePath}`);
    }
    
    // Create transaction
    const transaction = await arweave.createTransaction({ data }, wallet);
    
    // Add standard content type tag
    transaction.addTag('Content-Type', 'image/webp');
    
    // Add custom metadata tags if enabled
    if (settingsManager.getMetadataTagsEnabled()) {
      // Add some default useful tags
      transaction.addTag('App-Name', 'md-ar-ext');
      transaction.addTag('Content-Type-Original', 'image');
      transaction.addTag('Type', 'image');
      transaction.addTag('Created-Date', new Date().toISOString());
      
      // Add user-defined custom tags
      const customTags = settingsManager.getCustomTags();
      for (const tag of customTags) {
        transaction.addTag(tag.name, tag.value);
      }
    }
    
    // Sign transaction
    await arweave.transactions.sign(transaction, wallet);
    
    // Post transaction with validation
    const response = await arweave.transactions.post(transaction);
    
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
    }
    
    return transaction.id;
  });
}

/**
 * Verify transaction was successfully submitted
 * @param txId Transaction ID to verify
 * @returns Promise resolving to boolean indicating whether transaction is found
 */
export async function verifyTransaction(txId: string): Promise<boolean> {
  try {
    const status = await withRetry(async () => {
      return await arweave.transactions.getStatus(txId);
    });
    return status.status === 200 || status.status === 202;
  } catch (error) {
    return false;
  }
}

/**
 * Generates the Arweave URL for a transaction
 * @param transactionId Arweave transaction ID
 * @returns Arweave URL
 */
export function getArweaveUrl(transactionId: string): string {
  return `https://arweave.net/${transactionId}`;
}

/**
 * Generates a Markdown image link
 * @param fileName Image filename (without extension)
 * @param url Arweave URL
 * @returns Markdown formatted image link
 */
export function createMarkdownLink(fileName: string, url: string): string {
  return `![${fileName}](${url})`;
} 