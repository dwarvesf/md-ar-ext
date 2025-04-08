import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as image from '../../../commands/image';
import * as imageProcessor from '../../../utils/processing/imageProcessor';
import * as arweaveUploader from '../../../utils/processing/arweaveUploader';
import * as keyManager from '../../../utils/storage/keyManager';
import * as settingsManager from '../../../utils/storage/settingsManager';
import * as progressIndicator from '../../../utils/monitoring/progressIndicator';
import * as statsTracker from '../../../utils/monitoring/statsTracker';
import { TestUtils } from '../utils/testUtils';

suite('Image Commands Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;
  let mockEditor: vscode.TextEditor;
  let mockEditBuilder: vscode.TextEditorEdit;
  
  setup(async () => {
    sandbox = TestUtils.setup();
    
    // Create mock ExtensionContext
    mockContext = {
      secrets: {
        store: sandbox.stub().resolves(),
        get: sandbox.stub().resolves(),
        delete: sandbox.stub().resolves()
      },
      globalState: {
        get: sandbox.stub(),
        update: sandbox.stub().resolves(),
        keys: () => []
      }
    } as unknown as vscode.ExtensionContext;
    
    // Create mock TextEditor and EditBuilder
    mockEditBuilder = {
      insert: sandbox.stub()
    } as unknown as vscode.TextEditorEdit;
    
    mockEditor = {
      edit: sandbox.stub().callsFake(callback => {
        callback(mockEditBuilder);
        return Promise.resolve(true);
      }),
      selection: {
        active: new vscode.Position(0, 0)
      },
      document: {
        uri: { fsPath: 'document.md' } as vscode.Uri
      }
    } as unknown as vscode.TextEditor;
    
    // Mock VS Code window functions
    sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    sandbox.stub(vscode.window, 'showWarningMessage').resolves();
  });
  
  teardown(() => {
    TestUtils.teardown();
  });
  
  test('handleCheckImageMagickInstallation should show success message when installed', async () => {
    // Stub the image processor function
    sandbox.stub(imageProcessor, 'checkImageMagickDetails').resolves({
      installed: true,
      version: '7.1.0',
      meetRequirements: true
    });
    
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Call the handler
    await image.checkImageMagickInstallation();
    
    // Verify the success message was shown
    assert.ok(showInfoStub.called);
    assert.ok(showInfoStub.firstCall.args[0].includes('is installed and ready to use'));
  });
  
  test('handleCheckImageMagickInstallation should show warning for old version', async () => {
    // Stub the image processor function
    sandbox.stub(imageProcessor, 'checkImageMagickDetails').resolves({
      installed: true,
      version: '6.9.0',
      meetRequirements: false
    });
    
    const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves(undefined);
    
    // Call the handler
    await image.checkImageMagickInstallation();
    
    // Verify the warning message was shown
    assert.ok(showWarningStub.called);
    assert.ok(showWarningStub.firstCall.args[0].includes('but version 7.0+ is recommended'));
  });
  
  test('handleCheckImageMagickInstallation should show installation instructions if not installed', async () => {
    // Stub the image processor function
    sandbox.stub(imageProcessor, 'checkImageMagickDetails').resolves({
      installed: false,
      version: null,
      meetRequirements: false
    });
    
    // Stub the show installation instructions function
    const instructionsStub = sandbox.stub(imageProcessor, 'showImageMagickInstallInstructions');
    
    // Mock user selecting to show install instructions with proper type handling
    const installButton = { title: 'Show Installation Instructions' } as vscode.MessageItem;
    const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves(installButton);
    
    // Call the handler
    await image.checkImageMagickInstallation();
    
    // Verify the warning message was shown
    assert.ok(showWarningStub.called);
    assert.ok(showWarningStub.firstCall.args[0].includes('does not appear to be installed'));
    
    // Verify instructions were shown
    assert.ok(instructionsStub.called);
  });
  
  test('handleProcessImageOnly should process an image successfully', async () => {
    // Mock file selection dialog
    const filePath = path.join(os.tmpdir(), 'test-image.jpg');
    const fileUri = { fsPath: filePath } as vscode.Uri;
    sandbox.stub(vscode.window, 'showOpenDialog').resolves([fileUri]);
    
    // Stub imageProcessor functions
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    
    const mockProcessResult: imageProcessor.ImageProcessResult = {
      processedFilePath: path.join(os.tmpdir(), 'processed-image.webp'),
      originalFilePath: filePath,
      width: 800,
      height: 600,
      originalSize: 100000,
      processedSize: 50000,
      reductionPercentage: 50,
      format: 'webp'
    };
    
    sandbox.stub(imageProcessor, 'processImage').resolves(mockProcessResult);
    
    // Stub settingsManager functions
    sandbox.stub(settingsManager, 'getWebpQuality').returns(80);
    sandbox.stub(settingsManager, 'getMaxDimensions').returns({ width: 1280, height: 1024 });
    sandbox.stub(settingsManager, 'getSetting').returns(true);
    
    // Stub formater function
    sandbox.stub(arweaveUploader, 'formatFileSize').returns('50 KB');
    
    // Stub withCancellableProgress
    const withProgressStub = sandbox.stub(progressIndicator, 'withCancellableProgress');
    
    // Setup the stub to execute the task with mock progress and token
    withProgressStub.callsFake(async (title, task) => {
      const mockProgress = { report: sandbox.stub() };
      const mockToken = { 
        isCancellationRequested: false,
        onCancellationRequested: sandbox.stub()
      };
      return task(
        mockProgress as vscode.Progress<{message?: string; increment?: number}>,
        mockToken as vscode.CancellationToken
      );
    });
    
    // Stub VS Code workspace functions for showing results
    const mockDoc = { /* mock document */ };
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(mockDoc as any);
    sandbox.stub(vscode.window, 'showTextDocument').resolves();
    
    // Mock user selecting "View Details"
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
    showInfoStub.resolves({ title: 'View Details' } as vscode.MessageItem);
    
    // Call the handler
    await image.processImageOnly(mockContext);
    
    // Verify withCancellableProgress was called with the correct title
    assert.ok(withProgressStub.called);
    assert.strictEqual(withProgressStub.firstCall.args[0], 'Processing image');
    
    // Verify the success message was shown
    assert.ok(showInfoStub.called);
    assert.ok(showInfoStub.firstCall.args[0].includes('Image processed successfully'));
  });
  
  test('handleProcessImageOnly should handle invalid image files', async () => {
    // Mock file selection dialog
    const filePath = path.join(os.tmpdir(), 'test-file.txt');
    const fileUri = { fsPath: filePath } as vscode.Uri;
    sandbox.stub(vscode.window, 'showOpenDialog').resolves([fileUri]);
    
    // Stub imageProcessor functions to return invalid
    sandbox.stub(imageProcessor, 'isImageFile').resolves(false);
    
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    
    // Call the handler
    await image.processImageOnly(mockContext);
    
    // Verify the error message was shown
    assert.ok(showErrorStub.called);
    assert.ok(showErrorStub.firstCall.args[0].includes('Please use a valid image file'));
  });
  
  test('handleProcessImageOnly should show a warning when ImageMagick is not installed', async () => {
    // Mock file selection dialog
    const filePath = path.join(os.tmpdir(), 'test-image.jpg');
    const fileUri = { fsPath: filePath } as vscode.Uri;
    sandbox.stub(vscode.window, 'showOpenDialog').resolves([fileUri]);
    
    // Stub imageProcessor functions
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    
    // Stub checkImageMagickDetails to indicate ImageMagick is not installed
    sandbox.stub(imageProcessor, 'checkImageMagickDetails').resolves({
      installed: false,
      version: null,
      meetRequirements: false
    });
    
    // Stub showImageMagickInstallInstructions
    const instructionsStub = sandbox.stub(imageProcessor, 'showImageMagickInstallInstructions');
    
    // Mock showWarningMessage to capture any calls
    const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves();
    
    // Call the handler
    await image.processImageOnly(mockContext);
    
    // Verify warning message was shown (main assertion)
    assert.ok(showWarningStub.called);
    
    // Verify instructions were shown
    assert.ok(instructionsStub.called);
  });
  
  test('handleProcessImageOnly should handle user cancellation', async () => {
    // Mock file selection dialog
    const filePath = path.join(os.tmpdir(), 'test-image.jpg');
    const fileUri = { fsPath: filePath } as vscode.Uri;
    sandbox.stub(vscode.window, 'showOpenDialog').resolves([fileUri]);
    
    // Stub imageProcessor functions
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    
    // Stub settingsManager functions
    sandbox.stub(settingsManager, 'getWebpQuality').returns(80);
    sandbox.stub(settingsManager, 'getMaxDimensions').returns({ width: 1280, height: 1024 });
    sandbox.stub(settingsManager, 'getSetting').returns(true);
    
    // Stub withCancellableProgress to simulate cancellation
    const withProgressStub = sandbox.stub(progressIndicator, 'withCancellableProgress');
    
    // Setup the stub to execute the task with mock progress and token
    withProgressStub.callsFake(async (title, task) => {
      const mockProgress = { report: sandbox.stub() };
      const mockToken = { 
        isCancellationRequested: true,
        onCancellationRequested: (callback: () => void) => {
          // Execute the cancellation callback immediately
          callback();
        }
      };
      
      try {
        return await task(
          mockProgress as vscode.Progress<{message?: string; increment?: number}>,
          mockToken as vscode.CancellationToken
        );
      } catch (error) {
        // We expect an error to be thrown on cancellation
        if (error instanceof Error && error.message === 'Operation cancelled by user') {
          return undefined;
        }
        throw error;
      }
    });
    
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Call the handler
    await image.processImageOnly(mockContext);
    
    // Verify cancellation message was shown
    assert.ok(showInfoStub.called);
    assert.ok(showInfoStub.firstCall.args[0].includes('Image processing cancelled'));
  });
  
  test('handlePasteImage should process and upload clipboard image', async () => {
    // Create a mock clipboard image
    const mockImage = Buffer.from('fake-image-data');
    const readImageStub = sandbox.stub(vscode.env.clipboard, 'readImage').resolves(mockImage);
    
    // Stub fs functions
    const writeFileStub = sandbox.stub(fs, 'writeFileSync');
    sandbox.stub(fs, 'existsSync').returns(true);
    const unlinkStub = sandbox.stub(fs, 'unlinkSync');
    
    // Create a mock for the private uploadAndInsertImage function
    // Since it's a private function, we need to stub any functions it calls
    
    // Stub imageProcessor functions
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    
    // Stub keyManager functions
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves('{"kty":"RSA","n":"test-key-data"}');
    
    // Stub arweaveUploader functions
    sandbox.stub(arweaveUploader, 'checkBalanceSufficient').resolves({
      sufficient: true,
      balance: '1.5',
      required: '0.1'
    });
    
    // Mock processImage result
    const mockProcessResult: imageProcessor.ImageProcessResult = {
      processedFilePath: path.join(os.tmpdir(), 'processed-image.webp'),
      originalFilePath: 'temp-path.png',
      width: 800,
      height: 600,
      originalSize: 100000,
      processedSize: 50000,
      reductionPercentage: 50,
      format: 'webp'
    };
    
    sandbox.stub(imageProcessor, 'processImage').resolves(mockProcessResult);
    
    // Mock upload result
    const mockUploadResult: arweaveUploader.ArweaveUploadResult = {
      txId: 'test-tx-id',
      url: 'https://arweave.net/test-tx-id',
      pending: true,
      cost: {
        ar: '0.1',
        usd: '0.05'
      }
    };
    
    sandbox.stub(arweaveUploader, 'uploadToArweave').resolves(mockUploadResult);
    sandbox.stub(arweaveUploader, 'createMarkdownLink').returns('![image](https://arweave.net/test-tx-id)');
    
    // Stub settings functions
    sandbox.stub(settingsManager, 'getWebpQuality').returns(80);
    sandbox.stub(settingsManager, 'getMaxDimensions').returns({ width: 1280, height: 1024 });
    sandbox.stub(settingsManager, 'getMetadataTagsEnabled').returns(true);
    sandbox.stub(settingsManager, 'getCustomTags').returns([]);
    const getSettingStub = sandbox.stub(settingsManager, 'getSetting');
    getSettingStub.withArgs('preserveOriginalImages', true).returns(true);
    getSettingStub.withArgs('checkBalanceBeforeUpload', true).returns(true);
    getSettingStub.withArgs('preserveProcessedImages', false).returns(false);
    getSettingStub.withArgs('retryCount', 3).returns(3);
    getSettingStub.withArgs('retryDelay', 1000).returns(1000);
    
    // Stub statistics tracking
    const trackUploadStub = sandbox.stub(statsTracker, 'trackUpload').resolves();
    
    // Stub withCancellableProgress
    const withProgressStub = sandbox.stub(progressIndicator, 'withCancellableProgress');
    
    // Setup the stub to execute the task with mock progress and token
    withProgressStub.callsFake(async (title, task) => {
      const mockProgress = { report: sandbox.stub() };
      const mockToken = { 
        isCancellationRequested: false,
        onCancellationRequested: sandbox.stub()
      };
      return task(
        mockProgress as vscode.Progress<{message?: string; increment?: number}>,
        mockToken as vscode.CancellationToken
      );
    });
    
    // Stub transaction verification
    sandbox.stub(global, 'setTimeout').callsFake((callback: Function) => {
      callback();
      return {} as any;
    });
    
    sandbox.stub(arweaveUploader, 'verifyTransaction').resolves({
      confirmed: true,
      confirmations: 2,
      status: 'confirmed'
    });
    
    // Call the handler
    await image.handlePasteImage(mockContext);
    
    // Verify clipboard image was read
    assert.ok(readImageStub.called);
    
    // Verify the image was written to a temporary file
    assert.ok(writeFileStub.called);
    
    // Verify the link was inserted into the document
    assert.ok((mockEditBuilder.insert as sinon.SinonStub).called);
    assert.strictEqual(
      (mockEditBuilder.insert as sinon.SinonStub).firstCall.args[0], 
      mockEditor.selection.active
    );
    
    // Verify upload was tracked
    assert.ok(trackUploadStub.called);
    
    // Verify temporary file was cleaned up
    assert.ok(unlinkStub.called);
  });
  
  test('handlePasteImage should handle empty clipboard', async () => {
    // Mock empty clipboard
    const emptyImage = Buffer.from('');
    const readImageStub = sandbox.stub(vscode.env.clipboard, 'readImage').resolves(emptyImage);
    
    // Stub fs functions
    const writeFileStub = sandbox.stub(fs, 'writeFileSync');
    sandbox.stub(fs, 'existsSync').returns(false);
    sandbox.stub(fs, 'unlinkSync');
    
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    
    // Call the handler
    await image.handlePasteImage(mockContext);
    
    // Verify message about empty clipboard was shown
    assert.ok(showInfoStub.called);
    assert.ok(showInfoStub.firstCall.args[0].includes('No image found in clipboard'));
    
    // Verify no files were written
    assert.ok(!writeFileStub.called);
  });
  
  test('handleUploadImage should process and upload selected image', async () => {
    // Mock file selection dialog
    const filePath = path.join(os.tmpdir(), 'test-image.jpg');
    const fileUri = { fsPath: filePath } as vscode.Uri;
    const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog').resolves([fileUri]);
    
    // Create a mock for the private uploadAndInsertImage function
    // Since it's a private function, we need to stub any functions it calls
    
    // Stub imageProcessor functions
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    
    // Stub keyManager functions
    sandbox.stub(keyManager, 'getOrPromptForPrivateKey').resolves('{"kty":"RSA","n":"test-key-data"}');
    
    // Stub arweaveUploader functions
    sandbox.stub(arweaveUploader, 'checkBalanceSufficient').resolves({
      sufficient: true,
      balance: '1.5',
      required: '0.1'
    });
    
    // Mock processImage result
    const mockProcessResult: imageProcessor.ImageProcessResult = {
      processedFilePath: path.join(os.tmpdir(), 'processed-image.webp'),
      originalFilePath: filePath,
      width: 800,
      height: 600,
      originalSize: 100000,
      processedSize: 50000,
      reductionPercentage: 50,
      format: 'webp'
    };
    
    sandbox.stub(imageProcessor, 'processImage').resolves(mockProcessResult);
    
    // Mock upload result
    const mockUploadResult: arweaveUploader.ArweaveUploadResult = {
      txId: 'test-tx-id',
      url: 'https://arweave.net/test-tx-id',
      pending: true,
      cost: {
        ar: '0.1',
        usd: '0.05'
      }
    };
    
    sandbox.stub(arweaveUploader, 'uploadToArweave').resolves(mockUploadResult);
    sandbox.stub(arweaveUploader, 'createMarkdownLink').returns('![image](https://arweave.net/test-tx-id)');
    
    // Stub settings functions
    sandbox.stub(settingsManager, 'getWebpQuality').returns(80);
    sandbox.stub(settingsManager, 'getMaxDimensions').returns({ width: 1280, height: 1024 });
    sandbox.stub(settingsManager, 'getMetadataTagsEnabled').returns(true);
    sandbox.stub(settingsManager, 'getCustomTags').returns([]);
    const getSettingStub = sandbox.stub(settingsManager, 'getSetting');
    getSettingStub.withArgs('preserveOriginalImages', true).returns(true);
    getSettingStub.withArgs('checkBalanceBeforeUpload', true).returns(true);
    getSettingStub.withArgs('preserveProcessedImages', false).returns(false);
    getSettingStub.withArgs('retryCount', 3).returns(3);
    getSettingStub.withArgs('retryDelay', 1000).returns(1000);
    
    // Stub statistics tracking
    const trackUploadStub = sandbox.stub(statsTracker, 'trackUpload').resolves();
    
    // Stub withCancellableProgress
    const withProgressStub = sandbox.stub(progressIndicator, 'withCancellableProgress');
    
    // Setup the stub to execute the task with mock progress and token
    withProgressStub.callsFake(async (title, task) => {
      const mockProgress = { report: sandbox.stub() };
      const mockToken = { 
        isCancellationRequested: false,
        onCancellationRequested: sandbox.stub()
      };
      return task(
        mockProgress as vscode.Progress<{message?: string; increment?: number}>,
        mockToken as vscode.CancellationToken
      );
    });
    
    // Stub transaction verification
    sandbox.stub(global, 'setTimeout').callsFake((callback: Function) => {
      callback();
      return {} as any;
    });
    
    sandbox.stub(arweaveUploader, 'verifyTransaction').resolves({
      confirmed: true,
      confirmations: 2,
      status: 'confirmed'
    });
    
    // Call the handler
    await image.handleUploadImage(mockContext);
    
    // Verify file dialog was shown
    assert.ok(showOpenDialogStub.called);
    
    // Verify the link was inserted into the document
    assert.ok((mockEditBuilder.insert as sinon.SinonStub).called);
    
    // Verify upload was tracked
    assert.ok(trackUploadStub.called);
  });
  
  test('handleUploadImage should do nothing if no file is selected', async () => {
    // Mock file selection dialog with no selection
    const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog').resolves(undefined);
    
    // Create spy for uploadAndInsertImage
    const progressStub = sandbox.stub(progressIndicator, 'withCancellableProgress');
    
    // Call the handler
    await image.handleUploadImage(mockContext);
    
    // Verify file dialog was shown
    assert.ok(showOpenDialogStub.called);
    
    // Verify no progress dialog was shown (indicating uploadAndInsertImage was not called)
    assert.ok(!progressStub.called);
  });
}); 