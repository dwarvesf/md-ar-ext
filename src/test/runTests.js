const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

// Set up mocks for VS Code
global.vscode = {
  Progress: function() {
    return {
      report: function() {}
    };
  },
  window: {
    showInformationMessage: function() {},
    showErrorMessage: function() {},
    showWarningMessage: function() {},
    createOutputChannel: function() {
      return {
        appendLine: function() {},
        show: function() {},
      };
    }
  },
  workspace: {
    getConfiguration: function() {
      return {
        get: function() { return {}; }
      };
    }
  }
};

// Create the mocha test
const mocha = new Mocha({
  ui: 'tdd',
  color: true
});

// Path to compiled test files
const testsRoot = path.resolve(__dirname, '../../out/test/suite');
console.log(`Looking for test files in: ${testsRoot}`);

if (!fs.existsSync(testsRoot)) {
  console.error(`Test directory not found: ${testsRoot}`);
  process.exit(1);
}

// Find just the imageProcessor test
const imageProcessorTestPath = path.join(testsRoot, 'imageProcessor.test.js');
console.log(`Looking for ImageProcessor test at: ${imageProcessorTestPath}`);

if (fs.existsSync(imageProcessorTestPath)) {
  console.log(`Found ImageProcessor test file: ${imageProcessorTestPath}`);
  mocha.addFile(imageProcessorTestPath);

  // Run the tests
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
} else {
  console.error(`ImageProcessor test file not found at: ${imageProcessorTestPath}`);
  process.exit(1);
} 