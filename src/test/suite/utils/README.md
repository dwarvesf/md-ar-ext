# Test Utilities

This directory contains utility functions and mocks to assist with testing the VS Code extension.

## Structure

- `testUtils.ts` - The main test utilities class with helper methods for setting up tests
- `mocks/` - Mock implementations of external dependencies
  - `vscode.ts` - Mocks for the VS Code API

## Usage

To use the test utilities in your tests:

```typescript
import { TestUtils } from '../utils/testUtils';

describe('My Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  
  beforeEach(() => {
    // Setup test environment and get sinon sandbox
    sandbox = TestUtils.setup();
  });
  
  afterEach(() => {
    // Clean up test environment
    TestUtils.teardown();
  });
  
  it('should test something', () => {
    // Use the test utilities
    const tempFile = TestUtils.createTempFile('test.txt', 'test content');
    
    // Access VS Code mocks if needed
    const vscode = TestUtils.vscode;
    
    // Test your code...
  });
});
```

## Legacy Files

There is a legacy JavaScript mock file in `out/test/mock-vscode.js` which is used by the `test:single` npm script.
New tests should use the TypeScript implementation in this directory instead. 