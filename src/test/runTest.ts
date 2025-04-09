import * as path from 'path';
import * as fs from 'fs';

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests
} from '@vscode/test-electron';

/**
 * Main function to run the tests
 */
async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Check if VS Code executable path is provided through environment variable
    const customVSCodePath = process.env.VSCODE_EXECUTABLE_PATH;
    let vscodeExecutablePath: string | undefined;
    
    if (customVSCodePath && fs.existsSync(customVSCodePath)) {
      console.log(`Using custom VS Code executable: ${customVSCodePath}`);
      vscodeExecutablePath = customVSCodePath;
    } else {
      console.log('Downloading VS Code for testing (this may take a while)...');
      try {
        const versionToDownload = 'stable'; // Use latest stable version
        console.log(`Downloading VS Code ${versionToDownload}...`);
        // Let the library handle caching and path resolution
        const downloadedPath = await downloadAndUnzipVSCode(versionToDownload);
        console.log(`VS Code downloaded/found at (reported): ${downloadedPath}`);

        // --- Correction for potential path issue ---
        // Check if the path incorrectly includes 'Visual Studio Code.app'
        const incorrectAppSegment = '/Visual Studio Code.app/Contents/MacOS/Electron';
        const correctSegment = '/Contents/MacOS/Electron';
        if (downloadedPath.endsWith(incorrectAppSegment)) {
          // Construct the likely correct path by removing the '.app' directory part
          const baseDir = downloadedPath.substring(0, downloadedPath.length - incorrectAppSegment.length);
          const correctedPath = path.join(baseDir, correctSegment);
          
          // Verify if the corrected path actually exists
          if (fs.existsSync(correctedPath)) {
            console.log(`Corrected path found: ${correctedPath}`);
            vscodeExecutablePath = correctedPath;
          } else {
             // Fallback to the originally reported path if correction doesn't exist
             console.warn(`Corrected path ${correctedPath} not found, falling back to reported path.`);
             vscodeExecutablePath = downloadedPath;
          }
        } else {
           // Assume the reported path is correct if it doesn't end with the known incorrect segment
           vscodeExecutablePath = downloadedPath;
        }
        // --- End Correction ---

        console.log(`Using VS Code executable path: ${vscodeExecutablePath}`);
      } catch (err) {
        console.error('Error downloading or finding VS Code path:', err);
        throw err;
      }
    }
    
    // Verify that we have a valid executable path
    if (!vscodeExecutablePath) {
      throw new Error('Failed to get a valid VS Code executable path');
    }

    // Resolve CLI args using the determined executable path, but only keep the args
    const [, ...initialArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
    const launchArgs = [...initialArgs];

    // Add additional CLI options for better test output
    launchArgs.push('--verbose');
    launchArgs.push('--disable-workspace-trust');
    
    // If debugging, add the appropriate flags
    if (process.env.DEBUG_TESTS) {
      launchArgs.push('--disable-extensions');
      launchArgs.push('--disable-gpu');
      launchArgs.push('--no-sandbox');
    }

    console.log('Starting VS Code test runner...');
    console.log(`Extension path: ${extensionDevelopmentPath}`);
    console.log(`Test path: ${extensionTestsPath}`);
    
    // Make sure VS Code is not already running (warn the user)
    console.log('\n⚠️  IMPORTANT: Close all VS Code windows before running tests ⚠️\n');

    // Run the extension test
    const exitCode = await runTests({
      vscodeExecutablePath, // Pass the resolved executable path
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs, // Use the resolved args (without the incorrect executable) + custom ones
      // Add extra environment variables for testing
      extensionTestsEnv: {
        ...process.env,
        testMode: 'true'
      }
    });

    console.log(`Test run completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  } catch (err) {
    console.error('Failed to run tests:', err);
    if (err instanceof Error) {
      console.error(`Error message: ${err.message}`);
      console.error(`Stack trace: ${err.stack}`);
    }
    process.exit(1);
  }
}

main();
