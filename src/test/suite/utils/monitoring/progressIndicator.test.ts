import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as progressIndicator from '../../../../utils/monitoring/progressIndicator';
import { TestUtils } from '../../utils/testUtils';

suite('ProgressIndicator Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  
  setup(async () => {
    sandbox = TestUtils.setup();
  });
  
  teardown(() => {
    TestUtils.teardown();
  });

  test('withProgress should execute task with progress indication', async () => {
    // Mock VS Code window.withProgress
    const taskResult = { success: true };
    const taskFunction = sinon.stub().resolves(taskResult);
    
    // Mock progress object
    const mockProgress = {
      report: sinon.stub()
    };
    
    // Mock cancellation token
    const mockToken = {
      isCancellationRequested: false,
      onCancellationRequested: sinon.stub()
    };
    
    // Mock VS Code withProgress with proper typing
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    withProgressStub.callsFake(function(options, taskFn) {
      // Call the task function with the mock progress and token
      return taskFn(
        mockProgress as vscode.Progress<{message?: string; increment?: number}>,
        mockToken as vscode.CancellationToken
      );
    });
    
    // Call withProgress with our task
    const result = await progressIndicator.withProgress('Test Task', taskFunction);
    
    // Verify withProgress was called correctly
    assert.ok(withProgressStub.calledOnce);
    assert.strictEqual(withProgressStub.firstCall.args[0].title, 'Test Task');
    
    // Verify our task was called with the progress object
    assert.ok(taskFunction.calledOnce);
    assert.strictEqual(taskFunction.firstCall.args[0], mockProgress);
    
    // Verify the result
    assert.deepStrictEqual(result, taskResult);
  });

  test('withCancellableProgress should support cancellation', async () => {
    // Mock VS Code window.withProgress
    const taskResult = { success: true };
    const taskFunction = sinon.stub().resolves(taskResult);
    
    // Mock progress object and cancellation token
    const mockProgress = {
      report: sinon.stub()
    };
    const mockToken = {
      isCancellationRequested: false,
      onCancellationRequested: sinon.stub()
    };
    
    // Mock VS Code withProgress with proper typing
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    withProgressStub.callsFake(function(options, taskFn) {
      // Call the task function with the mock progress and token
      return taskFn(
        mockProgress as vscode.Progress<{message?: string; increment?: number}>,
        mockToken as vscode.CancellationToken
      );
    });
    
    // Call withCancellableProgress with our task
    const result = await progressIndicator.withCancellableProgress('Cancellable Task', taskFunction);
    
    // Verify withProgress was called correctly
    assert.ok(withProgressStub.calledOnce);
    assert.strictEqual(withProgressStub.firstCall.args[0].title, 'Cancellable Task');
    
    // Verify our task was called with progress and token
    assert.ok(taskFunction.calledOnce);
    assert.strictEqual(taskFunction.firstCall.args[0], mockProgress);
    assert.strictEqual(taskFunction.firstCall.args[1], mockToken);
    
    // Verify the result
    assert.deepStrictEqual(result, taskResult);
  });

  test('createProgressHandler should report progress for steps', async () => {
    // Create a mock progress object
    const mockProgress = {
      report: sinon.stub()
    };
    
    // Create a progress handler with 4 steps
    const handler = progressIndicator.createProgressHandler(4);
    
    // Advance through each step and check reporting
    handler.nextStep(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 'Step 1');
    assert.ok(mockProgress.report.calledOnce);
    assert.deepStrictEqual(mockProgress.report.firstCall.args[0], { 
      message: 'Step 1', 
      increment: 25 // 100% / 4 steps = 25%
    });
    
    handler.nextStep(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 'Step 2');
    assert.deepStrictEqual(mockProgress.report.secondCall.args[0], { 
      message: 'Step 2',
      increment: 25
    });
    
    // Test setPercentage method
    handler.setPercentage(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 75, 'Custom percentage');
    assert.deepStrictEqual(mockProgress.report.thirdCall.args[0], { 
      message: 'Custom percentage',
      increment: 25 // 75% - (2 steps * 25%)
    });
    
    // Test when increment would be negative (should not include increment)
    handler.setPercentage(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 30, 'Lower percentage');
    assert.deepStrictEqual(mockProgress.report.getCall(3).args[0], { 
      message: 'Lower percentage'
      // No increment since 30% < current progress
    });
  });

  test('createTimeEstimateProgressHandler should calculate time estimates', async () => {
    // Mock Date.now to control time
    let currentTime = 1000;
    sandbox.stub(Date, 'now').callsFake(() => currentTime);
    
    // Create a mock progress object
    const mockProgress = {
      report: sinon.stub()
    };
    
    // Create a time estimate handler for 1000 bytes
    const handler = progressIndicator.createTimeEstimateProgressHandler(1000);
    
    // Process 200 bytes, advancing time by 2 seconds (100 bytes/second)
    currentTime += 2000;
    handler.update(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 200);
    
    // Verify progress report
    assert.ok(mockProgress.report.calledOnce);
    const firstReport = mockProgress.report.firstCall.args[0];
    assert.strictEqual(firstReport.increment, 20); // 200/1000 * 100 = 20%
    
    // Should have 8 seconds remaining (800 bytes at 100 bytes/sec)
    assert.ok(firstReport.message?.includes('8s remaining'));
    
    // Process another 300 bytes, advancing time by 1.5 seconds (200 bytes/second)
    currentTime += 1500;
    handler.update(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 300);
    
    // Average speed should now be (100 + 200) / 2 = 150 bytes/second
    // Remaining time should be 500 bytes / 150 bytes/sec = 3.33 seconds
    const secondReport = mockProgress.report.secondCall.args[0];
    assert.strictEqual(secondReport.increment, 30); // 300/1000 * 100 = 30%
    assert.ok(secondReport.message?.includes('4s remaining')); // Rounded up from 3.33
    
    // Complete the task
    currentTime += 3000;
    handler.complete(mockProgress as vscode.Progress<{ message?: string; increment?: number }>, 'Upload complete');
    
    // Verify completion message
    const completionReport = mockProgress.report.thirdCall.args[0];
    assert.ok(completionReport.message?.includes('Upload complete'));
    assert.ok(completionReport.message?.includes('Completed in 6.5s')); // Total time
    assert.strictEqual(completionReport.increment, 50); // Remaining progress
  });
}); 