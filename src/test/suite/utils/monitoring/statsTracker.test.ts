import * as assert from 'assert';
import * as sinon from 'sinon';
import * as statsTracker from '../../../../utils/monitoring/statsTracker';
import * as vscode from 'vscode';
import { TestUtils } from '../../utils/testUtils';

suite('StatsTracker Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;
  
  setup(async () => {
    sandbox = TestUtils.setup();
    
    // Create mock ExtensionContext with globalState
    mockContext = {
      globalState: {
        get: sandbox.stub(),
        update: sandbox.stub().resolves(),
        keys: () => []
      }
    } as unknown as vscode.ExtensionContext;
  });
  
  teardown(() => {
    TestUtils.teardown();
  });

  test('getStats should initialize stats if none exist', async () => {
    // Stub globalState.get to return undefined (no stats)
    (mockContext.globalState.get as sinon.SinonStub).returns(undefined);
    
    const stats = statsTracker.getStats(mockContext);
    
    // Verify stats were initialized
    assert.strictEqual(stats.totalUploads, 0);
    assert.strictEqual(stats.totalOriginalSizeBytes, 0);
    assert.strictEqual(stats.totalUploadedSizeBytes, 0);
    assert.strictEqual(stats.totalSizeSavings, 0);
    assert.strictEqual(stats.totalCostAR, 0);
    assert.strictEqual(stats.totalEstimatedCostUSD, 0);
    assert.ok(Array.isArray(stats.uploads));
    assert.strictEqual(stats.uploads.length, 0);
    
    // Verify stats were stored
    assert.ok((mockContext.globalState.update as sinon.SinonStub).calledOnce);
  });

  test('getStats should handle legacy stats format', async () => {
    // Create legacy stats object
    const legacyStats = {
      totalUploads: 2,
      totalSizeBytes: 1000,
      totalCostAR: 0.5,
      uploads: [
        {
          date: '2023-01-01T00:00:00.000Z',
          fileName: 'test1.jpg',
          sizeBytes: 500,
          costAR: '0.2',
          txId: 'tx1'
        },
        {
          date: '2023-01-02T00:00:00.000Z',
          fileName: 'test2.jpg',
          sizeBytes: 500,
          costAR: '0.3',
          txId: 'tx2'
        }
      ]
    };
    
    // Stub globalState.get to return legacy stats
    (mockContext.globalState.get as sinon.SinonStub).returns(legacyStats);
    
    const stats = statsTracker.getStats(mockContext);
    
    // Verify legacy stats were converted
    assert.strictEqual(stats.totalUploads, 2);
    assert.strictEqual(stats.totalOriginalSizeBytes, 1000);
    assert.strictEqual(stats.totalUploadedSizeBytes, 1000);
    assert.strictEqual(stats.totalCostAR, 0.5);
    assert.strictEqual(stats.uploads.length, 2);
    
    // Verify the first upload was converted correctly
    const firstUpload = stats.uploads[0];
    assert.strictEqual(firstUpload.fileName, 'test1.jpg');
    assert.strictEqual(firstUpload.originalSizeBytes, 500);
    assert.strictEqual(firstUpload.uploadedSizeBytes, 500);
    assert.strictEqual(firstUpload.costAR, '0.2');
    assert.strictEqual(firstUpload.status, 'confirmed');
  });

  test('trackUpload should add new upload record', async () => {
    // Initialize empty stats
    const emptyStats = {
      totalUploads: 0,
      totalOriginalSizeBytes: 0,
      totalUploadedSizeBytes: 0,
      totalSizeSavings: 0,
      totalCostAR: 0,
      totalEstimatedCostUSD: 0,
      uploads: [],
      lastUpdateTime: '2023-01-01T00:00:00.000Z'
    };
    
    // Stub globalState.get to return empty stats
    (mockContext.globalState.get as sinon.SinonStub).returns(emptyStats);
    
    // Track a new upload
    await statsTracker.trackUpload(
      mockContext,
      'test.jpg',
      1000,
      800,
      '0.1',
      '0.05',
      'tx123',
      'image/jpeg'
    );
    
    // Verify update was called with updated stats
    assert.ok((mockContext.globalState.update as sinon.SinonStub).calledOnce);
    
    // Get the updated stats from the update call
    const updatedStats = (mockContext.globalState.update as sinon.SinonStub).firstCall.args[1];
    
    // Verify stats were updated correctly
    assert.strictEqual(updatedStats.totalUploads, 1);
    assert.strictEqual(updatedStats.totalOriginalSizeBytes, 1000);
    assert.strictEqual(updatedStats.totalUploadedSizeBytes, 800);
    assert.strictEqual(updatedStats.totalSizeSavings, 200);
    assert.strictEqual(updatedStats.totalCostAR, 0.1);
    assert.strictEqual(updatedStats.totalEstimatedCostUSD, 0.05);
    assert.strictEqual(updatedStats.uploads.length, 1);
    
    // Verify upload record has correct data
    const upload = updatedStats.uploads[0];
    assert.strictEqual(upload.fileName, 'test.jpg');
    assert.strictEqual(upload.originalSizeBytes, 1000);
    assert.strictEqual(upload.uploadedSizeBytes, 800);
    assert.strictEqual(upload.sizeSavingPercent, 20);
    assert.strictEqual(upload.costAR, '0.1');
    assert.strictEqual(upload.estimatedCostUSD, '0.05');
    assert.strictEqual(upload.txId, 'tx123');
    assert.strictEqual(upload.status, 'pending');
    assert.strictEqual(upload.contentType, 'image/jpeg');
  });

  test('updateTransactionStatus should update status for existing txId', async () => {
    // Create stats with a pending transaction
    const statsWithPending = {
      totalUploads: 1,
      totalOriginalSizeBytes: 1000,
      totalUploadedSizeBytes: 800,
      totalSizeSavings: 200,
      totalCostAR: 0.1,
      totalEstimatedCostUSD: 0.05,
      uploads: [
        {
          date: '2023-01-01T00:00:00.000Z',
          fileName: 'test.jpg',
          originalSizeBytes: 1000,
          uploadedSizeBytes: 800,
          sizeSavingPercent: 20,
          costAR: '0.1',
          estimatedCostUSD: '0.05',
          txId: 'tx123',
          status: 'pending',
          contentType: 'image/jpeg'
        }
      ],
      lastUpdateTime: '2023-01-01T00:00:00.000Z'
    };
    
    // Stub globalState.get to return stats with pending
    (mockContext.globalState.get as sinon.SinonStub).returns(statsWithPending);
    
    // Update transaction status
    await statsTracker.updateTransactionStatus(mockContext, 'tx123', 'confirmed');
    
    // Verify update was called with updated stats
    assert.ok((mockContext.globalState.update as sinon.SinonStub).calledOnce);
    
    // Get the updated stats from the update call
    const updatedStats = (mockContext.globalState.update as sinon.SinonStub).firstCall.args[1];
    
    // Verify transaction status was updated
    assert.strictEqual(updatedStats.uploads[0].status, 'confirmed');
  });

  test('updateTransactionStatus should not update if txId not found', async () => {
    // Create stats with a transaction
    const statsWithTransaction = {
      totalUploads: 1,
      totalOriginalSizeBytes: 1000,
      totalUploadedSizeBytes: 800,
      totalSizeSavings: 200,
      totalCostAR: 0.1,
      totalEstimatedCostUSD: 0.05,
      uploads: [
        {
          date: '2023-01-01T00:00:00.000Z',
          fileName: 'test.jpg',
          originalSizeBytes: 1000,
          uploadedSizeBytes: 800,
          sizeSavingPercent: 20,
          costAR: '0.1',
          estimatedCostUSD: '0.05',
          txId: 'tx123',
          status: 'pending',
          contentType: 'image/jpeg'
        }
      ],
      lastUpdateTime: '2023-01-01T00:00:00.000Z'
    };
    
    // Stub globalState.get to return stats
    (mockContext.globalState.get as sinon.SinonStub).returns(statsWithTransaction);
    
    // Update transaction status with non-existent txId
    await statsTracker.updateTransactionStatus(mockContext, 'non-existent-tx', 'confirmed');
    
    // Verify update was not called
    assert.ok((mockContext.globalState.update as sinon.SinonStub).notCalled);
  });

  test('clearStats should initialize new empty stats', async () => {
    // Create some existing stats
    const existingStats = {
      totalUploads: 2,
      totalOriginalSizeBytes: 2000,
      totalUploadedSizeBytes: 1600,
      totalSizeSavings: 400,
      totalCostAR: 0.2,
      totalEstimatedCostUSD: 0.1,
      uploads: [
        { /* upload 1 details */ },
        { /* upload 2 details */ }
      ],
      lastUpdateTime: '2023-01-01T00:00:00.000Z'
    };
    
    // Stub globalState.get to return existing stats
    (mockContext.globalState.get as sinon.SinonStub).returns(existingStats);
    
    // Clear stats
    await statsTracker.clearStats(mockContext);
    
    // Verify update was called with empty stats
    assert.ok((mockContext.globalState.update as sinon.SinonStub).calledOnce);
    
    // Get the updated stats from the update call
    const updatedStats = (mockContext.globalState.update as sinon.SinonStub).firstCall.args[1];
    
    // Verify stats were cleared
    assert.strictEqual(updatedStats.totalUploads, 0);
    assert.strictEqual(updatedStats.totalOriginalSizeBytes, 0);
    assert.strictEqual(updatedStats.totalUploadedSizeBytes, 0);
    assert.strictEqual(updatedStats.totalSizeSavings, 0);
    assert.strictEqual(updatedStats.totalCostAR, 0);
    assert.strictEqual(updatedStats.totalEstimatedCostUSD, 0);
    assert.strictEqual(updatedStats.uploads.length, 0);
  });

  test('formatStats should generate human-readable summary', async () => {
    // Create sample stats
    const sampleStats: statsTracker.UploadStats = {
      totalUploads: 2,
      totalOriginalSizeBytes: 2000000, // 2 MB
      totalUploadedSizeBytes: 1600000, // 1.6 MB
      totalSizeSavings: 400000, // 400 KB
      totalCostAR: 0.2,
      totalEstimatedCostUSD: 0.1,
      uploads: [
        {
          date: '2023-01-01T00:00:00.000Z',
          fileName: 'test1.jpg',
          originalSizeBytes: 1000000,
          uploadedSizeBytes: 800000,
          sizeSavingPercent: 20,
          costAR: '0.1',
          estimatedCostUSD: '0.05',
          txId: 'tx1',
          status: 'confirmed' as const,
          contentType: 'image/jpeg'
        },
        {
          date: '2023-01-02T00:00:00.000Z',
          fileName: 'test2.jpg',
          originalSizeBytes: 1000000,
          uploadedSizeBytes: 800000,
          sizeSavingPercent: 20,
          costAR: '0.1',
          estimatedCostUSD: '0.05',
          txId: 'tx2',
          status: 'pending' as const,
          contentType: 'image/jpeg'
        }
      ],
      lastUpdateTime: '2023-01-02T00:00:00.000Z'
    };
    
    const formattedStats = statsTracker.formatStats(sampleStats);
    
    // Basic verification that the formatted stats includes key information
    assert.ok(formattedStats.includes('Total Uploads: 2'));
    assert.ok(formattedStats.includes('Total Original Size:'));
    assert.ok(formattedStats.includes('Total Uploaded Size:'));
    assert.ok(formattedStats.includes('Total Size Savings:'));
    assert.ok(formattedStats.includes('Total Cost:'));
    assert.ok(formattedStats.includes('test1.jpg'));
    assert.ok(formattedStats.includes('test2.jpg'));
  });
}); 