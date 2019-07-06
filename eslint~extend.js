'use strict';

const gulp = global.gulp || require('gulp');
const eslint = require('gulp-eslint');
const utils = require('fepper-utils');

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

  if (typeof pref.eslint.failAfterError === 'boolean') {
    failAfterError = pref.eslint.failAfterError;
    delete pref.eslint.failAfterError;
  }
  if (typeof pref.eslint.failOnError === 'boolean') {
    failOnError = pref.eslint.failOnError;
    delete pref.eslint.failOnError;
  }
  if (typeof pref.eslint.format === 'string') {
    format = pref.eslint.format;
    delete pref.eslint.format;
  }
  if (typeof pref.eslint.formatEach === 'string') {
    formatEach = pref.eslint.formatEach;
    delete pref.eslint.formatEach;
  }

  let gulpStream = gulp.src(jsSrcDir + '/**/*.js')
    .pipe(eslint(pref.eslint));

  if (formatEach) {
    gulpStream = gulpStream.pipe(eslint.formatEach(formatEach, pref.eslint.output));
  }
  else if (format) {
    gulpStream = gulpStream.pipe(eslint.format(format, pref.eslint.output));
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

gulp.task('eslint:help', function (cb) {
  let out = `
Fepper ESLint Extension

Use:
    <task> [<additional args>...]

Tasks:
    fp eslint       Lint Fepper's frontend JavaScript files.
    fp eslint:help  Print fp-eslint tasks and descriptions.
`;

  utils.info(out);
  cb();
});
