import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as wallet from '../../../commands/wallet';
import * as keyManager from '../../../utils/storage/keyManager';
import * as arweaveUploader from '../../../utils/processing/arweaveUploader';
import { TestUtils } from '../utils/testUtils';

suite('Wallet Commands Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;
  
  setup(async () => {
    sandbox = TestUtils.setup();
    
    // Create mock ExtensionContext with secrets
    mockContext = {
      secrets: {
        store: sandbox.stub().resolves(),
        get: sandbox.stub().resolves(),
        delete: sandbox.stub().resolves()
      }
    } as unknown as vscode.ExtensionContext;
  });
  
  teardown(() => {
    TestUtils.teardown();
  });

  test('handleUpdatePrivateKey should call updatePrivateKey', async () => {
    // Stub the function we expect to be called
    const updateKeyStub = sandbox.stub(keyManager, 'updatePrivateKey').resolves(true);
    
    // Call the handler
    await wallet.handleUpdatePrivateKey(mockContext);
    
    // Verify updatePrivateKey was called with the context
    assert.ok(updateKeyStub.calledOnce);
    assert.strictEqual(updateKeyStub.firstCall.args[0], mockContext);
  });

  test('handleDeletePrivateKey should call deletePrivateKey', async () => {
    // Stub the function we expect to be called
    const deleteKeyStub = sandbox.stub(keyManager, 'deletePrivateKey').resolves();
    
    // Call the handler
    await wallet.handleDeletePrivateKey(mockContext);
    
    // Verify deletePrivateKey was called with the context
    assert.ok(deleteKeyStub.calledOnce);
    assert.strictEqual(deleteKeyStub.firstCall.args[0], mockContext);
  });

  test('handleImportKeyFromFile should call importKeyFromFile', async () => {
    // Stub the function we expect to be called
    const importKeyStub = sandbox.stub(keyManager, 'importKeyFromFile').resolves(true);
    
    // Call the handler
    await wallet.handleImportKeyFromFile(mockContext);
    
    // Verify importKeyFromFile was called with the context
    assert.ok(importKeyStub.calledOnce);
    assert.strictEqual(importKeyStub.firstCall.args[0], mockContext);
  });

  test('handleShowWalletAddress should call showWalletAddress', async () => {
    // Stub the function we expect to be called
    const showAddressStub = sandbox.stub(keyManager, 'showWalletAddress').resolves('test-address');
    
    // Call the handler
    await wallet.handleShowWalletAddress(mockContext);
    
    // Verify showWalletAddress was called with the context
    assert.ok(showAddressStub.calledOnce);
    assert.strictEqual(showAddressStub.firstCall.args[0], mockContext);
  });

  test('handleCheckBalance should fetch wallet balance with AR and USD', async () => {
    // Sample wallet key
    const sampleKey = '{"kty":"RSA","n":"test-key-data"}';
    
    // Stubs for key manager functions
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves(sampleKey);
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({ valid: true, address: 'test-address' });
    
    // Stubs for ArweaveUploader functions
    sandbox.stub(arweaveUploader, 'checkWalletBalance').resolves('1.5');
    sandbox.stub(arweaveUploader, 'estimateUploadCost').resolves({
      ar: '0.1',
      usd: '0.05'
    });
    
    // Mock VS Code window functions
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Setup withProgress to call the callback function with a progress object
    withProgressStub.callsFake(async (options, task) => {
      const mockProgress = {
        report: sandbox.stub()
      };
      return task(mockProgress as any, { isCancellationRequested: false } as any);
    });
    
    // Call the handler
    await wallet.handleCheckBalance(mockContext);
    
    // Verify withProgress was called
    assert.ok(withProgressStub.calledOnce);
    
    // Verify the information message was shown with both AR and USD values
    assert.ok(showInfoStub.calledOnce);
    assert.ok(showInfoStub.firstCall.args[0].includes('1.5 AR'));
    assert.ok(showInfoStub.firstCall.args[0].includes('USD'));
  });

  test('handleCheckBalance should handle invalid wallet key', async () => {
    // Sample wallet key
    const sampleKey = '{"kty":"RSA","n":"test-key-data"}';
    
    // Stubs for key manager functions
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves(sampleKey);
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({ 
      valid: false, 
      message: 'Invalid key format' 
    });
    
    // Mock VS Code window functions
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    
    // Call the handler
    await wallet.handleCheckBalance(mockContext);
    
    // Verify error message was shown
    assert.ok(showErrorStub.calledOnce);
    assert.ok(showErrorStub.firstCall.args[0].includes('Invalid Arweave key format'));
  });

  test('handleCheckBalance should handle missing wallet key', async () => {
    // Stub getOrPromptForPrivateKey to return null (user cancelled)
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves(undefined);
    
    // Mock VS Code window functions
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Call the handler
    await wallet.handleCheckBalance(mockContext);
    
    // Verify withProgress was not called
    assert.ok(withProgressStub.notCalled);
    
    // Verify no information message was shown
    assert.ok(showInfoStub.notCalled);
  });

  test('handleCheckBalance should handle error during balance check', async () => {
    // Sample wallet key
    const sampleKey = '{"kty":"RSA","n":"test-key-data"}';
    
    // Stubs for key manager functions
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves(sampleKey);
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({ valid: true, address: 'test-address' });
    
    // Stub checkWalletBalance to throw an error
    const error = new Error('Network error');
    sandbox.stub(arweaveUploader, 'checkWalletBalance').rejects(error);
    
    // Mock VS Code window functions
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    
    // Setup withProgress to call the callback function with a progress object
    withProgressStub.callsFake(async (options, task) => {
      const mockProgress = {
        report: sandbox.stub()
      };
      return task(mockProgress as any, { isCancellationRequested: false } as any);
    });
    
    // Call the handler
    await wallet.handleCheckBalance(mockContext);
    
    // Verify error message was shown
    assert.ok(showErrorStub.calledOnce);
    assert.ok(showErrorStub.firstCall.args[0].includes('Failed to check balance'));
    assert.ok(showErrorStub.firstCall.args[0].includes('Network error'));
  });

  test('handleWalletHistory should show placeholder message', async () => {
    // Sample wallet key
    const sampleKey = '{"kty":"RSA","n":"test-key-data"}';
    
    // Stubs for key manager functions
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves(sampleKey);
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({ valid: true, address: 'test-address' });
    
    // Mock VS Code window functions
    const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Setup withProgress to call the callback function with a progress object
    withProgressStub.callsFake(async (options, task) => {
      const mockProgress = {
        report: sandbox.stub()
      };
      return task(mockProgress as any, { isCancellationRequested: false } as any);
    });
    
    // Call the handler
    await wallet.handleWalletHistory(mockContext);
    
    // Verify withProgress was called
    assert.ok(withProgressStub.calledOnce);
    
    // Verify the placeholder message was shown
    assert.ok(showInfoStub.calledOnce);
    assert.ok(showInfoStub.firstCall.args[0].includes('will be implemented in a future update'));
  });
}); 