#!/usr/bin/env node

/**
 * Environment setup script for Markdown Arweave Uploader
 * 
 * This script helps users set up their .env file interactively
 * It can create a new .env file or update an existing one
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ROOT_DIR = path.join(__dirname, '../..');
const TEMPLATE_PATH = path.join(__dirname, '.env.template');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const GITIGNORE_PATH = path.join(ROOT_DIR, '.gitignore');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt user
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Helper to parse env file to object
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
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
}

// Helper to extract comments from template
function extractComments(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const comments = {};
  let currentKey = null;
  let currentComment = [];
  
  content.split('\n').forEach(line => {
    if (line.startsWith('#')) {
      currentComment.push(line);
    } else if (line.includes('=')) {
      const key = line.split('=')[0].trim();
      if (currentComment.length > 0) {
        comments[key] = currentComment.join('\n');
        currentComment = [];
      }
      currentKey = key;
    } else if (line.trim() === '' && currentKey) {
      currentKey = null;
    }
  });
  
  return comments;
}

// Main function
async function main() {
  console.log('📝 Markdown Arweave Uploader Environment Setup');
  console.log('==============================================');
  
  // Check if .env already exists
  const envExists = fs.existsSync(ENV_PATH);
  let createNew = false;
  
  if (envExists) {
    console.log('An .env file already exists in your project root.');
    const answer = await promptUser('Do you want to update it? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Existing .env file not modified.');
      rl.close();
      return;
    }
  } else {
    createNew = true;
    console.log('No .env file found. Creating a new one.');
  }
  
  // Ensure we have a template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Error: .env.template file not found!');
    rl.close();
    return;
  }
  
  // Parse existing env file if it exists
  const existingEnv = envExists ? parseEnvFile(ENV_PATH) : {};
  
  // Extract comments from template for helpful prompts
  const comments = extractComments(TEMPLATE_PATH);
  
  // Read template to get all possible variables
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const variables = [];
  
  templateContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) {
      return;
    }
    
    const match = line.match(/^([^=]+)=/);
    if (match) {
      variables.push(match[1].trim());
    }
  });
  
  // New env content
  let newEnvContent = '';
  
  // Add template content first
  newEnvContent = templateContent;
  
  // Prompt for each variable
  console.log('\nPlease provide values for the following environment variables:');
  console.log('(Press Enter to skip optional variables or use existing values)\n');
  
  for (const variable of variables) {
    // Check if variable is commented out in template (optional)
    const isOptional = !templateContent.includes(`\n${variable}=`) && 
                       templateContent.includes(`\n# ${variable}=`);
    
    // Get current value if exists
    const currentValue = existingEnv[variable] || '';
    
    // Display comment for this variable if available
    if (comments[variable]) {
      console.log(comments[variable]);
    }
    
    const promptText = isOptional
      ? `${variable} (optional) [${currentValue}]: `
      : `${variable} [${currentValue}]: `;
    
    const value = await promptUser(promptText);
    
    // Update variable in content
    if (value || currentValue) {
      const finalValue = value || currentValue;
      
      // Replace the variable in the env content
      if (isOptional) {
        // Uncomment and set the value for optional variables
        newEnvContent = newEnvContent.replace(
          new RegExp(`# ${variable}=.*`, 'g'),
          `${variable}=${finalValue}`
        );
      } else {
        // Set the value for required variables
        newEnvContent = newEnvContent.replace(
          new RegExp(`${variable}=.*`, 'g'),
          `${variable}=${finalValue}`
        );
      }
    }
  }
  
  // Write the new env file
  fs.writeFileSync(ENV_PATH, newEnvContent);
  
  // Ensure .env is in .gitignore
  let gitignoreUpdated = false;
  if (fs.existsSync(GITIGNORE_PATH)) {
    const gitignoreContent = fs.readFileSync(GITIGNORE_PATH, 'utf8');
    if (!gitignoreContent.split('\n').some(line => line.trim() === '.env')) {
      fs.writeFileSync(GITIGNORE_PATH, gitignoreContent + '\n.env\n');
      gitignoreUpdated = true;
    }
  } else {
    fs.writeFileSync(GITIGNORE_PATH, '.env\n');
    gitignoreUpdated = true;
  }
  
  console.log(`\n✅ .env file has been ${createNew ? 'created' : 'updated'} successfully!`);
  if (gitignoreUpdated) {
    console.log('✅ .env was added to .gitignore to prevent committing sensitive information.');
  }
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error('Error setting up environment:', error);
  rl.close();
  process.exit(1);
}); 