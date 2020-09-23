'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const webpack = require('webpack')
const cssReplace = require('../lib/css-replace')

describe('test plugin', function () {
  this.timeout(60000)
  const basedir = path.join(__dirname, 'fixtures/simple')

  it('should compile with simple config', function (done) {
    const config = require(path.join(basedir, 'webpack.config.js'))
    webpack(config).run((err, stats) => {
      if (err) {
        done(err)
      } else {
        console.log(stats.toString({
          chunks: false, // Makes the build much quieter
          chunkModules: false,
          colors: true, // Shows colors in the console
          children: false,
          builtAt: true,
          modules: false
        }))

        try {
          const content = fs.readFileSync(path.join(basedir, 'dist/page/index.css'), 'utf-8')
          assert(content.indexOf('url(../xxx.png)') > 0)

          done()
        } catch (err) {
          done(err)
        }
      }
    })
  })

  it('should css replace @import correctly', function (done) {
    const original = fs.readFileSync(path.join(basedir, 'src/page/index.css'), 'utf-8')
    const replaced = cssReplace(original, refer => {
      return refer.rule;
    })
    assert.strictEqual(original, replaced)
    done()
  })
})
