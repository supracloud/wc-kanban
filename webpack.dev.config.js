module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: './dist'
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      }, {
        test: /\.css$/i,
        use: ['css-to-string-loader', 'css-loader']
      }
    ]
  }
};