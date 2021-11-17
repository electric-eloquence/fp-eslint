'use strict';

const gulp = global.gulp || require('gulp');
const utils = require('fepper-utils');

const gulpEslint = require('./lib/gulp-eslint');

const {
  conf,
  pref
} = global;
global.fpEslint = {promisedData: {formats: []}};

// Set up pref.eslint.
pref.eslint = pref.eslint || {};

// This task is the equivalent of a private method. It is not meant to be exposed to end-users.
// It returns a promise that the 'eslint' streaming task depends on.
gulp.task('_eslintGetFormats', function () {
  let format;
  let formatEach;

  if (typeof pref.eslint.format === 'string') {
    format = pref.eslint.format;
    delete pref.eslint.format;
  }
  if (typeof pref.eslint.formatEach === 'string') {
    formatEach = pref.eslint.formatEach;
    delete pref.eslint.formatEach;
  }

  if (formatEach) {
    return gulpEslint.formatEach(formatEach, pref.eslint.output)
      .then((data) => {
        global.fpEslint.promisedData.formats.push(data);
      });
  }
  else if (format) {
    return gulpEslint.format(format, pref.eslint.output)
      .then((data) => {
        global.fpEslint.promisedData.formats.push(data);
      });
  }
  else {
    return gulpEslint.format()
      .then((data) => {
        global.fpEslint.promisedData.formats.push(data);
      });
  }
});

gulp.task('eslint', ['_eslintGetFormats'], function () {
  const jsSrcDir = conf.ui.paths.source.jsSrc;
  let failOnError;
  let failAfterError;

  if (typeof pref.eslint.failAfterError === 'boolean') {
    failAfterError = pref.eslint.failAfterError;
    delete pref.eslint.failAfterError;
  }
  if (typeof pref.eslint.failOnError === 'boolean') {
    failOnError = pref.eslint.failOnError;
    delete pref.eslint.failOnError;
  }

  try {
    const formats = global.fpEslint.promisedData.formats.pop();
    let gulpStream = gulp.src(jsSrcDir + '/**/*.js')
      .pipe(gulpEslint(pref.eslint));

    if (formats) {
      gulpStream = gulpStream.pipe(formats);
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
