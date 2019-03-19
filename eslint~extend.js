'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');

const {
  conf,
  pref
} = global;

// Set up pref.eslint.
pref.eslint = pref.eslint || {};

gulp.task('eslint', function () {
  const jsSrcDir = conf.ui.paths.source.jsSrc;
  let failOnError;
  let failAfterError;
  let format;
  let formatEach;

  if (typeof pref.eslint.failAfterError !== 'undefined') {
    failAfterError = pref.eslint.failAfterError;
    delete pref.eslint.failAfterError;
  }
  if (typeof pref.eslint.failOnError !== 'undefined') {
    failOnError = pref.eslint.failOnError;
    delete pref.eslint.failOnError;
  }
  if (typeof pref.eslint.format !== 'undefined') {
    format = pref.eslint.format;
    delete pref.eslint.format;
  }
  if (typeof pref.eslint.formatEach !== 'undefined') {
    formatEach = pref.eslint.formatEach;
    delete pref.eslint.formatEach;
  }

  let gulpStream = gulp.src(jsSrcDir + '/**/*.js')
    .pipe(eslint(pref.eslint));

  if (formatEach) {
    gulpStream = gulpStream.pipe(eslint.formatEach(formatEach));
  }
  else if (format) {
    gulpStream = gulpStream.pipe(eslint.format(format));
  }
  else {
    gulpStream = gulpStream.pipe(eslint.format());
  }

  if (failOnError) {
    gulpStream = gulpStream.pipe(eslint.failOnError());
  }
  else if (failAfterError) {
    gulpStream = gulpStream.pipe(eslint.failAfterError());
  }

  return gulpStream;
});
