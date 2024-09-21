const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { GeneratePackageJsonPlugin } = require('./plugin/generate-package-json-plugin');
const isProduction = process.env.NODE_ENV == 'production';
const webpack = require('webpack');
const { MakeExecutablePlugin } = require('./plugin/make-executable-plugin');

const config = {
    entry: './src/index.ts',
    target: 'node14',
    externalsPresets: { node: true },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        open: true,
        host: 'localhost',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    externals: [
        nodeExternals({
            importType: function(moduleName) {
                return moduleName === 'srt-parser-2' ? `module srt-parser-2` : `commonjs ${moduleName}`
            }
        })
    ],
    plugins: [
        new webpack.BannerPlugin({
            banner: '#!/usr/bin/env node',
            raw: true,
        }),
        new GeneratePackageJsonPlugin({}),
        new MakeExecutablePlugin('index.js')
    ]
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
        config.devtool = 'source-map';
    }
    return config;
};
