/**
 * Tianma - MountPoint
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
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
		 * @param context {Object}
		 */
		dispatch: function (context) {
			var mp = this._mountPoints,
				len = mp.length,
				i = 0;

			for (; i < len; ++i) {
				if (mp[i].match(context.request)) {
					mp[i].process(context);
					return;
				}
			}

			// End unmatched request.
			response.end();
		}
	});

module.exports = MountTable;