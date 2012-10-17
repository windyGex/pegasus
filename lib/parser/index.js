/**
 * Tianma - Parser
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var json = require('./json'),
	multipart = require('./multipart'),
	urlencoded = require('./urlencoded'),
	util = require('../util');


var PATTERN_CONTENT_TYPE = /^(.*?)\s*(?:;\s*(.*))?$/,

	parserMap = {
		'application/json': json,
		'application/x-www-form-urlencoded': urlencoded,
		'multipart/form-data': multipart
	},

	/**
	 * Parse request body.
	 * @param bin {Buffer}
	 * @param contentType {string}
	 * @param charset {string}
	 * @return {Object|null}
	 */
	parse = function (bin, contentType, charset) {
		var re = contentType.match(PATTERN_CONTENT_TYPE),
			type,
			parameter,
			parser,
			data;

		if (re) {
			type = re[1];
			parameter = re[2] || '';
			parser = parserMap[type];
			data = parser && parser.parse(bin, parameter, charset);
			if (data) {
				return {
					data: data,
					type: type
				};
			}
		} else {
			util.error('Content-Type "%s" is invalid', contentType);
		}

		return null;
	};

exports.parse = parse;