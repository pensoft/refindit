/*jslint node: true, nomen: true, vars: true, white: true, devel: true, stupid: true */
/*global craft: false, formatReference: false, common2csl: false */
"use strict";

module.exports = function (app){
	app.get('/format', craft);
	console.log("Module 'format' loaded");
};

var config = require('./config');
var p = require('./debug')().p;

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
	var fs = require('fs');
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