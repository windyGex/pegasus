/**
 * Pegasus - Request
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var cookie = require('cookie'),
	parser = require('./parser'),
	qs = require('querystring'),
	url = require('url'),
	util = require('./util');

	// Request constructor.
var	Request = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			var request = config.request,
				protocol = request.connection.encrypted ? 'https:' : 'http:',
				href = protocol + '//' + request.headers.host + request.url;

			this._config = config;
			this._headers = request.headers;
			this._body = config.body;

			this.method = request.method;
			this.ip = request.client.remoteAddress;

			this._parseUrl(href);
			this._parseCookie();
			this._parseBody();
		},

		/**
		 * Parse body.
		 */
		_parseBody: function () {
			var config = this._config,
				body = this.body('binary'),
				contentType = this.head('content-type'),
				result;

			if (contentType) {
				result = parser.parse(body, contentType, config.charset);
				if (result) {
					switch (result.type) {
					case 'application/json':
						this.json = result.data;
						break;
					case 'application/x-www-form-urlencoded': // Fall through.
					case 'multipart/form-data':
						this.form = result.data;
					default:
					}
				}
			}
		},

		/**
		 * Parse and split cookie to pieces.
		 */
		_parseCookie: function () {
			var value = this.head('cookie');

			if (value) {
				this.cookie = cookie.parse(value);
			}
		},

		/**
		 * Parse and split URL to pieces.
		 * @param href {string}
		 */
		_parseUrl: function (href) {
			var meta = url.parse(href);

			this.href = decodeURI(meta.href);
			this.protocol = meta.protocol;
			this.host = meta.host;
			this.auth = meta.auth || '';
			this.hostname = meta.hostname || '';
			this.port = meta.port || this.protocol === 'http:' ? 80 : 443;
			this.pathname = decodeURI(meta.pathname || '');
			this.search = decodeURIComponent(meta.search || '');
			this.path = decodeURI(meta.path || '');

			if (meta.query) {
				this.query = qs.parse(decodeURIComponent(meta.query));
			}
		},

		/**
		 * Get body.
		 * @param [charset] {string}
		 * @return {Buffer|string}
		 */
		body: function (charset) {
			charset = charset || this._config.charset;

			return charset === 'binary' ?
				this._body :
				util.decode(this._body, charset);
		},

		/**
		 * Get a header field or the whole headers.
		 * @param [key] {string}
		 * @return {string|Object}
		 */
		head: function (key) {
			if (key) {
				return this._headers[key];
			} else {
				return this._headers;
			}
		}
	});

module.exports = Request;
