import Arweave from 'arweave';
import * as fs from 'fs';
import * as settingsManager from '../storage/settingsManager';
import * as vscode from 'vscode';
import { networkService } from '../networking/networkService';
import { logger } from '../monitoring/logger';
import { ExtensionError, ErrorType, createNetworkError, handleError } from '../monitoring/errorHandler';

// Define interfaces for the module
export interface ArweaveUploadOptions {
  tags: Array<{name: string; value: string}>;
  enableMetadataTags: boolean;
  retryCount: number;
  retryDelay: number;
}

export interface ArweaveUploadResult {
  txId: string;
  url: string;
  cost: {
    ar: string;
    usd: string | null;
  };
  pending: boolean;
}

export interface ArweaveTransactionStatus {
  confirmed: boolean;
  confirmations: number;
  status: string;
}

// Initialize Arweave client
export const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 30000, // Increased timeout for better reliability
  logging: false
});

// Coingecko API endpoint for AR to USD conversion
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd';

/**
 * Execute a function with retry capabilities
 * @param operation Function to execute
 * @param maxRetries Maximum number of retry attempts
 * @param delay Delay between retries in ms
 * @param backoff Backoff multiplier for increasing delay between attempts
 * @returns Promise resolving to the result of the operation
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 2000,
  backoff = 1.5
): Promise<T> {
  let lastError: Error | null = null;
  let currentDelay = delay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.floor(currentDelay * backoff); // Increase delay with each attempt
      }
    }
  }
  
  throw lastError || new Error('Operation failed after multiple retries');
}

/**
 * Get current AR to USD exchange rate
 * @returns Promise resolving to the exchange rate or null if unavailable
 */
export async function getArToUsdRate(): Promise<number | null> {
  try {
    // Use networkService instead of direct fetch
    const data = await networkService.get<any>(COINGECKO_API_URL, undefined, {
      retries: 2,
      retryDelay: 1000
    });
    
    if (data?.arweave?.usd) {
      logger.debug(`Got AR/USD rate: ${data.arweave.usd}`, 'ARWEAVE');
      return data.arweave.usd;
    }
    
    logger.warn('Failed to get AR/USD rate: Invalid response format', 'ARWEAVE');
    return null;
  } catch (error) {
    logger.warn(`Error fetching AR/USD rate: ${error instanceof Error ? error.message : String(error)}`, 'ARWEAVE');
    return null;
  }
}

/**
 * Check wallet balance
 * @param wallet Arweave wallet object (parsed from JSON)
 * @returns Promise resolving to the balance in AR
 */
export async function checkWalletBalance(wallet: any): Promise<string> {
  try {
    const address = await arweave.wallets.getAddress(wallet);
    const winstonBalance = await arweave.wallets.getBalance(address);
    const arBalance = arweave.ar.winstonToAr(winstonBalance);
    logger.debug(`Wallet balance: ${arBalance} AR`, 'ARWEAVE');
    return arBalance;
  } catch (error) {
    logger.error('Failed to check wallet balance', error, 'ARWEAVE');
    throw new ExtensionError(
      'Failed to check wallet balance. Please check your internet connection and try again.',
      ErrorType.ARWEAVE_WALLET,
      error
    );
  }
}

/**
 * Get wallet address from key
 * @param wallet Arweave wallet object
 * @returns Promise resolving to wallet address
 */
export async function getWalletAddress(wallet: any): Promise<string> {
  try {
    const address = await arweave.wallets.getAddress(wallet);
    logger.debug(`Got wallet address: ${address}`, 'ARWEAVE');
    return address;
  } catch (error) {
    logger.error('Failed to get wallet address', error, 'ARWEAVE');
    throw new ExtensionError(
      'Failed to get wallet address. The key file may be invalid.',
      ErrorType.ARWEAVE_WALLET,
      error
    );
  }
}

/**
 * Estimate upload cost 
 * @param sizeInBytes Size of the file in bytes
 * @returns Promise resolving to the estimated cost in AR and USD
 */
export async function estimateUploadCost(
  sizeInBytes: number
): Promise<{ar: string; usd: string | null}> {
  // Get AR estimation from Arweave
  let arCost: string;
  
  try {
    const price = await arweave.transactions.getPrice(sizeInBytes);
    arCost = arweave.ar.winstonToAr(price);
    logger.debug(`Estimated cost for ${formatFileSize(sizeInBytes)}: ${arCost} AR`, 'ARWEAVE');
  } catch (error) {
    // Fallback to approximation if API call fails
    logger.warn(`Failed to get accurate price estimate: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ARWEAVE');
    logger.info('Using approximation for cost estimation', 'ARWEAVE');
    
    // Arweave pricing algorithm approximately: 1 AR can store ~1GB of data
    const bytesPerAR = 1024 * 1024 * 1024;
    const estimatedAR = sizeInBytes / bytesPerAR;
    arCost = estimatedAR.toFixed(8);
  }
  
  // Get USD conversion
  let usdCost: string | null = null;
  const arToUsdRate = await getArToUsdRate();
  
  if (arToUsdRate !== null) {
    const usdValue = parseFloat(arCost) * arToUsdRate;
    usdCost = usdValue.toFixed(4);
    logger.debug(`Converted cost: ${usdCost} USD`, 'ARWEAVE');
  }
  
  return { ar: arCost, usd: usdCost };
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
  try {
    const balance = await checkWalletBalance(wallet);
    const costEstimate = await estimateUploadCost(fileSizeBytes);
    
    const sufficient = parseFloat(balance) >= parseFloat(costEstimate.ar);
    logger.debug(`Balance check: ${balance} AR available, ${costEstimate.ar} AR required, Sufficient: ${sufficient}`, 'ARWEAVE');
    
    return {
      sufficient,
      balance,
      required: costEstimate.ar
    };
  } catch (error) {
    logger.error('Failed to check if balance is sufficient', error, 'ARWEAVE');
    throw new ExtensionError(
      'Failed to check wallet balance. Please try again later.',
      ErrorType.ARWEAVE_BALANCE,
      error
    );
  }
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
 * Create a markdown link from a URL
 * @param url URL of the image
 * @param altText Alt text for the image
 * @returns Markdown image link
 */
export function createMarkdownLink(url: string, altText: string): string {
  return `![${altText}](${url})`;
}

/**
 * Generates the Arweave URL for a transaction
 * @param transactionId Arweave transaction ID
 * @returns Arweave gateway URL
 */
export function getArweaveUrl(transactionId: string): string {
  return `https://arweave.net/${transactionId}`;
}

/**
 * Uploads an image file to Arweave with progress reporting
 * @param wallet Arweave wallet object (parsed from JSON)
 * @param filePath Path to the image file to upload
 * @param options Upload options
 * @param progress Optional progress reporter
 * @param token Optional cancellation token
 * @returns Promise resolving to the upload result
 */
export async function uploadToArweave(
  wallet: any,
  filePath: string,
  options: ArweaveUploadOptions,
  progress?: vscode.Progress<{message?: string; increment?: number}>,
  token?: vscode.CancellationToken
): Promise<ArweaveUploadResult> {
  const retrySettings = {
    maxRetries: options.retryCount, 
    delay: options.retryDelay
  };
  
  return withRetry(async () => {
    // Check for cancellation
    if (token?.isCancellationRequested) {
      throw new Error('Operation cancelled by user');
    }
    
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    if (progress) {
      progress.report({ message: 'Reading file data...', increment: 5 });
    }
    
    // Read file data
    const data = fs.readFileSync(filePath);
    
    // Verify we have data
    if (!data || data.length === 0) {
      throw new Error(`Empty file: ${filePath}`);
    }
    
    // Calculate cost estimate
    if (progress) {
      progress.report({ message: 'Calculating cost...', increment: 5 });
    }
    
    const costEstimate = await estimateUploadCost(data.length);
    
    // Create transaction
    if (progress) {
      progress.report({ message: 'Creating transaction...', increment: 5 });
    }
    
    // Check for cancellation
    if (token?.isCancellationRequested) {
      throw new Error('Operation cancelled by user');
    }
    
    const transaction = await arweave.createTransaction({ data }, wallet);
    
    // Add standard content type tag
    transaction.addTag('Content-Type', 'image/webp');
    
    // Add custom metadata tags if enabled
    if (options.enableMetadataTags) {
      // Add some default useful tags
      transaction.addTag('App-Name', 'md-ar-ext');
      transaction.addTag('Content-Type-Original', 'image');
      transaction.addTag('Type', 'image');
      transaction.addTag('Created-Date', new Date().toISOString());
      
      // Add user-defined custom tags
      for (const tag of options.tags) {
        transaction.addTag(tag.name, tag.value);
      }
    }
    
    // Sign transaction
    if (progress) {
      progress.report({ message: 'Signing transaction...', increment: 5 });
    }
    
    // Check for cancellation
    if (token?.isCancellationRequested) {
      throw new Error('Operation cancelled by user');
    }
    
    await arweave.transactions.sign(transaction, wallet);
    
    // Post transaction
    if (progress) {
      progress.report({ message: 'Uploading to Arweave network...', increment: 10 });
    }
    
    // Check for cancellation
    if (token?.isCancellationRequested) {
      throw new Error('Operation cancelled by user');
    }
    
    const response = await arweave.transactions.post(transaction);
    
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
    }
    
    if (progress) {
      progress.report({ message: 'Upload successful! Transaction pending confirmation...', increment: 20 });
    }
    
    const arweaveUrl = getArweaveUrl(transaction.id);
    
    return {
      txId: transaction.id,
      url: arweaveUrl,
      cost: costEstimate,
      pending: true // Initially all transactions are pending
    };
  }, retrySettings.maxRetries, retrySettings.delay);
}

/**
 * Check the status of an Arweave transaction
 * @param txId Transaction ID to verify
 * @returns Promise resolving to transaction status
 */
export async function verifyTransaction(txId: string): Promise<ArweaveTransactionStatus> {
  try {
    // Construct the GraphQL query to check transaction status
    const query = `{
      transactions(ids: ["${txId}"]) {
        edges {
          node {
            id
            block {
              height
              confirmations
            }
          }
        }
      }
    }`;
    
    // Use networkService instead of direct fetch
    const endpoint = 'https://arweave.net/graphql';
    const response = await networkService.post<any>(
      endpoint, 
      { query }, 
      { 'Content-Type': 'application/json' },
      { retries: 2, retryDelay: 1000 }
    );
    
    // Check if transaction is confirmed (has a block)
    const txData = response?.data?.transactions?.edges[0]?.node;
    
    if (!txData) {
      logger.warn(`Transaction ${txId} not found in query response`, 'ARWEAVE');
      return {
        confirmed: false,
        confirmations: 0,
        status: 'pending'
      };
    }
    
    const hasBlock = !!txData.block;
    const confirmations = hasBlock ? txData.block.confirmations || 0 : 0;
    
    logger.debug(`Transaction ${txId} status: confirmed=${hasBlock}, confirmations=${confirmations}`, 'ARWEAVE');
    
    return {
      confirmed: hasBlock,
      confirmations,
      status: hasBlock ? 'confirmed' : 'pending'
    };
  } catch (error) {
    logger.error(`Failed to verify transaction ${txId}`, error, 'ARWEAVE');
    
    // Use the retry functionality built into the networkService
    const retryCallback = async () => {
      await verifyTransaction(txId);
    };
    
    throw createNetworkError(
      'Failed to verify transaction status. Please try again later.',
      { txId, error },
      retryCallback
    );
  }
} 