# MD-AR-EXT: Markdown Arweave Extension

A VS Code extension to resize images, upload them to Arweave, and insert Markdown links.

> **Documentation:** For comprehensive documentation, see the [docs directory](./docs/README.md).

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

## Requirements

- ImageMagick must be installed for image processing
- An Arweave wallet key (JWK) for uploads
- VS Code 1.85.0 or higher

## Installation

### Install ImageMagick

- **macOS**: `brew install imagemagick`
- **Windows**: Download from [ImageMagick Website](https://imagemagick.org/script/download.php)
- **Linux**: `sudo apt-get install imagemagick`

### Install Extension

- Install from VS Code Marketplace (coming soon)
- Or build from source:
  ```
  git clone https://github.com/yourusername/md-ar-ext.git
  cd md-ar-ext
  npm install
  npm run compile
  ```

## Usage

### Set Up

1. Run the command `md-ar-ext: Update Arweave Private Key` to set your wallet key
2. Configure settings with `md-ar-ext: Quick Configure Settings`

### Basic Operations

- **Paste and Upload**: `md-ar-ext: Paste and Insert Image`
- **Upload File**: `md-ar-ext: Upload and Insert Image`
- **Process Only**: `md-ar-ext: Process Image (Without Uploading)`

### Wallet Operations

- **Check Balance**: `md-ar-ext: Check Arweave Wallet Balance`
- **Show Address**: `md-ar-ext: Show Arweave Wallet Address`
- **View History**: `md-ar-ext: View Wallet Transaction History`

### Statistics

- **View Stats**: `md-ar-ext: View Upload Statistics`
- **Export Stats**: `md-ar-ext: Export Upload Statistics`
- **Verify Transactions**: `md-ar-ext: Verify Pending Transactions`

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/md-ar-ext.git

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