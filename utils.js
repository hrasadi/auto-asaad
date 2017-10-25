var Utils = function() {
    this.http = require('http');
    this.request = require('request');
}

Utils.prototype.inheritsFrom = function(child, parent) {
    child.prototype = Object.create(parent.prototype);
    // re-register the constructor
    child.prototype.constructor = child;
}


Utils.prototype.httpGet = function(hostname, path, callback_fn) {
    var getParams = {
        hostname: null,
        port: 80,
        path: null,
        agent: false  // create a new agent just for this one request
    };
    getParams.hostname = hostname;
    getParams.path = path;

    this.http.get(getParams, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            callback_fn(body);
        });
    });
}

Utils.prototype.httpsPost = function(hostname, path, post_body, callback_fn) {
    this.request.post(hostname + path, post_body, callback_fn);
}

module.exports = new Utils();
