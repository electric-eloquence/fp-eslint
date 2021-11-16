'use strict';

const {Writable} = require('stream');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const File = require('vinyl');

const util = require('../../lib/gulp-eslint/util');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('gulp-eslint util', () => {
	describe('transform', () => {
		it('should handle files in a stream', done => {
			let passedFile = false;
			const streamFile = new File({
				path: 'test/fixtures/invalid.js',
				contents: Buffer.from('x = 1;')
			});
			const testStream = util.transform((file, enc, cb) => {
				expect(file).to.exist;
				expect(cb).to.exist;
				passedFile = (streamFile === file);
				cb();
			})
			.on('error', done)
			.on('finish', () => {
				expect(passedFile).to.be.true;
				done();
			});

			testStream.end(streamFile);
		});

		it('should flush when stream is ending', done => {
			let count = 0;
			let finalCount = 0;
			const files = [
				new File({
					path: 'test/fixtures/invalid.js',
					contents: Buffer.from('x = 1;')
				}),
				new File({
					path: 'test/fixtures/undeclared.js',
					contents: Buffer.from('x = 0;')
				})
			];
			const testStream = util.transform((file, enc, cb) => {
				expect(file).to.exist;
				expect(cb).to.exist;
				count += 1;
				cb();
			}, cb => {
				expect(cb).to.exists;
				expect(count).to.equal(files.length);
				expect(testStream._writableState.ending).to.be.true;
				finalCount = count;
				cb();
			})
			.on('error', done)
			.on('finish', () => {
				expect(finalCount).to.equal(files.length);
				done();
			});

			files.forEach(file => testStream.write(file));

			testStream.end();

		});

	});

	describe('createIgnoreResult', () => {
		it('should create a warning that the file is ignored by ".eslintignore"', () => {
			const file = new File({
				path: 'test/fixtures/ignored.js',
				contents: Buffer.from('')
			});
			const result = util.createIgnoreResult(file);
			expect(result).to.exist;
			expect(result.filePath).to.equal(file.path);
			expect(result.errorCount).to.equal(0);
			expect(result.warningCount).to.equal(1);
			expect(result.messages).to.be.instanceof(Array).and.have.length(1);
			expect(result.messages[0].message).to.equal('File ignored because of .eslintignore file');

		});

		it('should create a warning for paths that include "node_modules"', () => {
			const file = new File({
				path: 'node_modules/test/index.js',
				contents: Buffer.from('')
			});
			const result = util.createIgnoreResult(file);
			expect(result).to.exist;
			expect(result.filePath).to.equal(file.path);
			expect(result.errorCount).to.equal(0);
			expect(result.warningCount).to.equal(1);
			expect(result.messages).to.be.instanceof(Array).and.have.length(1);
			expect(result.messages[0].message).to.equal(
				'File ignored because it has a node_modules/** path'
			);

		});

	});

	describe('migrateOptions', () => {
		it('should migrate a string config value to "configPath"', () => {
			const options = util.migrateOptions('Config/Path');
			expect(options.overrideConfigFile).to.exist;
			expect(options.overrideConfigFile).to.equal('Config/Path');
		});
	});

	describe('isErrorMessage', () => {

		it('should determine severity a "fatal" message flag', () => {
			const errorMessage = {
				fatal: true,
				severity: 0
			};
			const isError = util.isErrorMessage(errorMessage);
			expect(isError).to.be.true;

		});

		it('should determine severity from an config array', () => {
			const errorMessage = {
				severity: [2, 1]
			};
			const isError = util.isErrorMessage(errorMessage);
			expect(isError).to.be.true;

		});

	});

	describe('resolveFormatter', () => {

		it('should default to the "stylish" formatter', async () => {

			const formatter = await util.resolveFormatter();
			expect(formatter.name).to.equal('stylish');

		});

		it('should resolve a formatter', async () => {

			const formatter = await util.resolveFormatter('tap');
			expect(formatter.name).to.equal('tap');

		});

		it('should throw an error if a formatter cannot be resolved', async () => {

			async function resolveMissingFormatter() {
				await util.resolveFormatter('missing-formatter');
			}
			expect(util.resolveFormatter('missing-formatter')).to.be.rejectedWith(Error, /There was a problem loading formatter/);

		});

	});

	describe('resolveWritable', () => {

		it('should default to fancyLog', () => {

			const write = util.resolveWritable();
			expect(write).to.equal(require('fancy-log'));

		});

		it('should write to a (writable) stream', done => {

			let written = false;
			const writable = new Writable({objectMode: true});
			const testValue = 'Formatted Output';
			const write = util.resolveWritable(writable);

			writable._write = function writeChunk(chunk, encoding, cb) {
				expect(chunk).to.exist;
				expect(chunk).to.equal(testValue);
				written = true;
				cb();
			};

			writable
			.on('error', done)
			.on('finish', () => {
				expect(written).to.be.true;
				done();
			});
			write(testValue);
			writable.end();

		});

	});

	describe('writeResults', () => {

		const testConfig = {},
			testResult = {
				config: testConfig
			},
			testResults = [testResult];

		it('should pass the value returned from the formatter to the writer', () => {

			const testValue = {};

			function testFormatter(results, config) {
				expect(results).to.exist;
				expect(results).to.equal(testResults);
				expect(config).to.exist;
				expect(config).to.equal(testConfig);

				return testValue;
			}

			function testWriter(value) {
				expect(value).to.exist;
				expect(value).to.equal(testValue);
			}

			util.writeResults(testResults, testFormatter, testWriter);

		});

		it('should not write an empty or missing value', () => {

			function testFormatter(results, config) {
				expect(results).to.exist;
				expect(results).to.equal(testResults);
				expect(config).to.exist;
				expect(config).to.equal(testConfig);

				return '';
			}

			function testWriter(value) {
				should.not.exist(value);
			}

			util.writeResults(testResults, testFormatter, testWriter);

		});

		it('should default undefined results to an empty array', () => {

			function testFormatter(results, config) {
				expect(results).to.exist;
				expect(results).to.be.instanceof(Array).and.have.length(0);
				expect(config).to.exist;

				return results.length + ' results';
			}

			function testWriter(value) {
				expect(value).to.exist;
				expect(value).to.equal('0 results');
			}

			util.writeResults(null, testFormatter, testWriter);

		});

	});

});
