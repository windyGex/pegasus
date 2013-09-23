请求与响应
------------------------------

有请求就有响应，而请求可以由客户端发起，也可以由服务端发起。由客户端发起时，通过`context.request`和`context.response`这两个对象来处理客户端请求和响应。在处理过程中，如果需要由服务端发起额外请求，并根据服务端响应结果来决定如何处理客户端响应时，还可以把`context.request`当作函数调用，并在回调中获取服务端响应相关数据。

	createServer(80)
		.mount('/', [
			function (context, next) {
				var request = context.request, // 客户端请求
					response = context.response; // 客户端响应

				// 发起服务端请求。
				request('http://foo.com/', function (response) { // 服务端响应。
					next();
				});
			});

### 客户端请求

`context.request`对象用于读取客户端请求相关数据。

#### 请求地址（href）

一个完整的请求地址可以分解为以下部分：

	                           href
	 -----------------------------------------------------------
	                            host              path
	                      --------------- ----------------------
	 http: // user:pass @ host.com : 8080 /p/a/t/h ?query=string
	 -----    ---------   --------   ---- -------- -------------
	protocol     auth     hostname   port pathname     search

可以按照以下方式获取到请求地址的各部分：

	createServer(80)
        .mount('/', [
            function (context, next) {
                var request = context.request,
					response = context.response,
                    output = [
                        request.href,
                        request.protocol,
                        request.hostname,
                        request.port,
                        request.path,
                        request.pathname,
                        request.search,
                    ];

                response
                    .write(output.join('\n'));
                next();
            }
        ]);

	---------------
	curl http://localhost/foo/bar?v=1234
	  >> http://localhost/foo/bar?v=1234
	  >> http:
	  >> localhost
	  >> 80
	  >> /foo/bar?v=1234
	  >> /foo/bar
	  >> ?v=1234

#### 请求方法（method）

通过`request.method`属性可获取到请求方法，示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
                context.response
                    .write(context.request.method);
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> GET

#### 请求头（headers）

通过`request.head(key)`方法可获取到请求头中的某个字段，或整个请求头对象，示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
                var request = context.request,
                    response = context.response,
                    headers = request.head();

				Object.keys(headers).forEach(function(key) {
					response.write(key + ': ' + headers[key] + '\n');
				});
				response.write(request.head('user-agent'));
				next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> user-agent: curl/7.26.0
	  >> host： localhost
	  >> accept: */*
	  >> curl/7.26.0

#### 请求数据（body）

通过`request.body(charset)`方法可读取请求数据。`charset`参数等于"binary"时，使用二进制方式读取。忽略该参数时，使用路由器默认编码读取。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
				context.response
                    .write(context.request.body())
                next();
            }
        ]);

	---------------
	curl --data hello http://localhost/
	  >> hello

#### 请求来源（ip）

通过`request.ip`属性可获取请求来源的IP。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
				context.response
                    .write(context.request.ip)
                next();
            }
        ]);

	---------------
	curl --data hello http://localhost/
	  >> 127.0.0.1

#### cookie

当HTTP请求包含cookie时，可通过`request.cookie`对象读取cookie数据。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
				var cookie = context.request.cookie;

                context.response
                    .write(cookie ? cookie.foo : 'no cookie');
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> no cookie
	curl --cookie "foo=bar" http://localhost/
	  >> bar

#### 查询字符串（query string）

当HTTP请求的URI中包含查询字符串（例如?id=1）时，可通过`request.query`对象读取查询字符串。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
                var query = context.request.query;

                context.response
                    .write(query ? query.foo : 'no query');
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> no query
	curl http://localhost/?foo=bar
	  >> bar

#### 表单请求（form post）

当HTTP请求是一个表单请求时，可通过`request.form`对象读取表单数据。对于`file`类型的表单字段，读取到的是一个`file`对象，提供了文件名（`file.name`），文件类型（`file.type`），文件二进制数据（`file.data`），文件大小（`file.size`）四个属性，以及一个保存文件的方法（`file.save(pathname)`）。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
                var form = context.request.form;

                if (form) {
                    form.upload.save('./upload/' + form.upload.name);
                    context.response
                        .write(
                            'title: ' + form.title + '\n' +
                            'file name: ' + form.upload.name + '\n' +
                            'file type: ' + form.upload.type + '\n' +
                            'file size: ' + form.upload.size + '\n' +
                            'file saved to: ' + './upload/' + form.upload.name
                        );
				}
                next();
            }
        ]);

	---------------
	## 使用curl模拟以下表单提交结果。
	# <form action="/upload" enctype="multipart/form-data" method="post">
	# <input type="text" name="title" />
	# <input type="file" name="upload" />
	# <input type="submit">
	# </form>
	curl --form upload=@hello.txt --form title=sample http://localhost/
	  >> title: sample
	  >> file name: hello.txt
	  >> file type: text/plain
	  >> file size: 13
	  >> file saved to: ./upload/hello.txt

#### JSON请求

当HTTP请求是一个JSON请求时，可通过`request.json`对象读取JSON数据。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
                var json = context.request.json;

                context.response
                    .write(json ? json.name : 'not a JSON request');
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> not a JSON request
	curl --data '{"name": "Jim Green"}' --header "Content-Type: application/json" http://localhost/
	  >> Jim Green

### 客户端响应

`context.response`对象用于读取和修改客户端响应数据。

#### 状态码（status）

通过`response.status(code)`方法可设置HTTP响应状态码。示例如下：

	createServer(80)
        .mount('/', [
            function (context, next) {
                context.response
                    .status(404);
                next();
            }
        ]);

	---------------
	curl --head http://localhost/
	  >> HTTP/1.1 404 Not Found
	  >> ...

客户端响应的默认状态码等于`404`。

#### 响应头（headers）

通过`response.head(key, value)`方法可读取或设置响应头。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                var response = context.response;

                response
                    .head('x-example', 'foo')
                    .head('x-example', response.head('x-example') + 'bar');
                next();
            }
        ]);

	---------------
	curl --head http://localhost/
	  >> ...
	  >> X-Example: foobar
	  >> ...

`response.head`方法省略参数时返回整个响应头对象，参数是一个对象时使用传入的对象作为响应头。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                var response = context.response,
					headers = response.head();

				headers['x-exampe'] = 'foobar';
                response
                    .head('headers');
                next();
            }
        ]);

	---------------
	curl --head http://localhost/
	  >> ...
	  >> X-Example: foobar
	  >> ...

#### cookie

通过`response.cookie(name, value, options)`方法可为HTTP响应设置cookie。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                context.response
                    .cookie('foo', 'bar', {
                        maxAge: 0,
                        domain: 'localhost',
                        path: '/',
                        expires: new Date(),
                        httpOnly: true,
                        secure: true
                    });
                next();
            }
        ]);

	---------------
	curl --head http://localhost/
	  >> ...
	  >> Set-Cookie: foo=bar; Domain=localhost; Path=/; Expires=Tue, 04 Dec 2012 03:03:14 GMT; HttpOnly; Secure
	  >> ...

#### 响应数据（body）

通过`response.write(data)`方法可追加响应数据。`data`参数支持字符串与二进制两种类型。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                context.response
                    .write('foo')
                    .write('bar');
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> foobar

通过`response.body(charset)`方法可读取整个响应数据。忽略`charset`参数时，使用服务器默认编码。`charset`参数设置为`binary`时，使用二进制方式读取。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                context.response
                    .write('foo')
                    .write(context.response.body());
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> foofoo

通过`response.clear()`方法可清空之前添加的响应数据。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                context.response
                    .write('foo')
                    .clear()
                    .write('bar');
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> bar

#### 发送响应

通过`response.end(data)`方法可以立即发送客户端响应。提供了`data`参数时，先追加响应数据再发送响应。

一条流水线上的所有模块执行完毕后，流水线会自动调用`response.end`方法发送响应，因此一般不需要在模块里显式调用该方法。如果在一个模块里调用了该方法，则后续模块里对响应的操作会被忽略。示例如下：

	createServer(80)
        .mount('/', [
			function (context, next) {
                context.response
                    .end('foo');
                next();
            },
            function (context, next) {
                context.response
                    .write('bar');
                next();
            }
        ]);

	---------------
	curl http://localhost/
	  >> foo

### 服务端请求

在模块中可以使用`context.request`函数发起一个服务端请求，示例如下：

	createServer(80)
        .mount('/foo', [
			function (context, next) {
                context.response
                    .write('foo');
                next();
            }
        ])
        .mount('/', [
			function (context, next) {
                var href = 'http://localhost/foo';

				context.request(href, function (response) {
					context.response
						.write(response.body());
					next();
				});
            }
        ]);

	---------------
	curl http://localhost/
	  >> foo

如果不满足于发起简单的GET请求，而希望有更加详细的控制，可以使用`options`对象代替`href`字符串，示例如下：

	createServer(80)
        .mount('/foo', [
			function (context, next) {
                context.response
                    .write(context.request.head('x-bar'));
                next();
            }
        ])
        .mount('/', [
			function (context, next) {
                var options = {
						href: 'http://localhost/foo', // 请求地址
						method: 'POST',               // 请求方法
						headers: {                    // 请求头
							'x-bar': 'bar'
						},
						body: 'foo'                   // 请求数据
					};

				context.request(options, function (response) {
					context.response
						.write(response.body());
					next();
				});
            }
        ]);

	---------------
	curl http://localhost/
	  >> bar

`href`参数支持使用以下协议。

#### http(s):

可以是任何标准的HTTP(S) URL，例如：

	http://localhost/foo.js?v=123
	https://www.example.com/bar
	http://10.20.131.161/baz

另外，可以通过以下方式同时指定IP和域名，用于绕过本地DNS解析。

	http://www.example.com@10.20.131.161/baz

#### file:

可以是任何标准的File URL，用于读取服务器本地文件，例如：

	file:///C:/htdocs/foo.js              # Windows
	file:///home/admin/htdocs/foo.js      # *nix

#### loop:

中间件专用协议，由`loop://`+`域名`+`路径`组成，用于绕开域名解析与网络传输层，直接对当前路由器下某条流水线发起高速请求，例如：

	loop://localhost/foo.js

以下是一个使用`loop:`协议的例子：

	createServer(80)
        .mount('pipeline.a', [
			function (context, next) {
                context.response
                    .write(context.request.pathname);
                next();
            }
        ])
        .mount('pipeline.b', [
			function (context, next) {
                context.response
                    .write(context.request.pathname);
                next();
            }
        ])
		.mount('/', [
			function (context, next) {
				context.request('loop://pipeline.a/foo', function (response) {
					context.response
						.write(response.body());
					next();
				});
		    }
		]);

	---------------
	curl http://localhost/
	  >> foo

### 服务端响应

`context.request`函数的回调函数返回一个`response`对象，用于读取服务端响应相关数据。

#### 状态码（status）

通过`response.status`属性可读取响应状态码。示例如下：

	createServer(80)
		.mount('/', [
			function (context, next) {
				context.request('file:///not/exists', function (response) {
					context.response
						.write(response.status);
					next();
				});
			}
		]);

	---------------
	curl http://localhost/
	  >> 404

#### 响应头（headers）

通过`response.head(key)`方法可读取响应头，提供`key`参数时得到某一字段，不提供时得到整个响应头对象。示例如下：

	createServer(80)
		.mount('pipeline.a', [
			function (context, next) {
				context.response
					.head('x-foo', 'foo')
					.head('x-bar', 'bar');
				next();
			}
		])
		.mount('/', [
			function (context, next) {
				context.request('loop://pipeline.a/', function (response) {
					context.response
						.write(response.head('x-foo'))
						.write(response.head()['x-bar']);
					next();
				});
			}
		]);

	---------------
	curl http://localhost/
	  >> foobar

>	通过`http(s):`与`loop:`协议得到的响应头内容取决于请求的服务器，而通过`file:`协议得到的200响应头固定包含`content-length`、`content-type`和`last-modified`三个字段。

#### 响应数据（body）

通过`response.body(charset)`方法可读取响应数据。忽略`charset`参数时，使用服务器默认编码。`charset`参数设置为`binary`时，使用二进制方式读取。示例如下：

	createServer(80)
		.mount('pipeline.a', [
			function (context, next) {
				context.response
					.write('foobar');
				next();
			}
		])
		.mount('/', [
			function (context, next) {
				context.request('loop://pipeline.a/', function (response) {
					context.response
						.write(response.body());
					next();
				});
			}
		]);

	---------------
	curl http://localhost/
	  >> foobar
