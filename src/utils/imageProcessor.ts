import * as fs from 'fs';
import * as path from 'path';
import * as im from 'imagemagick';
import * as settingsManager from './settingsManager';
import * as vscode from 'vscode';
import * as child_process from 'child_process';

// Custom type for animated GIF detection
interface GifFeatures {
  length?: number;
  [key: string]: any;
}

/**
 * Check if ImageMagick is installed and available
 * @returns Promise resolving to boolean indicating if ImageMagick is available
 */
export async function checkImageMagickInstalled(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    child_process.exec('magick -version', (error) => {
      if (error) {
        // Try alternative command for older ImageMagick installations
        child_process.exec('convert -version', (error2) => {
          resolve(!error2);
        });
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Show installation instructions for ImageMagick based on platform
 */
export async function showImageMagickInstallInstructions(): Promise<void> {
  const platform = process.platform;
  
  const installCommands: Record<string, string> = {
    'darwin': 'brew install imagemagick',
    'linux': 'sudo apt-get install imagemagick',
    'win32': 'choco install imagemagick or download from https://imagemagick.org'
  };
  
  const command = installCommands[platform] || 'Visit https://imagemagick.org to download';
  
  const message = `ImageMagick is required but not installed. Install with: ${command}`;
  
  const result = await vscode.window.showErrorMessage(message, 'More Info');
  
  if (result === 'More Info') {
    await vscode.env.openExternal(vscode.Uri.parse('https://imagemagick.org/script/download.php'));
  }
}

/**
 * Validates if a file is a supported image type
 * @param filePath Path to the image file
 * @returns A promise that resolves to a boolean indicating if the file is a valid image
 */
export async function isImageFile(filePath: string): Promise<boolean> {
  // First check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const extension = path.extname(filePath).toLowerCase().slice(1);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v'];

  if (videoExtensions.includes(extension)) return false;
  if (!imageExtensions.includes(extension)) return false;

  if (extension === 'gif') {
    return new Promise<boolean>((resolve) => {
      im.identify(filePath, (err, features: GifFeatures) => {
        // Check if it's an animated GIF (features will be an array for animated GIFs)
        if (err || (features && Array.isArray(features) && features.length > 1)) {
          console.log(`Skipping animated GIF: ${path.basename(filePath)}`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  return true;
}

/**
 * Identifies image properties using ImageMagick
 * @param filePath Path to image file
 * @returns Promise resolving to image metadata
 */
export function identifyImage(filePath: string): Promise<im.Features> {
  return new Promise((resolve, reject) => {
    im.identify(filePath, (err, features) => {
      if (err) {
        console.error(`Error identifying image: ${err.message}`);
        reject(err);
      } else {
        resolve(features);
      }
    });
  });
}

/**
 * Resizes an image if it exceeds target dimensions
 * @param filePath Source image path
 * @param tempPath Destination path for resized image
 * @returns Promise that resolves when resizing is complete
 */
export function resizeImage(filePath: string, tempPath: string): Promise<void> {
  const dimensions = settingsManager.getMaxDimensions();
  
  return new Promise<void>((resolve, reject) => {
    // Use a type assertion to work around the missing property in the type definition
    const options: any = {
      srcPath: filePath,
      dstPath: tempPath,
      width: dimensions.width,
      height: dimensions.height,
      resizeStyle: 'aspectfit'
    };
    
    im.resize(options, (err) => {
      if (err) {
        console.error(`Error resizing image: ${err.message}`);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Converts an image to WebP format
 * @param srcPath Source image path
 * @param webpPath Destination WebP path
 * @returns Promise that resolves when conversion is complete
 */
export function convertToWebP(srcPath: string, webpPath: string): Promise<void> {
  const quality = settingsManager.getWebpQuality();
  
  return new Promise<void>((resolve, reject) => {
    im.convert([srcPath, '-quality', quality.toString(), webpPath], (err) => {
      if (err) {
        console.error(`Error converting to WebP: ${err.message}`);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Process image (resize and convert to WebP)
 * @param filePath Path to the image file
 * @returns Promise resolving to the processed file path
 */
export async function processImage(filePath: string): Promise<string> {
  // Verify ImageMagick is installed before proceeding
  const imageMagickInstalled = await checkImageMagickInstalled();
  if (!imageMagickInstalled) {
    await showImageMagickInstallInstructions();
    throw new Error('ImageMagick is required but not installed');
  }

  const extension = path.extname(filePath).toLowerCase().slice(1);
  const fileName = path.basename(filePath, path.extname(filePath));
  const dirPath = path.dirname(filePath);
  const webpPath = `${dirPath}/${fileName}.webp`;

  try {
    const features = await identifyImage(filePath);
    const width = features.width || 0;
    const height = features.height || 0;
    
    const dimensions = settingsManager.getMaxDimensions();

    // Skip processing if the image is already a WebP with suitable dimensions
    if (extension === 'webp' && width <= dimensions.width && height <= dimensions.height) {
      console.log(`No processing needed for ${path.basename(filePath)}`);
      return filePath;
    }

    let tempPath = filePath;
    
    // Resize if necessary
    if (width > dimensions.width || height > dimensions.height) {
      console.log(`Resizing ${path.basename(filePath)} from ${width}x${height}`);
      tempPath = `${filePath}.resized`;
      await resizeImage(filePath, tempPath);
    }

    // Convert to WebP
    console.log(`Converting ${path.basename(filePath)} to WebP`);
    await convertToWebP(tempPath, webpPath);

    // Clean up temporary file
    if (tempPath !== filePath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    return webpPath;
  } catch (error) {
    // Clean up any temporary files if there was an error
    if (fs.existsSync(webpPath)) {
      try { fs.unlinkSync(webpPath); } catch (e) { /* ignore cleanup errors */ }
    }
    
    throw error; // Re-throw to be handled by the caller
  }
} 