# md-ar-ext: Technical Development Guide

This document provides comprehensive information for developers working on the md-ar-ext VS Code extension.

## Table of Contents

- [Development Requirements](#development-requirements)
- [Project Setup](#project-setup)
- [Dependencies](#dependencies)
- [Testing Architecture](#testing-architecture)
- [Test Plan](#test-plan)
- [Environment Improvements](#environment-improvements)

## Development Requirements

### Development Environment

To develop the md-ar-ext extension, you'll need:

- **Node.js**: v14.0.0 or higher
- **VS Code**: v1.63.0 or higher
- **Git**: For version control
- **ImageMagick**: v7.0.0 or higher for image processing

### IDE Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/md-ar-ext.git
   cd md-ar-ext
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Open the project in VS Code:
   ```bash
   code .
   ```

4. Start the development server:
   ```bash
   npm run watch
   ```

5. Run the extension in debug mode by pressing F5 or using the "Run and Debug" sidebar.

## Dependencies

### External Dependencies

#### ImageMagick

**Purpose:** Image manipulation and format conversion

**Required Version:** 7.0.0 or higher

**Installation:**
- **macOS:** `brew install imagemagick`
- **Windows:** Download installer from [ImageMagick website](https://imagemagick.org/script/download.php)
- **Linux (Debian/Ubuntu):** `sudo apt-get install imagemagick`
- **Linux (RHEL/CentOS):** `sudo yum install ImageMagick`

**Verification Command:** `magick --version` or `convert --version`

**Features Used:**
- Format conversion to WebP
- Image resizing
- Quality adjustment
- Metadata manipulation

#### Node.js

**Purpose:** Runtime environment for the extension

**Required Version:** 14.0.0 or higher

**Installation:**
- Download from [Node.js website](https://nodejs.org/)
- Or use a version manager like nvm

**Verification Command:** `node --version`

### npm Package Dependencies

#### Production Dependencies

| Package          | Version      | Purpose                              |
|------------------|--------------|--------------------------------------|
| `@vscode/vsce`   | ^2.15.0      | VS Code Extension packaging tool     |
| `arweave`        | ^1.13.0      | Arweave blockchain interaction       |
| `node-fetch`     | ^3.3.0       | HTTP requests for API calls          |
| `esbuild`        | ^0.17.5      | Bundling and minification            |

#### Development Dependencies

| Package                    | Version    | Purpose                         |
|----------------------------|------------|--------------------------------|
| `@types/node`              | ^16.11.7   | TypeScript definitions for Node |
| `@types/node-fetch`        | ^2.6.4     | TypeScript definitions for fetch |
| `@types/vscode`            | ^1.63.0    | TypeScript definitions for VS Code |
| `@typescript-eslint/eslint-plugin` | ^5.48.2 | TypeScript linting rules |
| `@typescript-eslint/parser` | ^5.48.2  | TypeScript parser for ESLint    |
| `eslint`                   | ^8.34.0    | JavaScript/TypeScript linting   |
| `typescript`               | ^4.9.5     | TypeScript compiler             |

### VS Code API Usage

| API Module              | Purpose                                     |
|-------------------------|---------------------------------------------|
| `vscode.window`         | UI interaction (input boxes, notifications) |
| `vscode.workspace`      | File system and settings access             |
| `vscode.commands`       | Command registration and execution          |
| `vscode.env`            | Environment access (clipboard, shell)       |
| `vscode.SecretStorage`  | Secure storage for sensitive data           |

## Testing Architecture

### Testing Framework

The extension uses the following testing components:

1. **VS Code Extension Testing Framework** - For testing in the VS Code environment
2. **Mocha** - Test runner
3. **Sinon** - For mocks and stubs
4. **TypeScript** - For type-safe tests

### Testing Structure

```
src/
└── test/
    ├── runTest.ts               # Enhanced test runner
    ├── suite/                   # Test suites
    │   ├── extension.test.ts    # Extension activation tests
    │   ├── errorHandler.test.ts # Error handling tests
    │   ├── logger.test.ts       # Logging system tests
    │   ├── networkService.test.ts # Network service tests
    │   └── imageProcessor.test.ts # Image processor tests
    ├── fixtures/                # Test fixtures
    │   ├── images/              # Sample images for testing
    │   └── keys/                # Sample wallet keys for testing
    └── utils/                   # Test utilities
        ├── mocks.ts             # Mock implementations
        └── testHelpers.ts       # Testing helper functions
```

### Testing Approach

The extension implements a comprehensive testing strategy:

1. **Unit Tests**
   - Test individual modules in isolation
   - Mock external dependencies
   - Focus on edge cases and error conditions
   - Verify behavior under various input conditions

2. **Integration Tests**
   - Test interaction between modules
   - Verify command workflows
   - Test UI interactions
   - Validate end-to-end behavior

3. **Mock Services**
   - Mock VS Code API
   - Mock Arweave network
   - Mock file system operations
   - Mock ImageMagick processes

### Test Coverage Goals

| Module            | Unit Test Target | Integration Test Target |
|-------------------|------------------|-------------------------|
| errorHandler      | 95%              | 80%                     |
| logger            | 90%              | 70%                     |
| imageProcessor    | 90%              | 80%                     |
| arweaveUploader   | 90%              | 80%                     |
| keyManager        | 95%              | 85%                     |
| settingsManager   | 90%              | 80%                     |
| statsTracker      | 90%              | 75%                     |
| commands          | 85%              | 90%                     |

## Test Plan

### Test Categories

1. **Functionality Tests**
   - Verify that each feature works as expected
   - Validate behavior under normal conditions
   - Test boundary conditions and edge cases

2. **Error Handling Tests**
   - Verify proper error detection
   - Test recovery mechanisms
   - Validate user-friendly error messages
   - Test graceful degradation

3. **Performance Tests**
   - Measure processing time for images
   - Test memory usage during operations
   - Verify responsive UI during long operations
   - Test with large images and batches

4. **Security Tests**
   - Verify secure storage of keys
   - Test permissions handling
   - Validate protection of sensitive data
   - Verify secure network communications

### Test Cases: Image Processing

1. **Format Conversion**
   - Convert JPEG to WebP
   - Convert PNG to WebP with transparency
   - Convert animated GIF to WebP
   - Handle unsupported formats gracefully

2. **Image Optimization**
   - Verify size reduction on various image types
   - Test quality settings impact
   - Verify dimension constraints
   - Test optimization of already optimized images

3. **Error Handling**
   - Test missing ImageMagick dependency
   - Test corrupted image files
   - Test memory limitations
   - Test cancellation during processing

### Test Cases: Arweave Integration

1. **Wallet Management**
   - Test key validation
   - Test secure storage
   - Test address display
   - Test balance checking

2. **Upload Process**
   - Test successful upload
   - Test upload fee calculation
   - Test transaction verification
   - Test cancellation during upload

3. **Error Handling**
   - Test insufficient balance
   - Test network errors
   - Test timeout handling
   - Test retry mechanisms

### Test Cases: Markdown Integration

1. **Image Insertion**
   - Test clipboard paste
   - Test file selection
   - Test syntax generation
   - Test cursor positioning after insertion

2. **UI Integration**
   - Test command palette integration
   - Test context menu integration
   - Test progress indicators
   - Test notifications

## Environment Improvements

### VS Code Testing Environment Enhancements

The following improvements have been made to the VS Code testing environment:

1. **Enhanced Test Runner**
   - Added detailed console logging
   - Implemented better error reporting
   - Added test timeouts handling
   - Improved test isolation

2. **Mock Framework**
   - Created comprehensive VS Code API mocks
   - Implemented file system mocks
   - Added network request mocks
   - Created ImageMagick process mocks

3. **Test Utilities**
   - Added helper functions for common test operations
   - Created test fixtures manager
   - Implemented assertion utilities
   - Added test cleanup utilities

4. **Continuous Integration**
   - Configured GitHub Actions for CI
   - Added test coverage reporting
   - Implemented pull request validation
   - Added cross-platform testing

### Development Workflow Improvements

1. **Launch Configurations**
   - Enhanced VS Code launch configurations for testing
   - Added compound launch configurations
   - Created specialized debug configurations for test scenarios
   - Added pre-launch tasks for test preparation

2. **Task Definitions**
   - Added specialized npm scripts for different test categories
   - Created watch tasks for test-driven development
   - Added linting tasks with TypeScript integration
   - Implemented build tasks with proper source maps

3. **Extension Settings**
   - Added development-specific settings
   - Created test environment configuration
   - Implemented mock data settings
   - Added feature flag settings for testing

4. **Debugging Tools**
   - Enhanced debug output for tests
   - Added break points in critical test paths
   - Implemented conditional breakpoints for error scenarios
   - Created watch expressions for test state monitoring

## Best Practices for Development

1. **Code Style**
   - Follow TypeScript best practices
   - Use consistent naming conventions
   - Document public APIs with JSDoc comments
   - Maintain proper file organization

2. **Testing**
   - Write tests before implementing features
   - Maintain high test coverage
   - Test edge cases and error conditions
   - Keep tests fast and deterministic

3. **Error Handling**
   - Use the centralized error handling system
   - Provide actionable error messages
   - Handle all potential errors
   - Log appropriate context for debugging

4. **Performance**
   - Profile CPU-intensive operations
   - Monitor memory usage
   - Optimize network requests
   - Use async operations appropriately

5. **Security**
   - Never store sensitive data in plain text
   - Use SecretStorage for sensitive information
   - Validate all user inputs
   - Implement proper permissions handling 