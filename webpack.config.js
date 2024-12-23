const { exec } = require('child_process');
const path = require('path');

module.exports = (env, options) => {
  const { mode = 'development' } = options;

  const rules = [
    {
      test: /\.m?js$/,
      exclude: /node_modules/,
      use: [
        'html-tag-js/jsx/tag-loader.js',
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      ],
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: ['raw-loader', 'postcss-loader', 'sass-loader'],
    },
  ];

  const mainConfig = {
    mode,
    entry: {
      main: './src/main.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    module: {
      rules,
    },
    plugins: [
      {
        apply: compiler => {
          compiler.hooks.afterEmit.tapAsync(
            'pack-zip',
            (compilation, callback) => {
              exec('node .vscode/pack-zip.js', (err, stdout, stderr) => {
                if (err) {
                  console.error('Error running pack-zip:', err);
                  callback(err);
                  return;
                }
                console.log('pack-zip executed successfully:', stdout);
                callback();
              });
            },
          );
        },
      },
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    devtool: mode === 'development' ? 'inline-source-map' : false,
  };

  return [mainConfig];
};
