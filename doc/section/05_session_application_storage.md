存储
----------------------------------------------------------

由于HTTP是无状态的，如果需要多个HTTP请求共享一些数据时就需要用到存储。中间件为此提供了三种存储方式。

### session

session对象为每个用户提供独立的数据存储空间。当用户使用某个浏览器第一次请求服务器后，服务器会生成一个唯一的`session id`并以cookie的方式返回给浏览器。浏览器再次请求服务器时，服务器就能够通过cookie中的`session id`来识别用户。

#### 启用session

session默认是禁用的。可以按照以下方式为每条流水线单独配置和启用session对象：

	createServer(80)
		.mount('/', { session: 30 }, [
			function (context, next) {
				var session = context.session;

				session.count = (session.count || 0) + 1;
				context.response
					.write(session.count);
				next();
			}
		]);

	---------------
	# 模拟某用户发起的第一次请求。
	curl -i http://localhost/
	  >> ...
	  >> Set-Cookie: __pegasus_sid=b9dddf32ab28a93e37d200d98f1f3ec3; HttpOnly
	  >> ...
	  >> 1
	# 模拟某用户发起的第二次请求。
	curl --cookie "__pegasus_sid=b9dddf32ab28a93e37d200d98f1f3ec3" http://localhost/
	  >> 2

#### session有效期

用户使用某个浏览器第一次请求服务器后，服务器为其生成一个session对象。浏览器在有效期内再次请求服务器时，复用之前的session对象，并且重新计算有效期。超过有效期时，之前的session对象被废弃，服务器重新生成一个session对象。有效期的单位是秒，设置为零或未设置时禁用session。例如，以下配置为某条流水线设置了30分钟的session：

	.mount('/', { session: 1800 }, [ ...

### application

application对象为每条流水线提供全局数据存储空间，在每条流水线处理的所有HTTP请求之间共享。储存在application对象中的数据会一直保存到服务器关闭为止。示例如下：

	createServer(80)
		.mount('/', [
			function (context, next) {
				var application = context.application;

				application.count = (application.count || 0) + 1;
				context.response
					.write(application.count);
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> 1
	curl http://localhost/
	  >> 2

### storage

storage函数提供了类似关系数据库的持久存储能力，以JSON格式将数据保存在磁盘文件中。在JSON文件中，数据按照一个键（key）下按插入顺序存储多个值（value）的方式扁平存放,示例如下。

	{
		"message": [ "Hello", "World" ]
	}

#### 打开数据库

按照以下方式打开一个已有数据库，或新建一个空数据库。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var db = context.storage('./storage/db.json');

				context.response
					.write('DB opended.');
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> DB opended.

#### 插入数据（insert）

按照以下方式在一个键下插入一个值，插入的值使用JSON.stringify序列化为字符串后保存。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var db = context.storage('./storage/db.json');

				db.insert('people', { name: 'Jim', age: 27 });
				db.insert('people', { name: 'Tom', age: 26 });
				context.response
					.write('2 records inserted.');
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> 2 records inserted.

#### 读取数据（select）

按照以下方式读取某个键下的数据，未指定筛选条件时读取某个键下的所有数据。接着上例。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var db = context.storage('./storage/db.json');

				db.select('people').forEach(function (value) {
					context.response
						.write(value.name + ':' + value.age + '\n');
				});
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> Jim:27
	  >> Tom:26

#### 筛选条件（filter）

筛选条件是一个JS代码片段，用于判断是否对某个值使用某操作。代码片段中，`$`表示值本身，`#`表示值在数组中的索引（`#`在代码片段中当作变量名使用）。代码片段运行后，返回真值（true、1等）时应用某操作，返回假值时（false、null等）跳过某操作。接着上例。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var db = context.storage('./storage/db.json');

				db.select('people', '$.age==27').forEach(function (value) {
					context.response
						.write(value.name + ':' + value.age + '\n');
				});
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> Jim:27

#### 更新数据（update）

按照以下方式更新某个键下的数据，未指定筛选条件时更新某个键下的所有数据。接着上例。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var db = context.storage('./storage/db.json');

				db.update('people', { name: 'Kim', age: 27 }, '$.age==27');
				db.select('people').forEach(function (value) {
					context.response
						.write(value.name + ':' + value.age + '\n');
				});
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> Kim:27
	  >> Tom:26

#### 删除数据（remove）

按照以下方式删除某个键下的数据，未指定筛选条件时删除某个键下的所有数据。接着上例。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var db = context.storage('./storage/db.json');

				db.remove('people', '#==0');
				db.select('people').forEach(function (value) {
					context.response
						.write(value.name + ':' + value.age + '\n');
				});
				next();
			}
		]);

	---------------
	curl http://localhost/
	  >> Tom:26