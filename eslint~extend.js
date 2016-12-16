'use strict';

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

const appDir = global.appDir;
const utils = require(`${appDir}/core/lib/utils`);

const jsSrcDir = utils.pathResolve(conf.ui.paths.source.jsSrc);

gulp.task('eslint', function () {
  return gulp.src(jsSrcDir.js + '/**/*.js')
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format());
});
