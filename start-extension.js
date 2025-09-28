const { execSync } = require('child_process');

console.log('🚀 Launching VS Code Extension Development...');
execSync('code --extensionDevelopmentPath=.', { stdio: 'inherit' });
