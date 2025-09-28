const { execSync } = require('child_process');

console.log('🔨 Compiling TypeScript...');
execSync('tsc -p .', { stdio: 'inherit' });

console.log('📦 Bundling React dashboard...');
execSync('webpack --config webpack.config.js', { stdio: 'inherit' });

console.log('✅ Build complete.');
