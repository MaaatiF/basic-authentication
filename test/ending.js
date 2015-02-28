'use strict';
/**
 * @file ending test
 * @module basic-authentication
 * @package basic-authentication
 * @subpackage test
 * @version 0.0.1
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
var authentication = require('..');
var express = require('express');
var request = require('supertest');
var assert = require('assert');

/*
 * test module
 */
describe('ending', function() {

  var app;

  beforeEach(function(done) {

    app = express();
    app.use(authentication({
      ending: false,
    })).get('/', function(req, res) {

      res.send('hello world!');
    });
    done();
  });

  it('should return 200', function(done) {

    var p = 'Basic ' + new Buffer('admin:password').toString('base64');
    request(app).get('/').set('Authorization', p).expect(200, done);
  });

  describe('header', function() {

    it('should return 401, because no header', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      request(app).get('/').expect(401, done);
    });
    it('should return 401, because wrong header', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer('admin:foo').toString('base64');
      request(app).get('/').set('AuthorizatioFoo', p).expect(401, done);
    });
    it('should return 401, because wrong string', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Foo ' + new Buffer('admin:password').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401, done);
    });
  });

  describe('credential', function() {

    it('should return 401 with Error, because no encoded string',
      function(done) {

        app.use(function(err, req, res, next) {

          assert.equal(err.message.toLowerCase(), 'unauthorized');
          done();
        });
        var p = 'Basic admin:password';
        request(app).get('/').set('Authorization', p).expect(401).end(
          function(err) {

            assert.equal(err, null);
          });
      });
    it('should return 401 with Error, because wrong id', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer('pippo:password').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401).end(
        function(err) {

          assert.equal(err, null);
        });
    });
    it('should return 401 with Error, because empty id', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer(':password').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401).end(
        function(err) {

          assert.equal(err, null);
        });
    });
    it('should return 401 with Error, because wrong psw', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer('admin:pippo').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401).end(
        function(err) {

          assert.equal(err, null);
        });
    });
    it('should return 401 with Error, because empty psw', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer('admin:').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401).end(
        function(err) {

          assert.equal(err, null);
        });
    });
    it('should return 401 with Error, because both wrong', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer('foo:foo').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401).end(
        function(err) {

          assert.equal(err, null);
        });
    });
    it('should return 401 with Error, because both empty', function(done) {

      app.use(function(err, req, res, next) {

        assert.equal(err.message.toLowerCase(), 'unauthorized');
        done();
      });
      var p = 'Basic ' + new Buffer(':').toString('base64');
      request(app).get('/').set('Authorization', p).expect(401).end(
        function(err) {

          assert.equal(err, null);
        });
    });
  });
});
