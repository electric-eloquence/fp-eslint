'use strict';

const srcDir = global.conf.ui.paths.source;

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

const utilsGulp = require('../../../gulp/utils');

gulp.task('minify', function () {
  return gulp.src(utilsGulp.pathResolve(srcDir.js) + '/src/**/*.js')
    .pipe(plugins.uglify())
    .pipe(plugins.rename({extname: '.min.js'}))
    .pipe(gulp.dest(utilsGulp.pathResolve(srcDir.js) + '/min'));
});
