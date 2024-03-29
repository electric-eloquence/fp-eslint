'use strict';

const {EventEmitter} = require('events');
const {Transform} = require('stream');
const PluginError = require('plugin-error');
const fancyLog = require('fancy-log');
const {ESLint} = require('eslint');

/**
 * Convenience method for creating a transform stream in object mode
 *
 * @param {Function} transform - A function that is called for each stream chunk
 * @param {Function} [flush] - A function that is called before closing the stream
 * @returns {stream} A transform stream
 */
exports.transform = (transform, flush) => {
	if (typeof flush === 'function') {
		return new Transform({
			objectMode: true,
			transform,
			flush
		});
	}

	return new Transform({
		objectMode: true,
		transform
	});
};

/**
 * Mimic the ESLint class's createIgnoreResult function,
 * only without the ESLint CLI reference.
 *
 * @param {Object} file - file with a "path" property
 * @returns {Object} An ESLint report with an ignore warning
 */
exports.createIgnoreResult = file => {
	const filePath = file.path.replace(/\\/g, '/');
	return {
		filePath: file.path,
		messages: [{
			fatal: false,
			severity: 1,
			message: (file.path.includes('node_modules/') || file.path.includes('node_modules\\')) ?
				'File ignored because it has a node_modules/** path' :
				'File ignored because of .eslintignore file'
		}],
		errorCount: 0,
		warningCount: 1
	};
};

/**
 * Create config helper to allow backward compatibility for
 * deprecated configs.
 *
 * @param {Object} options - options to migrate
 * @returns {Object} migrated options
 */
exports.migrateOptions = options => {
	if (typeof options === 'string') {
		// basic config path overload: gulpEslint('path/to/config.json')
		options = {
			overrideConfigFile: options
		};
	} else {
		options.overrideConfig = options && typeof options.overrideConfig === 'object' && options.overrideConfig || {};
		options.overrideConfig.globals =
			options.overrideConfig.globals || (options.globals ? Object.assign({}, options.globals) : {});
		options.overrideConfig.rules =
			options.overrideConfig.rules || (options.rules ? Object.assign({}, options.rules) : {});
		if (options.envs && Array.isArray(options.envs)) {
			options.overrideConfig.env = {};
			options.envs.forEach(env => {
				if (typeof env === 'string') {
					options.overrideConfig.env[env] = true;
				}
			});
		}
		if (options.plugins && Array.isArray(options.plugins)) {
			options.overrideConfig.plugins = options.plugins;
			delete options.plugins;
		}
		options.overrideConfigFile = options.overrideConfigFile || options.configFile;
		delete options.globals;
		delete options.rules;
		delete options.envs;
		delete options.configFile;
	}

	return options;
};

/**
 * Ensure that callback errors are wrapped in a gulp PluginError
 *
 * @param {Function} callback - callback to wrap
 * @param {Object} [value=] - A value to pass to the callback
 * @returns {Function} A callback to call(back) the callback
 */
exports.handleCallback = (callback, value) => {
	return error => {
		if (error != null && !(error instanceof PluginError)) {
			error = new PluginError(error.plugin || 'gulp-eslint', error, {
				showStack: (error.showStack !== false)
			});
		}

		callback(error, value);
	};
};

/**
 * Call sync or async action and handle any sync or async error
 *
 * @param {Function} action - Result action to call
 * @param {(Object|Array)} result - An ESLint result or result list
 */
exports.tryResultAction = (action, result, done) => {
	try {
		const retVal = action(result);

		if (retVal && typeof retVal.then === 'function') {
			retVal.then(() => done())
				.catch(error => {
					done(error == null ? new Error('Unknown Error') : error);
				});
		} else {
			done();
		}
	} catch (error) {
		done(error == null ? new Error('Unknown Error') : error);
	}
};

/**
 * Get first message in an ESLint result to meet a condition
 *
 * @param {Object} result - An ESLint result
 * @param {Function} condition - A condition function that is passed a message and returns a boolean
 * @returns {Object} The first message to pass the condition or null
 */
exports.firstResultMessage = (result, condition) => {
	if (!result.messages) {
		return null;
	}

	return result.messages.find(condition);
};

/**
 * Determine if a message is an error
 *
 * @param {Object} message - an ESLint message
 * @returns {Boolean} whether the message is an error message
 */
function isErrorMessage(message) {
	const level = message.fatal ? 2 : message.severity;

	if (Array.isArray(level)) {
		return level[0] > 1;
	}

	return level > 1;
}
exports.isErrorMessage = isErrorMessage;

/**
 * Resolve formatter from unknown type (accepts string or function)
 *
 * @throws TypeError thrown if unable to resolve the formatter type
 * @param {(String|Function)} [formatter=stylish] - A name to resolve as a formatter. If a function is provided, the same function is returned.
 * @param {Object} eslintInstance - An instance of the ESLint class.
 * @returns {Function} An ESLint formatter
 */
exports.resolveFormatter = async (formatter = 'stylish', eslintInstance) => {
	let formatterObj;
	if (typeof formatter === 'function') {
		formatterObj = {format: formatter};
		formatterObj.name = formatter.name;
	} else {
		// use ESLint to look up formatter references
		eslintInstance = eslintInstance || new ESLint();
		// load formatter (module, relative to cwd, ESLint formatter)
		formatterObj = await eslintInstance.loadFormatter(formatter);
		formatterObj.name = formatter;
	}

	return formatterObj;
};

/**
 * Resolve writable
 *
 * @param {(Function|stream)} [writable_=fancyLog] - A stream or function to resolve as a format writer
 * @param {Object} gulpEslint - A gulp-eslint instance
 * @returns {Function} A function that writes formatted messages
 */
exports.resolveWritable = (writable_, gulpEslint) => {
	let writable;

	if (!writable_) {
		writable = fancyLog;
	} else if (typeof writable_.write === 'function' && typeof writable_.end === 'function') {
		writable = writable_.write.bind(writable_);
		gulpEslint.writable = gulpEslint.writable || writable;
	} else {
		writable = writable_;
	}

	if (!gulpEslint.writable) {
		gulpEslint.writable = new EventEmitter();
		gulpEslint.writable.write = writable;
		gulpEslint.writable.end = () => gulpEslint.writable.emit('finish');
	}

	return writable;
};

/**
 * Write formatter results to writable/output
 *
 * @param {Object[]} results - A list of ESLint results
 * @param {String} [formatter=stylish] - The name of a ESLint result formatter
 * @param {Function} writable - A function used to write formatted ESLint results
 * @param {Object} linter - ESLint instance
 */
exports.writeResults = async (results, formatter, writable, linter) => {
	const eslintInstance = linter || new ESLint();
	const firstResult = results.find(result => result.config);
	const {format} = await exports.resolveFormatter(formatter, eslintInstance);
	const message = format(results, firstResult ? firstResult.config : {});

	if (writable && message != null && message !== '') {
		writable(message);
	}
};

/**
 * Write formatter results to writable/output synchronously
 *
 * @param {Object[]} results - A list of ESLint results
 * @param {Function} formatter - The function for a ESLint result formatter
 * @param {Function} writable - A function used to write formatted ESLint results
 * @param {Object} linter - ESLint instance
 */
exports.writeResultsSync = (results, formatter, writable) => {
	const firstResult = results.find(result => result.config);
	const message = formatter(results, firstResult ? firstResult.config : {});

	if (writable && message != null && message !== '') {
		writable(message);
	}
};
