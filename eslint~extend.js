'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');

const conf = global.conf;

const jsSrcDir = conf.ui.paths.source.jsSrc;

gulp.task('eslint', function () {
  return gulp.src(jsSrcDir + '/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
