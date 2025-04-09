#!/usr/bin/env node

/**
 * Local publishing script for Markdown Arweave Uploader
 * This script helps with local publishing by handling the VSCE_PAT token
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Try to load .env file
const envPath = path.join(process.cwd(), '.env');
let token = process.env.VSCE_PAT;

if (!token && fs.existsSync(envPath)) {
  console.log('Loading VSCE_PAT from .env file');
  require('dotenv').config({ path: envPath });
  token = process.env.VSCE_PAT;
}

// Helper function to execute commands
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    console.error(`Error executing command: ${cmd}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

// Get version from package.json
function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

// Find the VSIX file
function findVsixFile() {
  const version = getCurrentVersion();
  const standardName = `md-ar-ext-${version}.vsix`;
  const renamedFormat = `Markdown-Arweave-Uploader-${version}.vsix`;
  
  if (fs.existsSync(renamedFormat)) {
    return renamedFormat;
  } else if (fs.existsSync(standardName)) {
    return standardName;
  }
  
  // Look for any VSIX file if specific ones not found
  const files = fs.readdirSync('.');
  const vsixFiles = files.filter(file => file.endsWith('.vsix'));
  
  if (vsixFiles.length > 0) {
    console.log(`Found VSIX file: ${vsixFiles[0]}`);
    return vsixFiles[0];
  }
  
  return null;
}

// Interactive prompt for token if not found
function promptForToken() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter your VS Code Marketplace Personal Access Token (VSCE_PAT): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main function
async function main() {
  // 1. Check if VSCE_PAT exists
  if (!token) {
    console.log('VSCE_PAT environment variable not found.');
    console.log('You need a Personal Access Token from Azure DevOps to publish to the VS Code Marketplace.');
    console.log('Get it from: https://dev.azure.com/ -> Personal Access Tokens -> New Token');
    console.log('Ensure it has "Marketplace > Manage" permissions.\n');
    
    // Prompt for token
    token = await promptForToken();
    
    if (!token) {
      console.error('No token provided. Cannot publish without a token.');
      process.exit(1);
    }
    
    // Ask if they want to save to .env
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const saveToEnv = await new Promise((resolve) => {
      rl.question('Do you want to save this token to .env file for future use? (y/n): ', (answer) => {
        rl.close();
        return resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (saveToEnv) {
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        // Remove any existing VSCE_PAT line
        envContent = envContent.replace(/^VSCE_PAT=.*$/m, '');
        // Ensure the file ends with a newline
        if (!envContent.endsWith('\n')) {
          envContent += '\n';
        }
      }
      fs.writeFileSync(envPath, `${envContent}VSCE_PAT=${token}\n`);
      console.log('.env file updated with your token');
      
      // Add to .gitignore if not already there
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignore.split('\n').some(line => line.trim() === '.env')) {
          fs.writeFileSync(gitignorePath, gitignore + '\n.env\n');
          console.log('Added .env to .gitignore');
        }
      } else {
        fs.writeFileSync(gitignorePath, '.env\n');
        console.log('Created .gitignore with .env entry');
      }
    }
  }
  
  // 2. Find the VSIX package
  const packagePath = findVsixFile();
  if (!packagePath) {
    console.error('No VSIX package found. Run npm run package first.');
    process.exit(1);
  }
  
  // 3. Publish to VS Code Marketplace
  console.log(`Publishing ${packagePath} to VS Code Marketplace...`);
  try {
    const publishCommand = `npx vsce publish --packagePath ${packagePath}`;
    run(publishCommand, { env: { ...process.env, VSCE_PAT: token } });
    console.log('\n✅ Extension published successfully!');
  } catch (error) {
    console.error('Failed to publish extension:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 