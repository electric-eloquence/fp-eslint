/* global describe, it, beforeEach */
'use strict';

const fs = require('fs');
const {PassThrough, Writable} = require('stream');

const {expect} = require('chai');
const File = require('vinyl');

const gulpEslint = require('../../lib/gulp-eslint');

function getFiles() {
	return [
		new File({
			path: 'test/fixtures',
			contents: null,
			isDirectory: true
		}),
		new File({
			path: 'test/fixtures/use-strict.js',
			contents: Buffer.from('(function () {\n\n\tvoid 0;\n\n}());\n\n')
		}),
		new File({
			path: 'test/fixtures/undeclared.js',
			contents: Buffer.from('(function () {\n\t"use strict";\n\n\tx = 0;\n\n}());\n')
		}),
		new File({
			path: 'test/fixtures/passing.js',
			contents: Buffer.from('(function () {\n\n\t"use strict";\n\n}());\n')
		})
	];
}

describe('gulp-eslint format', () => {
	let formatCount;
	let writeCount;

	/**
	 * Custom ESLint formatted result writer for counting write attempts
	 * rather than writing to the console.
	 *
	 * @param {String} message - a message to count as written
	 */
	function outputWriter(message) {
		expect(message).to.exist;
		expect(message).to.match(/^\d+ messages$/);
		writeCount++;
	}

	/**
	 * Custom ESLint formatted result writer that will throw an exception
	 *
	 * @throws Error Always thrown to test error handling in writers
	 * @param {String} message - a message to trigger an error
	 */
	function failWriter(message) {
		const error = new Error('Writer Test Error' + (message ? ': ' + message : ''));
		error.name = 'TestError';
		throw error;
	}

	describe('format all results', () => {
		/**
		 * Custom ESLint result formatter for counting format passes and
		 * returning a expected formatted result message.
		 *
		 * @param {Array} results - ESLint results
		 * @returns {String} formatted results
		 */
		function formatResults(results) {
			expect(results).to.exist;
			expect(results).to.be.instanceof(Array);
			expect(results).to.have.lengthOf(3);
			formatCount++;

			const messageCount = results.reduce((sum, result) => {
				return sum + result.messages.length;
			}, 0);

			return messageCount + ' messages';
		}

		beforeEach(() => {
			formatCount = 0;
			writeCount = 0;
		});

		it('should format all ESLint results in one batch', done => {
			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.format()
			.on('error', done)
			.on('finish', done);

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should format all ESLint results in one batch with a named formatter', done => {
			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.format('checkstyle')
			.on('error', done)
			.on('finish', done);

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should format all ESLint results in one batch with a custom function', done => {
			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.format(formatResults, outputWriter)
			.on('error', done)
			.on('finish', () => {
				expect(formatCount).to.equal(1);
				expect(writeCount).to.equal(1);
				done();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should format all ESLint results in one batch with a custom writable stream', done => {
			const files = getFiles();
			let written = false;

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const writable = new Writable({objectMode: true})
			.on('error', done)
			.on('finish', () => {
				expect(written).to.be.true;
				done();
			});
			writable._write = function writeChunk(chunk, encoding, cb) {
				expect(chunk).to.have.string('Use the function form of \'use strict\'');
				written = true;
				cb();
			};

			const formatStream = gulpEslint.format('stylish', writable);

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should not attempt to format when no linting results are found', done => {
			const files = getFiles();

			const passthruStream = new PassThrough({objectMode: true})
			.on('error', done);

			const formatStream = gulpEslint.format(formatResults, outputWriter)
			.on('error', done)
			.on('finish', () => {
				expect(formatCount).to.equal(0);
				expect(writeCount).to.equal(0);
				done();
			});

			expect(passthruStream.pipe).to.exist;
			passthruStream.pipe(formatStream);

			files.forEach(file => passthruStream.write(file));
			passthruStream.end();
		});

	});

	describe('format each result', () => {

		function formatResult(results) {
			expect(results).to.exist;
			expect(results).to.be.instanceof(Array);
			expect(results).to.have.lengthOf(1);
			formatCount++;

			return `${results.reduce((sum, result) => sum + result.messages.length, 0)} messages`;
		}

		it('should format each ESLint result separately', done => {
			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.formatEach()
			.on('error', done)
			.on('finish', function () {
				// the stream should not have emitted an error
				expect(this._writableState.errorEmitted).to.equal(false);
				done();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should format each ESLint result separately with a named formatter', done => {
			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.formatEach('checkstyle')
			.on('error', done)
			.on('finish', function () {
				// the stream should not have emitted an error
				expect(this._writableState.errorEmitted).to.equal(false);
				done();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should format each ESLint result separately with a custom function', done => {
			formatCount = 0;
			writeCount = 0;

			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.formatEach(formatResult, outputWriter)
			.on('error', done)
			.on('finish', function () {
				// the stream should not have emitted an error
				expect(this._writableState.errorEmitted).to.equal(false);

				const fileCount = files.length - 1;// remove directory
				expect(formatCount).to.equal(fileCount);
				expect(writeCount).to.equal(fileCount);
				done();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should format all ESLint results in one batch with a custom writable stream', done => {
			const files = getFiles();
			let written = false;

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const writable = new Writable({objectMode: true})
			.on('error', done)
			.on('finish', () => {
				expect(written).to.be.true;
				done();
			});
			writable._write = function writeChunk(chunk, encoding, cb) {
				expect(chunk).to.have.string('Use the function form of \'use strict\'');
				written = true;
				cb();
			};

			const formatStream = gulpEslint.formatEach('stylish', writable);

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should catch and wrap format writer errors in a PluginError', done => {
			formatCount = 0;
			writeCount = 0;

			const files = getFiles();

			const lintStream = gulpEslint({useEslintrc: false, rules: {'strict': 2}})
			.on('error', done);

			const formatStream = gulpEslint.formatEach(formatResult, failWriter)
			.on('error', err => {
				expect(err).to.exists;
				expect(err.message).to.equal('Writer Test Error: 1 messages');
				expect(err.name).to.equal('TestError');
				expect(err.plugin).to.equal('gulp-eslint');
				done();
			})
			.on('finish', () => {
				done(new Error('Expected PluginError to fail stream'));
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

	});

});
