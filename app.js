/*jslint node: true, nomen: true, vars: true, white: true, devel: true */
"use strict";

var express = require('express');
var config = require('./config');
var p = require('./debug')().p;
var app = express();

app.use(express.logger());

config.initModules(app);

var port = process.env.PORT || config.port;
app.listen(port, function () {
	console.log('Listening on port ' + port);
});
