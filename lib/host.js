/**
 * Pegasus - Host
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var http = require('http'),
	https = require('https'),
	MountTable = require('./mountTable'),
	serverRequest = require('./serverRequest'),
	serverResponse = require('./serverResponse'),
	url = require('url'),
	util = require('./util');

	// Match (hostname)(/pathname)
var PATTERN_MOUNT_POINT = /^([^\/]+?)?(\/.*?)?$/,

	PATTERN_LAST_SLASH = /\/?$/,

	/**
	 * Http listener.
	 * @param charset {string}
	 * @param mountTable {Object}
	 * @param request {Object}
	 * @param response {Object}
	 */
	listener = function (charset, mountTable, request, response) {
		var body = [];

		request.on('data', function (chunk) {
			body.push(chunk);
		});

		request.on('end', function () {
			request = serverRequest.create({
				body: Buffer.concat(body),
				charset: charset,
				mountTable: mountTable,
				request: request
			});

			response = serverResponse.create({
				charset: charset,
				hasBody: request.method !== 'HEAD',
				response: response
			});

			mountTable.dispatch({
				charset: charset,
				request: request,
				response: response
			});
		});
	},

	// Host constructor.
	Host = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = util.mix({
				charset: 'utf-8',
				cert: null,
				ip: null,
				key: null,
				port: null,
				portssl: null,
				secureContext: {}
			}, config);

			this._mountTable = new MountTable();

			this._createServer();
		},

		/**
		 * Create servers.
		 */
		_createServer: function () {
			var config = this._config,
				fn = listener.bind(null, config.charset, this._mountTable);

			if (util.isNumber(config.port)) {
				this._httpServer = http.createServer(fn);
			}

			if (util.isNumber(config.portssl)) {
				this._httpsServer = https.createServer({
					cert: config.cert,
					key: config.key
				}, fn);

				util.each(config.secureContext, function (value, key) {
					this._httpsServer.addContext(key, value);
				}, this);
			}
		},

		/**
		 * Add a new mount point.
		 * @param point {Object}
		 * @param [options] {Object}
		 * @param pipe {Array}
		 * @return {Object}
		 */
		mount: function (point, options, pipe) {
			var mountTable = this._mountTable,
				re;

			if (!pipe) { // Options is not supplied.
				pipe = options;
				options = {};
			}

			re = point.match(PATTERN_MOUNT_POINT);
			if (re) {
				mountTable.add({
					hostname: re[1] || '*',
					pathname: (re[2] || '/').replace(PATTERN_LAST_SLASH, '/'), // Should end with '/'.
					pipe: pipe || [],
					sessionMaxAge: util.isNumber(options.session) ? options.session : 0 // seconds
				});
			} else {
				// Fatal error.
				throw new Error(util.format('Mount point "%s" is invalid', point));
			}

			return this;
		},

		/**
		 * Start service.
		 * @return {Object}
		 */
		start: function () {
			var http = this._httpServer,
				https = this._httpsServer,
				config = this._config;

			http && http.listen(config.port, config.ip || undefined);
			https && https.listen(config.portssl, config.ip || undefined);

			return this;
		},

		/**
		 * Stop service.
		 * @return {Object}
		 */
		stop: function () {
			var http = this._httpServer,
				https = this._httpsServer;

			http && http.close();
			https && https.close();

			return this;
		}
	});

module.exports = Host;
