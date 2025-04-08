import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as imageProcessor from '../../../../utils/processing/imageProcessor';
import * as vscode from 'vscode';
import { TestUtils } from '../../utils/testUtils';

suite('ImageProcessor Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  
  setup(async () => {
    sandbox = TestUtils.setup();
  });
  
  teardown(() => {
    TestUtils.teardown();
  });

  test('isImageFile should recognize valid image extensions', async () => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    
    for (const ext of validExtensions) {
      const tempFilePath = TestUtils.createTempFile(`test-image.${ext}`);
      const result = await imageProcessor.isImageFile(tempFilePath);
      assert.strictEqual(result, true, `Should recognize ${ext} as valid`);
    }
  });

  test('isImageFile should reject video extensions', async () => {
    const invalidExtensions = ['mp4', 'mov', 'avi'];
    
    for (const ext of invalidExtensions) {
      const tempFilePath = TestUtils.createTempFile(`test-video.${ext}`);
      const result = await imageProcessor.isImageFile(tempFilePath);
      assert.strictEqual(result, false, `Should reject ${ext} as invalid`);
    }
  });
  
  test('checkImageMagickDetails should detect installation status', async () => {
    // Mock child_process.exec for the test
    const execStub = TestUtils.mockChildProcessExec();
    
    // Scenario 1: ImageMagick installed with 'magick' command (modern version)
    execStub.withArgs('magick -version').callsFake((_cmd: string, callback: any) => {
      callback(null, 'Version: ImageMagick 7.1.0-15');
    });
    
    let result = await imageProcessor.checkImageMagickDetails();
    assert.strictEqual(result.installed, true);
    assert.strictEqual(result.version, '7.1.0');
    assert.strictEqual(result.meetRequirements, true);
    
    // Scenario 2: ImageMagick installed with 'convert' command (older version)
    execStub.withArgs('magick -version').callsFake((_cmd: string, callback: any) => {
      callback(new Error('Command not found'));
    });
    execStub.withArgs('convert -version').callsFake((_cmd: string, callback: any) => {
      callback(null, 'Version: ImageMagick 6.9.11-60');
    });
    
    result = await imageProcessor.checkImageMagickDetails();
    assert.strictEqual(result.installed, true);
    assert.strictEqual(result.version, '6.9.11');
    assert.strictEqual(result.meetRequirements, false);
    
    // Scenario 3: ImageMagick not installed
    execStub.withArgs('magick -version').callsFake((_cmd: string, callback: any) => {
      callback(new Error('Command not found'));
    });
    execStub.withArgs('convert -version').callsFake((_cmd: string, callback: any) => {
      callback(new Error('Command not found'));
    });
    
    result = await imageProcessor.checkImageMagickDetails();
    assert.strictEqual(result.installed, false);
    assert.strictEqual(result.version, null);
    assert.strictEqual(result.meetRequirements, false);
  });
  
  test('getImageInfo should return image dimensions and format', async () => {
    const identifyStub = TestUtils.mockImageMagickIdentify();
    const testFilePath = TestUtils.createTempFile('test.jpg');
    
    identifyStub.callsFake((_args: any[], callback: any) => {
      callback(null, '800 600 JPEG');
      return {} as any;
    });
    
    const result = await imageProcessor.getImageInfo(testFilePath);
    assert.deepStrictEqual(result, {
      width: 800,
      height: 600,
      format: 'JPEG'
    });
  });
  
  test('getImageInfo should handle error conditions', async () => {
    const identifyStub = TestUtils.mockImageMagickIdentify();
    const testFilePath = TestUtils.createTempFile('test.jpg');
    
    identifyStub.callsFake((_args: any[], callback: any) => {
      callback(new Error('Failed to identify image'));
      return {} as any;
    });
    
    await assert.rejects(
      async () => await imageProcessor.getImageInfo(testFilePath),
      /Failed to identify image/
    );
  });
  
  test('processImage should transform images correctly', async () => {
    // Create a fake 200x100 JPEG "image"
    const testFile = TestUtils.createTempFile('test-process.jpg');
    
    // Mock the necessary functions
    sandbox.stub(imageProcessor, 'getImageInfo').resolves({
      width: 200,
      height: 100,
      format: 'JPEG'
    });
    
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    
    sandbox.stub(path, 'join').callsFake((...args: any[]) => {
      if (args.includes('processed')) {
        return path.join(TestUtils.getTempDir(), 'processed-test.webp');
      }
      return path.join(...args);
    });
    
    const resizeStub = sandbox.stub(imageProcessor, 'resizeImage').resolves();
    const convertStub = sandbox.stub(imageProcessor, 'convertToWebP').resolves();
    
    // Stub fs functions for file size checks
    sandbox.stub(fs, 'statSync').callsFake((filePath: fs.PathLike) => {
      if (String(filePath).includes('processed')) {
        return { size: 10000 } as fs.Stats;
      }
      return { size: 20000 } as fs.Stats;
    });
    
    // Create a mock progress object
    const progress = {
      report: sandbox.stub()
    } as unknown as vscode.Progress<{ message?: string; increment?: number }>;
    
    // Process the image
    const result = await imageProcessor.processImage(
      testFile,
      {
        webpQuality: 80,
        maxWidth: 1000,
        maxHeight: 1000,
        preserveOriginal: true
      },
      progress
    );
    
    // Verify results
    assert.ok((progress.report as any).called, 'Progress should be reported');
    assert.ok(resizeStub.calledOnce, 'resize should be called');
    assert.ok(convertStub.calledOnce, 'convert should be called');
    
    assert.strictEqual(result.originalSize, 20000);
    assert.strictEqual(result.processedSize, 10000);
    assert.strictEqual(result.reductionPercentage, 50);
    assert.strictEqual(result.width, 200);
    assert.strictEqual(result.height, 100);
  });
  
  test('processImage should throw error for non-image files', async () => {
    const testFile = TestUtils.createTempFile('test.txt');
    
    sandbox.stub(imageProcessor, 'isImageFile').resolves(false);
    
    await assert.rejects(
      async () => await imageProcessor.processImage(testFile),
      /not a valid image file/
    );
  });
  
  test('processImage should handle errors during processing', async () => {
    const testFile = TestUtils.createTempFile('test-error.jpg');
    
    sandbox.stub(imageProcessor, 'isImageFile').resolves(true);
    sandbox.stub(imageProcessor, 'getImageInfo').resolves({
      width: 200,
      height: 100,
      format: 'JPEG'
    });
    
    const error = new Error('Conversion failed');
    sandbox.stub(imageProcessor, 'resizeImage').rejects(error);
    
    await assert.rejects(
      async () => await imageProcessor.processImage(testFile),
      /Conversion failed/
    );
  });
}); 