import fetch, { Response } from 'node-fetch';
import { logger } from '../monitoring/logger';
import { ExtensionError, ErrorType, createNetworkError } from '../monitoring/errorHandler';

/**
 * Network request options
 */
export interface NetworkRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | Buffer | ArrayBuffer;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Default network request options
 */
const DEFAULT_OPTIONS: NetworkRequestOptions = {
  method: 'GET',
  timeout: 30000,  // 30 seconds
  retries: 3,      // 3 retries
  retryDelay: 1000 // 1 second
};

/**
 * Centralized network service for making HTTP requests
 */
export class NetworkService {
  private static instance: NetworkService;
  
  /**
   * Create a new network service instance
   */
  private constructor() {}
  
  /**
   * Get or create the network service instance
   * @returns NetworkService instance
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }
  
  /**
   * Create a timeout promise that rejects after the specified time
   * @param ms Timeout in milliseconds
   * @returns Promise that rejects after timeout
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ExtensionError(
          `Request timed out after ${ms}ms`,
          ErrorType.NETWORK_TIMEOUT
        ));
      }, ms);
    });
  }
  
  /**
   * Delay execution for the specified time
   * @param ms Delay in milliseconds
   * @returns Promise that resolves after delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Make a network request with retries and timeout
   * @param url Request URL
   * @param options Request options
   * @returns Promise resolving to the response
   * @throws ExtensionError on network failure
   */
  public async request<T>(url: string, options: NetworkRequestOptions = {}): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { retries = 3, retryDelay = 1000, timeout = 30000 } = opts;
    
    let lastError: Error | unknown;
    
    // Try the request with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger.debug(`Making ${opts.method} request to ${url} (attempt ${attempt + 1}/${retries + 1})`, 'NETWORK');
        
        // Create the fetch promise
        const fetchPromise = fetch(url, {
          method: opts.method,
          headers: opts.headers,
          body: opts.body as any
        });
        
        // Add timeout
        const response: Response = await Promise.race([
          fetchPromise,
          this.createTimeout(timeout)
        ]);
        
        // Check for HTTP errors
        if (!response.ok) {
          throw new ExtensionError(
            `HTTP error ${response.status}: ${response.statusText}`,
            ErrorType.NETWORK_RESPONSE,
            { status: response.status, statusText: response.statusText }
          );
        }
        
        // Determine response type and parse accordingly
        const contentType = response.headers.get('content-type') || '';
        let data: T;
        
        if (contentType.includes('application/json')) {
          data = await response.json() as T;
        } else if (contentType.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.arrayBuffer() as unknown as T;
        }
        
        logger.debug(`Request to ${url} successful`, 'NETWORK');
        return data;
      } catch (error) {
        lastError = error;
        logger.warn(`Request to ${url} failed (attempt ${attempt + 1}/${retries + 1}): ${error instanceof Error ? error.message : String(error)}`, 'NETWORK');
        
        // Only delay if we're going to retry
        if (attempt < retries) {
          // Use exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          logger.debug(`Retrying in ${delay}ms...`, 'NETWORK');
          await this.delay(delay);
        }
      }
    }
    
    // If we got here, all retries failed
    const message = `Request to ${url} failed after ${retries + 1} attempts`;
    
    // Create a retry callback for the user
    const retryCallback = async () => {
      try {
        await this.request<T>(url, options);
      } catch (error) {
        // Retry failed, already logged
      }
    };
    
    // Create and throw a network error
    throw createNetworkError(
      message,
      { url, lastError },
      retryCallback
    );
  }
  
  /**
   * Make a GET request
   * @param url Request URL
   * @param headers Optional headers
   * @param options Additional options
   * @returns Promise resolving to the response
   */
  public async get<T>(url: string, headers?: Record<string, string>, options?: NetworkRequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
      headers
    });
  }
  
  /**
   * Make a POST request
   * @param url Request URL
   * @param body Request body
   * @param headers Optional headers
   * @param options Additional options
   * @returns Promise resolving to the response
   */
  public async post<T>(url: string, body: any, headers?: Record<string, string>, options?: NetworkRequestOptions): Promise<T> {
    const isJson = typeof body === 'object';
    const contentHeaders = {
      'Content-Type': isJson ? 'application/json' : 'text/plain',
      ...headers
    };
    
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      headers: contentHeaders,
      body: isJson ? JSON.stringify(body) : body
    });
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance(); 