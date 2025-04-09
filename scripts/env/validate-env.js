#!/usr/bin/env node

/**
 * Environment validation script for Markdown Arweave Uploader
 * 
 * This script validates that required environment variables are set
 * and helps diagnose common environment configuration issues
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '../..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const TEMPLATE_PATH = path.join(__dirname, '.env.template');

// Required and optional variables categories
const REQUIRED_VARS = ['VSCE_PAT'];
const OPTIONAL_VARS = ['AR_GATEWAY_URL', 'DEV_MODE', 'TEST_MODE'];

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

// Check if .env file exists
function checkEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    console.log(`${colors.red}✗ Error: ${colors.reset}.env file not found in project root!`);
    console.log(`${colors.dim}Run ${colors.bright}npm run env:setup${colors.reset}${colors.dim} to create one.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ ${colors.reset}.env file exists`);
  return true;
}

// Parse environment variables from file
function parseEnvFile() {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    const result = {};
    
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) {
        return;
      }
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        result[key] = value;
      }
    });
    
    return result;
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${colors.reset}Failed to parse .env file: ${error.message}`);
    return {};
  }
}

// Check required variables
function checkRequiredVars(envVars) {
  let allPresent = true;
  
  console.log(`\n${colors.bright}Checking required variables:${colors.reset}`);
  
  REQUIRED_VARS.forEach(varName => {
    const value = envVars[varName] || process.env[varName];
    
    if (!value) {
      console.log(`${colors.red}✗ ${varName}: ${colors.reset}Not set - REQUIRED`);
      allPresent = false;
    } else {
      console.log(`${colors.green}✓ ${varName}: ${colors.reset}Set correctly`);
    }
  });
  
  return allPresent;
}

// Check optional variables
function checkOptionalVars(envVars) {
  console.log(`\n${colors.bright}Checking optional variables:${colors.reset}`);
  
  OPTIONAL_VARS.forEach(varName => {
    const value = envVars[varName] || process.env[varName];
    
    if (!value) {
      console.log(`${colors.yellow}○ ${varName}: ${colors.reset}Not set (optional)`);
    } else {
      console.log(`${colors.green}✓ ${varName}: ${colors.reset}Set to ${value}`);
    }
  });
}

// Check for any unknown variables
function checkUnknownVars(envVars) {
  const allKnownVars = [...REQUIRED_VARS, ...OPTIONAL_VARS];
  const unknownVars = Object.keys(envVars).filter(key => !allKnownVars.includes(key));
  
  if (unknownVars.length > 0) {
    console.log(`\n${colors.bright}Unknown variables:${colors.reset}`);
    unknownVars.forEach(varName => {
      console.log(`${colors.yellow}⚠ ${varName}: ${colors.reset}Unknown variable (not in template)`);
    });
  }
}

// Perform validation
function validateEnv() {
  console.log(`${colors.bright}🔍 Environment Validation${colors.reset}`);
  console.log(`${colors.dim}=========================${colors.reset}`);
  
  // Check if .env file exists
  const envExists = checkEnvFile();
  if (!envExists) {
    return false;
  }
  
  // Parse environment variables
  const envVars = parseEnvFile();
  
  // Check required variables
  const requiredVarsOk = checkRequiredVars(envVars);
  
  // Check optional variables
  checkOptionalVars(envVars);
  
  // Check for unknown variables
  checkUnknownVars(envVars);
  
  return requiredVarsOk;
}

// Main function
function main() {
  const validationSuccess = validateEnv();
  
  if (validationSuccess) {
    console.log(`\n${colors.green}${colors.bright}✓ Environment validation successful!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Environment validation failed!${colors.reset}`);
    console.log(`${colors.dim}Run ${colors.bright}npm run env:setup${colors.reset}${colors.dim} to fix issues.${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main(); 