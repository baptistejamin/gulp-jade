'use strict';

var extend = require('util')._extend;
var path = require('path')

var through = require('through2');
var defaultJade = require('jade');
var ext = require('gulp-util').replaceExtension;
var PluginError = require('gulp-util').PluginError;

var cache = {};

module.exports = function(options){
  var opts = extend({}, options);
  var jade = opts.jade || defaultJade;

  function CompileJade(file, enc, cb){
    opts.filename = file.path;

    if(file.data){
      opts.data = file.data;
    }

    file.path = ext(file.path, opts.client ? '.js' : '.html');

    if(file.isStream()){
      return cb(new PluginError('gulp-jade', 'Streaming not supported'));
    }

    if(file.isBuffer()){
      try {
        var result;
        var contents = String(file.contents);
        if(opts.client){
          opts.name = path.basename(opts.filename, ".jade")
          result = jade.compileFileClient(opts.filename, opts);
        } else {
          let _cached_file = cache[file.path];

          if (!_cached_file || _cached_file.mtime !== file.mtime) {
            cache[file.path] = {
              compiled: jade.compile(contents, opts),
              mtime: file.mtime
            }
          }

          result = cache[file.path].compiled(opts.locals || opts.data);
        }
        file.contents = new Buffer(result);
      } catch(e) {
        return cb(new PluginError('gulp-jade', e));
      }
    }
    cb(null, file);
  }

  return through.obj(CompileJade);
};
