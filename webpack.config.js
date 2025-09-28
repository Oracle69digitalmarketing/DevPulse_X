const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/ui/dashboard.tsx',          // React dashboard entry
    output: {
        path: path.resolve(__dirname, 'out/ui'), // Webview output folder
        filename: 'dashboard.js',                 // Single bundle
        libraryTarget: 'module'
    },
    experiments: {
        outputModule: true                       // Enable ES module output for Webview
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'] // Handle dashboard styles
            }
        ]
    }
};
