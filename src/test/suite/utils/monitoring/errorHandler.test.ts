import * as assert from 'assert';
import { suite, test } from 'mocha';
import { ExtensionError, ErrorType, createDependencyError, createNetworkError } from '../../../../utils/monitoring/errorHandler';

suite('ErrorHandler Tests', () => {
  
  test('ExtensionError should have correct properties', () => {
    const message = 'Test error message';
    const type = ErrorType.validation;
    const details = { field: 'test', value: 'invalid' };
    
    const error = new ExtensionError(message, type, details);
    
    assert.strictEqual(error.message, message);
    assert.strictEqual(error.type, type);
    assert.deepStrictEqual(error.details, details);
    assert.strictEqual(error.actionable, false);
    assert.strictEqual(error.name, 'ExtensionError');
  });
  
  test('ExtensionError should have actionable properties when specified', () => {
    const message = 'Test actionable error';
    const type = ErrorType.dependency;
    const actionText = 'Fix It';
    const actionCallback = async () => { /* do nothing */ };
    
    const error = new ExtensionError(message, type, undefined, true, actionText, actionCallback);
    
    assert.strictEqual(error.message, message);
    assert.strictEqual(error.type, type);
    assert.strictEqual(error.actionable, true);
    assert.strictEqual(error.actionText, actionText);
    assert.strictEqual(error.actionCallback, actionCallback);
  });
  
  test('createDependencyError should create error with correct type and action', () => {
    const dependencyName = 'TestDependency';
    const installationGuide = 'Install test dependency with npm install';
    
    const error = createDependencyError(dependencyName, installationGuide);
    
    assert.strictEqual(error.type, ErrorType.dependency);
    assert.strictEqual(error.actionable, true);
    assert.strictEqual(error.actionText, 'Show Installation Guide');
    assert.ok(error.message.includes(dependencyName));
    assert.ok(error.details.dependency === dependencyName);
  });
  
  test('createNetworkError should create error with correct type and retry action', () => {
    const message = 'Network connection failed';
    const details = { url: 'https://example.com' };
    const retryCallback = async () => { /* do nothing */ };
    
    const error = createNetworkError(message, details, retryCallback);
    
    assert.strictEqual(error.type, ErrorType.networkRequest);
    assert.strictEqual(error.message, message);
    assert.deepStrictEqual(error.details, details);
    assert.strictEqual(error.actionable, true);
    assert.strictEqual(error.actionText, 'Retry');
    assert.strictEqual(error.actionCallback, retryCallback);
  });
  
  test('createNetworkError without retry callback should not be actionable', () => {
    const message = 'Network connection failed';
    const details = { url: 'https://example.com' };
    
    const error = createNetworkError(message, details);
    
    assert.strictEqual(error.type, ErrorType.networkRequest);
    assert.strictEqual(error.message, message);
    assert.strictEqual(error.actionable, false);
  });
  
  test('ExtensionError userMessage should return the message', () => {
    const message = 'Test error user message';
    const error = new ExtensionError(message);
    
    assert.strictEqual(error.userMessage, message);
  });
  
  test('ExtensionError devMessage should include type and details', () => {
    const message = 'Test error dev message';
    const type = ErrorType.arweaveWallet;
    const details = { walletId: '123' };
    
    const error = new ExtensionError(message, type, details);
    const devMessage = error.devMessage;
    
    assert.ok(devMessage.includes(message));
    assert.ok(devMessage.includes(type));
    assert.ok(devMessage.includes(details.walletId));
  });
}); 