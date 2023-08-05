'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const isDevBuild = Boolean(process.env.IS_DEV_BUILD);

module.exports = {
    mode: isDevBuild
        ? "development"
        : "production",
    entry: {
        index: './src/index.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "ts-loader",
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
        ]
    },
    devServer: {
        hot: true,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            chunks: [ 'index' ],
        })
    ],
};