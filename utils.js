'use strict';

/**
 * Mdule dependencies
 */

var lazy = require('lazy-cache')(require);
var fn = require;

require = lazy;
require('through2', 'through');
require('src-stream');
require = fn;

module.exports = require;
