const path = require('path');
const glob = require('glob');

const ENV = process.env.NODE_ENV;
const isProd = ENV === 'production';

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: {
    ts: glob.sync('./src/**/*.ts'),
  },
  devtool: isProd ? false : 'source-map',
  mode: ENV,
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: `lux.${ENV}.js`,
    path: path.resolve(__dirname, 'build'),
  },
};