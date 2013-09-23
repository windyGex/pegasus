工具集
------------------

中间件提供了一些工具函数，除了用于编写中间件自身代码外，还可用于编写模块。可以通过以下方式访问工具函数。

	var pegasus = require('pegasus'),
		util = pegasus.util;

### util.throwError

用于抛出一个自定义错误。

	try {
		util.throwError('hello %s', 'world');
	} catch (err) {
		try {
			util.throwError(new Error(err.message));
		} catch (err) {
			console.log(err.message); // => hello world
		}
	}

>	注意： 做异常捕获时可以通过`util.isCheckedError`来判断捕获的是否是自定义错误。

### util.format

返回格式化之后的字符串。

	util.format('hello %s', 'world'); // => "hello world"

### util.log

在标准输出流（stdout）中打印一条日志，并附上时间戳。

	util.log('hello %s', 'world');  // => [10:34:06] hello world

### util.error

在标准错误流（stderr）中打印一条日志，并附上时间戳。

	util.error('hello %s', 'world');  // => [10:34:06] hello world

### util.isArray

用于判断某个变量是否是数组类型。

	util.isArray([]); // => true
	util.isArray({}); // => false

### util.isBoolean

用于判断某个变量是否是原始布尔类型。

	util.isBoolean(false); // => true
	util.isBoolean(new Boolean(false)); // => false

### util.isCheckedError

用于判断某个变量是否是自定义错误类型。

	try {
		util.throwError('custom error');
	} catch (err) {
		util.isCheckedError(err); // => true
		util.isCheckedError(new Error('native error')); // => false
	}

### util.isDate

用于判断某个变量是否是日期类型。

	util.isDate(new Date()); // => true
	util.isDate(2013); // => false

### util.isError

用于判断某个变量是否是错误类型。

	try {
		util.throwError('custom error');
	} catch (err) {
		util.isError(err); // => true，自定义错误继承于原生错误
		util.isError(new Error('native error')); // => true
		util.isError({}); // => flase
	}

### util.isFunction

用于判断某个变量是否是函数类型。

	util.isFunction(function() {}); // => true
	util.isFunction({}); // => false

### util.isNull

用于判断某个变量是否是空值。

	util.isNull(null); // => true
	util.isNull(undefined); // => false

### util.isNumber

用于判断某个变量是否是原始数字类型。

	util.isNumber(1); // => true
	util.isNumber(new Number(1)); // => false

### util.isObject

用于判断某个变量是否是对象类型。

	util.isObject({}); // => true
	util.isObject([]); // => true
	util.isObject(function() {}); // => true
	util.isObject(1); // => false

>	注意：除了原始数据类型（number、string等等）以外的一切类型都是对象类型。如果仅需要判断给定变量是否是一个普通对象，请使用`util.type`函数。

### util.isRegExp

用于判断某个变量是否是正则表达式类型。

	util.isRegExp(/\w/); // => true
	util.isRegExp('\\w'); // => false

### util.isString

用于判断某个变量是否是原始字符串类型。

	util.isString('hello'); // => true
	util.isString(new String('hello')); // => false

### util.isUndefined

用于判断某个变量是否未定义。

	util.isUndefined(undefined); // => true
	util.isUndefined(null); // => false

### util.type

用于返回某个变量的类型。

	util.type(undefined);         // => "undefined"
	util.type(1);                 // => "number"
	util.type(false);             // => "boolean"
	util.type('hello');           // => "string"
	util.type(function() {});     // => "function"
	util.type(/\w/);              // => "regexp"
	util.type([]);                // => "array"
	util.type(new Date());        // => "date"
	util.type(new Error());       // => "error"
	util.type({});                // => "object"
	util.type(null);              // => "null"

### util.inherit

创建一个子类构造函数。

	var Human = util.inherit(Object, {
			_initialize: function (config) { // 可选初始化函数。
				this._name = config.name;
			},
			greet: function () {
				console.log('Hello, my name is %s', this._name);
			}
		}),
		Student = util.inherit(Human, {
			_initialize: function (config) {  // 可选初始化函数。
				Student.superclass._initialize.apply(this, arguments);
				this._number = config.number;
			},
			greet: function () {
				Student.superclass.greet.apply(this);
				console.log('My number is %s', this._number);
			}
		});

	new Student({ name: 'Jim Green', number: 1 })
		.greet();  // => Hello, my name is Jim Green
	               // => My number is 1

通过该方法创建的构造函数也可以按以下方式创建一个子类构建函数。

	var Student = Human.extend({
			_initialize: function (config) { ... },
			greet: function () { ... }
		});

### util.mix

从第二个参数开始，按从左到右的顺序依次把所有可枚举属性浅度合并到第一个参数上，并返回第一个参数。

	console.log(util.mix(
		{ foo: 1 }, { foo: 2 }, { bar: 3 }));  // => { foo: 2, bar: 3 }

也可以通过最后一个可选布尔参数决定是否覆盖已有属性。

	console.log(util.mix(
		{ foo: 1 }, { foo: 2 }, { bar: 3 }, false));  // => { foo: 1, bar: 3 }

参数中如果有空值，会被忽略掉。
	
	console.log(util.mix(
		{ foo: 1 }, null, { bar: 3 }));  // => { foo: 1, bar: 3 }

### util.merge

等价于`util.mix({}, obj1, obj2...)`。

	console.log(util.merge(
		{ foo: 1 }, { foo: 2 })); // => { foo: 2 }
	console.log(util.merge(
		{ foo: 1 }, { foo: 2 }, false)); // => { foo: 1 }
	console.log(util.merge(
		null, { foo: 2 })); // => { foo: 2 }

### util.each

类似于数组的`forEach`方法，只不过遍历的是对象的可枚举键值对。

	util.each({ foo: 1, bar: 2 }, function (value, key) {
		this.log('%s:%s', key, value);
	}, console);

	---------------
	foo:1
	bar:2

### util.keys

获取对象所有可枚举键的集合。

	util.keys({ foo: 1, bar: 2 });  // => [ 'foo', 'bar' ]

### util.values

获取对象所有可枚举值的集合。

	util.values({ foo: 1, bar: 2 });  // => [ 1, 2 ]

### util.append

在对象中使用同一个键保存多个值。

	var obj = { foo: 1 };

	util.append(obj, 'foo', 2 );
	util.append(obj, 'bar', 3 );
	console.log(obj);  // => { foo: [ 1, 2 ], bar: 3 }

### util.toArray

主要用于将`arguments`对象转换为数组。

	(function () {
		util.isArray(arguments);  // => false
		util.isArray(util.toArray(arguments));  // => true
	}());

### util.unique

依次将输入数组中元素不重复地插入一个新数组并返回。

	util.unique([ 1, 2, 2, 3 ]); // => [ 1, 2, 3 ]

### util.wildcard

使用通配符表达式匹配输入字符串，`*`匹配任意多个字符，`?`匹配任意单个字符。

	util.wildcard('f*', 'foo');  // => true
	util.wildcard('ba?', 'baz'); // => true

### util.tmpl

渲染类似ASP语法的模板，直接使用JS作为模板语言。详细模板语法请参考[JavaScript Micro-Templating](http://ejohn.org/blog/javascript-micro-templating/)。

可以先定义一个渲染函数后，多次渲染不同数据。

	var render = util.tmpl(
			'<ul>' +
			'<% list.forEach(function (value) { %>' +
			'<li><%= value %></li>' +
			'<% }); %>' +
			'</ul>'
		);

	render({ list: [ 'foo' ] });  // => <ul><li>foo</li></ul>
	render({ list: [ 'bar' ] });  // => <ul><li>bar</li></ul>

也可以同时传入模板和数据进行渲染。

	util.tmpl('<li><%= data %></li>', { data: 'foo' }); // => <li>foo</li>

### util.encode

使用指定编码将字符串转换为二进制数据。支持的编码请参考[iconv-lite](https://github.com/ashtuchkin/iconv-lite)。

	util.encode('中文', 'gbk'); // => <Buffer d6 d0 ce c4>

### util.decode

使用指定编码将二进制数据转换为字符串。支持的编码请参考[iconv-lite](https://github.com/ashtuchkin/iconv-lite)。

	util.decode(new Buffer([ 0xd6, 0xd0, 0xce, 0xc4 ]), 'gbk'); // => "中文"

### util.mime

查找扩展名对应的MIME类型。

	util.mime('.css');  // => text/css
	util.mime('foo/bar.js');  // => application/javascript

### util.request

发起一个请求，并在回调中读取响应数据。支持`http(s):`与`file:`两种协议。

	util.request('http://www.google.com', function (response) {
		console.log(response.statusCode);  // => 302
		console.log(response.headers);  // => { location: 'http://...
		console.log(response.body);  // => <Buffer 3c 48 54 4d ...
	});

>	注意： 这里的response对象和`context.request`方法对应的response对象是不同的。