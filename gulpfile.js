'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');

gulp.task('default', ['build']);

gulp.task('build-dev', ['webpack:build-dev'], function () {
    gulp.watch(['src/**/*'], ['webpack:build-dev']);
});

gulp.task('build', ['webpack:build']);

gulp.task('webpack:build', function (callback) {
    var myConfig = Object.create(webpackConfig);
    myConfig.plugins = myConfig.plugins || [];
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    );

    webpack(myConfig, function (err, stats) {
        if (err) throw new gutil.PluginError('webpack:build', err);
        gutil.log('[webpack:build]', stats.toString({
            colors: true
        }));
        callback();
    });
});

gulp.task('webpack:build-dev', function (callback) {
    var myDevConfig = Object.create(webpackConfig);
    myDevConfig.devtool = 'source-map';
    // create a single instance of the compiler to allow caching
    var devCompiler = webpack(myDevConfig);
    // run webpack
    devCompiler.run(function (err, stats) {
        if (err) throw new gutil.PluginError('webpack:build-dev', err);
        gutil.log('[webpack:build-dev]', stats.toString({
            colors: true
        }));
        callback();
    });
});