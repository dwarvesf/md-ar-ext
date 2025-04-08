import * as fs from 'fs';
import * as path from 'path';
import * as im from 'imagemagick';
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as os from 'os';
import * as settingsManager from '../storage/settingsManager';
import * as crypto from 'crypto';

// Export interfaces for use in other modules
export interface ImageProcessOptions {
  webpQuality: number;
  maxWidth: number;
  maxHeight: number;
  preserveOriginal: boolean;
}

export interface ImageProcessResult {
  processedFilePath: string;
  originalFilePath: string;
  originalSize: number;
  processedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
  format: string;
}

// Custom type for animated GIF detection
interface GifFeatures {
  length?: number;
  [key: string]: any;
}

/**
 * Check if ImageMagick is installed, get version, and verify requirements
 * @returns Promise resolving to object with install status, version and requirements check
 */
export async function checkImageMagickDetails(): Promise<{
  installed: boolean;
  version: string | null;
  meetRequirements: boolean;
}> {
  return new Promise<{
    installed: boolean;
    version: string | null;
    meetRequirements: boolean;
  }>((resolve) => {
    // First try the 'magick' command (newer versions)
    child_process.exec('magick -version', (error, stdout) => {
      if (error) {
        // Then try the 'convert' command (older versions)
        child_process.exec('convert -version', (error2, stdout2) => {
          if (error2) {
            // ImageMagick not installed
            resolve({
              installed: false,
              version: null,
              meetRequirements: false
            });
          } else {
            // Parse version from output
            const versionMatch = stdout2.match(/Version: ImageMagick (\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : null;
            const versionNumber = version ? parseFloat(version) : 0;
            
            resolve({
              installed: true,
              version,
              meetRequirements: versionNumber >= 7.0
            });
          }
        });
      } else {
        // Parse version from output
        const versionMatch = stdout.match(/Version: ImageMagick (\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : null;
        const versionNumber = version ? parseFloat(version) : 0;
        
        resolve({
          installed: true,
          version,
          meetRequirements: versionNumber >= 7.0
        });
      }
    });
  });
}

/**
 * Check if ImageMagick is installed and available
 * @returns Promise resolving to boolean indicating if ImageMagick is available
 */
export async function checkImageMagickInstalled(): Promise<boolean> {
  const details = await checkImageMagickDetails();
  return details.installed;
}

/**
 * Show installation instructions for ImageMagick based on platform
 */
export async function showImageMagickInstallInstructions(): Promise<void> {
  const platform = process.platform;
  
  let instructions = '';
  let installCommand = '';
  
  if (platform === 'darwin') {
    instructions = 'Install ImageMagick on macOS using Homebrew or MacPorts';
    installCommand = 'brew install imagemagick   # or   port install imagemagick';
  } else if (platform === 'linux') {
    instructions = 'Install ImageMagick on Linux using your package manager';
    installCommand = 'sudo apt install imagemagick   # Debian/Ubuntu\nsudo yum install imagemagick   # RHEL/CentOS';
  } else if (platform === 'win32') {
    instructions = 'Install ImageMagick on Windows using Chocolatey or the installer';
    installCommand = 'choco install imagemagick   # or download from website';
  } else {
    instructions = 'Download ImageMagick from the official website';
    installCommand = 'Visit https://imagemagick.org/script/download.php';
  }
  
  // Create an information document
  const content = `# ImageMagick Installation Instructions

ImageMagick is required by md-ar-ext for image processing.

## ${instructions}

\`\`\`
${installCommand}
\`\`\`

## Download Links

- Official Website: https://imagemagick.org/script/download.php
- Documentation: https://imagemagick.org/script/command-line-processing.php

After installing, restart VS Code for the extension to detect it.
`;
  
  // Open the instructions in a new document
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: 'markdown'
  });
  
  await vscode.window.showTextDocument(doc);
  
  // Also show action to open the website
  const result = await vscode.window.showInformationMessage(
    'ImageMagick is required for image processing',
    'Visit Download Page'
  );
  
  if (result === 'Visit Download Page') {
    await vscode.env.openExternal(vscode.Uri.parse('https://imagemagick.org/script/download.php'));
  }
}

/**
 * Get image dimensions and format
 * @param filePath Path to the image file
 * @returns Promise resolving to the image dimensions and format
 */
export async function getImageInfo(
  filePath: string
): Promise<{width: number; height: number; format: string}> {
  return new Promise((resolve, reject) => {
    im.identify(['-format', '%w %h %m', filePath], (err, output) => {
      if (err) {
        reject(err);
        return;
      }
      
      const [width, height, format] = output.trim().split(' ');
      resolve({
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        format
      });
    });
  });
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
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @returns Promise that resolves when resizing is complete
 */
export function resizeImage(
  filePath: string, 
  tempPath: string,
  maxWidth: number,
  maxHeight: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Use a type assertion to work around the missing property in the type definition
    const options: any = {
      srcPath: filePath,
      dstPath: tempPath,
      width: maxWidth,
      height: maxHeight,
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
 * @param quality WebP quality (1-100)
 * @returns Promise that resolves when conversion is complete
 */
export function convertToWebP(
  srcPath: string, 
  webpPath: string,
  quality: number
): Promise<void> {
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
 * @param options Processing options
 * @param progress Optional progress reporter
 * @returns Promise resolving to the processing result
 */
export async function processImage(
  filePath: string,
  options?: ImageProcessOptions,
  progress?: vscode.Progress<{message?: string; increment?: number}>
): Promise<ImageProcessResult> {
  // Verify ImageMagick is installed before proceeding
  const imageMagickInstalled = await checkImageMagickInstalled();
  if (!imageMagickInstalled) {
    await showImageMagickInstallInstructions();
    throw new Error('ImageMagick is required but not installed');
  }

  // Use provided options or defaults
  const processingOptions: ImageProcessOptions = options || {
    webpQuality: settingsManager.getWebpQuality(),
    maxWidth: settingsManager.getMaxDimensions().width,
    maxHeight: settingsManager.getMaxDimensions().height,
    preserveOriginal: true
  };

  const extension = path.extname(filePath).toLowerCase().slice(1);
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Create temp directory for processed files
  const tempDir = path.join(os.tmpdir(), 'md-ar-ext');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Paths for processed files
  const tempFileName = `${fileName}-${Date.now()}`;
  const resizedPath = path.join(tempDir, `${tempFileName}.resized`);
  const webpPath = path.join(tempDir, `${tempFileName}.webp`);

  // Get original file size
  const originalFileStats = fs.statSync(filePath);
  const originalSize = originalFileStats.size;

  if (progress) {
    progress.report({ message: 'Analyzing image...', increment: 10 });
  }

  try {
    // Get image features
    const features = await identifyImage(filePath);
    const width = features.width || 0;
    const height = features.height || 0;
    
    // Skip processing if image is already optimized
    if (
      extension === 'webp' && 
      width <= processingOptions.maxWidth && 
      height <= processingOptions.maxHeight
    ) {
      if (progress) {
        progress.report({ message: 'Image already optimized (WebP format, correct dimensions)', increment: 90 });
      }
      
      return {
        processedFilePath: filePath,
        originalFilePath: filePath,
        originalSize,
        processedSize: originalSize,
        reductionPercentage: 0,
        width,
        height,
        format: 'WEBP'
      };
    }

    let currentPath = filePath;
    const needsResize = width > processingOptions.maxWidth || height > processingOptions.maxHeight;
    
    // Resize if necessary
    if (needsResize) {
      if (progress) {
        progress.report({ 
          message: `Resizing image from ${width}x${height} to fit within ${processingOptions.maxWidth}x${processingOptions.maxHeight}...`, 
          increment: 20 
        });
      }
      
      await resizeImage(
        currentPath, 
        resizedPath, 
        processingOptions.maxWidth, 
        processingOptions.maxHeight
      );
      
      currentPath = resizedPath;
    } else if (progress) {
      progress.report({ message: 'Image dimensions already optimal, skipping resize', increment: 20 });
    }

    // Convert to WebP
    if (progress) {
      progress.report({ message: 'Converting to WebP format...', increment: 30 });
    }
    
    await convertToWebP(currentPath, webpPath, processingOptions.webpQuality);

    // Get processed file size and calculate reduction
    const processedFileStats = fs.statSync(webpPath);
    const processedSize = processedFileStats.size;
    const reductionPercentage = ((originalSize - processedSize) / originalSize) * 100;

    if (progress) {
      progress.report({ 
        message: `Image processing complete (${reductionPercentage.toFixed(1)}% size reduction)`, 
        increment: 30 
      });
    }

    // Get final dimensions
    const finalInfo = await getImageInfo(webpPath);

    // Clean up intermediary file if we created one
    if (needsResize && fs.existsSync(resizedPath)) {
      fs.unlinkSync(resizedPath);
    }

    return {
      processedFilePath: webpPath,
      originalFilePath: filePath,
      originalSize,
      processedSize,
      reductionPercentage,
      width: finalInfo.width,
      height: finalInfo.height,
      format: 'WEBP'
    };
  } catch (error) {
    // Clean up any temporary files if error occurs
    if (fs.existsSync(resizedPath)) {
      fs.unlinkSync(resizedPath);
    }
    if (fs.existsSync(webpPath)) {
      fs.unlinkSync(webpPath);
    }
    
    throw error;
  }
} 