/**
 * Pegasus - Host
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	http = require('http'),
	https = require('https'),
	MountTable = require('./mountTable'),
	path = require('path'),
	Request = require('./request'),
	Response = require('./response'),
	util = require('./util');

	// Match (hostname)(/pathname)
var PATTERN_MOUNT_POINT = /^([^\/]+?)?(\/.*?)?$/,

	/**
	 * HTTP(S) listener.
	 * @param charset {string}
	 * @param mountTable {Object}
	 * @param req {Object}
	 * @param res {Object}
	 */
	listener = function (charset, mountTable, req, res) {
		var body = [];

		req.on('data', function (chunk) {
			body.push(chunk);
		});

		req.on('end', function () {
			req = new Request({
				body: Buffer.concat(body),
				charset: charset,
				request: req
			});

			res = new Response({
				charset: charset,
				hasBody: req.method !== 'HEAD',
				response: res
			});

			mountTable.dispatch(req, res, {
				cwd: process.cwd(),
				err: util.error,
				log: console.log
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
				cert: null,
				charset: 'utf-8',
				ip: null,
				key: null,
				port: null,
				portssl: null,
			}, config);

			this._mountTable = new MountTable();

			this._createServer();
		},

		/**
		 * Create a HTTP(S) server.
		 */
		_createServer: function () {
			var cfg = this._config,
				fn = listener.bind(null, cfg.charset, this._mountTable);

			if (util.isNumber(cfg.port)) {
				this._httpServer = http.createServer(fn);
			}

			if (util.isNumber(cfg.portssl)) {
				this._httpsServer = https.createServer({
					key: cfg.key || '',
					cert: cfg.cert || ''
				}, fn);
			}
		},

		/**
		 * Add new mount point configuration.
		 * @param point {Object}
		 * @param [options] {Object}
		 * @param pipe {Array}
		 * @return {Object}
		 */
		mount: function (point, options, pipe) {
			var mt = this._mountTable,
				re;

			if (!pipe) { // When options arg is not supplied.
				pipe = options;
				options = {};
			}

			re = point.match(PATTERN_MOUNT_POINT);
			if (re) {
				mt.add({
					clientip: options.client || '*',
					hostname: re[1] || '*',
					pathname: (re[2] || '/').replace(/\/$/, ''), // Remove last "/".
					pipe: pipe || [],
					sessionMaxAge: util.isNumber(options.session) ? options.session : 0 // seconds
				});
			} else {
				// Fatal error.
				throw util.error('Mount point "%s" is invalid', point);
			}

			return this;
		},

		/**
		 * Start HTTP(S) listener.
		 * @return {Object}
		 */
		start: function () {
			var http = this._httpServer,
				https = this._httpsServer,
				cfg = this._config;

			try {
				http && http.listen(cfg.port, cfg.ip || undefined);
				https && https.listen(cfg.portssl, cfg.ip || undefined);
			} catch (err) {
				// Fatal error.
				throw util.error(err);;
			}

			return this;
		},

		/**
		 * Stop HTTP(S) listener.
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