const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtconst path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development", // Explicit mode
    entry: "./src/index.tsx",
    output: {
      filename: isProd ? "js/[name].[contenthash].js" : "js/[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      fallback: {
        vscode: false, // ignore vscode module in bundling
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
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: "images/[hash][ext][query]",
          },
        },
        {
          test: /\.(woff(2)?|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[hash][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/favicon.ico",
        minify: isProd
          ? {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
            }
          : false,
      }),
      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: "css/[name].[contenthash].css",
            }),
          ]
        : []),
    ],
    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({ extractComments: false }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: { chunks: "all" },
      runtimeChunk: "single",
    },
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    devServer: {
      static: { directory: path.join(__dirname, "public") },
      compress: true,
      port: 3000,
      historyApiFallback: true,
      hot: true,
      open: true,
    },
    performance: { hints: isProd ? "warning" : false },
  };
};ractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    entry: "./src/index.tsx",
    output: {
      filename: isProd ? "js/[name].[contenthash].js" : "js/[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      fallback: {
        vscode: false, // ignore vscode module in bundling
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
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: "images/[hash][ext][query]",
          },
        },
        {
          test: /\.(woff(2)?|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[hash][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/favicon.ico",
        minify: isProd
          ? {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
            }
          : false,
      }),
      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: "css/[name].[contenthash].css",
            }),
          ]
        : []),
    ],
    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({ extractComments: false }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: { chunks: "all" },
      runtimeChunk: "single",
    },
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    devServer: {
      static: { directory: path.join(__dirname, "public") },
      compress: true,
      port: 3000,
      historyApiFallback: true,
      hot: true,
      open: true,
    },
    performance: { hints: isProd ? "warning" : false },
  };
};
