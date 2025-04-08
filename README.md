# md-ar-ext

`md-ar-ext` is a VS Code/Cursor extension for Markdown blogging (e.g., GitHub Pages). Drag or paste images, and it resizes (if >1876×1251), converts to WebP, uploads to Arweave, and embeds the URL—automatically.

## Features

- **Drag-and-Drop**: Drop images into Markdown files.
- **Clipboard Paste**: Paste images (Ctrl+V/Cmd+V), skips text.
- **Optimization**: Resizes large images (max 1876×1251), converts to WebP (quality 90).
- **Storage**: Arweave for permanent, decentralized hosting.
- **Markdown**: Inserts `![image](https://arweave.net/txid)`.
- **Filtering**: Skips videos, animated GIFs.

## Why md-ar-ext?

- **Permanent**: Arweave beats Imgur’s impermanence.
- **Optimized**: WebP for faster loads.
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

1. **Download**: Get `md-ar-ext-0.0.1.vsix` from [Releases](https://github.com/yourusername/md-ar-ext/releases).
2. **Install**: Extensions (`Ctrl+Shift+X`) → `...` → "Install from VSIX" → Select `.vsix` → Reload.
3. **Set Key**: First use prompts for your Arweave private key (JSON string), stored securely via SecretStorage.
4. **Test**: Drag or paste an image (e.g., `.jpg`) into a `.md` file while holding `Shift` (drag) or `Ctrl+V` (paste).

## Usage

- **Drag**: Drop images into Markdown (hold `Shift`).
- **Paste**: Copy image to clipboard, press `Ctrl+V`/`Cmd+V` in Markdown.
- **Formats**: JPG, JPEG, PNG, WebP, AVIF, single-frame GIF.
- **Skipped**: Videos, animated GIFs, text.
- **Cost**: ~$0.002/MB on Arweave ([arweavefees.com](https://arweavefees.com/)).
- **Commands**: 
  - `md-ar-ext.pasteAndInsert` (manual paste).
  - `md-ar-ext.updatePrivateKey`.
  - `md-ar-ext.deletePrivateKey`.

## Troubleshooting

- **“No image in clipboard”**: Ensure you copied an image.
- **“Key required”**: Enter key when prompted or update via command.
- **“Failed to process”**: Check ImageMagick (`magick -version`).

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