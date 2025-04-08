# md-ar-ext v2: Technical Implementation Plan

This document outlines the technical approach to implementing the new features and enhancements for md-ar-ext v2.

## 1. Settings Management Module

### Implementation Steps

1. **Create Settings Module**
   - Create `src/utils/settingsManager.ts` to manage user settings
   - Implement VS Code settings registration in `package.json`
   - Define configuration schema for all customizable options

2. **Settings Schema**

   ```json
   "md-ar-ext.webpQuality": {
     "type": "number",
     "default": 90,
     "minimum": 50,
     "maximum": 100,
     "description": "WebP image quality (50-100)"
   },
   "md-ar-ext.maxWidth": {
     "type": "number",
     "default": 1876,
     "description": "Maximum image width before resizing"
   },
   "md-ar-ext.maxHeight": {
     "type": "number",
     "default": 1251,
     "description": "Maximum image height before resizing"
   },
   "md-ar-ext.enableMetadataTags": {
     "type": "boolean",
     "default": false,
     "description": "Add additional metadata tags to Arweave uploads"
   },
   "md-ar-ext.customTags": {
     "type": "array",
     "default": [],
     "description": "Custom Arweave tags to add to uploads (format: 'key:value')"
   },
   "md-ar-ext.showUploadProgress": {
     "type": "boolean",
     "default": true,
     "description": "Show detailed upload progress with time estimates"
   },
   "md-ar-ext.checkBalanceBeforeUpload": {
     "type": "boolean",
     "default": true,
     "description": "Check wallet balance before attempting uploads"
   }
   ```

3. **Settings API Methods**
   - `getWebpQuality()`: Get current WebP quality setting
   - `getMaxDimensions()`: Get max width/height for resizing
   - `getMetadataTagsEnabled()`: Check if additional tagging is enabled
   - `getCustomTags()`: Get any custom Arweave tags
   - `getSetting<T>()`: Generic method to get any setting with type safety
   - `updateSetting()`: Update a setting with proper configuration target

4. **Settings UI Components**
   - `showSettingsUI()`: Comprehensive settings management UI
   - `quickConfigureSettings()`: Streamlined UI for quick configuration
   - `manageCustomTags()`: UI for adding/removing custom tags

### Integration Plan

- Modify `imageProcessor.ts` to use settings values instead of constants
- Update `arweaveUploader.ts` to include optional metadata tags
- Add settings commands to `extension.ts`

## 2. Wallet Balance Checker

### Implementation Steps

1. **Extend Arweave Module**
   - Add `checkWalletBalance(wallet)` to `arweaveUploader.ts`
   - Implement API call to get current AR balance
   - Add function to estimate upload cost based on file size

2. **Cost Estimation Function**
   - Calculate approximate cost based on file size
   - Implement fallback calculation if API call fails
   - Format cost in user-friendly format

3. **Balance Check UI**
   - Add command to check balance manually
   - Implement pre-upload balance check with warning

### Integration Plan

- Add balance check command to extension
- Integrate balance check into upload flow
- Make balance check configurable through settings

## 3. Transaction Verification and Retry Logic

### Implementation Steps

1. **Retry Mechanism**
   - Create a generic retry function for network operations
   - Configure retry attempts and delay
   - Add proper error handling and logging

2. **Transaction Verification**
   - Add function to verify transaction status
   - Implement polling mechanism for pending transactions
   - Provide user feedback on transaction status

### Integration Plan

- Wrap network operations with retry logic
- Add verification step after upload
- Update progress indicator to show verification status

## 4. Enhanced Progress Indicators

### Implementation Steps

1. **Cancellable Progress**
   - Implement cancellable progress wrapper
   - Add cancellation token to long-running operations
   - Handle cleanup on cancellation

2. **Time Estimates**
   - Implement time estimation based on file size and progress
   - Create progress handler that updates remaining time
   - Show file size optimization results

### Integration Plan

- Replace existing progress indicators with cancellable versions
- Add time estimates to upload progress
- Show file size reduction information after processing

## 5. Statistics and Cost Tracking

### Implementation Steps

1. **Statistics Storage**
   - Define schema for upload statistics
   - Create functions to persist stats to extension storage
   - Implement query functions for statistics

2. **Statistics UI**
   - Create command to view upload statistics
   - Implement exportable statistics report
   - Show cumulative cost information

### Integration Plan

- Add stats tracking to successful uploads
- Register statistics commands in extension
- Update upload flow to record cost estimates

## 6. Improved Error Handling

### Implementation Steps

1. **Error Types**
   - Define common error scenarios
   - Create user-friendly error messages
   - Add recovery suggestions where applicable

2. **Error Recovery**
   - Implement cleanup on error
   - Add retry logic for recoverable errors
   - Provide clear error messages to users

### Integration Plan

- Update try/catch blocks with improved error handling
- Add cleanup code to finally blocks
- Update error messages throughout codebase

## 7. ImageMagick Dependency Check

### Implementation Steps

1. **Dependency Verification**
   - Add function to check if ImageMagick is installed
   - Detect ImageMagick version and capabilities
   - Provide installation instructions if missing

### Integration Plan

- Add verification at extension activation
- Show warning and installation guidance if missing
- Check before attempting image processing operations

## 8. Key Management Enhancements

### Implementation Steps

1. **Key Validation**
   - Add function to validate Arweave key format
   - Verify key can derive a wallet address
   - Add clear error messages for invalid keys

2. **Key Import from File**
   - Implement file picker for key selection
   - Add key reading and validation
   - Store validated key securely

3. **Wallet Address Display**
   - Add function to derive and display wallet address
   - Implement copy to clipboard functionality
   - Show address in user-friendly format

### Integration Plan

- Add key management commands to extension
- Update key input UI with validation
- Add wallet address command

## 9. Package and Command Registration

### Implementation Steps

1. **Update package.json**
   - Register all new commands
   - Add settings schema
   - Update activation events

2. **Command Registration**
   - Register all commands in extension.ts
   - Add proper command handlers
   - Implement context menu integration

### Integration Plan

- Update all imports in extension.ts
- Register commands with proper context
- Test all commands for proper functionality

## 10. Testing and Documentation

### Implementation Steps

1. **Testing**
   - Create test cases for new functionality
   - Test on different platforms
   - Verify proper error handling

2. **Documentation**
   - Update README.md with new features
   - Create usage guide
   - Document settings and commands

### Integration Plan

- Update all documentation
- Create demo or screenshots
- Include setup instructions for dependencies

## 11. Implementation Schedule

| Phase | Features | Timeline |
|------|----------|----------|
| 1    | Settings Management | Week 1 |
| 2    | Wallet Balance and Cost Estimation | Week 1 |
| 3    | Enhanced Progress Indicators | Week 2 |
| 4    | Transaction Verification and Retry | Week 2 |
| 5    | Statistics and Cost Tracking | Week 3 |
| 6    | Improved Error Handling | Week 3 |
| 7    | Key Management Enhancements | Week 4 |
| 8    | Testing and Documentation | Week 4 |

## 12. Dependencies

- VS Code API 1.85.0+
- Arweave JS 1.15.1+
- ImageMagick 0.1.3+
- Node.js 18.x+
