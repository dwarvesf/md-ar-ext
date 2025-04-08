import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as settings from '../../../commands/settings';
import * as settingsManager from '../../../utils/storage/settingsManager';
import { TestUtils } from '../utils/testUtils';

suite('Settings Commands Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  
  setup(async () => {
    sandbox = TestUtils.setup();
  });
  
  teardown(() => {
    TestUtils.teardown();
  });

  test('handleOpenSettings should call openSettings', async () => {
    // Stub the function we expect to be called
    const openSettingsStub = sandbox.stub(settingsManager, 'openSettings').resolves();
    
    // Call the handler
    await settings.handleOpenSettings();
    
    // Verify openSettings was called
    assert.ok(openSettingsStub.calledOnce);
  });

  test('handleQuickConfigureSettings should call quickConfigureSettings', async () => {
    // Stub the function we expect to be called
    const quickConfigureStub = sandbox.stub(settingsManager, 'quickConfigureSettings').resolves();
    
    // Call the handler
    await settings.handleQuickConfigureSettings();
    
    // Verify quickConfigureSettings was called
    assert.ok(quickConfigureStub.calledOnce);
  });

  test('handleShowSettingsUI should call showSettingsUI', async () => {
    // Stub the function we expect to be called
    const showUIStub = sandbox.stub(settingsManager, 'showSettingsUI').resolves();
    
    // Call the handler
    await settings.handleShowSettingsUI();
    
    // Verify showSettingsUI was called
    assert.ok(showUIStub.calledOnce);
  });

  test('handleExportSettings should call exportSettings', async () => {
    // Stub the function we expect to be called
    const exportSettingsStub = sandbox.stub(settingsManager, 'exportSettings').resolves();
    
    // Call the handler
    await settings.handleExportSettings();
    
    // Verify exportSettings was called
    assert.ok(exportSettingsStub.calledOnce);
  });

  test('handleImportSettings should call importSettings', async () => {
    // Stub the function we expect to be called
    const importSettingsStub = sandbox.stub(settingsManager, 'importSettings').resolves();
    
    // Call the handler
    await settings.handleImportSettings();
    
    // Verify importSettings was called
    assert.ok(importSettingsStub.calledOnce);
  });
}); 