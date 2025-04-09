import * as path from 'path';
import * as fs from 'fs';

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests
} from '@vscode/test-electron';

// Directory to cache downloaded VS Code instances
const VSCODE_CACHE_DIR = path.join(__dirname, '../..', '.vscode-test');

/**
 * Main function to run the tests
 */
async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(VSCODE_CACHE_DIR)) {
      fs.mkdirSync(VSCODE_CACHE_DIR, { recursive: true });
    }
    
    // Check if VS Code executable path is provided through environment variable
    const customVSCodePath = process.env.VSCODE_EXECUTABLE_PATH;
    let vscodeExecutablePath: string | undefined;
    
    if (customVSCodePath && fs.existsSync(customVSCodePath)) {
      console.log(`Using custom VS Code executable: ${customVSCodePath}`);
      vscodeExecutablePath = customVSCodePath;
    } else {
      console.log('Downloading VS Code for testing (this may take a while)...');
      try {
        // Force use cache rather than downloading every time
        const versionToDownload = '1.85.0'; // Match engine.vscode in package.json
        
        // Checking if the cache folder already has this version
        let hasCachedVersion = false;
        const vscodeCacheDir = path.join(VSCODE_CACHE_DIR, `vscode-${versionToDownload}`);
        
        if (fs.existsSync(vscodeCacheDir)) {
          // Check for the executable itself
          const possibleExecutables = [
            // macOS
            path.join(vscodeCacheDir, 'Visual Studio Code.app', 'Contents', 'MacOS', 'Electron'),
            // Windows
            path.join(vscodeCacheDir, 'Code.exe'),
            // Linux
            path.join(vscodeCacheDir, 'code')
          ];
          
          for (const execPath of possibleExecutables) {
            if (fs.existsSync(execPath)) {
              console.log(`Found cached VS Code at ${execPath}`);
              vscodeExecutablePath = execPath;
              hasCachedVersion = true;
              break;
            }
          }
        }
        
        if (!hasCachedVersion) {
          console.log(`No cached version found, downloading VS Code ${versionToDownload}...`);
          vscodeExecutablePath = await downloadAndUnzipVSCode(versionToDownload, VSCODE_CACHE_DIR);
          
          // Copy the executable to the cache for future use
          console.log(`VS Code downloaded to ${vscodeExecutablePath}`);
        }
      } catch (err) {
        console.error('Error downloading VS Code:', err);
        throw err;
      }
    }
    
    // Verify that we have a valid executable path
    if (!vscodeExecutablePath) {
      throw new Error('Failed to get a valid VS Code executable path');
    }
    
    const [, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    // Add additional CLI options for better test output
    args.push('--verbose');
    args.push('--disable-workspace-trust');
    
    // If debugging, add the appropriate flags
    if (process.env.DEBUG_TESTS) {
      args.push('--disable-extensions');
      args.push('--disable-gpu');
      args.push('--no-sandbox');
    }

    console.log('Starting VS Code test runner...');
    console.log(`Extension path: ${extensionDevelopmentPath}`);
    console.log(`Test path: ${extensionTestsPath}`);
    
    // Make sure VS Code is not already running (warn the user)
    console.log('\n⚠️  IMPORTANT: Close all VS Code windows before running tests ⚠️\n');

    // Run the extension test
    const exitCode = await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: args,
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