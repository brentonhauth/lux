const path = require('path');
const glob = require('glob');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  // entry: './src/index.ts',
  entry: {
    ts: glob.sync('./src/**/*.ts'),
  },
  // context: path.resolve(__dirname, 'src'),
  devtool: 'source-map',
  mode: 'none',
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
