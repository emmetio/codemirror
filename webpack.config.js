'use strict';
const path = require('path');

const p = file => path.resolve(__dirname, file);

module.exports = {
    entry: './plugin.js',
    output: {
        filename: 'emmet-wp.js',
        path: './dist',
        library: 'emmetCodeMirror',
        libraryTarget: 'umd'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel?presets[]=es2015'
        }, {
            test: /\.json$/,
            loader: 'json'
        }]
    },
    node: {
        globals: false,
        process: false,
        Buffer: false
    }
};
