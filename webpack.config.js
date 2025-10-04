const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development",
    // The entry point for your webview's UI code
    entry: "./src/ui/index.tsx",
    output: {
      // All output files will be placed in the 'dist' folder
      path: path.resolve(__dirname, "dist"),
      // Use a content hash for cache-busting in production
      filename: isProd ? "js/[name].[contenthash].js" : "js/[name].js",
      // CRITICAL: Use relative paths for all assets to work in a webview
      publicPath: "./",
      // Clean the 'dist' folder before each build
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      alias: {
        // A common alias for the src directory
        "@": path.resolve(__dirname, "src"),
      },
      // IMPORTANT: Prevents Webpack from trying to bundle the 'vscode' module
      fallback: {
        vscode: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          test: /\.css$/i,
          use: [
            // Extracts CSS into files for production, uses style-loader for development
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
          ],
        },
        {
          // Modern way to handle assets like images and fonts
          test: /\.(png|jpe?g|gif|svg|woff(2)?|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/[hash][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        // Assumes your HTML template is with your UI code
        template: "./src/ui/index.html",
        filename: "index.html",
      }),
      // This spread operator correctly adds the plugin only for production builds
      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: "css/[name].[contenthash].css",
            }),
          ]
        : []),
    ],
    optimization: {
      // Only minimize in production
      minimize: isProd,
      minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
      // For a VS Code webview, it's often simpler to bundle vendor code
      // directly into the main chunk rather than splitting it.
      splitChunks: {
        cacheGroups: {
          default: false,
          vendors: false,
        },
      },
    },
    // Use a good source map for debugging
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    // Dev server config is for 'npm run start:ui' and doesn't affect the final build
    devServer: {
      static: { directory: path.join(__dirname, "dist") },
      compress: true,
      port: 3000,
      historyApiFallback: true,
      hot: true,
    },
  };
};
