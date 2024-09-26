const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { GeneratePackageJsonPlugin } = require('./plugin/generate-package-json-plugin');
const isProduction = process.env.NODE_ENV == 'production';
const webpack = require('webpack');
const { MakeExecutablePlugin } = require('./plugin/make-executable-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');


const cli = {
    entry: {
        index: './src/cli/index.ts'
    },
    target: 'node14',
    externalsPresets: { node: true },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist', 'cli')
    },
    devServer: {
        open: true,
        host: 'localhost',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, 'tsconfig.cli.json')
                    }
                },
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
        new GeneratePackageJsonPlugin({
            bin: {
                anki: 'cli/index.js'
            },
        }),
        new MakeExecutablePlugin('index.js'),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve('README.md'), to: path.resolve('dist')
                }
            ]
        })
    ]
};

const ui = {
    entry: {
        ui: './src/ui/ui.tsx'
    },
    target: 'web',
    externalsPresets: { node: true },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist', 'ui')
    },
    devServer: {
        open: true,
        host: 'localhost',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, 'tsconfig.ui.json')
                    }
                },
                exclude: ['/node_modules/'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        },
                    }
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx'],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            chunks: [ 'ui' ],
            template: './src/ui/index.html',    
        })
    ]
}

module.exports =  () => {
    if (isProduction) {
        cli.mode = 'production';
        ui.mode = 'production';
    } else {
        ui.mode = 'development';
        ui.devtool = 'source-map';
        cli.mode = 'development';
        cli.devtool = 'source-map';
    }
    return [ ui, cli ];
};
