# md-ar-ext: Product Requirements Document (PRD)

## Overview

`md-ar-ext` is a VS Code/Cursor extension for Markdown blogging (e.g., GitHub Pages). It automates image processing—resizing, WebP conversion, and Arweave upload—via drag-and-drop or clipboard paste, embedding permanent URLs in Markdown.

## Problem Statement

- GitHub Pages bloggers need permanent, optimized image hosting beyond repo limits.
- Manual processing is tedious; Imgur lacks permanence.
- Teams require a secure, simple tool.

## Goals

- Automate image handling and Arweave upload in VS Code/Cursor.
- Securely store Arweave keys with minimal effort.
- Optimize images for web with permanent storage.

## Requirements

### Functional

1. **Input**:
   - Drag-and-drop images into Markdown files.
   - Paste images from clipboard (Ctrl+V/Cmd+V), skip text.
   - Insert `![filename](https://arweave.net/txid)`.
2. **Processing**:
   - Resize >1876×1251 (aspectfit), convert to WebP (quality 90).
   - Support JPG, JPEG, PNG, WebP, AVIF, single-frame GIF.
   - Skip videos, animated GIFs.
3. **Upload**:
   - Upload WebP to Arweave with `Content-Type: image/webp`.
4. **Key Management**:
   - Store Arweave key in SecretStorage (prompt first use).
   - Commands: Update (`md-ar-ext.updatePrivateKey`), Delete (`md-ar-ext.deletePrivateKey`).
5. **Feedback**:
   - Success: “Image resized, converted to WebP, uploaded to Arweave, and inserted!”
   - Errors: Invalid file, no clipboard image, upload failure.

### Non-Functional

- **Performance**: Process/upload <10s for <5MB images.
- **Compatibility**: VS Code 1.85+, Cursor.
- **Security**: Key encrypted via SecretStorage.
- **Dependencies**: ImageMagick CLI.

## Solution Design

- **Tech**: VS Code API (TypeScript), `arweave-js`, `imagemagick`.
- **Workflow**:
  1. Detect drag/paste in Markdown.
  2. Validate image (skip text/videos/GIFs).
  3. Resize/convert to WebP.
  4. Upload to Arweave (SecretStorage key).
  5. Insert link, clean temp files.
- **Commands**: `uploadAndInsert`, `pasteAndInsert`, key management.

## User Stories

1. **Blogger**: “I want to drag or paste images into Markdown, optimized and uploaded to Arweave, for a seamless blog.”
2. **Coworker**: “I want a secure, easy setup to use this extension.”

## Acceptance Criteria

- Drag/paste 2000×1500 JPG: Resizes, converts to WebP, uploads, inserts link.
- Paste text: Skips with “Text detected” message.
- No key: Prompts and stores securely.
- Video/GIF: Rejects with error.

## Deployment

- **Packaging**: `vsce package` → `md-ar-ext-0.0.1.vsix`.
- **Coworker Guide**:
  - Install ImageMagick.
  - Install `.vsix`.
  - Enter key on first use.

## Risks & Mitigations

- **No ImageMagick**: Prompt install.
- **Clipboard Limits**: Error message fallback.
- **Low AR Funds**: Suggest funding.

## Next Steps

- Test clipboard across platforms.
- Add balance check or custom options.
