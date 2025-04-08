import * as assert from 'assert';
import * as sinon from 'sinon';
import * as keyManager from '../../../../utils/storage/keyManager';
import * as vscode from 'vscode';
import { TestUtils } from '../../utils/testUtils';
import * as fs from 'fs';
import * as path from 'path';

suite('KeyManager Test Suite', () => {
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

  test('validateArweaveKey should accept valid JWK', async () => {
    // Sample valid JWK structure
    const validJwk = JSON.stringify({
      kty: 'RSA',
      n: 'test-n-value',
      e: 'test-e-value',
      d: 'test-d-value',
      p: 'test-p-value',
      q: 'test-q-value'
    });
    
    // Mock getWalletAddress since it's called by validateArweaveKey
    sandbox.stub(keyManager, 'getWalletAddress' as any).resolves('test-wallet-address');
    
    const result = await keyManager.validateArweaveKey(validJwk);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.address, 'test-wallet-address');
  });

  test('validateArweaveKey should reject invalid JWK structure', async () => {
    // Missing required properties
    const invalidJwk = JSON.stringify({
      kty: 'RSA',
      n: 'test-n-value'
      // Missing other required fields
    });
    
    const result = await keyManager.validateArweaveKey(invalidJwk);
    assert.strictEqual(result.valid, false);
    assert.ok(result.message && result.message.includes('missing required RSA properties'));
  });

  test('validateArweaveKey should reject invalid JSON', async () => {
    const invalidJson = 'this is not valid JSON';
    
    const result = await keyManager.validateArweaveKey(invalidJson);
    assert.strictEqual(result.valid, false);
    assert.ok(result.message && result.message.includes('Invalid JSON format'));
  });

  test('getPrivateKey should retrieve key from secret storage', async () => {
    const mockPrivateKey = JSON.stringify({ kty: 'RSA', n: 'test' });
    (mockContext.secrets.get as sinon.SinonStub).resolves(mockPrivateKey);
    
    const result = await keyManager.getPrivateKey(mockContext);
    assert.strictEqual(result, mockPrivateKey);
    assert.ok((mockContext.secrets.get as sinon.SinonStub).calledOnce);
    assert.strictEqual((mockContext.secrets.get as sinon.SinonStub).firstCall.args[0], 'arweavePrivateKey');
  });

  test('promptAndStorePrivateKey should validate and store valid key', async () => {
    // Mock showInputBox to return a key
    const mockKey = JSON.stringify({ kty: 'RSA', n: 'test', e: 'test', d: 'test', p: 'test', q: 'test' });
    sandbox.stub(vscode.window, 'showInputBox').resolves(mockKey);
    
    // Mock validateArweaveKey
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({
      valid: true,
      address: 'test-address'
    });
    
    // Mock showInformationMessage
    sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
    
    const result = await keyManager.promptAndStorePrivateKey(mockContext);
    
    assert.strictEqual(result, mockKey);
    assert.ok((mockContext.secrets.store as sinon.SinonStub).calledOnce);
    assert.strictEqual((mockContext.secrets.store as sinon.SinonStub).firstCall.args[0], 'arweavePrivateKey');
    assert.strictEqual((mockContext.secrets.store as sinon.SinonStub).firstCall.args[1], mockKey);
  });

  test('promptAndStorePrivateKey should handle invalid key', async () => {
    // Mock showInputBox to return a key
    const invalidKey = '{"invalid": "key"}';
    sandbox.stub(vscode.window, 'showInputBox').resolves(invalidKey);
    
    // Mock validateArweaveKey to return invalid
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({
      valid: false,
      message: 'Invalid key format'
    });
    
    // Mock showErrorMessage
    sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);
    
    const result = await keyManager.promptAndStorePrivateKey(mockContext);
    
    assert.strictEqual(result, undefined);
    assert.ok(!(mockContext.secrets.store as sinon.SinonStub).called);
  });

  test('getOrPromptForPrivateKey should return existing key if present', async () => {
    const existingKey = '{"kty": "RSA", "n": "test"}';
    (mockContext.secrets.get as sinon.SinonStub).resolves(existingKey);
    
    // Stub promptAndStorePrivateKey to verify it's not called
    const promptStub = sandbox.stub(keyManager, 'promptAndStorePrivateKey');
    
    const result = await keyManager.getOrPromptForPrivateKey(mockContext);
    
    assert.strictEqual(result, existingKey);
    assert.ok(!(promptStub).called);
  });

  test('getOrPromptForPrivateKey should prompt for key if not present', async () => {
    // No existing key
    (mockContext.secrets.get as sinon.SinonStub).resolves(undefined);
    
    // Stub promptAndStorePrivateKey to return a new key
    const newKey = '{"kty": "RSA", "new": "key"}';
    const promptStub = sandbox.stub(keyManager, 'promptAndStorePrivateKey').resolves(newKey);
    
    const result = await keyManager.getOrPromptForPrivateKey(mockContext);
    
    assert.strictEqual(result, newKey);
    assert.ok(promptStub.calledOnce);
  });

  test('updatePrivateKey should validate and store new key', async () => {
    // Mock showInputBox to return a key
    const newKey = JSON.stringify({ kty: 'RSA', n: 'new', e: 'new', d: 'new', p: 'new', q: 'new' });
    sandbox.stub(vscode.window, 'showInputBox').resolves(newKey);
    
    // Mock validateArweaveKey
    sandbox.stub(keyManager, 'validateArweaveKey').resolves({
      valid: true,
      address: 'new-address'
    });
    
    // Mock showInformationMessage
    sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
    
    const result = await keyManager.updatePrivateKey(mockContext);
    
    assert.strictEqual(result, true);
    assert.ok((mockContext.secrets.store as sinon.SinonStub).calledOnce);
    assert.strictEqual((mockContext.secrets.store as sinon.SinonStub).firstCall.args[0], 'arweavePrivateKey');
    assert.strictEqual((mockContext.secrets.store as sinon.SinonStub).firstCall.args[1], newKey);
  });

  test('deletePrivateKey should remove key from secret storage', async () => {
    // Mock showWarningMessage to confirm deletion
    const deleteButton = { title: 'Delete' } as vscode.MessageItem;
    sandbox.stub(vscode.window, 'showWarningMessage').resolves(deleteButton);
    
    await keyManager.deletePrivateKey(mockContext);
    
    assert.ok((mockContext.secrets.delete as sinon.SinonStub).calledOnce);
    assert.strictEqual((mockContext.secrets.delete as sinon.SinonStub).firstCall.args[0], 'arweavePrivateKey');
  });
}); 