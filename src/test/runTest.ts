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

    // Check if a specific test file was specified
    const specificTest = process.argv[2];
    let specificTestPath: string | undefined;
    
    if (specificTest) {
      // Allow specifying just the name without extension or full path
      let testFile = specificTest;
      if (!testFile.endsWith('.test.js') && !testFile.endsWith('.test.ts')) {
        testFile = `${testFile}.test.js`;
      }
      
      specificTestPath = path.resolve(__dirname, './suite', testFile);
      console.log(`Running specific test: ${specificTestPath}`);
      
      // Verify the test file exists
      if (!fs.existsSync(specificTestPath.replace('.ts', '.js'))) {
        console.error(`Test file not found: ${specificTestPath}`);
        process.exit(1);
      }
    }

    // Download VS Code, unzip it and run the integration test
    console.log('Downloading VS Code for testing...');
    const vscodeExecutablePath = await downloadAndUnzipVSCode('1.85.0'); // Specify version
    const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    // Add additional CLI options for better test output
    args.push('--verbose');
    
    // If debugging, add the appropriate flags
    if (process.env.DEBUG_TESTS) {
      args.push('--disable-extensions');
      args.push('--disable-gpu');
      args.push('--no-sandbox');
    }

    console.log('Starting VS Code test runner...');
    console.log(`Extension path: ${extensionDevelopmentPath}`);
    console.log(`Test path: ${extensionTestsPath}`);
    
    // Pass specific test file to the test runner if specified
    if (specificTestPath) {
      process.env.SPECIFIC_TEST = specificTestPath;
    }

    // Run the extension test
    const exitCode = await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: args,
      // Add extra environment variables for testing
      extensionTestsEnv: {
        ...process.env,
        TEST_MODE: 'true'
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