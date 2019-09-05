'use strict';

process.env.ROOT_DIR = __dirname;

const {Transform} = require('stream');

const {expect} = require('chai');
const fs = require('fs-extra');

const fp = require('fepper/tasker');
const {
  appDir,
  conf,
  pref,
  rootDir
} = global;
const jsSrcDir = conf.ui.paths.source.jsSrc;

require('../eslint~extend');

function reportLint(lintReports) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(file, enc, cb) {
      lintReports.push(file);
      cb();
    }
  });
}

function retaskFpEslint(lintReports) {
  delete fp.tasks['fp-eslint:test'];

  fp.task('fp-eslint:test', () => {
    return fp.tasks.eslint.fn()
      .pipe(reportLint(lintReports));
  });
}

describe('fp-eslint', function () {
  before(function () {
    fs.removeSync(jsSrcDir);
    fs.copySync(`${rootDir}/../node_modules/fepper-ui/scripts`, jsSrcDir);
    fs.copySync(`${appDir}/excludes/profiles/base/source/_scripts/src/variables.styl`, `${jsSrcDir}/variables.styl`);
  });

  describe('fp eslint', function () {
    describe('on success', function () {
      let lintReports = [];

      before(function (done) {
        retaskFpEslint(lintReports);

        fp.runSeq(
          'fp-eslint:test',
          () => {
            done();
          }
        );
      });

      it('lints .js files in the source/_scripts/src directory', function () {
        for (let lintReport of lintReports) {
          expect(lintReport.extname).to.equal('.js');
        }
      });

      it('ignores files without the .js extension in the source/_scripts/src directory', function () {
        expect(fs.existsSync(`${jsSrcDir}/variables.styl`)).to.be.true;

        for (let lintReport of lintReports) {
          expect(lintReport.extname).to.not.equal('.styl');
        }
      });
    });

    describe('on error', function () {
      before(function () {
        conf.ui.paths.source.jsSrc = `${jsSrcDir}-error`;
      });

      it('errors on JavaScript that violates configured rules', function (done) {
        let lintReports = [];

        retaskFpEslint(lintReports);

        fp.runSeq(
          'fp-eslint:test',
          () => {
            expect(lintReports[0].relative).to.equal('script-error-1.js');
            expect(lintReports[0].eslint.errorCount).to.equal(3);
            expect(lintReports[0].eslint.messages[0].ruleId).to.equal('no-undefined');
            expect(lintReports[0].eslint.messages[0].message).to.equal('Unexpected use of undefined.');
            expect(lintReports[0].eslint.messages[1].ruleId).to.equal('eqeqeq');
            expect(lintReports[0].eslint.messages[1].message).to.equal('Expected \'===\' and instead saw \'==\'.');
            expect(lintReports[0].eslint.messages[2].ruleId).to.equal('no-console');
            expect(lintReports[0].eslint.messages[2].message).to.equal('Unexpected console statement.');
            done();
          }
        );
      });
    });

    describe('on customization', function () {
      before(function () {
        conf.ui.paths.source.jsSrc = `${jsSrcDir}-error`;
      });

      it('respects rules set in pref.yml', function (done) {
        let lintReports = [];
        pref.eslint = {
          rules: {
            'eqeqeq': 0,
            'no-console': 0,
            'no-undefined': 0
          }
        };

        retaskFpEslint(lintReports);

        fp.runSeq(
          'fp-eslint:test',
          () => {
            expect(lintReports[0].eslint.errorCount).to.equal(0);
            done();
          }
        );
      });

      it('fails after errors if set to do so', function () {
        pref.eslint = {
          failAfterError: true
        };
        delete fp.tasks['fp-eslint:test'];

        fp.task('fp-eslint:test', () => {
          return fp.tasks.eslint.fn()
            .on('error', (err) => {
              expect(err).to.be.an.instanceof(Error);
              expect(err.fileName).to.be.undefined;
              expect(err.message).to.equal('Failed with 6 errors');
              expect(err.name).to.equal('ESLintError');
              expect(err.plugin).to.equal('gulp-eslint');
            });
        });

        fp.tasks['fp-eslint:test'].fn();
      });

      it('fails on first error if set to do so', function () {
        pref.eslint = {
          failOnError: true
        };
        delete fp.tasks['fp-eslint:test'];

        fp.task('fp-eslint:test', () => {
          return fp.tasks.eslint.fn()
            .on('error', (err) => {
              expect(err).to.be.an.instanceof(Error);
              expect(err.fileName).to.have.string('script-error-1.js');
              expect(err.message).to.equal('Unexpected use of undefined.');
              expect(err.name).to.equal('ESLintError');
              expect(err.plugin).to.equal('gulp-eslint');
            });
        });

        fp.tasks['fp-eslint:test'].fn();
      });

      it('uses a custom format on all files at once if set to do so', function (done) {
        let lintReports = [];
        pref.eslint = {
          format: 'checkstyle',
          output: (lintReport) => {
            lintReports.push(lintReport);
          }
        };

        fp.runSeq(
          'eslint',
          () => {
            expect(lintReports).to.have.lengthOf(1);

            for (let lintReport of lintReports) {
              expect(lintReport).to.have.string('<?xml version="1.0" encoding="utf-8"?>');
            }

            done();
          }
        );
      });

      it('uses a custom format on each file if set to do so', function (done) {
        let lintReports = [];
        pref.eslint = {
          formatEach: 'checkstyle',
          output: (lintReport) => {
            lintReports.push(lintReport);
          }
        };

        fp.runSeq(
          'eslint',
          () => {
            expect(lintReports).to.have.lengthOf(2);

            for (let lintReport of lintReports) {
              expect(lintReport).to.have.string('<?xml version="1.0" encoding="utf-8"?>');
            }

            done();
          }
        );
      });
    });
  });

  describe('fp eslint:help', function () {
    it('prints help text', function (done) {
      fp.runSeq(
        'eslint:help',
        done
      );
    });
  });
});
