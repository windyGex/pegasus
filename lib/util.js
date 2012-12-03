/**
 * Pegasus - Utility
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var iconv = require('iconv-lite'),
	mime = require('mime');

var toString = Object.prototype.toString,

	slice = Array.prototype.slice,

	// Inherit from native utility.
	util = Object.create(require('util')),

	/**
	 * Format printf-like string.
	 * @param template {string}
	 * @param value {**}
	 * @return {string}
	 */
	format = util.format,

	/**
	 * Test whether type of input value is Array.
	 * @param value {*}
	 * @return {boolean}
	 */
	isArray = util.isArray,

	/**
	 * Test whether type of input value is Boolean.
	 * @param value {*}
	 * @return {boolean}
	 */
	isBoolean = util.isBoolean = function (value) {
		return typeof value === 'boolean';
	},

	/**
	 * Test whether type of input value is Date.
	 * @param value {*}
	 * @return {boolean}
	 */
	isDate = util.isDate,

	/**
	 * Test whether type of input value is Error.
	 * @param value {*}
	 * @return {boolean}
	 */
	isError = util.isError,

	/**
	 * Test whether type of input value is Function.
	 * @param value {*}
	 * @return {boolean}
	 */
	isFunction = util.isFunction = function (value) {
		return typeof value === 'function';
	},

	/**
	 * Test whether type of input value is Null.
	 * @param value {*}
	 * @return {boolean}
	 */
	isNull = util.isNull = function (value) {
		return value === null;
	},

	/**
	 * Test whether type of input value is Number.
	 * @param value {*}
	 * @return {boolean}
	 */
	isNumber = util.isNumber = function (value) {
		return typeof value === 'number' && isFinite(value);
	},

	/**
	 * Test whether type of input value is Object.
	 * @param value {*}
	 * @return {boolean}
	 */
	isObject = util.isObject = function (value) {
		return value === Object(value);
	},

	/**
	 * Test whether type of input value is RegExp.
	 * @param value {*}
	 * @return {boolean}
	 */
	isRegExp = util.isRegExp,

	/**
	 * Test whether type of input value is String.
	 * @param value {*}
	 * @return {boolean}
	 */
	isString = util.isString = function (value) {
		return typeof value === 'string';
	},

	/**
	 * Test whether type of input value is Undefined.
	 * @param value {*}
	 * @return {boolean}
	 */
	isUndefined = util.isUndefined = function(value) {
		return typeof value === 'undefined';
	},

	/**
	 * Convert array-like object to array.
	 * @param value {*}
	 * @return {boolean}
	 */
	toArray = util.toArray = function (obj) {
		return slice.call(obj);
	},

	/**
	 * Get type of input value.
	 * Copyright 2011 Yahoo! Inc. All rights reserved.
	 * @param value {*}
	 * @return {string}
	 */
	type = util.type = (function () {
		var TYPES = {
			'undefined'        : 'undefined',
			'number'           : 'number',
			'boolean'          : 'boolean',
			'string'           : 'string',
			'[object Function]': 'function',
			'[object RegExp]'  : 'regexp',
			'[object Array]'   : 'array',
			'[object Date]'    : 'date',
			'[object Error]'   : 'error'
		};
		return function (value) {
			return TYPES[typeof value]
				|| TYPES[toString.call(value)]
				|| (value ? 'object' : 'null');
		};
	}()),

	/**
	 * Create a child object or constructor.
	 * @param parent {Object|Function}
	 * @param methods {Object}
	 * @param properties {Object}
	 * @return {Object|Function}
	 */
	inherit = util.inherit = function (parent, methods, properties) {
		var child;

		if (isFunction(parent)) {
			child = function () {
				if (isFunction(this._initialize)) {
					this._initialize.apply(this, arguments);
				}
			};
			child.prototype = inherit(parent.prototype, isObject(methods) ?
				mix(methods, { constructor: child }) :  { constructor: child }, properties);
			// Mimic behavior of native Function.prototype.
			Object.defineProperty(child.prototype, 'constructor', { enumerable: false });
			child.superclass = parent.prototype;
			child.extend = inherit.bind(util, child);
		} else if (isObject(parent)) {
			child = Object.create(parent, properties);
			if (isObject(methods)) {
				mix(child, methods, false);
			}
		}

		return child;
	},

	/**
	 * Shallow copy properties from souce object to target object.
	 * @param target {Object}
	 * @param source {Object+}
	 * @param [override=true] {boolean}
	 * @return {Object}
	 */
	mix = util.mix = function () {
		var args = toArray(arguments),
			target = args[0] || {},
			overwrite = isBoolean(args[args.length - 1]) ? args.pop() : true,
			i, len1, source, keys, j, len2, key;

		for (i = 1, len1 = args.length; i < len1; ++i) {
			source = args[i];
			if (source) {
				keys = Object.keys(source);
				for (j = 0, len2 = keys.length; j < len2; ++j) {
					key = keys[j];
					if (!target.hasOwnProperty(key) || overwrite) {
						target[key] = source[key];
					}
				}
			}
		}

		return target;
	},

	/**
	 * Shallow copy properties from souce object to new-created empty object.
	 * @param source {Object+}
	 * @return {Object}
	 */
	merge = util.merge = function () {
		var args = toArray(arguments);

		args.unshift({});

		return mix.apply(util, args);
	},

	/**
	 * Iterate key-value pair in object or array.
	 * @param obj {Object|Array}
	 * @param iterator {Function}
	 * @param context {Object}
	 * @return {Object|Array}
	 */
	each = util.each = function (obj, iterator, context) {
		if (isArray(obj)) {
			return obj.forEach(iterator, context);
		} else {
			Object.keys(obj).forEach(function (key) {
				iterator.call(context || null, obj[key], key, obj);
			});
			return obj;
		}
	},

	/**
	 * Get keys of an object.
	 * @param obj {Object}
	 * @return {Array}
	 */
	keys = util.keys = Object.keys,

	/**
	 * Get values of an object.
	 * @param obj {Object}
	 * @return {Array}
	 */
	values = util.values = function (obj) {
		var result = [];

		each(obj, function (value) {
			result.push(value);
		});

		return result;
	},

	/**
	 * Test wildcard pattern on given value.
	 * @param pattern {string}
	 * @param value {string}
	 * @return {boolean}
	 */
	wildcard = util.wildcard = (function () {
		var cache = {};
		return function (pattern, value) {
			if (!cache[pattern]) {
				cache[pattern] = new RegExp(pattern
					.replace(/([\$\(\)\+\.\[\]\\\/\^\{\}\|])/g, '\\$1')	// Escape special characters.
					.replace(/\?/g, '.')	// Change wildcard character "?" to regular expression.
					.replace(/\*/g, '.*?')	// Change wildcard character "*" to regular expression.
					.replace(/^/, '^')
					.replace(/$/, '$'));
			}
			return cache[pattern].test(value);
		};
	}()),

	/**
	 * Store multiple value with the same key.
	 * @param obj {Object}
	 * @param key {string}
	 * @param value {*}
	 */
	append = util.append = function (obj, key, value) {
		if (!(key in obj)) {
			obj[key] = value;
		} else if (isArray(obj[key])) {
			obj[key].push(value);
		} else {
			obj[key] = [ obj[key], value ];
		}
	},

	/**
	 * Print log message.
	 * @param pattern {string}
	 * @param [value] {string}
	 * @return {string}
	 */
	log = util.log = function () {
		var msg = format.apply(util, arguments);

		console.log(msg);

		return msg;
	},

	/**
	 * Print error message with stack infomation.
	 * @param pattern {string}
	 * @param [value] {string}
	 * @return {Object}
	 */
	error = util.error = function (err) {
		if (!isError(err)) {
			err = new Error(format.apply(util, arguments));
		} else if (err.stack.indexOf('\n') === -1) {
			err = new Error(err.message);
		}

		console.error(err.stack);

		return err;
	},

	/**
	 * Fill template with data.
	 * Modified version of Simple JavaScript Templating
	 * John Resig - http://ejohn.org/ - MIT Licensed
	 * @param str {string}
	 * @param [data] {Object}
	 * @return {string|Function}
	 */
	tmpl = util.tmpl = (function () {
		var PATTERN_BACK_SLASH = /\\/g,
			PATTERN_LITERAL = /%>([\s\S]*?)<%/gm,
			PATTERN_QUOTE = /"/g,
			PATTERN_CR = /\r/g,
			PATTERN_LF = /\n/g,
			PATTERN_TAB = /\t/g,
			PATTERN_EXP = /<%=(.*?)%>/g,
			cache = {};

		return function (str, data) {
			var fn;

			if (!cache[str]) {
				cache[str] = new Function(
					'data',
					'var p=[],print=function(){p.push.apply(p,arguments);};' +
					'with(data){' +
						('%>' + str + '<%')
							.replace(PATTERN_LITERAL, function ($0, $1) {
								return '%>'
									+ $1.replace(PATTERN_BACK_SLASH, '\\\\')
										.replace(PATTERN_QUOTE, '\\"')
										.replace(PATTERN_CR, '\\r')
										.replace(PATTERN_LF, '\\n')
										.replace(PATTERN_TAB, '\\t')
									+ '<%';
							})
							.replace(PATTERN_EXP, '",$1,"')
							.replace(PATTERN_LITERAL, 'p.push("$1");') +
					'}return p.join("");'
				);
			}

			fn = cache[str];

			return data ? fn(data) : fn;
		};
	}()),

	/**
	 * Convert string to binary using specified charset.
	 * @param str {string}
	 * @param charset {string}
	 * @return {Buffer}
	 */
	encode = util.encode = iconv.encode,

	/**
	 * Convert binary to string using specified charset.
	 * @param bin {Buffer}
	 * @param charset {string}
	 * @return {string}
	 */
	decode = util.decode = iconv.decode,

	/**
	 * Lookup a mime type based on extension.
	 * @param extname {string}
	 * @return {string}
	 */
	mime = util.mime = mime.lookup.bind(mime);

module.exports = util;
