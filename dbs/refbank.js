/*jslint node: true, vars: true, white: true, devel: true*/
/*global refBankQuery: false, refBankParse: false */
"use strict";

module.exports = {
	stringFinder: refBankQuery,
	objectFinder: refBankQuery,
	stringParser: refBankParse,
	objectParser: refBankParse,
};

var tools = require('./tools');
var p = require('../debug')().p;

function refBankQuery(query, limit) {
	return {
		protocol: 'http',
		host: require('../config').refBankHost,
		pathname: '/RefBank/rbk',
		query: {
			query:  query,
			title:  query.title,
			author: query.author,
			date:   query.year,
			origin: query.published_in,
			limit:  limit,
			action: 'find',
			sco:    'sco',
		}
	};
}

function refBankParse(body) {
	var xml = body.replace(/mods:/g, '').replace(/unit="pages"/g, 'unit="page"');
	var common = [];
	var refTypes = {
		'book':				'book',
		'book chapter':		'book chapter',
		'proceedings paper':'conference paper',
		'proceedings':		'conference proceedings',
		'journal article':	'journal article',
	};

	require('xml2js').parseString(xml, function (err, result) {
		if (typeof result.refSet.ref === 'undefined') {
			return [];
		}
		var references = result.refSet.ref;
		common = tools.safeMap(references, function (r) {
			var result = {
				fullCitation:	r.refString,
				isParsed:		r.hasOwnProperty('refParsed'),
				id:				r.$.id,
				source:			'RefBank'
			};
			if (result.isParsed) {
				var path = tools.path;
				var reference = path(r, ['refParsed', 0, 'mods', 0]);
				if (typeof reference === 'undefined') {
					return {};
				}
				var authorsNames = (typeof reference.name === 'undefined' ? [] : reference.name.filter(function (name) {return path(name, ['role', 0, 'roleTerm', 0]) === 'Author'; } ));
				var authors = tools.safeMap(authorsNames, tools.modsParseAuthor, 'RefBank::Authors');
				var loc   = path(reference, ['location', 0, 'url', 0]);
				var part  = path(reference, ['relatedItem', 0, ['type', 'host'], 'part', 0]);
				var date1 = path(reference, ['relatedItem', 0,  ['type', 'host'], 'originInfo', 0, 'dateIssued', 0]);
				var date2 = path(part, ['date', 0]);
				var year  = /([0-9]{4})/.exec(date1 || date2);
				var more = {
					authors:		authors,
					doi:			(typeof loc === 'undefined' ||  loc.substring(0, 18) !== "http://dx.doi.org/" ? undefined : loc.substring(18)),
					href:			loc,
					title:			path(reference, ['titleInfo', 0, 'title', 0]),
					year:			year !== null ? year[1] : undefined,//Year, regular expression numbers only
					publishedIn:	path(reference, ['relatedItem', 0, ['type', 'host'], 'titleInfo', 0, 'title', 0]),
					volume:			path(part, ['detail', 0, ['type', 'volume'], 'number', 0]),
					issue:			undefined,
					spage:			path(part, ['extent', 0, ['unit', 'page'], 'start', 0]),
					epage:			path(part, ['extent', 0, ['unit', 'page'], 'end', 0]),
					firstauthor:	authors[0] || [],
					editors:		undefined,
					type:			refTypes[(path(reference, ['classification', 0]) || "").toLowerCase()],
				};
				var k;
				for (k in more){
					if (more.hasOwnProperty(k)) {
						result[k] = more[k];
					}
				}
			}
			return result;
		}, 'RefBank::References');
	});
	return common;
}

