'use strict';

const PluginError = require('plugin-error');
const {ESLint} = require('eslint');
const {
	createIgnoreResult,
	filterResult,
	firstResultMessage,
	handleCallback,
	isErrorMessage,
	migrateOptions,
	resolveWritable,
	transform,
	tryResultAction,
	writeResults,
	writeResultsSync
} = require('./util');
const {relative} = require('path');
const {Writable} = require('stream');
let linter;

/**
 * Append ESLint result to each file
 *
 * @param {(Object|String)} [options] - Configure rules, env, global, and other options for running ESLint
 * @returns {stream} gulp file stream
 */
function gulpEslint(options) {
	const quiet = Boolean(options.quiet);
	const warnIgnored = options.warnFileIgnored;
	delete options.quiet;
	delete options.warnFileIgnored;
	options = migrateOptions(options) || {};
	linter = new ESLint(options);

	return transform((file, enc, cb) => {
		const filePath = relative(process.cwd(), file.path);

		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new PluginError('gulp-eslint', 'gulp-eslint doesn\'t support vinyl files with Stream contents.'));
			return;
		}

		linter.isPathIgnored(filePath)
			.then((isPathIgnored) => {
				if (isPathIgnored) {
					// Note:
					// Vinyl files can have an independently defined cwd, but ESLint works relative to `process.cwd()`.
					// (https://github.com/gulpjs/gulp/blob/master/docs/recipes/specifying-a-cwd.md)
					// Also, ESLint doesn't adjust file paths relative to an ancestory .eslintignore path.
					// E.g., If ../.eslintignore has "foo/*.js", ESLint will ignore ./foo/*.js, instead of ../foo/*.js.
					// Eslint rolls this into `ESLint.lintText`. So, gulp-eslint must account for this limitation.

					if (warnIgnored) {
						// Warn that gulp.src is needlessly reading files that ESLint ignores.
						return linter.lintText(file.contents.toString(), {filePath, warnIgnored});
					} else {
						return Promise.resolve();
					}
				} else {
					return linter.lintText(file.contents.toString(), {filePath});
				}
			})
			.then((results_) => {
				// Get errors and not warnings if options.quiet == true.
				const results = quiet ? ESLint.getErrorResults(results_) : results_;
				file.eslint = Array.isArray(results) ? results[0] : void 0;

				// Update the fixed output; otherwise, fixable messages are simply ignored.
				if (file.eslint && file.eslint.hasOwnProperty('output')) {
					file.contents = Buffer.from(file.eslint.output);
					file.eslint.fixed = true;
				}
				cb(null, file);
			})
			.catch((error) => {
				cb(new PluginError('gulp-eslint', error));
			});
	});
}

/**
 * Handle each ESLint result as it passes through the stream.
 *
 * @param {Function} action - A function to handle ESLint result
 * @param {(Function|Stream)} [writable=fancy-log] - A function or stream to write the formatted ESLint results.
 * @returns {stream} gulp file stream
 */
gulpEslint.result = (action, writable) => {
	if (typeof action !== 'function' && typeof secondary !== 'function') {
		throw new Error('Expected callable argument');
	}

	return transform((file, enc, done) => {
		if (typeof action === 'function' && file.eslint) {
			tryResultAction(action, file.eslint, handleCallback(done, file));
		} else {
			done(null, file);
		}
	}, done => {
		if (writable && typeof writable.end === 'function') {
			writable.end();
		}
		done();
	});
};

/**
 * Handle all ESLint results at the end of the stream.
 *
 * @param {Function} action - A function to handle all ESLint results
 * @param {(Function|Stream)} [writable=fancy-log] - A function or stream to write the formatted ESLint results.
 * @returns {stream} gulp file stream
 */
gulpEslint.results = (action, writable) => {
	if (typeof action !== 'function') {
		throw new Error('Expected callable argument');
	}

	const results = [];
	results.errorCount = 0;
	results.warningCount = 0;

	return transform((file, enc, done) => {
		if (file.eslint) {
			results.push(file.eslint);
			// collect total error/warning count
			results.errorCount += file.eslint.errorCount;
			results.warningCount += file.eslint.warningCount;
		}
		done(null, file);

	}, done => {
		tryResultAction(action, results, (error) => {
			if (error) {
				done(error);
				return;
			}

			if (writable && typeof writable.end === 'function') {
				writable.end();
			}
			done();
		});
	});
};

/**
 * Fail when an ESLint error is found in ESLint results.
 *
 * @returns {stream} gulp file stream
 */
gulpEslint.failOnError = () => {
	return gulpEslint.result(result => {
		const error = firstResultMessage(result, isErrorMessage);
		if (!error) {
			return;
		}

		throw new PluginError('gulp-eslint', {
			name: 'ESLintError',
			fileName: result.filePath,
			message: error.message,
			lineNumber: error.line
		});
	});
};

/**
 * Fail when the stream ends if any ESLint error(s) occurred
 *
 * @returns {stream} gulp file stream
 */
gulpEslint.failAfterError = () => {
	return gulpEslint.results(results => {
		const count = results.errorCount;
		if (!count) {
			return;
		}

		throw new PluginError('gulp-eslint', {
			name: 'ESLintError',
			message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors')
		});
	});
};

/**
 * Format the results of each file individually.
 * The defaults 'stylish' and 'fancy-log' are set in resolveFormatter() and resolveWritable() respectively.
 *
 * @param {(String|Function)} [formatter=stylish] - The name or function for a ESLint result formatter
 * @param {(Function|Stream)} [writable_=fancy-log] - A function or stream to write the formatted ESLint results.
 * @returns {stream} gulp file stream
 */
gulpEslint.formatEach = (formatter = 'stylish', writable_) => {
	const writable = resolveWritable(writable_, gulpEslint);

	return gulpEslint.result(result => {
		if (typeof formatter === 'function') {
			writeResultsSync([result], formatter, writable);
		} else {
			return writeResults([result], formatter, writable, linter);
		}
	}, writable_);
};

/**
 * Wait until all files have been linted and format all results at once.
 * The defaults 'stylish' and 'fancy-log' are set in resolveFormatter() and resolveWritable() respectively.
 *
 * @param {(String|Function)} [formatter=stylish] - The name or function for a ESLint result formatter
 * @param {(Function|stream)} [writable_=fancy-log] - A function or stream to write the formatted ESLint results.
 * @returns {stream} gulp file stream
 */
gulpEslint.format = (formatter = 'stylish', writable_) => {
	const writable = resolveWritable(writable_, gulpEslint);

	return gulpEslint.results(results => {
		// Only format results if files has been linted
		if (results.length) {
			if (typeof formatter === 'function') {
				writeResultsSync(results, formatter, writable);
			} else {
				return writeResults(results, formatter, writable, linter);
			}
		}
	}, writable_);
};

gulpEslint.writable = null;

module.exports = gulpEslint;
