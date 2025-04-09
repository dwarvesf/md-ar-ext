#!/usr/bin/env node

/**
 * Automated release script for Markdown Arweave Uploader
 * 
 * This script:
 * 1. Validates the environment (ensures clean git status)
 * 2. Bumps version in package.json (patch, minor, or major)
 * 3. Updates the CHANGELOG.md (if it exists)
 * 4. Builds and packages the extension with proper naming
 * 5. Creates a git tag and commit
 * 6. Provides instructions for publishing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env file if it exists (for local development)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env file');
  require('dotenv').config({ path: envPath });
}

// Configuration
const EXTENSION_NAME = 'Markdown-Arweave-Uploader';

// Helpers
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    console.error(`Error executing command: ${cmd}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

function isGitClean() {
  try {
    const status = run('git status --porcelain');
    return status.length === 0;
  } catch (error) {
    console.error('Error checking git status:', error);
    return false;
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function getChangelog(version) {
  // Get commit messages since last tag
  try {
    const lastTag = run('git describe --tags --abbrev=0');
    const logs = run(`git log ${lastTag}..HEAD --pretty=format:"- %s"`);
    return logs || '- No significant changes';
  } catch (error) {
    // No previous tags or other error
    const logs = run(`git log --pretty=format:"- %s" -n 10`);
    return logs || '- Initial release';
  }
}

function updateChangelog(version, changes) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];
  const newEntry = `## [${version}] - ${date}\n\n${changes}\n\n`;
  
  let content = '';
  if (fs.existsSync(changelogPath)) {
    content = fs.readFileSync(changelogPath, 'utf8');
    // Find the position after the title
    const titleEndPos = content.indexOf('\n\n');
    if (titleEndPos !== -1) {
      content = content.slice(0, titleEndPos + 2) + newEntry + content.slice(titleEndPos + 2);
    } else {
      content = content + '\n\n' + newEntry;
    }
  } else {
    content = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newEntry}`;
  }
  
  fs.writeFileSync(changelogPath, content);
  console.log(`Updated CHANGELOG.md with ${version} changes`);
}

function renameVsixPackage(version) {
  const vsixFile = `md-ar-ext-${version}.vsix`;
  const newName = `${EXTENSION_NAME}-${version}.vsix`;
  
  if (fs.existsSync(vsixFile)) {
    fs.renameSync(vsixFile, newName);
    console.log(`Renamed VSIX package to ${newName}`);
    return newName;
  } else {
    console.error(`VSIX package not found: ${vsixFile}`);
    return null;
  }
}

// Main process
(async function main() {
  // 0. Check arguments
  const args = process.argv.slice(2);
  let versionBump = args[0] || 'patch';
  if (!['patch', 'minor', 'major'].includes(versionBump)) {
    console.error('Invalid version bump. Use: patch, minor, or major');
    process.exit(1);
  }
  
  // 1. Validate environment
  if (!isGitClean()) {
    console.error('Git working directory is not clean. Commit or stash changes before releasing.');
    process.exit(1);
  }
  
  console.log(`Starting release process with ${versionBump} version bump...`);
  
  // 2. Bump version
  console.log(`Bumping ${versionBump} version...`);
  run(`npm run version:${versionBump}`);
  const newVersion = getCurrentVersion();
  console.log(`New version: ${newVersion}`);
  
  // 3. Update changelog
  const changes = getChangelog(newVersion);
  updateChangelog(newVersion, changes);
  
  // 4. Build and package
  console.log('Building and packaging extension...');
  run('npm run release:prepare');
  
  // 5. Rename the VSIX package
  const packageName = renameVsixPackage(newVersion);
  
  // 6. Create git commit and tag
  console.log('Creating git commit and tag...');
  run('git add package.json package-lock.json CHANGELOG.md');
  run(`git commit -m "chore: release v${newVersion}"`);
  run(`git tag v${newVersion}`);
  
  // 7. Output success message
  console.log('\n✅ Release preparation completed successfully!');
  console.log(`\nRelease package: ${packageName}`);
  console.log('\nNext steps:');
  console.log('1. Review the changes and CHANGELOG.md');
  console.log('2. Push the commit and tag: git push && git push --tags');
  console.log(`3. Publish to VS Code Marketplace: vsce publish --packagePath ${packageName}`);
  console.log('\nHappy releasing! 🚀');
})(); 