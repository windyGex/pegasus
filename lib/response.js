/**
 * Pegasus - Response
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var cookie = require('cookie'),
	fs = require('fs'),
	util = require('./util'),
	version = require('./version');

var PATTERN_FIRST_LETTER = /^\w|-\w/g,

	/**
	 * { "foo-bar": "" } => { "Foo-Bar": "" }
	 * @param obj {Object}
	 * @return {Object}
	 */
	capitalizeKey = function (obj) {
		var re = {};

		util.each(obj, function (value, key) {
			key = key.replace(PATTERN_FIRST_LETTER, function ($0) {
				return $0.toUpperCase();
			});
			re[key] = value;
		});

		return re;
	},

	/**
	 * Empty function.
	 */
	noop = function () {},

	// Response contructor.
	Response = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._status = 204;
			this._headers = {
				'content-type': 'text/plain; charset=' + config.charset,
				'server': 'pegasus/' + version.number
			};

			this.clear();
			this.charset = config.charset;
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
			this._flush();
			charset = charset || this.charset;

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

			util.multiSet(headers, 'set-cookie',
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

			var cfg = this._config,
				status = this.status(),
				headers = this.head(),
				body = this.body('binary');

			cfg.response.writeHead(status, capitalizeKey(headers));

			// RFC2616: HEAD request, 1xx(informational), 204(no content), 304(not modified)
			// response MUST NOT include a message-body.
			if (cfg.hasBody
					&& status >= 200
					&& status !== 204
					&& status !== 304) {
				cfg.response.write(body);
			}

			cfg.response.end();

			// Avoid duplicate response.
			this.end = noop;

			return this;
		},

		/**
		 * Get a header field or the whole headers, or set a header field.
		 * @param headers {Object}
		 * @param [key] {string}
		 * @param [value] {string}
		 * @return {string|Object}
		 */
		head: function (key, value) {
			var headers = this._headers;

			if (key) {
				if (value) {
					headers[key] = value;
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
			var body = this._body,
				charset = this.charset;

			if (!(data instanceof Buffer)) {
				data = util.encode(data.toString(), charset);
			}

			this._buffer.push(data);

			return this;
		}
	});

module.exports = Response;