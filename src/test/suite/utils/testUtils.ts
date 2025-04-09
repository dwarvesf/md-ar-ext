/**
 * Test utilities for the extension
 */
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';
import * as imagemagick from 'imagemagick';

// Import the mocks
import { mockVSCode, setupVSCodeMocks, resetVSCodeMocks } from './mocks/vscode';

/**
 * Test utilities class
 */
export class TestUtils {
  // The sinon sandbox for test isolation
  private static _sandbox: sinon.SinonSandbox | null = null;
  
  // Temporary test directory
  private static _tempDir: string = '';
  
  // Files created during tests that need cleanup
  private static _tempFiles: string[] = [];

  /**
   * Sets up the test environment
   */
  static setup(): sinon.SinonSandbox {
    // Create a sinon sandbox
    this._sandbox = sinon.createSandbox();
    
    // Setup VS Code mocks
    setupVSCodeMocks();
    
    // Create a temporary directory for test files
    this._tempDir = path.join(os.tmpdir(), 'md-ar-ext-test-' + Date.now());
    fs.mkdirSync(this._tempDir, { recursive: true });
    
    return this._sandbox;
  }
  
  /**
   * Tears down the test environment
   */
  static teardown(): void {
    // Restore sinon stubs
    if (this._sandbox) {
      this._sandbox.restore();
      this._sandbox = null;
    }
    
    // Reset VS Code mocks
    resetVSCodeMocks();
    
    // Clean up temporary files
    this._tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
    // Clean up temporary directory
    if (fs.existsSync(this._tempDir)) {
      fs.rmdirSync(this._tempDir, { recursive: true });
    }
    
    // Reset state
    this._tempFiles = [];
  }
  
  /**
   * Creates a temporary file for testing
   * @param name Filename to create
   * @param content Content to write to the file
   * @returns The full path to the created file
   */
  static createTempFile(name: string, content: string | Buffer = 'dummy content'): string {
    const filePath = path.join(this._tempDir, name);
    fs.writeFileSync(filePath, content);
    this._tempFiles.push(filePath);
    return filePath;
  }
  
  /**
   * Gets the temporary directory path
   * @returns Path to the temporary directory
   */
  static getTempDir(): string {
    return this._tempDir;
  }
  
  /**
   * Creates a mock for child_process.exec
   * Uses the sinon sandbox from setup()
   * @returns Sinon stub for exec
   */
  static mockChildProcessExec(): sinon.SinonStub {
    if (!this._sandbox) {
      throw new Error('TestUtils.setup() must be called before mockChildProcessExec');
    }
    return this._sandbox.stub(childProcess, 'exec');
  }
  
  /**
   * Creates a mock for ImageMagick identify
   * Uses the sinon sandbox from setup()
   * @returns Sinon stub for identify
   */
  static mockImageMagickIdentify(): sinon.SinonStub {
    if (!this._sandbox) {
      throw new Error('TestUtils.setup() must be called before mockImageMagickIdentify');
    }
    return this._sandbox.stub(imagemagick, 'identify').returns({} as any);
  }
  
  /**
   * Creates a mock for ImageMagick convert
   * Uses the sinon sandbox from setup()
   * @returns Sinon stub for convert
   */
  static mockImageMagickConvert(): sinon.SinonStub {
    if (!this._sandbox) {
      throw new Error('TestUtils.setup() must be called before mockImageMagickConvert');
    }
    return this._sandbox.stub(imagemagick, 'convert').returns({} as any);
  }
  
  /**
   * Access to the VS Code mock
   * @returns The mock VS Code API
   */
  static get vscode(): typeof mockVSCode {
    return mockVSCode;
  }
} 