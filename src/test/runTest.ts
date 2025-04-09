import * as path from 'path';
import { runTests, downloadAndUnzipVSCode } from 'vscode-test';

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Determine VS Code version for testing
    const vscodeVersion = 'stable'; // Or specify a version like '1.80.0'

    console.log(`Downloading VS Code ${vscodeVersion} for testing (this may take a while)...`);
    // Download VS Code, unzip it and run the integration test
    // downloadAndUnzipVSCode returns the path to the VS Code executable
    // or the installation directory, depending on the platform.
    // runTests will use this path to launch VS Code.
    const vscodeExecutablePath = await downloadAndUnzipVSCode(vscodeVersion);
    console.log(`Using VS Code executable/installation path: ${vscodeExecutablePath}`);

    // Prepare launch arguments for VS Code
    const launchArgs: string[] = [
      // Add the workspace path if needed, otherwise VS Code opens empty
      // extensionDevelopmentPath, // Uncomment if you want to open the extension folder as workspace
      '--disable-extensions', // Disable other extensions
      '--verbose',
      '--disable-workspace-trust'
    ];

    // If debugging, add the appropriate flags (adjust as needed for vscode-test)
    if (process.env.DEBUG_TESTS) {
      // Debug flags might differ slightly or have different effects with vscode-test
      // Common flags:
      // launchArgs.push('--disable-gpu'); // May help on some systems
      // launchArgs.push('--no-sandbox'); // Often needed in CI environments
      console.log('Debug flags enabled (review if needed for vscode-test).');
    }

    console.log('Starting VS Code test runner...');
    console.log(`Extension path: ${extensionDevelopmentPath}`);
    console.log(`Test path: ${extensionTestsPath}`);
    console.log(`Launch args: ${launchArgs.join(' ')}`);

    // Make sure VS Code is not already running (warn the user)
    console.log('\n⚠️  IMPORTANT: Close all VS Code windows before running tests ⚠️\n');


    // Run the extension test
    const exitCode = await runTests({
      vscodeExecutablePath, // Path determined by downloadAndUnzipVSCode
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs,
      // Add extra environment variables for testing
      extensionTestsEnv: {
        ...process.env, // Pass existing environment variables
        testMode: 'true' // Custom flag for tests
      }
    });

    console.log(`Test run completed with exit code: ${exitCode}`);
    process.exit(exitCode); // Exit with the code from the test run

  } catch (err) {
    console.error('Failed to run tests:');
    if (err instanceof Error) {
      console.error(err.message);
      if (err.stack) {
        console.error(err.stack);
      }
    } else {
      console.error(err);
    }
    process.exit(1); // Exit with error code 1
  }
}

main();
