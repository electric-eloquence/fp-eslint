/* global describe, it*/
'use strict';

const path = require('path');

const {expect} = require('chai');
const File = require('vinyl');
const stringToStream = require('from2-string');

const gulpEslint = require('../../lib/gulp-eslint');

describe('gulp-eslint plugin', () => {
	it('should configure an alternate parser', done => {
		gulpEslint({
			useEslintrc: false,
			overrideConfig: {
				parser: '@babel/eslint-parser',
				rules: {'prefer-template': 'error'}
			}
		})
		.on('error', done)
		.on('data', file => {
			expect(file).to.exist;
			expect(file.contents).to.exist;
			expect(file.eslint).to.exist;
			expect(file.eslint).to.have.property('filePath', path.resolve('test/gulp-eslint/fixtures/stage0-class-property.js'));

			expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(1);

			expect(file.eslint.messages[0]).to.have.property('message');
			expect(file.eslint.messages[0]).to.have.property('line')
			expect(file.eslint.messages[0]).to.have.property('column')

			done();
		})
		.end(new File({
			path: 'test/gulp-eslint/fixtures/stage0-class-property.js',
			contents: Buffer.from('class MyClass {prop = a + "b" + c;}')
		}));
	});

	it('should support sharable config', done => {
		gulpEslint(path.resolve(__dirname, 'fixtures', 'eslintrc-sharable-config.js'))
		.on('error', done)
		.on('data', file => {
			expect(file).to.exist;
			expect(file.contents).to.exist;
			expect(file.eslint).to.exist;

			expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(2);

			expect(file.eslint.messages[0]).to.have.property('message')
			expect(file.eslint.messages[0]).to.have.property('line')
			expect(file.eslint.messages[0]).to.have.property('column')
			expect(file.eslint.messages[0]).to.have.property('ruleId', 'no-console');

			expect(file.eslint.messages[1]).to.have.property('message')
			expect(file.eslint.messages[1]).to.have.property('line')
			expect(file.eslint.messages[1]).to.have.property('column')
			expect(file.eslint.messages[1]).to.have.property('ruleId', 'eol-last');

			done();
		})
		.end(new File({
			path: 'test/gulp-eslint/fixtures/no-newline.js',
			contents: Buffer.from('console.log(\'Hi\');')
		}));
	});

	it('should produce expected message via buffer', done => {
		gulpEslint({useEslintrc: false, overrideConfig: {rules: {semi: ['error', 'never']}}})
		.on('error', done)
		.on('data', file => {
			expect(file).to.exist;
			expect(file.contents).to.exist;
			expect(file.eslint).to.exist;
			expect(file.eslint).to.have.property('filePath', path.resolve('test/gulp-eslint/fixtures/never-semicolon.js'));

			expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(1);

			expect(file.eslint.messages[0]).to.have.property('message');
			expect(file.eslint.messages[0]).to.have.property('line');
			expect(file.eslint.messages[0]).to.have.property('column');
			expect(file.eslint.messages[0]).to.have.property('ruleId', 'semi');

			done();
		})
		.end(new File({
			path: 'test/gulp-eslint/fixtures/never-semicolon.js',
			contents: Buffer.from('var x = 1;')
		}));
	});

	it('should ignore files with null content', done => {
		gulpEslint({useEslintrc: false, overrideConfig: {rules: {strict: 'error'}}})
		.on('error', done)
		.on('data', file => {
			expect(file).to.exist;
			expect(file.contents).to.not.exist;
			expect(file.eslint).to.not.exist;
			done();
		})
		.end(new File({
			path: 'test/gulp-eslint/fixtures',
			isDirectory: true
		}));
	});

	it('should emit an error when it takes a steam content', done => {
		gulpEslint({useEslintrc: false, overrideConfig: {rules: {strict: 'error'}}})
		.on('error', err => {
			expect(err.plugin).to.equal('gulp-eslint');
			expect(err.message).to.equal('gulp-eslint doesn\'t support vinyl files with Stream contents.');
			done();
		})
		.end(new File({
			path: 'test/gulp-eslint/fixtures/stream.js',
			contents: stringToStream('')
		}));
	});

	it('should emit an error when it fails to load a plugin', done => {
		const pluginName = 'this-is-unknown-plugin';
		gulpEslint({useEslintrc: false, plugins: [pluginName]})
		.on('error', err => {
			expect(err.plugin).to.equal('gulp-eslint');
			// Remove stack trace from error message as it's machine-dependent
			const message = err.message.split('\n')[0];
			expect(message).to.equal(`Failed to load plugin '${pluginName}' declared in 'CLIOptions': Cannot find module 'eslint-plugin-${
				pluginName
			}'`);

			done();
		})
		.end(new File({
			path: 'test/gulp-eslint/fixtures/file.js',
			contents: Buffer.from('')
		}));
	});

	describe('"warnFileIgnored" option', () => {

		it('when true, should warn when a file is ignored by .eslintignore', done => {
			gulpEslint({useEslintrc: false, warnFileIgnored: true})
			.on('error', done)
			.on('data', file => {
				expect(file).to.exist;
				expect(file.eslint).to.exist;
				expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(1);
				expect(file.eslint.messages[0])
				.to.have.property('message', 'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.');
				expect(file.eslint.errorCount).to.equal(0);
				expect(file.eslint.warningCount).to.equal(1);
				done();
			})
			.end(new File({
				path: 'test/gulp-eslint/fixtures/ignored.js',
				contents: Buffer.from('(function () {ignore = abc;}});')
			}));
		});

		it('when true, should warn when a "node_modules" file is ignored', done => {
			gulpEslint({useEslintrc: false, warnFileIgnored: true})
			.on('error', done)
			.on('data', file => {
				expect(file).to.exist;
				expect(file.eslint).to.exist;
				expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(1);
				expect(file.eslint.messages[0]).to.have.property('message',
					'File ignored by default. Use "--ignore-pattern \'!node_modules/*\'" to override.');
				expect(file.eslint.errorCount).to.equal(0);
				expect(file.eslint.warningCount).to.equal(1);
				done();
			})
			.end(new File({
				path: 'node_modules/test/index.js',
				contents: Buffer.from('(function () {ignore = abc;}});')
			}));
		});

		it('when not true, should silently ignore files', done => {
			gulpEslint({useEslintrc: false, warnFileIgnored: false})
			.on('error', done)
			.on('data', file => {
				expect(file).to.exist;
				expect(file.eslint).to.not.exist;
				done();
			})
			.end(new File({
				path: 'test/gulp-eslint/fixtures/ignored.js',
				contents: Buffer.from('(function () {ignore = abc;}});')
			}));
		});

	});

	describe('"quiet" option', () => {

		it('when true, should remove warnings', done => {
			gulpEslint({useEslintrc: false, quiet: true, overrideConfig: {rules: {'no-undef': 'warn', strict: 'error'}}})
			.on('data', file => {
				expect(file).to.exist;
				expect(file.eslint).to.exist;
				expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(1);
				expect(file.eslint.errorCount).to.equal(1);
				expect(file.eslint.warningCount).to.equal(0);
				done();
			})
			.end(new File({
				path: 'test/gulp-eslint/fixtures/invalid.js',
				contents: Buffer.from('function z() { x = 0; }')
			}));
		});

	});

	describe('"fix" option', () => {

		it('when true, should update buffered contents', done => {
			gulpEslint({useEslintrc: false, fix: true, overrideConfig: {rules: {'no-trailing-spaces': 'error'}}})
			.on('error', done)
			.on('data', (file) => {
				expect(file).to.exist;
				expect(file.eslint).to.exist;
				expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(0);
				expect(file.eslint.errorCount).to.equal(0);
				expect(file.eslint.warningCount).to.equal(0);
				expect(file.eslint.output).to.equal('var x = 0;');
				expect(file.contents.toString()).to.equal('var x = 0;');
				done();
			})
			.end(new File({
				path: 'test/gulp-eslint/fixtures/fixable.js',
				contents: Buffer.from('var x = 0; ')
			}));
		});
	});

	describe('"envs" option', () => {

		it('when submitted per old api, should be migrated to new api', done => {
			gulpEslint({
				useEslintrc: false,
				envs: ['browser'],
				overrideConfig: {rules: {strict: 'error'}}
			})
			.on('error', done)
			.on('data', (file) => {
				expect(file).to.exist;
				expect(file.eslint).to.exist;
				expect(file.eslint.messages).to.be.instanceof(Array).and.have.length(1);
				expect(file.eslint.messages[0]).to.have.property('message',
					'Use the function form of \'use strict\'.');
				expect(file.eslint.errorCount).to.equal(1);
				expect(file.eslint.warningCount).to.equal(0);
				done();
			})
			.end(new File({
				path: 'test/gulp-eslint/fixtures/envs.js',
				contents: Buffer.from('"use strict";')
			}));
		});
	});

});
