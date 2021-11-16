# ESLint extension for <a href="https://fepper.io" target="_blank">Fepper</a> client-side JavaScript

#### Also an up-to-date drop-in replacement for gulp-eslint

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Linux Build Status][linux-image]][linux-url]
[![Mac Build Status][mac-image]][mac-url]
[![Windows Build Status][windows-image]][windows-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

Given <a href="https://github.com/adametry/gulp-eslint/issues/266" target="_blank">
the apparent abandonment of gulp-eslint</a>, this package now supports streaming 
ESLint through gulp, independent of 
<a href="https://github.com/electric-eloquence/fepper#readme" target="_blank">Fepper</a>.

Both 
<a href="https://github.com/electric-eloquence/gulp" target="_blank">
gulp 3 LTS</a> and gulp 4 are supported.

fp-eslint 8 supports ESLint 8.

## Use as a drop-in replacement for gulp-eslint:

```javascript
const {src, task} = require('gulp');
const fpEslint = require('fp-eslint');

task('default', () => {
  return src(['scripts/*.js'])
    // fpEslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(fpEslint())
    // fpEslint.format() outputs the lint results to the console.
    // Alternatively use fpEslint.formatEach().
    .pipe(fpEslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(fpEslint.failAfterError());
});
```

Or use the plugin API to do things like:

```javascript
gulp.src(['**/*.js', '!node_modules/**'])
  .pipe(fpEslint({
    overrideConfig: {
      rules: {
        'my-custom-rule': 'warn',
        'strict': ['error', 'function']
      },
      globals: [
        'jQuery',
        '$'
      ],
      envs: [
        'browser'
      ]
    }
  }))
  .pipe(fpEslint.formatEach('compact', process.stderr));
```

### API

#### fpEslint()

*No explicit configuration.* ESLint will attempt to find the configuration file 
by the name of `.eslintrc.*` within the same directory as the file to be linted. 
If not found there, parent directories will be searched until `.eslintrc.*` is 
found or the current working directory is reached.

#### fpEslint(options)

Type: `Object`

If the argument to `fpEslint` is an object, `fpEslint` will pass it to the 
<a href="https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions" target="_blank">
ESLint class</a> for instantiation. Please consult the ESLint docs for the 
supported options.

#### fpEslint(configFilePath)

Type: `String`

Shorthand for defining `options.overrideConfigFile`.

#### fpEslint.result(action)

Type: `function (result) {}`

Call a function for each ESLint file result. No returned value is expected. If 
an error is thrown, it will be wrapped in a Gulp PluginError and emitted from 
the stream.

```javascript
gulp.src(['**/*.js','!node_modules/**'])
  .pipe(fpEslint())
  .pipe(fpEslint.result((result) => {
      // Called for each ESLint result.
      console.log(`ESLint result: ${result.filePath}`);
      console.log(`# Messages: ${result.messages.length}`);
      console.log(`# Warnings: ${result.warningCount}`);
      console.log(`# Errors: ${result.errorCount}`);
  }));
```

Type: `function (result, callback) { callback(error); }`

Call an asynchronous function for each ESLint file result. The callback must be 
called for the stream to finish. If a value is passed to the callback, it will 
be wrapped in a Gulp PluginError and emitted from the stream.

#### fpEslint.results(action)

Type: `function (results) {}`

Call a function once for all ESLint file results before a stream finishes. No 
returned value is expected. If an error is thrown, it will be wrapped in a Gulp 
PluginError and emitted from the stream.

The results list has a "warningCount" property that is the sum of warnings in 
all results; likewise, an "errorCount" property is set to the sum of errors in 
all results.

```javascript
gulp.src(['**/*.js', '!node_modules/**'])
  .pipe(fpEslint())
  .pipe(fpEslint.results((results) => {
      // Called once for all ESLint results.
      console.log(`Total Results: ${results.length}`);
      console.log(`Total Warnings: ${results.warningCount}`);
      console.log(`Total Errors: ${results.errorCount}`);
  }));
```

Type: `function (results, callback) {callback(error);}`

Call an asynchronous function once for all ESLint file results before a stream 
finishes. The callback must be called for the stream to finish. If a value is 
passed to the callback, it will be wrapped in a Gulp PluginError and emitted 
from the stream.

#### fpEslint.failOnError()

Stop a task/stream if an ESLint error has been reported for any file.

```javascript
// Cause the stream to stop(/fail) before copying an invalid JS file
// to the output directory
gulp.src(['**/*.js', '!node_modules/**'])
  .pipe(fpEslint())
  .pipe(fpEslint.failOnError());
```

#### fpEslint.failAfterError()

Stop a task/stream if an ESLint error has been reported for any file, but wait 
for all of them to be processed first.

```javascript
// Cause the stream to stop(/fail) when the stream ends if any
// ESLint error(s) occurred.
gulp.src(['**/*.js', '!node_modules/**'])
  .pipe(fpEslint())
  .pipe(fpEslint.failAfterError());
```

#### fpEslint.format(formatter, output)

Format all linted files once. This should be used in the stream after piping 
through `fpEslint`; otherwise, this will find no ESLint results to format.

The `formatter` argument may be a `String`, `Function`, or `undefined`. As a 
`String`, a formatter module by that name or path will be resolved as a module, 
relative to `process.cwd()`, or as one of the 
<a href="https://eslint.org/docs/user-guide/formatters/" target="_blank">
ESLint-provided formatters</a>. If `undefined`, the ESLint “stylish” formatter 
will be resolved. A `Function` will be called with an `Array` of file linting 
results to format.

```javascript
// Use the default "stylish" ESLint formatter.
fpEslint.format()

// Use the "checkstyle" ESLint formatter.
fpEslint.format('checkstyle')

// Use the "eslint-path-formatter" module formatter.
// (@see https://github.com/Bartvds/eslint-path-formatter)
fpEslint.format('node_modules/eslint-path-formatter')
```

The `output` argument may be a `WritableStream`, `Function`, or `undefined`. As 
a `WritableStream`, the formatter results will be written to the stream. A 
`Function` will be called with the formatter results as the only parameter. If 
`undefined`, the formatter results will be written to stdout.

```javascript
const streamToFile = fpEslint();
const streamToStdout = fpEslint();

// Write to stdout. 
fpEslint.format();

// Create a WritableStream example.
const fs = require('fs');
const writableStream = fs.createWriteStream('example.txt');

// Write to WritableStream.
fpEslint.format('junit', writableStream)
```

#### fpEslint.formatEach(formatter, output)

Format each linted file individually. This should be used in the stream after 
piping through `fpEslint`; otherwise, this will find no ESLint results to 
format.

The arguments for `formatEach` are the same as the arguments for `format`.

### Ignore Files

ESLint will detect a `.eslintignore` file for the purpose of ignoring files that 
are not meant to be linted.  
<a href="https://eslint.org/docs/user-guide/configuring/ignoring-code#the-eslintignore-file" target="_blank">
How to get ESLint to ignore files</a>.

#### options.warnFileIgnored

Type: `Boolean`

When `true`, this will add a result when ESLint finds errors in an ignored file. 
This can be used to warn when files are needlessly loaded by `gulp.src`. For 
example, since ESLint automatically ignores `node_modules` file paths and 
gulp.src does not, a gulp task may take seconds longer just reading files from 
a `node_modules` directory.

This option may be passed in JavaScript when calling `fpEslint(options)` or it 
may be written into Fepper's `pref.yml` file as documented below.

#### options.quiet

Type: `Boolean`

When `true`, this will filter warning messages from ESLint results. This mimics 
the ESLint CLI 
<a href="https://eslint.org/docs/user-guide/command-line-interface#--quiet" target="_blank">
--quiet option</a>.

This option may be passed in JavaScript when calling `fpEslint(options)` or it 
may be written into Fepper's `pref.yml` file as documented below.

## Use as a Fepper extension:

```bash
cd extend
npm i --save-dev fp-esllint
```

Use this package to lint the JavaScript in your 
`source/_scripts/src` directory.

Add these tasks to `extend/contrib.js`

* Under gulp task 'contrib:frontend-copy'
  * 'eslint'
* Under gulp task 'contrib:once'
  * 'eslint'

On the command line:

```shell
fp eslint
```

Fepper does not ship with a `.eslintrc.json` file intended for end-users. This 
extension does not either. (It would be far too opinionated for distribution.) 
Create one specific to your project and customize it to your needs: 
<a href="https://eslint.org/docs/user-guide/configuring/" target="_blank">
Configuring ESLint</a>.

You can customize further by writing ESLint configurations to your `pref.yml` 
file. fp-eslint was originally compatible with the 
<a href="https://github.com/adametry/gulp-eslint#eslintoptions" target="_blank">
gulp-eslint</a> API. However, it looks like gulp-eslint has been abandoned 
and may never be made compatible with the latest ESLint. Therefore, any old 
`pref.yml` options for fp-eslint must be updated according to the following 
API in order to work with this version of fp-eslint:

```yaml
eslint:
  overrideConfigFile: another/location/.eslintrc.json
  overrideConfig:
    rules:
      strict:
        - error
        - function
  failOnError: true
  formatEach: checkstyle
```

The YAML under `eslint` must match the 
<a href="https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions" target="_blank">
ESLint constructor options</a> as documented by ESLint.

A few additional fp-eslint options are holdovers from the gulp-eslint API:

### failOnError

Type: `Boolean`

When `true`, will stop a task/stream if an ESLint error has been reported for 
any file.

### failAfterError

Type: `Boolean`

When `true`, will stop a task/stream if an ESLint error has been reported for 
any file, but will wait for all of them to be processed first.

### format

Type: `String`

Will format all linted files at once as per the formatter specified by the 
string option value.

### formatEach

Type: `String`

Will format each linted file individually as per the formatter specified by the 
string option value.

[snyk-image]: https://snyk.io/test/github/electric-eloquence/fp-eslint/master/badge.svg
[snyk-url]: https://snyk.io/test/github/electric-eloquence/fp-eslint/master

[linux-image]: https://github.com/electric-eloquence/fp-eslint/workflows/Linux%20build/badge.svg?branch=master
[linux-url]: https://github.com/electric-eloquence/fp-eslint/actions?query=workflow%3A"Linux+build"

[mac-image]: https://github.com/electric-eloquence/fp-eslint/workflows/Mac%20build/badge.svg?branch=master
[mac-url]: https://github.com/electric-eloquence/fp-eslint/actions?query=workflow%3A"Mac+build"

[windows-image]: https://github.com/electric-eloquence/fp-eslint/workflows/Windows%20build/badge.svg?branch=master
[windows-url]: https://github.com/electric-eloquence/fp-eslint/actions?query=workflow%3A"Windows+build"

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/fp-eslint/master.svg
[coveralls-url]: https://coveralls.io/r/electric-eloquence/fp-eslint

[license-image]: https://img.shields.io/github/license/electric-eloquence/fp-eslint.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/fp-eslint/master/LICENSE
