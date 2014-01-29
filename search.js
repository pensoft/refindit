/*jslint node: true, nomen: true, vars: true, white: true, devel: true */
/*global unifiedSearch: false, whatSearch: false, askDB: false, isDoi: false, isPmc: false, empty: false */
"use strict";

module.exports = function (app){
	app.get('/find', unifiedSearch);
	console.log("Module 'search' loaded");
};

var p = require('./debug')().p;
var config = require('./config');
var tools = require('./dbs/tools');

function unifiedSearch(req, response) {
	var search = whatSearch(req.query);
	var dbs = search.dbs;
	var n = dbs.length;
	if (n === 0) {
		return response.sendfile(config.apidoc);
	}
	response.setHeader('Content-type', 'application/json; charset=utf-8');
	response.setHeader('Access-Control-Allow-Origin', '*');
	var currentDB = 0;
	var results = false;
	var buffer = [];
	var limit = search.limit;
	var start = new Date();
	var combiner = function (references, index) {
		buffer[index] = references.filter(config.filter).slice(0, limit);

		while (buffer[currentDB]) {
			if (buffer[currentDB].length > 0) {
				p(req.query.search + ' ' + buffer[currentDB][0].source + ' ' + (new Date() - start), 1);
				if (req.query.more === "1") {
					buffer[currentDB].push({
						source: buffer[currentDB][0].source,
						type: 'more_' + req.query.search,
						more: config.more
					});
				}
				response.write(JSON.stringify(buffer[currentDB]));
				results = true;
			}
			currentDB += 1;
		}

		if (currentDB === n) {
			if (!results) {
				response.write('[]');
			}
			response.end();
		}
	};

	var i = 0;
	dbs.forEach(function (db) {
		askDB(db, search.query, combiner, i, limit);
		i += 1;
		}
	);
}

function whatSearch(q) {
	var query, requestedDBs, allowedDBs, dbs = [];
	if ( !(q.search === 'simple'   &&  !empty(q.text)) &&
	     !(q.search === 'advanced' && (!empty(q.author) || !empty(q.year) || !empty(q.title) || !empty(q.origin)))) {
		return { dbs: dbs};
	}
	allowedDBs = config[q.search + 'DBs'];
	if (q.search === 'simple') {
		if (q.pwt === '1') {
			if (isDoi(q.text)) {
				allowedDBs = ["crossref"];
			}
			if (isPmc(q.text)) {
				allowedDBs = ["pubmed"];
			}
		}
		query = q.text;
	}
	else {
		query =  {
			author:			q.author,
			year:			q.year,
			title:			q.title,
			published_in:	q.origin
		};
	}

	if (typeof q.db === 'string') {
		q.db = [q.db];
	}

	requestedDBs = allowedDBs.filter(function(d) {return typeof q.db === 'undefined' || q.db.indexOf(d) > -1;});
	dbs = requestedDBs.map(function(db){ return require('./dbs/' + db);});

	return {
		query: query,
		dbs: dbs,
		limit: q.limit || config.limit
	};
}

function what(db, query, op){
	// op: Finder | Parser
	var qt = typeof query;
	if(qt === 'string' || qt === 'object'){
		return db[qt + op];
	}
}

function askDB(db, query, combiner, index, limit){
	var finder = what(db, query, 'Finder');
	var parser = what(db, query, 'Parser');
	var requester = function (finder, query, limit, parser, combiner, index){
		var request = require('request');
		var requestURL = require('url').format(finder(query, limit));
		p(requestURL, 2);
		request(requestURL, function (err, res, body) {
			tools.areWeOK(err, res, function(body){
				combiner(parser(body), index);
			}, function () { combiner([], index); });
		});
	};

	var d = require('domain').create();
	d.on('error', function(er) {
		p('Error: ' + er, 0);
		combiner([], index);
	});

	d.run(function(){
		(db.requester || requester)(finder, query, limit, parser, combiner, index);
	});
}

function isDoi(text) {
	text = text.replace('http://dx.doi.org/', '');
	text = text.replace('doi:', '').replace('DOI:', '');
	text = text.trim();
	return text.indexOf('10.') === 0;
}
function isPmc(text) {
	text = text.trim().toLowerCase();
	text = text.replace('pmcid:', '');
	return (/pmc\s*[0-9]+/).test(text);
}

function empty(sth) {
	return typeof sth === 'undefined' || sth === "" || sth === null;
}

module.exports.__isPmc = isPmc;
module.exports.__isDoi = isDoi;