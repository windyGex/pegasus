<!doctype HTML>
<html>
<head>
<meta charset="utf-8" />
<title>天马HTTP中间件使用手册</title>
<style>
body {
font-family: Tahoma;
font-size: 10pt;
line-height: 170%;
padding: 0 10pt;
}

nav {
background: gray;
color: white;
overflow-x: hidden;
overflow-y: auto;
position: fixed;
top: 0;
left: 0;
bottom: 0;
width: 240px;
}

header {
padding-left: 240px;
}

header h1 {
color: #17365d;
font-size: 18pt;
font-weight: normal;
margin: 0;
padding: 0.5em 0;
text-align: right;
}

article {
padding-left: 240px;
}

article h2 {
border-bottom: dotted 1px #777;
color: #4f81bd;
font-size: 11pt;
margin: 1em 0;
padding: 0 0 0.3em 0;
}

article h3 {
color: #000;
font-size: 11pt;
margin: 1em 0;
padding: 0;
}

article h4 {
color: #000;
font-size: 10pt;
margin: 1em 0;
padding: 0;
}

article p {
margin: 1em 0;
}

article p code {
border: 1px solid #ccc;
color: #d14;
}

article p strong {
color: #f00;
}

article pre {
background: #eee;
border-left: solid 2px #3c0;
color: #000;
margin: 1em 0;
padding: 0 0 0 2em;
}

article blockquote {
background: #fff;
border: dashed 1px #777;
border-left: solid 2px #777;
color: #000;
margin: 0;
padding: 0 0 0 2em;
}

nav ul {
margin: 10px;
padding: 0;
}

nav a {
color: white;
text-decoration: none;
}

nav a:hover {
text-decoration: underline;
}

nav li {
list-style: none;
margin: 0;
padding: 0;
}

nav .level2 {
font-size: 11pt;
font-weight: bold;
}

nav .level3 {
padding-left: 1em;
}

nav .level3:before { 
content: "» ";
}

nav .level4 {
padding-left: 2em;
}

nav .level4:before { 
content: "› ";
}

footer {
border-top: 1px solid #ccc;
font-size: 10pt;
margin-top: 4em;
padding-left: 240px;
}
</style>
</head>
<body>
<header>
<x-markdown src="section/00_header.md" />
</header>
<nav>
<x-index />
</nav>
<article>
<x-markdown src="section/01_getting_started.md" />
<x-markdown src="section/02_router.md" />
<x-markdown src="section/03_pipeline_pipe.md" />
<x-markdown src="section/04_request_response.md" />
<x-markdown src="section/05_session_application_storage.md" />
<x-markdown src="section/06_utilities.md" />
</article>
<footer>
<x-markdown src="section/99_footer.md" />
</footer>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-48219354-1', 'nqdeng.github.io');
  ga('send', 'pageview');
</script>
</body>
</html>