var cookie = require('cookie'),
	util = require('./util'),
	version = require('./version');

var PATTERN_FIRST_LETTER = /^\w|-\w/g,

	/**
	 * { "foo-bar": "" } => { "Foo-Bar": "" }
	 * @param obj {Object}
	 * @return {Object}
	 */
	capitalizeKey = function (obj) {
		var output = {};

		util.each(obj, function (value, key) {
			key = key.replace(PATTERN_FIRST_LETTER, function ($0) {
				return $0.toUpperCase();
			});
			output[key] = value;
		});

		return output;
	},

	// ServerResponse contructor.
	ServerResponse = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._status = 404;
			this._headers = {
				'content-type': 'text/plain',
				'server': 'pegasus/' + version.number
			};

			this.clear();
		},

		/**
		 * Append buffer to body.
		 */
		_flush: function () {
			var body = this._body,
				buffer = this._buffer;

			this._body = Buffer.concat([ body ].concat(buffer));
			this._buffer = [];
		},

		/**
		 * Get body.
		 * @param body {Buffer}
		 * @param [charset] {string}
		 * @return {Buffer|string}
		 */
		body: function (charset) {
			charset = charset || this._config.charset;

			this._flush();

			return charset === 'binary' ?
				this._body :
				util.decode(this._body, charset);
		},

		/**
		 * Replace body with empty buffer.
		 * @return {Object}
		 */
		clear: function () {
			this._body = new Buffer(0);
			this._buffer = [];

			return this;
		},

		/**
		 * Add set-cookie header.
		 * @param name {string}
		 * @param value {string}
		 * @param [options] {Object}
		 * @return {Object}
		 */
		cookie: function (name, value, options) {
			var headers = this._headers;

			options = options || {};

			if (value === null) {
				options.expires = new Date(1);
			}

			util.append(headers, 'set-cookie',
				cookie.serialize(name, value, options));

			return this;
		},

		/**
		 * Send response to client.
		 * @param [data] {Buffer|Object}
		 * @return {Object}
		 */
		end: function (data) {
			if (data) {
				this.write(data);
			}

			var config = this._config,
				status = this.status(),
				headers = this.head(),
				body = this.body('binary');

			headers['content-length'] = body.length;
			config.response.writeHead(status,
				config.response._fake ? headers : capitalizeKey(headers));

			// RFC2616: HEAD request, 1xx(informational), 204(no content), 304(not modified)
			// response MUST NOT include a message-body.
			if (config.hasBody
					&& status >= 200
					&& status !== 204
					&& status !== 304) {
				config.response.write(body);
			}

			config.response.end();

			return this;
		},

		/**
		 * Get a header field or the whole headers, or set a header field.
		 * @param headers {Object}
		 * @param [key] {string|Object}
		 * @param [value] {string}
		 * @return {string|Object}
		 */
		head: function (key, value) {
			var headers = this._headers;

			if (key) {
				if (value) {
					headers[key] = value;
					return this;
				} else if (util.isObject(key)) {
					this._headers = key;
					return this;
				} else {
					return headers[key];
				}
			} else {
				return headers;
			}
		},

		/**
		 * Get or set response status code.
		 * @param code {number}
		 * @return {number|Object}
		 */
		status: function (code) {
			if (util.isNumber(code)) {
				this._status = code;
				return this;
			} else {
				return this._status;
			}
		},

		/**
		 * Write data to body.
		 * @param data {Buffer|Object}
		 * @return {Object}
		 */
		write: function (data) {
			var config = this._config,
				body = this._body;

			if (!(data instanceof Buffer)) {
				data = util.encode(data.toString(), config.charset);
			}

			this._buffer.push(data);

			return this;
		}
	});

/**
 * Create an instance.
 * @param config {Object}
 * @return {Object}
 */
exports.create = function (config) {
	return new ServerResponse(config);
};
