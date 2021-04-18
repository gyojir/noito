/*
* webpack.config
* ./src/index.jsから依存をたどり, build/public/bundle.jsに出力
* ./publicをbuild/publicにコピー
*/

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
// const keysTransformer = require('ts-transformer-keys/transformer').default;

const env = process.env.NODE_ENV || "development"

babelOptions = {
  presets: [
    ["@babel/preset-typescript"],
    ["@babel/preset-env", {
      "targets": {
        "node": "current"
      }
    }]
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-optional-chaining"
  ],
};

module.exports = {
  mode: env,
  target: "web",
  entry: "./src/index.ts",
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, "build", "public", "js"),  // PROJECT_DIR/build/public/js/に出力
  },
  devServer: {
		contentBase: path.join(__dirname, "build", "public"), // build/publicフォルダを起点とする
    port: 8080,                                           // ポート番号8080
    host: "0.0.0.0"
  },
  plugins: [
    new CopyPlugin([
      {from: "./public", to: "../"},                      // PROJECT_DIR/publicをOUT_DIR/../に出力
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    })
  ],
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"],
  },
  // ローダーの設定
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: babelOptions
          },
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: babelOptions
          },
        ]
      },
      {
        test: /\.(png|svg|jpg|gif|fui)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  devtool: 'inline-source-map',
};