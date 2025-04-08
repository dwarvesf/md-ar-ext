# md-ar-ext: Implementation Plan v2

This document outlines the specific improvements and implementation tasks required to meet the requirements in the PRD v2.

## 1. Code Structure Improvements

### 1.1. Modular Architecture

The current codebase has started to introduce modularity with utility files, but requires further organization:

- **Current Issue**: Most functionality is still located in the main `extension.ts` file
- **Improvement**: Refactor to a fully modular architecture with clear separation of concerns

### 1.2. Proposed Module Structure

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
│   └── ui.ts                   # Shared UI components
└── test/                       # Tests
```

## 2. Component-Specific Improvements

### 2.1. ImageProcessor Module

**Current Issues:**
- Limited image format support
- No feedback on optimization results
- Limited configuration options

**Required Improvements:**
1. Add support for AVIF input format
2. Enhance WebP conversion with configurable quality settings
3. Implement detailed size reduction feedback
4. Add validation for ImageMagick dependency and installation guidance

### 2.2. ArweaveUploader Module

**Current Issues:**
- Basic upload functionality without transaction verification
- Limited cost estimation
- No support for cancellable uploads

**Required Improvements:**
1. Implement transaction verification
2. Add detailed cost estimation with AR price conversion
3. Support cancellable uploads with progress reporting
4. Add automatic retry logic for failed operations
5. Implement metadata tagging with customizable tags

### 2.3. KeyManager Module

**Current Issues:**
- Basic key management without file import
- No wallet address display
- Limited key validation

**Required Improvements:**
1. Add support for importing keys from JSON files
2. Implement wallet address display
3. Enhance key validation
4. Improve secure storage using VS Code's SecretStorage API

### 2.4. SettingsManager Module

**Current Issues:**
- Basic settings without comprehensive UI
- Limited configuration options

**Required Improvements:**
1. Implement comprehensive settings UI
2. Add custom tag management interface
3. Add validation for all settings
4. Implement settings export/import

### 2.5. ProgressIndicator Module

**Current Issues:**
- Basic progress reporting without time estimates
- No support for cancellable operations

**Required Improvements:**
1. Add time estimates for long-running operations
2. Implement cancellable progress reporting
3. Add detailed step-by-step progress

### 2.6. StatsTracker Module

**Current Issues:**
- Basic stats without export capabilities
- Limited statistics tracking

**Required Improvements:**
1. Implement comprehensive statistics tracking
2. Add export functionality for statistics
3. Track upload costs and cumulative spending

## 3. New Features Implementation

### 3.1. Wallet Management and Cost Transparency

1. **Balance Checking:**
   - Implement wallet balance check command
   - Add balance display in AR and USD equivalent
   - Add automatic balance check before uploads

2. **Cost Estimation:**
   - Implement upload cost estimation
   - Display cost in AR and USD equivalent
   - Track cumulative costs

3. **Wallet Import:**
   - Implement key import from JSON file
   - Add wallet address display
   - Add key validation

### 3.2. Enhanced User Experience

1. **Upload Progress:**
   - Implement detailed upload progress with time estimates
   - Add cancellation support for uploads
   - Add step-by-step progress indicators

2. **Error Handling:**
   - Implement comprehensive error handling
   - Add actionable error messages
   - Add automatic retry logic

3. **Dependency Checking:**
   - Add ImageMagick dependency check
   - Provide installation instructions
   - Add version compatibility check

### 3.3. Statistics and Monitoring

1. **Upload Statistics:**
   - Track all uploads with detailed information
   - Monitor cumulative AR costs
   - Track optimization benefits

2. **Export Functionality:**
   - Add CSV export for upload history
   - Add JSON export for all statistics
   - Support date range filtering

3. **Transaction Verification:**
   - Verify successful posting to Arweave
   - Track transaction status
   - Provide transaction links

## 4. Implementation Approach

1. **Phase 1: Code Structure Refactoring**
   - Implement modular architecture
   - Move functionality from extension.ts to appropriate modules
   - Set up command structure

2. **Phase 2: Core Module Improvements**
   - Enhance ImageProcessor
   - Improve ArweaveUploader
   - Update KeyManager
   - Extend SettingsManager

3. **Phase 3: New Feature Implementation**
   - Implement Wallet Management features
   - Add Enhanced User Experience features
   - Develop Statistics and Monitoring features

4. **Phase 4: Testing and Documentation**
   - Implement comprehensive tests
   - Update documentation
   - Create user guides

## 5. Testing Strategy

1. **Unit Tests:**
   - Test each module independently
   - Use mocks for external dependencies

2. **Integration Tests:**
   - Test interactions between modules
   - Mock VS Code API and Arweave API

3. **End-to-End Tests:**
   - Test complete user workflows
   - Use real VS Code environment

## 6. Risks and Mitigations

1. **Dependency on ImageMagick:**
   - Risk: Users may not have ImageMagick installed
   - Mitigation: Add clear installation guidance and fallback options

2. **Arweave Network Issues:**
   - Risk: Network connectivity or API changes
   - Mitigation: Implement retry logic and handle API errors gracefully

3. **Performance with Large Images:**
   - Risk: Processing large images may be slow
   - Mitigation: Implement background processing and optimize for memory usage 