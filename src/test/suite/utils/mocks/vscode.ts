/**
 * VS Code API mocks for tests
 * This allows tests to run outside of VS Code and still interact with mocked VS Code APIs
 */
import * as sinon from 'sinon';

/**
 * Creates a stub function that returns a promise resolving to the given value
 * @param value Value to resolve with
 * @returns Sinon stub
 */
function asyncStub<T>(value: T): sinon.SinonStub {
  return sinon.stub().resolves(value);
}

/**
 * Creates a stub function that returns the given value
 * @param value Value to return
 * @returns Sinon stub
 */
function syncStub<T>(value: T): sinon.SinonStub {
  return sinon.stub().returns(value);
}

// Create mock classes and functions for VS Code APIs
export const mockVSCode = {
  // Window namespace
  window: {
    // Status bar
    createStatusBarItem: () => ({
      text: '',
      tooltip: '',
      command: '',
      show: sinon.stub(),
      hide: sinon.stub(),
      dispose: sinon.stub()
    }),
    
    // Messages
    showInformationMessage: asyncStub(undefined),
    showWarningMessage: asyncStub(undefined),
    showErrorMessage: asyncStub(undefined),
    
    // Input
    showInputBox: asyncStub(''),
    showQuickPick: asyncStub(undefined),
    
    // Editors
    activeTextEditor: {
      document: {
        getText: syncStub(''),
        lineAt: syncStub({ text: '' }),
        positionAt: syncStub({ line: 0, character: 0 }),
        offsetAt: syncStub(0)
      },
      selection: {
        active: { line: 0, character: 0 },
        anchor: { line: 0, character: 0 },
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 }
      },
      edit: asyncStub(true)
    },
    
    // Output
    createOutputChannel: () => ({
      appendLine: sinon.stub(),
      append: sinon.stub(),
      show: sinon.stub(),
      hide: sinon.stub(),
      dispose: sinon.stub(),
      clear: sinon.stub()
    }),
    
    // Progress
    withProgress: sinon.stub().callsFake((options, task) => task({
      report: sinon.stub()
    }))
  },
  
  // Workspace namespace
  workspace: {
    // Settings
    getConfiguration: () => ({
      get: sinon.stub().callsFake((key, defaultValue) => defaultValue),
      update: asyncStub(undefined),
      has: syncStub(false)
    }),
    
    // File operations
    fs: {
      readFile: asyncStub(Buffer.from('')),
      writeFile: asyncStub(undefined),
      stat: asyncStub({ 
        type: 1, 
        size: 0,
        ctime: Date.now(),
        mtime: Date.now() 
      }),
      readDirectory: asyncStub([])
    },
    
    // Workspaces
    workspaceFolders: [{
      uri: { fsPath: '/test-workspace' },
      name: 'Test Workspace',
      index: 0
    }],
    
    // Text documents
    openTextDocument: asyncStub({
      getText: syncStub(''),
      lineAt: syncStub({ text: '' }),
      positionAt: syncStub({ line: 0, character: 0 }),
      offsetAt: syncStub(0),
      save: asyncStub(true)
    })
  },
  
  // Extensions namespace
  extensions: {
    getExtension: syncStub({
      packageJSON: { version: '0.2.0' },
      extensionPath: '/test-extension-path',
      activate: asyncStub({})
    })
  },
  
  // Commands namespace
  commands: {
    registerCommand: sinon.stub(),
    executeCommand: asyncStub(undefined)
  },
  
  // Secret storage
  secretStorage: class {
    private _store: Map<string, string> = new Map();
    
    get(key: string): Thenable<string | undefined> {
      return Promise.resolve(this._store.get(key));
    }
    
    store(key: string, value: string): Thenable<void> {
      this._store.set(key, value);
      return Promise.resolve();
    }
    
    delete(key: string): Thenable<void> {
      this._store.delete(key);
      return Promise.resolve();
    }
  },
  
  // URI and positions
  uri: {
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
    parse: (uri: string) => ({ fsPath: uri, scheme: uri.split(':')[0] })
  },
  position: class {
    constructor(public line: number, public character: number) {}
  },
  range: class {
    constructor(
      public start: { line: number, character: number }, 
      public end: { line: number, character: number }
    ) {}
  }
};

/**
 * A sandbox for VS Code mocks that can be reset between tests
 */
let sandbox: sinon.SinonSandbox | null = null;

/**
 * Setup mock injection
 */
export function setupVSCodeMocks(): sinon.SinonSandbox {
  // Create a fresh sandbox for each test
  sandbox = sinon.createSandbox();
  return sandbox;
}

/**
 * Reset all VS Code mocks
 */
export function resetVSCodeMocks(): void {
  if (sandbox) {
    sandbox.restore();
    sandbox = null;
  }
} 