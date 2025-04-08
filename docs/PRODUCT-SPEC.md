# md-ar-ext: Product Specification & Feature Implementation

This document combines the Product Requirements and Implementation details for the md-ar-ext VS Code extension.

## 1. Product Requirements

### 1.1. Purpose and Target Users

The md-ar-ext VS Code extension provides tools for optimizing, uploading, and embedding images in Markdown files using the Arweave blockchain for permanent storage.

**Target Users:**
- Technical writers and documentation authors
- Markdown content creators and bloggers
- Developers documenting code or writing technical articles
- Anyone who wants to preserve images permanently while writing Markdown

### 1.2. Core Functionality

#### 1.2.1. Image Processing

- Format conversion to WebP for optimized web delivery
- Image resizing to specified maximum dimensions
- Configurable compression quality (70-100)
- Size optimization while maintaining acceptable visual quality
- Support for common image formats (JPEG, PNG, GIF, AVIF, etc.)

#### 1.2.2. Arweave Integration

- Secure storage and management of Arweave private keys
- File uploading to the Arweave network
- Clear fee estimation before upload (AR and USD)
- Transaction verification with confirmation status
- Wallet balance checking
- Custom metadata tagging

#### 1.2.3. Markdown Integration

- Clipboard support for direct image pasting
- File selection for uploading existing images
- Automatic Markdown syntax insertion
- Seamless editor integration

### 1.3. Non-Functional Requirements

- **Performance:** Image processing should complete within 5 seconds for most images
- **Security:** Private keys must be securely stored using SecretStorage API
- **Reliability:** Graceful handling of network issues with automatic retries
- **Compatibility:** Support for VS Code 1.63.0+ and all major platforms

## 2. Implementation Architecture

### 2.1. Overall Architecture

The extension is built with a modular architecture and clear separation of concerns:

```
src/
├── extension.ts                # Main extension file (minimal code, just wiring)
├── commands/                   # Command implementations
│   ├── image.ts                # Image-related commands
│   ├── wallet.ts               # Wallet-related commands
│   ├── settings.ts             # Settings-related commands
│   └── statistics.ts           # Statistics-related commands
├── utils/                      # Utility modules
│   ├── imageProcessor.ts       # Image processing utilities
│   ├── arweaveUploader.ts      # Arweave interaction utilities
│   ├── keyManager.ts           # Wallet key management
│   ├── settingsManager.ts      # Settings management
│   ├── progressIndicator.ts    # Progress reporting utilities
│   ├── statsTracker.ts         # Statistics tracking
│   ├── errorHandler.ts         # Centralized error handling
│   ├── logger.ts               # Centralized logging system
│   ├── networkService.ts       # Network operations with retries
│   └── ui.ts                   # Shared UI components
└── test/                       # Tests
    ├── runTest.ts              # Enhanced test runner
    └── suite/                  # Test suites
        ├── errorHandler.test.ts # Tests for error handling
        ├── logger.test.ts      # Tests for logging system
        ├── networkService.test.ts # Tests for network service
        ├── settingsManager.test.ts # Tests for settings manager
        └── imageProcessor.test.ts # Tests for image processor
```

### 2.2. Implementation Progress

#### 2.2.1. Completed Modules and Features

**Code Structure Refactoring:**
- ✅ Modular architecture with clear separation of concerns
- ✅ Enhanced directory structure for better organization
- ✅ Lightweight extension.ts for command wiring

**Infrastructure Modules:**
- ✅ Comprehensive error handling system with typed errors
- ✅ Robust logging system with categories and levels
- ✅ Resilient network service with retry logic

**Core Functionality:**
- ✅ Enhanced image processing with detailed results
- ✅ Transaction verification with confirmation status
- ✅ Improved wallet key management and validation
- ✅ Settings import/export functionality
- ✅ Expanded statistics tracking with export options

#### 2.2.2. In Progress and Remaining Tasks

**Testing:**
- 🔄 Expanding unit tests coverage for all modules (40% complete)
- 🔄 Implementing integration tests for command workflows (20% complete)
- 🔄 End-to-end tests for user workflows
- 🔄 Cross-platform testing

**Documentation:**
- 🔄 User documentation
- 🔄 Developer documentation
- 🔄 Code comments and API documentation

### 2.3. Implementation Plan Phases

#### 2.3.1. Phase 1: Core Module Improvements (Completed)

**Objectives:**
- Enhanced existing modules with better error handling and feedback
- Improved code organization and maintainability
- Added new core functionality to existing modules

**Key Tasks:**
1. ✅ Refactored codebase to modular architecture
2. ✅ Enhanced ImageProcessor with better options and results
3. ✅ Updated ArweaveUploader with transaction verification
4. ✅ Improved KeyManager with better validation and security
5. ✅ Enhanced SettingsManager with import/export
6. ✅ Updated StatsTracker with expanded metrics

#### 2.3.2. Phase 2: Architecture and Testing (In Progress)

**Objectives:**
- Improve overall architecture with better infrastructure
- Implement comprehensive testing strategy
- Add new features for user experience enhancement

**Key Tasks:**
1. ✅ Added centralized error handling system
2. ✅ Added structured logging system
3. ✅ Implemented robust network service with retries
4. 🔄 Expanding test coverage for all modules
5. 🔄 Implementing integration tests for workflows
6. 🔄 Adding end-to-end tests

#### 2.3.3. Phase 3: Documentation and Refinement (Planned)

**Objectives:**
- Complete documentation for users and developers
- Refine user interface and experience
- Optimize performance and reliability

**Key Tasks:**
1. 🔄 User documentation with examples
2. 🔄 Developer documentation for extension architecture
3. 🔄 Code comments and API documentation
4. 🔄 UI refinements for better usability
5. 🔄 Performance optimizations

## 3. Technical Implementation Details

### 3.1. Image Processing Implementation

- Uses ImageMagick for image manipulation via child process calls
- Configurable quality and size settings via extension settings
- Detailed processing results with size comparisons
- Progress reporting during processing operations
- Temporary file management with automatic cleanup

### 3.2. Arweave Integration Implementation

- Uses arweave.js for Arweave API interaction
- Secure key storage using VS Code's SecretStorage API
- Transaction bundle optimization for cost efficiency
- USD price conversion through API integration
- Transaction verification with confirmation monitoring
- Detailed error handling for network issues

### 3.3. Error Handling Architecture

- Custom `ExtensionError` class with typed error categories
- Actionable errors with built-in fix options
- Detailed error context for debugging
- User-friendly error messages with guidance

### 3.4. Settings Management

- Comprehensive settings with validation
- Settings import/export functionality
- Documentation and help for settings options
- Custom tags management with validation

### 3.5. Statistics Tracking

- Detailed metrics for uploads and optimizations
- Transaction status tracking and updates
- Export options in multiple formats (JSON, CSV)
- Visual indicators for status in statistics view

## 4. Future Enhancements

The following features are planned for future versions:

- Advanced image editing capabilities (cropping, filters)
- Batch processing and uploading
- Statistics dashboard with charts and graphs
- Integration with additional Markdown publishing platforms
- Enhanced metadata tagging with AI-assisted suggestions
- Extended file format support for specialized use cases 