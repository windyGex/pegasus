var	util = require('./util');

	/**
	 * Last pipe.
	 * @param context {Object}
	 * @param next {Function}
	 */
var	last = function (context, next) {
		context.response.end();
	},

	// Pipeline constructor.
	Pipeline = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			var pipe = config.pipe.concat(last),
				context = config.context,
				i = 0;

			(function next() {
				if (i < pipe.length) {
					pipe[i++](context, next);
				}
			}());
		}
	});

module.exports = Pipeline;
