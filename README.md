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

## Setup with Make Commands

We provide a Makefile to simplify common tasks for both users and developers.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dwarvesf/md-ar-ext.git
cd md-ar-ext

# Run interactive setup (recommended for first-time users)
make setup-first

# To see all available commands
make help
```

The interactive setup will:

- Check and install dependencies (Node.js, npm, ImageMagick)
- Configure your environment variables
- Install npm packages

### Essential Make Commands

| Command | Description |
|---------|-------------|
| `make setup-first` | Interactive first-time setup |
| `make setup` | Install dependencies |
| `make deps` | Check/install system dependencies |
| `make env-setup` | Configure environment variables |
| `make dev` | Start development server with watch mode |
| `make test` | Run tests |
| `make package` | Create VSIX package |
| `make publish` | Publish to VS Code Marketplace |
| `make clean` | Clean build artifacts |

## Setting Up the Extension

### Initial Configuration

1. **Configure your Arweave Wallet**:
   - Run `Markdown Arweave Uploader: Update Arweave Private Key` (Ctrl+Shift+P)
   - Paste your JWK JSON string or use `Import Arweave Key from File`

2. **Configure Settings**:
   - Run `Markdown Arweave Uploader: Quick Configure Settings`
   - Follow the prompts to set image quality, dimensions, etc.

3. **Verify Setup**:
   - Run `Markdown Arweave Uploader: Check ImageMagick Installation`
   - Run `Markdown Arweave Uploader: Check Arweave Wallet Balance`

### Environment Variables

Manage environment variables with:

```bash
make env-setup  # Interactive setup
make env-create # Quick create from template
make env-check  # Validate configuration
```

**Key Environment Variables:**

| Variable | Description | Required |
|----------|-------------|----------|
| `VSCE_PAT` | VS Code Marketplace Token | For publishing |
| `AR_GATEWAY_URL` | Custom Arweave gateway | No |
| `DEV_MODE` | Enable development mode | No |

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

For development, use the Make commands described in the [Setup with Make Commands](#setup-with-make-commands) section.

### Release Process

```bash
# Create a release (patch, minor, or major)
make release-patch  # 0.0.x
make release-minor  # 0.x.0
make release-major  # x.0.0

# Publish to VS Code Marketplace
make publish
```

The release process automatically:

1. Bumps version in package.json
2. Updates CHANGELOG.md
3. Builds and packages the extension
4. Creates git commit and tag

### CI/CD Pipeline

This project uses GitHub Actions for automated workflows:

| Workflow | Description | Trigger |
|----------|-------------|---------|
| **PR Validation** | Validates all pull requests | On PR creation/update |
| **CI** | Runs tests, lint, and build | On push to main, weekly |
| **Release** | Creates and publishes release | Manual trigger |

#### Automated Release Workflow

To create a release using GitHub Actions:

1. Go to Actions tab → Release Extension workflow
2. Click "Run workflow"
3. Select version bump type
4. The workflow will create a tagged release and optionally publish to the marketplace

To enable marketplace publishing, add your `VSCE_PAT` token as a repository secret.

### Project Structure

```
src/
├── extension.ts                # Main extension entry point
├── commands/                   # Command implementations
├── utils/                      # Utility modules
└── test/                       # Tests
```

## License

[MIT](LICENSE)
