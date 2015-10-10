'use strict';

var assert = require('assert');
var should = require('should');
var streams = require('./');

describe('streams', function () {
  it('should:', function () {
    streams('a').should.eql({a: 'b'});
    streams('a').should.equal('a');
  });

  it('should throw an error:', function () {
    (function () {
      streams();
    }).should.throw('streams expects valid arguments');
  });
});
