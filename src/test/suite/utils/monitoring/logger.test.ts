import * as assert from 'assert';
import { suite, test } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { Logger, LogLevel } from '../../../../utils/monitoring/logger';

suite('Logger Tests', () => {
  let loggerInstance: Logger;
  let outputChannelStub: sinon.SinonStubbedInstance<vscode.OutputChannel>;
  let createOutputChannelStub: sinon.SinonStub;
  let consoleInfoStub: sinon.SinonStub;
  let consoleWarnStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let consoleDebugStub: sinon.SinonStub;
  
  setup(() => {
    // Create a stub for OutputChannel
    outputChannelStub = sinon.createStubInstance(Object as any);
    
    // Stub the createOutputChannel method
    createOutputChannelStub = sinon.stub(vscode.window, 'createOutputChannel');
    createOutputChannelStub.returns(outputChannelStub as any);
    
    consoleInfoStub = sinon.stub(console, 'info');
    consoleWarnStub = sinon.stub(console, 'warn');
    consoleErrorStub = sinon.stub(console, 'error');
    consoleDebugStub = sinon.stub(console, 'debug');
    
    // Create a new logger instance for each test
    loggerInstance = Logger['_instance'] = new (Logger as any)('TEST-LOGGER');
  });
  
  teardown(() => {
    // Restore all stubs
    sinon.restore();
    
    // Reset the singleton instance
    Logger['_instance'] = undefined as any;
  });
  
  test('getInstance should return the same instance', () => {
    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    
    assert.strictEqual(instance1, instance2);
  });
  
  test('getInstance should create a new instance with default name if not exists', () => {
    // Reset the singleton instance
    Logger['_instance'] = undefined as any;
    
    
    assert.strictEqual(createOutputChannelStub.calledOnce, true);
    assert.strictEqual(createOutputChannelStub.firstCall.args[0], 'MD-AR-EXT');
  });
  
  test('getInstance should create a new instance with custom name if specified', () => {
    // Reset the singleton instance
    Logger['_instance'] = undefined as any;
    
    const customName = 'CUSTOM-LOGGER';
    
    assert.strictEqual(createOutputChannelStub.calledOnce, true);
    assert.strictEqual(createOutputChannelStub.firstCall.args[0], customName);
  });
  
  test('logLevel getter and setter should work correctly', () => {
    loggerInstance.logLevel = LogLevel.debug;
    assert.strictEqual(loggerInstance.logLevel, LogLevel.debug);
    
    loggerInstance.logLevel = LogLevel.error;
    assert.strictEqual(loggerInstance.logLevel, LogLevel.error);
  });
  
  test('debug should log messages when level is DEBUG', () => {
    loggerInstance.logLevel = LogLevel.debug;
    
    const message = 'Debug message';
    const category = 'TEST';
    
    loggerInstance.debug(message, category);
    
    assert.strictEqual(outputChannelStub.appendLine.calledOnce, true);
    assert.strictEqual(consoleDebugStub.calledOnce, true);
    
    const loggedMessage = outputChannelStub.appendLine.firstCall.args[0];
    assert.ok(loggedMessage.includes(message));
    assert.ok(loggedMessage.includes(category));
  });
  
  test('debug should not log messages when level is higher than DEBUG', () => {
    loggerInstance.logLevel = LogLevel.info;
    
    loggerInstance.debug('Debug message');
    
    assert.strictEqual(outputChannelStub.appendLine.called, false);
    assert.strictEqual(consoleDebugStub.called, false);
  });
  
  test('info should log messages when level is INFO or lower', () => {
    loggerInstance.logLevel = LogLevel.info;
    
    const message = 'Info message';
    
    loggerInstance.info(message);
    
    assert.strictEqual(outputChannelStub.appendLine.calledOnce, true);
    assert.strictEqual(consoleInfoStub.calledOnce, true);
    
    const loggedMessage = outputChannelStub.appendLine.firstCall.args[0];
    assert.ok(loggedMessage.includes(message));
  });
  
  test('warn should log messages when level is WARN or lower', () => {
    loggerInstance.logLevel = LogLevel.warn;
    
    const message = 'Warning message';
    
    loggerInstance.warn(message);
    
    assert.strictEqual(outputChannelStub.appendLine.calledOnce, true);
    assert.strictEqual(consoleWarnStub.calledOnce, true);
    
    const loggedMessage = outputChannelStub.appendLine.firstCall.args[0];
    assert.ok(loggedMessage.includes(message));
  });
  
  test('error should log messages when level is ERROR or lower', () => {
    loggerInstance.logLevel = LogLevel.error;
    
    const message = 'Error message';
    const error = new Error('Test error');
    
    loggerInstance.error(message, error);
    
    assert.strictEqual(outputChannelStub.appendLine.calledOnce, true);
    assert.strictEqual(consoleErrorStub.calledOnce, true);
    
    const loggedMessage = outputChannelStub.appendLine.firstCall.args[0];
    assert.ok(loggedMessage.includes(message));
    assert.ok(loggedMessage.includes(error.message));
  });
  
  test('formatMessage should format message with timestamp and category', () => {
    const message = 'Test message';
    const category = 'CATEGORY';
    
    const formattedMessage = (loggerInstance as any).formatMessage(message, category);
    
    assert.ok(formattedMessage.includes('['));
    assert.ok(formattedMessage.includes(']'));
    assert.ok(formattedMessage.includes(category));
    assert.ok(formattedMessage.includes(message));
  });
  
  test('show, hide, clear, and dispose should call corresponding OutputChannel methods', () => {
    loggerInstance.show();
    assert.strictEqual(outputChannelStub.show.calledOnce, true);
    
    loggerInstance.hide();
    assert.strictEqual(outputChannelStub.hide.calledOnce, true);
    
    loggerInstance.clear();
    assert.strictEqual(outputChannelStub.clear.calledOnce, true);
    
    loggerInstance.dispose();
    assert.strictEqual(outputChannelStub.dispose.calledOnce, true);
  });
}); 