/**
 * Pegasus - Parser - Urlencoded
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var qs = require('querystring'),
	util = require('../util');

	/**
	 * Parse urlencoded post request.
	 * @param bin {Buffer}
	 * @param parameter {string}
	 * @param charset {string}
	 * @return {Object}
	 */
var parse = function (bin, parameter, charset) {
		var txt = decodeURIComponent(util.decode(bin, charset)),
			data = qs.parse(txt);

		return data;
	};

exports.parse = parse;