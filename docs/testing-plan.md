# md-ar-ext v2: Testing Plan

This document outlines the testing approach for the md-ar-ext v2 release to ensure functionality, usability, and reliability.

## 1. Unit Testing

### Settings Manager Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Get default settings | Test retrieving default values when no customization exists | Returns values matching DEFAULT_SETTINGS |
| Update WebP quality | Set WebP quality to 75 | Quality value is 75 when retrieved |
| Update max dimensions | Set max width and height to custom values | Dimensions match set values |
| Enable/disable metadata tags | Toggle metadata tags setting | Setting reflects toggled state |
| Add/remove custom tags | Add and remove custom tags | Custom tags list updates accordingly |
| Show/hide upload progress | Toggle upload progress setting | Setting reflects toggled state |
| Enable/disable balance check | Toggle balance check setting | Setting reflects toggled state |

### Arweave Integration Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Wallet balance check | Check balance with valid wallet | Returns correct AR balance |
| Cost estimation | Estimate cost for various file sizes | Returns reasonable AR estimates |
| Transaction verification | Verify different transaction states | Correctly identifies transaction status |
| Metadata tag inclusion | Upload with custom tags | Tags are included in transaction |
| Wallet address derivation | Generate address from key | Correct wallet address is derived |
| Key validation | Validate various key formats | Correctly identifies valid/invalid keys |
| Upload cancellation | Cancel in-progress upload | Upload stops, temporary files are cleaned up |

### Image Processing Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Image resize | Test images exceeding max dimensions | Images are resized correctly |
| WebP conversion | Convert JPEG/PNG to WebP | Properly converts with specified quality |
| WebP quality impact | Test different quality settings | File size decreases with lower quality |
| Metadata preservation | Process image with metadata | Metadata is preserved as configured |
| ImageMagick detection | Test with and without ImageMagick | Correctly detects presence/absence |

## 2. Integration Testing

### End-to-End Upload Flow

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Complete upload workflow | Execute full upload process with all steps | Successfully uploads and returns URL |
| Upload with progress tracking | Upload with progress enabled | Shows detailed progress with time estimates |
| Upload with metadata tags | Upload with custom tags enabled | Tags appear in transaction data |
| Upload with insufficient balance | Attempt upload with low balance | Shows appropriate warning |
| Upload cancellation | Cancel during upload process | Gracefully cancels and cleans up |
| Upload with large file | Test upload with file exceeding max dimensions | File is properly resized before upload |

### Command Integration

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Register all commands | Verify all commands are available | Commands appear in command palette |
| Context menu actions | Test right-click menu actions | Context menu shows appropriate options |
| Keyboard shortcuts | Test defined keyboard shortcuts | Shortcuts trigger correct commands |
| Command sequence | Test typical command sequences | Commands work together correctly |

### UI Component Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Settings UI display | Open settings UI | Shows all configuration options |
| Quick settings flow | Use quick configure option | Guides through essential settings |
| Progress indicator | Test progress display | Shows progress with time estimates |
| Error messages | Trigger various error conditions | Shows user-friendly error messages |
| Statistics view | Open statistics view | Shows accurate upload history |

## 3. Error Handling Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Network failure | Simulate network interruption | Shows appropriate error and retry option |
| Invalid key | Use malformed Arweave key | Shows validation error with guidance |
| Missing ImageMagick | Test without ImageMagick installed | Shows installation instructions |
| File access errors | Test with inaccessible files | Shows permission error message |
| API rate limits | Simulate Arweave API limits | Implements backoff and retry logic |
| Out of memory | Test with extremely large images | Handles memory constraints gracefully |

## 4. Performance Testing

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Upload speed | Measure upload times for different file sizes | Performance within acceptable ranges |
| Memory usage | Monitor memory during large file processing | Memory usage remains reasonable |
| CPU utilization | Monitor CPU during image processing | CPU usage within acceptable limits |
| Startup time | Measure extension activation time | Quick activation without delays |
| VS Code responsiveness | Verify VS Code remains responsive | No UI freezing during operations |

## 5. Cross-Platform Testing

| Platform | Version | Tests to Perform |
|----------|---------|-----------------|
| Windows | 10, 11 | Full functionality test suite |
| macOS | Latest | Full functionality test suite |
| Linux | Ubuntu LTS | Full functionality test suite |

## 6. VS Code Version Testing

| VS Code Version | Tests to Perform |
|-----------------|-----------------|
| Minimum supported (1.60.0) | Basic functionality tests |
| Latest stable | Full test suite |
| Insiders | Compatibility checks |

## 7. Usability Testing

| Aspect | Test Approach | Success Criteria |
|--------|--------------|------------------|
| Command discoverability | New user test | Users can find commands without guidance |
| Settings clarity | Settings review | Users understand what each setting does |
| Error messages | Error scenario tests | Users understand how to resolve errors |
| Documentation | Documentation review | Documentation is clear and complete |
| Progress feedback | Upload observation | Users understand the progress state |

## 8. Security Testing

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Key storage | Verify key security | Keys are stored securely, not in plaintext |
| Key transmission | Monitor network during key use | Keys are not transmitted unnecessarily |
| Temp file handling | Check temp file cleanup | Temp files are properly removed |
| Error information | Review error output | Errors don't expose sensitive information |

## 9. Test Automation

### Automated Test Categories

1. **Unit tests for core modules**
   - Settings manager
   - Arweave uploader
   - Image processor
   - Progress indicator

2. **Mock-based integration tests**
   - Upload workflow with mocked Arweave
   - Settings UI with mocked VS Code API

3. **End-to-end tests with VS Code Extension Tester**
   - Command execution
   - UI interaction
   - Settings changes

### Test Execution Plan

1. **Continuous Integration**
   - Run unit tests on every PR
   - Run integration tests on merge to main branch
   - Run cross-platform tests weekly

2. **Pre-release Testing**
   - Complete manual test suite
   - Verify all user scenarios
   - Cross-platform verification

## 10. Test Environment Setup

### Requirements

- VS Code installation on all test platforms
- Arweave wallet with test AR
- ImageMagick installed
- Test image files of various formats and sizes
- Network conditions simulator for throttling tests

### Test Data

- Set of test images in various formats (JPEG, PNG, GIF, BMP)
- Range of image sizes (small, medium, large)
- Images with and without metadata
- Valid and invalid Arweave key examples

## 11. Test Schedule

| Phase | Focus | Timeline |
|-------|-------|----------|
| Alpha | Core functionality | Week 1 |
| Beta | All features with mocks | Week 2 |
| RC | End-to-end with real services | Week 3 |
| Final | Cross-platform verification | Week 4 |

## 12. Bug Reporting and Tracking

- Use GitHub Issues for bug tracking
- Include full reproduction steps
- Categorize by severity:
  - Critical: Blocking functionality
  - Major: Significant impact but workaround exists
  - Minor: Low impact on functionality
  - Cosmetic: UI or documentation issues

## 13. Test Deliverables

- Test cases documentation
- Test execution reports
- Bug reports
- Performance metrics
- User feedback summary 