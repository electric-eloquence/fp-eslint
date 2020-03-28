# ESLint extension for Fepper client-side JavaScript

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Linux Build Status][linux-image]][linux-url]
[![Mac Build Status][mac-image]][mac-url]
[![Windows Build Status][windows-image]][windows-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

This extension will lint the JavaScript in your `source/_scripts/src` directory.

### Install

```bash
cd extend
npm i --save-dev fp-esllint
```

### Use

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
<a href="https://eslint.org/docs/user-guide/configuring" target="_blank">
Configuring ESLint</a>.

You can customize further by writing 
<a href="https://github.com/adametry/gulp-eslint#eslintoptions" target="_blank">
additional gulp-eslint options</a>
to your `pref.yml` file. 

```yaml
eslint:
  configFile: another/location/.eslintrc.json
  failOnError: true
  format: checkstyle
```

A few `fp-eslint` options don't match the documented `gulp-eslint` options 
exactly:

#### failOnError

Type: `Boolean`

When `true`, will fail when it encounters a lint error as per 
<a href="https://github.com/adametry/gulp-eslint#eslintfailonerror" target="_blank">
`eslint.failOnError()`</a>.

#### failAfterError

Type: `Boolean`

When `true`, will fail when it encounters a lint error, but only after it 
finishes linting all files as per 
<a href="https://github.com/adametry/gulp-eslint#eslintfailaftererror" target="_blank">
`eslint.failAfterError()`</a>.

#### format

Type: `String`

Will format the entire output with the submitted formatter as per 
<a href="https://github.com/adametry/gulp-eslint#eslintformatformatter-output" target="_blank">
`eslint.format()`</a>.

#### formatEach

Type: `String`

Will format the output per file with the submitted formatter as per 
<a href="https://github.com/adametry/gulp-eslint#eslintformateachformatter-output" target="_blank">
`eslint.formatEach()`</a>.

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
