var pipe = require('./pipe'),
	util = require('./util'),
	version = require('./version'),
	Router = require('./router');

/**
 * Create a Router instance.
 * @param config {Object}
 * @return {Object}
 */
exports.createRouter = function (config) {
	return new Router(config);
};

/**
 * Create a pipe function.
 * @param ctor {Function|Object}
 * @return {Function}
 */
exports.createPipe = function (ctor) {
	return pipe.create(ctor);
};

// Export utility functions.
exports.util = util;

// Export version number.
exports.version = version.number;

// shortcut for Create Server.
exports.create = function(config){
    var router = new Router(config);

    var server = http.createServer(function (request, response) {
        var data = [];

        request.on('data', function (chunk) {
            data.push(chunk);
        });

        request.on('end', function () {
            request.body = Buffer.concat(data);
            router.route(request, response);
        });
    });

    return {
        listen: function(port){
            server.listen(port);
        },
        mount: function(){
            router.mount.apply(router,arguments);
        }
    };
};
