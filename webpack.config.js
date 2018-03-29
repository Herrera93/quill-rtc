const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
    entry: {
        'quill-rtc': ['./src/quill-rtc.js'],
        'quill-rtc.min': ['./src/quill-rtc.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: 'QuillRTC',
        libraryTarget: 'umd',
    },
    externals: {
        quill: {
            root: 'Quill',
            commonjs2: 'quill',
            commonjs: 'quill',
            amd: 'quill'
        }
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract(['css-loader', 'sass-loader']),
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('[name].css')
    ],
    devServer: {
        contentBase: [
            path.join(__dirname, 'example'),
            path.join(__dirname, 'dist'),
            path.join(__dirname, 'node_modules/normalize.css'),
            path.join(__dirname, 'node_modules/quill/dist')
        ]
    },
};

module.exports = config;