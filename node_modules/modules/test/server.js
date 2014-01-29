var http = require('http'),
	url = require('url'),
	path = require('path'),

	modules = require('../modules'),
	express = require('express');

var app = express();
app.use(modules.middleware({
	root: path.dirname(__dirname),
	path: '/module/',
	map: { 'test':'./test/index.js' }
}));
app.use(express.static(__dirname));
app.listen(8000);

