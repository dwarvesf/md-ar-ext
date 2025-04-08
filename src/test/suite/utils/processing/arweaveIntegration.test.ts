import * as assert from 'assert';
import * as mocha from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { networkService } from '../../../../utils/networking/networkService';
import * as arweaveUploader from '../../../../utils/processing/arweaveUploader';
import { ExtensionError, ErrorType } from '../../../../utils/monitoring/errorHandler';
import { logger } from '../../../../utils/monitoring/logger';

const { suite, test, setup, teardown } = mocha;

suite('ArweaveUploader and NetworkService Integration Tests', () => {
  // Stubs for network requests
  let networkGetStub: sinon.SinonStub;
  let networkPostStub: sinon.SinonStub;
  
  // Sample data
  const mockExchangeRateData = {
    arweave: {
      usd: 12.34
    }
  };
  
  const mockGraphQLResponse = {
    data: {
      transactions: {
        edges: [
          {
            node: {
              id: 'test-transaction-id',
              block: {
                height: 12345,
                confirmations: 5
              }
            }
          }
        ]
      }
    }
  };
  
  setup(() => {
    // Stub network service methods
    networkGetStub = sinon.stub(networkService, 'get');
    networkPostStub = sinon.stub(networkService, 'post');
    
    // Stub logger to avoid console output during tests
    sinon.stub(logger, 'debug').returns();
    sinon.stub(logger, 'info').returns();
    sinon.stub(logger, 'warn').returns();
    sinon.stub(logger, 'error').returns();
  });
  
  teardown(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  test('getArToUsdRate should use networkService and return correct rate', async () => {
    // Setup mock response
    networkGetStub.resolves(mockExchangeRateData);
    
    // Call the function
    const rate = await arweaveUploader.getArToUsdRate();
    
    // Assertions
    assert.strictEqual(rate, 12.34);
    assert.strictEqual(networkGetStub.calledOnce, true);
    assert.ok(networkGetStub.firstCall.args[0].includes('coingecko'));
  });
  
  test('getArToUsdRate should handle errors gracefully', async () => {
    // Setup mock error
    networkGetStub.rejects(new Error('Network error'));
    
    // Call the function
    const rate = await arweaveUploader.getArToUsdRate();
    
    // Assertions
    assert.strictEqual(rate, null);
    assert.strictEqual(networkGetStub.calledOnce, true);
  });
  
  test('verifyTransaction should use networkService and return correct status', async () => {
    // Setup mock response
    networkPostStub.resolves(mockGraphQLResponse);
    
    // Call the function
    const status = await arweaveUploader.verifyTransaction('test-transaction-id');
    
    // Assertions
    assert.strictEqual(status.confirmed, true);
    assert.strictEqual(status.confirmations, 5);
    assert.strictEqual(status.status, 'confirmed');
    assert.strictEqual(networkPostStub.calledOnce, true);
    assert.ok(networkPostStub.firstCall.args[0].includes('graphql'));
    assert.ok(networkPostStub.firstCall.args[1].query.includes('test-transaction-id'));
  });
  
  test('verifyTransaction should handle empty response correctly', async () => {
    // Setup mock empty response
    networkPostStub.resolves({
      data: {
        transactions: {
          edges: []
        }
      }
    });
    
    // Call the function
    const status = await arweaveUploader.verifyTransaction('non-existent-id');
    
    // Assertions
    assert.strictEqual(status.confirmed, false);
    assert.strictEqual(status.confirmations, 0);
    assert.strictEqual(status.status, 'pending');
  });
  
  test('verifyTransaction should throw ExtensionError on network failure', async () => {
    // Setup mock network error
    networkPostStub.rejects(new Error('Network failure'));
    
    // Call the function and expect an error
    try {
      await arweaveUploader.verifyTransaction('test-transaction-id');
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.ok(error instanceof ExtensionError);
      assert.strictEqual((error as ExtensionError).type, ErrorType.NETWORK_REQUEST);
      assert.ok((error as ExtensionError).message.includes('Failed to verify transaction'));
    }
  });
}); 