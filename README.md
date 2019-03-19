# ESLint extension for Fepper client-side JavaScript

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

