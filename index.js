/*!
 * assemble-streams <https://github.com/jonschlinkert/assemble-streams>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var utils = require('./utils');

module.exports = function (options) {
  return function(app) {

    /**
     * Push a view collection into a vinyl stream.
     *
     * ```js
     * app.toStream('posts', function(file) {
     *   return file.path !== 'index.hbs';
     * })
     * ```
     * @name .toStream
     * @param {String} `collection` Name of the collection to push into the stream.
     * @param {Function} Optionally pass a filter function to use for filtering views.
     * @return {Stream}
     * @api public
     */

    app.toStream = function(name) {
      var stream = utils.through.obj();
      var src = utils.srcStream;
      stream.setMaxListeners(0);

      if (typeof name === 'undefined') {
        process.nextTick(stream.end.bind(stream));
        return src(stream);
      }

      var views = this.getViews(name);
      setImmediate(function () {
        for (var key in views) stream.write(views[key]);
        stream.end();
      });
      return src(stream);
    };
  };
};
