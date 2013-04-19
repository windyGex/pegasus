var clientResponse = require('./clientResponse'),
	fs = require('fs'),
	server = {
		'http:': require('http'),
		'https:': require('https')
	},
	url = require('url'),
	util = require('./util'),
	version = require('./version'),
	zlib = require('zlib');

var PATTERN_DRIVE_LETTER = /\/\w:/,

	/**
	 * Decompress gzip or deflate data.
	 * @param data {Buffer}
	 * @param encoding {string}
	 * @param callback {Function}
	 */
	decompress = function (data, encoding, callback) {
		if (encoding === 'gzip') {
			zlib.gunzip(data, callback);
		} else if (encoding === 'deflate') {
			zlib.inflate(data, callback);
		} else {
			callback(null, data);
		}
	},

	// ClientRequest contructor.
	ClientRequest = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._charset = config.charset;
			this._route = config.router;
			this._request = config.request;
		},

		/**
		 * Read local file.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		_fileRequest: function (pathname, callback) {
			var self = this;

			if (PATTERN_DRIVE_LETTER.test(pathname)) { // Remove leading slash for windows pathname.
				pathname = pathname.substring(1);
			}

			fs.stat(pathname, function (err, stats) {
				if (err) {
					callback(clientResponse.create({ status: 404 }));
				} else if (stats.isFile()) {
					fs.readFile(pathname, function (err, data) {
						if (err) {
							callback(clientResponse.create({ status: 500 }));
						} else {
							callback(clientResponse.create({
								status: 200,
								headers: {
									'content-length': stats.size,
									'last-modified': stats.mtime
								},
								body: data
							}));
						}
					});
				} else {
					callback(clientResponse.create({ status: 500 }));
				}
			});
		},

		/**
		 * Read pipeline.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		_loopRequest: function (options, callback) {
			var charset = this._charset,
				router = this._route,
				parentRequest = this._request,
				config = {},
				request = { // Fake native request.
					body: options.body,
					client: {
						remoteAddress: '127.0.0.1'
					},
					headers: options.headers,
					method: options.method,
					protocol: 'loop:',
					url: options.url
				},
				response = { // Fake native response.
					_fake: true,
					writeHead: function (status, headers) {
						config.status = status;
						config.headers = headers;
					},
					write: function (body) {
						config.body = body;
					},
					end: function () {
						delete parentRequest.subrequest;
						callback(clientResponse.create(config));
					}
				};

			parentRequest.subrequest = request;

			router(request, response);
		},

		/**
		 * Read remote server.
		 * @param options {Object}
		 * @param callback {Function}
		 */
		_httpRequest: function (options, callback) {
			var	body = options.body,
				protocol = options.protocol,
				request,
				self = this;

			if (protocol === 'https') { // Do not verify certificate.
				options.rejectUnauthorized = false;
			}

			// Remove unnecessary options.
			delete options['body'];
			delete options['protocol'];

			request = server[protocol].request(options, function (response) {
				var status = response.statusCode,
					headers = response.headers,
					encoding = headers['content-encoding'],
					body = [];

				response.on('data', function (chunk) {
					body.push(chunk);
				});

				response.on('end', function () {
					decompress(Buffer.concat(body), encoding, function (err, data) {
						if (err) {
							callback(clientResponse.create({ status: 500 }));
						} else {
							// Remove unnecessary headers.
							delete headers['content-length'];
							delete headers['content-encoding'];

							callback(clientResponse.create({
								status: status,
								headers: headers,
								body: data
							}));
						}
					});
				});
			});

			request.on('error', function (err) {
				callback(clientResponse.create({ status: 500 }));
			});

			body && request.write(body);
			request.end();
		},

		/**
		 * Request something.
		 * @param options {Object|string}
		 * @param callback {Function}
		 */
		request: function (options, callback) {
			// Refine arguments.
			if (util.isString(options)) {
				options = {
					href: options
				};
			}

			if (!options.headers) {
				options.headers = {};
			}

			var charset = this._charset,
				meta = url.parse(options.href);

			if (meta.auth) { // Hostname in href has the highest priority.
				options.headers.host = meta.auth
					+ (meta.port ? ':' + meta.port : '');
			}

			if (util.isString(options.body)) { // Convert body to binary.
				options.body = util.encode(options.body, charset);
			}

			switch (meta.protocol) {
			case 'file:':
				this._fileRequest(meta.path, callback);
				break;
			case 'loop:':
				this._loopRequest({
					body: options.body || new Buffer(0),
					headers: util.mix({
						host: meta.host,
						'user-agent': 'pegasus/' + version.number
					}, options.headers),
					method: options.method || 'GET',
					url: meta.path
				}, callback);
				break;
			case 'http:': // Fall through.
			case 'https:':
				this._httpRequest({
					body: options.body,
					headers: util.mix({
						'accept-encoding': 'gzip, deflate',
						host: meta.host,
						'user-agent': 'pegasus/' + version.number
					}, options.headers),
					hostname: options.hostname || meta.hostname,
					method: options.method || 'GET',
					path: meta.path,
					port: meta.port,
					protocol: meta.protocol
				}, callback);
				break;
			default:
				callback(clientResponse.create({ status: 500 }));
				break;
			}
		}
	});

/**
 * Create an instance.
 * @param config {Object}
 * @return {Function}
 */
exports.create = function (config) {
	var client = new ClientRequest(config);

	return client.request.bind(client);
};
