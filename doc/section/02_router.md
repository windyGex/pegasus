路由器
-------------------

路由器根据路由规则，使用相应的流水线来处理HTTP请求，并在完成之后将HTTP响应返回给客户端。

### 创建路由器（router）

首先按照以下方式创建路由器。

	var router = require('pegasus').createRouter({ charset: 'utf-8' });

配置项`charset`指定了按何种编码处理HTTP请求和响应，默认值为`utf-8`，支持的编码类型请参考[iconv-lite](https://github.com/ashtuchkin/iconv-lite)。

### 路由规则（rule）

在路由器上挂载流水线时需要按以下方式指定路由规则。

	router
		.mount('*.example.com', []) // 流水线一
		.mount('/css/', []) // 流水线二
		.mount('/', []); // 流水线三

路由规则通过第一个参数指定，由域名（hostname）和路径（pathname）组成，域名支持通配符（*和?）。可以同时配置域名和路径，也可以省略其中之一（默认域名为*，默认路径为/）。例如以下规则都是合法的。

	*.alibaba.com
	localhost/js/

与路由规则匹配的HTTP请求就会由相应的流水线处理。接着上例，有以下路由结果。

	http://style.example.com/js/ae.js  => 流水线一
	http://localhost/css/4v/common.css => 流水线二
	http://localhost/js/ae.js          => 流水线三

### 配置项（options）

在路由器上挂载流水线时可按照以下方式指定额外的配置型。

	router
		.mount('/', { session: 30 }, []);

上例中配置项`session`指定了为该流水线启用session，有效期为30秒。
