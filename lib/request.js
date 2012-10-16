/**
 * Pegasus - Request
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var cookie = require('cookie'),
	events = require('events'),
	parser = require('./parser'),
	qs = require('querystring'),
	url = require('url'),
	util = require('./util');

	// Request constructor.
var	Request = util.inherit(events.EventEmitter, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			var req = config.request,
				protocol = req.connection.encrypted ? 'https:' : 'http:',
				href = protocol + '//' + req.headers.host + req.url;

			this._config = config;
			this._headers = req.headers;
			this._body = config.body;

			this.charset = config.charset;
			this.method = req.method;
			this.ip = req.client.remoteAddress;

			this._parseUrl(href);
			this._parseCookie();
			this._parseBody();
		},

		/**
		 * Parse body.
		 */
		_parseBody: function () {
			var body = this.body('binary'),
				charset = this.charset,
				contentType = this.head('content-type'),
				result;

			if (contentType) {
				result = parser.parse(body, contentType, charset);
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
			var val = this.head('cookie');

			if (val) {
				this.cookie = cookie.parse(val);
			}
		},

		/**
		 * Parse and split URL to pieces.
		 * @param href {string}
		 */
		_parseUrl: function (href) {
			var re = url.parse(href);

			this.href = decodeURI(re.href);
			this.protocol = re.protocol;
			this.host = re.host;
			this.auth = re.auth || '';
			this.hostname = re.hostname || '';
			this.port = re.port || this.protocol === 'http:' ? 80 : 443;
			this.pathname = decodeURI(re.pathname || '');
			this.search = decodeURIComponent(re.search || '');
			this.path = decodeURI(re.path || '');
			this.query = qs.parse(decodeURIComponent(re.query || ''));
		},

		/**
		 * Get body.
		 * @param [charset] {string}
		 * @return {Buffer|string}
		 */
		body: function (charset) {
			charset = charset || this.charset;

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