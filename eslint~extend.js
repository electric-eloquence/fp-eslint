'use strict';

const srcDir = global.conf.ui.paths.source;

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

const utilsGulp = require('../../../gulp/utils');

gulp.task('eslint', function () {
  return gulp.src(utilsGulp.pathResolve(srcDir.js) + '/src/**/*.js')
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format());
});
