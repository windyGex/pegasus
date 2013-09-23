流水线与模块
------------------------------

流水线由若干个模块连接而成，每个模块依次完成HTTP处理工作。

### 创建流水线

可按照以下方式创建一个流水线。

	createServer(80)
		.mount('/', [
			function (context, next) {
				context.response
                    .write('Hello');
				next();
			},
			function (context, next) {
				context.response
                    .write('World');
				next();
			}
		]);

	-----------------------
	curl http://localhost/
	  >> HelloWorld

可以看到，流水线是一个数组，其中的每个函数被称为模块。每个函数依次执行，在完成HTTP处理工作后，需要调用`next()`将工作移交给下一个函数。

### 编写模块

模块是一个普通的函数，一般按照以下方式编写：

	function (context, next) {
		// HTTP处理工作相关代码。
		context.response
            .write('Hello');
		// 完成处理并移交工作。
		next();
	}

如果处理工作中有一些异步操作，就需要在回调函数中调用`next()`，示例如下：

	function (context, next) {
		// HTTP处理工作相关代码。
		fs.readFile('hello.txt', function (err, data) {
			context.response
				.write(data);
			// 完成处理并移交工作。
			next();
		});
	}

### 上下文对象（context）

流水线处理每个HTTP请求时，会生成一个对应的上下文对象，其中默认包含以下属性：

	context.base:string
	context.charset:string
	context.request:Function
	context.response:Object
	context.application:Object
	context.storage:Function

如果启用了session，上下文对象中还包含以下属性：

	context.session:Object

下边先介绍`context.base`和`context.charset`，其它属性在后续教程中详细介绍。

#### context.base

获取当前流水线的基础路径。该路径与流水线的路由规则对应，因此有以下例子。

	    路由规则                            基础路径
	-----------------------------------------------
	www.example.com                     /
	/foo/                               /foo/

通过该属性，模块可以判断HTTP请求路径中哪些部分是需要忽略的。

#### context.charset

获取当前路由器使用的编码。`request`和`response`对象使用该属性处理HTTP请求和响应，而模块也可以通过该属性来决定以怎样的编码处理数据。

#### 模块间数据传递

上下文对象在模块之间传递，因此可以通过在上下文对象上添加属性的方式在模块之间传递数据。以下是一个例子。

    createServer(80)
        .mount('/', [
            function (context, next) {
                context.foo = 'foo';
                next();
            },
            function (context, next) {
                context.response
                    .write(context.foo);
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> foo

### 编写复杂模块

当某个模块的功能比较复杂时，难以将所有代码塞到同一个函数里。因此中间件提供了编写复杂模块的机制，示例如下：

	// 简单的静态文件请求处理模块。
	var static = require('pegasus').createPipe({
		/**
		 * 定义了该函数时，会调用该函数执行初始化工作。
		 * @param config {Object} 配置对象。
		 */
		_initialize: function (config) {
			this._root = config.root || '.';
		},

		/**
		 * 模块入口函数，用于处理当前HTTP请求。
		 * @param request {Object} 等同于context.request
		 * @param response {Object} 等同于context.response
		 */
		main: function (request, response) {
			var context = this.context,
				next = this.next,
				// 计算静态文件绝对路径。
				pathname = path.join(this._root,
					request.pathname.replace(context.base, ''));

			// 读取文件。
			fs.readFile(pathname, function (err, data) {
				if (err) { // 无法读取文件。
					response
						.status(404);
				} else { // 返回文件。
					response
						.status(200)
						.write(data);
				}
				next();
			});
		},

		/**
		 * 定义了该函数时，会调用该函数判断是否处理当前HTTP请求。
		 * @param request {Object} 等同于context.request
		 * @param response {Object} 等同于context.response
		 * @return {boolean} 返回false时不处理当前请求，返回true时处理。
		 */
		match: function (request, response) {
			// 仅处理GET请求。
			return request.method === 'GET';
		}
	});

上例中定义的模块按照以下方式使用：

	createServer(80)
		.mount('/', [
			static({ root: '/home/admin/htdocs/' })
		]);

#### 发生了什么？！

上边编写复杂模块的例子或许有些复杂，接下来逐步说明一下：

1. 调用`pegasus.createPipe`时传入原型对象，并返回的是一个工厂函数。

2. 调用工厂函数时传入`config`对象创建和初始化模块。例如`static`函数执行后会新建以下对象：

		{
			_initialize: [[Function]],
			main: [[Function]],              <= 原型对象，
			match: [[Function]]
		}
		    ^
		    | 原型链
		    |
		{
			_root: [[string]]                <= 新建对象
		}

	对象创建后，会在新建对象上调用`_initialize`方法完成初始化工作。例如`static`模块的初始化函数通过`this._root`在新建对象上设置属性。

	模块初始化完毕后，工厂函数会返回自动创建的模块函数，同样接受`context`和`next`两个参数。

3. 当某个HTTP请求到达流水线并由以上模块函数处理时，模块函数会再新建一个对象。仍以`static`模块为例，新建对象如下：

		{
			_initialize: [[Function]],
			main: [[Function]],              <= 原型对象，
			match: [[Function]]
		}
		    ^
		    | 原型链
		    |
		{
			_root: [[string]]                <= 原型对象，
		}
		    ^
		    | 原型链
		    |
		{
			                                 <= 新建对象。
		}

	对象创建后，会在新建对象上调用`match`方法检查是否需要处理当前HTTP请求，并在需要时调用`main`函数。

	模块函数每次执行时新创建一个对象的方式，保证了原型链上的函数在每次处理HTTP请求的过程中可以通过`this`来设置和交换临时数据，并且不会污染原型对象，实现了不同HTTP请求处理过程的隔离。
