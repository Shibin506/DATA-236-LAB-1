#!/usr/bin/env node

/**
 * Setup script for Airbnb Backend API
 * This script helps initialize the database and create necessary directories
 */

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createUploadDirectories() {
  log('📁 Creating upload directories...', 'cyan');
  
  const directories = [
    './uploads',
    './uploads/profiles',
    './uploads/properties'
  ];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      log(`   ✅ Created directory: ${dir}`, 'green');
    } catch (error) {
      if (error.code !== 'EEXIST') {
        log(`   ❌ Failed to create directory ${dir}: ${error.message}`, 'red');
      } else {
        log(`   ℹ️  Directory already exists: ${dir}`, 'yellow');
      }
    }
  }
}

async function testDatabaseConnection() {
  log('🔌 Testing database connection...', 'cyan');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'airbnb_db'}\``);
    log('   ✅ Database connection successful', 'green');
    log('   ✅ Database created/verified', 'green');
    
    await connection.end();
    return true;
  } catch (error) {
    log(`   ❌ Database connection failed: ${error.message}`, 'red');
    log('   💡 Please check your database configuration in .env file', 'yellow');
    return false;
  }
}

async function checkEnvironmentVariables() {
  log('🔍 Checking environment variables...', 'cyan');
  
  const requiredVars = [
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    log('   ❌ Missing required environment variables:', 'red');
    missing.forEach(varName => {
      log(`      - ${varName}`, 'red');
    });
    log('   💡 Please create a .env file based on env.example', 'yellow');
    return false;
  }
  
  log('   ✅ All required environment variables are set', 'green');
  return true;
}

async function checkNodeModules() {
  log('📦 Checking dependencies...', 'cyan');
  
  try {
    await fs.access('./node_modules');
    log('   ✅ node_modules directory exists', 'green');
    
    // Check if package.json exists
    const packageJson = await fs.readFile('./package.json', 'utf8');
    log('   ✅ package.json found', 'green');
    
    return true;
  } catch (error) {
    log('   ❌ Dependencies not installed', 'red');
    log('   💡 Run: npm install', 'yellow');
    return false;
  }
}

async function createSampleData() {
  log('🌱 Would you like to create sample data? (y/n)', 'yellow');
  
  // For automated setup, we'll skip this
  log('   ℹ️  Skipping sample data creation for automated setup', 'yellow');
}

async function main() {
  log('🚀 Airbnb Backend API Setup', 'bright');
  log('============================', 'bright');
  
  let allChecksPassed = true;
  
  // Check if .env file exists
  try {
    await fs.access('.env');
    log('✅ .env file found', 'green');
  } catch (error) {
    log('❌ .env file not found', 'red');
    log('💡 Please copy env.example to .env and configure your settings', 'yellow');
    allChecksPassed = false;
  }
  
  // Check Node modules
  const nodeModulesOk = await checkNodeModules();
  if (!nodeModulesOk) {
    allChecksPassed = false;
  }
  
  // Check environment variables
  const envVarsOk = await checkEnvironmentVariables();
  if (!envVarsOk) {
    allChecksPassed = false;
  }
  
  // Test database connection
  const dbOk = await testDatabaseConnection();
  if (!dbOk) {
    allChecksPassed = false;
  }
  
  // Create upload directories
  await createUploadDirectories();
  
  // Create sample data (optional)
  await createSampleData();
  
  log('\n🎉 Setup Complete!', 'bright');
  
  if (allChecksPassed) {
    log('✅ All checks passed successfully!', 'green');
    log('\n📋 Next steps:', 'cyan');
    log('   1. Start the server: npm run dev', 'yellow');
    log('   2. Visit: http://localhost:3001/health', 'yellow');
    log('   3. Check API documentation: API_DOCUMENTATION.md', 'yellow');
  } else {
    log('❌ Some checks failed. Please fix the issues above.', 'red');
    log('\n🔧 Common solutions:', 'cyan');
    log('   - Install dependencies: npm install', 'yellow');
    log('   - Create .env file from env.example', 'yellow');
    log('   - Ensure MySQL is running', 'yellow');
    log('   - Check database credentials', 'yellow');
  }
  
  log('\n📚 For more information, see README.md', 'blue');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  log(`❌ Unhandled promise rejection: ${err.message}`, 'red');
  process.exit(1);
});

// Run setup
main().catch((error) => {
  log(`❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
