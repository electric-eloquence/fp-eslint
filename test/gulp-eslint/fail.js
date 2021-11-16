/* global describe, it, beforeEach */
'use strict';

const path = require('path');

const {expect} = require('chai');
const File = require('vinyl');

const gulpEslint = require('../../lib/gulp-eslint');

describe('gulp-eslint failOnError', () => {
	it('should fail a file immediately if an error is found', done => {
		const lintStream = gulpEslint({useEslintrc: false, rules: {'no-undef': 'error'}});

		function endWithoutError() {
			done(new Error('An error was not thrown before ending'));
		}

		lintStream.pipe(gulpEslint.failOnError())
		.on('error', function (err) {
			this.removeListener('finish', endWithoutError);
			expect(err).to.exist;
			expect(err.message).to.equal('\'x\' is not defined.');
			expect(err.fileName).to.equal(path.resolve('test/fixtures/invalid.js'));
			expect(err.plugin).to.equal('gulp-eslint');
			done();
		})
		.on('finish', endWithoutError);

		lintStream.write(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 1;')
		}));

		lintStream.end();
	});

	it('should pass a file if only warnings are found', done => {

		const lintStream = gulpEslint({useEslintrc: false, rules: {'no-undef': 'warn', strict: 'off'}});

		lintStream.pipe(gulpEslint.failOnError())
		.on('error', done)
		.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 0;')
		}));
	});

	it('should handle ESLint reports without messages', done => {

		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		gulpEslint.failOnError()
		.on('error', function (err) {
			this.removeListener('finish', done);
			done(err);
		})
		.on('finish', done)
		.end(file);
	});

});

describe('gulp-eslint failAfterError', () => {

	it('should fail when the file stream ends if an error is found', done => {
		const lintStream = gulpEslint({useEslintrc: false, rules: {'no-undef': 'error'}});

		function endWithoutError() {
			done(new Error('An error was not thrown before ending'));
		}

		lintStream.pipe(gulpEslint.failAfterError())
		.on('error', function (err) {
			this.removeListener('finish', endWithoutError);
			expect(err).to.exist;
			expect(err.message).to.equal('Failed with 1 error');
			expect(err.name).to.equal('ESLintError');
			expect(err.plugin).to.equal('gulp-eslint');
			done();
		})
		.on('finish', endWithoutError);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 1;')
		}));
	});

	it('should fail when the file stream ends if multiple errors are found', done => {
		const lintStream = gulpEslint({useEslintrc: false, rules: {'no-undef': 'error'}});

		lintStream.pipe(gulpEslint.failAfterError().on('error', err => {
			expect(err).to.exist;
			expect(err.message).to.equal('Failed with 2 errors');
			expect(err.name).to.equal('ESLintError');
			expect(err.plugin).to.equal('gulp-eslint');
			done();
		}));

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 1; a = false;')
		}));
	});

	it('should pass when the file stream ends if only warnings are found', done => {
		const lintStream = gulpEslint({useEslintrc: false, rules: {'no-undef': 'warn', strict: 'off'}});

		lintStream.pipe(gulpEslint.failAfterError())
		.on('error', done)
		.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 0;')
		}));
	});

	it('should handle ESLint reports without messages', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		gulpEslint.failAfterError()
		.on('error', done)
		.on('finish', done)
		.end(file);
	});

});
