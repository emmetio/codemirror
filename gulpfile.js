var gulp = require('gulp');
var rename = require('gulp-rename');
var jsBundler = require('js-bundler');

gulp.task('js', function() {
	return gulp.src('./plugin.js')
		.pipe(jsBundler({standalone: 'emmetCodeMirror', detectGlobals: false}))
		.pipe(rename('emmet.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
	jsBundler.watch({sourceMap: true});
	gulp.watch(['./lib/**/*.js', './*.js'], ['js']);
});

gulp.task('default', ['js']);