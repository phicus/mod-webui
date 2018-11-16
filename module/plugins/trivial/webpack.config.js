const path = require('path');
module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'trivial', 'index'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'htdocs/js')
  },
  module: {
    rules: [{
      include: [
        path.resolve(__dirname, 'trivial')
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'bower_components')
      ],
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.css']
  },
  devtool: 'source-map',
};