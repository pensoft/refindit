/*jslint node: true, nomen: true, vars: true, white: true, devel: true, stupid: true */
/*global craft: false, formatReference: false, common2csl: false */
"use strict";

module.exports = function (app){
	app.get('/format', craft); // return
	app.get('/format/list', list); //get formatters as json
	app.get('/format/generate-list', generateList); //generate formatters list
	console.log("Module 'format' loaded");
};

var config = require('./config');
var fs = require('fs');
var p = require('./debug')().p;
var formatterList = './format/list.json'
var xml2json = require('xml2js').parseString;
var crypto = require('crypto');

function craft(req, res) {
	var q = req.query;
	var style = q.style;
	var ref = q.ref;
	var result = formatReference(ref, style);
	res.setHeader('Access-Control-Allow-Origin', '*');
	if (result) {
		res.send(result);
	}
	else {
		res.sendfile(config.apidoc);
	}
}

function common2csl(ref) {
	try {
		ref = JSON.parse(ref);
	}
	catch (e) {
		return {};
	}
	var authors = [];
	if (Array.isArray(ref.authors)) {
		authors = ref.authors.map(function (author) {
			return { "family" : author[1],
				"given"  : author[0]};
		});
	}
	return {
		"id": "ITEM-1",
		author:				authors,
		DOI:				ref.doi,
		title:				ref.title,
		issued:				{ "date-parts": [[ parseInt(ref.year, 10)]] },
		"container-title":	ref.publishedIn,
		volume:				ref.volume,
		issue:				ref.issue,
		page:				ref.spage + '-' + ref.epage
	};
}

function formatReference(ref, styleName) {
	var my_ids = ["ITEM-1"];
	var dontSort = true;
	var CSL = require('./format/citeprocnode');
	var sys = {};
	var lang = 'en-US';
	var result = common2csl(ref);
	var stylePath = config.stylesPath + styleName + '.csl';
	if (!fs.existsSync(stylePath)) {
		return "ERROR: The specified style doesn't exist on the server.";
	}
	if (Object.keys(result).length === 0) {
		return 'ERROR: Unable to parse the reference as JSON.';
	}
	sys.retrieveLocale = function(lang){
		fs.readFileSync(config.localesPath + 'locales-' + lang + '.xml', 'utf8');
	};
	sys.getAbbreviations = function(name){
		return { default: {} }[name];
	};
	sys.retrieveItem = function(id){
		return result;
	};
	var style = fs.readFileSync(stylePath, 'utf8');
	var citeproc = new CSL.createEngine(sys, style, lang);
	citeproc.updateUncitedItems( my_ids, dontSort);
	var mybib = citeproc.makeBibliography();
	var html='';
	if (mybib){
		html = mybib[1][0];
	}
	return html;
}

function list(req, res) {
	res.header('Content-type', 'application/json; charset=utf-8');
	res.header('Access-Control-Allow-Origin', '*');
	if(fs.existsSync(formatterList)) {
		var data = fs.readFileSync(formatterList, 'utf8');
		res.send(data);
	} else {
		res.send(JSON.stringify({error : 'Unable to get data'}));
	}
}

function generateList(req, res) {
	var json = new Object();
	res.header('Access-Control-Allow-Origin', '*');
	var files = fs.readdirSync(config.stylesPath)
		.filter(function(elm) {
			return elm.match(/.*\.(csl?)/ig);
		});
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		var data = fs.readFileSync(config.stylesPath  + file, 'utf8');
		xml2json(data, function (err, res) {
			var title = res.style.info[0].title[0];
			json[crypto.createHash('md5').update(title).digest('hex')] = title;
		});
	}
	fs.writeFile(formatterList, JSON.stringify(json,  null, 4), function (err, data) {
		if (err) {
			res.send('Unable to write to JSON list file');
			return console.log(err);
		}
		res.send('JSON list file generated');
	});

}