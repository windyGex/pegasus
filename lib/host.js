var domain = require('domain'),
	http = require('http'),
	https = require('https'),
	MountTable = require('./mountTable'),
	serverRequest = require('./serverRequest'),
	serverResponse = require('./serverResponse'),
	url = require('url'),
	util = require('./util'),
	version = require('./version');

var PATTERN_MOUNT_POINT = /^([^\/]+?)?(\/.*?)?$/,

	PATTERN_LAST_SLASH = /\/?$/,

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
				router = this._route.bind(this),
				fn = function (request, response) {
					var body = [];

					request.on('data', function (chunk) {
						body.push(chunk);
					});

					request.on('end', function () {
						var sandbox = domain.create();

						sandbox.on('error', function (err) {
							var detail = (err.stack
									|| 'Error: ' + (err.message || err))
									+ util.format('\n    at //%s%s',
										request.headers.host, request.url);

							response.writeHead(500, {
								'Content-Type': 'text/plain',
								'Server': 'pegasus/' + version.number
							});

							response.end('[!] Internal Server Error'
								+ '\n'
								+ '---------------------------'
								+ '\n'
								+ detail
							);

							console.error('[%s] %s',
								new Date().toLocaleTimeString(), detail);
						});

						sandbox.run(function () {
							var req = serverRequest.create({
									body: Buffer.concat(body),
									charset: config.charset,
									request: request,
									router: router
								}),
								res = serverResponse.create({
									charset: config.charset,
									hasBody: req.method !== 'HEAD',
									response: response
								});

							router(req, res);
						});
					});
				};

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
		 * Route to pipeline.
		 * @param request {Object}
		 * @param response {Object}
		 */
		_route: function (request, response) {
			var config = this._config,
				mountTable = this._mountTable;

			process.nextTick(function () {
				mountTable.dispatch({
					charset: config.charset,
					request: request,
					response: response
				});
			});
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
		 * @param callback {Function}
		 * @return {Object}
		 */
		start: function (callback) {
			var http = this._httpServer,
				https = this._httpsServer,
				config = this._config,
				onStart = (callback || function () {}).bind(this);

			http && http.listen(config.port, config.ip || undefined, onStart);
			https && https.listen(config.portssl, config.ip || undefined, onStart);

			return this;
		},

		/**
		 * Stop service.
		 * @param callback {Function}
		 * @return {Object}
		 */
		stop: function (callback) {
			var http = this._httpServer,
				https = this._httpsServer,
				onStop = (callback || function () {}).bind(this);

			http && http.close(onStop);
			https && https.close(onStop);

			return this;
		}
	});

module.exports = Host;
