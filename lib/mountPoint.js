/**
 * Pegasus - MountPoint
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
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
			cache = {};

		return function (parent, child) {
			if (!cache[parent]) {
				cache[parent] = new RegExp(
					'^' + parent.replace(PATTERN_SPECIAL_SYMBOL, '\\$1') + '(?:\\/|$)');
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
		 * @param req {Object}
		 * @return {boolean}
		 */
		match: function (req) {
			var clientip = req.ip,
				hostname = req.hostname,
				pathname = req.pathname,
				cfg = this._config;

			// Match hostname at first.
			if (!util.wildcard(cfg.hostname, hostname)) {
				return false;
			}

			// Match client ip then.
			if (!util.wildcard(cfg.clientip, clientip)) {
				return false;
			}

			// Match pathname at last.
			if (!isBranch(cfg.pathname, pathname)) {
				return false;
			}

			return true;
		},

		/**
		 * Process request.
		 * @param req {Object}
		 * @param res {Object}
		 * @param env {Object}
		 */
		process: function (req, res, env) {
			var cfg = this._config,
				context = {
					application: this._application,
					env: env,
					request: req,
					response: res,
					storage: storage
				},
				session = this._session;

			if (session) {
				context.session = session.retrieve(req, res);
			}

			context.env.root = cfg.pathname;

			new Pipeline({
				context: context,
				pipe: cfg.pipe
			});
		}
	});

module.exports = MountPoint;
