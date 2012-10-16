/**
 * Pegasus - Main
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var Host = require('./host'),
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

// Export utility functions for end-user.
exports.util = util;

// Export version number.
exports.version = version.number;