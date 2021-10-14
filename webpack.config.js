const path = require('path');
const glob = require('glob');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: {
    ts: glob.sync('./src/**/*.ts'),
  },
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'lux.js',
    path: path.resolve(__dirname, 'build'),
  },
};
