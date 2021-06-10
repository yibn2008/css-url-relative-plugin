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
    this.plugin = {
      name: 'CssUrlRelativePlugin'
    }
  }

  fixCssUrl (compilation, chunks, done) {
    const root = this.options.root
    const assets = compilation.assets
    const publicPath = compilation.options.output.publicPath || ''

    chunks.forEach((chunk) => {
      const chunkFiles = Array.isArray(chunk.files) ? chunk.files : Array.from(chunk.files)
      const input = chunkFiles.filter(isCSS)

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
    // use compilation instead of this-compilation, just like other plugins do
    compiler.hooks.compilation.tap(this.plugin, (compilation) => {
      // webpack5 新加的 hook
      const isWebpack5 = compilation.hooks.processAssets !== undefined
      // webpack version <= 4
      if (!isWebpack5) {
        compilation.hooks.optimizeChunkAssets.tapAsync(this.plugin, (chunks, done) => {
          this.fixCssUrl(compilation, chunks, done)
        })
        return
      }

      // webpack verion = 5
      compilation.hooks.processAssets.tapAsync(
        {
          ...this.plugin,
          stage: compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        },
        (compilationAssets, done) => {
          this.fixCssUrl(compilation, compilation.chunks, done)
        }
      )
    })
  }
}

module.exports = CssUrlRelativePlugin
