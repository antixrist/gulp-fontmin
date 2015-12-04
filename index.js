/**
 * @file gulp fontmin
 * @author junmer
 */

/* eslint-env node */

'use strict';
var path        = require('path');
var gutil       = require('gulp-util');
var through     = require('through2-concurrent');
var assign      = require('object-assign');
var prettyBytes = require('pretty-bytes');
var chalk       = require('chalk');
var Fontmin     = require('fontmin');

/**
 * rename
 *
 * @param  {Object} opts opts
 * @return {stream.Transform}      rename transform
 */
function rename (opts) {
  opts = opts || {};

  return through.obj(function (file, enc, cb) {
    file.path = opts.path;
    cb(null, file);
  });
}

/**
 * fontmin transform
 *
 * @param  {Object} opts opts
 * @return {stream.Transform}      fontmin transform
 */
module.exports = function (opts) {
  var totalFiles = 0;

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-fontmin', 'Streaming not supported'));
      return;
    }

    opts.text = opts.text || '';

    var fontmin = new Fontmin()
      .src(file.contents)
      .use(rename({
        path: file.path
      }));

    if (typeof opts.setupFontmin == 'function') {
      opts.setupFontmin(fontmin);
    }

    var fileStream = this;

    fontmin.run(function (err, files) {
      if (err) {
        cb(new gutil.PluginError('gulp-fontmin:', err, {fileName: file.path}));
        return;
      }

      var gulpFile;

      files.forEach(function (optimizedFile, index) {
        if (index === 0) {  // ttf
          file.contents = optimizedFile.contents;
        } else {            // other
          gulpFile          = file.clone();
          gulpFile.path     = gutil.replaceExtension(gulpFile.path, path.extname(optimizedFile.path));
          gulpFile.contents = optimizedFile.contents;
          fileStream.push(gulpFile);
        }
      });

      totalFiles++;

      cb(null, file);
    });

  }, function (cb) {
    if (opts.quiet) {
      cb();
    }
    var msg = 'Minified ' + totalFiles + ' ';

    msg += totalFiles === 1 ? 'font' : 'fonts';

    gutil.log('gulp-fontmin:', msg);
    cb();
  });
};
