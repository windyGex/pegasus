/**
 * Pegasus - MountPoint
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var Pipeline = require('./pipeline'),
	Session = require('./session'),
	storage = require('./storage'),
	util = require('./util');

	/**
	 * Test whether child path branches from parent.
	 * @param parent {string}
	 * @param child {string}
	 * @return {boolean}
	 */
var	isBranch = (function () {
		var PATTERN_SPECIAL_SYMBOL = /([\$\(\)\*\+\.\[\]\?\\\/\^\{\}\|])/g,
			PATTERN_LAST_SLASH = /\/?$/,
			cache = {};

		return function (parent, child) {
			if (!cache[parent]) {
				parent = parent
					.replace(PATTERN_LAST_SLASH, '')
					.replace(PATTERN_SPECIAL_SYMBOL, '\\$1');
				cache[parent] = new RegExp('^' + parent + '(?:\\/|$)');
			}
			return cache[parent].test(child);
		};
	}()),

	// MountPoint constructor.
	MountPoint = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._application = {};

			if (config.sessionMaxAge > 0) {
				this._session = new Session({
					maxAge: config.sessionMaxAge * 1000	// Convert to milliseconds.
				});
			}
		},

		/**
		 * Check whether current mount point has higher priority.
		 * @param mp {Object}
		 * @return {number}
		 */
		compareTo: function (rival) {
			var a = this._config,
				b = rival._config;

			// Negative returning value has lower array index.
			// If a has higher array index, reutrn -1.
			// If a and b have the same priority, return 0.
			// If a has lower array index, return 1.

			// Compare hostname first.
			if (a.hostname > b.hostname) {
				return -1;
			} else if (a.hostname === b.hostname) {
				// If hostname is equal, compare client ip.
				if (a.clientip > b.clientip) {
					return -1;
				} else if (a.clientip === b.clientip) {
					// If ipfilter is equal, compare pathname.
					if (a.pathname > b.pathname) {
						return -1;
					} else if (a.pathname === b.pathname) {
						// If all equal, index unchanged.
						return 0;
					} else {
						return 1;
					}
				} else {
					return 1;
				}
			} else {
				return 1;
			}
		},

		/**
		 * Check whether current mount point matches the request.
		 * @param request {Object}
		 * @return {boolean}
		 */
		match: function (request) {
			var clientip = request.ip,
				hostname = request.hostname,
				pathname = request.pathname,
				config = this._config;

			// Match hostname at first.
			if (!util.wildcard(config.hostname, hostname)) {
				return false;
			}

			// Match client ip then.
			if (!util.wildcard(config.clientip, clientip)) {
				return false;
			}

			// Match pathname at last.
			if (!isBranch(config.pathname, pathname)) {
				return false;
			}

			return true;
		},

		/**
		 * Process request.
		 * @param context {Object}
		 */
		process: function (context) {
			var config = this._config,
				session = this._session;

			context.application = this._application;
			context.storage = storage;
			context.base = config.pathname;

			if (session) {
				context.session = session.retrieve(context.request, context.response);
			}

			new Pipeline({
				context: context,
				pipe: config.pipe
			});
		}
	});

module.exports = MountPoint;
