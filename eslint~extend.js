'use strict';

const gulp = global.gulp || require('gulp');
const utils = require('fepper-utils');

const gulpEslint = require('./lib/gulp-eslint');

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
  let _writable;

  if (typeof pref.eslint.failAfterError === 'boolean') {
    failAfterError = pref.eslint.failAfterError;
    delete pref.eslint.failAfterError;
  }
  if (typeof pref.eslint.failOnError === 'boolean') {
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
  if (typeof pref.eslint._writable !== 'undefined') {
    _writable = pref.eslint._writable;
    delete pref.eslint._writable;
  }

  try {
    let gulpStream = gulp.src(jsSrcDir + '/**/*.js')
      .pipe(gulpEslint(pref.eslint));

    if (formatEach) {
      gulpStream = gulpStream.pipe(gulpEslint.formatEach(formatEach, _writable));
    }
    else {
      gulpStream = gulpStream.pipe(gulpEslint.format(format, _writable));
    }

    if (failOnError) {
      gulpStream = gulpStream.pipe(gulpEslint.failOnError());
    }
    else if (failAfterError) {
      gulpStream = gulpStream.pipe(gulpEslint.failAfterError());
    }

    return gulpStream;
  }
  catch (err) /* istanbul ignore next */ {
    // Consoling and not throwing here because thrown errors don't get logged in tests.
    // eslint-disable-next-line no-console
    console.error(err);
  }
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
