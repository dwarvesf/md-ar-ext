# Markdown Arweave Uploader

A VS Code extension to resize images, upload them to Arweave, and insert Markdown links.

> **Documentation:** For comprehensive documentation, see the [docs directory](./docs/README.md).

## Requirements

- ImageMagick must be installed for image processing
- An Arweave wallet key (JWK) for uploads
- VS Code 1.85.0 or higher

## Installation

### Install ImageMagick

ImageMagick is required for image processing:

- **macOS**: `brew install imagemagick`
- **Windows**: Download the installer from [ImageMagick Website](https://imagemagick.org/script/download.php)
- **Linux (Debian/Ubuntu)**: `sudo apt-get install imagemagick`
- **Linux (RHEL/CentOS)**: `sudo yum install ImageMagick`

Verify installation with: `magick --version` or `convert --version`

### Install the Extension

**Option 1: From VS Code Marketplace**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Markdown Arweave Uploader"
4. Click "Install"

**Option 2: From VSIX File**
1. Download the `.vsix` file from [GitHub Releases](https://github.com/dwarvesf/md-ar-ext/releases)
2. In VS Code, go to Extensions
3. Click the "..." menu and select "Install from VSIX..."
4. Choose the downloaded file

**Option 3: Build from Source**
```bash
git clone https://github.com/dwarvesf/md-ar-ext.git
cd md-ar-ext
npm install
npm run webpack-prod
npm run package
```

## Setting Up the Extension

### Initial Configuration

1. **Set up your Arweave Wallet Key**:
   - Run the command `Markdown Arweave Uploader: Update Arweave Private Key` (Ctrl+Shift+P or Cmd+Shift+P to open the command palette)
   - Paste your JWK JSON string, or
   - Use `Markdown Arweave Uploader: Import Arweave Key from File` to import from a file

2. **Quick Configure Settings**:
   - Run `Markdown Arweave Uploader: Quick Configure Settings` to set up common options
   - This guides you through setting image quality, dimensions, and other preferences

3. **Verify Setup**:
   - Run `Markdown Arweave Uploader: Check ImageMagick Installation` to verify ImageMagick is properly installed
   - Run `Markdown Arweave Uploader: Check Arweave Wallet Balance` to confirm your wallet is configured correctly

### Customizing Settings

Access detailed settings by:
- Running `Markdown Arweave Uploader: Open Extension Settings`, or
- Opening VS Code Settings (Ctrl+, or Cmd+,) and searching for "Markdown Arweave Uploader"

**Key Settings**:

| Setting | Description | Default |
|---------|-------------|---------|
| `webpQuality` | WebP image quality (50-100) | 90 |
| `maxWidth` | Maximum image width in pixels | 1876 |
| `maxHeight` | Maximum image height in pixels | 1251 |
| `enableMetadataTags` | Add metadata tags to Arweave uploads | false |
| `customTags` | Custom Arweave tags (format: 'key:value') | [] |
| `preserveOriginalImages` | Keep original image files | true |
| `preserveProcessedImages` | Keep processed images after upload | false |
| `showUploadProgress` | Show detailed upload progress | true |
| `checkBalanceBeforeUpload` | Check wallet balance before uploads | true |
| `retryCount` | Number of upload retries | 3 |
| `showOptimizationStats` | Show image optimization statistics | true |

**Export/Import Settings**:
- Use `Markdown Arweave Uploader: Export Settings` to save your configuration
- Use `Markdown Arweave Uploader: Import Settings` to restore previously saved settings

## Usage

### Basic Operations

- **Paste and Upload**: `Markdown Arweave Uploader: Paste and Insert Image`
- **Upload File**: `Markdown Arweave Uploader: Upload and Insert Image`
- **Process Only**: `Markdown Arweave Uploader: Process Image (Without Uploading)`

### Wallet Operations

- **Check Balance**: `Markdown Arweave Uploader: Check Arweave Wallet Balance`
- **Show Address**: `Markdown Arweave Uploader: Show Arweave Wallet Address`
- **View History**: `Markdown Arweave Uploader: View Wallet Transaction History`

### Statistics

- **View Stats**: `Markdown Arweave Uploader: View Upload Statistics`
- **Export Stats**: `Markdown Arweave Uploader: Export Upload Statistics`
- **Verify Transactions**: `Markdown Arweave Uploader: Verify Pending Transactions`

## Features

- Paste images from clipboard directly into Markdown files
- Automatically resize and optimize images before uploading
- Upload images to the Arweave permanent storage network
- Insert proper Markdown image links
- Track upload statistics and transaction status
- Manage Arweave wallet and check balances

## Architecture

The extension uses a modular architecture with clear separation of concerns:

- **Core Modules**:
  - **ImageProcessor**: Handles image resizing and optimization
  - **ArweaveUploader**: Manages uploads to the Arweave network
  - **KeyManager**: Handles secure wallet key storage and management
  - **SettingsManager**: Manages extension settings
  - **StatsTracker**: Tracks upload statistics and history

- **Infrastructure Modules**:
  - **ErrorHandler**: Centralized error handling with actionable errors
  - **Logger**: Structured logging with categories and levels
  - **NetworkService**: Robust network operations with automatic retries

- **Commands**: Each user command is implemented as a separate function

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/dwarvesf/md-ar-ext.git

# Install dependencies
cd md-ar-ext
npm install

# Compile
npm run compile

# Run tests
npm test
```

### Project Structure

```
src/
├── extension.ts                # Main extension file
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
│   ├── logger.ts               # Structured logging
│   ├── networkService.ts       # Network operations with retries
│   └── ui.ts                   # Shared UI components
└── test/                       # Tests
    ├── runTest.ts              # Test runner
    └── suite/                  # Test suites
```

### Testing

We use a comprehensive testing strategy with unit tests, integration tests, and end-to-end tests:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **Logging and Error Handling**: Robust logging and error reporting

See [TECH-GUIDE.md](./docs/TECH-GUIDE.md) for more details on our testing approach.

## License

[MIT](LICENSE)
