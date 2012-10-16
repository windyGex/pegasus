/**
 * Pegasus - Parser - JSON
 * Copyright(c) 2010 ~ 2011 Alibaba.com, Inc.
 * MIT Licensed
 */

var util = require('../util');

	/**
	 * Parse JSON ajax request.
	 * @param bin {Buffer}
	 * @param parameter {string}
	 * @param charset {string}
	 * @return {Object|null}
	 */
var parse = function (bin, parameter, charset) {
		var json = util.decode(bin, charset),
			data;

		try {
			data = JSON.parse(json);
			return data;
		} catch (err) {
			util.error(err);
			return null;
		}
	};

exports.parse = parse;