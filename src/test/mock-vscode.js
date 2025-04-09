// This mock is used to load before the test runs, to provide a fake 'vscode' module

console.log('Loading VS Code mock module...');

// Create a basic mock of VS Code APIs needed by tests
const vscode = {
  // Window namespace
  window: {
    showInformationMessage: async () => undefined,
    showWarningMessage: async () => undefined,
    showErrorMessage: async () => undefined,
    showInputBox: async () => '',
    showQuickPick: async () => undefined,
    createOutputChannel: () => ({
      appendLine: () => {},
      append: () => {},
      show: () => {},
      hide: () => {},
      dispose: () => {},
      clear: () => {}
    }),
    createStatusBarItem: () => ({
      text: '',
      tooltip: '',
      command: '',
      show: () => {},
      hide: () => {},
      dispose: () => {}
    }),
    withProgress: async (options, task) => task({
      report: () => {}
    })
  },
  
  // Workspace namespace
  workspace: {
    getConfiguration: (section) => ({
      get: (key, defaultValue) => defaultValue,
      update: async () => undefined,
      has: () => false
    }),
    fs: {
      readFile: async () => Buffer.from(''),
      writeFile: async () => undefined,
      stat: async () => ({ 
        type: 1, 
        size: 0,
        ctime: Date.now(),
        mtime: Date.now() 
      }),
      readDirectory: async () => []
    },
    workspaceFolders: [{
      uri: { fsPath: '/test-workspace' },
      name: 'Test Workspace',
      index: 0
    }],
    openTextDocument: async () => ({
      getText: () => '',
      save: async () => true
    })
  },
  
  // Commands namespace
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
    executeCommand: async () => undefined
  },
  
  // URI
  Uri: {
    file: (path) => ({ 
      fsPath: path,
      scheme: 'file' 
    }),
    parse: (uri) => ({ 
      fsPath: uri.replace(/^file:\/\//, ''),
      scheme: uri.split(':')[0] 
    })
  },
  
  // Position and Range
  Position: class {
    constructor(line, character) {
      this.line = line;
      this.character = character;
    }
  },
  Range: class {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  },
  
  // Event emitter
  EventEmitter: class {
    constructor() {
      this.listeners = [];
    }
    event = (listener) => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    }
    fire = (event) => {
      this.listeners.forEach(listener => listener(event));
    }
  },
  
  // Extension context
  ExtensionContext: class {
    constructor() {
      this.subscriptions = [];
      this.extensionPath = '/test-extension-path';
      this.storagePath = '/test-storage-path';
      this.globalState = {
        get: (key) => undefined,
        update: async (key, value) => {},
        keys: () => []
      };
      this.workspaceState = {
        get: (key) => undefined,
        update: async (key, value) => {},
        keys: () => []
      };
      this.secrets = {
        get: async (key) => undefined,
        store: async (key, value) => {},
        delete: async (key) => {}
      };
    }
  },
  
  // Disposable
  Disposable: class {
    constructor(fn) {
      this.dispose = fn || (() => {});
    }
    static from(...disposables) {
      return {
        dispose: () => {
          for (const d of disposables) {
            d.dispose();
          }
        }
      };
    }
  },
  
  // VS Code enums and constants
  ProgressLocation: {
    Notification: 1,
    Window: 10
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  ViewColumn: {
    Active: -1,
    Beside: -2,
    One: 1,
    Two: 2,
    Three: 3
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  }
};

// Register our mock with require.cache
const mockPath = require.resolve('vscode');
require.cache[mockPath] = {
  id: mockPath,
  filename: mockPath,
  loaded: true,
  exports: vscode
};

console.log('VS Code mock module loaded successfully');

// Export the mock for direct use if needed
module.exports = vscode; 