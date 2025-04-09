#!/usr/bin/env node

/**
 * First-time setup script for Markdown Arweave Uploader
 * 
 * This script:
 * 1. Checks system dependencies (ImageMagick)
 * 2. Ensures npm dependencies are installed
 * 3. Sets up environment variables
 * 4. Verifies development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bright: '\x1b[1m'
};

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const ENV_SETUP_SCRIPT = path.join(__dirname, 'env', 'setup-env.js');

// Helper to run commands and handle errors
function runCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      return false;
    }
    console.error(`${colors.red}Error executing command: ${command}${colors.reset}`);
    console.error(error.stderr || error.message);
    if (options.exit !== false) {
      process.exit(1);
    }
    return false;
  }
}

// Helper for prompts
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Check if a command exists
function commandExists(command) {
  try {
    const nullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null';
    execSync(`${command} --version > ${nullDevice} 2>&1`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if running on Windows
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Welcome message
async function showWelcome() {
  console.log(`
${colors.bright}${colors.magenta}===============================================${colors.reset}
${colors.bright}${colors.magenta}  Markdown Arweave Uploader - First Time Setup  ${colors.reset}
${colors.bright}${colors.magenta}===============================================${colors.reset}

This script will help you set up your development environment.
It will:
  - Check for required dependencies
  - Install npm packages
  - Set up your environment variables
  - Prepare your development environment

`);

  const answer = await prompt(`${colors.yellow}Press Enter to continue or Ctrl+C to exit${colors.reset}: `);
  console.log('');
}

// Check for system dependencies
async function checkSystemDependencies() {
  console.log(`${colors.blue}Checking system dependencies...${colors.reset}`);
  
  // Check for Node.js
  console.log(`${colors.dim}Checking Node.js...${colors.reset}`);
  if (commandExists('node')) {
    const version = runCommand('node --version', { silent: true }).trim();
    console.log(`${colors.green}✓ Node.js is installed (${version})${colors.reset}`);
  } else {
    console.error(`${colors.red}✗ Node.js is not installed!${colors.reset}`);
    console.log(`Please install Node.js from https://nodejs.org/`);
    process.exit(1);
  }
  
  // Check for npm
  console.log(`${colors.dim}Checking npm...${colors.reset}`);
  if (commandExists('npm')) {
    const version = runCommand('npm --version', { silent: true }).trim();
    console.log(`${colors.green}✓ npm is installed (${version})${colors.reset}`);
  } else {
    console.error(`${colors.red}✗ npm is not installed!${colors.reset}`);
    console.log(`Please install npm (it usually comes with Node.js)`);
    process.exit(1);
  }
  
  // Check for ImageMagick
  console.log(`${colors.dim}Checking ImageMagick...${colors.reset}`);
  const magickCommands = ['magick', 'convert'];
  let imageMagickFound = false;
  
  for (const cmd of magickCommands) {
    if (commandExists(cmd)) {
      let version;
      try {
        if (cmd === 'magick') {
          version = runCommand('magick --version', { silent: true }).split('\n')[0];
        } else {
          version = runCommand('convert --version', { silent: true }).split('\n')[0];
        }
        console.log(`${colors.green}✓ ImageMagick is installed (${version.trim()})${colors.reset}`);
        imageMagickFound = true;
        break;
      } catch (error) {
        // Try next command
      }
    }
  }
  
  if (!imageMagickFound) {
    console.log(`${colors.red}✗ ImageMagick is not installed!${colors.reset}`);
    
    let install = await prompt(`${colors.yellow}Would you like to install ImageMagick now? (y/n)${colors.reset}: `);
    
    if (install.toLowerCase() === 'y') {
      if (isMac) {
        console.log(`${colors.blue}Installing ImageMagick with Homebrew...${colors.reset}`);
        if (commandExists('brew')) {
          runCommand('brew install imagemagick');
        } else {
          console.log(`${colors.red}Homebrew is not installed!${colors.reset}`);
          console.log(`Please install Homebrew first: https://brew.sh/`);
          console.log(`Then run: brew install imagemagick`);
        }
      } else if (isLinux) {
        if (commandExists('apt-get')) {
          console.log(`${colors.blue}Installing ImageMagick with apt...${colors.reset}`);
          runCommand('sudo apt-get update && sudo apt-get install -y imagemagick');
        } else if (commandExists('yum')) {
          console.log(`${colors.blue}Installing ImageMagick with yum...${colors.reset}`);
          runCommand('sudo yum install -y ImageMagick');
        } else {
          console.log(`${colors.red}Could not determine package manager.${colors.reset}`);
          console.log(`Please install ImageMagick manually.`);
        }
      } else if (isWindows) {
        console.log(`${colors.yellow}Please install ImageMagick manually:${colors.reset}`);
        console.log(`Download from: https://imagemagick.org/script/download.php#windows`);
      } else {
        console.log(`${colors.yellow}Please install ImageMagick manually:${colors.reset}`);
        console.log(`Visit: https://imagemagick.org/script/download.php`);
      }
    } else {
      console.log(`${colors.yellow}Please install ImageMagick before using this extension.${colors.reset}`);
    }
  }
  
  console.log('');
}

// Install npm dependencies
async function installDependencies() {
  console.log(`${colors.blue}Checking npm dependencies...${colors.reset}`);
  
  const nodeModulesExists = fs.existsSync(path.join(ROOT_DIR, 'node_modules'));
  
  if (nodeModulesExists) {
    console.log(`${colors.green}✓ node_modules directory exists${colors.reset}`);
    
    const updateDeps = await prompt(`${colors.yellow}Do you want to update dependencies? (y/n)${colors.reset}: `);
    
    if (updateDeps.toLowerCase() === 'y') {
      console.log(`${colors.blue}Updating dependencies...${colors.reset}`);
      runCommand('npm install', { cwd: ROOT_DIR });
    }
  } else {
    console.log(`${colors.blue}Installing dependencies...${colors.reset}`);
    runCommand('npm install', { cwd: ROOT_DIR });
  }
  
  console.log('');
}

// Set up environment variables
async function setupEnvironment() {
  console.log(`${colors.blue}Setting up environment variables...${colors.reset}`);
  
  if (fs.existsSync(ENV_SETUP_SCRIPT)) {
    runCommand(`node ${ENV_SETUP_SCRIPT}`, { cwd: ROOT_DIR });
  } else {
    console.error(`${colors.red}Environment setup script not found!${colors.reset}`);
    
    // Fallback to manual env file creation
    const envPath = path.join(ROOT_DIR, '.env');
    const templatePath = path.join(__dirname, 'env', '.env.template');
    
    if (fs.existsSync(templatePath)) {
      console.log(`${colors.blue}Creating .env file from template...${colors.reset}`);
      fs.copyFileSync(templatePath, envPath);
      console.log(`${colors.green}✓ .env file created${colors.reset}`);
      console.log(`${colors.yellow}Please edit ${envPath} and add your settings${colors.reset}`);
    } else {
      console.error(`${colors.red}Could not find .env template!${colors.reset}`);
      console.log(`Create a .env file in the project root with your settings.`);
    }
  }
  
  console.log('');
}

// Final success message and next steps
function showNextSteps() {
  console.log(`
${colors.green}${colors.bright}✓ Setup completed successfully!${colors.reset}

${colors.bright}Next steps:${colors.reset}

${colors.yellow}1. Start development server:${colors.reset}
   ${colors.cyan}make dev${colors.reset} or ${colors.cyan}npm run webpack-watch${colors.reset}

${colors.yellow}2. Test the extension:${colors.reset}
   ${colors.cyan}make test${colors.reset} or ${colors.cyan}npm test${colors.reset}

${colors.yellow}3. Package the extension:${colors.reset}
   ${colors.cyan}make package${colors.reset} or ${colors.cyan}npm run package${colors.reset}

${colors.yellow}4. For more commands, run:${colors.reset}
   ${colors.cyan}make help${colors.reset}

Happy coding! 🚀
`);
}

// Main function
async function main() {
  try {
    await showWelcome();
    await checkSystemDependencies();
    await installDependencies();
    await setupEnvironment();
    showNextSteps();
  } catch (error) {
    console.error(`${colors.red}Error during setup:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main(); 