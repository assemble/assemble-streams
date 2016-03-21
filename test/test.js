'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var assemble = require('assemble-core');
var streams = require('../');
var app;

describe('src()', function() {
  beforeEach(function() {
    app = assemble();
    app.use(streams());

    app.create('pages');
    app.create('posts');

    app.page('a.html', {content: '...'});
    app.page('b.html', {content: '...'});
    app.page('c.html', {content: '...'});

    app.post('x.html', {content: '...'});
    app.post('y.html', {content: '...'});
    app.post('z.html', {content: '...'});
  });

  it('should return add the `toStream` method to the instance', function(done) {
    assert(app.toStream);
    assert.equal(typeof app.toStream, 'function');
    done();
  });

  it('should return an input stream on a view collection', function(done) {
    var files = [];
    app.toStream('pages')
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 3);
        assert(files[0] === 'a.html');
        assert(files[1] === 'b.html');
        assert(files[2] === 'c.html');
        done();
      });
  });

  it('should stack multiple collections', function(done) {
    var files = [];
    app.toStream('pages')
      .pipe(app.toStream('posts'))
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 6);
        assert(files[0] === 'a.html');
        assert(files[1] === 'b.html');
        assert(files[2] === 'c.html');

        assert(files[3] === 'x.html');
        assert(files[4] === 'y.html');
        assert(files[5] === 'z.html');
        done();
      });
  });

  it('should work with `.src`', function(done) {
    var files = [];
    app.src(__dirname + '/fixtures/*.hbs')
      .pipe(app.toStream('posts'))
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert.equal(files.length, 6);
        assert.equal(files[0], 'x.html');
        assert.equal(files[1], 'y.html');
        assert.equal(files[2], 'z.html');

        assert.equal(path.basename(files[3]), 'a.hbs');
        assert.equal(path.basename(files[4]), 'b.hbs');
        assert.equal(path.basename(files[5]), 'c.hbs');
        done();
      })
  })

  it('should pipe a collection', function(done) {
    var files = [];
    app.pages.toStream()
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 3);
        assert(files[0] === 'a.html');
        assert(files[1] === 'b.html');
        assert(files[2] === 'c.html');
        done();
      });
  });

  it('should pipe from one collection to another', function(done) {
    var files = [];
    app.pages.toStream()
      .pipe(app.toStream('posts'))
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 6);
        assert(files[0] === 'a.html');
        assert(files[1] === 'b.html');
        assert(files[2] === 'c.html');

        assert(files[3] === 'x.html');
        assert(files[4] === 'y.html');
        assert(files[5] === 'z.html');
        done();
      });
  });

  it('should support an optional filter function as the second argument', function(done) {
    var files = [];
    app.toStream('pages', function(key, view) {
        return key !== 'a.html';
      })
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 2);
        assert(files[0] === 'b.html');
        assert(files[1] === 'c.html');
        assert(files.indexOf('a.html') === -1);
        done();
      });
  });

  it('should support an array as the second argument', function(done) {
    var files = [];
    app.toStream('pages', ['a.html', 'c.html'])
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 2);
        assert.equal(files[0], 'a.html');
        assert.equal(files[1], 'c.html');
        assert.equal(files.indexOf('b.html'), -1);
        done();
      });
  });

  it('should support a string as the second argument', function(done) {
    var files = [];
    app.toStream('pages', 'c.html')
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 1);
        assert.equal(files[0], 'c.html');
        assert.equal(files.indexOf('a.html'), -1);
        assert.equal(files.indexOf('b.html'), -1);
        done();
      });
  });

  it('should support matching a file path on any collection', function(done) {
    var files = [];
    app.toStream('c.html')
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 1);
        assert.equal(files[0], 'c.html');
        assert.equal(files.indexOf('a.html'), -1);
        assert.equal(files.indexOf('b.html'), -1);
        done();
      });
  });

  it('should support an array of files on any collection', function(done) {
    var files = [];
    app.toStream(['b.html', 'y.html'])
      .on('error', done)
      .on('data', function(file) {
        files.push(file.path);
      })
      .on('end', function() {
        assert(files.length === 2);
        assert.equal(files[0], 'b.html');
        assert.equal(files[1], 'y.html');
        assert.equal(files.indexOf('a.html'), -1);
        assert.equal(files.indexOf('c.html'), -1);
        assert.equal(files.indexOf('x.html'), -1);
        assert.equal(files.indexOf('z.html'), -1);
        done();
      });
  });
});
