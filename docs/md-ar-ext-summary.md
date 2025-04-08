# md-ar-ext: Compressed Requirement & Solution Summary

## Requirement

- **Goal**: Streamline image handling for GitHub Pages blogging in VS Code/Cursor.
- **Workflow**:
  - Drag-and-drop or paste images (clipboard, skipping text) into Markdown files.
  - Resize >1876×1251 (aspect ratio preserved), convert to WebP, upload to Arweave, insert Markdown link (e.g., `![image](https://arweave.net/txid)`).
- **Constraints**: Skip videos/animated GIFs, support common image formats, use secure Arweave key storage, enable coworker adoption.
- **Evolution**: From Imgur to Arweave, added resizing/WebP, SecretStorage, clipboard paste.

## Solution

- **Project**: `md-ar-ext` VS Code/Cursor extension.
- **Features**:
  - Drag-and-drop and paste (Ctrl+V/Cmd+V) in Markdown files.
  - Validates images (excludes videos/animated GIFs).
  - Resizes >1876×1251, converts to WebP (quality 90) via ImageMagick.
  - Uploads to Arweave with SecretStorage key.
  - Inserts Markdown link.
- **Tech**: TypeScript, VS Code API, `arweave-js`, `imagemagick`, ImageMagick CLI.
- **Setup**: Install `.vsix`, set private key once (SecretStorage), install ImageMagick.
- **Coworker Deployment**: Share `.vsix`, guide on ImageMagick and key setup.
