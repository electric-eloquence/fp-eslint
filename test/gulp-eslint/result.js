'use strict';

const {PassThrough} = require('stream');

const {expect} = require('chai');
const File = require('vinyl');

const gulpEslint = require('../../lib/gulp-eslint');

describe('gulp-eslint result', () => {
	it('should provide an ESLint result', done => {
		let resultCount = 0;
		const lintStream = gulpEslint({
			useEslintrc: false,
			rules: {
				'no-undef': 'error',
				strict: ['warn', 'global']
			}
		});

		lintStream
		.pipe(gulpEslint.result(result => {
			expect(result).to.exist;
			expect(result.messages).to.be.instanceof(Array);
			expect(result.messages).to.have.lengthOf(2);
			expect(result.errorCount).to.equal(1);
			expect(result.warningCount).to.equal(1);
			resultCount++;
		}))
		.on('finish', () => {
			expect(resultCount).to.equal(3);
			done();
		});

		lintStream.write(new File({
			path: 'test/fixtures/invalid-1.js',
			contents: Buffer.from('x = 1;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-2.js',
			contents: Buffer.from('x = 2;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-3.js',
			contents: Buffer.from('x = 3;')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		gulpEslint.result(() => {
			throw new Error('Expected Error');
		})
		.on('error', function (error) {
			this.removeListener('finish', finished);
			expect(error).to.exist;
			expect(error.message).to.equal('Expected Error');
			expect(error.name).to.equal('Error');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should catch thrown null', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		gulpEslint.result(() => {
			throw null;
		})
		.on('error', function (error) {
			this.removeListener('finish', finished);
			expect(error).to.exist;
			expect(error.message).to.equal('Unknown Error');
			expect(error.name).to.equal('Error');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should throw an error if not provided a function argument', () => {

		try {
			gulpEslint.result();
		} catch (error) {
			expect(error).to.exist;
			expect(error.message).to.exist;
			expect(error.message).to.equal('Expected callable argument');
			return;
		}

		throw new Error('Expected exception to be thrown');

	});

	it('should ignore files without an ESLint result', done => {

		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});

		gulpEslint.result(() => {
			throw new Error('Expected no call');
		})
		.on('error', function (error) {
			this.removeListener('finish', done);
			done(error);
		})
		.on('finish', done)
		.end(file);
	});

});

describe('gulp-eslint results', () => {

	it('should provide ESLint results', done => {
		let resultsCalled = false;
		const lintStream = gulpEslint({
			useEslintrc: false,
			rules: {
				'no-undef': 'error',
				strict: ['warn', 'global']
			}
		});

		lintStream
		.pipe(gulpEslint.results(results => {
			expect(results).to.exist;
			expect(results).to.be.instanceof(Array);
			expect(results).to.have.lengthOf(3);
			expect(results.errorCount).to.equal(3);
			expect(results.warningCount).to.equal(3);
			resultsCalled = true;
		}))
		.on('finish', () => {
			expect(resultsCalled).to.be.true;
			done();
		});

		lintStream.write(new File({
			path: 'test/fixtures/invalid-1.js',
			contents: Buffer.from('x = 1;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-2.js',
			contents: Buffer.from('x = 2;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-3.js',
			contents: Buffer.from('x = 3;')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		gulpEslint.results(() => {
			throw new Error('Expected Error');
		})
		.on('error', function (error) {
			this.removeListener('finish', finished);
			expect(error).to.exist;
			expect(error.message).to.equal('Expected Error');
			expect(error.name).to.equal('Error');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should catch async thrown errors', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		gulpEslint.results(async () => {
			throw new Error('Expected Error');
		})
		.on('error', function (error) {
			this.removeListener('finish', finished);
			expect(error).to.exist;
			expect(error.message).to.equal('Expected Error');
			expect(error.name).to.equal('Error');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should throw an error if not provided a function argument', () => {

		try {
			gulpEslint.results();
		} catch (error) {
			expect(error).to.exist;
			expect(error.message).to.exists;
			expect(error.message).to.equal('Expected callable argument');
			return;
		}

		throw new Error('Expected exception to be thrown');

	});

	it('should ignore files without an ESLint result', done => {
		let resultsCalled = false;
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});

		function finished() {
			expect(resultsCalled).to.be.true;
			done();
		}

		gulpEslint.results(results => {
			expect(results).to.exist;
			expect(results).to.be.instanceof(Array);
			expect(results).to.have.lengthOf(0);
			resultsCalled = true;
		})
		.on('error', function (error) {
			this.removeListener('finish', finished);
			done(error);
		})
		.on('finish', finished)
		.end(file);
	});

});
