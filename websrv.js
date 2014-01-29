/*jslint vars: true */
"use strict";
module.exports = function (app) {
	var config = require('./config');
	var express = require("express");
	app.use(express.compress());
	app.use(express.static(config.clientPath, { maxAge: config.maxAge }));
	console.log("Module 'websrv' loaded");
};