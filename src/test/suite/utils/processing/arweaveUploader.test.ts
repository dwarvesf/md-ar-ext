import * as assert from 'assert';
import * as sinon from 'sinon';
import * as arweaveUploader from '../../../../utils/processing/arweaveUploader';
import { TestUtils } from '../../utils/testUtils';
import { ExtensionError, ErrorType } from '../../../../utils/monitoring/errorHandler';
import { networkService } from '../../../../utils/networking/networkService';

suite('ArweaveUploader Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  
  setup(() => {
    sandbox = TestUtils.setup();
  });
  
  teardown(() => {
    TestUtils.teardown();
  });

  test('getArToUsdRate should return exchange rate when successful', async () => {
    // Mock network service
    const mockData = { arweave: { usd: 15.75 } };
    sandbox.stub(networkService, 'get').resolves(mockData);
    
    const rate = await arweaveUploader.getArToUsdRate();
    
    assert.strictEqual(rate, 15.75);
  });
  
  test('getArToUsdRate should return null on network error', async () => {
    // Mock network service to simulate error
    sandbox.stub(networkService, 'get').rejects(new Error('Network error'));
    
    const rate = await arweaveUploader.getArToUsdRate();
    
    assert.strictEqual(rate, null);
  });
  
  test('getArToUsdRate should return null on invalid response format', async () => {
    // Mock network service with invalid data
    sandbox.stub(networkService, 'get').resolves({ invalidFormat: true });
    
    const rate = await arweaveUploader.getArToUsdRate();
    
    assert.strictEqual(rate, null);
  });
  
  test('checkWalletBalance should return wallet balance', async () => {
    // Mock arweave client methods
    const mockWallet = { test: 'wallet' };
    const mockAddress = 'mock-wallet-address';
    const mockWinstonBalance = '1000000000000';
    const mockArBalance = '1.000000000000';
    
    sandbox.stub(arweaveUploader.arweaveClient.wallets, 'getAddress').withArgs(sinon.match(mockWallet)).resolves(mockAddress);
    sandbox.stub(arweaveUploader.arweaveClient.wallets, 'getBalance').withArgs(mockAddress).resolves(mockWinstonBalance);
    sandbox.stub(arweaveUploader.arweaveClient.ar, 'winstonToAr').withArgs(mockWinstonBalance).returns(mockArBalance);
    
    const balance = await arweaveUploader.checkWalletBalance(mockWallet);
    
    assert.strictEqual(balance, mockArBalance);
  });
  
  test('checkWalletBalance should throw ExtensionError on failure', async () => {
    // Mock arweave client methods to simulate error
    const mockWallet = { test: 'wallet' };
    sandbox.stub(arweaveUploader.arweaveClient.wallets, 'getAddress').rejects(new Error('Connection failed'));
    
    await assert.rejects(
      async () => await arweaveUploader.checkWalletBalance(mockWallet),
      (error: ExtensionError) => {
        assert.ok(error instanceof ExtensionError);
        assert.strictEqual(error.type, ErrorType.arweaveWallet);
        assert.ok(error.message.includes('Failed to check wallet balance'));
        return true;
      }
    );
  });
  
  test('getWalletAddress should return wallet address', async () => {
    // Mock arweave client methods
    const mockWallet = { test: 'wallet' };
    const mockAddress = 'mock-wallet-address';
    
    sandbox.stub(arweaveUploader.arweaveClient.wallets, 'getAddress').withArgs(sinon.match(mockWallet)).resolves(mockAddress);
    
    const address = await arweaveUploader.getWalletAddress(mockWallet);
    
    assert.strictEqual(address, mockAddress);
  });
  
  test('estimateUploadCost should return AR and USD costs', async () => {
    // Mock arweave client methods
    const fileSizeBytes = 1024 * 1024; // 1MB
    const winstonPrice = '1000000000';
    const arPrice = '0.000001000';
    
    sandbox.stub(arweaveUploader.arweaveClient.transactions, 'getPrice').withArgs(fileSizeBytes).resolves(winstonPrice);
    sandbox.stub(arweaveUploader.arweaveClient.ar, 'winstonToAr').withArgs(winstonPrice).returns(arPrice);
    
    // Mock exchange rate
    sandbox.stub(arweaveUploader, 'getArToUsdRate').resolves(10.5);
    
    const cost = await arweaveUploader.estimateUploadCost(fileSizeBytes);
    
    assert.strictEqual(cost.ar, arPrice);
    assert.strictEqual(cost.usd, '0.0000');  // 0.000001 * 10.5 rounded to 4 decimal places
  });
  
  test('estimateUploadCost should use approximation on API failure', async () => {
    // Mock arweave client methods to simulate error
    const fileSizeBytes = 1024 * 1024 * 100; // 100MB
    
    sandbox.stub(arweaveUploader.arweaveClient.transactions, 'getPrice').rejects(new Error('API error'));
    sandbox.stub(arweaveUploader, 'getArToUsdRate').resolves(null);
    
    const cost = await arweaveUploader.estimateUploadCost(fileSizeBytes);
    
    // Approximation is about 100MB / 1GB = 0.09766... AR
    assert.strictEqual(parseFloat(cost.ar).toFixed(5), '0.09766');
    assert.strictEqual(cost.usd, null);
  });
  
  test('checkBalanceSufficient should return correct status when sufficient', async () => {
    const mockWallet = { test: 'wallet' };
    const fileSizeBytes = 1024 * 1024; // 1MB
    
    // Mock balance and cost estimation
    sandbox.stub(arweaveUploader, 'checkWalletBalance').resolves('1.5');
    sandbox.stub(arweaveUploader, 'estimateUploadCost').resolves({ ar: '0.5', usd: '5.25' });
    
    const result = await arweaveUploader.checkBalanceSufficient(mockWallet, fileSizeBytes);
    
    assert.strictEqual(result.sufficient, true);
    assert.strictEqual(result.balance, '1.5');
    assert.strictEqual(result.required, '0.5');
  });
  
  test('checkBalanceSufficient should return correct status when insufficient', async () => {
    const mockWallet = { test: 'wallet' };
    const fileSizeBytes = 1024 * 1024 * 1024; // 1GB
    
    // Mock balance and cost estimation
    sandbox.stub(arweaveUploader, 'checkWalletBalance').resolves('0.5');
    sandbox.stub(arweaveUploader, 'estimateUploadCost').resolves({ ar: '1.0', usd: '10.50' });
    
    const result = await arweaveUploader.checkBalanceSufficient(mockWallet, fileSizeBytes);
    
    assert.strictEqual(result.sufficient, false);
    assert.strictEqual(result.balance, '0.5');
    assert.strictEqual(result.required, '1.0');
  });
  
  test('formatFileSize should format sizes correctly', () => {
    // Test with different size ranges
    assert.strictEqual(arweaveUploader.formatFileSize(500), '500 B');
    assert.strictEqual(arweaveUploader.formatFileSize(1024), '1.0 KB');
    assert.strictEqual(arweaveUploader.formatFileSize(1536), '1.5 KB');
    assert.strictEqual(arweaveUploader.formatFileSize(1048576), '1.0 MB');
    assert.strictEqual(arweaveUploader.formatFileSize(1073741824), '1.0 GB');
  });
  
  test('createMarkdownLink should return correctly formatted link', () => {
    const result = arweaveUploader.createMarkdownLink('https://example.com', 'Example Link');
    assert.strictEqual(result, '[Example Link](https://example.com)');
  });
  
  test('getArweaveUrl should return correct URL for transaction ID', () => {
    const result = arweaveUploader.getArweaveUrl('test-transaction-id');
    assert.strictEqual(result, 'https://viewblock.io/arweave/tx/test-transaction-id');
  });
  
  test('verifyTransaction should return transaction status', async () => {
    // Mock response for confirmed transaction
    const mockConfirmedResponse = {
      data: {
        transactions: {
          edges: [
            {
              node: {
                id: 'test-tx-id',
                block: {
                  height: 12345,
                  confirmations: 10
                }
              }
            }
          ]
        }
      }
    };
    
    sandbox.stub(networkService, 'post').resolves(mockConfirmedResponse);
    
    const result = await arweaveUploader.verifyTransaction('test-tx-id');
    
    assert.strictEqual(result.confirmed, true);
    assert.strictEqual(result.confirmations, 10);
    assert.strictEqual(result.status, 'confirmed');
  });
  
  test('verifyTransaction should handle pending transaction', async () => {
    // Mock response for pending transaction
    const mockPendingResponse = {
      data: {
        transactions: {
          edges: []
        }
      }
    };
    
    sandbox.stub(networkService, 'post').resolves(mockPendingResponse);
    
    const result = await arweaveUploader.verifyTransaction('pending-tx-id');
    
    assert.strictEqual(result.confirmed, false);
    assert.strictEqual(result.confirmations, 0);
    assert.strictEqual(result.status, 'pending');
  });
  
  test('verifyTransaction should throw ExtensionError on network failure', async () => {
    // Mock network failure
    sandbox.stub(networkService, 'post').rejects(new Error('Network error'));
    
    await assert.rejects(
      async () => await arweaveUploader.verifyTransaction('test-tx-id'),
      (error: ExtensionError) => {
        assert.ok(error instanceof ExtensionError);
        assert.strictEqual(error.type, ErrorType.networkRequest);
        assert.ok(error.message.includes('Failed to verify transaction'));
        return true;
      }
    );
  });
}); 