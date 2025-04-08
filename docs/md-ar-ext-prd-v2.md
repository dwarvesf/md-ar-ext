# md-ar-ext: Product Requirements Document v2

## 1. Overview

md-ar-ext is a Visual Studio Code extension that allows users to easily upload images to Arweave blockchain and insert Markdown links into their documents. This document outlines the requirements for version 2.0 of the extension.

## 2. User Stories

### 2.1 Core Functionality (Existing)

- As a markdown author, I want to paste images directly into my document from the clipboard, so I can quickly add visual content without manual file management.
- As a content creator, I want to drag and drop images into markdown files, so I can efficiently add visual references.
- As a markdown author, I want the extension to automatically resize large images, so I can optimize my content for web viewing.
- As a user, I want the extension to convert images to WebP format, so I can benefit from better compression and quality.
- As a content creator, I want the extension to upload images to Arweave blockchain, so my content remains permanent and decentralized.
- As a markdown author, I want the extension to automatically insert properly formatted image links in my document, so I don't have to manually edit HTML/markdown.

### 2.2 Enhanced Settings Management (New)

- As a user, I want to configure the WebP image quality, so I can balance file size and visual fidelity according to my needs.
- As a user, I want to set maximum image dimensions, so I can ensure consistent image sizing across my documents.
- As a content creator, I want to enable/disable metadata tagging, so I can control what information is attached to my uploads.
- As a user, I want to define custom Arweave tags, so I can organize and categorize my uploads according to my own taxonomy.

### 2.3 Wallet Management and Cost Transparency (New)

- As a user, I want to check my Arweave wallet balance, so I know if I have sufficient funds for uploads.
- As a user, I want to verify my wallet address, so I can confirm I'm using the correct account.
- As a user, I want to import my Arweave key from a file, so I can avoid manually copying JSON key strings.
- As a user, I want to receive cost estimates before uploading, so I can make informed decisions about using the service.
- As a user, I want to track my upload costs over time, so I can monitor my spending on Arweave storage.

### 2.4 Enhanced User Experience (New)

- As a user, I want detailed upload progress with time estimates, so I can better understand how long operations will take.
- As a user, I want the ability to cancel uploads in progress, so I can abort operations when needed.
- As a user, I want to receive information about image optimization results, so I can understand the benefits of the processing.
- As a user, I want clear error messages with resolution guidance, so I can troubleshoot issues more effectively.
- As a user, I want to be notified if required dependencies (ImageMagick) are missing, so I can install them easily.

### 2.5 Statistics and Monitoring (New)

- As a user, I want to view statistics about my uploads, so I can track my usage patterns.
- As a user, I want to export my upload history, so I can keep records of my blockchain activities.
- As a user, I want to verify my transactions were successfully submitted to Arweave, so I can ensure my content is permanently stored.

## 3. Functional Requirements

### 3.1 Image Processing

- **Image Format Support**: Support for JPEG, PNG, GIF (non-animated), WEBP, and AVIF input formats
- **Conversion to WebP**: Convert all uploaded images to WebP format for optimal storage efficiency
- **Configurable Quality**: Allow users to set WebP quality from 50-100 (default: 90)
- **Resizing**: Automatically resize images that exceed configurable maximum dimensions
- **Size Reduction Feedback**: Display original and optimized file sizes with percentage reduction

### 3.2 Arweave Integration

- **Wallet Management**: Securely store and manage Arweave wallet private keys using VS Code's secret storage
- **Balance Checking**: Allow users to check their Arweave wallet balance before uploading
- **Cost Estimation**: Estimate AR cost before uploading to facilitate informed decisions
- **Metadata Tagging**: Allow optional metadata tagging on uploads including creation date, file type, and custom tags
- **Transaction Verification**: Verify successful posting of transactions to the Arweave network
- **Automatic Retries**: Implement automatic retry logic for failed operations with configurable attempts

### 3.3 Settings and Configuration

- **WebP Quality Setting**: Configure image quality for WebP conversion (50-100)
- **Maximum Dimensions**: Set maximum width and height for image resizing
- **Metadata Tagging Toggle**: Enable/disable inclusion of metadata tags with uploads
- **Custom Tags**: Define and manage custom tags to attach to Arweave uploads
- **Upload Progress Display**: Toggle detailed upload progress display with time estimates
- **Balance Check Toggle**: Enable/disable automatic balance checking before uploads
- **Settings UI**: Provide a comprehensive settings interface for all configuration options

### 3.4 Progress and Feedback

- **Cancellable Operations**: Allow users to cancel long-running operations
- **Time Estimates**: Display estimated time remaining for uploads
- **File Size Reporting**: Show original vs. optimized file size with reduction percentage
- **Transaction Status**: Inform users about transaction status (pending, complete)
- **Dependency Checking**: Verify required dependencies (ImageMagick) are installed

### 3.5 Statistics and History

- **Upload Tracking**: Track all uploads including file name, size, cost, and transaction ID
- **Cost Monitoring**: Track cumulative AR costs across all uploads
- **Export Functionality**: Allow exporting of upload history and statistics
- **Transaction Verification**: Verify successful posting of uploads to Arweave

## 4. Non-Functional Requirements

### 4.1 Performance

- **Responsive UI**: UI remains responsive during image processing and uploads
- **Efficient Image Processing**: Optimize image processing to minimize memory usage
- **Background Processing**: Perform heavy operations in the background to maintain editor responsiveness

### 4.2 Security

- **Secure Key Storage**: Store Arweave private keys securely using VS Code's SecretStorage API
- **Key Validation**: Validate Arweave keys before storage to prevent misconfigurations
- **No External Key Transmission**: Never transmit private keys to external services beyond Arweave

### 4.3 Usability

- **Intuitive Settings**: Provide clear, well-organized settings with sensible defaults
- **Comprehensive Feedback**: Provide detailed, user-friendly feedback for all operations
- **Error Handling**: Present clear error messages with actionable resolution steps
- **Progress Indication**: Show detailed progress for all long-running operations

### 4.4 Reliability

- **Error Recovery**: Gracefully handle errors and provide recovery mechanisms
- **Automatic Retries**: Automatically retry failed network operations
- **Cleanup on Failure**: Clean up temporary files even when operations fail
- **Transaction Verification**: Verify transactions are successfully posted to Arweave

## 5. Technical Requirements

### 5.1 Dependencies

- **VS Code API**: Extend VS Code with context menu commands, progress indicators, and settings
- **ImageMagick**: Use for image processing (resizing, format conversion, etc.)
- **Arweave JS SDK**: Connect to and interact with the Arweave network
- **NodeJS File System**: Handle file operations for image processing

### 5.2 Architecture

- **Modular Design**: Implement discrete modules for settings management, image processing, Arweave integration, and statistics tracking
- **Asynchronous Processing**: Use asynchronous operations with proper progress indication
- **Error Handling**: Implement comprehensive error handling with user-friendly messages
- **Settings Schema**: Define a robust settings schema with validation

## 6. User Interface

### 6.1 Commands

- `md-ar-ext.pasteAndInsert`: Paste image from clipboard and insert markdown link
- `md-ar-ext.uploadAndInsert`: Upload selected image and insert markdown link
- `md-ar-ext.updatePrivateKey`: Update Arweave private key
- `md-ar-ext.deletePrivateKey`: Delete stored Arweave private key
- `md-ar-ext.checkBalance`: Check Arweave wallet balance
- `md-ar-ext.showWalletAddress`: Display current wallet address
- `md-ar-ext.importKeyFromFile`: Import Arweave key from JSON file
- `md-ar-ext.viewStatistics`: View upload statistics
- `md-ar-ext.exportStats`: Export upload statistics
- `md-ar-ext.configureSettings`: Quick configure common settings
- `md-ar-ext.showSettingsUI`: Open comprehensive settings UI

### 6.2 Context Menu

- Add "Paste and Insert Image" to markdown editor context menu

### 6.3 Progress Indicators

- **Image Processing**: Show progress during image processing steps
- **Upload Progress**: Display detailed upload progress with time estimates
- **Cancellation Support**: Allow cancellation of long-running operations

### 6.4 Settings UI

- **Quick Configure**: Streamlined UI for commonly changed settings
- **Comprehensive Settings**: Full settings UI with all configuration options
- **Custom Tags Management**: Interface for adding and removing custom tags

## 7. Implementation Considerations

### 7.1 Error Handling

- Implement comprehensive error handling for all user-facing operations
- Provide clear, actionable error messages
- Include recovery mechanisms where possible

### 7.2 Data Storage

- Use VS Code's SecretStorage API for storing sensitive data (Arweave keys)
- Use VS Code's Extension State for storing upload statistics
- Implement export functionality for user data

### 7.3 Performance Optimization

- Implement streaming uploads for large files
- Optimize image processing for memory efficiency
- Process images in the background to maintain UI responsiveness

## 8. Future Considerations

- Integration with additional blockchain storage providers
- Support for additional media types (video, audio)
- Batch processing of multiple images
- Customizable markdown templates
- Integration with content management systems

## 9. Acceptance Criteria

The extension will be considered complete when:

1. All user stories are implemented and functional
2. Settings management allows full customization of extension behavior
3. Users can track their upload history and costs
4. The extension provides clear feedback for all operations
5. Error handling is comprehensive and user-friendly
6. Performance is optimized for large images
7. Documentation is complete and accessible 