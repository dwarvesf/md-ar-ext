import * as assert from 'assert';
import * as mocha from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { getSetting, updateSetting, openSettings } from '../../../../utils/storage/settingsManager';

const { setup, teardown, suite, test } = mocha;

suite('SettingsManager Tests', () => {
  let getConfigurationStub: sinon.SinonStub;
  let executeCommandStub: sinon.SinonStub;

  setup(() => {
    // Create stub for vscode.workspace.getConfiguration
    getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
    
    // Mock configuration object
    const configMock = {
      get: sinon.stub(),
      update: sinon.stub().returns(Promise.resolve())
    };
    
    // Configure getConfiguration stub to return our mock
    getConfigurationStub.returns(configMock);
    
    // Stub for executeCommand
    executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').returns(Promise.resolve());
  });

  teardown(() => {
    // Restore all stubs
    sinon.restore();
  });

  test('getSetting should return the correct setting value', () => {
    const configMock = getConfigurationStub.returns({
      get: sinon.stub().returns('test-value')
    });
    
    const value = getSetting('testKey', 'default-value');
    
    assert.strictEqual(value, 'test-value');
    assert.strictEqual(getConfigurationStub.calledOnce, true);
    assert.strictEqual(getConfigurationStub.firstCall.args[0], 'markdown-ar');
  });

  test('getSetting should return the default value if setting is not found', () => {
    const configMock = getConfigurationStub.returns({
      get: sinon.stub().returns(undefined)
    });
    
    const value = getSetting('nonExistentKey', 'default-value');
    
    assert.strictEqual(value, 'default-value');
    assert.strictEqual(getConfigurationStub.calledOnce, true);
    assert.strictEqual(getConfigurationStub.firstCall.args[0], 'markdown-ar');
  });

  test('updateSetting should update the setting value', async () => {
    const updateStub = sinon.stub().returns(Promise.resolve());
    const configMock = getConfigurationStub.returns({
      update: updateStub
    });
    
    await updateSetting('testKey', 'new-value');
    
    assert.strictEqual(getConfigurationStub.calledOnce, true);
    assert.strictEqual(getConfigurationStub.firstCall.args[0], 'markdown-ar');
    assert.strictEqual(updateStub.calledOnce, true);
    assert.strictEqual(updateStub.firstCall.args[0], 'testKey');
    assert.strictEqual(updateStub.firstCall.args[1], 'new-value');
  });

  test('updateSetting should use specified configuration target', async () => {
    const updateStub = sinon.stub().returns(Promise.resolve());
    const configMock = getConfigurationStub.returns({
      update: updateStub
    });
    
    await updateSetting('testKey', 'new-value', vscode.ConfigurationTarget.Global);
    
    assert.strictEqual(updateStub.calledOnce, true);
    assert.strictEqual(updateStub.firstCall.args[2], vscode.ConfigurationTarget.Global);
  });

  test('openSettings should execute the open settings command', async () => {
    await openSettings();
    
    assert.strictEqual(executeCommandStub.calledOnce, true);
    assert.strictEqual(executeCommandStub.firstCall.args[0], 'workbench.action.openSettings');
    assert.strictEqual(executeCommandStub.firstCall.args[1], 'markdown-ar');
  });
}); 