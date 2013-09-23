入门
-------------------

天马HTTP中间件（以下简称中间件）提供了搭建HTTP服务所必须的功能，包括了基于路由器和流水线的HTTP处理模型，以及各种基础功能。

### 安装

>	npm install pegasus

### 使用

中间件需要用一些NodeJS代码包装一下，才能搭建HTTP服务器，并在上边配置路由规则和挂载流水线。下例中的`createServer`函数实现了这个功能。后续的例子中会用到这个函数。

	var http = require('http'),
		pegasus = require('pegasus');

	function createServer(port) {
		var router = pegasus.createRouter();

		http.createServer(function (request, response) {
			var data = [];
		
			request.on('data', function (chunk) {
				data.push(chunk);
			});
		
			request.on('end', function () {
				request.body = Buffer.concat(data);
				router.route(request, response);
			});
		}).listen(port);

		return router;
	}

>	注意： 为了正确处理带有数据的POST请求，需要将请求数据赋值给`request.body`属性后，再将NodeJS原生的`request`和`response`对象传递给路由器。

### curl

curl是一个常见的命令行工具，可以查看HTTP请求的响应结果。例如在终端下输入以下命令。

	curl http://www.google.com/
	    >> <HTML><HEAD><meta ...

可以看到服务器返回了一个HTML页面。后续的例子中会用到该工具来演示示例代码的运行结果。
