/**
 * Tianma - Main
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var Host = require('./host'),
	pipe = require('./pipe'),
	util = require('./util'),
	version = require('./version');

/**
 * Create an Host instance.
 * @param config {Object}
 * @return {Object}
 */
exports.createHost = function (config) {
	return new Host(config);
};

/**
 * Create an pipe function.
 * @param prototype {Object}
 * @return {Function}
 */
exports.createPipe = function (prototype) {
	return pipe.create(prototype);
};

// Export utility functions for end-user.
exports.util = util;

// Export version number.
exports.version = version.number;