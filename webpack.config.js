const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/ui/dashboard.tsx',
  output: {
    filename: 'dashboard.js',
    path: path.resolve(__dirname, 'out/ui'),
    libraryTarget: 'module'
  },
  experiments: {
    outputModule: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};
