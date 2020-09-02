const webpack = require('webpack');
const EsmWebpackPlugin = require('@purtuga/esm-webpack-plugin');
const path = require('path');
const fs = require('fs');

module.exports = function (env = {}) {
  let babelConf;

  // 
  const babelRC = env.esnext ? './.es6.babelrc' : './.babelrc';

  // 文件是否存在
  if(fs.existsSync(babelRC)) {
    // 读取文件
    babelConf = JSON.parse(fs.readFileSync(babelRC));
    // 
    babelConf.babelrc = false;
  }

  const plugins = [];

  // 开发模式下
  if(env.mode === 'development') {
    // 热替换
    plugins.push(new webpack.HotModuleReplacementPlugin({
      multiStep: true,
    }));
  }

  // 是否使用esm
  if(env.module) {
    plugins.push(new EsmWebpackPlugin());
  }

  // 开发模式下
  // 在全局下定义常量 __DEV__
  plugins.push(new webpack.DefinePlugin({
    __DEV__: env.mode === 'development',
  }));

  // 打包后的文件名
  let filename = '[name]';
  
  if(env.esnext) filename += '.es';
  if(env.module) filename += 'm';

  // 生产环境下的，添加.min
  if(env.mode === 'production') filename += '.min';
  // 后缀
  filename += '.js';

  /**
   * 多入口
   */
  const entry = {
    spritejs: './src/index',
    'spritejs.worker': './src/index.worker',
  };

  plugins.push(new webpack.DefinePlugin({
    __SPRITEVER__: `"${require('./package.json').version}"`,
  }));

  return {
    mode: env.mode || 'none',
    entry,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename,
      publicPath: '/js/',
      library: ['spritejs'],
      // 库
      libraryTarget: env.module ? 'var' : 'umd',
      // libraryExport: 'default',
      globalObject: 'this',
    },
    resolve: {
      alias: {
        'gl-renderer': 'gl-renderer/src',
        '@mesh.js/core': '@mesh.js/core/src',
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!@mesh.js|gl-renderer).*/,
          use: {
            loader: 'babel-loader',
            options: babelConf,
          },
        },
        // 将导入的文件作为字符串
        {
          test: /\.(frag|vert|glsl)$/,
          use: {
            loader: 'raw-loader',
            options: {},
          },
        },
      ],

      /* Advanced module configuration (click to show) */
    },

    externals: {

    },
    // Don't follow/bundle these modules, but request them at runtime from the environment

    stats: 'errors-only',
    // lets you precisely control what bundle information gets displayed
    // 借助webpack-dev-server 启动服务器
    devServer: {
      // 服务器的根路径
      contentBase: path.join(__dirname, env.server || '.'),
      compress: true,
      port: 9090,
      hot: true,
      // ...
    },

    plugins,
    // list of additional plugins

    /* Advanced configuration (click to show) */
  };
};
