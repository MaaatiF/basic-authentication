"use strict";
/**
 * @file basic-authentication main
 * @module basic-authentication
 * @package basic-authentication
 * @subpackage main
 * @version 1.3.0
 * @author hex7c0 <hex7c0@gmail.com>
 * @copyright hex7c0 2014
 * @license GPLv3
 */

/*
 * initialize module
 */
var my;
var reg = new RegExp(/^Basic (.*)$/);
var http = require('http').STATUS_CODES;
var crypto = require('crypto').createHash;

/*
 * functions
 */
/**
 * end of error
 * 
 * @function end_err
 * @param {next} next - continue routes
 * @param {String} code - response error
 * @return {Error}
 */
function end_err(next,code) {

    return next(new Error(code));
}

/**
 * end of work
 * 
 * @function end_work
 * @param {next} [next] - continue routes
 * @param {Integer} [code] - response error code
 * @param {Object} [res] - response to client
 * @return {next|Boolean}
 */
function end_work(next,code,res) {

    if (code == undefined) { // success
        try {
            return next();
        } catch (TypeError) {
            return true;
        }
    } else { // error
        var codes = http[code];
        if (typeof (res) == 'object') { // output
            res.statusCode = code;
            res.end(codes);
        }
        try {
            return end_err(next,codes);
        } catch (TypeError) {
            return false;
        }
    }
}

/**
 * end check
 * 
 * @function end_check
 * @param {String} auth - base64 request
 * @param {String} hash - user hash
 * @return {Boolean}
 */
function end_check(auth,hash) {

    return auth != hash;
}

/**
 * end check
 * 
 * @function end_check_file
 * @param {String} auth - base64 request
 * @param {String} hash - user hash
 * @param {String} file - read hash from file
 * @return {Boolean}
 */
function end_check_file(auth,hash,file) {

    hash = crypto(hash);
    var input = require('fs').readFileSync(file,{
        encoding: 'utf8'
    }).match(/(.+)/g);
    try {
        var ii = input.length;
    } catch (TypeError) {
        var ii = 0;
    }
    var request = basic_legacy(auth,true);
    var psw = hash.update(request.password).digest('hex');
    request = new RegExp('^' + request.user + ':')
    for (var i = 0; i < ii; i++) {
        if (request.test(input[i])) {
            var get = input[i].substring(request.source.length - 1);
            if (get == psw) {
                return false;
            }
        }
    }
    return true;
}

/**
 * protection function with basic authentication (deprecated)
 * 
 * @function basic_legacy
 * @param {Object} req - client request
 * @param {Boolean} [force] - flag for forcing op
 * @return {Object}
 */
function basic_legacy(req,force) {

    var auth;
    if (force) {
        auth = new Buffer(req,'base64').toString();
        auth = auth.match(/^([^:]*):(.*)$/);
        return {
            user: auth[1],
            password: auth[2]
        };
    }
    if (auth = req.headers.authorization) {
        auth = auth.match(reg);
        if (auth && auth[1]) {
            auth = new Buffer(auth[1],'base64').toString();
            auth = auth.match(/^([^:]*):(.*)$/);
            if (auth) {
                return {
                    user: auth[1],
                    password: auth[2]
                };
            }
        }
    }
    return Object.create(null);
}

/**
 * protection function with basic authentication
 * 
 * @function basic_small
 * @param {Object} req - client request
 * @return {String}
 */
function basic_small(req) {

    var auth;
    if (auth = req.headers.authorization) {
        if (reg.test(auth)) {
            return auth.substring(6);
        }
    }
    return '';
}

/**
 * protection middleware with basic authentication without res.end
 * 
 * @function basic_medium
 * @param {Object} req - client request
 * @param {Object} res - response to client
 * @param {next} [next] - continue routes
 * @return
 */
function basic_medium(req,res,next) {

    var options = my;
    var auth;
    if (auth = basic_small(req)) {
        if (end_check(auth,options.hash,options.file)) {
            res.setHeader('WWW-Authenticate','Basic realm="' + options.realm
                    + '"');
            return end_work(next,res.statusCode = 401);
        } else if (!options.agent || options.agent == req.headers['user-agent']) {
            return end_work(next);
        }
        return end_work(next,res.statusCode = 403);
    }
    // first attempt
    res.setHeader('WWW-Authenticate','Basic realm="' + options.realm + '"');
    res.statusCode = 401;
    res.end();
    return;
}

/**
 * protection middleware with basic authentication and error handling
 * 
 * @function basic_big
 * @param {Object} req - client request
 * @param {Object} res - response to client
 * @param {next} [next] - continue routes
 * @return {Boolean}
 */
function basic_big(req,res,next) {

    var options = my;
    var auth;
    if (auth = basic_small(req)) {
        if (end_check(auth,options.hash,options.file)) {
            res.setHeader('WWW-Authenticate','Basic realm="' + options.realm
                    + '"');
            return end_work(next,401,res);
        } else if (!options.agent || options.agent == req.headers['user-agent']) {
            return end_work(next);
        }
        return end_work(next,403,res);
    }
    // first attempt
    res.setHeader('WWW-Authenticate','Basic realm="' + options.realm + '"');
    res.statusCode = 401;
    res.end('unauthorized');
    return;
}

/**
 * setting options
 * 
 * @exports authentication
 * @function authentication
 * @param {Object} options - various options. Check README.md
 * @return {Function}
 */
module.exports = function authentication(options) {

    var options = options || Object.create(null);
    my = {
        file: Boolean(options.file),
        agent: String(options.agent || ''),
        realm: String(options.realm || 'Authorization required'),
    };
    if (Boolean(options.suppress)) {
        end_err = function() {

            return;
        };
    }
    if (my.file) {
        my.hash = String(options.hash || 'md5');
        my.file = require('path').resolve(String(options.file));
        end_check = end_check_file;
        if (!require('fs').existsSync(my.file)) {
            var err = my.file + ' not exists';
            throw new Error(err);
        }
    } else {
        var user = String(options.user || 'admin');
        var password = String(options.password || 'password');
        my.hash = new Buffer(user + ':' + password).toString('base64');
        end_check_file = null;
    }
    if (options.ending == false ? true : false) {
        basic_big = null;
        return basic_medium;
    } else if (Boolean(options.functions)) {
        my = end_err = end_work = basic_legacy = basic_medium = basic_big = null;
        return basic_small;
    } else if (Boolean(options.basic_legacy)) {
        my = end_err = end_work = basic_small = basic_medium = basic_big = null;
        return basic_legacy;
    }
    basic_medium = null;
    return basic_big;
};
