const path = require('path')

module.exports = {
  target: 'node',
  mode: 'development',
  devtool: 'source-map',
  entry: {
    xml: './xml.js'
  },
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    publicPath: '/dist/'
  }
}