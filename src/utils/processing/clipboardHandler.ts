import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Gets image data from the clipboard using platform-specific methods
 * @returns Promise<Buffer | null> The image data as a buffer, or null if no image is found
 */
export async function getImageFromClipboard(): Promise<Buffer | null> {
  try {
    switch (process.platform) {
      case 'darwin':
        return await getMacOSClipboardImage();
      case 'win32':
        return await getWindowsClipboardImage();
      case 'linux':
        return await getLinuxClipboardImage();
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  } catch (error) {
    console.error('Failed to get image from clipboard:', error);
    return null;
  }
}

/**
 * Gets image data from clipboard on macOS using AppleScript
 */
async function getMacOSClipboardImage(): Promise<Buffer | null> {
  const tempFile = path.join(os.tmpdir(), `clipboard-${Date.now()}.png`);

  try {
    // AppleScript to check if clipboard contains image
    const hasImageCmd = 'osascript -e \'clipboard info\' | grep "«class PNGf»"';
    try {
      childProcess.execSync(hasImageCmd);
    } catch (error) {
      // If grep fails, there's no image in clipboard
      return null;
    }

    // Get image data from clipboard
    const script = `osascript -e 'try
            write (the clipboard as «class PNGf») to (open for access "${tempFile}" with write permission)
            close access "${tempFile}"
        end try'`;

    childProcess.execSync(script);

    if (fs.existsSync(tempFile)) {
      const buffer = fs.readFileSync(tempFile);
      fs.unlinkSync(tempFile);
      return buffer;
    }
  } catch (error) {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }

  return null;
}

/**
 * Gets image data from clipboard on Windows using PowerShell
 */
async function getWindowsClipboardImage(): Promise<Buffer | null> {
  const tempFile = path.join(os.tmpdir(), `clipboard-${Date.now()}.png`);

  try {
    // PowerShell script to save clipboard image
    const script = `
        Add-Type -AssemblyName System.Windows.Forms
        if ([Windows.Forms.Clipboard]::ContainsImage()) {
            $img = [Windows.Forms.Clipboard]::GetImage()
            $img.Save('${tempFile}', [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            exit 0
        }
        exit 1
        `;

    const psScript = path.join(os.tmpdir(), `clipboard-${Date.now()}.ps1`);
    fs.writeFileSync(psScript, script);

    try {
      childProcess.execSync(
        `powershell -ExecutionPolicy Bypass -File "${psScript}"`
      );
      if (fs.existsSync(tempFile)) {
        const buffer = fs.readFileSync(tempFile);
        return buffer;
      }
    } finally {
      if (fs.existsSync(psScript)) {
        fs.unlinkSync(psScript);
      }
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    console.error('Failed to get image from Windows clipboard:', error);
  }

  return null;
}

/**
 * Gets image data from clipboard on Linux using xclip
 */
async function getLinuxClipboardImage(): Promise<Buffer | null> {
  try {
    // Check if xclip is installed
    try {
      childProcess.execSync('which xclip');
    } catch (error) {
      throw new Error(
        'xclip is not installed. Please install it using your package manager (e.g., sudo apt-get install xclip)'
      );
    }

    // Check if clipboard has image data
    const hasImage = childProcess
      .execSync('xclip -selection clipboard -t TARGETS')
      .toString();
    if (!hasImage.includes('image/png')) {
      return null;
    }

    // Get image data
    const imageData = childProcess.execSync(
      'xclip -selection clipboard -t image/png -o'
    );
    return Buffer.from(imageData);
  } catch (error) {
    console.error('Failed to get image from Linux clipboard:', error);
    return null;
  }
}
