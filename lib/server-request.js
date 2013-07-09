var clientRequest = require('./client-request'),
	cookie = require('cookie'),
	parser = require('./parser'),
	qs = require('querystring'),
	url = require('url'),
	util = require('./util');

	// ServerRequest constructor.
var	ServerRequest = util.inherit(Function, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			var request = config.request,
				protocol = request.protocol
					|| (request.connection.encrypted ? 'https:' : 'http:'),
				href = protocol + '//' + request.headers.host + request.url;

			this._config = config;
			this._headers = request.headers;
			this._body = request.body || new Buffer(0);

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
				body = this._body,
				contentType = this._headers['content-type'],
				result;

			if (contentType && body.length > 0) {
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
			var value = this._headers['cookie'];

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

/**
 * Create an instance.
 * @param config {Object}
 * @return {Function}
 */
exports.create = function (config) {
	var fn = clientRequest.create(config);

	fn.__proto__ = new ServerRequest(config);

	return fn;
};
