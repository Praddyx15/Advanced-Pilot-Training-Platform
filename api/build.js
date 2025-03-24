const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      console.log(`Command stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function build() {
  try {
    console.log('Starting build process...');
    
    // Make sure the build directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    
    // Build the client-side application
    console.log('Building client-side application...');
    await executeCommand('vite build --outDir dist/public');
    
    // Compile TypeScript server files
    console.log('Compiling server TypeScript files...');
    await executeCommand('tsc --project tsconfig.server.json');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Create tsconfig.server.json for server-side TypeScript compilation
const serverTsConfig = {
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist/server",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["server/**/*", "api/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist", "client"]
};

// Write the server tsconfig file
fs.writeFileSync('tsconfig.server.json', JSON.stringify(serverTsConfig, null, 2));

// Run the build process
build();