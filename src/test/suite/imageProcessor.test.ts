import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { isImageFile, processImage } from '../../utils/imageProcessor';

suite('ImageProcessor Test Suite', () => {
  test('isImageFile should recognize valid image extensions', async () => {
    // Create temporary files for testing
    const tempDir = os.tmpdir();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    
    for (const ext of validExtensions) {
      const tempFilePath = path.join(tempDir, `test-image.${ext}`);
      fs.writeFileSync(tempFilePath, 'dummy content');
      
      try {
        const result = await isImageFile(tempFilePath);
        assert.strictEqual(result, true, `Should recognize ${ext} as valid`);
      } finally {
        // Clean up
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }
  });

  test('isImageFile should reject video extensions', async () => {
    // Create temporary files for testing
    const tempDir = os.tmpdir();
    const invalidExtensions = ['mp4', 'mov', 'avi'];
    
    for (const ext of invalidExtensions) {
      const tempFilePath = path.join(tempDir, `test-video.${ext}`);
      fs.writeFileSync(tempFilePath, 'dummy content');
      
      try {
        const result = await isImageFile(tempFilePath);
        assert.strictEqual(result, false, `Should reject ${ext} as invalid`);
      } finally {
        // Clean up
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }
  });
}); 