var fs = require('fs');
var gulp = require('gulp');
var requirejs = require('gulp-requirejs');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', function() {
	// load JSON data
	var snippets = fs.readFileSync('./node_modules/emmet/lib/snippets.json', {encoding: 'utf8'});
	var caniuse = fs.readFileSync('./node_modules/emmet/lib/caniuse.json', {encoding: 'utf8'});

	var loadData = 'var emmet = require("emmet/emmet");emmet.loadUserData({' +
		'snippets: ' + snippets + ',' +
		'caniuse: ' + caniuse +
		'});';

	return requirejs({
		baseUrl: './',
		name: 'vendor/almond',
		include: ['./plugin'],
		out: 'emmet.js',
		paths: {
			emmet: 'node_modules/emmet/lib',
			lodash: 'node_modules/emmet/node_modules/lodash/lodash'
		},
		wrap: {
			start: '(function (root, factory) {if (typeof define === "function" && define.amd) {define(factory);} else {root.emmetPlugin = factory();}}(this, function () {',
			end: ';' + loadData + 
			'var plugin = require(\'plugin\');plugin.require = require;plugin.define = define;' + 
			'return plugin;}));'
		}
	})
	.pipe(gulp.dest('./dist'))
	.pipe(rename('emmet.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('./dist'));
});

gulp.task('plugin', function() {
	return requirejs({
		baseUrl: './',
		name: 'vendor/almond',
		include: ['./shim', './plugin'],
		out: 'emmetPlugin.js',
		wrap: {
			start: '(function (root, factory) {if (typeof define === "function" && define.amd) {define(factory);} else {root.emmetPlugin = factory();}}(this, function () {',
			end: ';return require(\'plugin\');}));'
		}
	})
	.pipe(gulp.dest('./dist'))
	.pipe(rename('emmetPlugin.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('./dist'));
});