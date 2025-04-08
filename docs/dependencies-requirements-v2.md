# md-ar-ext: Dependencies and Technical Requirements v2

This document outlines the dependencies, technical requirements, and development environment setup for implementing md-ar-ext v2.

## 1. Core Dependencies

### 1.1. Runtime Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥14.x | Runtime environment |
| VS Code API | ^1.85.0 | Extension platform |
| Arweave JS SDK | ^1.15.1 | Arweave blockchain interaction |
| ImageMagick | ≥7.x | Image processing |

### 1.2. Development Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| TypeScript | ^5.2.2 | Programming language |
| ESLint | ^8.52.0 | Code quality and style checking |
| Mocha | ^10.2.0 | Testing framework |
| VS Code Test Electron | ^2.3.8 | Extension testing |
| webpack | ^5.x | Module bundling |

## 2. External Services

| Service | Purpose | API Version |
|---------|---------|-------------|
| Arweave Network | Blockchain storage | N/A |
| Arweave Gateway API | Content retrieval | N/A |
| CoinGecko API | AR to USD conversion | v3 |

## 3. System Requirements

### 3.1. End User Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| VS Code | v1.85.0+ | Latest stable |
| OS | Windows 10+, macOS 10.15+, Ubuntu 20.04+ | Latest stable |
| RAM | 4GB | 8GB+ |
| CPU | Dual core | Quad core |
| Disk Space | 200MB | 500MB |
| ImageMagick | v7.0+ | Latest stable |
| Internet Connection | Required | Broadband |

### 3.2. Developer Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| VS Code | v1.85.0+ | Latest stable |
| Node.js | v14.x | v18.x+ |
| npm | v6.x | v9.x+ |
| Git | Any recent | Latest stable |
| OS | Windows 10+, macOS 10.15+, Ubuntu 20.04+ | Latest stable |
| RAM | 8GB | 16GB+ |
| CPU | Quad core | Six core+ |
| Disk Space | 1GB | 2GB+ |
| ImageMagick | v7.0+ | Latest stable |
| Internet Connection | Broadband | High-speed broadband |

## 4. Installation Requirements

### 4.1. ImageMagick Installation

#### Windows
```
# Using Chocolatey
choco install imagemagick

# Manual installation
Download and run installer from https://imagemagick.org/script/download.php#windows
```

#### macOS
```
# Using Homebrew
brew install imagemagick

# Using MacPorts
port install imagemagick
```

#### Linux (Ubuntu/Debian)
```
apt-get update
apt-get install imagemagick
```

### 4.2. Development Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd md-ar-ext

# Install dependencies
npm install

# Build extension
npm run compile

# Run tests
npm test

# Package extension
npm run vscode:prepublish
```

## 5. VS Code API Requirements

### 5.1. Required VS Code APIs

| API | Purpose |
|-----|---------|
| `vscode.commands` | Register and execute commands |
| `vscode.window` | UI elements and notifications |
| `vscode.workspace` | Access workspace and settings |
| `vscode.Uri` | File handling |
| `vscode.Progress` | Display progress indicators |
| `vscode.SecretStorage` | Secure key storage |
| `vscode.languages` | Language-specific functionality |
| `vscode.extensions` | Extension management |
| `vscode.env` | Environment information |

### 5.2. Extension Points

| Extension Point | Purpose |
|-----------------|---------|
| `activationEvents` | Activate extension for markdown |
| `commands` | Define extension commands |
| `configuration` | Define extension settings |
| `menus` | Add context menu items |

## 6. Permission Requirements

### 6.1. VS Code Permissions

| Permission | Purpose |
|------------|---------|
| File System Access | Read and write image files |
| Network Access | Connect to Arweave network |
| Configuration Storage | Store extension settings |
| Secret Storage | Store wallet keys securely |
| Clipboard Access | Access clipboard for image pasting |

### 6.2. User Consent Requirements

The extension should request user consent for:

- Using network connection to upload files
- Accessing clipboard contents
- Storing wallet information
- Reading and writing to the file system
- Processing images with ImageMagick

## 7. Performance Requirements

### 7.1. Image Processing

| Metric | Target |
|--------|--------|
| Max Image Size | Support images up to 20MB |
| Processing Time | < 2 seconds for 1MB image |
| Memory Usage | < 200MB for normal operation |

### 7.2. Network Operations

| Metric | Target |
|--------|--------|
| Upload Speed | Support at least 500KB/s |
| Timeout Handling | Retry after 30 seconds |
| Connection Issues | Graceful error handling |

### 7.3. UI Responsiveness

| Metric | Target |
|--------|--------|
| Command Execution | < 100ms response time |
| Progress Updates | Update at least every 500ms |
| WebView Rendering | < 200ms for initial render |

## 8. Security Requirements

### 8.1. Wallet Key Management

- Secure storage using VS Code's SecretStorage API
- No plaintext storage of keys
- Validation of key format before use
- Option to clear keys from storage

### 8.2. Network Security

- Use HTTPS for all API calls
- Validate responses from external services
- Implement rate limiting for API calls
- Handle authentication securely

### 8.3. File System Security

- Use secure temporary directories
- Clean up temporary files after use
- Validate file paths to prevent path traversal
- Handle file permissions appropriately

## 9. Compatibility Requirements

### 9.1. VS Code Versions

| VS Code Version | Compatibility |
|-----------------|---------------|
| < v1.85.0 | Not supported |
| v1.85.0+ | Fully supported |

### 9.2. Operating Systems

| OS | Versions | Notes |
|----|----------|-------|
| Windows | 10+ | Full support |
| macOS | 10.15+ | Full support |
| Linux | Ubuntu 20.04+, Debian 11+ | Full support |
| Linux | Other distributions | Best effort support |

### 9.3. ImageMagick Compatibility

| ImageMagick Version | Compatibility |
|---------------------|---------------|
| < v7.0 | Limited support |
| v7.0+ | Full support |

## 10. Internationalization Requirements

The extension should support:

- English as the primary language
- Potential for translation to other languages in future versions
- Use of language-neutral icons where possible
- Date/time formatting based on user locale
- Currency formatting based on user locale (for AR/USD display)

## 11. Accessibility Requirements

The extension should adhere to:

- VS Code accessibility guidelines
- Keyboard navigation for all functions
- Screen reader compatibility for UI elements
- Sufficient color contrast for UI elements
- Clear error messages and instructions 