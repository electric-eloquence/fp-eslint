/* global describe, it, beforeEach */
'use strict';

const fs = require('fs');
const {PassThrough} = require('stream');

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

let formatCount;
let formatEachCount;
let writeCount;

describe('gulp-eslint format', () => {

	/**
	 * Custom ESLint result formatter for counting format passes and
	 * returning an expected formatted result message.
	 *
	 * @param {Array} results - ESLint results
	 * @param {Object} config - format config
	 * @returns {String} formatted results
	 */
	function formatResults(results, config) {
		expect(config).to.exist;
		expect(results).to.exist;
		expect(results).to.be.instanceof(Array).and.have.length(3);
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

		const lintStream = gulpEslint({useEslintrc: false, rules: {strict: 'error'}});
		lintStream.on('error', done);

		gulpEslint.format(formatResults, outputWriter)
		.then(formatStream => {
			formatStream
			.on('error', done)
			.on('finish', () => {
				expect(formatCount).to.equal(1);
				expect(writeCount).to.equal(1);
				done();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => {
				lintStream.write(file);
			});
			lintStream.end();
		});
	});

	it('should not attempt to format when no linting results are found', done => {
		const files = getFiles();

		const passthruStream = new PassThrough({objectMode: true})
		.on('error', done);

		gulpEslint.format(formatResults, outputWriter)
		.then(formatStream => {
			formatStream
			.on('error', done)
			.on('finish', () => {
				expect(formatCount).to.equal(0);
				expect(writeCount).to.equal(0);
				done();
			});

			expect(passthruStream.pipe).to.exist;
			passthruStream.pipe(formatStream);

			files.forEach(file => {
				passthruStream.write(file);
			});
			passthruStream.end();
		});
	});

	it('should format to a WritableStream', done => {
		const files = getFiles();
		const logFile = 'test/format.log';
		const writableStream = fs.createWriteStream(logFile);
		const lintStream = gulpEslint({useEslintrc: false, rules: {strict: 'error'}});
		lintStream.on('error', done);

		gulpEslint.format('checkstyle', writableStream)
		.then(formatStream => {
			formatStream
			.on('error', done)
			.on('finish', function () {
				// the stream should not have emitted an error
				expect(this._writableState.errorEmitted).to.equal(false);
				expect(fs.existsSync(logFile)).to.be.true;

				writableStream.end();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		writableStream.on('finish', () => {
			expect(fs.existsSync(logFile)).to.be.true;

			const result = fs.readFileSync(logFile, 'utf8');

			expect(result.match(/<\?xml version="1.0" encoding="utf-8"\?>/g).length).to.equal(1);
			expect(result).to.have.string('use-strict.js');
			expect(result).to.have.string('undeclared.js');
			expect(result).to.have.string('passing.js');

			done();
		});
	});

});

describe('gulp-eslint formatEach', () => {

	/**
	 * Custom ESLint result formatter for counting format passes and
	 * returning an expected formatted result message.
	 *
	 * @param {Array} results - ESLint results
	 * @param {Object} config - format config
	 * @returns {String} formatted results
	 */
	function formatEachResult(results, config) {
		expect(config).to.exist;
		expect(results).to.exist;
		expect(results).to.be.instanceof(Array).and.have.length(1);
		formatEachCount++;

		return `${results.reduce((sum, result) => sum + result.messages.length, 0)} messages`;
	}

	it('should format each ESLint result separately', done => {
		formatEachCount = 0;
		writeCount = 0;

		const files = getFiles();

		const lintStream = gulpEslint({useEslintrc: false, rules: {strict: 'error'}})
		.on('error', done);

		gulpEslint.formatEach(formatEachResult, outputWriter)
		.then(formatEachStream => {
			formatEachStream
			.on('error', done)
			.on('finish', function () {
				// the stream should not have emitted an error
				expect(this._writableState.errorEmitted).to.equal(false);

				const fileCount = files.length - 1;// remove directory
				expect(formatEachCount).to.equal(fileCount);
				expect(writeCount).to.equal(fileCount);
				done();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatEachStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});
	});

	it('should catch and wrap format writer errors in a PluginError', done => {
		formatEachCount = 0;
		writeCount = 0;

		const files = getFiles();

		const lintStream = gulpEslint({useEslintrc: false, rules: {strict: 'error'}})
		.on('error', done);

		gulpEslint.formatEach(formatEachResult, failWriter)
		.then(formatEachStream => {
			formatEachStream
			.on('error', err => {
				expect(err).to.exist;
				expect(err.message).to.equal('Writer Test Error: 1 messages');
				expect(err.name).to.equal('TestError');
				expect(err.plugin).to.equal('gulp-eslint');
				done();
			})
			.on('finish', () => {
				done(new Error('Expected PluginError to fail stream'));
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatEachStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});
	});

	it('should formatEach to a WritableStream', done => {
		const files = getFiles();
		const logFile = 'test/formatEach.log';
		const writableStream = fs.createWriteStream(logFile);
		const lintStream = gulpEslint({useEslintrc: false, rules: {strict: 'error'}})
		.on('error', done);

		gulpEslint.formatEach('checkstyle', writableStream)
		.then(formatEachStream => {
			formatEachStream
			.on('error', done)
			.on('finish', function () {
				// the stream should not have emitted an error
				expect(this._writableState.errorEmitted).to.equal(false);
				expect(fs.existsSync(logFile)).to.be.true;

				writableStream.end();
			});

			expect(lintStream.pipe).to.exist;
			lintStream.pipe(formatEachStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		writableStream.on('finish', () => {
			expect(fs.existsSync(logFile)).to.be.true;

			const results = fs.readFileSync(logFile, 'utf8');

			expect(results.match(/<\?xml version="1.0" encoding="utf-8"\?>/g).length).to.equal(3);
			expect(results).to.have.string('use-strict.js');
			expect(results).to.have.string('undeclared.js');
			expect(results).to.have.string('passing.js');

			done();
		});
	});

});
