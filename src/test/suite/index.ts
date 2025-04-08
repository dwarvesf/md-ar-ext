import * as path from 'path';
import Mocha from 'mocha';
import * as glob from 'glob';
import * as fs from 'fs';

// Add type declarations for global test environment
declare global {
  namespace NodeJS {
    interface Global {
      testMode: boolean;
      testTimeouts: {
        network: number;
        filesystem: number;
        animation: number;
      };
    }
  }
}

/**
 * Setup and run Mocha tests
 * @returns Promise resolving when tests complete
 */
export async function run(): Promise<void> {
  // Create the Mocha test suite with better configuration
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 20000, // Longer timeout for VS Code startup and network operations
    reporter: 'spec', // More detailed test output
    slow: 5000, // Mark tests as slow if they take more than 5 seconds
    retries: 1 // Retry failed tests once
  });

  // Get the test directory
  const testsRoot = path.resolve(__dirname);
  console.log(`Test root directory: ${testsRoot}`);

  try {
    let testFiles: string[] = [];
    
    // Check if a specific test file was specified through environment variable
    const specificTest = process.env.SPECIFIC_TEST;
    if (specificTest) {
      // Convert to relative path if needed
      const relativePath = path.isAbsolute(specificTest) 
        ? path.relative(testsRoot, specificTest)
        : specificTest;
      
      console.log(`Running specific test: ${relativePath}`);
      
      // Add specific test file if it exists
      const fullPath = path.resolve(testsRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        testFiles = [relativePath];
      } else {
        console.warn(`⚠️ Specified test file not found: ${fullPath}`);
        // Try with .js extension if we were given a filename without extension
        const jsPath = fullPath.endsWith('.js') ? fullPath : `${fullPath}.js`;
        if (fs.existsSync(jsPath)) {
          testFiles = [path.relative(testsRoot, jsPath)];
        } else {
          throw new Error(`Test file not found: ${fullPath}`);
        }
      }
    } else {
      // Find all test files if no specific test specified
      console.log(`Finding test files in: ${testsRoot}`);
      testFiles = await glob.glob('**/*.test.js', { cwd: testsRoot });
      console.log(`Found ${testFiles.length} test files`);
    }
    
    if (testFiles.length === 0) {
      console.warn('⚠️ No test files found!');
      // List directory contents for debugging
      const dirContents = fs.readdirSync(testsRoot);
      console.log(`Directory contents of ${testsRoot}:`, dirContents);
      return; // Exit without error to let the test runner know we found nothing
    }
    
    // Sort test files to ensure consistent execution order
    testFiles.sort();

    // Add files to the test suite with better logging
    testFiles.forEach(f => {
      const fullPath = path.resolve(testsRoot, f);
      console.log(`Adding test file: ${fullPath}`);
      
      if (fs.existsSync(fullPath)) {
        mocha.addFile(fullPath);
      } else {
        console.warn(`⚠️ Test file not found: ${fullPath}`);
      }
    });

    // Setup for global test hooks
    setupTestEnvironment();

    // Run the tests
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('Starting test execution...');
        
        // Run the mocha test
        mocha.run((failures: number) => {
          if (failures > 0) {
            console.error(`❌ ${failures} tests failed.`);
            reject(new Error(`${failures} tests failed.`));
          } else {
            console.log('✅ All tests passed!');
            resolve();
          }
        });
      } catch (err) {
        console.error('Error running tests:', err);
        reject(err);
      }
    });
  } catch (err) {
    console.error('Error setting up tests:', err);
    throw err;
  }
}

/**
 * Setup global test environment
 */
function setupTestEnvironment(): void {
  // Set global test mode flag
  (global as any).testMode = true;
  
  // Increase timeout for specific operations during tests
  if (!(global as any).testTimeouts) {
    (global as any).testTimeouts = {
      network: 10000,
      filesystem: 5000,
      animation: 2000
    };
  }
  
  // Setup test cleanup to run after all tests
  process.on('exit', () => {
    console.log('Cleaning up test environment...');
    // Additional cleanup can go here
  });
} 