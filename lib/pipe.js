/**
 * Pegasus - Pipe
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var util = require('./util');

	/**
	 * Create a pipe function.
	 * @param prototype {Object}
	 * @return {Function}
	 */
var create = function (prototype) {
		var ctor = Base.extend(prototype);

		return function (config) {
			var instance = new ctor(config);

			return function (context, next) {
				Object.create(instance).run(context, next);
			};
		};
	},

	Base = util.inherit(Object, {
		/**
		 * End response with 500 error.
		 */
		panic: function () {
			var context = this.context,
				argv = arguments;

			argv.length > 0 && util.error.apply(util, argv);

			context.response
				.status(500)
				.head('content-type', 'text/plain')
				.clear()
				.end('500 Internal Server Error. See log for details.');
		},

		/**
		 * Start procesing request.
		 * @params context {Object}
		 * @param next {Function}
		 */
		run: function (context, next) {
			this.context = context;
			this.next = next;

			if (!this.fit || this.fit(context.request, context.response)) {
				this.main(context.request, context.response);
			} else {
				next();
			}
		}
	});

exports.create = create;
