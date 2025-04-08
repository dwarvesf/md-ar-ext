import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as statistics from '../../../commands/statistics';
import * as statsTracker from '../../../utils/monitoring/statsTracker';
import { TestUtils } from '../utils/testUtils';

suite('Statistics Commands Test Suite', () => {
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

  test('handleDisplayStats should call displayStats', async () => {
    // Stub the function we expect to be called
    const displayStatsStub = sandbox.stub(statsTracker, 'displayStats').resolves();
    
    // Call the handler
    await statistics.handleDisplayStats(mockContext);
    
    // Verify displayStats was called with the context
    assert.ok(displayStatsStub.calledOnce);
    assert.strictEqual(displayStatsStub.firstCall.args[0], mockContext);
  });

  test('handleExportStats should export with JSON format', async () => {
    // Stub the VS Code window.showQuickPick to select JSON format
    sandbox.stub(vscode.window, 'showQuickPick').resolves({ 
      label: 'JSON', 
      description: 'Export as JSON format (detailed data)' 
    });
    
    // Stub the statsTracker.exportStats function
    const exportStatsStub = sandbox.stub(statsTracker, 'exportStats').resolves();
    
    // Call the handler
    await statistics.handleExportStats(mockContext);
    
    // Verify exportStats was called with the context and 'json' format
    assert.ok(exportStatsStub.calledOnce);
    assert.strictEqual(exportStatsStub.firstCall.args[0], mockContext);
    assert.strictEqual(exportStatsStub.firstCall.args[1], 'json');
  });

  test('handleExportStats should export with CSV format', async () => {
    // Stub the VS Code window.showQuickPick to select CSV format
    sandbox.stub(vscode.window, 'showQuickPick').resolves({ 
      label: 'CSV', 
      description: 'Export as CSV format (spreadsheet compatible)' 
    });
    
    // Stub the statsTracker.exportStats function
    const exportStatsStub = sandbox.stub(statsTracker, 'exportStats').resolves();
    
    // Call the handler
    await statistics.handleExportStats(mockContext);
    
    // Verify exportStats was called with the context and 'csv' format
    assert.ok(exportStatsStub.calledOnce);
    assert.strictEqual(exportStatsStub.firstCall.args[0], mockContext);
    assert.strictEqual(exportStatsStub.firstCall.args[1], 'csv');
  });

  test('handleExportStats should do nothing if format selection is cancelled', async () => {
    // Stub the VS Code window.showQuickPick to return undefined (cancelled)
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    
    // Stub the statsTracker.exportStats function
    const exportStatsStub = sandbox.stub(statsTracker, 'exportStats').resolves();
    
    // Call the handler
    await statistics.handleExportStats(mockContext);
    
    // Verify exportStats was not called
    assert.ok(exportStatsStub.notCalled);
  });

  test('handleVerifyTransactions should update transaction status', async () => {
    // Stub the statsTracker.updatePendingTransactions function
    const updatePendingStub = sandbox.stub(statsTracker, 'updatePendingTransactions').resolves();
    
    // Mock VS Code window functions
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Setup withProgress to call the callback function with a progress object
    withProgressStub.callsFake(async (options, task) => {
      const mockProgress = {
        report: sandbox.stub()
      };
      // Call the task with the mock progress and token
      return task(mockProgress as vscode.Progress<{message?: string; increment?: number}>, {
        isCancellationRequested: false
      } as vscode.CancellationToken);
    });
    
    // Call the handler
    await statistics.handleVerifyTransactions(mockContext);
    
    // Verify updatePendingTransactions was called with the context
    assert.ok(updatePendingStub.calledOnce);
    assert.strictEqual(updatePendingStub.firstCall.args[0], mockContext);
    
    // Verify withProgress was called
    assert.ok(withProgressStub.calledOnce);
    
    // Verify the completion message was shown
    assert.ok(showInfoStub.calledOnce);
    assert.ok(showInfoStub.firstCall.args[0].includes('completed'));
  });

  test('handleVerifyTransactions should handle errors', async () => {
    // Stub the statsTracker.updatePendingTransactions to throw an error
    const error = new Error('Network error');
    const updatePendingStub = sandbox.stub(statsTracker, 'updatePendingTransactions').rejects(error);
    
    // Mock VS Code window functions
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    
    // Setup withProgress to call the callback function with a progress object
    withProgressStub.callsFake(async (options, task) => {
      const mockProgress = {
        report: sandbox.stub()
      };
      // Call the task with the mock progress and token
      return task(mockProgress as vscode.Progress<{message?: string; increment?: number}>, {
        isCancellationRequested: false
      } as vscode.CancellationToken);
    });
    
    // Call the handler
    await statistics.handleVerifyTransactions(mockContext);
    
    // Verify updatePendingTransactions was called with the context
    assert.ok(updatePendingStub.calledOnce);
    assert.strictEqual(updatePendingStub.firstCall.args[0], mockContext);
    
    // Verify withProgress was called
    assert.ok(withProgressStub.calledOnce);
    
    // Verify the error message was shown
    assert.ok(showErrorStub.calledOnce);
    assert.ok(showErrorStub.firstCall.args[0].includes('Failed to verify transactions'));
    assert.ok(showErrorStub.firstCall.args[0].includes('Network error'));
  });
}); 