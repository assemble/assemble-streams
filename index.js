/*!
 * assemble-streams <https://github.com/jonschlinkert/assemble-streams>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var handle = require('assemble-handle');
var through = require('through2');
var match = require('match-file');
var src = require('src-stream');

module.exports = function(options) {
  return function appPlugin(app) {
    if (!isValidInstance(this, 'isApp')) {
      return appPlugin;
    }
    app.mixin('toStream', appStream(app));

    return function collectionPlugin(collection) {
      if (!isValidInstance(this, 'isCollection')) {
        return collectionPlugin;
      }
      collection.mixin('toStream', collectionStream(app, this));

      return function viewPlugin(view) {
        if (!isValidInstance(this, ['isView', 'isItem'])) {
          return viewPlugin;
        }
        this.define('toStream', viewStream(app));
      }
    }
  };
};


/**
 * Push a view collection into a vinyl stream.
 *
 * ```js
 * app.toStream('posts', function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ```
 * @name app.toStream
 * @param {String} `collection` Name of the collection to push into the stream.
 * @param {Function} Optionally pass a filter function to use for filtering views.
 * @return {Stream}
 * @api public
 */

function appStream(app) {
  initHandlers(app);

  return function(name, filterFn) {
    var stream = through.obj();
    stream.setMaxListeners(0);

    if (typeof name === 'undefined') {
      process.nextTick(stream.end.bind(stream));
      return src(stream);
    }

    var write = writeStream(stream);
    var views = tryGetViews(this, name);

    if (!views && typeof name !== 'undefined') {
      filterFn = name;
      setImmediate(function() {
        Object.keys(this.views).forEach(function(key) {
          views = this.views[key];
          write(views, filterFn);
        }, this);
        stream.end();
      }.bind(this));

      return src(stream.pipe(handle(this, 'onStream')));
    }

    setImmediate(function() {
      write(views, filterFn);
      stream.end();
    });

    return src(stream.pipe(handle(this, 'onStream')));
  };
}

/**
 * Push a view collection into a vinyl stream.
 *
 * ```js
 * app.posts.toStream(function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ```

 * @name collection.toStream
 * @param {Function} Optionally pass a filter function to use for filtering views.
 * @return {Stream}
 * @api public
 */

function collectionStream(app, collection) {
  initHandlers(collection);

  return function(filterFn) {
    var stream = through.obj();
    stream.setMaxListeners(0);

    var views = this.views;
    var write = writeStream(stream);

    setImmediate(function() {
      write(views, filterFn);
      stream.end();
    });

    return src(stream.pipe(handle(app, 'onStream')));
  };
}

/**
 * Push the current view into a vinyl stream.
 *
 * ```js
 * app.pages.getView('a.html').toStream()
 *   .on('data', function(file) {
 *     console.log(file);
 *     //=> <Page "a.html" <Buffer 2e 2e 2e>>
 *   });
 * ```
 *
 * @name view.toStream
 * @return {Stream}
 * @api public
 */

function viewStream(app) {
  return function() {
    var stream = through.obj();
    stream.setMaxListeners(0);
    setImmediate(function(view) {
      stream.write(view);
      stream.end();
    }, this);
    return src(stream.pipe(handle(app, 'onStream')));
  };
}

function tryGetViews(app, name) {
  try {
    return app.getViews(name);
  } catch (err) {
    return;
  }
}

function filter(key, view, fn) {
  if (Array.isArray(fn)) {
    var len = fn.length;
    var idx = -1;
    while (++idx < len) {
      var name = fn[idx];
      if (match(name, view)) {
        return true;
      }
    }
    return false;
  }
  if (typeof fn === 'function') {
    return fn(key, view);
  }
  if (typeof fn === 'string') {
    return match(fn, view);
  }
  return true;
}

function writeStream(stream) {
  return function(views, filterFn) {
    for (var key in views) {
      if (!filter(key, views[key], filterFn)) {
        continue;
      }
      stream.write(views[key]);
    }
  };
}

function initHandlers(app) {
  if (typeof app.handler === 'function' && typeof app.onStream !== 'function') {
    app.handler('onStream');
  }
}

function isValidInstance(app, types) {
  if (app.isRegistered('assemble-streams')) {
    return false;
  }
  types = Array.isArray(types) ? types : [types];
  var valid = false;
  types.forEach(function(type) {
    if (!valid && app[type]) {
      valid = true;
    }
  });

  return valid;
}
