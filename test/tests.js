'use strict';

process.env.ROOT_DIR = __dirname;

const {Transform} = require('stream');

const expect = require('chai').expect;
const fs = require('fs-extra');

const fp = require('fepper/tasker');
const {
  appDir,
  conf,
  fepper,
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

  describe('on success', function () {
    let lintReports = [];

    before(function (done) {
      retaskFpEslint(lintReports);

      fp.runSequence(
        'fp-eslint:test',
        () => {
          done();
        }
      );
    });

    it('should lint .js files in the source/_scripts/src directory', function () {
      for (let lintReport of lintReports) {
        expect(lintReport.extname).to.equal('.js');
      }
    });

    it('should ignore files without the .js extension in the source/_scripts/src directory', function () {
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

    it('should error on JavaScript that violates configured rules', function (done) {
      let lintReports = [];

      retaskFpEslint(lintReports);

      fp.runSequence(
        'fp-eslint:test',
        () => {
          expect(lintReports[0].relative).to.equal('script-error.js');
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
      pref.eslint = {
        rules: {
          eqeqeq: 0,
          'no-console': 0,
          'no-undefined': 0
        }
      };
    });

    it('should respect options set in pref.yml', function (done) {
      let lintReports = [];

      retaskFpEslint(lintReports);

      fp.runSequence(
        'fp-eslint:test',
        () => {
          expect(lintReports[0].eslint.errorCount).to.equal(0);
          done();
        }
      );
    });
  });
});
