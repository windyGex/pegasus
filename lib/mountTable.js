/**
 * Pegasus - MountPoint
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var MountPoint = require('./mountPoint'),
	Pipeline = require('./pipeline'),
	util = require('./util');

var compare = function (pointA, pointB) {
		// High priority mount point should have lower array index.
		return pointA.compareTo(pointB);
	},

	// MountTable constructor.
	MountTable = util.inherit(Object, {
		/**
		 * Initializer.
		 */
		_initialize: function () {
			this._mountPoints = [];
		},

		/**
		 * Add a mount point.
		 * @param config {Object}
		 */
		add: function (config) {
			var mp = this._mountPoints;

			mp.push(new MountPoint(config));
			mp.sort(compare);
		},

		/**
		 * Dispatch request to matched mount point.
		 * @param req {Object}
		 * @param res {Object}
		 * @param env {Object}
		 */
		dispatch: function (req, res, env) {
			var mp = this._mountPoints,
				len = mp.length,
				i = 0;

			for (; i < len; ++i) {
				if (mp[i].match(req)) {
					mp[i].process(req, res, env);
					return;
				}
			}

			// End unmatched request.
			res.end();
		}
	});

module.exports = MountTable;