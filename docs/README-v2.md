# md-ar-ext v2

`md-ar-ext` is a VS Code/Cursor extension for Markdown blogging (e.g., GitHub Pages). Drag or paste images, and it resizes (if needed), converts to WebP, uploads to Arweave, and embeds the URL—automatically, with progress tracking and customizable settings.

## Features

### Core Functionality

- **Drag-and-Drop**: Drop images into Markdown files.
- **Clipboard Paste**: Paste images (Ctrl+V/Cmd+V), skips text.
- **Optimization**: Resizes large images, converts to WebP with configurable quality.
- **Storage**: Arweave for permanent, decentralized hosting.
- **Markdown**: Inserts `![image](https://arweave.net/txid)`.
- **Filtering**: Skips videos, animated GIFs.

### Enhanced Experience

- **Progress Tracking**: Visual indicators for all processing steps.
- **Wallet Management**: Balance checks before uploads.
- **Customization**: Configurable image quality and dimensions.
- **Cost Management**: Estimates costs and tracks AR spending.
- **Metadata**: Optional tagging for better organization.

## Why md-ar-ext?

- **Permanent**: Arweave beats Imgur's impermanence.
- **Optimized**: WebP for faster loads with your preferred quality.
- **Transparent**: See progress, costs, and wallet balance.
- **Simple**: Drag or paste, done.

## Installation

### Prerequisites

- **VS Code** (1.85+) or **Cursor**.
- **ImageMagick**:
  - Mac: `brew install imagemagick`
  - Ubuntu: `sudo apt-get install imagemagick`
  - Windows: `choco install imagemagick` or [ImageMagick.org](https://imagemagick.org).
- **Arweave Wallet**: JSON keyfile with AR tokens ([faucet.arweave.net](https://faucet.arweave.net/)).

### Steps

1. **Download**: Get `md-ar-ext-0.1.0.vsix` from [Releases](https://github.com/yourusername/md-ar-ext/releases).
2. **Install**: Extensions (`Ctrl+Shift+X`) → `...` → "Install from VSIX" → Select `.vsix` → Reload.
3. **Set Key**: First use prompts for your Arweave private key (JSON string), stored securely via SecretStorage.
4. **Configure**: (Optional) Adjust settings in VS Code preferences.
5. **Test**: Drag or paste an image (e.g., `.jpg`) into a `.md` file.

## Usage

### Basic Operations

- **Drag**: Drop images into Markdown (hold `Shift`).
- **Paste**: Copy image to clipboard, press `Ctrl+V`/`Cmd+V` in Markdown.
- **Formats**: JPG, JPEG, PNG, WebP, AVIF, single-frame GIF.
- **Skipped**: Videos, animated GIFs, text.

### Advanced Features

- **Check Balance**: View current Arweave wallet balance.
- **Cost Estimation**: See estimated cost before uploading.
- **Statistics**: View history and total AR spent on uploads.
- **Custom Settings**: Adjust image quality and dimensions to your needs.

### Commands

- `md-ar-ext.pasteAndInsert`: Manual paste.
- `md-ar-ext.updatePrivateKey`: Update Arweave key.
- `md-ar-ext.deletePrivateKey`: Delete stored key.
- `md-ar-ext.checkBalance`: Check wallet balance.
- `md-ar-ext.viewStatistics`: View upload history and costs.
- `md-ar-ext.configureSettings`: Quick settings configuration.

### Settings

- **WebP Quality**: (50-100, default 90)
- **Max Dimensions**: Maximum width/height before resizing.
- **Metadata Tagging**: Enable/disable additional Arweave tags.
- **Custom Tags**: Add custom tags to your uploads.

## Troubleshooting

- **"No image in clipboard"**: Ensure you copied an image.
- **"Key required"**: Enter key when prompted or update via command.
- **"Failed to process"**: Check ImageMagick (`magick -version`).
- **"Low balance"**: Add more AR to your wallet or adjust image quality.
- **"Network error"**: Check your connection or try again later.

## Contributing

### Setup

1. Clone: `git clone https://github.com/yourusername/md-ar-ext.git`
2. Install: `npm install`
3. Run: Open in VS Code/Cursor, press `F5`.

### Guidelines

- **Code**: TypeScript, match style.
- **Issues**: Bugs/features at [Issues](https://github.com/yourusername/md-ar-ext/issues).
- **PRs**: Fork, branch, submit with notes.

## License

MIT License - see [LICENSE](LICENSE).

## Acknowledgments

- Built with [Arweave](https://arweave.org/), [ImageMagick](https://imagemagick.org/), [VS Code SecretStorage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage).
- Thanks to the Arweave community for permanent storage solutions. 