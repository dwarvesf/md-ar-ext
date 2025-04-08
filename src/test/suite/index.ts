import * as path from 'path';
import Mocha from 'mocha';
import * as globModule from 'glob';
const glob = globModule.sync;

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 60000
  });

  const testsRoot = path.resolve(__dirname, '.');

  return new Promise<void>((resolve, reject) => {
    const testFiles = glob('**/**.test.js', { cwd: testsRoot });
    
    // Add files to the test suite
    testFiles.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    try {
      // Run the mocha test
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
} 