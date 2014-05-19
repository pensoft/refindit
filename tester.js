/*global test_search_simple: false, test_search_advanced: false, test_format: false, test_websrv: false */
"use strict";

var config  = require('./config');
var p = require('./debug')().p;
var host = 'http://localhost:' +  config.port + '/';

module.exports = function (app) {
	var tests = {
		'search': [test_search_simple, test_search_advanced],
		'format': [test_format],
		'import': [],
		'gnub'  : [],
		'websrv': [test_websrv]
	};
	config.modules2test.filter(function (module) { return config.modules.indexOf(module) > -1}).forEach(function (module) {
		tests[module].forEach(function (test) {
			test.call();
		});
	});
	console.log("Module 'tester' loaded");
};

function test_search_simple() {
	require('request')(host + 'find?search=simple&text=Miranda', function (err, res, body) {
		//p(err)
		//JSON.parse(body).map(function (ref) {
		//	p(ref);
		//});
	});
}

function test_search_advanced() {
	require('request')(host + 'find?search=advanced&author=Penev&year=2010&origin=ZooKeys', function (err, res, body) {
		//p(body)
		//JSON.parse(body).map(function (ref) {
		//	p(ref);
		//});
	});
}

function test_format() {
	var ref = {
		"authors": [
			["Noel Fcc", "de Miranda"],
			["Roujun", "Peng"],
			["Konstantinos", "Georgiou"],
			["Chenglin", "Wu"],
			["Elin Falk", "Sorqvist"],
			["Mattias", "Berglund"],
			["Longyun", "Chen"],
			["Zhibo", "Gao"],
			["Kristina", "Lagerstedt"],
			["Susana", "Lisboa"],
			["Fredrik", "Roos"],
			["Tom", "van Wezel"],
			["Manuel R", "Teixeira"],
			["Richard", "Rosenquist"],
			["Christer", "Sundstrom"],
			["Gunilla", "Enblad"],
			["Mats", "Nilsson"],
			["Yixin", "Zeng"],
			["David", "Kipling"],
			["Qiang", "Pan-Hammarstrom"]
		],
		"doi": "10.1084/jem.20122842",
		"href": "http://dx.doi.org/10.1084/jem.20122842",
		"title": "DNA repair genes are selectively mutated in diffuse large B cell lymphomas.",
		"year": "2013",
		"publishedIn": "The Journal of experimental medicine",
		"firstauthor": [
			"Noel Fcc", "de Miranda"
		],
		"isParsed": true,
		"id": {
			"pubmed": "23960188"
		}
	},
		style = 'zookeys'; // 'foerster-geisteswissenschaft';
	require('request')(host + 'format?style=' + style + '&ref=' + encodeURIComponent(JSON.stringify(ref)), function (err, res, body) {
		//p(body);
	});
}

function test_websrv() {
	require('request')(host + 'index.html',  function (err, res, body) {
		//p(body);
	});
}