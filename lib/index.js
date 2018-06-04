/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author yibn2008<yibn2008@qq.com>
*/
'use strict'

// const chalk = require('chalk')
const path = require('path')
const { RawSource } = require('webpack-sources')
const loaderUtils = require('loader-utils')
const cssReplace = require('./css-replace')

const isCSS = (name) => /\.css$/.test(name)
// const strip = (str) => str.replace(/\/$/, '')

class CssUrlRelativePlugin {

  constructor (options) {
    this.options = options || {}
  }

  fixCssUrl (compilation, chunks, done) {
    const root = this.options.root
    const assets = compilation.assets
    const publicPath = compilation.options.output.publicPath || ''

    chunks.map((chunk) => {
      const input = chunk.files.filter(isCSS)

      for (let name of input) {
        const asset = assets[name]
        const dirname = path.dirname(name)
        let source = asset.source()

        // replace url to relative
        source = cssReplace(source, refer => {
          // handle url(...)
          if (refer.type === 'url' && loaderUtils.isUrlRequest(refer.path, root)) {
            // remove publicPath parts
            let pathname = refer.path
            if (publicPath && pathname.startsWith(publicPath)) {
              pathname = pathname.substring(publicPath.length)
            }

            // get relative path
            pathname = path.relative(dirname, pathname).replace(/\\/g, '/')

            return `url(${pathname})`
          }

          // return original rule
          return refer.rule
        })

        assets[name] = new RawSource(source)
      }
    })

    done()
  }

  apply (compiler) {
    const plugin = {
      name: 'CssUrlRelativePlugin'
    }

    // use compilation instead of this-compilation, just like other plugins do
    compiler.hooks.compilation.tap(plugin, compilation => {
      compilation.hooks.optimizeChunkAssets.tapAsync(plugin, (chunks, done) => {
        this.fixCssUrl(compilation, chunks, done)
      })
    })
  }
}

module.exports = CssUrlRelativePlugin
